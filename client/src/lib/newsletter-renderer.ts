export type NewsletterTemplateGlobalSettings = {
  brandName?: string;
  backgroundColor?: string;
  containerBackgroundColor?: string;
  textColor?: string;
  mutedTextColor?: string;
  accentColor?: string;
  buttonBackgroundColor?: string;
  buttonTextColor?: string;
  fontFamily?: string;
  containerWidth?: number;
  containerPadding?: number;
  contentPadding?: number;
  borderRadius?: number;
};

export type NewsletterTemplateSectionBase = {
  id: string;
  type:
    | "header"
    | "hero"
    | "richText"
    | "image"
    | "buttonRow"
    | "twoColumn"
    | "divider"
    | "spacer"
    | "latestReleases"
    | "upcomingEvents"
    | "footer";
  enabled?: boolean;
  settings?: {
    backgroundColor?: string;
  };
  content?: Record<string, any>;
};

export type NewsletterTemplateAssets = {
  logoUrl?: string;
  logoHref?: string;
};

export type RenderNewsletterTemplate = {
  globalSettings: NewsletterTemplateGlobalSettings;
  assets: NewsletterTemplateAssets;
  sections: NewsletterTemplateSectionBase[];
};

export type RenderNewsletterCampaign = {
  subject?: string;
  preheader?: string;
  content: {
    global?: Record<string, any>;
    sections?: Record<string, Record<string, any>>;
  };
};

export type RenderNewsletterRelease = {
  title: string;
  artistName: string;
  coverUrl?: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  soundcloudUrl?: string;
  slug?: string;
};

export type RenderNewsletterEvent = {
  title: string;
  date: string;
  city?: string;
  country?: string;
  ticketUrl?: string;
  slug?: string;
  imageUrl?: string;
};

export type RenderNewsletterData = {
  releases?: RenderNewsletterRelease[];
  events?: RenderNewsletterEvent[];
  siteUrl?: string;
};

export type RenderNewsletterEditorOptions = {
  enableSectionMarkers?: boolean;
  selectedSectionId?: string;
};

