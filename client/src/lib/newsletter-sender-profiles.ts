import { supabase } from "./supabase";

export type NewsletterSenderProfile = {
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

async function getAccessToken(): Promise<string> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error("Not authenticated");
  return token;
}

async function request(path: string, init: RequestInit): Promise<any> {
  const token = await getAccessToken();
  const resp = await fetch(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data?.success) {
    throw new Error(data?.error || "Request failed");
  }
  return data;
}

export async function fetchNewsletterSenderProfiles(): Promise<NewsletterSenderProfile[]> {
  const data = await request("/api/newsletter-sender-profiles", { method: "GET" });
  return Array.isArray(data?.profiles) ? (data.profiles as NewsletterSenderProfile[]) : [];
}

export async function createNewsletterSenderProfile(input: {
  name: string;
  service: string;
  fromEmail: string;
  senderName?: string;
  apiUrl?: string;
  apiKey?: string;
  isDefault?: boolean;
}): Promise<NewsletterSenderProfile> {
  const data = await request("/api/newsletter-sender-profiles", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.profile as NewsletterSenderProfile;
}

export async function updateNewsletterSenderProfile(input: {
  id: string;
  name?: string;
  service?: string;
  fromEmail?: string;
  senderName?: string;
  apiUrl?: string;
  apiKey?: string;
  isDefault?: boolean;
}): Promise<NewsletterSenderProfile> {
  const data = await request("/api/newsletter-sender-profiles", {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return data.profile as NewsletterSenderProfile;
}

export async function deleteNewsletterSenderProfile(id: string): Promise<void> {
  await request("/api/newsletter-sender-profiles", {
    method: "DELETE",
    body: JSON.stringify({ id }),
  });
}
