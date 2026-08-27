import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { SeoComputed, SeoMetaTag } from "@shared/seo";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  type?: "website" | "article" | "music.song" | "music.album" | "profile";
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  canonicalUrl?: string;
  noindex?: boolean;
  structuredData?: object;
}

export function SEOHead({
  canonicalUrl,
  noindex = false,
}: SEOProps) {
  const [location] = useLocation();
  const origin = typeof window !== "undefined" ? window.location.origin : "https://www.grouptherapyeg.com";
  const rawLocation = typeof location === "string" ? location : "/";
  const cleanPath = (rawLocation.split("?").shift() ?? "/").split("#").shift() ?? "/";
  const nonEmpty = (value: unknown): string | undefined => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  };

  const canonicalOverride = nonEmpty(canonicalUrl);

  const { data: computed, isFetched: computedFetched } = useQuery({
    queryKey: ["computedSeo", cleanPath],
    queryFn: async (): Promise<SeoComputed> => {
      const params = new URLSearchParams();
      params.set("path", cleanPath);
      const resp = await fetch(`/api/seo?${params.toString()}`);
      if (!resp.ok) throw new Error(`Failed to fetch SEO: ${resp.status}`);
      return resp.json();
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!computedFetched || !computed) return;

    const canonical = canonicalOverride || computed.canonical || `${origin}${cleanPath}`;
    const robots = noindex ? "noindex, nofollow" : computed.robots;

    // Set document title
    document.title = computed.title;

    // Update meta tags
    updateMetaTag("title", computed.title);
    updateMetaTag("description", computed.description);
    updateMetaTag("keywords", (computed.keywords || []).join(", "));

    updateMetaTag("name", computed.title, "itemprop");
    updateMetaTag("description", computed.description, "itemprop");
    updateMetaTag("image", computed.ogImage, "itemprop");
    
    // Open Graph tags
    updateMetaTag("og:title", computed.title, "property");
    updateMetaTag("og:description", computed.description, "property");
    updateMetaTag("og:image", computed.ogImage, "property");
    updateMetaTag("og:logo", computed.ogLogo, "property");
    updateMetaTag("og:url", canonical, "property");
    updateMetaTag("og:type", computed.ogType, "property");
    updateMetaTag("og:site_name", computed.siteName, "property");

    // Twitter Card tags
    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:title", computed.title);
    updateMetaTag("twitter:description", computed.description);
    updateMetaTag("twitter:image", computed.twitterImage);
    if (computed.twitterHandle) updateMetaTag("twitter:site", computed.twitterHandle);

    // Canonical URL
    updateLinkTag("canonical", canonical);

    // Robots meta
    updateMetaTag("robots", robots);

    // Dynamic date meta tags (remove when not applicable)
    const removeMetaTag = (name: string, attribute: string = "name") => {
      const el = document.querySelector(`meta[${attribute}="${name}"]`);
      if (el && el.parentNode) el.parentNode.removeChild(el);
    };

    removeMetaTag("article:published_time", "property");
    removeMetaTag("article:author", "property");
    removeMetaTag("music:release_date", "property");
    removeMetaTag("event:start_time", "property");
    removeMetaTag("event:end_time", "property");
    removeMetaTag("og:updated_time", "property");

    const extra = Array.isArray(computed.extraMetaTags) ? (computed.extraMetaTags as SeoMetaTag[]) : [];
    for (const t of extra) {
      if (!t || typeof t !== "object") continue;
      const attr = (t as any).attr;
      const key = (t as any).key;
      const content = (t as any).content;
      if (typeof attr !== "string" || typeof key !== "string" || typeof content !== "string") continue;
      updateMetaTag(key, content, attr);
    }

    // Structured data
    if (computed.structuredData) {
      updateStructuredData(computed.structuredData);
    }
  }, [
    noindex,
    canonicalOverride,
    cleanPath,
    computed,
    computedFetched,
    origin,
  ]);

  return null;
}

function updateMetaTag(name: string, content: string, attribute: string = "name") {
  let element = document.querySelector(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function updateLinkTag(rel: string, href: string) {
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  element.href = href;
}

function updateStructuredData(data: object) {
  const id = "structured-data";
  let script = document.getElementById(id);
  if (!script) {
    script = document.createElement("script");
    script.id = id;
    (script as HTMLScriptElement).type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data).replace(/</g, "\\u003c");
}

export function generateStructuredData(type: string, data: any) {
  const baseData = {
    "@context": "https://schema.org",
    "@type": type,
    ...data,
  };
  return baseData;
}