function esc(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function px(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function color(value: string | undefined, fallback: string): string {
  const v = String(value || "").trim();
  return v || fallback;
}

function joinUrl(base: string | undefined, path: string | undefined): string {
  const b = String(base || "").replace(/\/$/, "");
  const p = String(path || "");
  if (!b || !p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  return `${b}/${p.replace(/^\//, "")}`;
}

function normalizeCta(args: { label: string; href: string; baseUrl?: string }): { label: string; href: string } {
  const rawLabel = String(args.label || "").trim();
  const rawHref = String(args.href || "").trim();

  let label = rawLabel;
  let href = rawHref;

  if (label) {
    const md = label.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (md) {
      label = String(md[1] || "").trim();
      if (!href) href = String(md[2] || "").trim();
    }

    const pref = label.match(/^\(([^)]+)\)\s*(.+)$/);
    if (pref) {
      if (!href) href = String(pref[1] || "").trim();
      label = String(pref[2] || "").trim();
    }

    const suff = label.match(/^(.+?)\s*\(([^)]+)\)$/);
    if (suff) {
      if (!href) href = String(suff[2] || "").trim();
      label = String(suff[1] || "").trim();
    }
  }

  const abs = joinUrl(args.baseUrl, href);
  href = abs || href;

  return { label, href };
}

function renderMarkdownToEmailHtml(markdown: string, styles: { textColor: string; accentColor: string; fontFamily: string; fontSize: number; lineHeight: number }): string {
  const raw = String(markdown || "").trim();
  if (!raw) return "";

  const lines = raw.split(/\r?\n/);
  const blocks: string[] = [];

  const toInline = (s: string) => {
    let out = esc(s);
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight:700;">$1</strong>');
    out = out.replace(/\*([^*]+)\*/g, '<em style="font-style:italic;">$1</em>');
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, href) => {
      const safeHref = String(href || "").trim();
      return `<a href="${esc(safeHref)}" style="color:${styles.accentColor};text-decoration:underline;">${esc(label)}</a>`;
    });
    return out;
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i] || "";
    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push(
        `<h3 style="margin:18px 0 8px 0;color:${styles.textColor};font-family:${styles.fontFamily};font-size:18px;line-height:24px;font-weight:700;">${toInline(line.slice(4))}</h3>`
      );
      i += 1;
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push(
        `<h2 style="margin:22px 0 10px 0;color:${styles.textColor};font-family:${styles.fontFamily};font-size:22px;line-height:28px;font-weight:800;">${toInline(line.slice(3))}</h2>`
      );
      i += 1;
      continue;
    }

    if (line.startsWith("# ")) {
      blocks.push(
        `<h1 style="margin:24px 0 12px 0;color:${styles.textColor};font-family:${styles.fontFamily};font-size:26px;line-height:32px;font-weight:900;">${toInline(line.slice(2))}</h1>`
      );
      i += 1;
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i] || "")) {
        items.push(`<li style="margin:0 0 6px 0;">${toInline((lines[i] || "").replace(/^\d+\.\s+/, ""))}</li>`);
        i += 1;
      }
      blocks.push(
        `<ol style="margin:12px 0 12px 22px;padding:0;color:${styles.textColor};font-family:${styles.fontFamily};font-size:${styles.fontSize}px;line-height:${styles.lineHeight}px;">${items.join("")}</ol>`
      );
      continue;
    }

    if (/^-\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^-\s+/.test(lines[i] || "")) {
        items.push(`<li style="margin:0 0 6px 0;">${toInline((lines[i] || "").replace(/^-\s+/, ""))}</li>`);
        i += 1;
      }
      blocks.push(
        `<ul style="margin:12px 0 12px 22px;padding:0;color:${styles.textColor};font-family:${styles.fontFamily};font-size:${styles.fontSize}px;line-height:${styles.lineHeight}px;">${items.join("")}</ul>`
      );
      continue;
    }

    const para: string[] = [line];
    i += 1;
    while (i < lines.length && (lines[i] || "").trim()) {
      para.push(lines[i] || "");
      i += 1;
    }

    blocks.push(
      `<p style="margin:0 0 14px 0;color:${styles.textColor};font-family:${styles.fontFamily};font-size:${styles.fontSize}px;line-height:${styles.lineHeight}px;">${toInline(para.join(" "))}</p>`
    );
  }

  return blocks.join("");
}

function sectionPadding(section: NewsletterTemplateSectionBase, defaults: { top: number; bottom: number }) {
  void section;
  void defaults;
  return { top: 0, bottom: 0 };
}

function wrapSection(args: {
  inner: string;
  sectionBg: string;
  padTop: number;
  padBottom: number;
  sectionId: string;
  editor?: RenderNewsletterEditorOptions;
  accentColor: string;
}): string {
  const mark = !!args.editor?.enableSectionMarkers;
  const isSelected = !!args.editor?.selectedSectionId && args.editor.selectedSectionId === args.sectionId;

  const dataAttr = mark ? ` data-newsletter-section-id="${esc(args.sectionId)}"` : "";
  const outline = mark && isSelected
    ? `outline:2px solid ${args.accentColor};outline-offset:-2px;`
    : "";
  const cursor = mark ? "cursor:pointer;" : "";

  return `
<tr>
  <td${dataAttr} style="background:${args.sectionBg};padding:${args.padTop}px 0 ${args.padBottom}px 0;${outline}${cursor}">
    ${args.inner}
  </td>
</tr>`;
}

