const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

export type MediaSize = "thumb" | "card" | "hero" | "full";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif"] as const;

function isAbsoluteHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function stripQueryAndHash(url: string): string {
  return url.split("#")[0]?.split("?")[0] || url;
}

function isLikelyImageUrl(url: string): boolean {
  const raw = url.trim();
  if (!raw) return false;
  if (raw.startsWith("data:")) return false;
  if (!isAbsoluteHttpUrl(raw)) return false;

  const clean = stripQueryAndHash(raw).toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => clean.endsWith(`.${ext}`));
}

function getWidthForSize(size: MediaSize): number {
  switch (size) {
    case "thumb":
      return 200;
    case "card":
      return 500;
    case "hero":
      return 600;
    case "full":
      return 900;
    default:
      return 300;
  }
}

function buildTransform(size: MediaSize): string {
  const w = getWidthForSize(size);
  return `f_auto,q_auto,w_${w}`;
}

function isCloudinaryImageUrl(url: string): boolean {
  return /https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/(upload|fetch)\//i.test(url);
}

function rewriteExistingCloudinaryUrl(url: string, size: MediaSize): string {
  const transform = buildTransform(size);

  const match = url.match(/^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/(?:upload|fetch))\/(.+)$/i);
  if (!match || !match[2]) return url;

  const prefix = match[1];
  const rest = match[2];
  const parts = rest.split("/").filter(Boolean);

  const first = parts[0] || "";
  const looksLikeTransform =
    first.includes(",") ||
    /^(?:c_|w_|h_|q_|f_|g_|ar_|dpr_|e_|t_|fl_|l_)/.test(first);

  const remaining = looksLikeTransform ? parts.slice(1) : parts;
  const remainingPath = remaining.join("/");

  return remainingPath ? `${prefix}/${transform}/${remainingPath}` : `${prefix}/${transform}`;
}

function buildCloudinaryUploadUrl(sourceUrl: string, size: MediaSize): string {
  if (!CLOUDINARY_CLOUD_NAME) return sourceUrl;

  const transform = buildTransform(size);
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transform}/${encodeURIComponent(sourceUrl)}`;
}

// ----------------- SoundCloud Support -----------------
const SOUNDCLOUD_IMAGE_REGEX = /^(https?:\/\/i\d\.sndcdn\.com\/artworks-[^/]+)-(?:t?)(\d+)x(\d+)\.(jpg|jpeg|png)$/i;

function isSoundCloudImageUrl(url: string): boolean {
  return SOUNDCLOUD_IMAGE_REGEX.test(url);
}

function rewriteSoundCloudUrl(url: string, size: MediaSize): string {
  const w = getWidthForSize(size);
  const match = url.match(SOUNDCLOUD_IMAGE_REGEX);
  if (!match) return url;

  const prefix = match[1]; // artworks-xxxx
  const ext = match[4];    // jpg/png
  return `${prefix}-t${w}x${w}.${ext}`;
}

// ----------------- Main Resolver -----------------
export function resolveMediaUrl(
  url: string | null | undefined,
  size: MediaSize = "card"
): string {
  if (!url) return "";

  const raw = url.trim();
  if (!raw) return "";

  // Cloudinary URLs: rewrite with transform
  if (isCloudinaryImageUrl(raw)) {
    return rewriteExistingCloudinaryUrl(raw, size);
  }

  // SoundCloud images: rewrite the size
  if (isSoundCloudImageUrl(raw)) {
    return rewriteSoundCloudUrl(raw, size);
  }

  // Likely image but not Cloudinary/SoundCloud: return original URL
  if (isLikelyImageUrl(raw)) {
    return raw;
  }

  // Non-image (video/audio/other): return as-is
  return raw;
}
