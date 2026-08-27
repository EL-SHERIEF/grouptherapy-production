type Req = {
  headers: Record<string, string | string[] | undefined>;
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

export default async function handler(req: Req, res: Res) {
  const host = firstHeader(req.headers["x-forwarded-host"]) || firstHeader(req.headers["host"]) || "grouptherapyeg.com";
  const proto =
    firstHeader(req.headers["x-forwarded-proto"]) ||
    (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
  const baseUrl = canonicalBaseUrl(host, proto);

  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin/",
    `Sitemap: ${baseUrl}/sitemap.xml`,
    "",
  ].join("\n");

  res.status(200);
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
  res.send(body);
}
