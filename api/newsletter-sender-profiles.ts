import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

type Req = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: any;
  query?: Record<string, string | string[] | undefined>;
};

type Res = {
  status: (code: number) => Res;
  setHeader: (name: string, value: string) => void;
  send: (body: string) => void;
};

type SenderProfilePublic = {
  id: string;
  name: string;
  service: string;
  fromEmail: string;
  senderName?: string;
  apiUrl?: string;
  hasApiKey: boolean;
  apiKeyLast4?: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
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

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function deriveKey(secret: string): Buffer {
  return crypto.createHash("sha256").update(secret).digest();
}

function encryptApiKey(apiKey: string, secret: string): string {
  const key = deriveKey(secret);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(apiKey, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${enc.toString("base64")}:${tag.toString("base64")}`;
}

function maskLast4(apiKey?: string): string {
  const v = String(apiKey || "");
  if (v.length <= 4) return v;
  return v.slice(-4);
}

function toPublic(row: any): SenderProfilePublic {
  return {
    id: String(row.id),
    name: String(row.name || ""),
    service: String(row.service || "none"),
    fromEmail: String(row.from_email || ""),
    senderName: row.sender_name ? String(row.sender_name) : "",
    apiUrl: row.api_url ? String(row.api_url) : "",
    hasApiKey: !!row.api_key_encrypted,
    apiKeyLast4: row.api_key_last4 ? String(row.api_key_last4) : "",
    isDefault: !!row.is_default,
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

async function listProfiles(sb: any): Promise<SenderProfilePublic[]> {
  const { data, error } = await sb
    .from("newsletter_sender_profiles")
    .select("*")
    .order("is_default", { ascending: false })
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(toPublic);
}

async function getProfile(sb: any, id: string): Promise<SenderProfilePublic | null> {
  const { data, error } = await sb.from("newsletter_sender_profiles").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return toPublic(data);
}

async function clearDefault(sb: any) {
  const { error } = await sb.from("newsletter_sender_profiles").update({ is_default: false }).eq("is_default", true);
  if (error) throw error;
}

export default async function handler(req: Req, res: Res) {
  try {
    const method = (req.method || "GET").toUpperCase();

    if (method === "OPTIONS") {
      res.status(204);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "authorization, content-type");
      res.send("");
      return;
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

    if (!supabaseUrl || (!serviceRoleKey && !supabaseAnonKey)) {
      json(res, 500, {
        success: false,
        error: "Supabase server env is not configured (need SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY)",
      });
      return;
    }

    if (!serviceRoleKey) {
      json(res, 500, {
        success: false,
        error: "Server is missing SUPABASE_SERVICE_ROLE_KEY. Sender profiles are stored in a locked table and require service role access.",
      });
      return;
    }

    const token = getBearerToken(req);
    if (!token) {
      json(res, 401, { success: false, error: "Missing Authorization" });
      return;
    }

    const sbDb = createClient(supabaseUrl, serviceRoleKey);

    const { data: userResult, error: userError } = await sbDb.auth.getUser(token);

    if (userError || !userResult?.user) {
      json(res, 401, { success: false, error: "Unauthorized" });
      return;
    }

    const body = (() => {
      const raw = req.body;
      if (!raw) return {};
      if (typeof raw === "string") {
        const s = raw.trim();
        if (!s) return {};
        try {
          return JSON.parse(s);
        } catch {
          return {};
        }
      }
      if (typeof raw === "object") return raw;
      return {};
    })();

    if (method === "GET") {
      const list = await listProfiles(sbDb);
      json(res, 200, { success: true, profiles: list });
      return;
    }

    if (method === "POST") {
      const name = String(body?.name || "").trim();
      const service = String(body?.service || "none").trim();
      const fromEmail = String(body?.fromEmail || "").trim();
      const senderName = String(body?.senderName || "").trim();
      const apiUrl = String(body?.apiUrl || "").trim();
      const apiKey = typeof body?.apiKey === "string" ? String(body.apiKey).trim() : "";
      const isDefault = !!body?.isDefault;

      if (!name) {
        json(res, 400, { success: false, error: "Profile name is required" });
        return;
      }

      if (!fromEmail || !fromEmail.includes("@")) {
        json(res, 400, { success: false, error: "Please provide a valid From email address" });
        return;
      }

      if (!service || service === "none") {
        json(res, 400, { success: false, error: "Please select an email service" });
        return;
      }

      if ((service === "resend" || service === "sendgrid") && !apiKey) {
        json(res, 400, { success: false, error: "Please provide an API key for this email service" });
        return;
      }

      if ((service === "ses" || service === "smtp") && !apiUrl) {
        json(res, 400, { success: false, error: "Please provide an API URL for this email service" });
        return;
      }

      if (isDefault) {
        await clearDefault(sbDb);
      }

      const payload: any = {
        name,
        service,
        from_email: fromEmail,
        sender_name: senderName || null,
        api_url: apiUrl || null,
        is_default: isDefault,
      };

      if (apiKey) {
        const secret = requireEnv("EMAIL_SETTINGS_ENCRYPTION_KEY");
        payload.api_key_encrypted = encryptApiKey(apiKey, secret);
        payload.api_key_last4 = maskLast4(apiKey);
      }

      const { data, error } = await sbDb.from("newsletter_sender_profiles").insert(payload).select().single();
      if (error) throw error;

      json(res, 200, { success: true, profile: toPublic(data) });
      return;
    }

    if (method === "PUT") {
      const id = String(body?.id || "").trim();
      if (!id) {
        json(res, 400, { success: false, error: "Missing id" });
        return;
      }

      const currentRow = await sbDb.from("newsletter_sender_profiles").select("*").eq("id", id).maybeSingle();
      if (currentRow.error) throw currentRow.error;
      if (!currentRow.data) {
        json(res, 404, { success: false, error: "Not found" });
        return;
      }

      const name = body?.name !== undefined ? String(body?.name || "").trim() : undefined;
      const service = body?.service !== undefined ? String(body?.service || "none").trim() : undefined;
      const fromEmail = body?.fromEmail !== undefined ? String(body?.fromEmail || "").trim() : undefined;
      const senderName = body?.senderName !== undefined ? String(body?.senderName || "").trim() : undefined;
      const apiUrl = body?.apiUrl !== undefined ? String(body?.apiUrl || "").trim() : undefined;
      const apiKey = typeof body?.apiKey === "string" ? String(body.apiKey).trim() : "";
      const isDefault = body?.isDefault !== undefined ? !!body.isDefault : undefined;

      const payload: any = {};
      if (name !== undefined) {
        if (!name) {
          json(res, 400, { success: false, error: "Profile name is required" });
          return;
        }
        payload.name = name;
      }

      if (service !== undefined) {
        if (!service || service === "none") {
          json(res, 400, { success: false, error: "Please select an email service" });
          return;
        }
        payload.service = service;
      }

      if (fromEmail !== undefined) {
        if (!fromEmail || !fromEmail.includes("@")) {
          json(res, 400, { success: false, error: "Please provide a valid From email address" });
          return;
        }
        payload.from_email = fromEmail;
      }

      if (senderName !== undefined) payload.sender_name = senderName || null;
      if (apiUrl !== undefined) payload.api_url = apiUrl || null;

      const finalService = payload.service || String(currentRow.data.service || "none");
      const finalApiUrl = payload.api_url !== undefined ? payload.api_url : currentRow.data.api_url;

      if ((finalService === "ses" || finalService === "smtp") && !String(finalApiUrl || "").trim()) {
        json(res, 400, { success: false, error: "Please provide an API URL for this email service" });
        return;
      }

      if (apiKey) {
        const secret = requireEnv("EMAIL_SETTINGS_ENCRYPTION_KEY");
        payload.api_key_encrypted = encryptApiKey(apiKey, secret);
        payload.api_key_last4 = maskLast4(apiKey);
      }

      if (isDefault !== undefined) {
        if (isDefault) await clearDefault(sbDb);
        payload.is_default = !!isDefault;
      }

      const { data, error } = await sbDb.from("newsletter_sender_profiles").update(payload).eq("id", id).select().single();
      if (error) throw error;

      json(res, 200, { success: true, profile: toPublic(data) });
      return;
    }

    if (method === "DELETE") {
      const id = String(body?.id || "").trim();
      if (!id) {
        json(res, 400, { success: false, error: "Missing id" });
        return;
      }

      const existing = await getProfile(sbDb, id);
      if (!existing) {
        json(res, 404, { success: false, error: "Not found" });
        return;
      }

      const { error } = await sbDb.from("newsletter_sender_profiles").delete().eq("id", id);
      if (error) throw error;

      // If we deleted the default profile, we do not auto-promote another; admin can choose.
      json(res, 200, { success: true });
      return;
    }

    json(res, 405, { success: false, error: "Method not allowed" });
  } catch (e) {
    const msg = e instanceof Error
      ? e.message
      : typeof (e as any)?.message === "string"
        ? String((e as any).message)
        : "Unknown error";
    json(res, 500, { success: false, error: msg });
  }
}
