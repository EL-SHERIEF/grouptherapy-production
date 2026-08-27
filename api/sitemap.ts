import { createClient } from "@supabase/supabase-js";

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

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function setSitemapXmlHeaders(res: Res): void {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600, no-transform");
  res.setHeader("Vary", "Accept-Encoding");
}

function toValidLastmod(value: unknown): string | undefined {
  const isSaneDate = (d: Date): boolean => {
    const ts = d.getTime();
    if (!Number.isFinite(ts)) return false;
    const year = d.getUTCFullYear();
    return year >= 1990 && year <= 2100;
  };

  const toIsoNoMillis = (d: Date): string => d.toISOString().replace(/\.\d{3}Z$/, "Z");

  if (value == null) return undefined;
  if (value instanceof Date) {
    return isSaneDate(value) ? toIsoNoMillis(value) : undefined;
  }
  if (typeof value === "number") {
    const d = new Date(value);
    return isSaneDate(d) ? toIsoNoMillis(d) : undefined;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    const twoDigitYmd = trimmed.match(/^(\d{2})[-/](\d{2})[-/](\d{2})$/);
    if (twoDigitYmd) {
      const yy = Number(twoDigitYmd[1]);
      const mm = Number(twoDigitYmd[2]);
      const dd = Number(twoDigitYmd[3]);
      const yyyy = yy >= 70 ? 1900 + yy : 2000 + yy;
      const d = new Date(Date.UTC(yyyy, mm - 1, dd));
      return isSaneDate(d) ? toIsoNoMillis(d) : undefined;
    }

    const d = new Date(trimmed);
    return isSaneDate(d) ? toIsoNoMillis(d) : undefined;
  }
  return undefined;
}