function containerCell(inner: string, contentPadding: number): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td style="padding:0 ${contentPadding}px;">${inner}</td></tr></table>`;
}

function buttonHtml(args: { href: string; label: string; bg: string; color: string; fontFamily: string; borderRadius: number; align?: "left" | "center" | "right" }): string {
  const href = String(args.href || "").trim();
  const label = String(args.label || "").trim();
  if (!href || !label) return "";
  const align = args.align === "left" || args.align === "right" || args.align === "center" ? args.align : "center";
  const margin = align === "center" ? "0 auto" : align === "right" ? "0 0 0 auto" : "0";
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="${align}" style="margin:${margin};">
  <tr>
    <td style="background:${args.bg};border-radius:${args.borderRadius}px;">
      <a href="${esc(href)}" style="display:inline-block;padding:12px 18px;font-family:${args.fontFamily};font-size:14px;line-height:16px;font-weight:700;color:${args.color};text-decoration:none;border-radius:${args.borderRadius}px;">
        ${esc(label)}
      </a>
    </td>
  </tr>
</table>`;
}

function renderHeader(section: NewsletterTemplateSectionBase, template: RenderNewsletterTemplate, campaign: RenderNewsletterCampaign, gs: Required<NewsletterTemplateGlobalSettings>): string {
  const overrides = campaign.content.global || {};
  const logoUrl = String(overrides.logoUrl || template.assets.logoUrl || "").trim();
  const logoHref = String(overrides.logoHref || template.assets.logoHref || "").trim();
  if (!logoUrl) return "";

  const s: any = section.settings || {};
  const logoAlign = s.logoAlign === "left" || s.logoAlign === "right" || s.logoAlign === "center" ? s.logoAlign : "center";
  const logoWidth = px(s.logoWidth, 140);
  const showBrandName = !!s.showBrandName;
  const brandText = String(s.brandText || gs.brandName || "").trim();
  const brandTextColor = color(s.brandTextColor, gs.textColor);
  const brandTextSize = px(s.brandTextSize, 16);
  const brandGap = px(s.brandGap, 10);

  const img = `<img src="${esc(logoUrl)}" width="${logoWidth}" style="display:block;border:0;outline:none;text-decoration:none;height:auto;max-width:${logoWidth}px;" alt="${esc(gs.brandName)}" />`;
  const inner = logoHref ? `<a href="${esc(logoHref)}" style="text-decoration:none;display:inline-block;">${img}</a>` : img;

  const brandTd = showBrandName && brandText
    ? `<td valign="middle" style="padding-left:${brandGap}px;font-family:${gs.fontFamily};font-size:${brandTextSize}px;line-height:${brandTextSize + 6}px;font-weight:800;color:${brandTextColor};white-space:nowrap;">${esc(brandText)}</td>`
    : "";

  const margin = logoAlign === "center" ? "0 auto" : logoAlign === "right" ? "0 0 0 auto" : "0";
  const row = `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="${logoAlign}" style="margin:${margin};">
  <tr>
    <td valign="middle">${inner}</td>
    ${brandTd}
  </tr>
</table>`;

  return containerCell(
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td align="${logoAlign}" style="text-align:${logoAlign};">${row}</td></tr></table>`,
    gs.contentPadding
  );
}

function renderHero(
  section: NewsletterTemplateSectionBase,
  campaign: RenderNewsletterCampaign,
  gs: Required<NewsletterTemplateGlobalSettings>,
  data: RenderNewsletterData
): string {
  const c = { ...(section.content || {}), ...((campaign.content.sections || {})[section.id] || {}) };

  const s: any = section.settings || {};
  const textAlign = s.textAlign === "left" || s.textAlign === "right" || s.textAlign === "center" ? s.textAlign : "center";
  const titleColor = color(s.titleColor, gs.textColor);
  const subtitleColor = color(s.subtitleColor, gs.mutedTextColor);
  const titleFontSize = px(s.titleFontSize, 28);
  const subtitleFontSize = px(s.subtitleFontSize, 15);
  const subtitleLineHeight = Math.max(18, subtitleFontSize + 7);
  const buttonAlign = s.buttonAlign === "left" || s.buttonAlign === "right" || s.buttonAlign === "center" ? s.buttonAlign : textAlign;
  const buttonBg = gs.accentColor;
  const buttonTextColor = "#ffffff";

  const title = String(c.title || "").trim();
  const subtitle = String(c.subtitle || "").trim();
  const imageUrl = String(c.imageUrl || "").trim();
  const cta = normalizeCta({
    label: String(c.buttonLabel || ""),
    href: String(c.buttonHref || ""),
    baseUrl: data.siteUrl,
  });
  const buttonLabel = cta.label;
  const buttonHref = cta.href;

  const parts: string[] = [];

  if (imageUrl) {
    parts.push(
      `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td style="text-align:center;">
        <img src="${esc(imageUrl)}" width="600" style="display:block;border:0;outline:none;text-decoration:none;height:auto;width:100%;max-width:${gs.containerWidth}px;border-radius:${gs.borderRadius}px;" alt="" />
      </td></tr></table>`
    );
  }

  if (title) {
    parts.push(
      `<h1 style="margin:18px 0 8px 0;color:${titleColor};font-family:${gs.fontFamily};font-size:${titleFontSize}px;line-height:${titleFontSize + 6}px;font-weight:900;text-align:${textAlign};">${esc(title)}</h1>`
    );
  }

  if (subtitle) {
    parts.push(
      `<p style="margin:0 0 16px 0;color:${subtitleColor};font-family:${gs.fontFamily};font-size:${subtitleFontSize}px;line-height:${subtitleLineHeight}px;text-align:${textAlign};">${esc(subtitle)}</p>`
    );
  }

  if (buttonLabel && buttonHref) {
    parts.push(
      buttonHtml({
        href: buttonHref,
        label: buttonLabel,
        bg: buttonBg,
        color: buttonTextColor,
        fontFamily: gs.fontFamily,
        borderRadius: gs.borderRadius,
        align: buttonAlign,
      })
    );
  }

  return containerCell(parts.join(""), gs.contentPadding);
}

function renderRichText(section: NewsletterTemplateSectionBase, campaign: RenderNewsletterCampaign, gs: Required<NewsletterTemplateGlobalSettings>): string {
  const c = { ...(section.content || {}), ...((campaign.content.sections || {})[section.id] || {}) };
  const s: any = section.settings || {};
  const markdown = String(c.markdown || "");
  const textAlign = s.textAlign === "left" || s.textAlign === "right" || s.textAlign === "center" ? s.textAlign : "left";
  const fontSize = px(s.fontSize, 14);
  const lineHeight = px(s.lineHeight, 22);
  const html = renderMarkdownToEmailHtml(markdown, {
    textColor: color(s.textColor, gs.textColor),
    accentColor: color(s.linkColor, gs.accentColor),
    fontFamily: gs.fontFamily,
    fontSize,
    lineHeight,
  });

  return containerCell(`<div style="text-align:${textAlign};">${html}</div>`, gs.contentPadding);
}

function renderImage(section: NewsletterTemplateSectionBase, campaign: RenderNewsletterCampaign, gs: Required<NewsletterTemplateGlobalSettings>): string {
  const c = { ...(section.content || {}), ...((campaign.content.sections || {})[section.id] || {}) };
  const imageUrl = String(c.imageUrl || "").trim();
  const caption = String(c.caption || "").trim();

  if (!imageUrl) return "";

  const captionHtml = caption
    ? `<p style="margin:10px 0 0 0;color:${gs.mutedTextColor};font-family:${gs.fontFamily};font-size:12px;line-height:18px;text-align:center;">${esc(caption)}</p>`
    : "";

  return containerCell(
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td style="text-align:center;">
      <img src="${esc(imageUrl)}" width="600" style="display:block;border:0;outline:none;text-decoration:none;height:auto;width:100%;max-width:${gs.containerWidth}px;border-radius:${gs.borderRadius}px;" alt="" />
      ${captionHtml}
    </td></tr></table>`,
    gs.contentPadding
  );
}

