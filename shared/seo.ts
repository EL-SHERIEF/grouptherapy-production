export type SeoRoute =
  | { kind: "home" }
  | { kind: "post"; slug: string }
  | { kind: "release"; slug: string }
  | { kind: "event"; slug: string }
  | { kind: "artist"; slug: string }
  | { kind: "static"; slug: string }
  | { kind: "section"; slug: string };

export type SeoMetaTag =
  | { attr: "name"; key: string; content: string }
  | { attr: "property"; key: string; content: string }
  | { attr: "itemprop"; key: string; content: string };

export type NormalizedSeoSettings = {
  defaultTitle?: string;
  defaultDescription?: string;
  defaultKeywords?: string[];
  ogImage?: string;
  twitterImage?: string;
  twitterHandle?: string;
  organizationSchema?: any;
  websiteSchema?: any;
  musicGroupSchema?: any;
  headScripts?: string;
  bodyScripts?: string;
};

export type SeoComputed = {
  title: string;
  description: string;
  keywords: string[];
  canonical: string;
  robots: string;
  ogType: string;
  siteName: string;
  ogImage: string;
  ogLogo: string;
  twitterImage: string;
  twitterHandle?: string;
  extraMetaTags: SeoMetaTag[];
  structuredData?: object;
  headScripts?: string;
  bodyScripts?: string;
};

export type SeoContent = {
  post?: {
    title: string;
    metaTitle?: string;
    metaDescription?: string;
    excerpt?: string;
    content?: string;
    coverUrl?: string;
    ogImageUrl?: string;
    tags?: string[];
    category?: string;
    authorName?: string;
    publishedAt?: string;
    createdAt?: string;
  } | null;
  release?: {
    title: string;
    artistName: string;
    type?: string;
    releaseDate?: string;
    coverUrl?: string;
    genres?: string[];
    createdAt?: string;
  } | null;
  event?: {
    title: string;
    description?: string;
    venue?: string;
    address?: string;
    city?: string;
    country?: string;
    date?: string;
    endDate?: string;
    imageUrl?: string;
    createdAt?: string;
  } | null;
  artist?: {
    name: string;
    bio?: string;
    imageUrl?: string;
    createdAt?: string;
  } | null;
  staticPage?: {
    title?: string;
    metaTitle?: string;
    metaDescription?: string;
    content?: string;
    updatedAt?: string;
    createdAt?: string;
  } | null;
};