function sitemapIndex(urls: { loc: string; lastmod?: string }[]): string {
  const items = urls
    .map((u) => {
      const lastmod = u.lastmod ? `<lastmod>${xmlEscape(u.lastmod)}</lastmod>` : "";
      return `<sitemap><loc>${xmlEscape(u.loc)}</loc>${lastmod}</sitemap>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</sitemapindex>`;
}

function urlset(urls: { loc: string; lastmod?: string; changefreq?: string; priority?: number }[]): string {
  const items = urls
    .map((u) => {
      const lastmod = u.lastmod ? `<lastmod>${xmlEscape(u.lastmod)}</lastmod>` : "";
      const changefreq = u.changefreq ? `<changefreq>${xmlEscape(u.changefreq)}</changefreq>` : "";
      const priority = typeof u.priority === "number" ? `<priority>${u.priority.toFixed(1)}</priority>` : "";
      return `<url><loc>${xmlEscape(u.loc)}</loc>${lastmod}${changefreq}${priority}</url>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</urlset>`;
}

function urlsetWithImages(
  urls: { loc: string; lastmod?: string; images?: { loc: string; title?: string }[] }[]
): string {
  const items = urls
    .map((u) => {
      const lastmod = u.lastmod ? `<lastmod>${xmlEscape(u.lastmod)}</lastmod>` : "";
      const images = (u.images || [])
        .filter((img) => img.loc)
        .map((img) => {
          const title = img.title ? `<image:title>${xmlEscape(img.title)}</image:title>` : "";
          return `<image:image><image:loc>${xmlEscape(img.loc)}</image:loc>${title}</image:image>`;
        })
        .join("");

      return `<url><loc>${xmlEscape(u.loc)}</loc>${lastmod}${images}</url>`;
    })
    .join("");

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${items}</urlset>`
  );
}

function urlsetWithImagesAndVideos(
  urls: {
    loc: string;
    lastmod?: string;
    images?: { loc: string; title?: string }[];
    videos?: {
      thumbnailLoc?: string;
      title: string;
      description?: string;
      contentLoc?: string;
      playerLoc?: string;
    }[];
  }[]
): string {
  const items = urls
    .map((u) => {
      const lastmod = u.lastmod ? `<lastmod>${xmlEscape(u.lastmod)}</lastmod>` : "";

      const images = (u.images || [])
        .filter((img) => img.loc)
        .map((img) => {
          const title = img.title ? `<image:title>${xmlEscape(img.title)}</image:title>` : "";
          return `<image:image><image:loc>${xmlEscape(img.loc)}</image:loc>${title}</image:image>`;
        })
        .join("");

      const videos = (u.videos || [])
        .map((v) => {
          const thumb = v.thumbnailLoc ? `<video:thumbnail_loc>${xmlEscape(v.thumbnailLoc)}</video:thumbnail_loc>` : "";
          const desc = v.description ? `<video:description>${xmlEscape(v.description)}</video:description>` : "";
          const contentLoc = v.contentLoc ? `<video:content_loc>${xmlEscape(v.contentLoc)}</video:content_loc>` : "";
          const playerLoc = v.playerLoc ? `<video:player_loc>${xmlEscape(v.playerLoc)}</video:player_loc>` : "";
          return `<video:video>${thumb}<video:title>${xmlEscape(v.title)}</video:title>${desc}${contentLoc}${playerLoc}</video:video>`;
        })
        .join("");

      return `<url><loc>${xmlEscape(u.loc)}</loc>${lastmod}${images}${videos}</url>`;
    })
    .join("");

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">${items}</urlset>`
  );
}

export default async function handler(req: Req, res: Res) {
  const host = firstHeader(req.headers["x-forwarded-host"]) || firstHeader(req.headers["host"]) || "grouptherapyeg.com";
  const proto =
    firstHeader(req.headers["x-forwarded-proto"]) ||
    (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
  const baseUrl = canonicalBaseUrl(host, proto);

  const kindParam = (req.query?.kind || req.query?.type || "") as string | string[];
  const kind = (Array.isArray(kindParam) ? kindParam[0] : kindParam) || "";

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (kind === "videos") {
    if (!supabaseUrl || !supabaseAnonKey) {
      if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Reason", "missing_supabase_env");
      if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", "0");
      res.status(200);
      setSitemapXmlHeaders(res);
      res.send(urlsetWithImagesAndVideos([]));
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase
      .from("videos")
      .select("slug, created_at, title, description, thumbnail_url, video_url, youtube_id, vimeo_id")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error || !data) {
      if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Reason", error?.message ? `supabase_error:${String(error.message).slice(0, 120)}` : "no_data");
      if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", "0");
      res.status(200);
      setSitemapXmlHeaders(res);
      res.send(urlsetWithImagesAndVideos([]));
      return;
    }

    const mostRecent = data
      .map((v: any) => v.created_at)
      .filter(Boolean)
      .map((d: any) => new Date(d).getTime())
      .filter((ts: number) => Number.isFinite(ts))
      .reduce((acc: number, ts: number) => (ts > acc ? ts : acc), 0);

    const videos = data.map((v: any) => {
      const playerLoc = v.youtube_id
        ? `https://www.youtube.com/watch?v=${v.youtube_id}`
        : v.vimeo_id
          ? `https://vimeo.com/${v.vimeo_id}`
          : undefined;
      const contentLoc = v.video_url || undefined;
      return {
        thumbnailLoc: v.thumbnail_url || undefined,
        title: v.title || "Video",
        description: v.description || undefined,
        contentLoc,
        playerLoc,
      };
    });

    const images = data.reduce((acc: { loc: string; title?: string }[], v: any) => {
      if (!v?.thumbnail_url) return acc;
      acc.push({
        loc: String(v.thumbnail_url),
        title: v.title ? String(v.title) : undefined,
      });
      return acc;
    }, []);

    const urls = [
      {
        loc: `${baseUrl}/videos`,
        lastmod: mostRecent ? toValidLastmod(new Date(mostRecent)) : undefined,
        images,
        videos,
      },
    ];

    if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", String(urls.length));

    res.status(200);
    setSitemapXmlHeaders(res);
    res.send(urlsetWithImagesAndVideos(urls));
    return;
  }

  if (kind === "artists") {
    if (!supabaseUrl || !supabaseAnonKey) {
      if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Reason", "missing_supabase_env");
      if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", "0");
      res.status(200);
      setSitemapXmlHeaders(res);
      res.send(urlsetWithImages([]));
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase
      .from("artists")
      .select("slug, created_at, image_url, name")
      .order("created_at", { ascending: false });

    if (error || !data) {
      if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Reason", error?.message ? `supabase_error:${String(error.message).slice(0, 120)}` : "no_data");
      if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", "0");
      res.status(200);
      setSitemapXmlHeaders(res);
      res.send(urlsetWithImages([]));
      return;
    }

    const urls = data.map((a: any) => {
      const lastmod = a.created_at;
      return {
        loc: `${baseUrl}/artists/${a.slug}`,
        lastmod: toValidLastmod(lastmod),
        images: a.image_url ? [{ loc: a.image_url, title: a.name || undefined }] : [],
      };
    });

    if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", String(urls.length));

    res.status(200);
    setSitemapXmlHeaders(res);
    res.send(urlsetWithImages(urls));
    return;
  }

  if (kind === "events") {
    if (!supabaseUrl || !supabaseAnonKey) {
      if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Reason", "missing_supabase_env");
      if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", "0");
      res.status(200);
      setSitemapXmlHeaders(res);
      res.send(urlsetWithImages([]));
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase
      .from("events")
      .select("slug, created_at, image_url, title, date")
      .eq("published", true)
      .order("date", { ascending: false });

    if (error || !data) {
      if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Reason", error?.message ? `supabase_error:${String(error.message).slice(0, 120)}` : "no_data");
      if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", "0");
      res.status(200);
      setSitemapXmlHeaders(res);
      res.send(urlsetWithImages([]));
      return;
    }

    const urls = data.map((e: any) => {
      const lastmod = e.date || e.created_at;
      return {
        loc: `${baseUrl}/events/${e.slug}`,
        lastmod: toValidLastmod(lastmod),
        images: e.image_url ? [{ loc: e.image_url, title: e.title || undefined }] : [],
      };
    });

    if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", String(urls.length));

    res.status(200);
    setSitemapXmlHeaders(res);
    res.send(urlsetWithImages(urls));
    return;
  }

  if (kind === "posts") {
    if (!supabaseUrl || !supabaseAnonKey) {
      if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Reason", "missing_supabase_env");
      if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", "0");
      res.status(200);
      setSitemapXmlHeaders(res);
      res.send(urlsetWithImages([]));
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase
      .from("posts")
      .select("slug, published_at, created_at, cover_url, og_image_url, title")
      .eq("published", true)
      .order("published_at", { ascending: false });

    if (error || !data) {
      if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Reason", error?.message ? `supabase_error:${String(error.message).slice(0, 120)}` : "no_data");
      if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", "0");
      res.status(200);
      setSitemapXmlHeaders(res);
      res.send(urlsetWithImages([]));
      return;
    }

    const urls = data.map((p: any) => {
      const lastmod = p.published_at || p.created_at;
      const img = p.og_image_url || p.cover_url;
      return {
        loc: `${baseUrl}/news/${p.slug}`,
        lastmod: toValidLastmod(lastmod),
        images: img ? [{ loc: img, title: p.title || undefined }] : [],
      };
    });

    if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", String(urls.length));

    res.status(200);
    setSitemapXmlHeaders(res);
    res.send(urlsetWithImages(urls));
    return;
  }

  if (kind === "releases") {
    if (!supabaseUrl || !supabaseAnonKey) {
      if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Reason", "missing_supabase_env");
      if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", "0");
      res.status(200);
      setSitemapXmlHeaders(res);
      res.send(urlsetWithImages([]));
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase
      .from("releases")
      .select("slug, created_at, cover_url, title, release_date")
      .eq("published", true)
      .order("release_date", { ascending: false });

    if (error || !data) {
      if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Reason", error?.message ? `supabase_error:${String(error.message).slice(0, 120)}` : "no_data");
      if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", "0");
      res.status(200);
      setSitemapXmlHeaders(res);
      res.send(urlsetWithImages([]));
      return;
    }

    const urls = data.map((r: any) => {
      const lastmod = r.release_date || r.created_at;
      return {
        loc: `${baseUrl}/releases/${r.slug}`,
        lastmod: toValidLastmod(lastmod),
        images: r.cover_url ? [{ loc: r.cover_url, title: r.title || undefined }] : [],
      };
    });

    if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", String(urls.length));

    res.status(200);
    setSitemapXmlHeaders(res);
    res.send(urlsetWithImages(urls));
    return;
  }

  if (kind === "pages") {
    const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

    const urls: { loc: string; lastmod?: string; changefreq?: string; priority?: number }[] = [
      { loc: `${baseUrl}/`, changefreq: "daily", priority: 1.0, lastmod: now },
      { loc: `${baseUrl}/radio`, changefreq: "weekly", priority: 0.7, lastmod: now },
      { loc: `${baseUrl}/releases`, changefreq: "daily", priority: 0.9, lastmod: now },
      { loc: `${baseUrl}/events`, changefreq: "daily", priority: 0.9, lastmod: now },
      { loc: `${baseUrl}/artists`, changefreq: "weekly", priority: 0.8, lastmod: now },
      { loc: `${baseUrl}/videos`, changefreq: "weekly", priority: 0.8, lastmod: now },
      { loc: `${baseUrl}/playlists`, changefreq: "weekly", priority: 0.6, lastmod: now },
      { loc: `${baseUrl}/awards`, changefreq: "weekly", priority: 0.6, lastmod: now },
      { loc: `${baseUrl}/about`, changefreq: "yearly", priority: 0.5, lastmod: now },
      { loc: `${baseUrl}/contact`, changefreq: "yearly", priority: 0.5, lastmod: now },
      { loc: `${baseUrl}/promote-your-release`, changefreq: "yearly", priority: 0.5, lastmod: now },
      { loc: `${baseUrl}/promote-your-event`, changefreq: "yearly", priority: 0.5, lastmod: now },
      { loc: `${baseUrl}/news`, changefreq: "daily", priority: 0.8, lastmod: now },
      { loc: `${baseUrl}/press`, changefreq: "yearly", priority: 0.4, lastmod: now },
      { loc: `${baseUrl}/careers`, changefreq: "weekly", priority: 0.5, lastmod: now },
      { loc: `${baseUrl}/tours`, changefreq: "weekly", priority: 0.5, lastmod: now },
      { loc: `${baseUrl}/terms`, changefreq: "yearly", priority: 0.2, lastmod: now },
      { loc: `${baseUrl}/privacy`, changefreq: "yearly", priority: 0.2, lastmod: now },
      { loc: `${baseUrl}/cookies`, changefreq: "yearly", priority: 0.2, lastmod: now },
    ];

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data } = await supabase
        .from("static_pages")
        .select("slug, updated_at, created_at")
        .eq("published", true)
        .order("updated_at", { ascending: false });

      if (Array.isArray(data)) {
        data.forEach((p: any) => {
          const slug = typeof p.slug === "string" ? p.slug : "";
          if (!slug) return;
          if (["terms", "privacy", "cookies"].includes(slug)) return;
          const lastmodRaw = p.updated_at || p.created_at;
          const lastmod = toValidLastmod(lastmodRaw);
          urls.push({ loc: `${baseUrl}/${slug}`, changefreq: "yearly", priority: 0.3, lastmod });
        });
      }
    }

    const xml = urlset(urls);

    if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", String(urls.length));

    res.status(200);
    setSitemapXmlHeaders(res);
    res.send(xml);
    return;
  }

  const xml = sitemapIndex([
    { loc: `${baseUrl}/sitemap-pages.xml` },
    { loc: `${baseUrl}/sitemap-posts.xml` },
    { loc: `${baseUrl}/sitemap-releases.xml` },
    { loc: `${baseUrl}/sitemap-events.xml` },
    { loc: `${baseUrl}/sitemap-artists.xml` },
    { loc: `${baseUrl}/sitemap-videos.xml` },
  ]);

  if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", "6");

  res.status(200);
  setSitemapXmlHeaders(res);
  res.send(xml);
}