function renderButtonRow(section: NewsletterTemplateSectionBase, campaign: RenderNewsletterCampaign, gs: Required<NewsletterTemplateGlobalSettings>): string {
  const c = { ...(section.content || {}), ...((campaign.content.sections || {})[section.id] || {}) };
  const buttons: Array<{ label?: string; href?: string }> = Array.isArray(c.buttons) ? c.buttons : [];

  const items = buttons
    .slice(0, 3)
    .map((b) =>
      buttonHtml({
        href: String(b.href || ""),
        label: String(b.label || ""),
        bg: gs.accentColor,
        color: "#ffffff",
        fontFamily: gs.fontFamily,
        borderRadius: gs.borderRadius,
      })
    )
    .filter(Boolean);

  if (items.length === 0) return "";

  const inner = items
    .map((html) => `<td style="padding:0 6px;vertical-align:top;">${html}</td>`)
    .join("");

  return containerCell(
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>${inner}</tr></table>`,
    gs.contentPadding
  );
}

function renderTwoColumn(section: NewsletterTemplateSectionBase, campaign: RenderNewsletterCampaign, gs: Required<NewsletterTemplateGlobalSettings>): string {
  const c = { ...(section.content || {}), ...((campaign.content.sections || {})[section.id] || {}) };
  const imageUrl = String(c.imageUrl || "").trim();
  const heading = String(c.heading || "").trim();
  const body = String(c.body || "");
  const buttonLabel = String(c.buttonLabel || "").trim();
  const buttonHref = String(c.buttonHref || "").trim();

  const bodyHtml = renderMarkdownToEmailHtml(body, {
    textColor: gs.textColor,
    accentColor: gs.accentColor,
    fontFamily: gs.fontFamily,
    fontSize: 14,
    lineHeight: 22,
  });

  const btn = buttonLabel && buttonHref
    ? buttonHtml({
        href: buttonHref,
        label: buttonLabel,
        bg: gs.accentColor,
        color: "#ffffff",
        fontFamily: gs.fontFamily,
        borderRadius: gs.borderRadius,
      })
    : "";

  const left = imageUrl
    ? `<img src="${esc(imageUrl)}" width="260" style="display:block;border:0;outline:none;text-decoration:none;height:auto;width:100%;max-width:260px;border-radius:${gs.borderRadius}px;" alt="" />`
    : "";

  const rightParts: string[] = [];
  if (heading) {
    rightParts.push(`<h3 style="margin:0 0 8px 0;color:${gs.textColor};font-family:${gs.fontFamily};font-size:18px;line-height:24px;font-weight:800;">${esc(heading)}</h3>`);
  }
  if (bodyHtml) rightParts.push(bodyHtml);
  if (btn) rightParts.push(`<div style="margin-top:10px;">${btn}</div>`);

  return containerCell(
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="width:50%;padding:0 10px 0 0;vertical-align:top;">${left}</td>
        <td style="width:50%;padding:0 0 0 10px;vertical-align:top;">${rightParts.join("")}</td>
      </tr>
    </table>`,
    gs.contentPadding
  );
}

