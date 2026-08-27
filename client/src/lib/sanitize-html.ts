export type SanitizeHtmlOptions = {
  allowIframes?: boolean;
  allowedIframeSrcPrefixes?: string[];
};

function isSafeUrl(value: string): boolean {
  const v = value.trim().toLowerCase();
  if (!v) return true;
  if (v.startsWith("javascript:")) return false;
  return true;
}

export function sanitizeHtml(input: string, options: SanitizeHtmlOptions = {}): string {
  const html = input || "";

  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return html
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
      .replace(/ on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const blockedTags = new Set(["script", "object", "embed", "link", "meta", "style"]);

  const walk = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      if (blockedTags.has(tag)) {
        el.remove();
        return;
      }

      if (tag === "iframe") {
        if (!options.allowIframes) {
          el.remove();
          return;
        }

        const src = el.getAttribute("src") || "";
        const allowed = (options.allowedIframeSrcPrefixes || []).some((p) => src.startsWith(p));
        if (!allowed) {
          el.remove();
          return;
        }

        for (const attr of Array.from(el.attributes)) {
          const name = attr.name.toLowerCase();
          if (name.startsWith("on")) el.removeAttribute(attr.name);
          if (name === "srcdoc") el.removeAttribute(attr.name);
        }
      } else {
        for (const attr of Array.from(el.attributes)) {
          const name = attr.name.toLowerCase();
          const value = attr.value;

          if (name.startsWith("on")) {
            el.removeAttribute(attr.name);
            continue;
          }

          if (name === "style") {
            el.removeAttribute(attr.name);
            continue;
          }

          if ((name === "href" || name === "src") && !isSafeUrl(value)) {
            el.removeAttribute(attr.name);
            continue;
          }

          if (name === "target") {
            el.setAttribute("rel", "bookmark");
          }
        }
      }
    }

    for (const child of Array.from(node.childNodes)) walk(child);
  };

  walk(doc.body);
  return doc.body.innerHTML;
}
