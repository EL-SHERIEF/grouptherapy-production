import { supabase } from "./supabase";

async function getAccessToken(): Promise<string> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error("Not authenticated");
  return token;
}

export async function sendNewsletterViaApi(args: {
  to?: string[];
  recipients?: Array<{ email: string; name?: string | null }>;
  subject: string;
  html: string;
  senderProfileId?: string;
}): Promise<void> {
  const token = await getAccessToken();

  const recipients = Array.isArray(args.recipients)
    ? args.recipients.filter((r) => r && typeof r.email === "string" && r.email.trim())
    : [];

  const to = recipients.length
    ? recipients.map((r) => r.email)
    : Array.isArray(args.to)
      ? args.to
      : [];

  const resp = await fetch("/api/newsletter-send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to,
      recipients: recipients.length ? recipients : undefined,
      subject: args.subject,
      html: args.html,
      senderProfileId: args.senderProfileId,
    }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data?.success) {
    throw new Error(data?.error || "Failed to send newsletter");
  }
}
