import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

type Req = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
};

type Res = {
  status: (code: number) => Res;
  setHeader: (name: string, value: string) => void;
  send: (body: string) => void;
};

function firstQuery(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function html(res: Res, status: number, body: string) {
  res.status(status);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(body);
}

function base64UrlDecode(input: string): Buffer {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "===".slice((normalized.length + 3) % 4);
  return Buffer.from(padded, "base64");
}

function base64UrlEncode(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function hmacSha256Hex(secret: string, data: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

function safeText(v: unknown): string {
  return String(v || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type UnsubPayload = {
  e: string;
  ts: number;
  sig: string;
};

function decodeToken(token: string): UnsubPayload {
  const json = base64UrlDecode(token).toString("utf8");
  const parsed = JSON.parse(json);
  return parsed as UnsubPayload;
}

function makeToken(secret: string, email: string, ts: number): string {
  const payload = { e: email, ts };
  const sig = hmacSha256Hex(secret, `${payload.e}|${payload.ts}`);
  const full: UnsubPayload = { ...payload, sig };
  return base64UrlEncode(Buffer.from(JSON.stringify(full), "utf8"));
}

export default async function handler(req: Req, res: Res) {
  try {
    const method = (req.method || "GET").toUpperCase();
    if (method !== "GET" && method !== "HEAD") {
      html(res, 405, "Method not allowed");
      return;
    }

    const token = firstQuery(req.query?.token);
    if (!token) {
      html(res, 400, "Missing token");
      return;
    }

    const secret =
      process.env.NEWSLETTER_UNSUBSCRIBE_SECRET ||
      process.env.EMAIL_SETTINGS_ENCRYPTION_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE ||
      "";

    if (!secret) {
      html(res, 500, "Server not configured");
      return;
    }

    const payload = decodeToken(token);
    const email = String(payload?.e || "").toLowerCase().trim();
    const ts = Number(payload?.ts || 0);
    const sig = String(payload?.sig || "");

    if (!email || !email.includes("@") || !ts || !sig) {
      html(res, 400, "Invalid token");
      return;
    }

    const expected = hmacSha256Hex(secret, `${email}|${ts}`);
    if (expected !== sig) {
      html(res, 400, "Invalid token");
      return;
    }

    // Token expiry: 90 days
    const ageMs = Date.now() - ts;
    if (ageMs > 1000 * 60 * 60 * 24 * 90) {
      html(res, 400, "Token expired");
      return;
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

    if (!supabaseUrl || !serviceRoleKey) {
      html(res, 500, "Database not configured");
      return;
    }

    const sb = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date().toISOString();
    const { error } = await sb
      .from("newsletter_subscribers")
      .update({
        active: false,
        unsubscribed_at: now,
        opted_out: true,
        opted_out_at: now,
      })
      .eq("email", email);

    if (error) {
      html(res, 500, "Failed to unsubscribe");
      return;
    }

    const body = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Unsubscribed | GroupTherapy</title>
    <meta name="robots" content="noindex, nofollow" />
    <style>
      :root {
        --bg: #05060a;
        --card: rgba(255, 255, 255, 0.06);
        --card-border: rgba(255, 255, 255, 0.10);
        --text: rgba(255, 255, 255, 0.92);
        --muted: rgba(255, 255, 255, 0.70);
        --muted-2: rgba(255, 255, 255, 0.55);
        --purple: #8b5cf6;
        --purple-2: #a78bfa;
        --blue: #22d3ee;
      }
      * { box-sizing: border-box; }
      html, body { height: 100%; }
      body {
        margin: 0;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        background: radial-gradient(1100px 700px at 20% -10%, rgba(139,92,246,0.35), transparent 55%),
                    radial-gradient(1000px 600px at 110% 10%, rgba(34,211,238,0.20), transparent 60%),
                    radial-gradient(800px 500px at 40% 120%, rgba(167,139,250,0.18), transparent 55%),
                    var(--bg);
        color: var(--text);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 28px 16px;
      }
      .wrap {
        width: 100%;
        max-width: 920px;
      }
      .shell {
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.07);
        overflow: hidden;
        box-shadow: 0 25px 60px rgba(0,0,0,0.45);
      }
      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 18px;
        background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
        border-bottom: 1px solid rgba(255, 255, 255, 0.07);
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        text-decoration: none;
        color: inherit;
      }
      .logo {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.10);
        display: grid;
        place-items: center;
        overflow: hidden;
      }
      .logo img {
        width: 28px;
        height: 28px;
        object-fit: contain;
        filter: drop-shadow(0 6px 16px rgba(0,0,0,0.35));
      }
      .brand-name {
        font-weight: 700;
        letter-spacing: 0.2px;
        font-size: 14px;
        line-height: 18px;
      }
      .brand-sub {
        font-size: 12px;
        line-height: 16px;
        color: var(--muted-2);
      }
      .badge {
        font-size: 12px;
        color: rgba(255,255,255,0.75);
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.10);
        padding: 6px 10px;
        border-radius: 999px;
        white-space: nowrap;
      }
      .content {
        padding: 22px 18px 18px;
      }
      .card {
        border-radius: 20px;
        padding: 22px;
        background: var(--card);
        border: 1px solid var(--card-border);
        position: relative;
        overflow: hidden;
      }
      .card:before {
        content: "";
        position: absolute;
        inset: -2px;
        background: radial-gradient(700px 220px at 30% 0%, rgba(139,92,246,0.25), transparent 55%),
                    radial-gradient(650px 220px at 80% 110%, rgba(34,211,238,0.12), transparent 55%);
        opacity: 0.85;
        pointer-events: none;
      }
      .card > * { position: relative; }
      h1 {
        margin: 0;
        font-size: 28px;
        line-height: 34px;
        letter-spacing: -0.2px;
      }
      .lead {
        margin: 10px 0 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 22px;
      }
      .email-chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-top: 14px;
        padding: 8px 10px;
        border-radius: 999px;
        background: rgba(0,0,0,0.25);
        border: 1px solid rgba(255,255,255,0.12);
        color: rgba(255,255,255,0.88);
        font-size: 13px;
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--purple), var(--blue));
        box-shadow: 0 0 0 4px rgba(139,92,246,0.15);
      }
      .actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-top: 18px;
      }
      .btn {
        appearance: none;
        border: 1px solid rgba(255,255,255,0.14);
        background: rgba(255,255,255,0.06);
        color: rgba(255,255,255,0.92);
        padding: 10px 14px;
        border-radius: 12px;
        text-decoration: none;
        font-weight: 600;
        font-size: 13px;
        line-height: 18px;
        transition: transform 120ms ease, background 120ms ease, border-color 120ms ease;
      }
      .btn:hover { transform: translateY(-1px); background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.20); }
      .btn.primary {
        background: linear-gradient(135deg, rgba(139,92,246,0.95), rgba(34,211,238,0.55));
        border-color: rgba(255,255,255,0.22);
      }
      .btn.primary:hover { background: linear-gradient(135deg, rgba(167,139,250,0.95), rgba(34,211,238,0.65)); }
      .foot {
        padding: 14px 18px 16px;
        color: var(--muted-2);
        font-size: 12px;
        line-height: 18px;
        display: flex;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
        border-top: 1px solid rgba(255, 255, 255, 0.07);
        background: rgba(0,0,0,0.18);
      }
      .foot a { color: rgba(255,255,255,0.78); text-decoration: none; }
      .foot a:hover { text-decoration: underline; }
      @media (max-width: 520px) {
        h1 { font-size: 24px; line-height: 30px; }
        .badge { display: none; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="shell">
        <div class="topbar">
          <a class="brand" href="/" aria-label="Go to GroupTherapy home">
            <span class="logo" aria-hidden="true">
              <img src="/favicon.png" alt="" />
            </span>
            <span>
              <div class="brand-name">GroupTherapy</div>
              <div class="brand-sub">Newsletter preferences</div>
            </span>
          </a>
          <div class="badge">Update confirmed</div>
        </div>

        <div class="content">
          <div class="card">
            <h1>You’re unsubscribed</h1>
            <p class="lead">${safeText(email)} has been opted out from future emails.</p>
            <div class="email-chip" aria-label="Unsubscribed email">
              <span class="dot" aria-hidden="true"></span>
              <span>${safeText(email)}</span>
            </div>
            <div class="actions">
              <a class="btn primary" href="/">Back to home</a>
              <a class="btn" href="/contact">Contact support</a>
            </div>
          </div>
        </div>

        <div class="foot">
          <span>© ${new Date().getFullYear()} GroupTherapy. All rights reserved.</span>
          <span>
            <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a>
          </span>
        </div>
      </div>
    </div>
  </body>
</html>`;

    html(res, 200, body);
  } catch (e) {
    html(res, 500, "Server error");
  }
}
