import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { Eye, Save, Send, Sparkles, Trash2, User } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ImageUpload } from "@/components/image-upload";
import { MarkdownEditor } from "@/components/markdown-editor";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

import { queryClient } from "@/lib/queryClient";
import { db, NewsletterCampaign, NewsletterState, NewsletterSubscriber, NewsletterTemplate } from "@/lib/database";
import { generateContent, isGeminiConfigured } from "@/lib/gemini";
import { fetchNewsletterSenderProfiles, NewsletterSenderProfile } from "@/lib/newsletter-sender-profiles";
import {
  renderNewsletterHtml,
  RenderNewsletterData,
  RenderNewsletterTemplate,
  NewsletterTemplateSectionBase,
} from "@/lib/newsletter-renderer";
import { buildNewsletterCampaignAiPrompt, parseNewsletterAiJson } from "@/lib/newsletter-ai";

type CampaignState = {
  templateId?: string;
  senderProfileId?: string;
  subject: string;
  preheader: string;
  content: {
    sections: Record<string, Record<string, any>>;
  };
  renderedHtml?: string;
  status: string;
};

function labelForSectionType(t: NewsletterTemplateSectionBase["type"]): string {
  switch (t) {
    case "header":
      return "Header";
    case "hero":
      return "Hero";
    case "richText":
      return "Rich Text";
    case "image":
      return "Image";
    case "buttonRow":
      return "Buttons";
    case "twoColumn":
      return "Two Column";
    case "divider":
      return "Divider";
    case "spacer":
      return "Spacer";
    case "latestReleases":
      return "Latest Releases";
    case "upcomingEvents":
      return "Upcoming Events";
    case "footer":
      return "Footer";
    default:
      return t;
  }
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

function sanitizeAiSections(
  sections: Record<string, Record<string, any>>,
  templateSections: NewsletterTemplateSectionBase[]
): Record<string, Record<string, any>> {
  const allowed = new Set(templateSections.filter((s) => s.enabled !== false && s.type !== "footer").map((s) => s.id));
  const out: Record<string, Record<string, any>> = {};

  for (const [sectionId, payload] of Object.entries(sections || {})) {
    if (!allowed.has(sectionId)) continue;
    if (!payload || typeof payload !== "object") continue;

    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(payload)) {
      if (typeof v === "string") cleaned[k] = stripFooterArtifacts(v);
      else cleaned[k] = v;
    }

    out[sectionId] = cleaned;
  }

  return out;
}

function toCampaignState(campaign?: NewsletterCampaign | null, templateId?: string): CampaignState {
  if (!campaign) {
    return {
      templateId,
      senderProfileId: undefined,
      subject: "",
      preheader: "",
      content: { sections: {} },
      status: "draft",
    };
  }

  return {
    templateId: campaign.templateId || templateId,
    senderProfileId: campaign.senderProfileId,
    subject: campaign.subject || "",
    preheader: campaign.preheader || "",
    content: {
      sections: (campaign.content?.sections || {}) as any,
    },
    renderedHtml: campaign.renderedHtml,
    status: campaign.status || "draft",
  };
}

function toDbPayload(state: CampaignState, renderedHtml: string): Partial<NewsletterCampaign> {
  return {
    templateId: state.templateId,
    senderProfileId: state.senderProfileId,
    subject: state.subject,
    preheader: state.preheader,
    content: state.content as any,
    renderedHtml,
    status: state.status,
  };
}

function getSectionContent(state: CampaignState, sectionId: string): Record<string, any> {
  return state.content.sections[sectionId] || {};
}

function updateSectionContent(state: CampaignState, sectionId: string, patch: Record<string, any>): CampaignState {
  return {
    ...state,
    content: {
      ...state.content,
      sections: {
        ...state.content.sections,
        [sectionId]: {
          ...(state.content.sections[sectionId] || {}),
          ...patch,
        },
      },
    },
  };
}

export function NewsletterCampaignBuilderDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: NewsletterTemplate[];
  campaign?: NewsletterCampaign | null;
  initialTemplateId?: string;
  previewData?: RenderNewsletterData;
  subscribers?: NewsletterSubscriber[];
  states?: NewsletterState[];
  onSend?: (args: {
    subject: string;
    html: string;
    senderProfileId?: string;
    targeting?: {
      stateIds?: string[];
    };
  }) => Promise<void>;
}) {
  const isMobile = useIsMobile();
  const [state, setState] = useState<CampaignState>(() => toCampaignState(props.campaign, props.initialTemplateId));
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const CAMPAIGN_ID = "__campaign__";
  const [selectedId, setSelectedId] = useState<string>(CAMPAIGN_ID);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [mobileTab, setMobileTab] = useState<"blocks" | "edit" | "preview">("blocks");
  const [targetStateIds, setTargetStateIds] = useState<string[]>([]);

  const { data: senderProfiles = [] } = useQuery<NewsletterSenderProfile[]>({
    queryKey: ["newsletterSenderProfiles"],
    queryFn: fetchNewsletterSenderProfiles,
  });

  const defaultSenderProfile = senderProfiles.find((p) => p.isDefault) || null;

  const insertNameToken = (value: string) => {
    const token = "{name}";
    const v = String(value || "");
    if (v.includes(token)) return v;
    if (!v.trim()) return token;
    if (/\s$/.test(v)) return `${v}${token}`;
    return `${v} ${token}`;
  };

  useEffect(() => {
    if (!props.open) return;
    setState(toCampaignState(props.campaign, props.initialTemplateId));
    setAiPrompt("");
    setAiLoading(false);
    setSelectedId(CAMPAIGN_ID);
    setPreviewMode("desktop");
    setMobileTab("blocks");
    setTargetStateIds([]);
  }, [props.open, props.campaign, props.initialTemplateId]);

  useEffect(() => {
    if (!props.open) return;
    if (!defaultSenderProfile?.id) return;
    setState((p) => {
      if (p.senderProfileId) return p;
      return { ...p, senderProfileId: defaultSenderProfile.id };
    });
  }, [props.open, defaultSenderProfile?.id]);

  const recipientsPreview = useMemo(() => {
    const subs = Array.isArray(props.subscribers) ? props.subscribers : [];
    const stateIds = Array.isArray(targetStateIds) ? targetStateIds : [];

    return subs.filter((s) => {
      const stateOk = !stateIds.length || stateIds.includes(String(s.stateId || ""));
      if (!stateOk) return false;

      return true;
    });
  }, [props.subscribers, targetStateIds]);

  const selectBlock = (id: string) => {
    setSelectedId(id);
    if (isMobile) setMobileTab("edit");
  };

  useEffect(() => {
    if (!props.open) return;

    const onMessage = (e: MessageEvent) => {
      const data: any = e.data;
      if (!data || data.type !== "newsletter_section_click") return;
      const sectionId = String(data.sectionId || "");
      if (!sectionId) return;
      selectBlock(sectionId);
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [props.open, isMobile]);

  const activeTemplate = useMemo(() => {
    const id = state.templateId || "";
    return props.templates.find((t) => t.id === id) || null;
  }, [props.templates, state.templateId]);

  const emailHtml = useMemo(() => {
    if (!activeTemplate) return "";

    const template: RenderNewsletterTemplate = {
      globalSettings: (activeTemplate.globalSettings || {}) as any,
      assets: (activeTemplate.assets || {}) as any,
      sections: (Array.isArray(activeTemplate.sections) ? activeTemplate.sections : []) as any,
    };

    return renderNewsletterHtml({
      template,
      campaign: {
        subject: state.subject,
        preheader: state.preheader,
        content: state.content,
      },
      data: props.previewData,
    });
  }, [activeTemplate, state.subject, state.preheader, state.content, props.previewData]);

  const previewHtml = useMemo(() => {
    if (!activeTemplate) return "";

    const template: RenderNewsletterTemplate = {
      globalSettings: (activeTemplate.globalSettings || {}) as any,
      assets: (activeTemplate.assets || {}) as any,
      sections: (Array.isArray(activeTemplate.sections) ? activeTemplate.sections : []) as any,
    };

    return renderNewsletterHtml({
      template,
      campaign: {
        subject: state.subject,
        preheader: state.preheader,
        content: state.content,
      },
      data: props.previewData,
      editor: {
        enableSectionMarkers: true,
        selectedSectionId: selectedId === CAMPAIGN_ID ? undefined : selectedId,
      },
    });
  }, [activeTemplate, state.subject, state.preheader, state.content, props.previewData, selectedId]);

  const handleAiGenerate = async () => {
    if (!activeTemplate) throw new Error("Select a template first.");
    const promptText = aiPrompt.trim();
    if (!promptText) throw new Error("Enter a prompt for AI.");

    setAiLoading(true);
    try {
      const template: RenderNewsletterTemplate = {
        globalSettings: (activeTemplate.globalSettings || {}) as any,
        assets: (activeTemplate.assets || {}) as any,
        sections: (Array.isArray(activeTemplate.sections) ? activeTemplate.sections : []) as any,
      };

      const prompt = buildNewsletterCampaignAiPrompt({
        userPrompt: promptText,
        template,
        data: props.previewData,
      });

      const raw = await generateContent(prompt);
      if (raw.startsWith("Error:")) {
        throw new Error(raw);
      }

      const parsed = parseNewsletterAiJson(raw);

      const templateSections = ((template.sections || []) as any as NewsletterTemplateSectionBase[]).filter((s) => s.enabled !== false);
      const cleanedSections = sanitizeAiSections((parsed.sections || {}) as any, templateSections);

      setState((prev) => {
        const next: CampaignState = {
          ...prev,
          subject: stripFooterArtifacts(parsed.subject || prev.subject),
          preheader: stripFooterArtifacts(parsed.preheader || prev.preheader),
          content: {
            ...prev.content,
            sections: {
              ...prev.content.sections,
              ...cleanedSections,
            },
          },
        };
        return next;
      });
    } finally {
      setAiLoading(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!state.templateId) {
        throw new Error("Please choose a template.");
      }

      const payload = toDbPayload(state, emailHtml);

      if (props.campaign?.id) {
        return db.newsletterCampaigns.update(props.campaign.id, payload);
      }
      return db.newsletterCampaigns.create(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["newsletterCampaigns"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!props.campaign?.id) return;
      await db.newsletterCampaigns.delete(props.campaign.id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["newsletterCampaigns"] });
      props.onOpenChange(false);
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!props.onSend) throw new Error("Send handler not configured.");
      if (!state.subject.trim()) throw new Error("Please enter a subject.");
      if (!emailHtml.trim()) throw new Error("Nothing to send.");

      if (!state.senderProfileId && !defaultSenderProfile?.id) {
        throw new Error("Please configure a default sender profile before sending.");
      }

      await props.onSend({
        subject: state.subject,
        html: emailHtml,
        senderProfileId: state.senderProfileId || defaultSenderProfile?.id,
        targeting: {
          stateIds: targetStateIds,
        },
      });

      if (props.campaign?.id) {
        await db.newsletterCampaigns.update(props.campaign.id, {
          status: "sent",
          sentAt: new Date().toISOString() as any,
          senderProfileId: state.senderProfileId,
        });
        await queryClient.invalidateQueries({ queryKey: ["newsletterCampaigns"] });
      }

      props.onOpenChange(false);
    },
  });

  const renderSectionEditor = (section: NewsletterTemplateSectionBase) => {
    const content = getSectionContent(state, section.id);

    if (section.type === "hero") {
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Title</Label>
              <Button
                    className="px-2"
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setState((p) =>
                    updateSectionContent(p, section.id, { title: insertNameToken(String(getSectionContent(p, section.id).title || "")) })
                  )
                }
              >
                {"{name}"}
              </Button>
            </div>
            <Input value={String(content.title || "")} onChange={(e) => setState((p) => updateSectionContent(p, section.id, { title: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Subtitle</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setState((p) =>
                    updateSectionContent(p, section.id, {
                      subtitle: insertNameToken(String(getSectionContent(p, section.id).subtitle || "")),
                    })
                  )
                }
              >
                {"{name}"}
              </Button>
            </div>
            <Input value={String(content.subtitle || "")} onChange={(e) => setState((p) => updateSectionContent(p, section.id, { subtitle: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Image</Label>
            <ImageUpload
              aspectRatio="banner"
              folder="newsletter"
              currentImage={String(content.imageUrl || "")}
              onUploadComplete={(url) => setState((p) => updateSectionContent(p, section.id, { imageUrl: url }))}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Button Label</Label>
              <Input value={String(content.buttonLabel || "")} onChange={(e) => setState((p) => updateSectionContent(p, section.id, { buttonLabel: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Button Link</Label>
              <Input value={String(content.buttonHref || "")} onChange={(e) => setState((p) => updateSectionContent(p, section.id, { buttonHref: e.target.value }))} />
            </div>
          </div>
        </div>
      );
    }

    if (section.type === "richText") {
      return (
        <div className="space-y-2">
          <Label>Content</Label>
          <MarkdownEditor value={String(content.markdown || "")} onChange={(v) => setState((p) => updateSectionContent(p, section.id, { markdown: v }))} minHeight="240px" />
        </div>
      );
    }

    if (section.type === "image") {
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Image</Label>
            <ImageUpload
              aspectRatio="banner"
              folder="newsletter"
              currentImage={String(content.imageUrl || "")}
              onUploadComplete={(url) => setState((p) => updateSectionContent(p, section.id, { imageUrl: url }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Caption</Label>
            <Input value={String(content.caption || "")} onChange={(e) => setState((p) => updateSectionContent(p, section.id, { caption: e.target.value }))} />
          </div>
        </div>
      );
    }

    if (section.type === "buttonRow") {
      const buttons: Array<{ label?: string; href?: string }> = Array.isArray(content.buttons) ? content.buttons : [];
      const safeButtons = buttons.length ? buttons : [{ label: "", href: "" }];

      return (
        <div className="space-y-3">
          {safeButtons.slice(0, 3).map((b, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  value={String(b.label || "")}
                  onChange={(e) => {
                    const next = [...safeButtons];
                    next[idx] = { ...next[idx], label: e.target.value };
                    setState((p) => updateSectionContent(p, section.id, { buttons: next }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Link</Label>
                <Input
                  value={String(b.href || "")}
                  onChange={(e) => {
                    const next = [...safeButtons];
                    next[idx] = { ...next[idx], href: e.target.value };
                    setState((p) => updateSectionContent(p, section.id, { buttons: next }));
                  }}
                />
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const next = [...safeButtons];
              if (next.length >= 3) return;
              next.push({ label: "", href: "" });
              setState((p) => updateSectionContent(p, section.id, { buttons: next }));
            }}
          >
            Add Button
          </Button>
        </div>
      );
    }

    if (section.type === "twoColumn") {
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Image</Label>
            <ImageUpload
              aspectRatio="square"
              folder="newsletter"
              currentImage={String(content.imageUrl || "")}
              onUploadComplete={(url) => setState((p) => updateSectionContent(p, section.id, { imageUrl: url }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Heading</Label>
            <Input value={String(content.heading || "")} onChange={(e) => setState((p) => updateSectionContent(p, section.id, { heading: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Body</Label>
            <MarkdownEditor value={String(content.body || "")} onChange={(v) => setState((p) => updateSectionContent(p, section.id, { body: v }))} minHeight="200px" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Button Label</Label>
              <Input value={String(content.buttonLabel || "")} onChange={(e) => setState((p) => updateSectionContent(p, section.id, { buttonLabel: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Button Link</Label>
              <Input value={String(content.buttonHref || "")} onChange={(e) => setState((p) => updateSectionContent(p, section.id, { buttonHref: e.target.value }))} />
            </div>
          </div>
        </div>
      );
    }

    if (section.type === "latestReleases" || section.type === "upcomingEvents") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Title Override</Label>
            <Input value={String(content.title || "")} onChange={(e) => setState((p) => updateSectionContent(p, section.id, { title: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Limit Override</Label>
            <Input
              type="number"
              value={String(content.limit || "")}
              onChange={(e) => setState((p) => updateSectionContent(p, section.id, { limit: e.target.value === "" ? undefined : Number(e.target.value) }))}
            />
          </div>
        </div>
      );
    }

    return <div className="text-sm text-muted-foreground">No editable fields for this section.</div>;
  };

  const templateSections: NewsletterTemplateSectionBase[] = useMemo(() => {
    if (!activeTemplate) return [];
    const sections = (Array.isArray(activeTemplate.sections) ? activeTemplate.sections : []) as NewsletterTemplateSectionBase[];
    return sections.filter((s) => s.enabled !== false && s.type !== "spacer" && s.type !== "divider");
  }, [activeTemplate]);

  useEffect(() => {
    if (selectedId === CAMPAIGN_ID) return;
    const exists = templateSections.some((s) => s.id === selectedId);
    if (!exists) setSelectedId(CAMPAIGN_ID);
  }, [templateSections, selectedId]);

  const blocks = useMemo(() => {
    const items: Array<{ id: string; label: string; isCampaign?: boolean }> = [{ id: CAMPAIGN_ID, label: "Campaign", isCampaign: true }];
    for (const s of templateSections) {
      items.push({ id: s.id, label: labelForSectionType(s.type) });
    }
    return items;
  }, [templateSections]);

  const selectedSection = useMemo(() => {
    return templateSections.find((s) => s.id === selectedId) || null;
  }, [templateSections, selectedId]);

  const campaignEditor = (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campaign Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Template</Label>
            <Select
              value={state.templateId || ""}
              onValueChange={(v) => setState((p) => ({ ...p, templateId: v }))}
              disabled={!!props.campaign?.id}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose template" />
              </SelectTrigger>
              <SelectContent>
                {props.templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Subject</Label>
              <Button
                className="px-2"
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setState((p) => ({ ...p, subject: insertNameToken(p.subject) }))}
              >
                {"{name}"}
              </Button>
            </div>
            <Input value={state.subject} onChange={(e) => setState((p) => ({ ...p, subject: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Preheader</Label>
              <Button
                className="px-2"
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setState((p) => ({ ...p, preheader: insertNameToken(p.preheader) }))}
              >
                {"{name}"}
              </Button>
            </div>
            <Input value={state.preheader} onChange={(e) => setState((p) => ({ ...p, preheader: e.target.value }))} />
            <div className="text-xs text-muted-foreground">Use {"{name}"} to personalize. If a subscriber has no name, it falls back to "there".</div>
          </div>
        </CardContent>
      </Card>

      {isGeminiConfigured() && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">AI Assist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Input
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="E.g. Announce new compilation, highlight 3 releases and 2 upcoming events"
              />
            </div>
            <div>
              <Button type="button" onClick={handleAiGenerate} disabled={aiLoading || !activeTemplate}>
                <Sparkles className="h-4 w-4 mr-2" />
                {aiLoading ? "Generating..." : "Generate Content"}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">Let AI Help you making your campaign.</div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const blocksList = (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Blocks</div>
        <div />
      </div>

      <div className="space-y-1">
        {blocks.map((b) => {
          if (b.isCampaign) {
            return (
              <button
                key={b.id}
                type="button"
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md border text-sm",
                  selectedId === b.id ? "bg-primary/10 border-primary/30" : "bg-muted/20 border-border/50 hover:bg-muted/30"
                )}
                onClick={() => selectBlock(b.id)}
              >
                Campaign
              </button>
            );
          }

          return (
            <button
              key={b.id}
              type="button"
              className={cn(
                "w-full text-left px-3 py-2 rounded-md border text-sm",
                selectedId === b.id ? "bg-primary/10 border-primary/30" : "bg-muted/20 border-border/50 hover:bg-muted/30"
              )}
              onClick={() => selectBlock(b.id)}
            >
              <div className="font-medium">{b.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const editorPane = (
    <div className="space-y-4">
      {selectedId === CAMPAIGN_ID ? (
        campaignEditor
      ) : selectedSection ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Edit Block</CardTitle>
          </CardHeader>
          <CardContent>{renderSectionEditor(selectedSection)}</CardContent>
        </Card>
      ) : (
        <div className="text-sm text-muted-foreground">Select a block to edit.</div>
      )}
    </div>
  );

  const previewPane = (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Preview</div>
        <div className="flex items-center gap-2">
          <Button type="button" variant={previewMode === "desktop" ? "secondary" : "link2"} size="sm" onClick={() => setPreviewMode("desktop")}>
            <Eye className="h-4 w-4 mr-2" />
            Desktop
          </Button>
          <Button type="button" variant={previewMode === "mobile" ? "secondary" : "link2"} size="sm" onClick={() => setPreviewMode("mobile")}>
            <Eye className="h-4 w-4 mr-2" />
            Mobile
          </Button>
        </div>
      </div>
      <div className="rounded-md border overflow-hidden bg-muted/20">
        <div className={cn("mx-auto", previewMode === "mobile" ? "w-[380px] max-w-full" : "w-full")} style={previewMode === "mobile" ? { maxWidth: 380 } : undefined}>
          <iframe title="Campaign preview" className={cn("w-full bg-background", "h-[60vh]")} sandbox="allow-scripts" srcDoc={previewHtml || ""} />
        </div>
        <div className="px-3 py-2 text-xs text-muted-foreground border-t">Tip: click a block in the preview to select it.</div>
      </div>
    </div>
  );

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-6xl h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{props.campaign ? "Edit Campaign" : "New Campaign"}</DialogTitle>
          <DialogDescription>Fill template content and preview before sending.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1 pb-4">
          {isMobile ? (
            <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as any)} className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="blocks" className="flex-1">Blocks</TabsTrigger>
                <TabsTrigger value="edit" className="flex-1">Edit</TabsTrigger>
                <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="blocks" className="pt-4">
                {blocksList}
              </TabsContent>
              <TabsContent value="edit" className="pt-4">
                {editorPane}
              </TabsContent>
              <TabsContent value="preview" className="pt-4">
                {previewPane}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-3">{blocksList}</div>
              <div className="col-span-4">{editorPane}</div>
              <div className="col-span-5">{previewPane}</div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border/50 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
            <div className="flex items-center gap-2">
                   <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="h-9 w-full sm:w-[120px] justify-start">
                      {targetStateIds.length ? `Target: ${targetStateIds.length} states` : "Target: All states"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[260px]">
                    <DropdownMenuLabel>Target states</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setTargetStateIds([])}>All states</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {(Array.isArray(props.states) ? props.states : []).map((st) => {
                      const checked = targetStateIds.includes(st.id);
                      return (
                        <DropdownMenuCheckboxItem
                          key={st.id}
                          checked={checked}
                          onCheckedChange={(v) => {
                            const next = new Set(targetStateIds);
                            if (v) next.add(st.id);
                            else next.delete(st.id);
                            setTargetStateIds(Array.from(next));
                          }}
                        >
                          <span className="flex items-center gap-2">
                            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: st.color || "#64748b" }} />
                            {st.name}
                          </span>
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                    {(!props.states || props.states.length === 0) && (
                      <div className="px-2 py-2 text-xs text-muted-foreground">No states available.</div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Select
                  value={state.senderProfileId || ""}
                  onValueChange={(v) => setState((p) => ({ ...p, senderProfileId: v }))}
                  disabled={!senderProfiles.length}
                >
                  <SelectTrigger className="h-9 w-full sm:w-[160px]">
                    <SelectValue placeholder="Send From" />
                  </SelectTrigger>
                  <SelectContent>
                    {senderProfiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                        {p.isDefault ? " (Default)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Badge variant="secondary" className="h-9 px-3 rounded-md flex items-center justify-center w-full sm:w-auto">
                  <User className="h-4 w-4 mr-2" />{recipientsPreview.length}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 w-full sm:w-auto">
        

              <div className="flex items-center gap-2 justify-end">
                 {props.campaign?.id && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="h-9"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
                <Button variant="outline" onClick={() => props.onOpenChange(false)} className="h-9">
                  Cancel
                </Button>
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="h-9">
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button
                  onClick={() => sendMutation.mutate()}
                  disabled={
                    sendMutation.isPending ||
                    !props.onSend ||
                    (!state.senderProfileId && !defaultSenderProfile?.id)
                  }
                  className="h-9"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </div>
              
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function createBlankCampaignFromTemplate(templateId: string): Partial<NewsletterCampaign> {
  return {
    id: nanoid(),
    templateId,
    status: "draft",
    content: { sections: {} },
  } as any;
}
