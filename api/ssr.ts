import { createClient } from "@supabase/supabase-js";

import { computeSeo, normalizeSeoSettings, parseSeoRoute } from "../shared/seo.js";

type Req = {
  headers: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
};

type Res = {
  status: (code: number) => Res;
  setHeader: (name: string, value: string) => void;
  send: (body: string) => void;
};

function firstHeader(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeJsonForScriptTag(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function canonicalBaseUrl(reqHost: string, reqProto: string): string {
  const envBase =
    process.env.VITE_SITE_URL ||
    process.env.SITE_URL ||
    process.env.PUBLIC_SITE_URL;
  const raw = (envBase && envBase.trim().length ? envBase.trim() : `${reqProto}://${reqHost}`).replace(/\/$/, "");
  try {
    const u = new URL(raw);
    const host = u.host.toLowerCase();
    if (host === "grouptherapyeg.com") u.host = "www.grouptherapyeg.com";
    if (u.protocol === "http:" && !u.hostname.includes("localhost") && !u.hostname.includes("127.0.0.1")) {
      u.protocol = "https:";
    }
    return u.toString().replace(/\/$/, "");
  } catch {
    return raw;
  }
}

function stripSeo(html: string): string {
  html = html.replace(/<title[^>]*>[\s\S]*?<\/title>/gi, "");

  html = html.replace(
    /<meta\s+[^>]*(?:name|property|itemprop)=(?:\"|')?(?:title|description|keywords|robots|twitter:[^\"'>\s]+|og:[^\"'>\s]+|name|image)(?:\"|')?[^>]*>/gi,
    ""
  );

  html = html.replace(/<link\s+[^>]*rel=(?:\"|')canonical(?:\"|')[^>]*>/gi, "");

  html = html.replace(/<script[^>]*id=(?:\"|')structured-data(?:\"|')[^>]*>[\s\S]*?<\/script>/gi, "");

  return html;
}

function buildSeoBlock(args: {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  ogUrl: string;
  ogType: string;
  siteName: string;
  ogImage: string;
  ogLogo: string;
  twitterImage: string;
  twitterHandle?: string;
  structuredData?: object;
  robots?: string;
  extraMeta?: string;
}): string {
  const {
    title,
    description,
    keywords,
    canonical,
    ogUrl,
    ogType,
    siteName,
    ogImage,
    ogLogo,
    twitterImage,
    twitterHandle,
    structuredData,
    robots,
    extraMeta,
  } = args;

  const sd = structuredData ? safeJsonForScriptTag(structuredData) : "";

  return `<title>${escapeHtml(title)}</title>
<meta name="title" content="${escapeHtml(title)}" />
<meta name="description" content="${escapeHtml(description)}" />
<meta name="keywords" content="${escapeHtml(keywords)}" />
<meta itemprop="name" content="${escapeHtml(title)}" />
<meta itemprop="description" content="${escapeHtml(description)}" />
<meta itemprop="image" content="${escapeHtml(ogImage)}" />
${robots ? `<meta name="robots" content="${escapeHtml(robots)}" />` : ""}
<meta property="og:type" content="${escapeHtml(ogType)}" />
<meta property="og:site_name" content="${escapeHtml(siteName)}" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:image" content="${escapeHtml(ogImage)}" />
<meta property="og:logo" content="${escapeHtml(ogLogo)}" />
<meta property="og:url" content="${escapeHtml(ogUrl)}" />
${extraMeta ? extraMeta : ""}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(twitterImage)}" />
${twitterHandle ? `<meta name="twitter:site" content="${escapeHtml(twitterHandle)}" />` : ""}
<link rel="canonical" href="${escapeHtml(canonical)}" />
${structuredData ? `<script id="structured-data" type="application/ld+json">${sd}</script>` : ""}`;
}

function buildExtraMeta(extraMetaTags: Array<{ attr: string; key: string; content: string }>): string {
  return extraMetaTags
    .map((t) => `\n<meta ${escapeHtml(String(t.attr))}="${escapeHtml(String(t.key))}" content="${escapeHtml(String(t.content))}" />`)
    .join("");
}

export default async function handler(req: Req, res: Res) {
  try {
    const host =
      firstHeader(req.headers["x-forwarded-host"]) ||
      firstHeader(req.headers["host"]) ||
      "localhost";
    const proto =
      firstHeader(req.headers["x-forwarded-proto"]) ||
      (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");

    const pathParam = (req.query?.path || "") as string | string[];
    const rawPath = Array.isArray(pathParam) ? pathParam[0] || "" : pathParam;
    const pathname = rawPath ? `/${rawPath.replace(/^\/+/, "")}` : "/";

    const baseUrl = canonicalBaseUrl(host, proto);
    const canonical = `${baseUrl}${pathname}`;

    const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");

    let template = "";
    const templateResp = await fetch(`${baseUrl}/__ssr-template`, {
      headers: { "user-agent": "ssr-seo-bot" },
    });

    if (templateResp.ok) {
      template = await templateResp.text();
    } else if (host.includes("localhost") || host.includes("127.0.0.1")) {
      const fallbackResp = await fetch(`${baseUrl}/index.html`, {
        headers: { "user-agent": "ssr-seo-bot" },
      });
      if (!fallbackResp.ok) throw new Error(`Failed to load template (status ${fallbackResp.status})`);
      template = await fallbackResp.text();
    } else {
      throw new Error(`Failed to load template (status ${templateResp.status})`);
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      const computed = computeSeo({
        pathname,
        baseUrl,
        noindex: isAdminPath,
        settings: null,
      });

      const seoBlock = buildSeoBlock({
        title: computed.title,
        description: computed.description,
        keywords: computed.keywords.join(", "),
        canonical: computed.canonical || canonical,
        ogUrl: computed.canonical || canonical,
        ogType: computed.ogType,
        siteName: computed.siteName,
        ogImage: computed.ogImage,
        ogLogo: computed.ogLogo,
        twitterImage: computed.twitterImage,
        twitterHandle: computed.twitterHandle,
        structuredData: computed.structuredData,
        robots: computed.robots,
        extraMeta: buildExtraMeta(computed.extraMetaTags),
      });

      const cleaned = stripSeo(template);
      const withSeo = cleaned.replace(/<head(\s[^>]*)?>/i, (m) => `${m}\n${seoBlock}\n`);

      res.status(200);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300");
      res.setHeader("X-Robots-Tag", computed.robots);
      res.send(withSeo);
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const route = parseSeoRoute(pathname);

    const [{ data: settingsData }, routeData] = await Promise.all([
      supabase.from("seo_settings").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      (async () => {
        if (route.kind === "post") {
          const { data } = await supabase
            .from("posts")
            .select(
              "title, meta_title, meta_description, excerpt, content, cover_url, og_image_url, tags, category, author_name, published_at, created_at"
            )
            .eq("slug", route.slug)
            .eq("published", true)
            .limit(1)
            .maybeSingle();

          if (!data) return { post: null };

          return {
            post: {
              title: String(data.title),
              metaTitle: data.meta_title ? String(data.meta_title) : undefined,
              metaDescription: data.meta_description ? String(data.meta_description) : undefined,
              excerpt: data.excerpt ? String(data.excerpt) : undefined,
              content: data.content ? String(data.content) : undefined,
              coverUrl: data.cover_url ? String(data.cover_url) : undefined,
              ogImageUrl: data.og_image_url ? String(data.og_image_url) : undefined,
              tags: Array.isArray(data.tags) ? (data.tags as any[]).filter((t) => typeof t === "string") : undefined,
              category: data.category ? String(data.category) : undefined,
              authorName: data.author_name ? String(data.author_name) : undefined,
              publishedAt: data.published_at ? String(data.published_at) : undefined,
              createdAt: data.created_at ? String(data.created_at) : undefined,
            },
          };
        }

        if (route.kind === "release") {
          const { data } = await supabase
            .from("releases")
            .select("title, artist_name, type, release_date, cover_url, genres, created_at")
            .eq("slug", route.slug)
            .eq("published", true)
            .limit(1)
            .maybeSingle();

          if (!data) return { release: null };

          return {
            release: {
              title: String(data.title),
              artistName: String(data.artist_name),
              type: data.type ? String(data.type) : undefined,
              releaseDate: data.release_date ? String(data.release_date) : undefined,
              coverUrl: data.cover_url ? String(data.cover_url) : undefined,
              genres: Array.isArray(data.genres) ? (data.genres as any[]).filter((g) => typeof g === "string") : undefined,
              createdAt: data.created_at ? String(data.created_at) : undefined,
            },
          };
        }

        if (route.kind === "event") {
          const { data } = await supabase
            .from("events")
            .select("title, description, venue, address, city, country, date, end_date, image_url, created_at")
            .eq("slug", route.slug)
            .eq("published", true)
            .limit(1)
            .maybeSingle();

          if (!data) return { event: null };

          return {
            event: {
              title: String(data.title),
              description: data.description ? String(data.description) : undefined,
              venue: data.venue ? String(data.venue) : undefined,
              address: data.address ? String(data.address) : undefined,
              city: data.city ? String(data.city) : undefined,
              country: data.country ? String(data.country) : undefined,
              date: data.date ? String(data.date) : undefined,
              endDate: data.end_date ? String(data.end_date) : undefined,
              imageUrl: data.image_url ? String(data.image_url) : undefined,
              createdAt: data.created_at ? String(data.created_at) : undefined,
            },
          };
        }

        if (route.kind === "artist") {
          const { data } = await supabase
            .from("artists")
            .select("name, bio, image_url, created_at")
            .eq("slug", route.slug)
            .limit(1)
            .maybeSingle();

          if (!data) return { artist: null };

          return {
            artist: {
              name: String(data.name),
              bio: data.bio ? String(data.bio) : undefined,
              imageUrl: data.image_url ? String(data.image_url) : undefined,
              createdAt: data.created_at ? String(data.created_at) : undefined,
            },
          };
        }

        if (route.kind === "static" || route.kind === "section") {
          const { data } = await supabase
            .from("static_pages")
            .select("title, meta_title, meta_description, content, updated_at, created_at")
            .eq("slug", route.slug)
            .eq("published", true)
            .limit(1)
            .maybeSingle();

          if (!data) return { staticPage: null };

          return {
            staticPage: {
              title: data.title ? String(data.title) : undefined,
              metaTitle: data.meta_title ? String(data.meta_title) : undefined,
              metaDescription: data.meta_description ? String(data.meta_description) : undefined,
              content: data.content ? String(data.content) : undefined,
              updatedAt: data.updated_at ? String(data.updated_at) : undefined,
              createdAt: data.created_at ? String(data.created_at) : undefined,
            },
          };
        }

        return {};
      })(),
    ]);

    const settings = normalizeSeoSettings(settingsData);

    const computed = computeSeo({
      pathname,
      baseUrl,
      noindex: isAdminPath,
      settings,
      content: {
        post: (routeData as any).post,
        release: (routeData as any).release,
        event: (routeData as any).event,
        artist: (routeData as any).artist,
        staticPage: (routeData as any).staticPage,
      },
    });

    const seoBlock = buildSeoBlock({
      title: computed.title,
      description: computed.description,
      keywords: computed.keywords.join(", "),
      canonical: computed.canonical || canonical,
      ogUrl: computed.canonical || canonical,
      ogType: computed.ogType,
      siteName: computed.siteName,
      ogImage: computed.ogImage,
      ogLogo: computed.ogLogo,
      twitterImage: computed.twitterImage,
      twitterHandle: computed.twitterHandle,
      structuredData: computed.structuredData,
      robots: computed.robots,
      extraMeta: buildExtraMeta(computed.extraMetaTags),
    });

    const cleaned = stripSeo(template);
    const withSeo = cleaned.replace(
      /<head(\s[^>]*)?>/i,
      (m) => `${m}\n${seoBlock}\n${computed.headScripts ? `${computed.headScripts}\n` : ""}`
    );

    const withSeoAndBody = computed.bodyScripts
      ? withSeo.replace(/<body(\s[^>]*)?>/i, (m) => `${m}\n${computed.bodyScripts}\n`)
      : withSeo;

    res.status(200);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60");
    res.setHeader("X-Robots-Tag", computed.robots);
    res.send(withSeoAndBody);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    res.status(200);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60");
    res.setHeader("X-Robots-Tag", "index, follow");
    res.send(`<!doctype html><html><head><title>GroupTherapy</title><meta name="description" content="GroupTherapy" /></head><body><div id="root"></div></body></html>`);
  }
}
