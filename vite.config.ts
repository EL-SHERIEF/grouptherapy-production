import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import type { ServerResponse } from "http";
import fs from "fs/promises";
import { createClient } from "@supabase/supabase-js";

import { computeSeo, normalizeSeoSettings } from "./shared/seo";

import sitemapHandler from "./api/sitemap";
import robotsHandler from "./api/robots";
import seoHandler from "./api/seo";
import newsletterSenderProfilesHandler from "./api/newsletter-sender-profiles";
import newsletterSendHandler from "./api/newsletter-send";
import newsletterUnsubscribeHandler from "./api/newsletter-unsubscribe";
import cloudinarySignedUrlHandler from "./api/cloudinary-signed-url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

function buildExtraMeta(extraMetaTags: Array<{ attr: string; key: string; content: string }>): string {
  return extraMetaTags
    .map(
      (t) =>
        `\n<meta ${escapeHtml(String(t.attr))}="${escapeHtml(String(t.key))}" content="${escapeHtml(String(t.content))}" />`
    )
    .join("");
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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname), "");
  for (const [k, v] of Object.entries(env)) {
    if (typeof v === "string") process.env[k] = v;
  }

  return {
    plugins: [
      react(),
      {
        name: "local-seo-endpoints",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            try {
              const url = req.url || "/";
              const parsed = new URL(url, "http://local");
              const pathname = parsed.pathname;

              const routes: Record<string, any> = {
                "/sitemap.xml": sitemapHandler,
                "/sitemap-pages.xml": (r: any, s: any) => sitemapHandler({ ...r, query: { ...(r.query || {}), kind: "pages" } }, s),
                "/sitemap-posts.xml": (r: any, s: any) => sitemapHandler({ ...r, query: { ...(r.query || {}), kind: "posts" } }, s),
                "/sitemap-releases.xml": (r: any, s: any) => sitemapHandler({ ...r, query: { ...(r.query || {}), kind: "releases" } }, s),
                "/sitemap-events.xml": (r: any, s: any) => sitemapHandler({ ...r, query: { ...(r.query || {}), kind: "events" } }, s),
                "/sitemap-artists.xml": (r: any, s: any) => sitemapHandler({ ...r, query: { ...(r.query || {}), kind: "artists" } }, s),
                "/sitemap-videos.xml": (r: any, s: any) => sitemapHandler({ ...r, query: { ...(r.query || {}), kind: "videos" } }, s),
                "/robots.txt": robotsHandler,

                "/api/sitemap": sitemapHandler,
                "/api/sitemap-pages": (r: any, s: any) => sitemapHandler({ ...r, query: { ...(r.query || {}), kind: "pages" } }, s),
                "/api/sitemap-posts": (r: any, s: any) => sitemapHandler({ ...r, query: { ...(r.query || {}), kind: "posts" } }, s),
                "/api/sitemap-releases": (r: any, s: any) => sitemapHandler({ ...r, query: { ...(r.query || {}), kind: "releases" } }, s),
                "/api/sitemap-events": (r: any, s: any) => sitemapHandler({ ...r, query: { ...(r.query || {}), kind: "events" } }, s),
                "/api/sitemap-artists": (r: any, s: any) => sitemapHandler({ ...r, query: { ...(r.query || {}), kind: "artists" } }, s),
                "/api/sitemap-videos": (r: any, s: any) => sitemapHandler({ ...r, query: { ...(r.query || {}), kind: "videos" } }, s),
                "/api/robots": robotsHandler,
                "/api/seo": seoHandler,
                "/api/cloudinary-signed-url": cloudinarySignedUrlHandler,
                "/api/newsletter-sender-profiles": newsletterSenderProfilesHandler,
                "/api/newsletter-send": newsletterSendHandler,
                "/api/newsletter-unsubscribe": newsletterUnsubscribeHandler,
              };

              const handler = routes[pathname];
              if (!handler) return next();

              const headers: Record<string, string | string[] | undefined> = {};
              for (const [k, v] of Object.entries(req.headers || {})) {
                headers[k] = v as any;
              }

              const nodeRes = res as ServerResponse;
              const wrappedRes = {
                status(code: number) {
                  nodeRes.statusCode = code;
                  return wrappedRes;
                },
                setHeader(name: string, value: string) {
                  nodeRes.setHeader(name, value);
                },
                send(body: string) {
                  nodeRes.end(body);
                },
              };

              const query: Record<string, string | string[] | undefined> = {};
              parsed.searchParams.forEach((value, key) => {
                const existing = query[key];
                if (existing === undefined) query[key] = value;
                else if (Array.isArray(existing)) existing.push(value);
                else query[key] = [existing, value];
              });

              const method = (req.method || "GET").toUpperCase();
              const body = await new Promise<string>((resolve) => {
                if (method === "GET" || method === "HEAD") return resolve("");
                let acc = "";
                req.on("data", (chunk) => {
                  acc += chunk;
                });
                req.on("end", () => resolve(acc));
                req.on("error", () => resolve(""));
              });

              await handler(
                {
                  method,
                  headers,
                  query,
                  body,
                },
                wrappedRes
              );
            } catch (e) {
              next(e);
            }
          });
        },
      },
      {
        name: "bake-seo-index-html",
        apply: "build",
        async closeBundle() {
          try {
            const baseUrl =
              process.env.VITE_SITE_URL ||
              process.env.SITE_URL ||
              process.env.PUBLIC_SITE_URL ||
              "https://www.grouptherapyeg.com";

            const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
            const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

            const cacheFile = path.resolve(__dirname, ".seo-settings-cache.json");

            let settingsData: any = null;

            if (supabaseUrl && supabaseAnonKey) {
              try {
                const supabase = createClient(supabaseUrl, supabaseAnonKey);
                const { data } = await supabase
                  .from("seo_settings")
                  .select("*")
                  .order("updated_at", { ascending: false })
                  .limit(1)
                  .maybeSingle();
                settingsData = data ?? null;

                if (settingsData) {
                  await fs.writeFile(
                    cacheFile,
                    JSON.stringify(
                      {
                        cachedAt: new Date().toISOString(),
                        settingsData,
                      },
                      null,
                      2
                    ),
                    "utf-8"
                  );
                }
              } catch {
                settingsData = null;
              }
            }

            if (!settingsData) {
              try {
                const cachedRaw = await fs.readFile(cacheFile, "utf-8");
                const cached = JSON.parse(cachedRaw);
                if (cached && typeof cached === "object") {
                  settingsData = (cached as any).settingsData ?? null;
                }
              } catch {
                settingsData = null;
              }
            }

            const settings = normalizeSeoSettings(settingsData);
            const computed = computeSeo({
              pathname: "/",
              baseUrl,
              noindex: false,
              settings,
            });

            const outFile = path.resolve(__dirname, "dist/public/index.html");
            const html = await fs.readFile(outFile, "utf-8");
            if (!html.trim()) {
              console.warn("bake-seo-index-html: dist/public/index.html is empty; skipping SEO bake");
              return;
            }
            if (!/<html/i.test(html) || !/<head/i.test(html) || !/<body/i.test(html)) {
              console.warn("bake-seo-index-html: dist/public/index.html missing html/head/body; skipping SEO bake");
              return;
            }
            const cleaned = stripSeo(html);

            const canonical = computed.canonical || `${baseUrl}/`;

            const seoBlock = buildSeoBlock({
              title: computed.title,
              description: computed.description,
              keywords: computed.keywords.join(", "),
              canonical,
              ogUrl: canonical,
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

            const headInjection = `${seoBlock}\n${computed.headScripts ? `${computed.headScripts}\n` : ""}`;

            let withSeo = cleaned;
            if (/<head(\s[^>]*)?>/i.test(withSeo)) {
              withSeo = withSeo.replace(/<head(\s[^>]*)?>/i, (m) => `${m}\n${headInjection}`);
            } else if (/<\/head>/i.test(withSeo)) {
              withSeo = withSeo.replace(/<\/head>/i, `${headInjection}</head>`);
            }

            let withSeoAndBody = withSeo;
            if (computed.bodyScripts) {
              if (/<body(\s[^>]*)?>/i.test(withSeoAndBody)) {
                withSeoAndBody = withSeoAndBody.replace(/<body(\s[^>]*)?>/i, (m) => `${m}\n${computed.bodyScripts}\n`);
              } else if (/<\/body>/i.test(withSeoAndBody)) {
                withSeoAndBody = withSeoAndBody.replace(/<\/body>/i, `${computed.bodyScripts}\n</body>`);
              }
            }

            if (!withSeoAndBody.trim()) {
              console.warn("bake-seo-index-html: computed HTML became empty; skipping write");
              return;
            }

            if (withSeoAndBody.trim().length < 200) {
              console.warn("bake-seo-index-html: computed HTML too small; skipping write");
              return;
            }

            if (!/<html/i.test(withSeoAndBody) || !/<head/i.test(withSeoAndBody) || !/<body/i.test(withSeoAndBody)) {
              console.warn("bake-seo-index-html: computed HTML missing html/head/body; skipping write");
              return;
            }

            await fs.writeFile(outFile, withSeoAndBody, "utf-8");
          } catch (e) {
            console.warn("bake-seo-index-html failed", e);
          }
        },
      },
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
    },
    root: path.resolve(__dirname, "client"),
    envDir: path.resolve(__dirname),
    envPrefix: "VITE_",
    build: {
      outDir: path.resolve(__dirname, "dist/public"),
      emptyOutDir: true,
      sourcemap: true,
    },
    server: {
      host: "0.0.0.0",
      port: 5000,
      allowedHosts: true,
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});