export function nonEmpty(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

export function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export function toAbsoluteUrl(value: string, baseUrl: string): string {
  const v = value.trim();
  if (!v) return v;
  if (isAbsoluteUrl(v)) return v;
  if (v.startsWith("/")) return `${baseUrl}${v}`;
  return `${baseUrl}/${v}`;
}

export function safeIsoDate(value: unknown): string | undefined {
  if (!value) return undefined;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function stripAndTruncate(value: string | undefined, maxLen = 160): string | undefined {
  if (!value) return undefined;
  const text = value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return undefined;
  return text.length > maxLen ? `${text.slice(0, maxLen - 1).trim()}…` : text;
}

export function sectionMeta(siteName: string, slug: string): { title?: string; description?: string } {
  switch (slug) {
    case "news":
      return { title: `News | ${siteName}`, description: "Latest updates, announcements, and stories." };
    case "releases":
      return { title: `Releases | ${siteName}`, description: "Discover new and featured music releases." };
    case "events":
      return { title: `Events | ${siteName}`, description: "Upcoming shows, parties, and community gatherings." };
    case "artists":
      return { title: `Artists | ${siteName}`, description: "Explore our roster and featured artists." };
    case "videos":
      return { title: `Videos | ${siteName}`, description: "Watch music videos, live sets, and label content." };
    case "playlists":
      return { title: `Playlists | ${siteName}`, description: "Curated playlists and mixes." };
    case "radio":
      return { title: `Radio | ${siteName}`, description: "Live radio and recorded shows." };
    case "about":
      return { title: `About | ${siteName}`, description: "Learn more about the label and our mission." };
    case "contact":
      return { title: `Contact | ${siteName}`, description: "Get in touch with the team." };
    case "press":
      return { title: `Press | ${siteName}`, description: "Press resources, assets, and contact information." };
    case "careers":
      return { title: `Careers | ${siteName}`, description: "Open roles and opportunities." };
    case "tours":
      return { title: `Tours | ${siteName}`, description: "Tours and appearances." };
    case "awards":
      return { title: `Awards | ${siteName}`, description: "Awards and nominations." };
    case "promote-your-release":
      return {
        title: `Promote Your Release | ${siteName}`,
        description: "Launch smarter with a full promo plan: strategy, pitching, press, and paid distribution for your next release.",
      };
    case "promote-your-event":
      return {
        title: `Promote Your Event | ${siteName}`,
        description: "Fill your room with a focused event promo plan: creative assets, ads, partnerships, and ticket conversion tracking.",
      };
    default:
      return {};
  }
}

export function parseSeoRoute(pathname: string): SeoRoute {
  const clean = (pathname.split("?").shift() ?? "/").split("#").shift() ?? "/";
  const seg = clean.split("/").filter(Boolean);
  const first = seg[0] || "";
  const second = seg[1] || "";

  if (!first) return { kind: "home" };

  if (first === "news" && second) return { kind: "post", slug: second };
  if (first === "releases" && second) return { kind: "release", slug: second };
  if (first === "events" && second) return { kind: "event", slug: second };
  if (first === "artists" && second) return { kind: "artist", slug: second };

  if (["terms", "privacy", "cookies"].includes(first)) return { kind: "static", slug: first };

  return { kind: "section", slug: first };
}

function uniqKeywords(values: Array<string | undefined | null>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of values) {
    const v = typeof raw === "string" ? raw.trim() : "";
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

export function extractSiteName(settings?: NormalizedSeoSettings): string {
  const org = settings?.organizationSchema?.name;
  if (typeof org === "string" && org.trim().length) return org.trim();
  const web = settings?.websiteSchema?.name;
  if (typeof web === "string" && web.trim().length) return web.trim();
  return "GroupTherapy Records";
}

export function extractOgLogo(settings: NormalizedSeoSettings | undefined, baseUrl: string): string {
  const raw = nonEmpty(settings?.organizationSchema?.logo) || nonEmpty(settings?.websiteSchema?.logo);
  if (raw) return toAbsoluteUrl(raw, baseUrl);
  return `${baseUrl}/favicon.png`;
}

export function computeSeo(args: {
  pathname: string;
  baseUrl: string;
  canonicalOverride?: string;
  noindex?: boolean;
  settings?: NormalizedSeoSettings | null;
  content?: SeoContent;
}): SeoComputed {
  const { pathname, baseUrl, canonicalOverride, noindex = false, settings, content } = args;

  const route = parseSeoRoute(pathname);

  const siteName = extractSiteName(settings ?? undefined);

  const fallbackTitle = nonEmpty(settings?.defaultTitle) || "GroupTherapy Records - Electronic Music Label";
  const fallbackDescription =
    nonEmpty(settings?.defaultDescription) ||
    "The sound of tomorrow, today. Discover cutting-edge electronic music from the world's most innovative artists. Releases, events, radio, and more.";

  const baseKeywords =
    Array.isArray(settings?.defaultKeywords) && settings?.defaultKeywords.length
      ? settings!.defaultKeywords
      : [
          "electronic music",
          "record label",
          "house music",
          "techno",
          "DJ",
          "music events",
          "music releases",
          "independent label",
        ];

  const canonical = nonEmpty(canonicalOverride) || `${baseUrl}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
  const robots = noindex
    ? "noindex, nofollow"
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

  const orgId = `${baseUrl}/#organization`;
  const websiteId = `${baseUrl}/#website`;
  const musicGroupId = `${baseUrl}/#musicgroup`;
  const webPageId = canonical;

  let title = fallbackTitle;
  let description = fallbackDescription;
  let ogType = "website";

  const extraMetaTags: SeoMetaTag[] = [];

  const post = content?.post ?? null;
  const release = content?.release ?? null;
  const event = content?.event ?? null;
  const artist = content?.artist ?? null;
  const staticPage = content?.staticPage ?? null;

  let routeImage: string | undefined;
  let routeKeywords: string[] = [];

  if (route.kind === "post" && post) {
    title = `${post.metaTitle || post.title} | ${siteName}`;
    description = post.metaDescription || post.excerpt || stripAndTruncate(post.content) || fallbackDescription;
    routeImage = post.ogImageUrl || post.coverUrl || undefined;
    ogType = "article";

    routeKeywords = uniqKeywords([
      ...baseKeywords,
      siteName,
      post.category,
      ...(Array.isArray(post.tags) ? post.tags : []),
      post.authorName,
      post.title,
    ]);

    const publishedTime = safeIsoDate(post.publishedAt || post.createdAt);
    if (publishedTime) {
      extraMetaTags.push({ attr: "property", key: "article:published_time", content: publishedTime });
      extraMetaTags.push({ attr: "property", key: "og:updated_time", content: publishedTime });
    }
    if (post.authorName) {
      extraMetaTags.push({ attr: "property", key: "article:author", content: String(post.authorName) });
    }
  } else if (route.kind === "release" && release) {
    title = `${release.title} | ${siteName}`;
    description =
      stripAndTruncate(
        `${release.artistName} • ${release.type || "release"}${release.releaseDate ? ` • ${release.releaseDate}` : ""}`,
        160
      ) || fallbackDescription;
    routeImage = release.coverUrl || undefined;
    ogType = "music.album";

    routeKeywords = uniqKeywords([
      ...baseKeywords,
      siteName,
      release.artistName,
      release.title,
      release.type,
      ...(Array.isArray(release.genres) ? release.genres : []),
    ]);

    const releaseDate = safeIsoDate(release.releaseDate || release.createdAt);
    if (releaseDate) {
      extraMetaTags.push({ attr: "property", key: "music:release_date", content: releaseDate });
      extraMetaTags.push({ attr: "property", key: "og:updated_time", content: releaseDate });
    }
  } else if (route.kind === "event" && event) {
    title = `${event.title} | ${siteName}`;
    description =
      event.description ||
      stripAndTruncate(`${event.city || ""}${event.country ? `, ${event.country}` : ""} • ${event.date || ""}`) ||
      fallbackDescription;
    routeImage = event.imageUrl || undefined;
    ogType = "event";

    routeKeywords = uniqKeywords([
      ...baseKeywords,
      siteName,
      event.title,
      event.venue,
      event.city,
      event.country,
      "events",
    ]);

    const startTime = safeIsoDate(event.date || event.createdAt);
    const endTime = safeIsoDate(event.endDate);
    if (startTime) {
      extraMetaTags.push({ attr: "property", key: "event:start_time", content: startTime });
      extraMetaTags.push({ attr: "property", key: "og:updated_time", content: startTime });
    }
    if (endTime) extraMetaTags.push({ attr: "property", key: "event:end_time", content: endTime });
  } else if (route.kind === "artist" && artist) {
    title = `${artist.name} | ${siteName}`;
    description = stripAndTruncate(artist.bio) || fallbackDescription;
    routeImage = artist.imageUrl || undefined;
    ogType = "profile";

    routeKeywords = uniqKeywords([...baseKeywords, siteName, artist.name, "artists"]);

    const createdTime = safeIsoDate(artist.createdAt);
    if (createdTime) {
      extraMetaTags.push({ attr: "property", key: "og:updated_time", content: createdTime });
    }
  } else if ((route.kind === "static" || route.kind === "section") && staticPage) {
    const metaTitle = nonEmpty(staticPage.metaTitle);
    const staticTitle = metaTitle || nonEmpty(staticPage.title);
    const staticDescription = nonEmpty(staticPage.metaDescription) || stripAndTruncate(staticPage.content);

    const sectionResolved = route.kind === "section" ? sectionMeta(siteName, route.slug) : {};

    title = staticTitle
      ? metaTitle
        ? staticTitle
        : `${staticTitle} | ${siteName}`
      : sectionResolved.title || fallbackTitle;

    description = staticDescription || sectionResolved.description || fallbackDescription;

    routeKeywords = uniqKeywords([...baseKeywords, siteName, route.slug, staticTitle]);

    const updatedTime = safeIsoDate(staticPage.updatedAt || staticPage.createdAt);
    if (updatedTime) {
      extraMetaTags.push({ attr: "property", key: "og:updated_time", content: updatedTime });
    }
  } else if (route.kind === "section") {
    const sectionResolved = sectionMeta(siteName, route.slug);
    if (sectionResolved.title) title = sectionResolved.title;
    if (sectionResolved.description) description = sectionResolved.description;
    routeKeywords = uniqKeywords([...baseKeywords, siteName, route.slug]);
  }

  const resolvedKeywords = routeKeywords.length ? routeKeywords : baseKeywords;

  const ogImageRaw = routeImage || nonEmpty(settings?.ogImage) || `https://res.cloudinary.com/dhnsohfxf/image/upload/f_auto,q_auto,w_900/v1767568913/seo/dii94qb2juy2cqil9lxc.jpg`;
  const ogImage = toAbsoluteUrl(String(ogImageRaw), baseUrl);

  const twitterImageRaw =
    routeImage ||
    nonEmpty(settings?.twitterImage) ||
    nonEmpty(settings?.ogImage) ||
    `https://res.cloudinary.com/dhnsohfxf/image/upload/f_auto,q_auto,w_900/v1767568913/seo/dii94qb2juy2cqil9lxc.jpg`;
  const twitterImage = toAbsoluteUrl(String(twitterImageRaw), baseUrl);

  const ogLogo = extractOgLogo(settings ?? undefined, baseUrl);
  const twitterHandle = nonEmpty(settings?.twitterHandle);

  const contentSchemas: any[] = [];
  const contentImageAbs = routeImage ? toAbsoluteUrl(String(routeImage), baseUrl) : undefined;

  const stripContext = (node: any) => {
    if (!node || typeof node !== "object" || Array.isArray(node)) return node;
    const { "@context": _ctx, ...rest } = node as any;
    return rest;
  };

  const normalizeSchemaNode = (node: any, fallbackId: string) => {
    if (!node || typeof node !== "object" || Array.isArray(node)) return null;
    const n: any = { ...stripContext(node) };
    if (!n["@id"]) n["@id"] = fallbackId;
    if (!n.url) n.url = baseUrl;
    if (typeof n.logo === "string") n.logo = toAbsoluteUrl(n.logo, baseUrl);
    if (typeof n.image === "string") n.image = toAbsoluteUrl(n.image, baseUrl);
    return n;
  };

  const defaultOrganizationSchema = {
    "@type": "Organization",
    name: siteName,
    url: baseUrl,
    logo: `${baseUrl}/favicon.png`,
  };

  const defaultWebsiteSchema = {
    "@type": "WebSite",
    name: siteName,
    url: baseUrl,
  };

  const defaultMusicGroupSchema = {
    "@type": "MusicGroup",
    name: siteName,
    url: baseUrl,
  };

  const pageTypeForRoute = (): string => {
    if (route.kind === "home") return "WebPage";
    if (route.kind === "post") return "WebPage";
    if (route.kind === "release") return "WebPage";
    if (route.kind === "event") return "WebPage";
    if (route.kind === "artist") return "WebPage";
    if (route.kind === "static") return "WebPage";
    if (route.kind === "section") {
      if (route.slug === "about") return "AboutPage";
      if (route.slug === "contact") return "ContactPage";
      if (route.slug === "news") return "CollectionPage";
      if (route.slug === "releases") return "CollectionPage";
      if (route.slug === "events") return "CollectionPage";
      if (route.slug === "artists") return "CollectionPage";
      if (route.slug === "radio") return "CollectionPage";
      if (route.slug === "awards") return "CollectionPage";
      if (route.slug === "careers") return "CollectionPage";
      return "WebPage";
    }
    return "WebPage";
  };

  const breadcrumbForRoute = (): any | null => {
    const items: Array<{ name: string; url: string }> = [{ name: "Home", url: baseUrl + "/" }];
    if (route.kind === "home") return null;
    if (route.kind === "section") {
      items.push({ name: route.slug.charAt(0).toUpperCase() + route.slug.slice(1), url: canonical });
    } else if (route.kind === "static") {
      items.push({ name: route.slug.charAt(0).toUpperCase() + route.slug.slice(1), url: canonical });
    } else if (route.kind === "post") {
      items.push({ name: "News", url: `${baseUrl}/news` });
      if (post?.title) items.push({ name: String(post.title), url: canonical });
    } else if (route.kind === "release") {
      items.push({ name: "Releases", url: `${baseUrl}/releases` });
      if (release?.title) items.push({ name: String(release.title), url: canonical });
    } else if (route.kind === "event") {
      items.push({ name: "Events", url: `${baseUrl}/events` });
      if (event?.title) items.push({ name: String(event.title), url: canonical });
    } else if (route.kind === "artist") {
      items.push({ name: "Artists", url: `${baseUrl}/artists` });
      if (artist?.name) items.push({ name: String(artist.name), url: canonical });
    }

    return {
      "@type": "BreadcrumbList",
      "@id": `${canonical}#breadcrumb`,
      itemListElement: items.map((it, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: it.name,
        item: it.url,
      })),
    };
  };

  if (route.kind === "post" && post) {
    const entityId = `${canonical}#blogposting`;
    const datePublished = safeIsoDate(post.publishedAt || post.createdAt);
    contentSchemas.push({
      "@type": "BlogPosting",
      "@id": entityId,
      headline: String(post.metaTitle || post.title),
      description: String(post.metaDescription || post.excerpt || stripAndTruncate(post.content, 200) || fallbackDescription),
      image: contentImageAbs ? [contentImageAbs] : undefined,
      datePublished,
      dateModified: datePublished,
      author: post.authorName ? { "@type": "Person", name: String(post.authorName) } : undefined,
      mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
      url: canonical,
    });
  }

  if (route.kind === "release" && release) {
    const entityId = `${canonical}#musicalbum`;
    const releaseDate = safeIsoDate(release.releaseDate || release.createdAt);
    contentSchemas.push({
      "@type": "MusicAlbum",
      "@id": entityId,
      name: String(release.title),
      byArtist: { "@type": "MusicGroup", name: String(release.artistName) },
      datePublished: releaseDate,
      image: contentImageAbs ? [contentImageAbs] : undefined,
      url: canonical,
    });
  }

  if (route.kind === "event" && event) {
    const entityId = `${canonical}#event`;
    const startTime = safeIsoDate(event.date || event.createdAt);
    const endTime = safeIsoDate(event.endDate);
    contentSchemas.push({
      "@type": "Event",
      "@id": entityId,
      name: String(event.title),
      description: event.description ? String(event.description) : undefined,
      startDate: startTime,
      endDate: endTime,
      url: canonical,
      image: contentImageAbs ? [contentImageAbs] : undefined,
      location: {
        "@type": "Place",
        name: event.venue ? String(event.venue) : undefined,
        address: {
          "@type": "PostalAddress",
          streetAddress: event.address ? String(event.address) : undefined,
          addressLocality: event.city ? String(event.city) : undefined,
          addressCountry: event.country ? String(event.country) : undefined,
        },
      },
    });
  }

  if (route.kind === "artist" && artist) {
    const entityId = `${canonical}#person`;
    contentSchemas.push({
      "@type": "Person",
      "@id": entityId,
      name: String(artist.name),
      description: artist.bio ? String(artist.bio) : undefined,
      image: contentImageAbs ? [contentImageAbs] : undefined,
      url: canonical,
    });
  }

  const organizationSchema =
    normalizeSchemaNode(settings?.organizationSchema ?? defaultOrganizationSchema, orgId) ||
    normalizeSchemaNode(defaultOrganizationSchema, orgId);
  const websiteSchema =
    normalizeSchemaNode(settings?.websiteSchema ?? defaultWebsiteSchema, websiteId) ||
    normalizeSchemaNode(defaultWebsiteSchema, websiteId);
  const musicGroupSchema =
    normalizeSchemaNode(settings?.musicGroupSchema ?? defaultMusicGroupSchema, musicGroupId) ||
    normalizeSchemaNode(defaultMusicGroupSchema, musicGroupId);

  const mainEntityId = contentSchemas.length ? contentSchemas[0]?.["@id"] : undefined;

  const webPageSchema: any = {
    "@type": pageTypeForRoute(),
    "@id": webPageId,
    url: canonical,
    name: title,
    description,
    isPartOf: { "@id": websiteId },
    about: { "@id": orgId },
    breadcrumb: route.kind === "home" ? undefined : { "@id": `${canonical}#breadcrumb` },
    primaryImageOfPage: ogImage ? { "@type": "ImageObject", url: ogImage } : undefined,
    mainEntity: mainEntityId ? { "@id": mainEntityId } : undefined,
  };

  const breadcrumbSchema = breadcrumbForRoute();

  const baseSchemas = [organizationSchema, websiteSchema, musicGroupSchema].filter(Boolean);
  const schemas = [...baseSchemas, webPageSchema, breadcrumbSchema, ...contentSchemas].filter(Boolean);
  const structuredData = schemas.length
    ? {
        "@context": "https://schema.org",
        "@graph": schemas,
      }
    : undefined;

  return {
    title,
    description,
    keywords: resolvedKeywords,
    canonical,
    robots,
    ogType,
    siteName,
    ogImage,
    ogLogo,
    twitterImage,
    twitterHandle,
    structuredData,
    extraMetaTags,
    headScripts: typeof settings?.headScripts === "string" ? settings.headScripts : undefined,
    bodyScripts: typeof settings?.bodyScripts === "string" ? settings.bodyScripts : undefined,
  };
}

export function normalizeSeoSettings(input: any): NormalizedSeoSettings | null {
  if (!input || typeof input !== "object") return null;

  const normalized: NormalizedSeoSettings = {
    defaultTitle: nonEmpty(input.defaultTitle ?? input.default_title),
    defaultDescription: nonEmpty(input.defaultDescription ?? input.default_description),
    defaultKeywords: Array.isArray(input.defaultKeywords ?? input.default_keywords)
      ? (input.defaultKeywords ?? input.default_keywords).filter((k: any) => typeof k === "string" && k.trim().length)
      : undefined,
    ogImage: nonEmpty(input.ogImage ?? input.og_image),
    twitterImage: nonEmpty(input.twitterImage ?? input.twitter_image),
    twitterHandle: nonEmpty(input.twitterHandle ?? input.twitter_handle),
    organizationSchema: input.organizationSchema ?? input.organization_schema,
    websiteSchema: input.websiteSchema ?? input.website_schema,
    musicGroupSchema: input.musicGroupSchema ?? input.music_group_schema,
    headScripts: typeof (input.headScripts ?? input.head_scripts) === "string" ? (input.headScripts ?? input.head_scripts) : undefined,
    bodyScripts: typeof (input.bodyScripts ?? input.body_scripts) === "string" ? (input.bodyScripts ?? input.body_scripts) : undefined,
  };

  return normalized;
}
