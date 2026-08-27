export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  try {
    const cookies = document.cookie ? document.cookie.split("; ") : [];
    for (const cookie of cookies) {
      const eqIndex = cookie.indexOf("=");
      if (eqIndex < 0) continue;
      const key = cookie.slice(0, eqIndex);
      if (key === name) {
        return decodeURIComponent(cookie.slice(eqIndex + 1));
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function setCookie(
  name: string,
  value: string,
  options?: {
    maxAgeSeconds?: number;
    path?: string;
    sameSite?: "lax" | "strict" | "none";
    secure?: boolean;
  },
): boolean {
  if (typeof document === "undefined") return false;
  try {
    const path = options?.path ?? "/";
    const maxAge = options?.maxAgeSeconds;
    const sameSite = options?.sameSite ?? "lax";
    const secure = options?.secure ?? (sameSite === "none");

    const parts = [
      `${name}=${encodeURIComponent(value)}`,
      `path=${path}`,
      maxAge !== undefined ? `max-age=${maxAge}` : undefined,
      `samesite=${sameSite}`,
      secure ? "secure" : undefined,
    ].filter(Boolean);

    document.cookie = parts.join("; ");
    return true;
  } catch {
    return false;
  }
}

export function deleteCookie(name: string): boolean {
  return setCookie(name, "", { maxAgeSeconds: 0 });
}