function renderDivider(_section: NewsletterTemplateSectionBase, gs: Required<NewsletterTemplateGlobalSettings>): string {
  return containerCell(`<div style="height:1px;background:${gs.mutedTextColor};opacity:0.25;"></div>`, gs.contentPadding);
}

function renderSpacer(section: NewsletterTemplateSectionBase): string {
  const c = section.content || {};
  const height = px(c.height, 16);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td style="height:${height}px;line-height:${height}px;font-size:${height}px;">&nbsp;</td></tr></table>`;
}

function renderLatestReleases(section: NewsletterTemplateSectionBase, campaign: RenderNewsletterCampaign, gs: Required<NewsletterTemplateGlobalSettings>, data: RenderNewsletterData): string {
  const c = { ...(section.content || {}), ...((campaign.content.sections || {})[section.id] || {}) };
  const s: any = section.settings || {};
  const limit = px(c.limit, 3);
  const releases = (data.releases || []).slice(0, limit);
  if (releases.length === 0) return "";

  const title = String(c.title || "Latest Releases").trim();
  const titleAlign = s.titleAlign === "left" || s.titleAlign === "right" || s.titleAlign === "center" ? s.titleAlign : "left";
  const titleFontSize = px(s.titleFontSize, 18);
  const titleColor = color(s.titleColor, gs.textColor);
  const itemTitleFontSize = px(s.itemTitleFontSize, 14);
  const itemTitleColor = color(s.itemTitleColor, gs.textColor);
  const itemMetaFontSize = px(s.itemMetaFontSize, 12);
  const itemMetaColor = color(s.itemMetaColor, gs.mutedTextColor);
  const coverSize = px(s.coverSize, 64);
  const rowBorderColor = color(s.rowBorderColor, "rgba(255,255,255,0.06)");
  const rowPaddingY = px(s.rowPaddingY, 10);

  const rows = releases
    .map((r) => {
      const href = joinUrl(data.siteUrl, r.slug ? `/releases/${r.slug}` : "") || r.spotifyUrl || r.appleMusicUrl || r.soundcloudUrl;
      const cover = r.coverUrl
        ? `<img src="${esc(r.coverUrl)}" width="${coverSize}" style="display:block;border-radius:${gs.borderRadius}px;width:${coverSize}px;height:${coverSize}px;object-fit:cover;" alt="" />`
        : "";

      const linkOpen = href ? `<a href="${esc(href)}" style="text-decoration:none;color:inherit;">` : "";
      const linkClose = href ? "</a>" : "";

      return `
<tr>
  <td style="padding:${rowPaddingY}px 0;border-bottom:1px solid ${rowBorderColor};">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="width:${coverSize + 8}px;vertical-align:top;">${linkOpen}${cover}${linkClose}</td>
        <td style="vertical-align:top;">
          <div style="font-family:${gs.fontFamily};font-size:${itemTitleFontSize}px;line-height:${itemTitleFontSize + 6}px;font-weight:800;color:${itemTitleColor};">${linkOpen}${esc(r.title)}${linkClose}</div>
          <div style="font-family:${gs.fontFamily};font-size:${itemMetaFontSize}px;line-height:${itemMetaFontSize + 6}px;color:${itemMetaColor};">${esc(r.artistName)}</div>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
    })
    .join("");

  const inner = `
<h3 style="margin:0 0 10px 0;color:${titleColor};font-family:${gs.fontFamily};font-size:${titleFontSize}px;line-height:${titleFontSize + 6}px;font-weight:900;text-align:${titleAlign};">${esc(title)}</h3>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${rows}</table>`;

  return containerCell(inner, gs.contentPadding);
}

