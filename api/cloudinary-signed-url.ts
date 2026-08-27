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

function firstHeader(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function extractPublicIdFromRest(rest: string): string {
  const parts = rest.split("/").filter(Boolean);
  if (!parts.length) throw new Error("Missing Cloudinary asset path");

  const withoutVersion = parts[0] && /^v\d+$/i.test(parts[0]) ? parts.slice(1) : parts;
  if (!withoutVersion.length) throw new Error("Missing Cloudinary public_id");

  const joined = withoutVersion.join("/");
  // Cloudinary public_id typically excludes the file extension
  return joined.replace(/\.[a-z0-9]+$/i, "");
}

function buildCloudinaryDownloadApiUrl(args: {
  cloudName: string;
  resourceType: string;
  publicId: string;
  apiKey: string;
  apiSecret: string;
  type: string;
  attachment: boolean;
  targetFilename?: string;
  timestamp: number;
}): string {
  const params: Record<string, string> = {
    api_key: args.apiKey,
    public_id: args.publicId,
    timestamp: String(args.timestamp),
    type: args.type,
  };

  if (args.attachment) params.attachment = "true";
  if (args.targetFilename) params.target_filename = args.targetFilename;

  // Signature: sha1 of sorted params excluding file and api_secret
  const toSign: Record<string, string> = {
    public_id: args.publicId,
    timestamp: String(args.timestamp),
    type: args.type,
  };
  if (args.attachment) toSign.attachment = "true";
  if (args.targetFilename) toSign.target_filename = args.targetFilename;

  const signatureBase = Object.keys(toSign)
    .sort()
    .map((k) => `${k}=${toSign[k]}`)
    .join("&");

  const signature = sha1Hex(signatureBase + args.apiSecret);
  params.signature = signature;

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    qs.set(k, v);
  }

  return `https://api.cloudinary.com/v1_1/${args.cloudName}/${args.resourceType}/download?${qs.toString()}`;
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

function sha1Hex(input: string): string {
  return crypto.createHash("sha1").update(input).digest("hex");
}

function base64UrlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function signCloudinaryPath(args: { pathToSign: string; apiSecret: string }): string {
  const stringToSign = `${args.pathToSign}${args.apiSecret}`;
  const digest = crypto.createHash("sha1").update(stringToSign).digest();
  const b64url = base64UrlEncode(digest);
  return b64url.slice(0, 8);
}

function parseCloudinaryUrl(input: string, expectedCloudName: string): {
  protocol: string;
  host: string;
  cloudName: string;
  resourceType: string;
  deliveryType: string;
  rest: string;
} {
  const u = new URL(input);
  const host = u.host;

  if (u.protocol !== "https:" && u.protocol !== "http:") {
    throw new Error("Invalid URL protocol");
  }

  if (!/\.cloudinary\.com$/i.test(host)) {
    throw new Error("Invalid Cloudinary host");
  }

  const parts = u.pathname.split("/").filter(Boolean);
  const [cloudName, resourceType, deliveryType, ...restParts] = parts;

  if (!cloudName || !resourceType || !deliveryType) {
    throw new Error("Invalid Cloudinary URL format");
  }

  if (cloudName !== expectedCloudName) {
    throw new Error("Cloud name mismatch");
  }

  // Strip any existing signature component (s--xxxx--)
  const cleanedRestParts = restParts.filter((p) => !/^s--[^-]+--$/i.test(p));
  const rest = cleanedRestParts.join("/");
  if (!rest) throw new Error("Missing Cloudinary asset path");

  return {
    protocol: u.protocol,
    host,
    cloudName,
    resourceType,
    deliveryType,
    rest,
  };
}

export default async function handler(req: Req, res: Res) {
  try {
    const method = (req.method || "GET").toUpperCase();
    if (method !== "GET") {
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

    if (!supabaseUrl || (!serviceRoleKey && !supabaseAnonKey)) {
      json(res, 500, {
        success: false,
        error: "Supabase server env is not configured (need SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY)",
      });
      return;
    }

    const sb = createClient(supabaseUrl, serviceRoleKey || supabaseAnonKey!);
    const { data: userResult, error: userError } = serviceRoleKey
      ? await sb.auth.getUser(token)
      : await createClient(supabaseUrl, supabaseAnonKey!, { global: { headers: { Authorization: `Bearer ${token}` } } }).auth.getUser();

    if (userError || !userResult?.user) {
      json(res, 401, { success: false, error: "Unauthorized" });
      return;
    }

    const cloudName =
      process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.VITE_CLOUDINARY_CLOUD_NAME ||
      "";

    const apiSecret = requireEnv("CLOUDINARY_API_SECRET");
    const apiKey = process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY || "";

    const urlParam = (req.query?.url || "") as string | string[];
    const rawUrl = Array.isArray(urlParam) ? urlParam[0] || "" : urlParam;

    if (!rawUrl) {
      json(res, 400, { success: false, error: "Missing url" });
      return;
    }

    if (!cloudName) {
      json(res, 500, { success: false, error: "Missing env: CLOUDINARY_CLOUD_NAME" });
      return;
    }

    const parsed = parseCloudinaryUrl(rawUrl, cloudName);

    const normalizedRest = parsed.rest.replace(/^\/+/, "");

    const downloadApiParam = (req.query?.download_api || "") as string | string[];
    const downloadApiValue = (Array.isArray(downloadApiParam) ? downloadApiParam[0] : downloadApiParam) || "";
    const useDownloadApi = downloadApiValue === "1" || /^true$/i.test(downloadApiValue);

    if (useDownloadApi) {
      if (!apiKey) {
        json(res, 500, { success: false, error: "Missing env: CLOUDINARY_API_KEY" });
        return;
      }

      if (!/^(upload|authenticated|private)$/i.test(parsed.deliveryType)) {
        json(res, 400, { success: false, error: "Unsupported Cloudinary delivery type" });
        return;
      }

      const filenameParam = (req.query?.filename || "") as string | string[];
      const filenameValue = (Array.isArray(filenameParam) ? filenameParam[0] : filenameParam) || "";

      const publicId = extractPublicIdFromRest(normalizedRest);
      const timestamp = Math.floor(Date.now() / 1000);

      const downloadUrl = buildCloudinaryDownloadApiUrl({
        cloudName: parsed.cloudName,
        resourceType: parsed.resourceType,
        publicId,
        apiKey,
        apiSecret,
        // For Cloudinary download API, the "type" param is the asset's delivery type (upload/authenticated/private)
        type: parsed.deliveryType,
        attachment: true,
        targetFilename: filenameValue || undefined,
        timestamp,
      });

      json(res, 200, { success: true, signedUrl: downloadUrl });
      return;
    }

    if (!/^(authenticated|private)$/i.test(parsed.deliveryType)) {
      json(res, 400, { success: false, error: "URL is not an authenticated/private Cloudinary delivery URL" });
      return;
    }

    const downloadParam = (req.query?.download || "") as string | string[];
    const downloadValue = (Array.isArray(downloadParam) ? downloadParam[0] : downloadParam) || "";
    const isDownload = downloadValue === "1" || /^true$/i.test(downloadValue);

    const restForSign = isDownload ? `fl_attachment/${normalizedRest}` : normalizedRest;
    const signature = signCloudinaryPath({
      pathToSign: restForSign,
      apiSecret,
    });

    const signed = `${parsed.protocol}//${parsed.host}/${parsed.cloudName}/${parsed.resourceType}/${parsed.deliveryType}/s--${signature}--/${restForSign}`;

    json(res, 200, { success: true, signedUrl: signed });
  } catch (e) {
    const msg = e instanceof Error
      ? e.message
      : typeof (e as any)?.message === "string"
        ? String((e as any).message)
        : "Unknown error";
    json(res, 500, { success: false, error: msg });
  }
}
