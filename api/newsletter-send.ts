import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

type Req = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: any;
};

type Res = {
  status: (code: number) => Res;
  setHeader: (name: string, value: string) => void;
  send: (body: string) => void;
};

type SenderProfileRow = {
  id: string;
  service: string;
  from_email: string;
  sender_name?: string | null;
  api_url?: string | null;
  api_key_encrypted?: string | null;
  is_default?: boolean | null;
};

type Recipient = {
  email: string;
  name?: string | null;
};

function firstHeader(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function getBearerToken(req: Req): string | null {
  const h = firstHeader(req.headers["authorization"]) || firstHeader(req.headers["Authorization"]);
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] || null;
}

function json(res: Res, status: number, data: any) {
  res.status(status);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.send(JSON.stringify(data));
}

function hmacSha256Hex(secret: string, data: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

function base64UrlEncode(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function makeToken(secret: string, email: string, ts: number): string {
  const payload = { e: email, ts };
  const sig = hmacSha256Hex(secret, `${payload.e}|${payload.ts}`);
  const full = { ...payload, sig };
  return base64UrlEncode(Buffer.from(JSON.stringify(full), "utf8"));
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function deriveKey(secret: string): Buffer {
  return crypto.createHash("sha256").update(secret).digest();
}

function decryptApiKey(ciphertext: string, secret: string): string {
  const key = deriveKey(secret);
  const parts = String(ciphertext || "").split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted API key format");
  const iv = Buffer.from(parts[0] || "", "base64");
  const data = Buffer.from(parts[1] || "", "base64");
  const tag = Buffer.from(parts[2] || "", "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString("utf8");
}

function htmlToText(html: string): string {
  const raw = String(html || "");
  if (!raw.trim()) return "";
  return raw
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*\/?\s*(p|div|tr|table|h1|h2|h3|h4|h5|h6|li)\b[^>]*>/gi, "\n")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatFrom(senderName: string | undefined, fromEmail: string): string {
  const v = String(fromEmail || "").trim();
  if (!v) return v;
  if (v.includes("<") && v.includes(">")) return v;
  const name = String(senderName || "").trim() || "GroupTherapy";
  return `${name} <${v}>`;
}

function escapeHtml(text: string): string {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeRecipientName(name: any): string {
  const raw = String(name || "").trim();
  if (!raw) return "there";
  const first = raw.split(/\s+/)[0];
  return first || "there";
}

function replaceNameToken(text: string, name: string, opts?: { escape?: boolean }): string {
  const token = "{name}";
  const raw = String(text || "");
  if (!raw.includes(token)) return raw;
  const rep = opts?.escape ? escapeHtml(name) : name;
  return raw.split(token).join(rep);
}

function getBaseUrl(req: Req): string {
  const proto = firstHeader(req.headers["x-forwarded-proto"]) || "http";
  const host = firstHeader(req.headers["x-forwarded-host"]) || firstHeader(req.headers["host"]) || "localhost";
  return `${proto}://${host}`;
}

async function sendViaResend(args: {
  apiKey: string;
  fromEmail: string;
  to: string[];
  subject: string;
  html: string;
  headers?: Record<string, string>;
}) {
  const text = htmlToText(args.html);

  const replyTo = String(args.fromEmail || "").includes("<")
    ? String(args.fromEmail || "").replace(/^.*<\s*([^>]+)\s*>.*$/, "$1")
    : String(args.fromEmail || "").trim();

  for (const recipient of args.to) {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: args.fromEmail,
        to: [recipient],
        subject: args.subject,
        html: args.html,
        headers: { ...(args.headers || {}), "Reply-To": replyTo },
        ...(text ? { text } : {}),
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Resend error: ${err}`);
    }
  }
}

async function sendViaSendGrid(args: { apiKey: string; fromEmail: string; to: string[]; subject: string; html: string }) {
  const text = htmlToText(args.html);
  const listUnsub = args.fromEmail ? `<mailto:${String(args.fromEmail).trim()}?subject=unsubscribe>` : "";

  const resp = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: args.to.map((email) => ({ to: [{ email }] })),
      from: { email: args.fromEmail, name: "GroupTherapy" },
      subject: args.subject,
      content: [
        ...(text ? [{ type: "text/plain", value: text }] : []),
        { type: "text/html", value: args.html },
      ],
      ...(listUnsub ? { headers: { "List-Unsubscribe": listUnsub } } : {}),
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`SendGrid error: ${err}`);
  }
}

async function sendViaApiUrl(args: { apiUrl: string; fromEmail: string; to: string[]; subject: string; html: string }) {
  const resp = await fetch(args.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to: args.to, subject: args.subject, html: args.html, from: args.fromEmail }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Email API error: ${err}`);
  }
}

export default async function handler(req: Req, res: Res) {
  try {
    const method = (req.method || "POST").toUpperCase();

    if (method === "OPTIONS") {
      res.status(204);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "authorization, content-type");
      res.send("");
      return;
    }

    if (method !== "POST") {
      json(res, 405, { success: false, error: "Method not allowed" });
      return;
    }

    const token = getBearerToken(req);
    if (!token) {
      json(res, 401, { success: false, error: "Missing Authorization" });
      return;
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

    // If Supabase env is present, validate the bearer token against Supabase.
    // If not present (local/dev), we still require Authorization header, but we don't block sending.
    if (supabaseUrl && (serviceRoleKey || supabaseAnonKey)) {
      const sbDb = createClient(supabaseUrl, serviceRoleKey || supabaseAnonKey!);

      const userAuthClient = serviceRoleKey
        ? sbDb
        : createClient(supabaseUrl, supabaseAnonKey!, {
            global: { headers: { Authorization: `Bearer ${token}` } },
          });

      const { data: userResult, error: userError } = serviceRoleKey
        ? await sbDb.auth.getUser(token)
        : await (userAuthClient as any).auth.getUser();
      if (userError || !userResult?.user) {
        json(res, 401, { success: false, error: "Unauthorized" });
        return;
      }
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const toInput: string[] = Array.isArray(body?.to) ? body.to.filter((x: any) => typeof x === "string") : [];
    const subject = String(body?.subject || "");
    const html = String(body?.html || "");
    const senderProfileId = String(body?.senderProfileId || "").trim();

    const recipientsInput: Recipient[] = Array.isArray(body?.recipients)
      ? body.recipients
          .map((r: any) => ({ email: String(r?.email || "").trim(), name: r?.name ?? null }))
          .filter((r: any) => !!r.email)
      : [];

    const recipients: Recipient[] = recipientsInput.length
      ? recipientsInput
      : toInput.map((email) => ({ email: String(email || "").trim(), name: null })).filter((r) => !!r.email);

    const to = recipients.map((r) => r.email);
    const nameByEmail = new Map(recipients.map((r) => [String(r.email || "").toLowerCase(), normalizeRecipientName(r.name)] as const));

    if (to.length === 0) {
      json(res, 400, { success: false, error: "No recipients" });
      return;
    }

    if (!subject.trim() || !html.trim()) {
      json(res, 400, { success: false, error: "Missing subject or html" });
      return;
    }

    let service = "none";
    let fromEmail = "";
    let senderName = "";
    let apiKey = "";
    let apiUrl = "";

    if (supabaseUrl && serviceRoleKey) {
      const sbAdmin = createClient(supabaseUrl, serviceRoleKey);
      let profile: SenderProfileRow | null = null;

      if (senderProfileId) {
        const { data, error } = await sbAdmin
          .from("newsletter_sender_profiles")
          .select("id, service, from_email, sender_name, api_url, api_key_encrypted, is_default")
          .eq("id", senderProfileId)
          .maybeSingle();
        if (error) throw error;
        profile = (data as any) || null;
      }

      if (!profile) {
        const { data, error } = await sbAdmin
          .from("newsletter_sender_profiles")
          .select("id, service, from_email, sender_name, api_url, api_key_encrypted, is_default")
          .eq("is_default", true)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        profile = (data as any) || null;
      }

      if (!profile) {
        const { data, error } = await sbAdmin
          .from("newsletter_sender_profiles")
          .select("id, service, from_email, sender_name, api_url, api_key_encrypted, is_default")
          .order("is_default", { ascending: false })
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        profile = (data as any) || null;
      }

      if (profile) {
        service = String(profile.service || "none");
        fromEmail = String(profile.from_email || "").trim();
        senderName = String(profile.sender_name || "").trim();
        apiUrl = String(profile.api_url || "").trim();
        if (profile.api_key_encrypted) {
          const secret = requireEnv("EMAIL_SETTINGS_ENCRYPTION_KEY");
          apiKey = decryptApiKey(String(profile.api_key_encrypted || ""), secret).trim();
        }
      }
    }

    if (!service || service === "none") {
      json(res, 400, { success: false, error: "Sender profile not configured" });
      return;
    }

    const baseUrl =
      process.env.VITE_SITE_URL ||
      process.env.SITE_URL ||
      process.env.PUBLIC_SITE_URL ||
      getBaseUrl(req);
    const baseHtml = String(html || "");
    const unsubscribeSecret =
      process.env.NEWSLETTER_UNSUBSCRIBE_SECRET ||
      process.env.EMAIL_SETTINGS_ENCRYPTION_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE ||
      "";
    const unsubscribeMailto = fromEmail ? `mailto:${fromEmail}?subject=unsubscribe` : "";

    function buildUnsubscribeUrl(recipientEmail: string): string {
      if (!unsubscribeSecret) return "";
      const ts = Date.now();
      const token = makeToken(unsubscribeSecret, String(recipientEmail || "").toLowerCase().trim(), ts);
      const trimmedBase = String(baseUrl || "").replace(/\/+$/, "");
      return `${trimmedBase}/api/newsletter-unsubscribe?token=${encodeURIComponent(token)}`;
    }

    function buildListUnsubscribeHeader(unsubscribeUrl: string): string {
      const parts: string[] = [];
      if (unsubscribeUrl) parts.push(`<${unsubscribeUrl}>`);
      if (unsubscribeMailto) parts.push(`<${unsubscribeMailto}>`);
      return parts.join(", ");
    }

    function personalizeSubject(recipientName: string): string {
      return replaceNameToken(subject, recipientName);
    }

    function personalizeHtml(recipientEmail: string, recipientName: string): string {
      const unsubscribeUrl = buildUnsubscribeUrl(recipientEmail) || unsubscribeMailto || "#";
      const withUnsub = baseHtml
        .split("{{NEWSLETTER_UNSUBSCRIBE_MAILTO}}")
        .join(unsubscribeUrl);

      return replaceNameToken(withUnsub, recipientName, { escape: true });
    }

    if (!fromEmail) {
      json(res, 400, { success: false, error: "From email not configured" });
      return;
    }

    if ((service === "resend" || service === "sendgrid") && !apiKey) {
      json(res, 400, { success: false, error: "API key not configured" });
      return;
    }

    if ((service === "ses" || service === "smtp") && !apiUrl) {
      json(res, 400, { success: false, error: "API URL not configured" });
      return;
    }

    if (service === "resend") {
      const from = formatFrom(senderName, fromEmail);
      for (const recipient of to) {
        const recipientName = nameByEmail.get(String(recipient || "").toLowerCase()) || "there";
        const perSubject = personalizeSubject(recipientName);
        const perHtml = personalizeHtml(recipient, recipientName);
        const unsubscribeUrl = buildUnsubscribeUrl(recipient);
        const listUnsubHeader = buildListUnsubscribeHeader(unsubscribeUrl);
        await sendViaResend({
          apiKey,
          fromEmail: from,
          to: [recipient],
          subject: perSubject,
          html: perHtml,
          headers: listUnsubHeader ? { "List-Unsubscribe": listUnsubHeader } : undefined,
        });
      }
      json(res, 200, { success: true });
      return;
    }

    if (service === "sendgrid") {
      for (const recipient of to) {
        const recipientName = nameByEmail.get(String(recipient || "").toLowerCase()) || "there";
        const perSubject = personalizeSubject(recipientName);
        const perHtml = personalizeHtml(recipient, recipientName);
        const unsubscribeUrl = buildUnsubscribeUrl(recipient);
        const listUnsubHeader = buildListUnsubscribeHeader(unsubscribeUrl);
        const text = htmlToText(perHtml);

        const resp = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: recipient }] }],
            from: { email: fromEmail, name: senderName || "GroupTherapy" },
            subject: perSubject,
            content: [
              ...(text ? [{ type: "text/plain", value: text }] : []),
              { type: "text/html", value: perHtml },
            ],
            ...(listUnsubHeader ? { headers: { "List-Unsubscribe": listUnsubHeader } } : {}),
            reply_to: { email: fromEmail },
          }),
        });

        if (!resp.ok) {
          const err = await resp.text();
          throw new Error(`SendGrid error: ${err}`);
        }
      }
      json(res, 200, { success: true });
      return;
    }

    if (service === "ses" || service === "smtp") {
      for (const recipient of to) {
        const recipientName = nameByEmail.get(String(recipient || "").toLowerCase()) || "there";
        const perSubject = personalizeSubject(recipientName);
        const perHtml = personalizeHtml(recipient, recipientName);
        await sendViaApiUrl({ apiUrl, fromEmail, to: [recipient], subject: perSubject, html: perHtml });
      }
      json(res, 200, { success: true });
      return;
    }

    json(res, 400, { success: false, error: `Unknown email service: ${service}` });
  } catch (e) {
    const msg = e instanceof Error
      ? e.message
      : typeof (e as any)?.message === "string"
        ? String((e as any).message)
        : "Unknown error";
    json(res, 500, { success: false, error: msg });
  }
}