function renderUpcomingEvents(section: NewsletterTemplateSectionBase, campaign: RenderNewsletterCampaign, gs: Required<NewsletterTemplateGlobalSettings>, data: RenderNewsletterData): string {
  const c = { ...(section.content || {}), ...((campaign.content.sections || {})[section.id] || {}) };
  const s: any = section.settings || {};
  const limit = px(c.limit, 3);
  const events = (data.events || []).slice(0, limit);
  if (events.length === 0) return "";

  const title = String(c.title || "Upcoming Events").trim();

  const titleAlign = s.titleAlign === "left" || s.titleAlign === "right" || s.titleAlign === "center" ? s.titleAlign : "left";
  const titleFontSize = px(s.titleFontSize, 18);
  const titleColor = color(s.titleColor, gs.textColor);
  const itemTitleFontSize = px(s.itemTitleFontSize, 14);
  const itemTitleColor = color(s.itemTitleColor, gs.textColor);
  const itemMetaFontSize = px(s.itemMetaFontSize, 12);
  const itemMetaColor = color(s.itemMetaColor, gs.mutedTextColor);
  const rowBorderColor = color(s.rowBorderColor, "rgba(255,255,255,0.06)");
  const rowPaddingY = px(s.rowPaddingY, 10);

  const rows = events
    .map((e) => {
      const when = e.date ? new Date(e.date).toLocaleDateString() : "";
      const where = [e.city, e.country].filter(Boolean).join(", ");
      const href = joinUrl(data.siteUrl, e.slug ? `/events/${e.slug}` : "") || e.ticketUrl;

      const linkOpen = href ? `<a href="${esc(href)}" style="text-decoration:none;color:inherit;">` : "";
      const linkClose = href ? "</a>" : "";

      return `
<tr>
  <td style="padding:${rowPaddingY}px 0;border-bottom:1px solid ${rowBorderColor};">
    <div style="font-family:${gs.fontFamily};font-size:${itemTitleFontSize}px;line-height:${itemTitleFontSize + 6}px;font-weight:800;color:${itemTitleColor};">${linkOpen}${esc(e.title)}${linkClose}</div>
    <div style="font-family:${gs.fontFamily};font-size:${itemMetaFontSize}px;line-height:${itemMetaFontSize + 6}px;color:${itemMetaColor};">${esc([when, where].filter(Boolean).join(" • "))}</div>
  </td>
</tr>`;
    })
    .join("");

  const inner = `
<h3 style="margin:0 0 10px 0;color:${titleColor};font-family:${gs.fontFamily};font-size:${titleFontSize}px;line-height:${titleFontSize + 6}px;font-weight:900;text-align:${titleAlign};">${esc(title)}</h3>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${rows}</table>`;

  return containerCell(inner, gs.contentPadding);
}

