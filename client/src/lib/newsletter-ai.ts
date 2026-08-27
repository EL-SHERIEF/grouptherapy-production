import type {
  RenderNewsletterData,
  RenderNewsletterTemplate,
  NewsletterTemplateSectionBase,
} from "./newsletter-renderer";

export type NewsletterAiResult = {
  subject?: string;
  preheader?: string;
  sections?: Record<string, Record<string, any>>;
};

function escJsonString(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\"/g, "\\\"");
}

function buildSectionFieldHints(section: NewsletterTemplateSectionBase): Array<{ key: string; type: string; description: string }> {
  switch (section.type) {
    case "hero":
      return [
        { key: "title", type: "string", description: "Hero headline" },
        { key: "subtitle", type: "string", description: "Short supporting line" },
        { key: "buttonLabel", type: "string", description: "CTA label" },
        { key: "buttonHref", type: "string", description: "CTA URL" },
      ];
    case "richText":
      return [{ key: "markdown", type: "string", description: "Markdown content (no HTML)" }];
    case "image":
      return [{ key: "caption", type: "string", description: "Short image caption" }];
    case "buttonRow":
      return [{ key: "buttons", type: "array", description: "Up to 3 buttons: [{label, href}]" }];
    case "twoColumn":
      return [
        { key: "heading", type: "string", description: "Section heading" },
        { key: "body", type: "string", description: "Markdown body (no HTML)" },
        { key: "buttonLabel", type: "string", description: "CTA label" },
        { key: "buttonHref", type: "string", description: "CTA URL" },
      ];
    case "latestReleases":
      return [{ key: "title", type: "string", description: "Optional title override" }];
    case "upcomingEvents":
      return [{ key: "title", type: "string", description: "Optional title override" }];
    case "footer":
      return [];
    default:
      return [];
  }
}

function buildCatalogSnippet(data?: RenderNewsletterData): string {
  const releases = (data?.releases || []).slice(0, 5);
  const events = (data?.events || []).slice(0, 5);

  const releaseLines = releases.map((r) => `- ${r.title} — ${r.artistName}`).join("\n");
  const eventLines = events
    .map((e) => {
      const when = e.date ? new Date(e.date).toDateString() : "";
      const where = [e.city, e.country].filter(Boolean).join(", ");
      return `- ${e.title}${when ? ` (${when})` : ""}${where ? ` — ${where}` : ""}`;
    })
    .join("\n");

  return [
    releases.length ? `Latest releases:\n${releaseLines}` : "",
    events.length ? `Upcoming events:\n${eventLines}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function buildNewsletterCampaignAiPrompt(args: {
  userPrompt: string;
  template: RenderNewsletterTemplate;
  data?: RenderNewsletterData;
}): string {
  const userPrompt = String(args.userPrompt || "").trim();

  const sections = (args.template.sections || []).filter((s) => s.enabled !== false);

  const schema = sections
    .map((s) => {
      const fields = buildSectionFieldHints(s);
      if (!fields.length) return null;
      return {
        id: s.id,
        type: s.type,
        fields,
      };
    })
    .filter(Boolean);

  const catalog = buildCatalogSnippet(args.data);

  const instructions = `You are an expert email copywriter.

Goal:
- Generate newsletter CONTENT ONLY.
- Do NOT generate HTML.
- Output STRICT JSON only.

Personalization:
- You MAY include the token {name} anywhere in subject, preheader, hero.title, and hero.subtitle.
- Output the token literally as "{name}" in the string.
- {name} will be replaced at send-time with the subscriber's first name.
- If a subscriber has no name, {name} falls back to "there".

Topic / brief:
"${escJsonString(userPrompt)}"

Available site context (optional, use if relevant):
${catalog ? catalog : "(no catalog provided)"}

Template content schema:
${JSON.stringify(schema, null, 2)}

Return JSON with this shape:
{
  "subject": string,
  "preheader": string,
  "sections": {
    "<sectionId>": {
      // keys must be from the section field hints
    }
  }
}

Rules:
- Only include keys that exist in the schema for that section.
- For markdown fields, output markdown (no HTML).
- For buttons, output up to 3 items: {"label": string, "href": string}.
- If you are unsure about a URL, leave it empty.
- Do NOT generate footer / unsubscribe / copyright / legal text (the template handles footer).
- Do not wrap in markdown fences. JSON ONLY.`;

  return instructions;
}

export function parseNewsletterAiJson(raw: string): NewsletterAiResult {
  const text = String(raw || "").trim();
  if (!text) return {};

  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenceMatch?.[1]?.trim() || text;

  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("AI response did not contain JSON object");
  }

  const jsonText = candidate.slice(firstBrace, lastBrace + 1);
  const parsed = JSON.parse(jsonText);

  const result: NewsletterAiResult = {
    subject: typeof parsed.subject === "string" ? parsed.subject : undefined,
    preheader: typeof parsed.preheader === "string" ? parsed.preheader : undefined,
    sections: typeof parsed.sections === "object" && parsed.sections ? parsed.sections : undefined,
  };

  return result;
}
