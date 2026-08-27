// vite.config.ts
import { defineConfig, loadEnv } from "file:///C:/Users/DEVJACK/Downloads/v3/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/DEVJACK/Downloads/v3/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
import { fileURLToPath } from "url";

// api/sitemap.ts
function firstHeader(value) {
  if (!value) return void 0;
  return Array.isArray(value) ? value[0] : value;
}
function xmlEscape(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&apos;");
}
function sitemapIndex(urls) {
  const items = urls.map((u) => {
    const lastmod = u.lastmod ? `<lastmod>${xmlEscape(u.lastmod)}</lastmod>` : "";
    return `<sitemap><loc>${xmlEscape(u.loc)}</loc>${lastmod}</sitemap>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</sitemapindex>`;
}
async function handler(req, res) {
  const host = firstHeader(req.headers["x-forwarded-host"]) || firstHeader(req.headers["host"]) || "grouptherapyeg.com";
  const proto = firstHeader(req.headers["x-forwarded-proto"]) || (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
  const baseUrl = `${proto}://${host}`;
  const xml = sitemapIndex([
    { loc: `${baseUrl}/sitemap-pages.xml` },
    { loc: `${baseUrl}/sitemap-posts.xml` },
    { loc: `${baseUrl}/sitemap-releases.xml` },
    { loc: `${baseUrl}/sitemap-events.xml` },
    { loc: `${baseUrl}/sitemap-artists.xml` },
    { loc: `${baseUrl}/sitemap-videos.xml` }
  ]);
  if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", "6");
  res.status(200);
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
  res.send(xml);
}

// api/sitemap-artists.ts
import { createClient } from "file:///C:/Users/DEVJACK/Downloads/v3/node_modules/@supabase/supabase-js/dist/main/index.js";
function firstHeader2(value) {
  if (!value) return void 0;
  return Array.isArray(value) ? value[0] : value;
}
function xmlEscape2(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&apos;");
}
function urlsetWithImages(urls) {
  const items = urls.map((u) => {
    const lastmod = u.lastmod ? `<lastmod>${xmlEscape2(u.lastmod)}</lastmod>` : "";
    const images = (u.images || []).filter((img) => img.loc).map((img) => {
      const title = img.title ? `<image:title>${xmlEscape2(img.title)}</image:title>` : "";
      return `<image:image><image:loc>${xmlEscape2(img.loc)}</image:loc>${title}</image:image>`;
    }).join("");
    return `<url><loc>${xmlEscape2(u.loc)}</loc>${lastmod}${images}</url>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${items}</urlset>`;
}
async function handler2(req, res) {
  const host = firstHeader2(req.headers["x-forwarded-host"]) || firstHeader2(req.headers["host"]) || "grouptherapyeg.com";
  const proto = firstHeader2(req.headers["x-forwarded-proto"]) || (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
  const baseUrl = `${proto}://${host}`;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Reason", "missing_supabase_env");
    if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", "0");
    res.status(200);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
    res.send(urlsetWithImages([]));
    return;
  }
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.from("artists").select("slug, created_at, image_url, name").order("created_at", { ascending: false });
  if (error || !data) {
    if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Reason", error?.message ? `supabase_error:${String(error.message).slice(0, 120)}` : "no_data");
    if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", "0");
    res.status(200);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
    res.send(urlsetWithImages([]));
    return;
  }
  const urls = data.map((a) => {
    const lastmod = a.created_at;
    return {
      loc: `${baseUrl}/artists/${a.slug}`,
      lastmod: lastmod ? new Date(lastmod).toISOString() : void 0,
      images: a.image_url ? [{ loc: a.image_url, title: a.name || void 0 }] : []
    };
  });
  if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", String(urls.length));
  res.status(200);
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
  res.send(urlsetWithImages(urls));
}

// api/sitemap-events.ts
import { createClient as createClient2 } from "file:///C:/Users/DEVJACK/Downloads/v3/node_modules/@supabase/supabase-js/dist/main/index.js";
function firstHeader3(value) {
  if (!value) return void 0;
  return Array.isArray(value) ? value[0] : value;
}
function xmlEscape3(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&apos;");
}
function urlsetWithImages2(urls) {
  const items = urls.map((u) => {
    const lastmod = u.lastmod ? `<lastmod>${xmlEscape3(u.lastmod)}</lastmod>` : "";
    const images = (u.images || []).filter((img) => img.loc).map((img) => {
      const title = img.title ? `<image:title>${xmlEscape3(img.title)}</image:title>` : "";
      return `<image:image><image:loc>${xmlEscape3(img.loc)}</image:loc>${title}</image:image>`;
    }).join("");
    return `<url><loc>${xmlEscape3(u.loc)}</loc>${lastmod}${images}</url>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${items}</urlset>`;
}
async function handler3(req, res) {
  const host = firstHeader3(req.headers["x-forwarded-host"]) || firstHeader3(req.headers["host"]) || "grouptherapyeg.com";
  const proto = firstHeader3(req.headers["x-forwarded-proto"]) || (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
  const baseUrl = `${proto}://${host}`;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Reason", "missing_supabase_env");
    if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", "0");
    res.status(200);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
    res.send(urlsetWithImages2([]));
    return;
  }
  const supabase = createClient2(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.from("events").select("slug, created_at, image_url, title, date").eq("published", true).order("date", { ascending: false });
  if (error || !data) {
    if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Reason", error?.message ? `supabase_error:${String(error.message).slice(0, 120)}` : "no_data");
    if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", "0");
    res.status(200);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
    res.send(urlsetWithImages2([]));
    return;
  }
  const urls = data.map((e) => {
    const lastmod = e.date || e.created_at;
    return {
      loc: `${baseUrl}/events/${e.slug}`,
      lastmod: lastmod ? new Date(lastmod).toISOString() : void 0,
      images: e.image_url ? [{ loc: e.image_url, title: e.title || void 0 }] : []
    };
  });
  if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", String(urls.length));
  res.status(200);
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
  res.send(urlsetWithImages2(urls));
}

// api/sitemap-pages.ts
import { createClient as createClient3 } from "file:///C:/Users/DEVJACK/Downloads/v3/node_modules/@supabase/supabase-js/dist/main/index.js";
function firstHeader4(value) {
  if (!value) return void 0;
  return Array.isArray(value) ? value[0] : value;
}
function xmlEscape4(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&apos;");
}
function urlset(urls) {
  const items = urls.map((u) => {
    const lastmod = u.lastmod ? `<lastmod>${xmlEscape4(u.lastmod)}</lastmod>` : "";
    const changefreq = u.changefreq ? `<changefreq>${xmlEscape4(u.changefreq)}</changefreq>` : "";
    const priority = typeof u.priority === "number" ? `<priority>${u.priority.toFixed(1)}</priority>` : "";
    return `<url><loc>${xmlEscape4(u.loc)}</loc>${lastmod}${changefreq}${priority}</url>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</urlset>`;
}
async function handler4(req, res) {
  const host = firstHeader4(req.headers["x-forwarded-host"]) || firstHeader4(req.headers["host"]) || "grouptherapyeg.com";
  const proto = firstHeader4(req.headers["x-forwarded-proto"]) || (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
  const baseUrl = `${proto}://${host}`;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const urls = [
    { loc: `${baseUrl}/`, changefreq: "daily", priority: 1, lastmod: now },
    { loc: `${baseUrl}/radio`, changefreq: "weekly", priority: 0.7, lastmod: now },
    { loc: `${baseUrl}/releases`, changefreq: "daily", priority: 0.9, lastmod: now },
    { loc: `${baseUrl}/events`, changefreq: "daily", priority: 0.9, lastmod: now },
    { loc: `${baseUrl}/artists`, changefreq: "weekly", priority: 0.8, lastmod: now },
    { loc: `${baseUrl}/videos`, changefreq: "weekly", priority: 0.8, lastmod: now },
    { loc: `${baseUrl}/playlists`, changefreq: "weekly", priority: 0.6, lastmod: now },
    { loc: `${baseUrl}/awards`, changefreq: "weekly", priority: 0.6, lastmod: now },
    { loc: `${baseUrl}/about`, changefreq: "yearly", priority: 0.5, lastmod: now },
    { loc: `${baseUrl}/contact`, changefreq: "yearly", priority: 0.5, lastmod: now },
    { loc: `${baseUrl}/news`, changefreq: "daily", priority: 0.8, lastmod: now },
    { loc: `${baseUrl}/press`, changefreq: "yearly", priority: 0.4, lastmod: now },
    { loc: `${baseUrl}/careers`, changefreq: "weekly", priority: 0.5, lastmod: now },
    { loc: `${baseUrl}/tours`, changefreq: "weekly", priority: 0.5, lastmod: now },
    { loc: `${baseUrl}/terms`, changefreq: "yearly", priority: 0.2, lastmod: now },
    { loc: `${baseUrl}/privacy`, changefreq: "yearly", priority: 0.2, lastmod: now },
    { loc: `${baseUrl}/cookies`, changefreq: "yearly", priority: 0.2, lastmod: now }
  ];
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createClient3(supabaseUrl, supabaseAnonKey);
    const { data } = await supabase.from("static_pages").select("slug, updated_at, created_at").eq("published", true).order("updated_at", { ascending: false });
    if (Array.isArray(data)) {
      data.forEach((p) => {
        const slug = typeof p.slug === "string" ? p.slug : "";
        if (!slug) return;
        if (["terms", "privacy", "cookies"].includes(slug)) return;
        const lastmodRaw = p.updated_at || p.created_at;
        const lastmod = lastmodRaw ? new Date(lastmodRaw).toISOString() : void 0;
        urls.push({ loc: `${baseUrl}/${slug}`, changefreq: "yearly", priority: 0.3, lastmod });
      });
    }
  }
  const xml = urlset(urls);
  if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", String(urls.length));
  res.status(200);
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
  res.send(xml);
}

// api/sitemap-posts.ts
import { createClient as createClient4 } from "file:///C:/Users/DEVJACK/Downloads/v3/node_modules/@supabase/supabase-js/dist/main/index.js";
function firstHeader5(value) {
  if (!value) return void 0;
  return Array.isArray(value) ? value[0] : value;
}
function xmlEscape5(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&apos;");
}
function urlsetWithImages3(urls) {
  const items = urls.map((u) => {
    const lastmod = u.lastmod ? `<lastmod>${xmlEscape5(u.lastmod)}</lastmod>` : "";
    const images = (u.images || []).filter((img) => img.loc).map((img) => {
      const title = img.title ? `<image:title>${xmlEscape5(img.title)}</image:title>` : "";
      return `<image:image><image:loc>${xmlEscape5(img.loc)}</image:loc>${title}</image:image>`;
    }).join("");
    return `<url><loc>${xmlEscape5(u.loc)}</loc>${lastmod}${images}</url>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${items}</urlset>`;
}
async function handler5(req, res) {
  const host = firstHeader5(req.headers["x-forwarded-host"]) || firstHeader5(req.headers["host"]) || "grouptherapyeg.com";
  const proto = firstHeader5(req.headers["x-forwarded-proto"]) || (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
  const baseUrl = `${proto}://${host}`;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Reason", "missing_supabase_env");
    if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", "0");
    res.status(200);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
    res.send(urlsetWithImages3([]));
    return;
  }
  const supabase = createClient4(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.from("posts").select("slug, published_at, created_at, cover_url, og_image_url, title").eq("published", true).order("published_at", { ascending: false });
  if (error || !data) {
    if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Reason", error?.message ? `supabase_error:${String(error.message).slice(0, 120)}` : "no_data");
    if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", "0");
    res.status(200);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
    res.send(urlsetWithImages3([]));
    return;
  }
  const urls = data.map((p) => {
    const lastmod = p.published_at || p.created_at;
    const img = p.og_image_url || p.cover_url;
    return {
      loc: `${baseUrl}/news/${p.slug}`,
      lastmod: lastmod ? new Date(lastmod).toISOString() : void 0,
      images: img ? [{ loc: img, title: p.title || void 0 }] : []
    };
  });
  if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", String(urls.length));
  res.status(200);
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
  res.send(urlsetWithImages3(urls));
}

// api/sitemap-releases.ts
import { createClient as createClient5 } from "file:///C:/Users/DEVJACK/Downloads/v3/node_modules/@supabase/supabase-js/dist/main/index.js";
function firstHeader6(value) {
  if (!value) return void 0;
  return Array.isArray(value) ? value[0] : value;
}
function xmlEscape6(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&apos;");
}
function urlsetWithImages4(urls) {
  const items = urls.map((u) => {
    const lastmod = u.lastmod ? `<lastmod>${xmlEscape6(u.lastmod)}</lastmod>` : "";
    const images = (u.images || []).filter((img) => img.loc).map((img) => {
      const title = img.title ? `<image:title>${xmlEscape6(img.title)}</image:title>` : "";
      return `<image:image><image:loc>${xmlEscape6(img.loc)}</image:loc>${title}</image:image>`;
    }).join("");
    return `<url><loc>${xmlEscape6(u.loc)}</loc>${lastmod}${images}</url>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${items}</urlset>`;
}
async function handler6(req, res) {
  const host = firstHeader6(req.headers["x-forwarded-host"]) || firstHeader6(req.headers["host"]) || "grouptherapyeg.com";
  const proto = firstHeader6(req.headers["x-forwarded-proto"]) || (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
  const baseUrl = `${proto}://${host}`;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Reason", "missing_supabase_env");
    if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", "0");
    res.status(200);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
    res.send(urlsetWithImages4([]));
    return;
  }
  const supabase = createClient5(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.from("releases").select("slug, created_at, cover_url, title, release_date").eq("published", true).order("release_date", { ascending: false });
  if (error || !data) {
    if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Reason", error?.message ? `supabase_error:${String(error.message).slice(0, 120)}` : "no_data");
    if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", "0");
    res.status(200);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
    res.send(urlsetWithImages4([]));
    return;
  }
  const urls = data.map((r) => {
    const lastmod = r.release_date || r.created_at;
    return {
      loc: `${baseUrl}/releases/${r.slug}`,
      lastmod: lastmod ? new Date(lastmod).toISOString() : void 0,
      images: r.cover_url ? [{ loc: r.cover_url, title: r.title || void 0 }] : []
    };
  });
  if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", String(urls.length));
  res.status(200);
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
  res.send(urlsetWithImages4(urls));
}

// api/sitemap-videos.ts
import { createClient as createClient6 } from "file:///C:/Users/DEVJACK/Downloads/v3/node_modules/@supabase/supabase-js/dist/main/index.js";
function firstHeader7(value) {
  if (!value) return void 0;
  return Array.isArray(value) ? value[0] : value;
}
function xmlEscape7(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&apos;");
}
function urlsetWithImagesAndVideos(urls) {
  const items = urls.map((u) => {
    const lastmod = u.lastmod ? `<lastmod>${xmlEscape7(u.lastmod)}</lastmod>` : "";
    const images = (u.images || []).filter((img) => img.loc).map((img) => {
      const title = img.title ? `<image:title>${xmlEscape7(img.title)}</image:title>` : "";
      return `<image:image><image:loc>${xmlEscape7(img.loc)}</image:loc>${title}</image:image>`;
    }).join("");
    const videos = (u.videos || []).map((v) => {
      const thumb = v.thumbnailLoc ? `<video:thumbnail_loc>${xmlEscape7(v.thumbnailLoc)}</video:thumbnail_loc>` : "";
      const desc = v.description ? `<video:description>${xmlEscape7(v.description)}</video:description>` : "";
      const contentLoc = v.contentLoc ? `<video:content_loc>${xmlEscape7(v.contentLoc)}</video:content_loc>` : "";
      const playerLoc = v.playerLoc ? `<video:player_loc>${xmlEscape7(v.playerLoc)}</video:player_loc>` : "";
      return `<video:video>${thumb}<video:title>${xmlEscape7(v.title)}</video:title>${desc}${contentLoc}${playerLoc}</video:video>`;
    }).join("");
    return `<url><loc>${xmlEscape7(u.loc)}</loc>${lastmod}${images}${videos}</url>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">${items}</urlset>`;
}
async function handler7(req, res) {
  const host = firstHeader7(req.headers["x-forwarded-host"]) || firstHeader7(req.headers["host"]) || "grouptherapyeg.com";
  const proto = firstHeader7(req.headers["x-forwarded-proto"]) || (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
  const baseUrl = `${proto}://${host}`;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Reason", "missing_supabase_env");
    if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", "0");
    res.status(200);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
    res.send(urlsetWithImagesAndVideos([]));
    return;
  }
  const supabase = createClient6(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.from("videos").select("slug, created_at, title, description, thumbnail_url, video_url, youtube_id, vimeo_id").eq("published", true).order("created_at", { ascending: false });
  if (error || !data) {
    if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Reason", error?.message ? `supabase_error:${String(error.message).slice(0, 120)}` : "no_data");
    if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", "0");
    res.status(200);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
    res.send(urlsetWithImagesAndVideos([]));
    return;
  }
  const mostRecent = data.map((v) => v.created_at).filter(Boolean).map((d) => new Date(d).getTime()).reduce((acc, ts) => ts > acc ? ts : acc, 0);
  const videos = data.map((v) => {
    const playerLoc = v.youtube_id ? `https://www.youtube.com/watch?v=${v.youtube_id}` : v.vimeo_id ? `https://vimeo.com/${v.vimeo_id}` : void 0;
    const contentLoc = v.video_url || void 0;
    return {
      thumbnailLoc: v.thumbnail_url || void 0,
      title: v.title || "Video",
      description: v.description || void 0,
      contentLoc,
      playerLoc
    };
  });
  const images = data.reduce((acc, v) => {
    if (!v?.thumbnail_url) return acc;
    acc.push({
      loc: String(v.thumbnail_url),
      title: v.title ? String(v.title) : void 0
    });
    return acc;
  }, []);
  const urls = [
    {
      loc: `${baseUrl}/videos`,
      lastmod: mostRecent ? new Date(mostRecent).toISOString() : void 0,
      images,
      videos
    }
  ];
  if (process.env.NODE_ENV !== "production") res.setHeader("X-Sitemap-Count", String(urls.length));
  res.status(200);
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
  res.send(urlsetWithImagesAndVideos(urls));
}

// api/robots.ts
function firstHeader8(value) {
  if (!value) return void 0;
  return Array.isArray(value) ? value[0] : value;
}
async function handler8(req, res) {
  const host = firstHeader8(req.headers["x-forwarded-host"]) || firstHeader8(req.headers["host"]) || "grouptherapyeg.com";
  const proto = firstHeader8(req.headers["x-forwarded-proto"]) || "https";
  const baseUrl = `${proto}://${host}`;
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin/",
    `Sitemap: ${baseUrl}/sitemap.xml`,
    ""
  ].join("\n");
  res.status(200);
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
  res.send(body);
}

// vite.config.ts
var __vite_injected_original_import_meta_url = "file:///C:/Users/DEVJACK/Downloads/v3/vite.config.ts";
var __dirname = path.dirname(fileURLToPath(__vite_injected_original_import_meta_url));
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname), "VITE_");
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
              const routes = {
                "/sitemap.xml": handler,
                "/sitemap-pages.xml": handler4,
                "/sitemap-posts.xml": handler5,
                "/sitemap-releases.xml": handler6,
                "/sitemap-events.xml": handler3,
                "/sitemap-artists.xml": handler2,
                "/sitemap-videos.xml": handler7,
                "/robots.txt": handler8,
                "/api/sitemap": handler,
                "/api/sitemap-pages": handler4,
                "/api/sitemap-posts": handler5,
                "/api/sitemap-releases": handler6,
                "/api/sitemap-events": handler3,
                "/api/sitemap-artists": handler2,
                "/api/sitemap-videos": handler7,
                "/api/robots": handler8
              };
              const handler9 = routes[pathname];
              if (!handler9) return next();
              const headers = {};
              for (const [k, v] of Object.entries(req.headers || {})) {
                headers[k] = v;
              }
              const nodeRes = res;
              const wrappedRes = {
                status(code) {
                  nodeRes.statusCode = code;
                  return wrappedRes;
                },
                setHeader(name, value) {
                  nodeRes.setHeader(name, value);
                },
                send(body) {
                  nodeRes.end(body);
                }
              };
              const query = {};
              parsed.searchParams.forEach((value, key) => {
                const existing = query[key];
                if (existing === void 0) query[key] = value;
                else if (Array.isArray(existing)) existing.push(value);
                else query[key] = [existing, value];
              });
              await handler9(
                {
                  headers,
                  query
                },
                wrappedRes
              );
            } catch (e) {
              next(e);
            }
          });
        }
      }
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets")
      }
    },
    root: path.resolve(__dirname, "client"),
    envDir: path.resolve(__dirname),
    envPrefix: "VITE_",
    build: {
      outDir: path.resolve(__dirname, "dist/public"),
      emptyOutDir: true,
      sourcemap: true
    },
    server: {
      host: "0.0.0.0",
      port: 5e3,
      allowedHosts: true,
      fs: {
        strict: true,
        deny: ["**/.*"]
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAiYXBpL3NpdGVtYXAudHMiLCAiYXBpL3NpdGVtYXAtYXJ0aXN0cy50cyIsICJhcGkvc2l0ZW1hcC1ldmVudHMudHMiLCAiYXBpL3NpdGVtYXAtcGFnZXMudHMiLCAiYXBpL3NpdGVtYXAtcG9zdHMudHMiLCAiYXBpL3NpdGVtYXAtcmVsZWFzZXMudHMiLCAiYXBpL3NpdGVtYXAtdmlkZW9zLnRzIiwgImFwaS9yb2JvdHMudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxERVZKQUNLXFxcXERvd25sb2Fkc1xcXFx2M1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcREVWSkFDS1xcXFxEb3dubG9hZHNcXFxcdjNcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0RFVkpBQ0svRG93bmxvYWRzL3YzL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSBcInVybFwiO1xyXG5pbXBvcnQgdHlwZSB7IFNlcnZlclJlc3BvbnNlIH0gZnJvbSBcImh0dHBcIjtcclxuXHJcbmltcG9ydCBzaXRlbWFwSGFuZGxlciBmcm9tIFwiLi9hcGkvc2l0ZW1hcFwiO1xyXG5pbXBvcnQgc2l0ZW1hcEFydGlzdHNIYW5kbGVyIGZyb20gXCIuL2FwaS9zaXRlbWFwLWFydGlzdHNcIjtcclxuaW1wb3J0IHNpdGVtYXBFdmVudHNIYW5kbGVyIGZyb20gXCIuL2FwaS9zaXRlbWFwLWV2ZW50c1wiO1xyXG5pbXBvcnQgc2l0ZW1hcFBhZ2VzSGFuZGxlciBmcm9tIFwiLi9hcGkvc2l0ZW1hcC1wYWdlc1wiO1xyXG5pbXBvcnQgc2l0ZW1hcFBvc3RzSGFuZGxlciBmcm9tIFwiLi9hcGkvc2l0ZW1hcC1wb3N0c1wiO1xyXG5pbXBvcnQgc2l0ZW1hcFJlbGVhc2VzSGFuZGxlciBmcm9tIFwiLi9hcGkvc2l0ZW1hcC1yZWxlYXNlc1wiO1xyXG5pbXBvcnQgc2l0ZW1hcFZpZGVvc0hhbmRsZXIgZnJvbSBcIi4vYXBpL3NpdGVtYXAtdmlkZW9zXCI7XHJcbmltcG9ydCByb2JvdHNIYW5kbGVyIGZyb20gXCIuL2FwaS9yb2JvdHNcIjtcclxuXHJcbmNvbnN0IF9fZGlybmFtZSA9IHBhdGguZGlybmFtZShmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybCkpO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xyXG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcGF0aC5yZXNvbHZlKF9fZGlybmFtZSksIFwiVklURV9cIik7XHJcbiAgZm9yIChjb25zdCBbaywgdl0gb2YgT2JqZWN0LmVudHJpZXMoZW52KSkge1xyXG4gICAgaWYgKHR5cGVvZiB2ID09PSBcInN0cmluZ1wiKSBwcm9jZXNzLmVudltrXSA9IHY7XHJcbiAgfVxyXG5cclxuICByZXR1cm4ge1xyXG4gICAgcGx1Z2luczogW1xyXG4gICAgICByZWFjdCgpLFxyXG4gICAgICB7XHJcbiAgICAgICAgbmFtZTogXCJsb2NhbC1zZW8tZW5kcG9pbnRzXCIsXHJcbiAgICAgICAgY29uZmlndXJlU2VydmVyKHNlcnZlcikge1xyXG4gICAgICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZShhc3luYyAocmVxLCByZXMsIG5leHQpID0+IHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICBjb25zdCB1cmwgPSByZXEudXJsIHx8IFwiL1wiO1xyXG4gICAgICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IG5ldyBVUkwodXJsLCBcImh0dHA6Ly9sb2NhbFwiKTtcclxuICAgICAgICAgICAgICBjb25zdCBwYXRobmFtZSA9IHBhcnNlZC5wYXRobmFtZTtcclxuXHJcbiAgICAgICAgICAgICAgY29uc3Qgcm91dGVzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge1xyXG4gICAgICAgICAgICAgICAgXCIvc2l0ZW1hcC54bWxcIjogc2l0ZW1hcEhhbmRsZXIsXHJcbiAgICAgICAgICAgICAgICBcIi9zaXRlbWFwLXBhZ2VzLnhtbFwiOiBzaXRlbWFwUGFnZXNIYW5kbGVyLFxyXG4gICAgICAgICAgICAgICAgXCIvc2l0ZW1hcC1wb3N0cy54bWxcIjogc2l0ZW1hcFBvc3RzSGFuZGxlcixcclxuICAgICAgICAgICAgICAgIFwiL3NpdGVtYXAtcmVsZWFzZXMueG1sXCI6IHNpdGVtYXBSZWxlYXNlc0hhbmRsZXIsXHJcbiAgICAgICAgICAgICAgICBcIi9zaXRlbWFwLWV2ZW50cy54bWxcIjogc2l0ZW1hcEV2ZW50c0hhbmRsZXIsXHJcbiAgICAgICAgICAgICAgICBcIi9zaXRlbWFwLWFydGlzdHMueG1sXCI6IHNpdGVtYXBBcnRpc3RzSGFuZGxlcixcclxuICAgICAgICAgICAgICAgIFwiL3NpdGVtYXAtdmlkZW9zLnhtbFwiOiBzaXRlbWFwVmlkZW9zSGFuZGxlcixcclxuICAgICAgICAgICAgICAgIFwiL3JvYm90cy50eHRcIjogcm9ib3RzSGFuZGxlcixcclxuXHJcbiAgICAgICAgICAgICAgICBcIi9hcGkvc2l0ZW1hcFwiOiBzaXRlbWFwSGFuZGxlcixcclxuICAgICAgICAgICAgICAgIFwiL2FwaS9zaXRlbWFwLXBhZ2VzXCI6IHNpdGVtYXBQYWdlc0hhbmRsZXIsXHJcbiAgICAgICAgICAgICAgICBcIi9hcGkvc2l0ZW1hcC1wb3N0c1wiOiBzaXRlbWFwUG9zdHNIYW5kbGVyLFxyXG4gICAgICAgICAgICAgICAgXCIvYXBpL3NpdGVtYXAtcmVsZWFzZXNcIjogc2l0ZW1hcFJlbGVhc2VzSGFuZGxlcixcclxuICAgICAgICAgICAgICAgIFwiL2FwaS9zaXRlbWFwLWV2ZW50c1wiOiBzaXRlbWFwRXZlbnRzSGFuZGxlcixcclxuICAgICAgICAgICAgICAgIFwiL2FwaS9zaXRlbWFwLWFydGlzdHNcIjogc2l0ZW1hcEFydGlzdHNIYW5kbGVyLFxyXG4gICAgICAgICAgICAgICAgXCIvYXBpL3NpdGVtYXAtdmlkZW9zXCI6IHNpdGVtYXBWaWRlb3NIYW5kbGVyLFxyXG4gICAgICAgICAgICAgICAgXCIvYXBpL3JvYm90c1wiOiByb2JvdHNIYW5kbGVyLFxyXG4gICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgIGNvbnN0IGhhbmRsZXIgPSByb3V0ZXNbcGF0aG5hbWVdO1xyXG4gICAgICAgICAgICAgIGlmICghaGFuZGxlcikgcmV0dXJuIG5leHQoKTtcclxuXHJcbiAgICAgICAgICAgICAgY29uc3QgaGVhZGVyczogUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgc3RyaW5nW10gfCB1bmRlZmluZWQ+ID0ge307XHJcbiAgICAgICAgICAgICAgZm9yIChjb25zdCBbaywgdl0gb2YgT2JqZWN0LmVudHJpZXMocmVxLmhlYWRlcnMgfHwge30pKSB7XHJcbiAgICAgICAgICAgICAgICBoZWFkZXJzW2tdID0gdiBhcyBhbnk7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBjb25zdCBub2RlUmVzID0gcmVzIGFzIFNlcnZlclJlc3BvbnNlO1xyXG4gICAgICAgICAgICAgIGNvbnN0IHdyYXBwZWRSZXMgPSB7XHJcbiAgICAgICAgICAgICAgICBzdGF0dXMoY29kZTogbnVtYmVyKSB7XHJcbiAgICAgICAgICAgICAgICAgIG5vZGVSZXMuc3RhdHVzQ29kZSA9IGNvZGU7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiB3cmFwcGVkUmVzO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHNldEhlYWRlcihuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgICAgICAgbm9kZVJlcy5zZXRIZWFkZXIobmFtZSwgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHNlbmQoYm9keTogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgICAgICAgIG5vZGVSZXMuZW5kKGJvZHkpO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICBjb25zdCBxdWVyeTogUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgc3RyaW5nW10gfCB1bmRlZmluZWQ+ID0ge307XHJcbiAgICAgICAgICAgICAgcGFyc2VkLnNlYXJjaFBhcmFtcy5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBleGlzdGluZyA9IHF1ZXJ5W2tleV07XHJcbiAgICAgICAgICAgICAgICBpZiAoZXhpc3RpbmcgPT09IHVuZGVmaW5lZCkgcXVlcnlba2V5XSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShleGlzdGluZykpIGV4aXN0aW5nLnB1c2godmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBxdWVyeVtrZXldID0gW2V4aXN0aW5nLCB2YWx1ZV07XHJcbiAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgIGF3YWl0IGhhbmRsZXIoXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgIGhlYWRlcnMsXHJcbiAgICAgICAgICAgICAgICAgIHF1ZXJ5LFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHdyYXBwZWRSZXNcclxuICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgbmV4dChlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIF0sXHJcbiAgICByZXNvbHZlOiB7XHJcbiAgICAgIGFsaWFzOiB7XHJcbiAgICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiY2xpZW50XCIsIFwic3JjXCIpLFxyXG4gICAgICAgIFwiQHNoYXJlZFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcInNoYXJlZFwiKSxcclxuICAgICAgICBcIkBhc3NldHNcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJhdHRhY2hlZF9hc3NldHNcIiksXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgcm9vdDogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJjbGllbnRcIiksXHJcbiAgICBlbnZEaXI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUpLFxyXG4gICAgZW52UHJlZml4OiBcIlZJVEVfXCIsXHJcbiAgICBidWlsZDoge1xyXG4gICAgICBvdXREaXI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiZGlzdC9wdWJsaWNcIiksXHJcbiAgICAgIGVtcHR5T3V0RGlyOiB0cnVlLFxyXG4gICAgICBzb3VyY2VtYXA6IHRydWUsXHJcbiAgICB9LFxyXG4gICAgc2VydmVyOiB7XHJcbiAgICAgIGhvc3Q6IFwiMC4wLjAuMFwiLFxyXG4gICAgICBwb3J0OiA1MDAwLFxyXG4gICAgICBhbGxvd2VkSG9zdHM6IHRydWUsXHJcbiAgICAgIGZzOiB7XHJcbiAgICAgICAgc3RyaWN0OiB0cnVlLFxyXG4gICAgICAgIGRlbnk6IFtcIioqLy4qXCJdLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9O1xyXG59KTsiLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXERFVkpBQ0tcXFxcRG93bmxvYWRzXFxcXHYzXFxcXGFwaVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcREVWSkFDS1xcXFxEb3dubG9hZHNcXFxcdjNcXFxcYXBpXFxcXHNpdGVtYXAudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0RFVkpBQ0svRG93bmxvYWRzL3YzL2FwaS9zaXRlbWFwLnRzXCI7dHlwZSBSZXEgPSB7XHJcbiAgaGVhZGVyczogUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgc3RyaW5nW10gfCB1bmRlZmluZWQ+O1xyXG59O1xyXG5cclxudHlwZSBSZXMgPSB7XHJcbiAgc3RhdHVzOiAoY29kZTogbnVtYmVyKSA9PiBSZXM7XHJcbiAgc2V0SGVhZGVyOiAobmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKSA9PiB2b2lkO1xyXG4gIHNlbmQ6IChib2R5OiBzdHJpbmcpID0+IHZvaWQ7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBmaXJzdEhlYWRlcih2YWx1ZTogc3RyaW5nIHwgc3RyaW5nW10gfCB1bmRlZmluZWQpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xyXG4gIGlmICghdmFsdWUpIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpID8gdmFsdWVbMF0gOiB2YWx1ZTtcclxufVxyXG5cclxuZnVuY3Rpb24geG1sRXNjYXBlKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gIHJldHVybiB2YWx1ZVxyXG4gICAgLnJlcGxhY2UoLyYvZywgXCImYW1wO1wiKVxyXG4gICAgLnJlcGxhY2UoLzwvZywgXCImbHQ7XCIpXHJcbiAgICAucmVwbGFjZSgvPi9nLCBcIiZndDtcIilcclxuICAgIC5yZXBsYWNlKC9cXFwiL2csIFwiJnF1b3Q7XCIpXHJcbiAgICAucmVwbGFjZSgvJy9nLCBcIiZhcG9zO1wiKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2l0ZW1hcEluZGV4KHVybHM6IHsgbG9jOiBzdHJpbmc7IGxhc3Rtb2Q/OiBzdHJpbmcgfVtdKTogc3RyaW5nIHtcclxuICBjb25zdCBpdGVtcyA9IHVybHNcclxuICAgIC5tYXAoKHUpID0+IHtcclxuICAgICAgY29uc3QgbGFzdG1vZCA9IHUubGFzdG1vZCA/IGA8bGFzdG1vZD4ke3htbEVzY2FwZSh1Lmxhc3Rtb2QpfTwvbGFzdG1vZD5gIDogXCJcIjtcclxuICAgICAgcmV0dXJuIGA8c2l0ZW1hcD48bG9jPiR7eG1sRXNjYXBlKHUubG9jKX08L2xvYz4ke2xhc3Rtb2R9PC9zaXRlbWFwPmA7XHJcbiAgICB9KVxyXG4gICAgLmpvaW4oXCJcIik7XHJcblxyXG4gIHJldHVybiBgPD94bWwgdmVyc2lvbj1cIjEuMFwiIGVuY29kaW5nPVwiVVRGLThcIj8+YCArXHJcbiAgICBgPHNpdGVtYXBpbmRleCB4bWxucz1cImh0dHA6Ly93d3cuc2l0ZW1hcHMub3JnL3NjaGVtYXMvc2l0ZW1hcC8wLjlcIj4ke2l0ZW1zfTwvc2l0ZW1hcGluZGV4PmA7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIocmVxOiBSZXEsIHJlczogUmVzKSB7XHJcbiAgY29uc3QgaG9zdCA9IGZpcnN0SGVhZGVyKHJlcS5oZWFkZXJzW1wieC1mb3J3YXJkZWQtaG9zdFwiXSkgfHwgZmlyc3RIZWFkZXIocmVxLmhlYWRlcnNbXCJob3N0XCJdKSB8fCBcImdyb3VwdGhlcmFweWVnLmNvbVwiO1xyXG4gIGNvbnN0IHByb3RvID1cclxuICAgIGZpcnN0SGVhZGVyKHJlcS5oZWFkZXJzW1wieC1mb3J3YXJkZWQtcHJvdG9cIl0pIHx8XHJcbiAgICAoaG9zdC5pbmNsdWRlcyhcImxvY2FsaG9zdFwiKSB8fCBob3N0LmluY2x1ZGVzKFwiMTI3LjAuMC4xXCIpID8gXCJodHRwXCIgOiBcImh0dHBzXCIpO1xyXG4gIGNvbnN0IGJhc2VVcmwgPSBgJHtwcm90b306Ly8ke2hvc3R9YDtcclxuXHJcbiAgY29uc3QgeG1sID0gc2l0ZW1hcEluZGV4KFtcclxuICAgIHsgbG9jOiBgJHtiYXNlVXJsfS9zaXRlbWFwLXBhZ2VzLnhtbGAgfSxcclxuICAgIHsgbG9jOiBgJHtiYXNlVXJsfS9zaXRlbWFwLXBvc3RzLnhtbGAgfSxcclxuICAgIHsgbG9jOiBgJHtiYXNlVXJsfS9zaXRlbWFwLXJlbGVhc2VzLnhtbGAgfSxcclxuICAgIHsgbG9jOiBgJHtiYXNlVXJsfS9zaXRlbWFwLWV2ZW50cy54bWxgIH0sXHJcbiAgICB7IGxvYzogYCR7YmFzZVVybH0vc2l0ZW1hcC1hcnRpc3RzLnhtbGAgfSxcclxuICAgIHsgbG9jOiBgJHtiYXNlVXJsfS9zaXRlbWFwLXZpZGVvcy54bWxgIH0sXHJcbiAgXSk7XHJcblxyXG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHJlcy5zZXRIZWFkZXIoXCJYLVNpdGVtYXAtQ291bnRcIiwgXCI2XCIpO1xyXG5cclxuICByZXMuc3RhdHVzKDIwMCk7XHJcbiAgcmVzLnNldEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL3htbDsgY2hhcnNldD11dGYtOFwiKTtcclxuICByZXMuc2V0SGVhZGVyKFwiQ2FjaGUtQ29udHJvbFwiLCBcInB1YmxpYywgbWF4LWFnZT0wLCBzLW1heGFnZT0zNjAwXCIpO1xyXG4gIHJlcy5zZW5kKHhtbCk7XHJcbn1cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxERVZKQUNLXFxcXERvd25sb2Fkc1xcXFx2M1xcXFxhcGlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXERFVkpBQ0tcXFxcRG93bmxvYWRzXFxcXHYzXFxcXGFwaVxcXFxzaXRlbWFwLWFydGlzdHMudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0RFVkpBQ0svRG93bmxvYWRzL3YzL2FwaS9zaXRlbWFwLWFydGlzdHMudHNcIjtpbXBvcnQgeyBjcmVhdGVDbGllbnQgfSBmcm9tIFwiQHN1cGFiYXNlL3N1cGFiYXNlLWpzXCI7XHJcblxyXG50eXBlIFJlcSA9IHtcclxuICBoZWFkZXJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmcgfCBzdHJpbmdbXSB8IHVuZGVmaW5lZD47XHJcbn07XHJcblxyXG50eXBlIFJlcyA9IHtcclxuICBzdGF0dXM6IChjb2RlOiBudW1iZXIpID0+IFJlcztcclxuICBzZXRIZWFkZXI6IChuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpID0+IHZvaWQ7XHJcbiAgc2VuZDogKGJvZHk6IHN0cmluZykgPT4gdm9pZDtcclxufTtcclxuXHJcbmZ1bmN0aW9uIGZpcnN0SGVhZGVyKHZhbHVlOiBzdHJpbmcgfCBzdHJpbmdbXSB8IHVuZGVmaW5lZCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XHJcbiAgaWYgKCF2YWx1ZSkgcmV0dXJuIHVuZGVmaW5lZDtcclxuICByZXR1cm4gQXJyYXkuaXNBcnJheSh2YWx1ZSkgPyB2YWx1ZVswXSA6IHZhbHVlO1xyXG59XHJcblxyXG5mdW5jdGlvbiB4bWxFc2NhcGUodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgcmV0dXJuIHZhbHVlXHJcbiAgICAucmVwbGFjZSgvJi9nLCBcIiZhbXA7XCIpXHJcbiAgICAucmVwbGFjZSgvPC9nLCBcIiZsdDtcIilcclxuICAgIC5yZXBsYWNlKC8+L2csIFwiJmd0O1wiKVxyXG4gICAgLnJlcGxhY2UoL1xcXCIvZywgXCImcXVvdDtcIilcclxuICAgIC5yZXBsYWNlKC8nL2csIFwiJmFwb3M7XCIpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB1cmxzZXRXaXRoSW1hZ2VzKFxyXG4gIHVybHM6IHsgbG9jOiBzdHJpbmc7IGxhc3Rtb2Q/OiBzdHJpbmc7IGltYWdlcz86IHsgbG9jOiBzdHJpbmc7IHRpdGxlPzogc3RyaW5nIH1bXSB9W11cclxuKTogc3RyaW5nIHtcclxuICBjb25zdCBpdGVtcyA9IHVybHNcclxuICAgIC5tYXAoKHUpID0+IHtcclxuICAgICAgY29uc3QgbGFzdG1vZCA9IHUubGFzdG1vZCA/IGA8bGFzdG1vZD4ke3htbEVzY2FwZSh1Lmxhc3Rtb2QpfTwvbGFzdG1vZD5gIDogXCJcIjtcclxuICAgICAgY29uc3QgaW1hZ2VzID0gKHUuaW1hZ2VzIHx8IFtdKVxyXG4gICAgICAgIC5maWx0ZXIoKGltZykgPT4gaW1nLmxvYylcclxuICAgICAgICAubWFwKChpbWcpID0+IHtcclxuICAgICAgICAgIGNvbnN0IHRpdGxlID0gaW1nLnRpdGxlID8gYDxpbWFnZTp0aXRsZT4ke3htbEVzY2FwZShpbWcudGl0bGUpfTwvaW1hZ2U6dGl0bGU+YCA6IFwiXCI7XHJcbiAgICAgICAgICByZXR1cm4gYDxpbWFnZTppbWFnZT48aW1hZ2U6bG9jPiR7eG1sRXNjYXBlKGltZy5sb2MpfTwvaW1hZ2U6bG9jPiR7dGl0bGV9PC9pbWFnZTppbWFnZT5gO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmpvaW4oXCJcIik7XHJcblxyXG4gICAgICByZXR1cm4gYDx1cmw+PGxvYz4ke3htbEVzY2FwZSh1LmxvYyl9PC9sb2M+JHtsYXN0bW9kfSR7aW1hZ2VzfTwvdXJsPmA7XHJcbiAgICB9KVxyXG4gICAgLmpvaW4oXCJcIik7XHJcblxyXG4gIHJldHVybiAoXHJcbiAgICBgPD94bWwgdmVyc2lvbj1cIjEuMFwiIGVuY29kaW5nPVwiVVRGLThcIj8+YCArXHJcbiAgICBgPHVybHNldCB4bWxucz1cImh0dHA6Ly93d3cuc2l0ZW1hcHMub3JnL3NjaGVtYXMvc2l0ZW1hcC8wLjlcIiB4bWxuczppbWFnZT1cImh0dHA6Ly93d3cuZ29vZ2xlLmNvbS9zY2hlbWFzL3NpdGVtYXAtaW1hZ2UvMS4xXCI+JHtpdGVtc308L3VybHNldD5gXHJcbiAgKTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihyZXE6IFJlcSwgcmVzOiBSZXMpIHtcclxuICBjb25zdCBob3N0ID0gZmlyc3RIZWFkZXIocmVxLmhlYWRlcnNbXCJ4LWZvcndhcmRlZC1ob3N0XCJdKSB8fCBmaXJzdEhlYWRlcihyZXEuaGVhZGVyc1tcImhvc3RcIl0pIHx8IFwiZ3JvdXB0aGVyYXB5ZWcuY29tXCI7XHJcbiAgY29uc3QgcHJvdG8gPSBmaXJzdEhlYWRlcihyZXEuaGVhZGVyc1tcIngtZm9yd2FyZGVkLXByb3RvXCJdKSB8fCAoaG9zdC5pbmNsdWRlcyhcImxvY2FsaG9zdFwiKSB8fCBob3N0LmluY2x1ZGVzKFwiMTI3LjAuMC4xXCIpID8gXCJodHRwXCIgOiBcImh0dHBzXCIpO1xyXG4gIGNvbnN0IGJhc2VVcmwgPSBgJHtwcm90b306Ly8ke2hvc3R9YDtcclxuXHJcbiAgY29uc3Qgc3VwYWJhc2VVcmwgPSBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBwcm9jZXNzLmVudi5TVVBBQkFTRV9VUkw7XHJcbiAgY29uc3Qgc3VwYWJhc2VBbm9uS2V5ID0gcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9BTk9OX0tFWSB8fCBwcm9jZXNzLmVudi5TVVBBQkFTRV9BTk9OX0tFWTtcclxuXHJcbiAgaWYgKCFzdXBhYmFzZVVybCB8fCAhc3VwYWJhc2VBbm9uS2V5KSB7XHJcbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSByZXMuc2V0SGVhZGVyKFwiWC1TaXRlbWFwLVJlYXNvblwiLCBcIm1pc3Npbmdfc3VwYWJhc2VfZW52XCIpO1xyXG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgcmVzLnNldEhlYWRlcihcIlgtU2l0ZW1hcC1Db3VudFwiLCBcIjBcIik7XHJcbiAgICByZXMuc3RhdHVzKDIwMCk7XHJcbiAgICByZXMuc2V0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24veG1sOyBjaGFyc2V0PXV0Zi04XCIpO1xyXG4gICAgcmVzLnNldEhlYWRlcihcIkNhY2hlLUNvbnRyb2xcIiwgXCJwdWJsaWMsIG1heC1hZ2U9MCwgcy1tYXhhZ2U9MzYwMFwiKTtcclxuICAgIHJlcy5zZW5kKHVybHNldFdpdGhJbWFnZXMoW10pKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IHN1cGFiYXNlID0gY3JlYXRlQ2xpZW50KHN1cGFiYXNlVXJsLCBzdXBhYmFzZUFub25LZXkpO1xyXG4gIGNvbnN0IHsgZGF0YSwgZXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlXHJcbiAgICAuZnJvbShcImFydGlzdHNcIilcclxuICAgIC5zZWxlY3QoXCJzbHVnLCBjcmVhdGVkX2F0LCBpbWFnZV91cmwsIG5hbWVcIilcclxuICAgIC5vcmRlcihcImNyZWF0ZWRfYXRcIiwgeyBhc2NlbmRpbmc6IGZhbHNlIH0pO1xyXG5cclxuICBpZiAoZXJyb3IgfHwgIWRhdGEpIHtcclxuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHJlcy5zZXRIZWFkZXIoXCJYLVNpdGVtYXAtUmVhc29uXCIsIGVycm9yPy5tZXNzYWdlID8gYHN1cGFiYXNlX2Vycm9yOiR7U3RyaW5nKGVycm9yLm1lc3NhZ2UpLnNsaWNlKDAsIDEyMCl9YCA6IFwibm9fZGF0YVwiKTtcclxuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHJlcy5zZXRIZWFkZXIoXCJYLVNpdGVtYXAtQ291bnRcIiwgXCIwXCIpO1xyXG4gICAgcmVzLnN0YXR1cygyMDApO1xyXG4gICAgcmVzLnNldEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL3htbDsgY2hhcnNldD11dGYtOFwiKTtcclxuICAgIHJlcy5zZXRIZWFkZXIoXCJDYWNoZS1Db250cm9sXCIsIFwicHVibGljLCBtYXgtYWdlPTAsIHMtbWF4YWdlPTM2MDBcIik7XHJcbiAgICByZXMuc2VuZCh1cmxzZXRXaXRoSW1hZ2VzKFtdKSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCB1cmxzID0gZGF0YS5tYXAoKGE6IGFueSkgPT4ge1xyXG4gICAgY29uc3QgbGFzdG1vZCA9IGEuY3JlYXRlZF9hdDtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGxvYzogYCR7YmFzZVVybH0vYXJ0aXN0cy8ke2Euc2x1Z31gLFxyXG4gICAgICBsYXN0bW9kOiBsYXN0bW9kID8gbmV3IERhdGUobGFzdG1vZCkudG9JU09TdHJpbmcoKSA6IHVuZGVmaW5lZCxcclxuICAgICAgaW1hZ2VzOiBhLmltYWdlX3VybCA/IFt7IGxvYzogYS5pbWFnZV91cmwsIHRpdGxlOiBhLm5hbWUgfHwgdW5kZWZpbmVkIH1dIDogW10sXHJcbiAgICB9O1xyXG4gIH0pO1xyXG5cclxuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSByZXMuc2V0SGVhZGVyKFwiWC1TaXRlbWFwLUNvdW50XCIsIFN0cmluZyh1cmxzLmxlbmd0aCkpO1xyXG5cclxuICByZXMuc3RhdHVzKDIwMCk7XHJcbiAgcmVzLnNldEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL3htbDsgY2hhcnNldD11dGYtOFwiKTtcclxuICByZXMuc2V0SGVhZGVyKFwiQ2FjaGUtQ29udHJvbFwiLCBcInB1YmxpYywgbWF4LWFnZT0wLCBzLW1heGFnZT0zNjAwXCIpO1xyXG4gIHJlcy5zZW5kKHVybHNldFdpdGhJbWFnZXModXJscykpO1xyXG59XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcREVWSkFDS1xcXFxEb3dubG9hZHNcXFxcdjNcXFxcYXBpXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxERVZKQUNLXFxcXERvd25sb2Fkc1xcXFx2M1xcXFxhcGlcXFxcc2l0ZW1hcC1ldmVudHMudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0RFVkpBQ0svRG93bmxvYWRzL3YzL2FwaS9zaXRlbWFwLWV2ZW50cy50c1wiO2ltcG9ydCB7IGNyZWF0ZUNsaWVudCB9IGZyb20gXCJAc3VwYWJhc2Uvc3VwYWJhc2UtanNcIjtcclxuXHJcbnR5cGUgUmVxID0ge1xyXG4gIGhlYWRlcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IHN0cmluZ1tdIHwgdW5kZWZpbmVkPjtcclxufTtcclxuXHJcbnR5cGUgUmVzID0ge1xyXG4gIHN0YXR1czogKGNvZGU6IG51bWJlcikgPT4gUmVzO1xyXG4gIHNldEhlYWRlcjogKG5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZykgPT4gdm9pZDtcclxuICBzZW5kOiAoYm9keTogc3RyaW5nKSA9PiB2b2lkO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gZmlyc3RIZWFkZXIodmFsdWU6IHN0cmluZyB8IHN0cmluZ1tdIHwgdW5kZWZpbmVkKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcclxuICBpZiAoIXZhbHVlKSByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKSA/IHZhbHVlWzBdIDogdmFsdWU7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHhtbEVzY2FwZSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcclxuICByZXR1cm4gdmFsdWVcclxuICAgIC5yZXBsYWNlKC8mL2csIFwiJmFtcDtcIilcclxuICAgIC5yZXBsYWNlKC88L2csIFwiJmx0O1wiKVxyXG4gICAgLnJlcGxhY2UoLz4vZywgXCImZ3Q7XCIpXHJcbiAgICAucmVwbGFjZSgvXFxcIi9nLCBcIiZxdW90O1wiKVxyXG4gICAgLnJlcGxhY2UoLycvZywgXCImYXBvcztcIik7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHVybHNldFdpdGhJbWFnZXMoXHJcbiAgdXJsczogeyBsb2M6IHN0cmluZzsgbGFzdG1vZD86IHN0cmluZzsgaW1hZ2VzPzogeyBsb2M6IHN0cmluZzsgdGl0bGU/OiBzdHJpbmcgfVtdIH1bXVxyXG4pOiBzdHJpbmcge1xyXG4gIGNvbnN0IGl0ZW1zID0gdXJsc1xyXG4gICAgLm1hcCgodSkgPT4ge1xyXG4gICAgICBjb25zdCBsYXN0bW9kID0gdS5sYXN0bW9kID8gYDxsYXN0bW9kPiR7eG1sRXNjYXBlKHUubGFzdG1vZCl9PC9sYXN0bW9kPmAgOiBcIlwiO1xyXG4gICAgICBjb25zdCBpbWFnZXMgPSAodS5pbWFnZXMgfHwgW10pXHJcbiAgICAgICAgLmZpbHRlcigoaW1nKSA9PiBpbWcubG9jKVxyXG4gICAgICAgIC5tYXAoKGltZykgPT4ge1xyXG4gICAgICAgICAgY29uc3QgdGl0bGUgPSBpbWcudGl0bGUgPyBgPGltYWdlOnRpdGxlPiR7eG1sRXNjYXBlKGltZy50aXRsZSl9PC9pbWFnZTp0aXRsZT5gIDogXCJcIjtcclxuICAgICAgICAgIHJldHVybiBgPGltYWdlOmltYWdlPjxpbWFnZTpsb2M+JHt4bWxFc2NhcGUoaW1nLmxvYyl9PC9pbWFnZTpsb2M+JHt0aXRsZX08L2ltYWdlOmltYWdlPmA7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuam9pbihcIlwiKTtcclxuXHJcbiAgICAgIHJldHVybiBgPHVybD48bG9jPiR7eG1sRXNjYXBlKHUubG9jKX08L2xvYz4ke2xhc3Rtb2R9JHtpbWFnZXN9PC91cmw+YDtcclxuICAgIH0pXHJcbiAgICAuam9pbihcIlwiKTtcclxuXHJcbiAgcmV0dXJuIChcclxuICAgIGA8P3htbCB2ZXJzaW9uPVwiMS4wXCIgZW5jb2Rpbmc9XCJVVEYtOFwiPz5gICtcclxuICAgIGA8dXJsc2V0IHhtbG5zPVwiaHR0cDovL3d3dy5zaXRlbWFwcy5vcmcvc2NoZW1hcy9zaXRlbWFwLzAuOVwiIHhtbG5zOmltYWdlPVwiaHR0cDovL3d3dy5nb29nbGUuY29tL3NjaGVtYXMvc2l0ZW1hcC1pbWFnZS8xLjFcIj4ke2l0ZW1zfTwvdXJsc2V0PmBcclxuICApO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBoYW5kbGVyKHJlcTogUmVxLCByZXM6IFJlcykge1xyXG4gIGNvbnN0IGhvc3QgPSBmaXJzdEhlYWRlcihyZXEuaGVhZGVyc1tcIngtZm9yd2FyZGVkLWhvc3RcIl0pIHx8IGZpcnN0SGVhZGVyKHJlcS5oZWFkZXJzW1wiaG9zdFwiXSkgfHwgXCJncm91cHRoZXJhcHllZy5jb21cIjtcclxuICBjb25zdCBwcm90byA9IGZpcnN0SGVhZGVyKHJlcS5oZWFkZXJzW1wieC1mb3J3YXJkZWQtcHJvdG9cIl0pIHx8IChob3N0LmluY2x1ZGVzKFwibG9jYWxob3N0XCIpIHx8IGhvc3QuaW5jbHVkZXMoXCIxMjcuMC4wLjFcIikgPyBcImh0dHBcIiA6IFwiaHR0cHNcIik7XHJcbiAgY29uc3QgYmFzZVVybCA9IGAke3Byb3RvfTovLyR7aG9zdH1gO1xyXG5cclxuICBjb25zdCBzdXBhYmFzZVVybCA9IHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8IHByb2Nlc3MuZW52LlNVUEFCQVNFX1VSTDtcclxuICBjb25zdCBzdXBhYmFzZUFub25LZXkgPSBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZIHx8IHByb2Nlc3MuZW52LlNVUEFCQVNFX0FOT05fS0VZO1xyXG5cclxuICBpZiAoIXN1cGFiYXNlVXJsIHx8ICFzdXBhYmFzZUFub25LZXkpIHtcclxuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHJlcy5zZXRIZWFkZXIoXCJYLVNpdGVtYXAtUmVhc29uXCIsIFwibWlzc2luZ19zdXBhYmFzZV9lbnZcIik7XHJcbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSByZXMuc2V0SGVhZGVyKFwiWC1TaXRlbWFwLUNvdW50XCIsIFwiMFwiKTtcclxuICAgIHJlcy5zdGF0dXMoMjAwKTtcclxuICAgIHJlcy5zZXRIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi94bWw7IGNoYXJzZXQ9dXRmLThcIik7XHJcbiAgICByZXMuc2V0SGVhZGVyKFwiQ2FjaGUtQ29udHJvbFwiLCBcInB1YmxpYywgbWF4LWFnZT0wLCBzLW1heGFnZT0zNjAwXCIpO1xyXG4gICAgcmVzLnNlbmQodXJsc2V0V2l0aEltYWdlcyhbXSkpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgc3VwYWJhc2UgPSBjcmVhdGVDbGllbnQoc3VwYWJhc2VVcmwsIHN1cGFiYXNlQW5vbktleSk7XHJcbiAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgIC5mcm9tKFwiZXZlbnRzXCIpXHJcbiAgICAuc2VsZWN0KFwic2x1ZywgY3JlYXRlZF9hdCwgaW1hZ2VfdXJsLCB0aXRsZSwgZGF0ZVwiKVxyXG4gICAgLmVxKFwicHVibGlzaGVkXCIsIHRydWUpXHJcbiAgICAub3JkZXIoXCJkYXRlXCIsIHsgYXNjZW5kaW5nOiBmYWxzZSB9KTtcclxuXHJcbiAgaWYgKGVycm9yIHx8ICFkYXRhKSB7XHJcbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSByZXMuc2V0SGVhZGVyKFwiWC1TaXRlbWFwLVJlYXNvblwiLCBlcnJvcj8ubWVzc2FnZSA/IGBzdXBhYmFzZV9lcnJvcjoke1N0cmluZyhlcnJvci5tZXNzYWdlKS5zbGljZSgwLCAxMjApfWAgOiBcIm5vX2RhdGFcIik7XHJcbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSByZXMuc2V0SGVhZGVyKFwiWC1TaXRlbWFwLUNvdW50XCIsIFwiMFwiKTtcclxuICAgIHJlcy5zdGF0dXMoMjAwKTtcclxuICAgIHJlcy5zZXRIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi94bWw7IGNoYXJzZXQ9dXRmLThcIik7XHJcbiAgICByZXMuc2V0SGVhZGVyKFwiQ2FjaGUtQ29udHJvbFwiLCBcInB1YmxpYywgbWF4LWFnZT0wLCBzLW1heGFnZT0zNjAwXCIpO1xyXG4gICAgcmVzLnNlbmQodXJsc2V0V2l0aEltYWdlcyhbXSkpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgdXJscyA9IGRhdGEubWFwKChlOiBhbnkpID0+IHtcclxuICAgIGNvbnN0IGxhc3Rtb2QgPSBlLmRhdGUgfHwgZS5jcmVhdGVkX2F0O1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgbG9jOiBgJHtiYXNlVXJsfS9ldmVudHMvJHtlLnNsdWd9YCxcclxuICAgICAgbGFzdG1vZDogbGFzdG1vZCA/IG5ldyBEYXRlKGxhc3Rtb2QpLnRvSVNPU3RyaW5nKCkgOiB1bmRlZmluZWQsXHJcbiAgICAgIGltYWdlczogZS5pbWFnZV91cmwgPyBbeyBsb2M6IGUuaW1hZ2VfdXJsLCB0aXRsZTogZS50aXRsZSB8fCB1bmRlZmluZWQgfV0gOiBbXSxcclxuICAgIH07XHJcbiAgfSk7XHJcblxyXG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHJlcy5zZXRIZWFkZXIoXCJYLVNpdGVtYXAtQ291bnRcIiwgU3RyaW5nKHVybHMubGVuZ3RoKSk7XHJcblxyXG4gIHJlcy5zdGF0dXMoMjAwKTtcclxuICByZXMuc2V0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24veG1sOyBjaGFyc2V0PXV0Zi04XCIpO1xyXG4gIHJlcy5zZXRIZWFkZXIoXCJDYWNoZS1Db250cm9sXCIsIFwicHVibGljLCBtYXgtYWdlPTAsIHMtbWF4YWdlPTM2MDBcIik7XHJcbiAgcmVzLnNlbmQodXJsc2V0V2l0aEltYWdlcyh1cmxzKSk7XHJcbn1cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxERVZKQUNLXFxcXERvd25sb2Fkc1xcXFx2M1xcXFxhcGlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXERFVkpBQ0tcXFxcRG93bmxvYWRzXFxcXHYzXFxcXGFwaVxcXFxzaXRlbWFwLXBhZ2VzLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9ERVZKQUNLL0Rvd25sb2Fkcy92My9hcGkvc2l0ZW1hcC1wYWdlcy50c1wiO2ltcG9ydCB7IGNyZWF0ZUNsaWVudCB9IGZyb20gXCJAc3VwYWJhc2Uvc3VwYWJhc2UtanNcIjtcclxuXHJcbnR5cGUgUmVxID0ge1xyXG4gIGhlYWRlcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IHN0cmluZ1tdIHwgdW5kZWZpbmVkPjtcclxufTtcclxuXHJcbnR5cGUgUmVzID0ge1xyXG4gIHN0YXR1czogKGNvZGU6IG51bWJlcikgPT4gUmVzO1xyXG4gIHNldEhlYWRlcjogKG5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZykgPT4gdm9pZDtcclxuICBzZW5kOiAoYm9keTogc3RyaW5nKSA9PiB2b2lkO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gZmlyc3RIZWFkZXIodmFsdWU6IHN0cmluZyB8IHN0cmluZ1tdIHwgdW5kZWZpbmVkKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcclxuICBpZiAoIXZhbHVlKSByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKSA/IHZhbHVlWzBdIDogdmFsdWU7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHhtbEVzY2FwZSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcclxuICByZXR1cm4gdmFsdWVcclxuICAgIC5yZXBsYWNlKC8mL2csIFwiJmFtcDtcIilcclxuICAgIC5yZXBsYWNlKC88L2csIFwiJmx0O1wiKVxyXG4gICAgLnJlcGxhY2UoLz4vZywgXCImZ3Q7XCIpXHJcbiAgICAucmVwbGFjZSgvXFxcIi9nLCBcIiZxdW90O1wiKVxyXG4gICAgLnJlcGxhY2UoLycvZywgXCImYXBvcztcIik7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHVybHNldCh1cmxzOiB7IGxvYzogc3RyaW5nOyBsYXN0bW9kPzogc3RyaW5nOyBjaGFuZ2VmcmVxPzogc3RyaW5nOyBwcmlvcml0eT86IG51bWJlciB9W10pOiBzdHJpbmcge1xyXG4gIGNvbnN0IGl0ZW1zID0gdXJsc1xyXG4gICAgLm1hcCgodSkgPT4ge1xyXG4gICAgICBjb25zdCBsYXN0bW9kID0gdS5sYXN0bW9kID8gYDxsYXN0bW9kPiR7eG1sRXNjYXBlKHUubGFzdG1vZCl9PC9sYXN0bW9kPmAgOiBcIlwiO1xyXG4gICAgICBjb25zdCBjaGFuZ2VmcmVxID0gdS5jaGFuZ2VmcmVxID8gYDxjaGFuZ2VmcmVxPiR7eG1sRXNjYXBlKHUuY2hhbmdlZnJlcSl9PC9jaGFuZ2VmcmVxPmAgOiBcIlwiO1xyXG4gICAgICBjb25zdCBwcmlvcml0eSA9IHR5cGVvZiB1LnByaW9yaXR5ID09PSBcIm51bWJlclwiID8gYDxwcmlvcml0eT4ke3UucHJpb3JpdHkudG9GaXhlZCgxKX08L3ByaW9yaXR5PmAgOiBcIlwiO1xyXG4gICAgICByZXR1cm4gYDx1cmw+PGxvYz4ke3htbEVzY2FwZSh1LmxvYyl9PC9sb2M+JHtsYXN0bW9kfSR7Y2hhbmdlZnJlcX0ke3ByaW9yaXR5fTwvdXJsPmA7XHJcbiAgICB9KVxyXG4gICAgLmpvaW4oXCJcIik7XHJcblxyXG4gIHJldHVybiBgPD94bWwgdmVyc2lvbj1cIjEuMFwiIGVuY29kaW5nPVwiVVRGLThcIj8+YCArXHJcbiAgICBgPHVybHNldCB4bWxucz1cImh0dHA6Ly93d3cuc2l0ZW1hcHMub3JnL3NjaGVtYXMvc2l0ZW1hcC8wLjlcIj4ke2l0ZW1zfTwvdXJsc2V0PmA7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIocmVxOiBSZXEsIHJlczogUmVzKSB7XHJcbiAgY29uc3QgaG9zdCA9IGZpcnN0SGVhZGVyKHJlcS5oZWFkZXJzW1wieC1mb3J3YXJkZWQtaG9zdFwiXSkgfHwgZmlyc3RIZWFkZXIocmVxLmhlYWRlcnNbXCJob3N0XCJdKSB8fCBcImdyb3VwdGhlcmFweWVnLmNvbVwiO1xyXG4gIGNvbnN0IHByb3RvID1cclxuICAgIGZpcnN0SGVhZGVyKHJlcS5oZWFkZXJzW1wieC1mb3J3YXJkZWQtcHJvdG9cIl0pIHx8XHJcbiAgICAoaG9zdC5pbmNsdWRlcyhcImxvY2FsaG9zdFwiKSB8fCBob3N0LmluY2x1ZGVzKFwiMTI3LjAuMC4xXCIpID8gXCJodHRwXCIgOiBcImh0dHBzXCIpO1xyXG4gIGNvbnN0IGJhc2VVcmwgPSBgJHtwcm90b306Ly8ke2hvc3R9YDtcclxuXHJcbiAgY29uc3Qgbm93ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xyXG5cclxuICBjb25zdCB1cmxzOiB7IGxvYzogc3RyaW5nOyBsYXN0bW9kPzogc3RyaW5nOyBjaGFuZ2VmcmVxPzogc3RyaW5nOyBwcmlvcml0eT86IG51bWJlciB9W10gPSBbXHJcbiAgICB7IGxvYzogYCR7YmFzZVVybH0vYCwgY2hhbmdlZnJlcTogXCJkYWlseVwiLCBwcmlvcml0eTogMS4wLCBsYXN0bW9kOiBub3cgfSxcclxuICAgIHsgbG9jOiBgJHtiYXNlVXJsfS9yYWRpb2AsIGNoYW5nZWZyZXE6IFwid2Vla2x5XCIsIHByaW9yaXR5OiAwLjcsIGxhc3Rtb2Q6IG5vdyB9LFxyXG4gICAgeyBsb2M6IGAke2Jhc2VVcmx9L3JlbGVhc2VzYCwgY2hhbmdlZnJlcTogXCJkYWlseVwiLCBwcmlvcml0eTogMC45LCBsYXN0bW9kOiBub3cgfSxcclxuICAgIHsgbG9jOiBgJHtiYXNlVXJsfS9ldmVudHNgLCBjaGFuZ2VmcmVxOiBcImRhaWx5XCIsIHByaW9yaXR5OiAwLjksIGxhc3Rtb2Q6IG5vdyB9LFxyXG4gICAgeyBsb2M6IGAke2Jhc2VVcmx9L2FydGlzdHNgLCBjaGFuZ2VmcmVxOiBcIndlZWtseVwiLCBwcmlvcml0eTogMC44LCBsYXN0bW9kOiBub3cgfSxcclxuICAgIHsgbG9jOiBgJHtiYXNlVXJsfS92aWRlb3NgLCBjaGFuZ2VmcmVxOiBcIndlZWtseVwiLCBwcmlvcml0eTogMC44LCBsYXN0bW9kOiBub3cgfSxcclxuICAgIHsgbG9jOiBgJHtiYXNlVXJsfS9wbGF5bGlzdHNgLCBjaGFuZ2VmcmVxOiBcIndlZWtseVwiLCBwcmlvcml0eTogMC42LCBsYXN0bW9kOiBub3cgfSxcclxuICAgIHsgbG9jOiBgJHtiYXNlVXJsfS9hd2FyZHNgLCBjaGFuZ2VmcmVxOiBcIndlZWtseVwiLCBwcmlvcml0eTogMC42LCBsYXN0bW9kOiBub3cgfSxcclxuICAgIHsgbG9jOiBgJHtiYXNlVXJsfS9hYm91dGAsIGNoYW5nZWZyZXE6IFwieWVhcmx5XCIsIHByaW9yaXR5OiAwLjUsIGxhc3Rtb2Q6IG5vdyB9LFxyXG4gICAgeyBsb2M6IGAke2Jhc2VVcmx9L2NvbnRhY3RgLCBjaGFuZ2VmcmVxOiBcInllYXJseVwiLCBwcmlvcml0eTogMC41LCBsYXN0bW9kOiBub3cgfSxcclxuICAgIHsgbG9jOiBgJHtiYXNlVXJsfS9uZXdzYCwgY2hhbmdlZnJlcTogXCJkYWlseVwiLCBwcmlvcml0eTogMC44LCBsYXN0bW9kOiBub3cgfSxcclxuICAgIHsgbG9jOiBgJHtiYXNlVXJsfS9wcmVzc2AsIGNoYW5nZWZyZXE6IFwieWVhcmx5XCIsIHByaW9yaXR5OiAwLjQsIGxhc3Rtb2Q6IG5vdyB9LFxyXG4gICAgeyBsb2M6IGAke2Jhc2VVcmx9L2NhcmVlcnNgLCBjaGFuZ2VmcmVxOiBcIndlZWtseVwiLCBwcmlvcml0eTogMC41LCBsYXN0bW9kOiBub3cgfSxcclxuICAgIHsgbG9jOiBgJHtiYXNlVXJsfS90b3Vyc2AsIGNoYW5nZWZyZXE6IFwid2Vla2x5XCIsIHByaW9yaXR5OiAwLjUsIGxhc3Rtb2Q6IG5vdyB9LFxyXG4gICAgeyBsb2M6IGAke2Jhc2VVcmx9L3Rlcm1zYCwgY2hhbmdlZnJlcTogXCJ5ZWFybHlcIiwgcHJpb3JpdHk6IDAuMiwgbGFzdG1vZDogbm93IH0sXHJcbiAgICB7IGxvYzogYCR7YmFzZVVybH0vcHJpdmFjeWAsIGNoYW5nZWZyZXE6IFwieWVhcmx5XCIsIHByaW9yaXR5OiAwLjIsIGxhc3Rtb2Q6IG5vdyB9LFxyXG4gICAgeyBsb2M6IGAke2Jhc2VVcmx9L2Nvb2tpZXNgLCBjaGFuZ2VmcmVxOiBcInllYXJseVwiLCBwcmlvcml0eTogMC4yLCBsYXN0bW9kOiBub3cgfSxcclxuICBdO1xyXG5cclxuICBjb25zdCBzdXBhYmFzZVVybCA9IHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8IHByb2Nlc3MuZW52LlNVUEFCQVNFX1VSTDtcclxuICBjb25zdCBzdXBhYmFzZUFub25LZXkgPSBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZIHx8IHByb2Nlc3MuZW52LlNVUEFCQVNFX0FOT05fS0VZO1xyXG5cclxuICBpZiAoc3VwYWJhc2VVcmwgJiYgc3VwYWJhc2VBbm9uS2V5KSB7XHJcbiAgICBjb25zdCBzdXBhYmFzZSA9IGNyZWF0ZUNsaWVudChzdXBhYmFzZVVybCwgc3VwYWJhc2VBbm9uS2V5KTtcclxuICAgIGNvbnN0IHsgZGF0YSB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgICAgLmZyb20oXCJzdGF0aWNfcGFnZXNcIilcclxuICAgICAgLnNlbGVjdChcInNsdWcsIHVwZGF0ZWRfYXQsIGNyZWF0ZWRfYXRcIilcclxuICAgICAgLmVxKFwicHVibGlzaGVkXCIsIHRydWUpXHJcbiAgICAgIC5vcmRlcihcInVwZGF0ZWRfYXRcIiwgeyBhc2NlbmRpbmc6IGZhbHNlIH0pO1xyXG5cclxuICAgIGlmIChBcnJheS5pc0FycmF5KGRhdGEpKSB7XHJcbiAgICAgIGRhdGEuZm9yRWFjaCgocDogYW55KSA9PiB7XHJcbiAgICAgICAgY29uc3Qgc2x1ZyA9IHR5cGVvZiBwLnNsdWcgPT09IFwic3RyaW5nXCIgPyBwLnNsdWcgOiBcIlwiO1xyXG4gICAgICAgIGlmICghc2x1ZykgcmV0dXJuO1xyXG4gICAgICAgIGlmIChbXCJ0ZXJtc1wiLCBcInByaXZhY3lcIiwgXCJjb29raWVzXCJdLmluY2x1ZGVzKHNsdWcpKSByZXR1cm47XHJcbiAgICAgICAgY29uc3QgbGFzdG1vZFJhdyA9IHAudXBkYXRlZF9hdCB8fCBwLmNyZWF0ZWRfYXQ7XHJcbiAgICAgICAgY29uc3QgbGFzdG1vZCA9IGxhc3Rtb2RSYXcgPyBuZXcgRGF0ZShsYXN0bW9kUmF3KS50b0lTT1N0cmluZygpIDogdW5kZWZpbmVkO1xyXG4gICAgICAgIHVybHMucHVzaCh7IGxvYzogYCR7YmFzZVVybH0vJHtzbHVnfWAsIGNoYW5nZWZyZXE6IFwieWVhcmx5XCIsIHByaW9yaXR5OiAwLjMsIGxhc3Rtb2QgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgY29uc3QgeG1sID0gdXJsc2V0KHVybHMpO1xyXG5cclxuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSByZXMuc2V0SGVhZGVyKFwiWC1TaXRlbWFwLUNvdW50XCIsIFN0cmluZyh1cmxzLmxlbmd0aCkpO1xyXG5cclxuICByZXMuc3RhdHVzKDIwMCk7XHJcbiAgcmVzLnNldEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL3htbDsgY2hhcnNldD11dGYtOFwiKTtcclxuICByZXMuc2V0SGVhZGVyKFwiQ2FjaGUtQ29udHJvbFwiLCBcInB1YmxpYywgbWF4LWFnZT0wLCBzLW1heGFnZT0zNjAwXCIpO1xyXG4gIHJlcy5zZW5kKHhtbCk7XHJcbn1cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxERVZKQUNLXFxcXERvd25sb2Fkc1xcXFx2M1xcXFxhcGlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXERFVkpBQ0tcXFxcRG93bmxvYWRzXFxcXHYzXFxcXGFwaVxcXFxzaXRlbWFwLXBvc3RzLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9ERVZKQUNLL0Rvd25sb2Fkcy92My9hcGkvc2l0ZW1hcC1wb3N0cy50c1wiO2ltcG9ydCB7IGNyZWF0ZUNsaWVudCB9IGZyb20gXCJAc3VwYWJhc2Uvc3VwYWJhc2UtanNcIjtcclxuXHJcbnR5cGUgUmVxID0ge1xyXG4gIGhlYWRlcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IHN0cmluZ1tdIHwgdW5kZWZpbmVkPjtcclxufTtcclxuXHJcbnR5cGUgUmVzID0ge1xyXG4gIHN0YXR1czogKGNvZGU6IG51bWJlcikgPT4gUmVzO1xyXG4gIHNldEhlYWRlcjogKG5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZykgPT4gdm9pZDtcclxuICBzZW5kOiAoYm9keTogc3RyaW5nKSA9PiB2b2lkO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gZmlyc3RIZWFkZXIodmFsdWU6IHN0cmluZyB8IHN0cmluZ1tdIHwgdW5kZWZpbmVkKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcclxuICBpZiAoIXZhbHVlKSByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKSA/IHZhbHVlWzBdIDogdmFsdWU7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHhtbEVzY2FwZSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcclxuICByZXR1cm4gdmFsdWVcclxuICAgIC5yZXBsYWNlKC8mL2csIFwiJmFtcDtcIilcclxuICAgIC5yZXBsYWNlKC88L2csIFwiJmx0O1wiKVxyXG4gICAgLnJlcGxhY2UoLz4vZywgXCImZ3Q7XCIpXHJcbiAgICAucmVwbGFjZSgvXFxcIi9nLCBcIiZxdW90O1wiKVxyXG4gICAgLnJlcGxhY2UoLycvZywgXCImYXBvcztcIik7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHVybHNldFdpdGhJbWFnZXMoXHJcbiAgdXJsczogeyBsb2M6IHN0cmluZzsgbGFzdG1vZD86IHN0cmluZzsgaW1hZ2VzPzogeyBsb2M6IHN0cmluZzsgdGl0bGU/OiBzdHJpbmcgfVtdIH1bXVxyXG4pOiBzdHJpbmcge1xyXG4gIGNvbnN0IGl0ZW1zID0gdXJsc1xyXG4gICAgLm1hcCgodSkgPT4ge1xyXG4gICAgICBjb25zdCBsYXN0bW9kID0gdS5sYXN0bW9kID8gYDxsYXN0bW9kPiR7eG1sRXNjYXBlKHUubGFzdG1vZCl9PC9sYXN0bW9kPmAgOiBcIlwiO1xyXG4gICAgICBjb25zdCBpbWFnZXMgPSAodS5pbWFnZXMgfHwgW10pXHJcbiAgICAgICAgLmZpbHRlcigoaW1nKSA9PiBpbWcubG9jKVxyXG4gICAgICAgIC5tYXAoKGltZykgPT4ge1xyXG4gICAgICAgICAgY29uc3QgdGl0bGUgPSBpbWcudGl0bGUgPyBgPGltYWdlOnRpdGxlPiR7eG1sRXNjYXBlKGltZy50aXRsZSl9PC9pbWFnZTp0aXRsZT5gIDogXCJcIjtcclxuICAgICAgICAgIHJldHVybiBgPGltYWdlOmltYWdlPjxpbWFnZTpsb2M+JHt4bWxFc2NhcGUoaW1nLmxvYyl9PC9pbWFnZTpsb2M+JHt0aXRsZX08L2ltYWdlOmltYWdlPmA7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuam9pbihcIlwiKTtcclxuXHJcbiAgICAgIHJldHVybiBgPHVybD48bG9jPiR7eG1sRXNjYXBlKHUubG9jKX08L2xvYz4ke2xhc3Rtb2R9JHtpbWFnZXN9PC91cmw+YDtcclxuICAgIH0pXHJcbiAgICAuam9pbihcIlwiKTtcclxuXHJcbiAgcmV0dXJuIChcclxuICAgIGA8P3htbCB2ZXJzaW9uPVwiMS4wXCIgZW5jb2Rpbmc9XCJVVEYtOFwiPz5gICtcclxuICAgIGA8dXJsc2V0IHhtbG5zPVwiaHR0cDovL3d3dy5zaXRlbWFwcy5vcmcvc2NoZW1hcy9zaXRlbWFwLzAuOVwiIHhtbG5zOmltYWdlPVwiaHR0cDovL3d3dy5nb29nbGUuY29tL3NjaGVtYXMvc2l0ZW1hcC1pbWFnZS8xLjFcIj4ke2l0ZW1zfTwvdXJsc2V0PmBcclxuICApO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBoYW5kbGVyKHJlcTogUmVxLCByZXM6IFJlcykge1xyXG4gIGNvbnN0IGhvc3QgPSBmaXJzdEhlYWRlcihyZXEuaGVhZGVyc1tcIngtZm9yd2FyZGVkLWhvc3RcIl0pIHx8IGZpcnN0SGVhZGVyKHJlcS5oZWFkZXJzW1wiaG9zdFwiXSkgfHwgXCJncm91cHRoZXJhcHllZy5jb21cIjtcclxuICBjb25zdCBwcm90byA9IGZpcnN0SGVhZGVyKHJlcS5oZWFkZXJzW1wieC1mb3J3YXJkZWQtcHJvdG9cIl0pIHx8IChob3N0LmluY2x1ZGVzKFwibG9jYWxob3N0XCIpIHx8IGhvc3QuaW5jbHVkZXMoXCIxMjcuMC4wLjFcIikgPyBcImh0dHBcIiA6IFwiaHR0cHNcIik7XHJcbiAgY29uc3QgYmFzZVVybCA9IGAke3Byb3RvfTovLyR7aG9zdH1gO1xyXG5cclxuICBjb25zdCBzdXBhYmFzZVVybCA9IHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8IHByb2Nlc3MuZW52LlNVUEFCQVNFX1VSTDtcclxuICBjb25zdCBzdXBhYmFzZUFub25LZXkgPSBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZIHx8IHByb2Nlc3MuZW52LlNVUEFCQVNFX0FOT05fS0VZO1xyXG5cclxuICBpZiAoIXN1cGFiYXNlVXJsIHx8ICFzdXBhYmFzZUFub25LZXkpIHtcclxuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHJlcy5zZXRIZWFkZXIoXCJYLVNpdGVtYXAtUmVhc29uXCIsIFwibWlzc2luZ19zdXBhYmFzZV9lbnZcIik7XHJcbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSByZXMuc2V0SGVhZGVyKFwiWC1TaXRlbWFwLUNvdW50XCIsIFwiMFwiKTtcclxuICAgIHJlcy5zdGF0dXMoMjAwKTtcclxuICAgIHJlcy5zZXRIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi94bWw7IGNoYXJzZXQ9dXRmLThcIik7XHJcbiAgICByZXMuc2V0SGVhZGVyKFwiQ2FjaGUtQ29udHJvbFwiLCBcInB1YmxpYywgbWF4LWFnZT0wLCBzLW1heGFnZT0zNjAwXCIpO1xyXG4gICAgcmVzLnNlbmQodXJsc2V0V2l0aEltYWdlcyhbXSkpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgc3VwYWJhc2UgPSBjcmVhdGVDbGllbnQoc3VwYWJhc2VVcmwsIHN1cGFiYXNlQW5vbktleSk7XHJcbiAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgIC5mcm9tKFwicG9zdHNcIilcclxuICAgIC5zZWxlY3QoXCJzbHVnLCBwdWJsaXNoZWRfYXQsIGNyZWF0ZWRfYXQsIGNvdmVyX3VybCwgb2dfaW1hZ2VfdXJsLCB0aXRsZVwiKVxyXG4gICAgLmVxKFwicHVibGlzaGVkXCIsIHRydWUpXHJcbiAgICAub3JkZXIoXCJwdWJsaXNoZWRfYXRcIiwgeyBhc2NlbmRpbmc6IGZhbHNlIH0pO1xyXG5cclxuICBpZiAoZXJyb3IgfHwgIWRhdGEpIHtcclxuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHJlcy5zZXRIZWFkZXIoXCJYLVNpdGVtYXAtUmVhc29uXCIsIGVycm9yPy5tZXNzYWdlID8gYHN1cGFiYXNlX2Vycm9yOiR7U3RyaW5nKGVycm9yLm1lc3NhZ2UpLnNsaWNlKDAsIDEyMCl9YCA6IFwibm9fZGF0YVwiKTtcclxuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHJlcy5zZXRIZWFkZXIoXCJYLVNpdGVtYXAtQ291bnRcIiwgXCIwXCIpO1xyXG4gICAgcmVzLnN0YXR1cygyMDApO1xyXG4gICAgcmVzLnNldEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL3htbDsgY2hhcnNldD11dGYtOFwiKTtcclxuICAgIHJlcy5zZXRIZWFkZXIoXCJDYWNoZS1Db250cm9sXCIsIFwicHVibGljLCBtYXgtYWdlPTAsIHMtbWF4YWdlPTM2MDBcIik7XHJcbiAgICByZXMuc2VuZCh1cmxzZXRXaXRoSW1hZ2VzKFtdKSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCB1cmxzID0gZGF0YS5tYXAoKHA6IGFueSkgPT4ge1xyXG4gICAgY29uc3QgbGFzdG1vZCA9IHAucHVibGlzaGVkX2F0IHx8IHAuY3JlYXRlZF9hdDtcclxuICAgIGNvbnN0IGltZyA9IHAub2dfaW1hZ2VfdXJsIHx8IHAuY292ZXJfdXJsO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgbG9jOiBgJHtiYXNlVXJsfS9uZXdzLyR7cC5zbHVnfWAsXHJcbiAgICAgIGxhc3Rtb2Q6IGxhc3Rtb2QgPyBuZXcgRGF0ZShsYXN0bW9kKS50b0lTT1N0cmluZygpIDogdW5kZWZpbmVkLFxyXG4gICAgICBpbWFnZXM6IGltZyA/IFt7IGxvYzogaW1nLCB0aXRsZTogcC50aXRsZSB8fCB1bmRlZmluZWQgfV0gOiBbXSxcclxuICAgIH07XHJcbiAgfSk7XHJcblxyXG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHJlcy5zZXRIZWFkZXIoXCJYLVNpdGVtYXAtQ291bnRcIiwgU3RyaW5nKHVybHMubGVuZ3RoKSk7XHJcblxyXG4gIHJlcy5zdGF0dXMoMjAwKTtcclxuICByZXMuc2V0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24veG1sOyBjaGFyc2V0PXV0Zi04XCIpO1xyXG4gIHJlcy5zZXRIZWFkZXIoXCJDYWNoZS1Db250cm9sXCIsIFwicHVibGljLCBtYXgtYWdlPTAsIHMtbWF4YWdlPTM2MDBcIik7XHJcbiAgcmVzLnNlbmQodXJsc2V0V2l0aEltYWdlcyh1cmxzKSk7XHJcbn1cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxERVZKQUNLXFxcXERvd25sb2Fkc1xcXFx2M1xcXFxhcGlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXERFVkpBQ0tcXFxcRG93bmxvYWRzXFxcXHYzXFxcXGFwaVxcXFxzaXRlbWFwLXJlbGVhc2VzLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9ERVZKQUNLL0Rvd25sb2Fkcy92My9hcGkvc2l0ZW1hcC1yZWxlYXNlcy50c1wiO2ltcG9ydCB7IGNyZWF0ZUNsaWVudCB9IGZyb20gXCJAc3VwYWJhc2Uvc3VwYWJhc2UtanNcIjtcclxuXHJcbnR5cGUgUmVxID0ge1xyXG4gIGhlYWRlcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IHN0cmluZ1tdIHwgdW5kZWZpbmVkPjtcclxufTtcclxuXHJcbnR5cGUgUmVzID0ge1xyXG4gIHN0YXR1czogKGNvZGU6IG51bWJlcikgPT4gUmVzO1xyXG4gIHNldEhlYWRlcjogKG5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZykgPT4gdm9pZDtcclxuICBzZW5kOiAoYm9keTogc3RyaW5nKSA9PiB2b2lkO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gZmlyc3RIZWFkZXIodmFsdWU6IHN0cmluZyB8IHN0cmluZ1tdIHwgdW5kZWZpbmVkKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcclxuICBpZiAoIXZhbHVlKSByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKSA/IHZhbHVlWzBdIDogdmFsdWU7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHhtbEVzY2FwZSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcclxuICByZXR1cm4gdmFsdWVcclxuICAgIC5yZXBsYWNlKC8mL2csIFwiJmFtcDtcIilcclxuICAgIC5yZXBsYWNlKC88L2csIFwiJmx0O1wiKVxyXG4gICAgLnJlcGxhY2UoLz4vZywgXCImZ3Q7XCIpXHJcbiAgICAucmVwbGFjZSgvXFxcIi9nLCBcIiZxdW90O1wiKVxyXG4gICAgLnJlcGxhY2UoLycvZywgXCImYXBvcztcIik7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHVybHNldFdpdGhJbWFnZXMoXHJcbiAgdXJsczogeyBsb2M6IHN0cmluZzsgbGFzdG1vZD86IHN0cmluZzsgaW1hZ2VzPzogeyBsb2M6IHN0cmluZzsgdGl0bGU/OiBzdHJpbmcgfVtdIH1bXVxyXG4pOiBzdHJpbmcge1xyXG4gIGNvbnN0IGl0ZW1zID0gdXJsc1xyXG4gICAgLm1hcCgodSkgPT4ge1xyXG4gICAgICBjb25zdCBsYXN0bW9kID0gdS5sYXN0bW9kID8gYDxsYXN0bW9kPiR7eG1sRXNjYXBlKHUubGFzdG1vZCl9PC9sYXN0bW9kPmAgOiBcIlwiO1xyXG4gICAgICBjb25zdCBpbWFnZXMgPSAodS5pbWFnZXMgfHwgW10pXHJcbiAgICAgICAgLmZpbHRlcigoaW1nKSA9PiBpbWcubG9jKVxyXG4gICAgICAgIC5tYXAoKGltZykgPT4ge1xyXG4gICAgICAgICAgY29uc3QgdGl0bGUgPSBpbWcudGl0bGUgPyBgPGltYWdlOnRpdGxlPiR7eG1sRXNjYXBlKGltZy50aXRsZSl9PC9pbWFnZTp0aXRsZT5gIDogXCJcIjtcclxuICAgICAgICAgIHJldHVybiBgPGltYWdlOmltYWdlPjxpbWFnZTpsb2M+JHt4bWxFc2NhcGUoaW1nLmxvYyl9PC9pbWFnZTpsb2M+JHt0aXRsZX08L2ltYWdlOmltYWdlPmA7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuam9pbihcIlwiKTtcclxuXHJcbiAgICAgIHJldHVybiBgPHVybD48bG9jPiR7eG1sRXNjYXBlKHUubG9jKX08L2xvYz4ke2xhc3Rtb2R9JHtpbWFnZXN9PC91cmw+YDtcclxuICAgIH0pXHJcbiAgICAuam9pbihcIlwiKTtcclxuXHJcbiAgcmV0dXJuIChcclxuICAgIGA8P3htbCB2ZXJzaW9uPVwiMS4wXCIgZW5jb2Rpbmc9XCJVVEYtOFwiPz5gICtcclxuICAgIGA8dXJsc2V0IHhtbG5zPVwiaHR0cDovL3d3dy5zaXRlbWFwcy5vcmcvc2NoZW1hcy9zaXRlbWFwLzAuOVwiIHhtbG5zOmltYWdlPVwiaHR0cDovL3d3dy5nb29nbGUuY29tL3NjaGVtYXMvc2l0ZW1hcC1pbWFnZS8xLjFcIj4ke2l0ZW1zfTwvdXJsc2V0PmBcclxuICApO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBoYW5kbGVyKHJlcTogUmVxLCByZXM6IFJlcykge1xyXG4gIGNvbnN0IGhvc3QgPSBmaXJzdEhlYWRlcihyZXEuaGVhZGVyc1tcIngtZm9yd2FyZGVkLWhvc3RcIl0pIHx8IGZpcnN0SGVhZGVyKHJlcS5oZWFkZXJzW1wiaG9zdFwiXSkgfHwgXCJncm91cHRoZXJhcHllZy5jb21cIjtcclxuICBjb25zdCBwcm90byA9IGZpcnN0SGVhZGVyKHJlcS5oZWFkZXJzW1wieC1mb3J3YXJkZWQtcHJvdG9cIl0pIHx8IChob3N0LmluY2x1ZGVzKFwibG9jYWxob3N0XCIpIHx8IGhvc3QuaW5jbHVkZXMoXCIxMjcuMC4wLjFcIikgPyBcImh0dHBcIiA6IFwiaHR0cHNcIik7XHJcbiAgY29uc3QgYmFzZVVybCA9IGAke3Byb3RvfTovLyR7aG9zdH1gO1xyXG5cclxuICBjb25zdCBzdXBhYmFzZVVybCA9IHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8IHByb2Nlc3MuZW52LlNVUEFCQVNFX1VSTDtcclxuICBjb25zdCBzdXBhYmFzZUFub25LZXkgPSBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZIHx8IHByb2Nlc3MuZW52LlNVUEFCQVNFX0FOT05fS0VZO1xyXG5cclxuICBpZiAoIXN1cGFiYXNlVXJsIHx8ICFzdXBhYmFzZUFub25LZXkpIHtcclxuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHJlcy5zZXRIZWFkZXIoXCJYLVNpdGVtYXAtUmVhc29uXCIsIFwibWlzc2luZ19zdXBhYmFzZV9lbnZcIik7XHJcbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSByZXMuc2V0SGVhZGVyKFwiWC1TaXRlbWFwLUNvdW50XCIsIFwiMFwiKTtcclxuICAgIHJlcy5zdGF0dXMoMjAwKTtcclxuICAgIHJlcy5zZXRIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi94bWw7IGNoYXJzZXQ9dXRmLThcIik7XHJcbiAgICByZXMuc2V0SGVhZGVyKFwiQ2FjaGUtQ29udHJvbFwiLCBcInB1YmxpYywgbWF4LWFnZT0wLCBzLW1heGFnZT0zNjAwXCIpO1xyXG4gICAgcmVzLnNlbmQodXJsc2V0V2l0aEltYWdlcyhbXSkpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgc3VwYWJhc2UgPSBjcmVhdGVDbGllbnQoc3VwYWJhc2VVcmwsIHN1cGFiYXNlQW5vbktleSk7XHJcbiAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgIC5mcm9tKFwicmVsZWFzZXNcIilcclxuICAgIC5zZWxlY3QoXCJzbHVnLCBjcmVhdGVkX2F0LCBjb3Zlcl91cmwsIHRpdGxlLCByZWxlYXNlX2RhdGVcIilcclxuICAgIC5lcShcInB1Ymxpc2hlZFwiLCB0cnVlKVxyXG4gICAgLm9yZGVyKFwicmVsZWFzZV9kYXRlXCIsIHsgYXNjZW5kaW5nOiBmYWxzZSB9KTtcclxuXHJcbiAgaWYgKGVycm9yIHx8ICFkYXRhKSB7XHJcbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSByZXMuc2V0SGVhZGVyKFwiWC1TaXRlbWFwLVJlYXNvblwiLCBlcnJvcj8ubWVzc2FnZSA/IGBzdXBhYmFzZV9lcnJvcjoke1N0cmluZyhlcnJvci5tZXNzYWdlKS5zbGljZSgwLCAxMjApfWAgOiBcIm5vX2RhdGFcIik7XHJcbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSByZXMuc2V0SGVhZGVyKFwiWC1TaXRlbWFwLUNvdW50XCIsIFwiMFwiKTtcclxuICAgIHJlcy5zdGF0dXMoMjAwKTtcclxuICAgIHJlcy5zZXRIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi94bWw7IGNoYXJzZXQ9dXRmLThcIik7XHJcbiAgICByZXMuc2V0SGVhZGVyKFwiQ2FjaGUtQ29udHJvbFwiLCBcInB1YmxpYywgbWF4LWFnZT0wLCBzLW1heGFnZT0zNjAwXCIpO1xyXG4gICAgcmVzLnNlbmQodXJsc2V0V2l0aEltYWdlcyhbXSkpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgdXJscyA9IGRhdGEubWFwKChyOiBhbnkpID0+IHtcclxuICAgIGNvbnN0IGxhc3Rtb2QgPSByLnJlbGVhc2VfZGF0ZSB8fCByLmNyZWF0ZWRfYXQ7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBsb2M6IGAke2Jhc2VVcmx9L3JlbGVhc2VzLyR7ci5zbHVnfWAsXHJcbiAgICAgIGxhc3Rtb2Q6IGxhc3Rtb2QgPyBuZXcgRGF0ZShsYXN0bW9kKS50b0lTT1N0cmluZygpIDogdW5kZWZpbmVkLFxyXG4gICAgICBpbWFnZXM6IHIuY292ZXJfdXJsID8gW3sgbG9jOiByLmNvdmVyX3VybCwgdGl0bGU6IHIudGl0bGUgfHwgdW5kZWZpbmVkIH1dIDogW10sXHJcbiAgICB9O1xyXG4gIH0pO1xyXG5cclxuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSByZXMuc2V0SGVhZGVyKFwiWC1TaXRlbWFwLUNvdW50XCIsIFN0cmluZyh1cmxzLmxlbmd0aCkpO1xyXG5cclxuICByZXMuc3RhdHVzKDIwMCk7XHJcbiAgcmVzLnNldEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL3htbDsgY2hhcnNldD11dGYtOFwiKTtcclxuICByZXMuc2V0SGVhZGVyKFwiQ2FjaGUtQ29udHJvbFwiLCBcInB1YmxpYywgbWF4LWFnZT0wLCBzLW1heGFnZT0zNjAwXCIpO1xyXG4gIHJlcy5zZW5kKHVybHNldFdpdGhJbWFnZXModXJscykpO1xyXG59XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcREVWSkFDS1xcXFxEb3dubG9hZHNcXFxcdjNcXFxcYXBpXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxERVZKQUNLXFxcXERvd25sb2Fkc1xcXFx2M1xcXFxhcGlcXFxcc2l0ZW1hcC12aWRlb3MudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0RFVkpBQ0svRG93bmxvYWRzL3YzL2FwaS9zaXRlbWFwLXZpZGVvcy50c1wiO2ltcG9ydCB7IGNyZWF0ZUNsaWVudCB9IGZyb20gXCJAc3VwYWJhc2Uvc3VwYWJhc2UtanNcIjtcclxuXHJcbnR5cGUgUmVxID0ge1xyXG4gIGhlYWRlcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IHN0cmluZ1tdIHwgdW5kZWZpbmVkPjtcclxufTtcclxuXHJcbnR5cGUgUmVzID0ge1xyXG4gIHN0YXR1czogKGNvZGU6IG51bWJlcikgPT4gUmVzO1xyXG4gIHNldEhlYWRlcjogKG5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZykgPT4gdm9pZDtcclxuICBzZW5kOiAoYm9keTogc3RyaW5nKSA9PiB2b2lkO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gZmlyc3RIZWFkZXIodmFsdWU6IHN0cmluZyB8IHN0cmluZ1tdIHwgdW5kZWZpbmVkKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcclxuICBpZiAoIXZhbHVlKSByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKSA/IHZhbHVlWzBdIDogdmFsdWU7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHhtbEVzY2FwZSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcclxuICByZXR1cm4gdmFsdWVcclxuICAgIC5yZXBsYWNlKC8mL2csIFwiJmFtcDtcIilcclxuICAgIC5yZXBsYWNlKC88L2csIFwiJmx0O1wiKVxyXG4gICAgLnJlcGxhY2UoLz4vZywgXCImZ3Q7XCIpXHJcbiAgICAucmVwbGFjZSgvXFxcIi9nLCBcIiZxdW90O1wiKVxyXG4gICAgLnJlcGxhY2UoLycvZywgXCImYXBvcztcIik7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHVybHNldFdpdGhJbWFnZXNBbmRWaWRlb3MoXHJcbiAgdXJsczoge1xyXG4gICAgbG9jOiBzdHJpbmc7XHJcbiAgICBsYXN0bW9kPzogc3RyaW5nO1xyXG4gICAgaW1hZ2VzPzogeyBsb2M6IHN0cmluZzsgdGl0bGU/OiBzdHJpbmcgfVtdO1xyXG4gICAgdmlkZW9zPzoge1xyXG4gICAgICB0aHVtYm5haWxMb2M/OiBzdHJpbmc7XHJcbiAgICAgIHRpdGxlOiBzdHJpbmc7XHJcbiAgICAgIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xyXG4gICAgICBjb250ZW50TG9jPzogc3RyaW5nO1xyXG4gICAgICBwbGF5ZXJMb2M/OiBzdHJpbmc7XHJcbiAgICB9W107XHJcbiAgfVtdXHJcbik6IHN0cmluZyB7XHJcbiAgY29uc3QgaXRlbXMgPSB1cmxzXHJcbiAgICAubWFwKCh1KSA9PiB7XHJcbiAgICAgIGNvbnN0IGxhc3Rtb2QgPSB1Lmxhc3Rtb2QgPyBgPGxhc3Rtb2Q+JHt4bWxFc2NhcGUodS5sYXN0bW9kKX08L2xhc3Rtb2Q+YCA6IFwiXCI7XHJcblxyXG4gICAgICBjb25zdCBpbWFnZXMgPSAodS5pbWFnZXMgfHwgW10pXHJcbiAgICAgICAgLmZpbHRlcigoaW1nKSA9PiBpbWcubG9jKVxyXG4gICAgICAgIC5tYXAoKGltZykgPT4ge1xyXG4gICAgICAgICAgY29uc3QgdGl0bGUgPSBpbWcudGl0bGUgPyBgPGltYWdlOnRpdGxlPiR7eG1sRXNjYXBlKGltZy50aXRsZSl9PC9pbWFnZTp0aXRsZT5gIDogXCJcIjtcclxuICAgICAgICAgIHJldHVybiBgPGltYWdlOmltYWdlPjxpbWFnZTpsb2M+JHt4bWxFc2NhcGUoaW1nLmxvYyl9PC9pbWFnZTpsb2M+JHt0aXRsZX08L2ltYWdlOmltYWdlPmA7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuam9pbihcIlwiKTtcclxuXHJcbiAgICAgIGNvbnN0IHZpZGVvcyA9ICh1LnZpZGVvcyB8fCBbXSlcclxuICAgICAgICAubWFwKCh2KSA9PiB7XHJcbiAgICAgICAgICBjb25zdCB0aHVtYiA9IHYudGh1bWJuYWlsTG9jID8gYDx2aWRlbzp0aHVtYm5haWxfbG9jPiR7eG1sRXNjYXBlKHYudGh1bWJuYWlsTG9jKX08L3ZpZGVvOnRodW1ibmFpbF9sb2M+YCA6IFwiXCI7XHJcbiAgICAgICAgICBjb25zdCBkZXNjID0gdi5kZXNjcmlwdGlvbiA/IGA8dmlkZW86ZGVzY3JpcHRpb24+JHt4bWxFc2NhcGUodi5kZXNjcmlwdGlvbil9PC92aWRlbzpkZXNjcmlwdGlvbj5gIDogXCJcIjtcclxuICAgICAgICAgIGNvbnN0IGNvbnRlbnRMb2MgPSB2LmNvbnRlbnRMb2MgPyBgPHZpZGVvOmNvbnRlbnRfbG9jPiR7eG1sRXNjYXBlKHYuY29udGVudExvYyl9PC92aWRlbzpjb250ZW50X2xvYz5gIDogXCJcIjtcclxuICAgICAgICAgIGNvbnN0IHBsYXllckxvYyA9IHYucGxheWVyTG9jID8gYDx2aWRlbzpwbGF5ZXJfbG9jPiR7eG1sRXNjYXBlKHYucGxheWVyTG9jKX08L3ZpZGVvOnBsYXllcl9sb2M+YCA6IFwiXCI7XHJcbiAgICAgICAgICByZXR1cm4gYDx2aWRlbzp2aWRlbz4ke3RodW1ifTx2aWRlbzp0aXRsZT4ke3htbEVzY2FwZSh2LnRpdGxlKX08L3ZpZGVvOnRpdGxlPiR7ZGVzY30ke2NvbnRlbnRMb2N9JHtwbGF5ZXJMb2N9PC92aWRlbzp2aWRlbz5gO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmpvaW4oXCJcIik7XHJcblxyXG4gICAgICByZXR1cm4gYDx1cmw+PGxvYz4ke3htbEVzY2FwZSh1LmxvYyl9PC9sb2M+JHtsYXN0bW9kfSR7aW1hZ2VzfSR7dmlkZW9zfTwvdXJsPmA7XHJcbiAgICB9KVxyXG4gICAgLmpvaW4oXCJcIik7XHJcblxyXG4gIHJldHVybiAoXHJcbiAgICBgPD94bWwgdmVyc2lvbj1cIjEuMFwiIGVuY29kaW5nPVwiVVRGLThcIj8+YCArXHJcbiAgICBgPHVybHNldCB4bWxucz1cImh0dHA6Ly93d3cuc2l0ZW1hcHMub3JnL3NjaGVtYXMvc2l0ZW1hcC8wLjlcIiB4bWxuczppbWFnZT1cImh0dHA6Ly93d3cuZ29vZ2xlLmNvbS9zY2hlbWFzL3NpdGVtYXAtaW1hZ2UvMS4xXCIgeG1sbnM6dmlkZW89XCJodHRwOi8vd3d3Lmdvb2dsZS5jb20vc2NoZW1hcy9zaXRlbWFwLXZpZGVvLzEuMVwiPiR7aXRlbXN9PC91cmxzZXQ+YFxyXG4gICk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIocmVxOiBSZXEsIHJlczogUmVzKSB7XHJcbiAgY29uc3QgaG9zdCA9IGZpcnN0SGVhZGVyKHJlcS5oZWFkZXJzW1wieC1mb3J3YXJkZWQtaG9zdFwiXSkgfHwgZmlyc3RIZWFkZXIocmVxLmhlYWRlcnNbXCJob3N0XCJdKSB8fCBcImdyb3VwdGhlcmFweWVnLmNvbVwiO1xyXG4gIGNvbnN0IHByb3RvID0gZmlyc3RIZWFkZXIocmVxLmhlYWRlcnNbXCJ4LWZvcndhcmRlZC1wcm90b1wiXSkgfHwgKGhvc3QuaW5jbHVkZXMoXCJsb2NhbGhvc3RcIikgfHwgaG9zdC5pbmNsdWRlcyhcIjEyNy4wLjAuMVwiKSA/IFwiaHR0cFwiIDogXCJodHRwc1wiKTtcclxuICBjb25zdCBiYXNlVXJsID0gYCR7cHJvdG99Oi8vJHtob3N0fWA7XHJcblxyXG4gIGNvbnN0IHN1cGFiYXNlVXJsID0gcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkwgfHwgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfVVJMO1xyXG4gIGNvbnN0IHN1cGFiYXNlQW5vbktleSA9IHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfQU5PTl9LRVkgfHwgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfQU5PTl9LRVk7XHJcblxyXG4gIGlmICghc3VwYWJhc2VVcmwgfHwgIXN1cGFiYXNlQW5vbktleSkge1xyXG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgcmVzLnNldEhlYWRlcihcIlgtU2l0ZW1hcC1SZWFzb25cIiwgXCJtaXNzaW5nX3N1cGFiYXNlX2VudlwiKTtcclxuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHJlcy5zZXRIZWFkZXIoXCJYLVNpdGVtYXAtQ291bnRcIiwgXCIwXCIpO1xyXG4gICAgcmVzLnN0YXR1cygyMDApO1xyXG4gICAgcmVzLnNldEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL3htbDsgY2hhcnNldD11dGYtOFwiKTtcclxuICAgIHJlcy5zZXRIZWFkZXIoXCJDYWNoZS1Db250cm9sXCIsIFwicHVibGljLCBtYXgtYWdlPTAsIHMtbWF4YWdlPTM2MDBcIik7XHJcbiAgICByZXMuc2VuZCh1cmxzZXRXaXRoSW1hZ2VzQW5kVmlkZW9zKFtdKSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBzdXBhYmFzZSA9IGNyZWF0ZUNsaWVudChzdXBhYmFzZVVybCwgc3VwYWJhc2VBbm9uS2V5KTtcclxuICBjb25zdCB7IGRhdGEsIGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgLmZyb20oXCJ2aWRlb3NcIilcclxuICAgIC5zZWxlY3QoXCJzbHVnLCBjcmVhdGVkX2F0LCB0aXRsZSwgZGVzY3JpcHRpb24sIHRodW1ibmFpbF91cmwsIHZpZGVvX3VybCwgeW91dHViZV9pZCwgdmltZW9faWRcIilcclxuICAgIC5lcShcInB1Ymxpc2hlZFwiLCB0cnVlKVxyXG4gICAgLm9yZGVyKFwiY3JlYXRlZF9hdFwiLCB7IGFzY2VuZGluZzogZmFsc2UgfSk7XHJcblxyXG4gIGlmIChlcnJvciB8fCAhZGF0YSkge1xyXG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgcmVzLnNldEhlYWRlcihcIlgtU2l0ZW1hcC1SZWFzb25cIiwgZXJyb3I/Lm1lc3NhZ2UgPyBgc3VwYWJhc2VfZXJyb3I6JHtTdHJpbmcoZXJyb3IubWVzc2FnZSkuc2xpY2UoMCwgMTIwKX1gIDogXCJub19kYXRhXCIpO1xyXG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikgcmVzLnNldEhlYWRlcihcIlgtU2l0ZW1hcC1Db3VudFwiLCBcIjBcIik7XHJcbiAgICByZXMuc3RhdHVzKDIwMCk7XHJcbiAgICByZXMuc2V0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24veG1sOyBjaGFyc2V0PXV0Zi04XCIpO1xyXG4gICAgcmVzLnNldEhlYWRlcihcIkNhY2hlLUNvbnRyb2xcIiwgXCJwdWJsaWMsIG1heC1hZ2U9MCwgcy1tYXhhZ2U9MzYwMFwiKTtcclxuICAgIHJlcy5zZW5kKHVybHNldFdpdGhJbWFnZXNBbmRWaWRlb3MoW10pKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IG1vc3RSZWNlbnQgPSBkYXRhXHJcbiAgICAubWFwKCh2OiBhbnkpID0+IHYuY3JlYXRlZF9hdClcclxuICAgIC5maWx0ZXIoQm9vbGVhbilcclxuICAgIC5tYXAoKGQ6IGFueSkgPT4gbmV3IERhdGUoZCkuZ2V0VGltZSgpKVxyXG4gICAgLnJlZHVjZSgoYWNjOiBudW1iZXIsIHRzOiBudW1iZXIpID0+ICh0cyA+IGFjYyA/IHRzIDogYWNjKSwgMCk7XHJcblxyXG4gIGNvbnN0IHZpZGVvcyA9IGRhdGEubWFwKCh2OiBhbnkpID0+IHtcclxuICAgIGNvbnN0IHBsYXllckxvYyA9IHYueW91dHViZV9pZFxyXG4gICAgICA/IGBodHRwczovL3d3dy55b3V0dWJlLmNvbS93YXRjaD92PSR7di55b3V0dWJlX2lkfWBcclxuICAgICAgOiB2LnZpbWVvX2lkXHJcbiAgICAgICAgPyBgaHR0cHM6Ly92aW1lby5jb20vJHt2LnZpbWVvX2lkfWBcclxuICAgICAgICA6IHVuZGVmaW5lZDtcclxuICAgIGNvbnN0IGNvbnRlbnRMb2MgPSB2LnZpZGVvX3VybCB8fCB1bmRlZmluZWQ7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0aHVtYm5haWxMb2M6IHYudGh1bWJuYWlsX3VybCB8fCB1bmRlZmluZWQsXHJcbiAgICAgIHRpdGxlOiB2LnRpdGxlIHx8IFwiVmlkZW9cIixcclxuICAgICAgZGVzY3JpcHRpb246IHYuZGVzY3JpcHRpb24gfHwgdW5kZWZpbmVkLFxyXG4gICAgICBjb250ZW50TG9jLFxyXG4gICAgICBwbGF5ZXJMb2MsXHJcbiAgICB9O1xyXG4gIH0pO1xyXG5cclxuICBjb25zdCBpbWFnZXMgPSBkYXRhLnJlZHVjZSgoYWNjOiB7IGxvYzogc3RyaW5nOyB0aXRsZT86IHN0cmluZyB9W10sIHY6IGFueSkgPT4ge1xyXG4gICAgaWYgKCF2Py50aHVtYm5haWxfdXJsKSByZXR1cm4gYWNjO1xyXG4gICAgYWNjLnB1c2goe1xyXG4gICAgICBsb2M6IFN0cmluZyh2LnRodW1ibmFpbF91cmwpLFxyXG4gICAgICB0aXRsZTogdi50aXRsZSA/IFN0cmluZyh2LnRpdGxlKSA6IHVuZGVmaW5lZCxcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIGFjYztcclxuICB9LCBbXSk7XHJcblxyXG4gIGNvbnN0IHVybHMgPSBbXHJcbiAgICB7XHJcbiAgICAgIGxvYzogYCR7YmFzZVVybH0vdmlkZW9zYCxcclxuICAgICAgbGFzdG1vZDogbW9zdFJlY2VudCA/IG5ldyBEYXRlKG1vc3RSZWNlbnQpLnRvSVNPU3RyaW5nKCkgOiB1bmRlZmluZWQsXHJcbiAgICAgIGltYWdlcyxcclxuICAgICAgdmlkZW9zLFxyXG4gICAgfSxcclxuICBdO1xyXG5cclxuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSByZXMuc2V0SGVhZGVyKFwiWC1TaXRlbWFwLUNvdW50XCIsIFN0cmluZyh1cmxzLmxlbmd0aCkpO1xyXG5cclxuICByZXMuc3RhdHVzKDIwMCk7XHJcbiAgcmVzLnNldEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL3htbDsgY2hhcnNldD11dGYtOFwiKTtcclxuICByZXMuc2V0SGVhZGVyKFwiQ2FjaGUtQ29udHJvbFwiLCBcInB1YmxpYywgbWF4LWFnZT0wLCBzLW1heGFnZT0zNjAwXCIpO1xyXG4gIHJlcy5zZW5kKHVybHNldFdpdGhJbWFnZXNBbmRWaWRlb3ModXJscykpO1xyXG59XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcREVWSkFDS1xcXFxEb3dubG9hZHNcXFxcdjNcXFxcYXBpXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxERVZKQUNLXFxcXERvd25sb2Fkc1xcXFx2M1xcXFxhcGlcXFxccm9ib3RzLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9ERVZKQUNLL0Rvd25sb2Fkcy92My9hcGkvcm9ib3RzLnRzXCI7dHlwZSBSZXEgPSB7XHJcbiAgaGVhZGVyczogUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgc3RyaW5nW10gfCB1bmRlZmluZWQ+O1xyXG59O1xyXG5cclxudHlwZSBSZXMgPSB7XHJcbiAgc3RhdHVzOiAoY29kZTogbnVtYmVyKSA9PiBSZXM7XHJcbiAgc2V0SGVhZGVyOiAobmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKSA9PiB2b2lkO1xyXG4gIHNlbmQ6IChib2R5OiBzdHJpbmcpID0+IHZvaWQ7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBmaXJzdEhlYWRlcih2YWx1ZTogc3RyaW5nIHwgc3RyaW5nW10gfCB1bmRlZmluZWQpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xyXG4gIGlmICghdmFsdWUpIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpID8gdmFsdWVbMF0gOiB2YWx1ZTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihyZXE6IFJlcSwgcmVzOiBSZXMpIHtcclxuICBjb25zdCBob3N0ID0gZmlyc3RIZWFkZXIocmVxLmhlYWRlcnNbXCJ4LWZvcndhcmRlZC1ob3N0XCJdKSB8fCBmaXJzdEhlYWRlcihyZXEuaGVhZGVyc1tcImhvc3RcIl0pIHx8IFwiZ3JvdXB0aGVyYXB5ZWcuY29tXCI7XHJcbiAgY29uc3QgcHJvdG8gPSBmaXJzdEhlYWRlcihyZXEuaGVhZGVyc1tcIngtZm9yd2FyZGVkLXByb3RvXCJdKSB8fCBcImh0dHBzXCI7XHJcbiAgY29uc3QgYmFzZVVybCA9IGAke3Byb3RvfTovLyR7aG9zdH1gO1xyXG5cclxuICBjb25zdCBib2R5ID0gW1xyXG4gICAgXCJVc2VyLWFnZW50OiAqXCIsXHJcbiAgICBcIkFsbG93OiAvXCIsXHJcbiAgICBcIkRpc2FsbG93OiAvYWRtaW4vXCIsXHJcbiAgICBgU2l0ZW1hcDogJHtiYXNlVXJsfS9zaXRlbWFwLnhtbGAsXHJcbiAgICBcIlwiLFxyXG4gIF0uam9pbihcIlxcblwiKTtcclxuXHJcbiAgcmVzLnN0YXR1cygyMDApO1xyXG4gIHJlcy5zZXRIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJ0ZXh0L3BsYWluOyBjaGFyc2V0PXV0Zi04XCIpO1xyXG4gIHJlcy5zZXRIZWFkZXIoXCJDYWNoZS1Db250cm9sXCIsIFwicHVibGljLCBtYXgtYWdlPTAsIHMtbWF4YWdlPTM2MDBcIik7XHJcbiAgcmVzLnNlbmQoYm9keSk7XHJcbn1cclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFtUixTQUFTLGNBQWMsZUFBZTtBQUN6VCxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMscUJBQXFCOzs7QUNPOUIsU0FBUyxZQUFZLE9BQTBEO0FBQzdFLE1BQUksQ0FBQyxNQUFPLFFBQU87QUFDbkIsU0FBTyxNQUFNLFFBQVEsS0FBSyxJQUFJLE1BQU0sQ0FBQyxJQUFJO0FBQzNDO0FBRUEsU0FBUyxVQUFVLE9BQXVCO0FBQ3hDLFNBQU8sTUFDSixRQUFRLE1BQU0sT0FBTyxFQUNyQixRQUFRLE1BQU0sTUFBTSxFQUNwQixRQUFRLE1BQU0sTUFBTSxFQUNwQixRQUFRLE9BQU8sUUFBUSxFQUN2QixRQUFRLE1BQU0sUUFBUTtBQUMzQjtBQUVBLFNBQVMsYUFBYSxNQUFtRDtBQUN2RSxRQUFNLFFBQVEsS0FDWCxJQUFJLENBQUMsTUFBTTtBQUNWLFVBQU0sVUFBVSxFQUFFLFVBQVUsWUFBWSxVQUFVLEVBQUUsT0FBTyxDQUFDLGVBQWU7QUFDM0UsV0FBTyxpQkFBaUIsVUFBVSxFQUFFLEdBQUcsQ0FBQyxTQUFTLE9BQU87QUFBQSxFQUMxRCxDQUFDLEVBQ0EsS0FBSyxFQUFFO0FBRVYsU0FBTywyR0FDZ0UsS0FBSztBQUM5RTtBQUVBLGVBQU8sUUFBK0IsS0FBVSxLQUFVO0FBQ3hELFFBQU0sT0FBTyxZQUFZLElBQUksUUFBUSxrQkFBa0IsQ0FBQyxLQUFLLFlBQVksSUFBSSxRQUFRLE1BQU0sQ0FBQyxLQUFLO0FBQ2pHLFFBQU0sUUFDSixZQUFZLElBQUksUUFBUSxtQkFBbUIsQ0FBQyxNQUMzQyxLQUFLLFNBQVMsV0FBVyxLQUFLLEtBQUssU0FBUyxXQUFXLElBQUksU0FBUztBQUN2RSxRQUFNLFVBQVUsR0FBRyxLQUFLLE1BQU0sSUFBSTtBQUVsQyxRQUFNLE1BQU0sYUFBYTtBQUFBLElBQ3ZCLEVBQUUsS0FBSyxHQUFHLE9BQU8scUJBQXFCO0FBQUEsSUFDdEMsRUFBRSxLQUFLLEdBQUcsT0FBTyxxQkFBcUI7QUFBQSxJQUN0QyxFQUFFLEtBQUssR0FBRyxPQUFPLHdCQUF3QjtBQUFBLElBQ3pDLEVBQUUsS0FBSyxHQUFHLE9BQU8sc0JBQXNCO0FBQUEsSUFDdkMsRUFBRSxLQUFLLEdBQUcsT0FBTyx1QkFBdUI7QUFBQSxJQUN4QyxFQUFFLEtBQUssR0FBRyxPQUFPLHNCQUFzQjtBQUFBLEVBQ3pDLENBQUM7QUFFRCxNQUFJLFFBQVEsSUFBSSxhQUFhLGFBQWMsS0FBSSxVQUFVLG1CQUFtQixHQUFHO0FBRS9FLE1BQUksT0FBTyxHQUFHO0FBQ2QsTUFBSSxVQUFVLGdCQUFnQixnQ0FBZ0M7QUFDOUQsTUFBSSxVQUFVLGlCQUFpQixrQ0FBa0M7QUFDakUsTUFBSSxLQUFLLEdBQUc7QUFDZDs7O0FDMUR5UyxTQUFTLG9CQUFvQjtBQVl0VSxTQUFTQSxhQUFZLE9BQTBEO0FBQzdFLE1BQUksQ0FBQyxNQUFPLFFBQU87QUFDbkIsU0FBTyxNQUFNLFFBQVEsS0FBSyxJQUFJLE1BQU0sQ0FBQyxJQUFJO0FBQzNDO0FBRUEsU0FBU0MsV0FBVSxPQUF1QjtBQUN4QyxTQUFPLE1BQ0osUUFBUSxNQUFNLE9BQU8sRUFDckIsUUFBUSxNQUFNLE1BQU0sRUFDcEIsUUFBUSxNQUFNLE1BQU0sRUFDcEIsUUFBUSxPQUFPLFFBQVEsRUFDdkIsUUFBUSxNQUFNLFFBQVE7QUFDM0I7QUFFQSxTQUFTLGlCQUNQLE1BQ1E7QUFDUixRQUFNLFFBQVEsS0FDWCxJQUFJLENBQUMsTUFBTTtBQUNWLFVBQU0sVUFBVSxFQUFFLFVBQVUsWUFBWUEsV0FBVSxFQUFFLE9BQU8sQ0FBQyxlQUFlO0FBQzNFLFVBQU0sVUFBVSxFQUFFLFVBQVUsQ0FBQyxHQUMxQixPQUFPLENBQUMsUUFBUSxJQUFJLEdBQUcsRUFDdkIsSUFBSSxDQUFDLFFBQVE7QUFDWixZQUFNLFFBQVEsSUFBSSxRQUFRLGdCQUFnQkEsV0FBVSxJQUFJLEtBQUssQ0FBQyxtQkFBbUI7QUFDakYsYUFBTywyQkFBMkJBLFdBQVUsSUFBSSxHQUFHLENBQUMsZUFBZSxLQUFLO0FBQUEsSUFDMUUsQ0FBQyxFQUNBLEtBQUssRUFBRTtBQUVWLFdBQU8sYUFBYUEsV0FBVSxFQUFFLEdBQUcsQ0FBQyxTQUFTLE9BQU8sR0FBRyxNQUFNO0FBQUEsRUFDL0QsQ0FBQyxFQUNBLEtBQUssRUFBRTtBQUVWLFNBQ0UsbUtBQzZILEtBQUs7QUFFdEk7QUFFQSxlQUFPQyxTQUErQixLQUFVLEtBQVU7QUFDeEQsUUFBTSxPQUFPRixhQUFZLElBQUksUUFBUSxrQkFBa0IsQ0FBQyxLQUFLQSxhQUFZLElBQUksUUFBUSxNQUFNLENBQUMsS0FBSztBQUNqRyxRQUFNLFFBQVFBLGFBQVksSUFBSSxRQUFRLG1CQUFtQixDQUFDLE1BQU0sS0FBSyxTQUFTLFdBQVcsS0FBSyxLQUFLLFNBQVMsV0FBVyxJQUFJLFNBQVM7QUFDcEksUUFBTSxVQUFVLEdBQUcsS0FBSyxNQUFNLElBQUk7QUFFbEMsUUFBTSxjQUFjLFFBQVEsSUFBSSxxQkFBcUIsUUFBUSxJQUFJO0FBQ2pFLFFBQU0sa0JBQWtCLFFBQVEsSUFBSSwwQkFBMEIsUUFBUSxJQUFJO0FBRTFFLE1BQUksQ0FBQyxlQUFlLENBQUMsaUJBQWlCO0FBQ3BDLFFBQUksUUFBUSxJQUFJLGFBQWEsYUFBYyxLQUFJLFVBQVUsb0JBQW9CLHNCQUFzQjtBQUNuRyxRQUFJLFFBQVEsSUFBSSxhQUFhLGFBQWMsS0FBSSxVQUFVLG1CQUFtQixHQUFHO0FBQy9FLFFBQUksT0FBTyxHQUFHO0FBQ2QsUUFBSSxVQUFVLGdCQUFnQixnQ0FBZ0M7QUFDOUQsUUFBSSxVQUFVLGlCQUFpQixrQ0FBa0M7QUFDakUsUUFBSSxLQUFLLGlCQUFpQixDQUFDLENBQUMsQ0FBQztBQUM3QjtBQUFBLEVBQ0Y7QUFFQSxRQUFNLFdBQVcsYUFBYSxhQUFhLGVBQWU7QUFDMUQsUUFBTSxFQUFFLE1BQU0sTUFBTSxJQUFJLE1BQU0sU0FDM0IsS0FBSyxTQUFTLEVBQ2QsT0FBTyxtQ0FBbUMsRUFDMUMsTUFBTSxjQUFjLEVBQUUsV0FBVyxNQUFNLENBQUM7QUFFM0MsTUFBSSxTQUFTLENBQUMsTUFBTTtBQUNsQixRQUFJLFFBQVEsSUFBSSxhQUFhLGFBQWMsS0FBSSxVQUFVLG9CQUFvQixPQUFPLFVBQVUsa0JBQWtCLE9BQU8sTUFBTSxPQUFPLEVBQUUsTUFBTSxHQUFHLEdBQUcsQ0FBQyxLQUFLLFNBQVM7QUFDakssUUFBSSxRQUFRLElBQUksYUFBYSxhQUFjLEtBQUksVUFBVSxtQkFBbUIsR0FBRztBQUMvRSxRQUFJLE9BQU8sR0FBRztBQUNkLFFBQUksVUFBVSxnQkFBZ0IsZ0NBQWdDO0FBQzlELFFBQUksVUFBVSxpQkFBaUIsa0NBQWtDO0FBQ2pFLFFBQUksS0FBSyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7QUFDN0I7QUFBQSxFQUNGO0FBRUEsUUFBTSxPQUFPLEtBQUssSUFBSSxDQUFDLE1BQVc7QUFDaEMsVUFBTSxVQUFVLEVBQUU7QUFDbEIsV0FBTztBQUFBLE1BQ0wsS0FBSyxHQUFHLE9BQU8sWUFBWSxFQUFFLElBQUk7QUFBQSxNQUNqQyxTQUFTLFVBQVUsSUFBSSxLQUFLLE9BQU8sRUFBRSxZQUFZLElBQUk7QUFBQSxNQUNyRCxRQUFRLEVBQUUsWUFBWSxDQUFDLEVBQUUsS0FBSyxFQUFFLFdBQVcsT0FBTyxFQUFFLFFBQVEsT0FBVSxDQUFDLElBQUksQ0FBQztBQUFBLElBQzlFO0FBQUEsRUFDRixDQUFDO0FBRUQsTUFBSSxRQUFRLElBQUksYUFBYSxhQUFjLEtBQUksVUFBVSxtQkFBbUIsT0FBTyxLQUFLLE1BQU0sQ0FBQztBQUUvRixNQUFJLE9BQU8sR0FBRztBQUNkLE1BQUksVUFBVSxnQkFBZ0IsZ0NBQWdDO0FBQzlELE1BQUksVUFBVSxpQkFBaUIsa0NBQWtDO0FBQ2pFLE1BQUksS0FBSyxpQkFBaUIsSUFBSSxDQUFDO0FBQ2pDOzs7QUNuR3VTLFNBQVMsZ0JBQUFHLHFCQUFvQjtBQVlwVSxTQUFTQyxhQUFZLE9BQTBEO0FBQzdFLE1BQUksQ0FBQyxNQUFPLFFBQU87QUFDbkIsU0FBTyxNQUFNLFFBQVEsS0FBSyxJQUFJLE1BQU0sQ0FBQyxJQUFJO0FBQzNDO0FBRUEsU0FBU0MsV0FBVSxPQUF1QjtBQUN4QyxTQUFPLE1BQ0osUUFBUSxNQUFNLE9BQU8sRUFDckIsUUFBUSxNQUFNLE1BQU0sRUFDcEIsUUFBUSxNQUFNLE1BQU0sRUFDcEIsUUFBUSxPQUFPLFFBQVEsRUFDdkIsUUFBUSxNQUFNLFFBQVE7QUFDM0I7QUFFQSxTQUFTQyxrQkFDUCxNQUNRO0FBQ1IsUUFBTSxRQUFRLEtBQ1gsSUFBSSxDQUFDLE1BQU07QUFDVixVQUFNLFVBQVUsRUFBRSxVQUFVLFlBQVlELFdBQVUsRUFBRSxPQUFPLENBQUMsZUFBZTtBQUMzRSxVQUFNLFVBQVUsRUFBRSxVQUFVLENBQUMsR0FDMUIsT0FBTyxDQUFDLFFBQVEsSUFBSSxHQUFHLEVBQ3ZCLElBQUksQ0FBQyxRQUFRO0FBQ1osWUFBTSxRQUFRLElBQUksUUFBUSxnQkFBZ0JBLFdBQVUsSUFBSSxLQUFLLENBQUMsbUJBQW1CO0FBQ2pGLGFBQU8sMkJBQTJCQSxXQUFVLElBQUksR0FBRyxDQUFDLGVBQWUsS0FBSztBQUFBLElBQzFFLENBQUMsRUFDQSxLQUFLLEVBQUU7QUFFVixXQUFPLGFBQWFBLFdBQVUsRUFBRSxHQUFHLENBQUMsU0FBUyxPQUFPLEdBQUcsTUFBTTtBQUFBLEVBQy9ELENBQUMsRUFDQSxLQUFLLEVBQUU7QUFFVixTQUNFLG1LQUM2SCxLQUFLO0FBRXRJO0FBRUEsZUFBT0UsU0FBK0IsS0FBVSxLQUFVO0FBQ3hELFFBQU0sT0FBT0gsYUFBWSxJQUFJLFFBQVEsa0JBQWtCLENBQUMsS0FBS0EsYUFBWSxJQUFJLFFBQVEsTUFBTSxDQUFDLEtBQUs7QUFDakcsUUFBTSxRQUFRQSxhQUFZLElBQUksUUFBUSxtQkFBbUIsQ0FBQyxNQUFNLEtBQUssU0FBUyxXQUFXLEtBQUssS0FBSyxTQUFTLFdBQVcsSUFBSSxTQUFTO0FBQ3BJLFFBQU0sVUFBVSxHQUFHLEtBQUssTUFBTSxJQUFJO0FBRWxDLFFBQU0sY0FBYyxRQUFRLElBQUkscUJBQXFCLFFBQVEsSUFBSTtBQUNqRSxRQUFNLGtCQUFrQixRQUFRLElBQUksMEJBQTBCLFFBQVEsSUFBSTtBQUUxRSxNQUFJLENBQUMsZUFBZSxDQUFDLGlCQUFpQjtBQUNwQyxRQUFJLFFBQVEsSUFBSSxhQUFhLGFBQWMsS0FBSSxVQUFVLG9CQUFvQixzQkFBc0I7QUFDbkcsUUFBSSxRQUFRLElBQUksYUFBYSxhQUFjLEtBQUksVUFBVSxtQkFBbUIsR0FBRztBQUMvRSxRQUFJLE9BQU8sR0FBRztBQUNkLFFBQUksVUFBVSxnQkFBZ0IsZ0NBQWdDO0FBQzlELFFBQUksVUFBVSxpQkFBaUIsa0NBQWtDO0FBQ2pFLFFBQUksS0FBS0Usa0JBQWlCLENBQUMsQ0FBQyxDQUFDO0FBQzdCO0FBQUEsRUFDRjtBQUVBLFFBQU0sV0FBV0UsY0FBYSxhQUFhLGVBQWU7QUFDMUQsUUFBTSxFQUFFLE1BQU0sTUFBTSxJQUFJLE1BQU0sU0FDM0IsS0FBSyxRQUFRLEVBQ2IsT0FBTywwQ0FBMEMsRUFDakQsR0FBRyxhQUFhLElBQUksRUFDcEIsTUFBTSxRQUFRLEVBQUUsV0FBVyxNQUFNLENBQUM7QUFFckMsTUFBSSxTQUFTLENBQUMsTUFBTTtBQUNsQixRQUFJLFFBQVEsSUFBSSxhQUFhLGFBQWMsS0FBSSxVQUFVLG9CQUFvQixPQUFPLFVBQVUsa0JBQWtCLE9BQU8sTUFBTSxPQUFPLEVBQUUsTUFBTSxHQUFHLEdBQUcsQ0FBQyxLQUFLLFNBQVM7QUFDakssUUFBSSxRQUFRLElBQUksYUFBYSxhQUFjLEtBQUksVUFBVSxtQkFBbUIsR0FBRztBQUMvRSxRQUFJLE9BQU8sR0FBRztBQUNkLFFBQUksVUFBVSxnQkFBZ0IsZ0NBQWdDO0FBQzlELFFBQUksVUFBVSxpQkFBaUIsa0NBQWtDO0FBQ2pFLFFBQUksS0FBS0Ysa0JBQWlCLENBQUMsQ0FBQyxDQUFDO0FBQzdCO0FBQUEsRUFDRjtBQUVBLFFBQU0sT0FBTyxLQUFLLElBQUksQ0FBQyxNQUFXO0FBQ2hDLFVBQU0sVUFBVSxFQUFFLFFBQVEsRUFBRTtBQUM1QixXQUFPO0FBQUEsTUFDTCxLQUFLLEdBQUcsT0FBTyxXQUFXLEVBQUUsSUFBSTtBQUFBLE1BQ2hDLFNBQVMsVUFBVSxJQUFJLEtBQUssT0FBTyxFQUFFLFlBQVksSUFBSTtBQUFBLE1BQ3JELFFBQVEsRUFBRSxZQUFZLENBQUMsRUFBRSxLQUFLLEVBQUUsV0FBVyxPQUFPLEVBQUUsU0FBUyxPQUFVLENBQUMsSUFBSSxDQUFDO0FBQUEsSUFDL0U7QUFBQSxFQUNGLENBQUM7QUFFRCxNQUFJLFFBQVEsSUFBSSxhQUFhLGFBQWMsS0FBSSxVQUFVLG1CQUFtQixPQUFPLEtBQUssTUFBTSxDQUFDO0FBRS9GLE1BQUksT0FBTyxHQUFHO0FBQ2QsTUFBSSxVQUFVLGdCQUFnQixnQ0FBZ0M7QUFDOUQsTUFBSSxVQUFVLGlCQUFpQixrQ0FBa0M7QUFDakUsTUFBSSxLQUFLQSxrQkFBaUIsSUFBSSxDQUFDO0FBQ2pDOzs7QUNwR3FTLFNBQVMsZ0JBQUFHLHFCQUFvQjtBQVlsVSxTQUFTQyxhQUFZLE9BQTBEO0FBQzdFLE1BQUksQ0FBQyxNQUFPLFFBQU87QUFDbkIsU0FBTyxNQUFNLFFBQVEsS0FBSyxJQUFJLE1BQU0sQ0FBQyxJQUFJO0FBQzNDO0FBRUEsU0FBU0MsV0FBVSxPQUF1QjtBQUN4QyxTQUFPLE1BQ0osUUFBUSxNQUFNLE9BQU8sRUFDckIsUUFBUSxNQUFNLE1BQU0sRUFDcEIsUUFBUSxNQUFNLE1BQU0sRUFDcEIsUUFBUSxPQUFPLFFBQVEsRUFDdkIsUUFBUSxNQUFNLFFBQVE7QUFDM0I7QUFFQSxTQUFTLE9BQU8sTUFBMkY7QUFDekcsUUFBTSxRQUFRLEtBQ1gsSUFBSSxDQUFDLE1BQU07QUFDVixVQUFNLFVBQVUsRUFBRSxVQUFVLFlBQVlBLFdBQVUsRUFBRSxPQUFPLENBQUMsZUFBZTtBQUMzRSxVQUFNLGFBQWEsRUFBRSxhQUFhLGVBQWVBLFdBQVUsRUFBRSxVQUFVLENBQUMsa0JBQWtCO0FBQzFGLFVBQU0sV0FBVyxPQUFPLEVBQUUsYUFBYSxXQUFXLGFBQWEsRUFBRSxTQUFTLFFBQVEsQ0FBQyxDQUFDLGdCQUFnQjtBQUNwRyxXQUFPLGFBQWFBLFdBQVUsRUFBRSxHQUFHLENBQUMsU0FBUyxPQUFPLEdBQUcsVUFBVSxHQUFHLFFBQVE7QUFBQSxFQUM5RSxDQUFDLEVBQ0EsS0FBSyxFQUFFO0FBRVYsU0FBTyxxR0FDMEQsS0FBSztBQUN4RTtBQUVBLGVBQU9DLFNBQStCLEtBQVUsS0FBVTtBQUN4RCxRQUFNLE9BQU9GLGFBQVksSUFBSSxRQUFRLGtCQUFrQixDQUFDLEtBQUtBLGFBQVksSUFBSSxRQUFRLE1BQU0sQ0FBQyxLQUFLO0FBQ2pHLFFBQU0sUUFDSkEsYUFBWSxJQUFJLFFBQVEsbUJBQW1CLENBQUMsTUFDM0MsS0FBSyxTQUFTLFdBQVcsS0FBSyxLQUFLLFNBQVMsV0FBVyxJQUFJLFNBQVM7QUFDdkUsUUFBTSxVQUFVLEdBQUcsS0FBSyxNQUFNLElBQUk7QUFFbEMsUUFBTSxPQUFNLG9CQUFJLEtBQUssR0FBRSxZQUFZO0FBRW5DLFFBQU0sT0FBb0Y7QUFBQSxJQUN4RixFQUFFLEtBQUssR0FBRyxPQUFPLEtBQUssWUFBWSxTQUFTLFVBQVUsR0FBSyxTQUFTLElBQUk7QUFBQSxJQUN2RSxFQUFFLEtBQUssR0FBRyxPQUFPLFVBQVUsWUFBWSxVQUFVLFVBQVUsS0FBSyxTQUFTLElBQUk7QUFBQSxJQUM3RSxFQUFFLEtBQUssR0FBRyxPQUFPLGFBQWEsWUFBWSxTQUFTLFVBQVUsS0FBSyxTQUFTLElBQUk7QUFBQSxJQUMvRSxFQUFFLEtBQUssR0FBRyxPQUFPLFdBQVcsWUFBWSxTQUFTLFVBQVUsS0FBSyxTQUFTLElBQUk7QUFBQSxJQUM3RSxFQUFFLEtBQUssR0FBRyxPQUFPLFlBQVksWUFBWSxVQUFVLFVBQVUsS0FBSyxTQUFTLElBQUk7QUFBQSxJQUMvRSxFQUFFLEtBQUssR0FBRyxPQUFPLFdBQVcsWUFBWSxVQUFVLFVBQVUsS0FBSyxTQUFTLElBQUk7QUFBQSxJQUM5RSxFQUFFLEtBQUssR0FBRyxPQUFPLGNBQWMsWUFBWSxVQUFVLFVBQVUsS0FBSyxTQUFTLElBQUk7QUFBQSxJQUNqRixFQUFFLEtBQUssR0FBRyxPQUFPLFdBQVcsWUFBWSxVQUFVLFVBQVUsS0FBSyxTQUFTLElBQUk7QUFBQSxJQUM5RSxFQUFFLEtBQUssR0FBRyxPQUFPLFVBQVUsWUFBWSxVQUFVLFVBQVUsS0FBSyxTQUFTLElBQUk7QUFBQSxJQUM3RSxFQUFFLEtBQUssR0FBRyxPQUFPLFlBQVksWUFBWSxVQUFVLFVBQVUsS0FBSyxTQUFTLElBQUk7QUFBQSxJQUMvRSxFQUFFLEtBQUssR0FBRyxPQUFPLFNBQVMsWUFBWSxTQUFTLFVBQVUsS0FBSyxTQUFTLElBQUk7QUFBQSxJQUMzRSxFQUFFLEtBQUssR0FBRyxPQUFPLFVBQVUsWUFBWSxVQUFVLFVBQVUsS0FBSyxTQUFTLElBQUk7QUFBQSxJQUM3RSxFQUFFLEtBQUssR0FBRyxPQUFPLFlBQVksWUFBWSxVQUFVLFVBQVUsS0FBSyxTQUFTLElBQUk7QUFBQSxJQUMvRSxFQUFFLEtBQUssR0FBRyxPQUFPLFVBQVUsWUFBWSxVQUFVLFVBQVUsS0FBSyxTQUFTLElBQUk7QUFBQSxJQUM3RSxFQUFFLEtBQUssR0FBRyxPQUFPLFVBQVUsWUFBWSxVQUFVLFVBQVUsS0FBSyxTQUFTLElBQUk7QUFBQSxJQUM3RSxFQUFFLEtBQUssR0FBRyxPQUFPLFlBQVksWUFBWSxVQUFVLFVBQVUsS0FBSyxTQUFTLElBQUk7QUFBQSxJQUMvRSxFQUFFLEtBQUssR0FBRyxPQUFPLFlBQVksWUFBWSxVQUFVLFVBQVUsS0FBSyxTQUFTLElBQUk7QUFBQSxFQUNqRjtBQUVBLFFBQU0sY0FBYyxRQUFRLElBQUkscUJBQXFCLFFBQVEsSUFBSTtBQUNqRSxRQUFNLGtCQUFrQixRQUFRLElBQUksMEJBQTBCLFFBQVEsSUFBSTtBQUUxRSxNQUFJLGVBQWUsaUJBQWlCO0FBQ2xDLFVBQU0sV0FBV0csY0FBYSxhQUFhLGVBQWU7QUFDMUQsVUFBTSxFQUFFLEtBQUssSUFBSSxNQUFNLFNBQ3BCLEtBQUssY0FBYyxFQUNuQixPQUFPLDhCQUE4QixFQUNyQyxHQUFHLGFBQWEsSUFBSSxFQUNwQixNQUFNLGNBQWMsRUFBRSxXQUFXLE1BQU0sQ0FBQztBQUUzQyxRQUFJLE1BQU0sUUFBUSxJQUFJLEdBQUc7QUFDdkIsV0FBSyxRQUFRLENBQUMsTUFBVztBQUN2QixjQUFNLE9BQU8sT0FBTyxFQUFFLFNBQVMsV0FBVyxFQUFFLE9BQU87QUFDbkQsWUFBSSxDQUFDLEtBQU07QUFDWCxZQUFJLENBQUMsU0FBUyxXQUFXLFNBQVMsRUFBRSxTQUFTLElBQUksRUFBRztBQUNwRCxjQUFNLGFBQWEsRUFBRSxjQUFjLEVBQUU7QUFDckMsY0FBTSxVQUFVLGFBQWEsSUFBSSxLQUFLLFVBQVUsRUFBRSxZQUFZLElBQUk7QUFDbEUsYUFBSyxLQUFLLEVBQUUsS0FBSyxHQUFHLE9BQU8sSUFBSSxJQUFJLElBQUksWUFBWSxVQUFVLFVBQVUsS0FBSyxRQUFRLENBQUM7QUFBQSxNQUN2RixDQUFDO0FBQUEsSUFDSDtBQUFBLEVBQ0Y7QUFFQSxRQUFNLE1BQU0sT0FBTyxJQUFJO0FBRXZCLE1BQUksUUFBUSxJQUFJLGFBQWEsYUFBYyxLQUFJLFVBQVUsbUJBQW1CLE9BQU8sS0FBSyxNQUFNLENBQUM7QUFFL0YsTUFBSSxPQUFPLEdBQUc7QUFDZCxNQUFJLFVBQVUsZ0JBQWdCLGdDQUFnQztBQUM5RCxNQUFJLFVBQVUsaUJBQWlCLGtDQUFrQztBQUNqRSxNQUFJLEtBQUssR0FBRztBQUNkOzs7QUNwR3FTLFNBQVMsZ0JBQUFDLHFCQUFvQjtBQVlsVSxTQUFTQyxhQUFZLE9BQTBEO0FBQzdFLE1BQUksQ0FBQyxNQUFPLFFBQU87QUFDbkIsU0FBTyxNQUFNLFFBQVEsS0FBSyxJQUFJLE1BQU0sQ0FBQyxJQUFJO0FBQzNDO0FBRUEsU0FBU0MsV0FBVSxPQUF1QjtBQUN4QyxTQUFPLE1BQ0osUUFBUSxNQUFNLE9BQU8sRUFDckIsUUFBUSxNQUFNLE1BQU0sRUFDcEIsUUFBUSxNQUFNLE1BQU0sRUFDcEIsUUFBUSxPQUFPLFFBQVEsRUFDdkIsUUFBUSxNQUFNLFFBQVE7QUFDM0I7QUFFQSxTQUFTQyxrQkFDUCxNQUNRO0FBQ1IsUUFBTSxRQUFRLEtBQ1gsSUFBSSxDQUFDLE1BQU07QUFDVixVQUFNLFVBQVUsRUFBRSxVQUFVLFlBQVlELFdBQVUsRUFBRSxPQUFPLENBQUMsZUFBZTtBQUMzRSxVQUFNLFVBQVUsRUFBRSxVQUFVLENBQUMsR0FDMUIsT0FBTyxDQUFDLFFBQVEsSUFBSSxHQUFHLEVBQ3ZCLElBQUksQ0FBQyxRQUFRO0FBQ1osWUFBTSxRQUFRLElBQUksUUFBUSxnQkFBZ0JBLFdBQVUsSUFBSSxLQUFLLENBQUMsbUJBQW1CO0FBQ2pGLGFBQU8sMkJBQTJCQSxXQUFVLElBQUksR0FBRyxDQUFDLGVBQWUsS0FBSztBQUFBLElBQzFFLENBQUMsRUFDQSxLQUFLLEVBQUU7QUFFVixXQUFPLGFBQWFBLFdBQVUsRUFBRSxHQUFHLENBQUMsU0FBUyxPQUFPLEdBQUcsTUFBTTtBQUFBLEVBQy9ELENBQUMsRUFDQSxLQUFLLEVBQUU7QUFFVixTQUNFLG1LQUM2SCxLQUFLO0FBRXRJO0FBRUEsZUFBT0UsU0FBK0IsS0FBVSxLQUFVO0FBQ3hELFFBQU0sT0FBT0gsYUFBWSxJQUFJLFFBQVEsa0JBQWtCLENBQUMsS0FBS0EsYUFBWSxJQUFJLFFBQVEsTUFBTSxDQUFDLEtBQUs7QUFDakcsUUFBTSxRQUFRQSxhQUFZLElBQUksUUFBUSxtQkFBbUIsQ0FBQyxNQUFNLEtBQUssU0FBUyxXQUFXLEtBQUssS0FBSyxTQUFTLFdBQVcsSUFBSSxTQUFTO0FBQ3BJLFFBQU0sVUFBVSxHQUFHLEtBQUssTUFBTSxJQUFJO0FBRWxDLFFBQU0sY0FBYyxRQUFRLElBQUkscUJBQXFCLFFBQVEsSUFBSTtBQUNqRSxRQUFNLGtCQUFrQixRQUFRLElBQUksMEJBQTBCLFFBQVEsSUFBSTtBQUUxRSxNQUFJLENBQUMsZUFBZSxDQUFDLGlCQUFpQjtBQUNwQyxRQUFJLFFBQVEsSUFBSSxhQUFhLGFBQWMsS0FBSSxVQUFVLG9CQUFvQixzQkFBc0I7QUFDbkcsUUFBSSxRQUFRLElBQUksYUFBYSxhQUFjLEtBQUksVUFBVSxtQkFBbUIsR0FBRztBQUMvRSxRQUFJLE9BQU8sR0FBRztBQUNkLFFBQUksVUFBVSxnQkFBZ0IsZ0NBQWdDO0FBQzlELFFBQUksVUFBVSxpQkFBaUIsa0NBQWtDO0FBQ2pFLFFBQUksS0FBS0Usa0JBQWlCLENBQUMsQ0FBQyxDQUFDO0FBQzdCO0FBQUEsRUFDRjtBQUVBLFFBQU0sV0FBV0UsY0FBYSxhQUFhLGVBQWU7QUFDMUQsUUFBTSxFQUFFLE1BQU0sTUFBTSxJQUFJLE1BQU0sU0FDM0IsS0FBSyxPQUFPLEVBQ1osT0FBTyxnRUFBZ0UsRUFDdkUsR0FBRyxhQUFhLElBQUksRUFDcEIsTUFBTSxnQkFBZ0IsRUFBRSxXQUFXLE1BQU0sQ0FBQztBQUU3QyxNQUFJLFNBQVMsQ0FBQyxNQUFNO0FBQ2xCLFFBQUksUUFBUSxJQUFJLGFBQWEsYUFBYyxLQUFJLFVBQVUsb0JBQW9CLE9BQU8sVUFBVSxrQkFBa0IsT0FBTyxNQUFNLE9BQU8sRUFBRSxNQUFNLEdBQUcsR0FBRyxDQUFDLEtBQUssU0FBUztBQUNqSyxRQUFJLFFBQVEsSUFBSSxhQUFhLGFBQWMsS0FBSSxVQUFVLG1CQUFtQixHQUFHO0FBQy9FLFFBQUksT0FBTyxHQUFHO0FBQ2QsUUFBSSxVQUFVLGdCQUFnQixnQ0FBZ0M7QUFDOUQsUUFBSSxVQUFVLGlCQUFpQixrQ0FBa0M7QUFDakUsUUFBSSxLQUFLRixrQkFBaUIsQ0FBQyxDQUFDLENBQUM7QUFDN0I7QUFBQSxFQUNGO0FBRUEsUUFBTSxPQUFPLEtBQUssSUFBSSxDQUFDLE1BQVc7QUFDaEMsVUFBTSxVQUFVLEVBQUUsZ0JBQWdCLEVBQUU7QUFDcEMsVUFBTSxNQUFNLEVBQUUsZ0JBQWdCLEVBQUU7QUFDaEMsV0FBTztBQUFBLE1BQ0wsS0FBSyxHQUFHLE9BQU8sU0FBUyxFQUFFLElBQUk7QUFBQSxNQUM5QixTQUFTLFVBQVUsSUFBSSxLQUFLLE9BQU8sRUFBRSxZQUFZLElBQUk7QUFBQSxNQUNyRCxRQUFRLE1BQU0sQ0FBQyxFQUFFLEtBQUssS0FBSyxPQUFPLEVBQUUsU0FBUyxPQUFVLENBQUMsSUFBSSxDQUFDO0FBQUEsSUFDL0Q7QUFBQSxFQUNGLENBQUM7QUFFRCxNQUFJLFFBQVEsSUFBSSxhQUFhLGFBQWMsS0FBSSxVQUFVLG1CQUFtQixPQUFPLEtBQUssTUFBTSxDQUFDO0FBRS9GLE1BQUksT0FBTyxHQUFHO0FBQ2QsTUFBSSxVQUFVLGdCQUFnQixnQ0FBZ0M7QUFDOUQsTUFBSSxVQUFVLGlCQUFpQixrQ0FBa0M7QUFDakUsTUFBSSxLQUFLQSxrQkFBaUIsSUFBSSxDQUFDO0FBQ2pDOzs7QUNyRzJTLFNBQVMsZ0JBQUFHLHFCQUFvQjtBQVl4VSxTQUFTQyxhQUFZLE9BQTBEO0FBQzdFLE1BQUksQ0FBQyxNQUFPLFFBQU87QUFDbkIsU0FBTyxNQUFNLFFBQVEsS0FBSyxJQUFJLE1BQU0sQ0FBQyxJQUFJO0FBQzNDO0FBRUEsU0FBU0MsV0FBVSxPQUF1QjtBQUN4QyxTQUFPLE1BQ0osUUFBUSxNQUFNLE9BQU8sRUFDckIsUUFBUSxNQUFNLE1BQU0sRUFDcEIsUUFBUSxNQUFNLE1BQU0sRUFDcEIsUUFBUSxPQUFPLFFBQVEsRUFDdkIsUUFBUSxNQUFNLFFBQVE7QUFDM0I7QUFFQSxTQUFTQyxrQkFDUCxNQUNRO0FBQ1IsUUFBTSxRQUFRLEtBQ1gsSUFBSSxDQUFDLE1BQU07QUFDVixVQUFNLFVBQVUsRUFBRSxVQUFVLFlBQVlELFdBQVUsRUFBRSxPQUFPLENBQUMsZUFBZTtBQUMzRSxVQUFNLFVBQVUsRUFBRSxVQUFVLENBQUMsR0FDMUIsT0FBTyxDQUFDLFFBQVEsSUFBSSxHQUFHLEVBQ3ZCLElBQUksQ0FBQyxRQUFRO0FBQ1osWUFBTSxRQUFRLElBQUksUUFBUSxnQkFBZ0JBLFdBQVUsSUFBSSxLQUFLLENBQUMsbUJBQW1CO0FBQ2pGLGFBQU8sMkJBQTJCQSxXQUFVLElBQUksR0FBRyxDQUFDLGVBQWUsS0FBSztBQUFBLElBQzFFLENBQUMsRUFDQSxLQUFLLEVBQUU7QUFFVixXQUFPLGFBQWFBLFdBQVUsRUFBRSxHQUFHLENBQUMsU0FBUyxPQUFPLEdBQUcsTUFBTTtBQUFBLEVBQy9ELENBQUMsRUFDQSxLQUFLLEVBQUU7QUFFVixTQUNFLG1LQUM2SCxLQUFLO0FBRXRJO0FBRUEsZUFBT0UsU0FBK0IsS0FBVSxLQUFVO0FBQ3hELFFBQU0sT0FBT0gsYUFBWSxJQUFJLFFBQVEsa0JBQWtCLENBQUMsS0FBS0EsYUFBWSxJQUFJLFFBQVEsTUFBTSxDQUFDLEtBQUs7QUFDakcsUUFBTSxRQUFRQSxhQUFZLElBQUksUUFBUSxtQkFBbUIsQ0FBQyxNQUFNLEtBQUssU0FBUyxXQUFXLEtBQUssS0FBSyxTQUFTLFdBQVcsSUFBSSxTQUFTO0FBQ3BJLFFBQU0sVUFBVSxHQUFHLEtBQUssTUFBTSxJQUFJO0FBRWxDLFFBQU0sY0FBYyxRQUFRLElBQUkscUJBQXFCLFFBQVEsSUFBSTtBQUNqRSxRQUFNLGtCQUFrQixRQUFRLElBQUksMEJBQTBCLFFBQVEsSUFBSTtBQUUxRSxNQUFJLENBQUMsZUFBZSxDQUFDLGlCQUFpQjtBQUNwQyxRQUFJLFFBQVEsSUFBSSxhQUFhLGFBQWMsS0FBSSxVQUFVLG9CQUFvQixzQkFBc0I7QUFDbkcsUUFBSSxRQUFRLElBQUksYUFBYSxhQUFjLEtBQUksVUFBVSxtQkFBbUIsR0FBRztBQUMvRSxRQUFJLE9BQU8sR0FBRztBQUNkLFFBQUksVUFBVSxnQkFBZ0IsZ0NBQWdDO0FBQzlELFFBQUksVUFBVSxpQkFBaUIsa0NBQWtDO0FBQ2pFLFFBQUksS0FBS0Usa0JBQWlCLENBQUMsQ0FBQyxDQUFDO0FBQzdCO0FBQUEsRUFDRjtBQUVBLFFBQU0sV0FBV0UsY0FBYSxhQUFhLGVBQWU7QUFDMUQsUUFBTSxFQUFFLE1BQU0sTUFBTSxJQUFJLE1BQU0sU0FDM0IsS0FBSyxVQUFVLEVBQ2YsT0FBTyxrREFBa0QsRUFDekQsR0FBRyxhQUFhLElBQUksRUFDcEIsTUFBTSxnQkFBZ0IsRUFBRSxXQUFXLE1BQU0sQ0FBQztBQUU3QyxNQUFJLFNBQVMsQ0FBQyxNQUFNO0FBQ2xCLFFBQUksUUFBUSxJQUFJLGFBQWEsYUFBYyxLQUFJLFVBQVUsb0JBQW9CLE9BQU8sVUFBVSxrQkFBa0IsT0FBTyxNQUFNLE9BQU8sRUFBRSxNQUFNLEdBQUcsR0FBRyxDQUFDLEtBQUssU0FBUztBQUNqSyxRQUFJLFFBQVEsSUFBSSxhQUFhLGFBQWMsS0FBSSxVQUFVLG1CQUFtQixHQUFHO0FBQy9FLFFBQUksT0FBTyxHQUFHO0FBQ2QsUUFBSSxVQUFVLGdCQUFnQixnQ0FBZ0M7QUFDOUQsUUFBSSxVQUFVLGlCQUFpQixrQ0FBa0M7QUFDakUsUUFBSSxLQUFLRixrQkFBaUIsQ0FBQyxDQUFDLENBQUM7QUFDN0I7QUFBQSxFQUNGO0FBRUEsUUFBTSxPQUFPLEtBQUssSUFBSSxDQUFDLE1BQVc7QUFDaEMsVUFBTSxVQUFVLEVBQUUsZ0JBQWdCLEVBQUU7QUFDcEMsV0FBTztBQUFBLE1BQ0wsS0FBSyxHQUFHLE9BQU8sYUFBYSxFQUFFLElBQUk7QUFBQSxNQUNsQyxTQUFTLFVBQVUsSUFBSSxLQUFLLE9BQU8sRUFBRSxZQUFZLElBQUk7QUFBQSxNQUNyRCxRQUFRLEVBQUUsWUFBWSxDQUFDLEVBQUUsS0FBSyxFQUFFLFdBQVcsT0FBTyxFQUFFLFNBQVMsT0FBVSxDQUFDLElBQUksQ0FBQztBQUFBLElBQy9FO0FBQUEsRUFDRixDQUFDO0FBRUQsTUFBSSxRQUFRLElBQUksYUFBYSxhQUFjLEtBQUksVUFBVSxtQkFBbUIsT0FBTyxLQUFLLE1BQU0sQ0FBQztBQUUvRixNQUFJLE9BQU8sR0FBRztBQUNkLE1BQUksVUFBVSxnQkFBZ0IsZ0NBQWdDO0FBQzlELE1BQUksVUFBVSxpQkFBaUIsa0NBQWtDO0FBQ2pFLE1BQUksS0FBS0Esa0JBQWlCLElBQUksQ0FBQztBQUNqQzs7O0FDcEd1UyxTQUFTLGdCQUFBRyxxQkFBb0I7QUFZcFUsU0FBU0MsYUFBWSxPQUEwRDtBQUM3RSxNQUFJLENBQUMsTUFBTyxRQUFPO0FBQ25CLFNBQU8sTUFBTSxRQUFRLEtBQUssSUFBSSxNQUFNLENBQUMsSUFBSTtBQUMzQztBQUVBLFNBQVNDLFdBQVUsT0FBdUI7QUFDeEMsU0FBTyxNQUNKLFFBQVEsTUFBTSxPQUFPLEVBQ3JCLFFBQVEsTUFBTSxNQUFNLEVBQ3BCLFFBQVEsTUFBTSxNQUFNLEVBQ3BCLFFBQVEsT0FBTyxRQUFRLEVBQ3ZCLFFBQVEsTUFBTSxRQUFRO0FBQzNCO0FBRUEsU0FBUywwQkFDUCxNQVlRO0FBQ1IsUUFBTSxRQUFRLEtBQ1gsSUFBSSxDQUFDLE1BQU07QUFDVixVQUFNLFVBQVUsRUFBRSxVQUFVLFlBQVlBLFdBQVUsRUFBRSxPQUFPLENBQUMsZUFBZTtBQUUzRSxVQUFNLFVBQVUsRUFBRSxVQUFVLENBQUMsR0FDMUIsT0FBTyxDQUFDLFFBQVEsSUFBSSxHQUFHLEVBQ3ZCLElBQUksQ0FBQyxRQUFRO0FBQ1osWUFBTSxRQUFRLElBQUksUUFBUSxnQkFBZ0JBLFdBQVUsSUFBSSxLQUFLLENBQUMsbUJBQW1CO0FBQ2pGLGFBQU8sMkJBQTJCQSxXQUFVLElBQUksR0FBRyxDQUFDLGVBQWUsS0FBSztBQUFBLElBQzFFLENBQUMsRUFDQSxLQUFLLEVBQUU7QUFFVixVQUFNLFVBQVUsRUFBRSxVQUFVLENBQUMsR0FDMUIsSUFBSSxDQUFDLE1BQU07QUFDVixZQUFNLFFBQVEsRUFBRSxlQUFlLHdCQUF3QkEsV0FBVSxFQUFFLFlBQVksQ0FBQywyQkFBMkI7QUFDM0csWUFBTSxPQUFPLEVBQUUsY0FBYyxzQkFBc0JBLFdBQVUsRUFBRSxXQUFXLENBQUMseUJBQXlCO0FBQ3BHLFlBQU0sYUFBYSxFQUFFLGFBQWEsc0JBQXNCQSxXQUFVLEVBQUUsVUFBVSxDQUFDLHlCQUF5QjtBQUN4RyxZQUFNLFlBQVksRUFBRSxZQUFZLHFCQUFxQkEsV0FBVSxFQUFFLFNBQVMsQ0FBQyx3QkFBd0I7QUFDbkcsYUFBTyxnQkFBZ0IsS0FBSyxnQkFBZ0JBLFdBQVUsRUFBRSxLQUFLLENBQUMsaUJBQWlCLElBQUksR0FBRyxVQUFVLEdBQUcsU0FBUztBQUFBLElBQzlHLENBQUMsRUFDQSxLQUFLLEVBQUU7QUFFVixXQUFPLGFBQWFBLFdBQVUsRUFBRSxHQUFHLENBQUMsU0FBUyxPQUFPLEdBQUcsTUFBTSxHQUFHLE1BQU07QUFBQSxFQUN4RSxDQUFDLEVBQ0EsS0FBSyxFQUFFO0FBRVYsU0FDRSxpT0FDMkwsS0FBSztBQUVwTTtBQUVBLGVBQU9DLFNBQStCLEtBQVUsS0FBVTtBQUN4RCxRQUFNLE9BQU9GLGFBQVksSUFBSSxRQUFRLGtCQUFrQixDQUFDLEtBQUtBLGFBQVksSUFBSSxRQUFRLE1BQU0sQ0FBQyxLQUFLO0FBQ2pHLFFBQU0sUUFBUUEsYUFBWSxJQUFJLFFBQVEsbUJBQW1CLENBQUMsTUFBTSxLQUFLLFNBQVMsV0FBVyxLQUFLLEtBQUssU0FBUyxXQUFXLElBQUksU0FBUztBQUNwSSxRQUFNLFVBQVUsR0FBRyxLQUFLLE1BQU0sSUFBSTtBQUVsQyxRQUFNLGNBQWMsUUFBUSxJQUFJLHFCQUFxQixRQUFRLElBQUk7QUFDakUsUUFBTSxrQkFBa0IsUUFBUSxJQUFJLDBCQUEwQixRQUFRLElBQUk7QUFFMUUsTUFBSSxDQUFDLGVBQWUsQ0FBQyxpQkFBaUI7QUFDcEMsUUFBSSxRQUFRLElBQUksYUFBYSxhQUFjLEtBQUksVUFBVSxvQkFBb0Isc0JBQXNCO0FBQ25HLFFBQUksUUFBUSxJQUFJLGFBQWEsYUFBYyxLQUFJLFVBQVUsbUJBQW1CLEdBQUc7QUFDL0UsUUFBSSxPQUFPLEdBQUc7QUFDZCxRQUFJLFVBQVUsZ0JBQWdCLGdDQUFnQztBQUM5RCxRQUFJLFVBQVUsaUJBQWlCLGtDQUFrQztBQUNqRSxRQUFJLEtBQUssMEJBQTBCLENBQUMsQ0FBQyxDQUFDO0FBQ3RDO0FBQUEsRUFDRjtBQUVBLFFBQU0sV0FBV0csY0FBYSxhQUFhLGVBQWU7QUFDMUQsUUFBTSxFQUFFLE1BQU0sTUFBTSxJQUFJLE1BQU0sU0FDM0IsS0FBSyxRQUFRLEVBQ2IsT0FBTyxzRkFBc0YsRUFDN0YsR0FBRyxhQUFhLElBQUksRUFDcEIsTUFBTSxjQUFjLEVBQUUsV0FBVyxNQUFNLENBQUM7QUFFM0MsTUFBSSxTQUFTLENBQUMsTUFBTTtBQUNsQixRQUFJLFFBQVEsSUFBSSxhQUFhLGFBQWMsS0FBSSxVQUFVLG9CQUFvQixPQUFPLFVBQVUsa0JBQWtCLE9BQU8sTUFBTSxPQUFPLEVBQUUsTUFBTSxHQUFHLEdBQUcsQ0FBQyxLQUFLLFNBQVM7QUFDakssUUFBSSxRQUFRLElBQUksYUFBYSxhQUFjLEtBQUksVUFBVSxtQkFBbUIsR0FBRztBQUMvRSxRQUFJLE9BQU8sR0FBRztBQUNkLFFBQUksVUFBVSxnQkFBZ0IsZ0NBQWdDO0FBQzlELFFBQUksVUFBVSxpQkFBaUIsa0NBQWtDO0FBQ2pFLFFBQUksS0FBSywwQkFBMEIsQ0FBQyxDQUFDLENBQUM7QUFDdEM7QUFBQSxFQUNGO0FBRUEsUUFBTSxhQUFhLEtBQ2hCLElBQUksQ0FBQyxNQUFXLEVBQUUsVUFBVSxFQUM1QixPQUFPLE9BQU8sRUFDZCxJQUFJLENBQUMsTUFBVyxJQUFJLEtBQUssQ0FBQyxFQUFFLFFBQVEsQ0FBQyxFQUNyQyxPQUFPLENBQUMsS0FBYSxPQUFnQixLQUFLLE1BQU0sS0FBSyxLQUFNLENBQUM7QUFFL0QsUUFBTSxTQUFTLEtBQUssSUFBSSxDQUFDLE1BQVc7QUFDbEMsVUFBTSxZQUFZLEVBQUUsYUFDaEIsbUNBQW1DLEVBQUUsVUFBVSxLQUMvQyxFQUFFLFdBQ0EscUJBQXFCLEVBQUUsUUFBUSxLQUMvQjtBQUNOLFVBQU0sYUFBYSxFQUFFLGFBQWE7QUFDbEMsV0FBTztBQUFBLE1BQ0wsY0FBYyxFQUFFLGlCQUFpQjtBQUFBLE1BQ2pDLE9BQU8sRUFBRSxTQUFTO0FBQUEsTUFDbEIsYUFBYSxFQUFFLGVBQWU7QUFBQSxNQUM5QjtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBQUEsRUFDRixDQUFDO0FBRUQsUUFBTSxTQUFTLEtBQUssT0FBTyxDQUFDLEtBQXdDLE1BQVc7QUFDN0UsUUFBSSxDQUFDLEdBQUcsY0FBZSxRQUFPO0FBQzlCLFFBQUksS0FBSztBQUFBLE1BQ1AsS0FBSyxPQUFPLEVBQUUsYUFBYTtBQUFBLE1BQzNCLE9BQU8sRUFBRSxRQUFRLE9BQU8sRUFBRSxLQUFLLElBQUk7QUFBQSxJQUNyQyxDQUFDO0FBQ0QsV0FBTztBQUFBLEVBQ1QsR0FBRyxDQUFDLENBQUM7QUFFTCxRQUFNLE9BQU87QUFBQSxJQUNYO0FBQUEsTUFDRSxLQUFLLEdBQUcsT0FBTztBQUFBLE1BQ2YsU0FBUyxhQUFhLElBQUksS0FBSyxVQUFVLEVBQUUsWUFBWSxJQUFJO0FBQUEsTUFDM0Q7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFFQSxNQUFJLFFBQVEsSUFBSSxhQUFhLGFBQWMsS0FBSSxVQUFVLG1CQUFtQixPQUFPLEtBQUssTUFBTSxDQUFDO0FBRS9GLE1BQUksT0FBTyxHQUFHO0FBQ2QsTUFBSSxVQUFVLGdCQUFnQixnQ0FBZ0M7QUFDOUQsTUFBSSxVQUFVLGlCQUFpQixrQ0FBa0M7QUFDakUsTUFBSSxLQUFLLDBCQUEwQixJQUFJLENBQUM7QUFDMUM7OztBQy9JQSxTQUFTQyxhQUFZLE9BQTBEO0FBQzdFLE1BQUksQ0FBQyxNQUFPLFFBQU87QUFDbkIsU0FBTyxNQUFNLFFBQVEsS0FBSyxJQUFJLE1BQU0sQ0FBQyxJQUFJO0FBQzNDO0FBRUEsZUFBT0MsU0FBK0IsS0FBVSxLQUFVO0FBQ3hELFFBQU0sT0FBT0QsYUFBWSxJQUFJLFFBQVEsa0JBQWtCLENBQUMsS0FBS0EsYUFBWSxJQUFJLFFBQVEsTUFBTSxDQUFDLEtBQUs7QUFDakcsUUFBTSxRQUFRQSxhQUFZLElBQUksUUFBUSxtQkFBbUIsQ0FBQyxLQUFLO0FBQy9ELFFBQU0sVUFBVSxHQUFHLEtBQUssTUFBTSxJQUFJO0FBRWxDLFFBQU0sT0FBTztBQUFBLElBQ1g7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0EsWUFBWSxPQUFPO0FBQUEsSUFDbkI7QUFBQSxFQUNGLEVBQUUsS0FBSyxJQUFJO0FBRVgsTUFBSSxPQUFPLEdBQUc7QUFDZCxNQUFJLFVBQVUsZ0JBQWdCLDJCQUEyQjtBQUN6RCxNQUFJLFVBQVUsaUJBQWlCLGtDQUFrQztBQUNqRSxNQUFJLEtBQUssSUFBSTtBQUNmOzs7QVJoQzJLLElBQU0sMkNBQTJDO0FBZTVOLElBQU0sWUFBWSxLQUFLLFFBQVEsY0FBYyx3Q0FBZSxDQUFDO0FBRTdELElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ3hDLFFBQU0sTUFBTSxRQUFRLE1BQU0sS0FBSyxRQUFRLFNBQVMsR0FBRyxPQUFPO0FBQzFELGFBQVcsQ0FBQyxHQUFHLENBQUMsS0FBSyxPQUFPLFFBQVEsR0FBRyxHQUFHO0FBQ3hDLFFBQUksT0FBTyxNQUFNLFNBQVUsU0FBUSxJQUFJLENBQUMsSUFBSTtBQUFBLEVBQzlDO0FBRUEsU0FBTztBQUFBLElBQ0wsU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBLE1BQ047QUFBQSxRQUNFLE1BQU07QUFBQSxRQUNOLGdCQUFnQixRQUFRO0FBQ3RCLGlCQUFPLFlBQVksSUFBSSxPQUFPLEtBQUssS0FBSyxTQUFTO0FBQy9DLGdCQUFJO0FBQ0Ysb0JBQU0sTUFBTSxJQUFJLE9BQU87QUFDdkIsb0JBQU0sU0FBUyxJQUFJLElBQUksS0FBSyxjQUFjO0FBQzFDLG9CQUFNLFdBQVcsT0FBTztBQUV4QixvQkFBTSxTQUE4QjtBQUFBLGdCQUNsQyxnQkFBZ0I7QUFBQSxnQkFDaEIsc0JBQXNCRTtBQUFBLGdCQUN0QixzQkFBc0JBO0FBQUEsZ0JBQ3RCLHlCQUF5QkE7QUFBQSxnQkFDekIsdUJBQXVCQTtBQUFBLGdCQUN2Qix3QkFBd0JBO0FBQUEsZ0JBQ3hCLHVCQUF1QkE7QUFBQSxnQkFDdkIsZUFBZUE7QUFBQSxnQkFFZixnQkFBZ0I7QUFBQSxnQkFDaEIsc0JBQXNCQTtBQUFBLGdCQUN0QixzQkFBc0JBO0FBQUEsZ0JBQ3RCLHlCQUF5QkE7QUFBQSxnQkFDekIsdUJBQXVCQTtBQUFBLGdCQUN2Qix3QkFBd0JBO0FBQUEsZ0JBQ3hCLHVCQUF1QkE7QUFBQSxnQkFDdkIsZUFBZUE7QUFBQSxjQUNqQjtBQUVBLG9CQUFNQSxXQUFVLE9BQU8sUUFBUTtBQUMvQixrQkFBSSxDQUFDQSxTQUFTLFFBQU8sS0FBSztBQUUxQixvQkFBTSxVQUF5RCxDQUFDO0FBQ2hFLHlCQUFXLENBQUMsR0FBRyxDQUFDLEtBQUssT0FBTyxRQUFRLElBQUksV0FBVyxDQUFDLENBQUMsR0FBRztBQUN0RCx3QkFBUSxDQUFDLElBQUk7QUFBQSxjQUNmO0FBRUEsb0JBQU0sVUFBVTtBQUNoQixvQkFBTSxhQUFhO0FBQUEsZ0JBQ2pCLE9BQU8sTUFBYztBQUNuQiwwQkFBUSxhQUFhO0FBQ3JCLHlCQUFPO0FBQUEsZ0JBQ1Q7QUFBQSxnQkFDQSxVQUFVLE1BQWMsT0FBZTtBQUNyQywwQkFBUSxVQUFVLE1BQU0sS0FBSztBQUFBLGdCQUMvQjtBQUFBLGdCQUNBLEtBQUssTUFBYztBQUNqQiwwQkFBUSxJQUFJLElBQUk7QUFBQSxnQkFDbEI7QUFBQSxjQUNGO0FBRUEsb0JBQU0sUUFBdUQsQ0FBQztBQUM5RCxxQkFBTyxhQUFhLFFBQVEsQ0FBQyxPQUFPLFFBQVE7QUFDMUMsc0JBQU0sV0FBVyxNQUFNLEdBQUc7QUFDMUIsb0JBQUksYUFBYSxPQUFXLE9BQU0sR0FBRyxJQUFJO0FBQUEseUJBQ2hDLE1BQU0sUUFBUSxRQUFRLEVBQUcsVUFBUyxLQUFLLEtBQUs7QUFBQSxvQkFDaEQsT0FBTSxHQUFHLElBQUksQ0FBQyxVQUFVLEtBQUs7QUFBQSxjQUNwQyxDQUFDO0FBRUQsb0JBQU1BO0FBQUEsZ0JBQ0o7QUFBQSxrQkFDRTtBQUFBLGtCQUNBO0FBQUEsZ0JBQ0Y7QUFBQSxnQkFDQTtBQUFBLGNBQ0Y7QUFBQSxZQUNGLFNBQVMsR0FBRztBQUNWLG1CQUFLLENBQUM7QUFBQSxZQUNSO0FBQUEsVUFDRixDQUFDO0FBQUEsUUFDSDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxLQUFLLEtBQUssUUFBUSxXQUFXLFVBQVUsS0FBSztBQUFBLFFBQzVDLFdBQVcsS0FBSyxRQUFRLFdBQVcsUUFBUTtBQUFBLFFBQzNDLFdBQVcsS0FBSyxRQUFRLFdBQVcsaUJBQWlCO0FBQUEsTUFDdEQ7QUFBQSxJQUNGO0FBQUEsSUFDQSxNQUFNLEtBQUssUUFBUSxXQUFXLFFBQVE7QUFBQSxJQUN0QyxRQUFRLEtBQUssUUFBUSxTQUFTO0FBQUEsSUFDOUIsV0FBVztBQUFBLElBQ1gsT0FBTztBQUFBLE1BQ0wsUUFBUSxLQUFLLFFBQVEsV0FBVyxhQUFhO0FBQUEsTUFDN0MsYUFBYTtBQUFBLE1BQ2IsV0FBVztBQUFBLElBQ2I7QUFBQSxJQUNBLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLGNBQWM7QUFBQSxNQUNkLElBQUk7QUFBQSxRQUNGLFFBQVE7QUFBQSxRQUNSLE1BQU0sQ0FBQyxPQUFPO0FBQUEsTUFDaEI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbImZpcnN0SGVhZGVyIiwgInhtbEVzY2FwZSIsICJoYW5kbGVyIiwgImNyZWF0ZUNsaWVudCIsICJmaXJzdEhlYWRlciIsICJ4bWxFc2NhcGUiLCAidXJsc2V0V2l0aEltYWdlcyIsICJoYW5kbGVyIiwgImNyZWF0ZUNsaWVudCIsICJjcmVhdGVDbGllbnQiLCAiZmlyc3RIZWFkZXIiLCAieG1sRXNjYXBlIiwgImhhbmRsZXIiLCAiY3JlYXRlQ2xpZW50IiwgImNyZWF0ZUNsaWVudCIsICJmaXJzdEhlYWRlciIsICJ4bWxFc2NhcGUiLCAidXJsc2V0V2l0aEltYWdlcyIsICJoYW5kbGVyIiwgImNyZWF0ZUNsaWVudCIsICJjcmVhdGVDbGllbnQiLCAiZmlyc3RIZWFkZXIiLCAieG1sRXNjYXBlIiwgInVybHNldFdpdGhJbWFnZXMiLCAiaGFuZGxlciIsICJjcmVhdGVDbGllbnQiLCAiY3JlYXRlQ2xpZW50IiwgImZpcnN0SGVhZGVyIiwgInhtbEVzY2FwZSIsICJoYW5kbGVyIiwgImNyZWF0ZUNsaWVudCIsICJmaXJzdEhlYWRlciIsICJoYW5kbGVyIiwgImhhbmRsZXIiXQp9Cg==