function stripFooterArtifacts(text: string): string {
  const raw = String(text || "");
  if (!raw.trim()) return raw;

  const lines = raw
    .split(/\r?\n/)
    .filter((l) => {
      const s = l.trim();
      if (!s) return true;
      if (/^©\s*\d{4}/i.test(s)) return false;
      if (/all rights reserved\.?/i.test(s)) return false;
      if (/you'?re receiving this email because/i.test(s)) return false;
      if (/unsubscribe/i.test(s)) return false;
      return true;
    });

  return lines.join("\n").trim();
}

function renderFooter(section: NewsletterTemplateSectionBase, campaign: RenderNewsletterCampaign, gs: Required<NewsletterTemplateGlobalSettings>): string {
  void campaign;
  const c = { ...(section.content || {}) };
  const text = stripFooterArtifacts(String(c.text || "").trim());
  const year = new Date().getFullYear();
  const brand = gs.brandName || "";

  const extra = text ? `<div style="margin-top:10px;">${renderMarkdownToEmailHtml(text, {
    textColor: gs.mutedTextColor,
    accentColor: gs.accentColor,
    fontFamily: gs.fontFamily,
    fontSize: 12,
    lineHeight: 18,
  })}</div>` : "";

  const unsubscribe = `<div style="margin-top:10px;"><a href="{{NEWSLETTER_UNSUBSCRIBE_MAILTO}}" style="color:${gs.mutedTextColor};text-decoration:underline;font-family:${gs.fontFamily};font-size:12px;line-height:18px;">Unsubscribe</a></div>`;

  return containerCell(
    `<div style="text-align:center;font-family:${gs.fontFamily};font-size:12px;line-height:18px;color:${gs.mutedTextColor};">
      <div>© ${year} ${esc(brand)}. All rights reserved.</div>
      ${extra}
      ${unsubscribe}
    </div>`,
    gs.contentPadding
  );
}

function normalizeGlobalSettings(input: NewsletterTemplateGlobalSettings): Required<NewsletterTemplateGlobalSettings> {
  const fontFamily = color(input.fontFamily, "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif");

  return {
    brandName: color(input.brandName, ""),
    backgroundColor: color(input.backgroundColor, "#0b0b0f"),
    containerBackgroundColor: color(input.containerBackgroundColor, "#111827"),
    textColor: color(input.textColor, "#ffffff"),
    mutedTextColor: color(input.mutedTextColor, "#cbd5e1"),
    accentColor: color(input.accentColor, "#8B5CF6"),
    buttonBackgroundColor: color(input.buttonBackgroundColor, color(input.accentColor, "#8B5CF6")),
    buttonTextColor: color(input.buttonTextColor, "#ffffff"),
    fontFamily,
    containerWidth: px(input.containerWidth, 600),
    containerPadding: 18,
    contentPadding: 24,
    borderRadius: px(input.borderRadius, 12),
  };
}

export function renderNewsletterHtml(args: {
  template: RenderNewsletterTemplate;
  campaign: RenderNewsletterCampaign;
  data?: RenderNewsletterData;
  editor?: RenderNewsletterEditorOptions;
}): string {
  const data = args.data || {};
  const gs = normalizeGlobalSettings(args.template.globalSettings || {});

  const sections = (args.template.sections || []).filter((s) => s.enabled !== false);

  const bodyRows: string[] = [];

  for (const section of sections) {
    const pad = sectionPadding(section, { top: 18, bottom: 18 });
    const sectionBg = color(section.settings?.backgroundColor, gs.containerBackgroundColor);

    let inner = "";

    switch (section.type) {
      case "header":
        inner = renderHeader(section, args.template, args.campaign, gs);
        break;
      case "hero":
        inner = renderHero(section, args.campaign, gs, data);
        break;
      case "richText":
        inner = renderRichText(section, args.campaign, gs);
        break;
      case "image":
        inner = renderImage(section, args.campaign, gs);
        break;
      case "buttonRow":
        inner = renderButtonRow(section, args.campaign, gs);
        break;
      case "twoColumn":
        inner = renderTwoColumn(section, args.campaign, gs);
        break;
      case "divider":
        inner = renderDivider(section, gs);
        break;
      case "spacer":
        inner = containerCell(renderSpacer(section), gs.contentPadding);
        break;
      case "latestReleases":
        inner = renderLatestReleases(section, args.campaign, gs, data);
        break;
      case "upcomingEvents":
        inner = renderUpcomingEvents(section, args.campaign, gs, data);
        break;
      case "footer":
        inner = renderFooter(section, args.campaign, gs);
        break;
      default:
        inner = "";
        break;
    }

    if (!inner) continue;

    bodyRows.push(
      wrapSection({
        inner,
        sectionBg,
        padTop: pad.top,
        padBottom: pad.bottom,
        sectionId: section.id,
        editor: args.editor,
        accentColor: gs.accentColor,
      })
    );
  }

  const preheaderText = String(args.campaign.preheader || "").trim();
  const preheader = preheaderText
    ? `<div style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">${esc(preheaderText)}</div>`
    : "";

  const editorScript = args.editor?.enableSectionMarkers
    ? `
<script>
(function(){
  function findSectionId(target){
    var el = target;
    while (el && el !== document.body) {
      if (el.getAttribute && el.getAttribute('data-newsletter-section-id')) {
        return el.getAttribute('data-newsletter-section-id');
      }
      el = el.parentNode;
    }
    return null;
  }
  document.addEventListener('click', function(e){
    try {
      var id = findSectionId(e.target);
      if (!id) return;
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'newsletter_section_click', sectionId: id }, '*');
      }
    } catch (_) {}
  }, true);
})();
</script>`
    : "";

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${esc(String(args.campaign.subject || gs.brandName || "Newsletter"))}</title>
  </head>
  <body style="margin:0;padding:0;background:${gs.backgroundColor};">
    ${preheader}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${gs.backgroundColor};padding:${gs.containerPadding}px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:${gs.containerWidth}px;background:${gs.containerBackgroundColor};border-radius:${gs.borderRadius}px;overflow:hidden;">
            ${bodyRows.join("\n")}
          </table>
        </td>
      </tr>
    </table>
    ${editorScript}
  </body>
</html>`;

  return html;
}
