import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { Eye, GripVertical, Plus, Save, Settings2, Trash2 } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ImageUpload } from "@/components/image-upload";
import { MarkdownEditor } from "@/components/markdown-editor";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

import { queryClient } from "@/lib/queryClient";
import { db, NewsletterTemplate } from "@/lib/database";
import { renderNewsletterHtml, RenderNewsletterData, RenderNewsletterTemplate } from "@/lib/newsletter-renderer";

type TemplateSectionType = RenderNewsletterTemplate["sections"][number]["type"];

type EditableSection = RenderNewsletterTemplate["sections"][number];

type EditableTemplate = {
  name: string;
  description?: string;
  schemaVersion: number;
  isDefault: boolean;
  globalSettings: RenderNewsletterTemplate["globalSettings"];
  assets: RenderNewsletterTemplate["assets"];
  sections: EditableSection[];
};

type TextAlign = "left" | "center" | "right";

const DEFAULT_GLOBAL_SETTINGS: RenderNewsletterTemplate["globalSettings"] = {
  brandName: "GroupTherapy",
  backgroundColor: "#0b0b0f",
  containerBackgroundColor: "#111827",
  textColor: "#ffffff",
  mutedTextColor: "#cbd5e1",
  accentColor: "#8B5CF6",
  buttonBackgroundColor: "#8B5CF6",
  buttonTextColor: "#ffffff",
  fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif",
  containerWidth: 600,
  containerPadding: 18,
  contentPadding: 24,
  borderRadius: 12,
};

function createDefaultTemplate(): EditableTemplate {
  const heroId = nanoid();
  const richId = nanoid();
  const releasesId = nanoid();
  const eventsId = nanoid();
  const footerId = nanoid();

  return {
    name: "Default Template",
    description: "",
    schemaVersion: 1,
    isDefault: false,
    globalSettings: { ...DEFAULT_GLOBAL_SETTINGS },
    assets: { logoUrl: "", logoHref: "" },
    sections: [
      { id: nanoid(), type: "header", enabled: true, settings: {}, content: {} },
      {
        id: heroId,
        type: "hero",
        enabled: true,
        settings: {},
        content: {
          title: "New Music & Updates",
          subtitle: "Fresh releases, events, and highlights from our roster.",
          imageUrl: "",
          buttonLabel: "Explore Releases",
          buttonHref: "https://grouptherapyrecords.com/releases",
        },
      },
      {
        id: richId,
        type: "richText",
        enabled: true,
        settings: {},
        content: {
          markdown:
            "## Welcome\n\nThanks for being part of the community. Here’s what’s new this week.",
        },
      },
      {
        id: releasesId,
        type: "latestReleases",
        enabled: true,
        settings: {},
        content: { title: "Latest Releases", limit: 3 },
      },
      {
        id: eventsId,
        type: "upcomingEvents",
        enabled: true,
        settings: {},
        content: { title: "Upcoming Events", limit: 3 },
      },
      {
        id: footerId,
        type: "footer",
        enabled: true,
        settings: {},
        content: {
          text: "Unsubscribe anytime.",
        },
      },
    ],
  };
}

function toEditableTemplate(template?: NewsletterTemplate | null): EditableTemplate {
  if (!template) return createDefaultTemplate();

  return {
    name: template.name,
    description: template.description || "",
    schemaVersion: template.schemaVersion || 1,
    isDefault: !!template.isDefault,
    globalSettings: (template.globalSettings || {}) as any,
    assets: (template.assets || {}) as any,
    sections: (Array.isArray(template.sections) ? template.sections : []) as any,
  };
}

function toDbPayload(state: EditableTemplate): Partial<NewsletterTemplate> {
  return {
    name: state.name,
    description: state.description,
    schemaVersion: state.schemaVersion,
    isDefault: state.isDefault,
    globalSettings: state.globalSettings as any,
    assets: state.assets as any,
    sections: state.sections as any,
  };
}

function labelForSectionType(t: TemplateSectionType): string {
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

function newSection(type: TemplateSectionType): EditableSection {
  const id = nanoid();

  if (type === "spacer") {
    return { id, type, enabled: true, settings: {}, content: { height: 16 } };
  }

  if (type === "divider") {
    return { id, type, enabled: true, settings: {}, content: {} };
  }

  if (type === "richText") {
    return { id, type, enabled: true, settings: {}, content: { markdown: "" } };
  }

  if (type === "image") {
    return { id, type, enabled: true, settings: {}, content: { imageUrl: "", caption: "" } };
  }

  if (type === "buttonRow") {
    return {
      id,
      type,
      enabled: true,
      settings: {},
      content: { buttons: [{ label: "Learn More", href: "" }] },
    };
  }

  if (type === "twoColumn") {
    return {
      id,
      type,
      enabled: true,
      settings: {},
      content: { imageUrl: "", heading: "", body: "", buttonLabel: "", buttonHref: "" },
    };
  }

  if (type === "latestReleases") {
    return { id, type, enabled: true, settings: {}, content: { title: "Latest Releases", limit: 3 } };
  }

  if (type === "upcomingEvents") {
    return { id, type, enabled: true, settings: {}, content: { title: "Upcoming Events", limit: 3 } };
  }

  if (type === "footer") {
    return { id, type, enabled: true, settings: {}, content: { text: "" } };
  }

  if (type === "header") {
    return { id, type, enabled: true, settings: {}, content: {} };
  }

  if (type === "hero") {
    return { id, type, enabled: true, settings: {}, content: { title: "", subtitle: "", imageUrl: "", buttonLabel: "", buttonHref: "" } };
  }

  return { id, type, enabled: true, settings: {}, content: {} };
}

export function NewsletterTemplateBuilderDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: NewsletterTemplate | null;
  previewData?: RenderNewsletterData;
}) {
  const isMobile = useIsMobile();
  const [state, setState] = useState<EditableTemplate>(() => toEditableTemplate(props.template));
  const [templateId, setTemplateId] = useState<string | null>(() => (props.template?.id ? String(props.template.id) : null));
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const lastSavedSnapshotRef = useRef<string>("");
  const queuedAutoSaveRef = useRef(false);
  const prevPendingRef = useRef(false);
  const defaultAppliedForIdRef = useRef<string | null>(null);
  const [newSectionType, setNewSectionType] = useState<TemplateSectionType>("richText");
  const THEME_ID = "__theme__";
  const [selectedId, setSelectedId] = useState<string>(THEME_ID);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [mobileTab, setMobileTab] = useState<"blocks" | "edit" | "preview">("blocks");
  const [draggingSectionId, setDraggingSectionId] = useState<string | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);

  const snapshotOf = (s: EditableTemplate) => JSON.stringify(toDbPayload(s));

  useEffect(() => {
    if (!props.open) return;
    const next = toEditableTemplate(props.template);
    setState(next);
    setTemplateId(props.template?.id ? String(props.template.id) : null);
    lastSavedSnapshotRef.current = snapshotOf(next);
    setDirty(false);
    setLastSavedAt(null);
    defaultAppliedForIdRef.current = props.template?.isDefault && props.template?.id ? String(props.template.id) : null;
    setSelectedId(THEME_ID);
    setPreviewMode("desktop");
    setMobileTab("blocks");
    setDraggingSectionId(null);
    setDragOverSectionId(null);
  }, [props.open, props.template]);

  useEffect(() => {
    if (!props.open) return;

    const onMessage = (e: MessageEvent) => {
      const data: any = e.data;
      if (!data || data.type !== "newsletter_section_click") return;
      const sectionId = String(data.sectionId || "");
      if (!sectionId) return;
      setSelectedId(sectionId);
      if (isMobile) setMobileTab("edit");
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [props.open, isMobile]);

  const selectBlock = (id: string) => {
    setSelectedId(id);
    if (isMobile) setMobileTab("edit");
  };

  const reorderSections = (fromId: string, toId: string) => {
    setState((prev) => {
      const ids = prev.sections.map((s) => s.id);
      const fromIndex = ids.indexOf(fromId);
      const toIndex = ids.indexOf(toId);
      if (fromIndex === -1 || toIndex === -1) return prev;

      const next = [...prev.sections];
      const [moved] = next.splice(fromIndex, 1);
      if (!moved) return prev;
      next.splice(toIndex, 0, moved);
      return { ...prev, sections: next };
    });
  };

  const saveMutation = useMutation({
    mutationFn: async (vars: { closeAfter?: boolean; snapshot?: string }) => {
      void vars;
      const payload = toDbPayload(state);
      if (templateId) {
        return db.newsletterTemplates.update(templateId, payload);
      }
      return db.newsletterTemplates.create(payload);
    },
    onSuccess: async (saved, vars) => {
      if (!templateId) setTemplateId(String(saved.id));

      const snap = vars?.snapshot;
      if (snap) {
        lastSavedSnapshotRef.current = snap;
        if (snapshotOf(state) === snap) setDirty(false);
      }
      setLastSavedAt(Date.now());

      await queryClient.invalidateQueries({ queryKey: ["newsletterTemplates"] });

      const savedId = String(saved.id);
      if (saved.isDefault && defaultAppliedForIdRef.current !== savedId) {
        await db.newsletterTemplates.setDefault(saved.id);
        defaultAppliedForIdRef.current = savedId;
        await queryClient.invalidateQueries({ queryKey: ["newsletterTemplates"] });
      }

      if (vars?.closeAfter) props.onOpenChange(false);
    },
  });

  useEffect(() => {
    if (!props.open) return;
    if (!state.isDefault) {
      defaultAppliedForIdRef.current = null;
    }
  }, [props.open, state.isDefault]);

  const currentSnapshot = useMemo(() => snapshotOf(state), [state]);

  useEffect(() => {
    if (!props.open) return;
    if (!state.name.trim()) return;
    if (currentSnapshot === lastSavedSnapshotRef.current) return;

    setDirty(true);
    const t = window.setTimeout(() => {
      if (saveMutation.isPending) {
        queuedAutoSaveRef.current = true;
        return;
      }
      saveMutation.mutate({ closeAfter: false, snapshot: currentSnapshot });
    }, 900);

    return () => window.clearTimeout(t);
  }, [props.open, state.name, currentSnapshot, saveMutation.isPending]);

  useEffect(() => {
    if (!props.open) return;
    const wasPending = prevPendingRef.current;
    const isPending = saveMutation.isPending;
    prevPendingRef.current = isPending;

    if (!wasPending || isPending) return;
    if (!queuedAutoSaveRef.current) return;

    queuedAutoSaveRef.current = false;
    if (!state.name.trim()) return;
    const snap = snapshotOf(state);
    if (snap === lastSavedSnapshotRef.current) return;
    saveMutation.mutate({ closeAfter: false, snapshot: snap });
  }, [props.open, saveMutation.isPending, state]);

  const previewHtml = useMemo(() => {
    const template: RenderNewsletterTemplate = {
      globalSettings: state.globalSettings,
      assets: state.assets,
      sections: state.sections,
    };

    return renderNewsletterHtml({
      template,
      campaign: { subject: state.name, preheader: "", content: { sections: {} } },
      data: props.previewData,
      editor: {
        enableSectionMarkers: true,
        selectedSectionId: selectedId === THEME_ID ? undefined : selectedId,
      },
    });
  }, [state, props.previewData, selectedId]);

  const moveSection = (idx: number, dir: -1 | 1) => {
    setState((prev) => {
      const next = [...prev.sections];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      const current = next[idx];
      const other = next[target];
      if (!current || !other) return prev;
      next[idx] = other;
      next[target] = current;
      return { ...prev, sections: next };
    });
  };

  const removeSection = (id: string) => {
    setState((prev) => ({ ...prev, sections: prev.sections.filter((s) => s.id !== id) }));
    setSelectedId((prev) => (prev === id ? THEME_ID : prev));
  };

  const updateSection = (id: string, patch: Partial<EditableSection>) => {
    setState((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? ({ ...s, ...patch } as any) : s)),
    }));
  };

  const updateSectionContent = (id: string, patch: Record<string, any>) => {
    setState((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? ({ ...s, content: { ...(s.content || {}), ...patch } } as any) : s)),
    }));
  };

  const updateSectionSettings = (id: string, patch: Record<string, any>) => {
    setState((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? ({ ...s, settings: { ...(s.settings || {}), ...patch } } as any) : s)),
    }));
  };

  const renderSectionEditor = (section: EditableSection) => {
    const content = section.content || {};
    const settings = (section.settings || {}) as any;

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Background</Label>
          <Input
            type="color"
            value={String(section.settings?.backgroundColor || state.globalSettings.containerBackgroundColor || "#111827")}
            onChange={(e) => updateSectionSettings(section.id, { backgroundColor: e.target.value })}
          />
        </div>

        {section.type === "header" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Logo Align</Label>
                <Select
                  value={String(settings.logoAlign || "center")}
                  onValueChange={(v) => updateSectionSettings(section.id, { logoAlign: v as TextAlign })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Align" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Logo Width (px)</Label>
                <Input
                  type="number"
                  value={String(settings.logoWidth ?? "")}
                  onChange={(e) => updateSectionSettings(section.id, { logoWidth: e.target.value === "" ? undefined : Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Show brand text next to logo</Label>
              <Switch checked={!!settings.showBrandName} onCheckedChange={(v) => updateSectionSettings(section.id, { showBrandName: !!v })} />
            </div>
            {!!settings.showBrandName && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Brand Text</Label>
                  <Input value={String(settings.brandText || state.globalSettings.brandName || "")} onChange={(e) => updateSectionSettings(section.id, { brandText: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Text Color</Label>
                    <Input type="color" value={String(settings.brandTextColor || state.globalSettings.textColor || "#ffffff")} onChange={(e) => updateSectionSettings(section.id, { brandTextColor: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Text Size</Label>
                    <Input
                      type="number"
                      value={String(settings.brandTextSize ?? "")}
                      onChange={(e) => updateSectionSettings(section.id, { brandTextSize: e.target.value === "" ? undefined : Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gap (px)</Label>
                    <Input
                      type="number"
                      value={String(settings.brandGap ?? "")}
                      onChange={(e) => updateSectionSettings(section.id, { brandGap: e.target.value === "" ? undefined : Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="text-xs text-muted-foreground">Logo image + link are set in Theme & Brand.</div>
          </div>
        )}

        {section.type === "hero" && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={String(content.title || "")} onChange={(e) => updateSectionContent(section.id, { title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Textarea value={String(content.subtitle || "")} onChange={(e) => updateSectionContent(section.id, { subtitle: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Hero Image</Label>
              <ImageUpload
                aspectRatio="banner"
                folder="newsletter"
                currentImage={String(content.imageUrl || "")}
                onUploadComplete={(url) => updateSectionContent(section.id, { imageUrl: url })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Button Label</Label>
                <Input value={String(content.buttonLabel || "")} onChange={(e) => updateSectionContent(section.id, { buttonLabel: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Button Link</Label>
                <Input value={String(content.buttonHref || "")} onChange={(e) => updateSectionContent(section.id, { buttonHref: e.target.value })} />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Hero Style</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Text Align</Label>
                    <Select
                      value={String(settings.textAlign || "center")}
                      onValueChange={(v) => updateSectionSettings(section.id, { textAlign: v as TextAlign })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Align" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Button Align</Label>
                    <Select
                      value={String(settings.buttonAlign || settings.textAlign || "center")}
                      onValueChange={(v) => updateSectionSettings(section.id, { buttonAlign: v as TextAlign })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Align" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Title Color</Label>
                    <Input type="color" value={String(settings.titleColor || state.globalSettings.textColor || "#ffffff")} onChange={(e) => updateSectionSettings(section.id, { titleColor: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Subtitle Color</Label>
                    <Input type="color" value={String(settings.subtitleColor || state.globalSettings.mutedTextColor || "#cbd5e1")} onChange={(e) => updateSectionSettings(section.id, { subtitleColor: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Title Size</Label>
                    <Input
                      type="number"
                      value={String(settings.titleFontSize ?? "")}
                      onChange={(e) => updateSectionSettings(section.id, { titleFontSize: e.target.value === "" ? undefined : Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subtitle Size</Label>
                    <Input
                      type="number"
                      value={String(settings.subtitleFontSize ?? "")}
                      onChange={(e) => updateSectionSettings(section.id, { subtitleFontSize: e.target.value === "" ? undefined : Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Buttons use the Accent color automatically.</div>
              </CardContent>
            </Card>
          </div>
        )}

        {section.type === "richText" && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Content</Label>
              <MarkdownEditor value={String(content.markdown || "")} onChange={(v) => updateSectionContent(section.id, { markdown: v })} minHeight="240px" />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Typography</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Align</Label>
                    <Select
                      value={String(settings.textAlign || "left")}
                      onValueChange={(v) => updateSectionSettings(section.id, { textAlign: v as TextAlign })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Align" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Font Size</Label>
                    <Input
                      type="number"
                      value={String(settings.fontSize ?? "")}
                      onChange={(e) => updateSectionSettings(section.id, { fontSize: e.target.value === "" ? undefined : Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Line Height</Label>
                    <Input
                      type="number"
                      value={String(settings.lineHeight ?? "")}
                      onChange={(e) => updateSectionSettings(section.id, { lineHeight: e.target.value === "" ? undefined : Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Text Color</Label>
                    <Input type="color" value={String(settings.textColor || state.globalSettings.textColor || "#ffffff")} onChange={(e) => updateSectionSettings(section.id, { textColor: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Link Color</Label>
                    <Input type="color" value={String(settings.linkColor || state.globalSettings.accentColor || "#8B5CF6")} onChange={(e) => updateSectionSettings(section.id, { linkColor: e.target.value })} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {section.type === "image" && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Image</Label>
              <ImageUpload
                aspectRatio="banner"
                folder="newsletter"
                currentImage={String(content.imageUrl || "")}
                onUploadComplete={(url) => updateSectionContent(section.id, { imageUrl: url })}
              />
            </div>
            <div className="space-y-2">
              <Label>Caption</Label>
              <Input value={String(content.caption || "")} onChange={(e) => updateSectionContent(section.id, { caption: e.target.value })} />
            </div>
          </div>
        )}

        {section.type === "buttonRow" && (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">Up to 3 buttons</div>
            {(Array.isArray(content.buttons) ? content.buttons : []).slice(0, 3).map((b: any, idx: number) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input
                    value={String(b?.label || "")}
                    onChange={(e) => {
                      const next = [...(Array.isArray(content.buttons) ? content.buttons : [])];
                      next[idx] = { ...(next[idx] || {}), label: e.target.value };
                      updateSectionContent(section.id, { buttons: next });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Link</Label>
                  <Input
                    value={String(b?.href || "")}
                    onChange={(e) => {
                      const next = [...(Array.isArray(content.buttons) ? content.buttons : [])];
                      next[idx] = { ...(next[idx] || {}), href: e.target.value };
                      updateSectionContent(section.id, { buttons: next });
                    }}
                  />
                </div>
              </div>
            ))}
            <div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const next = [...(Array.isArray(content.buttons) ? content.buttons : [])];
                  if (next.length >= 3) return;
                  next.push({ label: "", href: "" });
                  updateSectionContent(section.id, { buttons: next });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Button
              </Button>
            </div>
          </div>
        )}

        {section.type === "twoColumn" && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Image</Label>
              <ImageUpload
                aspectRatio="square"
                folder="newsletter"
                currentImage={String(content.imageUrl || "")}
                onUploadComplete={(url) => updateSectionContent(section.id, { imageUrl: url })}
              />
            </div>
            <div className="space-y-2">
              <Label>Heading</Label>
              <Input value={String(content.heading || "")} onChange={(e) => updateSectionContent(section.id, { heading: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Body</Label>
              <MarkdownEditor value={String(content.body || "")} onChange={(v) => updateSectionContent(section.id, { body: v })} minHeight="200px" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Button Label</Label>
                <Input value={String(content.buttonLabel || "")} onChange={(e) => updateSectionContent(section.id, { buttonLabel: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Button Link</Label>
                <Input value={String(content.buttonHref || "")} onChange={(e) => updateSectionContent(section.id, { buttonHref: e.target.value })} />
              </div>
            </div>
          </div>
        )}

        {section.type === "spacer" && (
          <div className="space-y-2">
            <Label>Height (px)</Label>
            <Input
              type="number"
              value={String(content.height ?? 16)}
              onChange={(e) => updateSectionContent(section.id, { height: e.target.value === "" ? 16 : Number(e.target.value) })}
            />
          </div>
        )}

        {(section.type === "latestReleases" || section.type === "upcomingEvents") && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={String(content.title || "")} onChange={(e) => updateSectionContent(section.id, { title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Limit</Label>
                <Input
                  type="number"
                  value={String(content.limit ?? 3)}
                  onChange={(e) => updateSectionContent(section.id, { limit: e.target.value === "" ? 3 : Number(e.target.value) })}
                />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">List Style</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Title Align</Label>
                    <Select
                      value={String(settings.titleAlign || "left")}
                      onValueChange={(v) => updateSectionSettings(section.id, { titleAlign: v as TextAlign })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Align" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Title Size</Label>
                    <Input
                      type="number"
                      value={String(settings.titleFontSize ?? "")}
                      onChange={(e) => updateSectionSettings(section.id, { titleFontSize: e.target.value === "" ? undefined : Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Title Color</Label>
                    <Input type="color" value={String(settings.titleColor || state.globalSettings.textColor || "#ffffff")} onChange={(e) => updateSectionSettings(section.id, { titleColor: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Item Title Size</Label>
                    <Input
                      type="number"
                      value={String(settings.itemTitleFontSize ?? "")}
                      onChange={(e) => updateSectionSettings(section.id, { itemTitleFontSize: e.target.value === "" ? undefined : Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Item Title Color</Label>
                    <Input type="color" value={String(settings.itemTitleColor || state.globalSettings.textColor || "#ffffff")} onChange={(e) => updateSectionSettings(section.id, { itemTitleColor: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Item Meta Size</Label>
                    <Input
                      type="number"
                      value={String(settings.itemMetaFontSize ?? "")}
                      onChange={(e) => updateSectionSettings(section.id, { itemMetaFontSize: e.target.value === "" ? undefined : Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Item Meta Color</Label>
                    <Input type="color" value={String(settings.itemMetaColor || state.globalSettings.mutedTextColor || "#cbd5e1")} onChange={(e) => updateSectionSettings(section.id, { itemMetaColor: e.target.value })} />
                  </div>
                </div>

                {section.type === "latestReleases" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Cover Size (px)</Label>
                      <Input
                        type="number"
                        value={String(settings.coverSize ?? "")}
                        onChange={(e) => updateSectionSettings(section.id, { coverSize: e.target.value === "" ? undefined : Number(e.target.value) })}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Row Padding Y</Label>
                    <Input
                      type="number"
                      value={String(settings.rowPaddingY ?? "")}
                      onChange={(e) => updateSectionSettings(section.id, { rowPaddingY: e.target.value === "" ? undefined : Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Row Border Color</Label>
                    <Input
                      type="color"
                      value={String(settings.rowBorderColor || "rgba(255,255,255,0.06)")}
                      onChange={(e) => updateSectionSettings(section.id, { rowBorderColor: e.target.value })}
                    />
                    <div className="text-xs text-muted-foreground">If your email client ignores RGBA, try a solid hex color.</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {section.type === "footer" && (
          <div className="space-y-2">
            <Label>Footer Text</Label>
            <MarkdownEditor value={String(content.text || "")} onChange={(v) => updateSectionContent(section.id, { text: v })} minHeight="160px" />
          </div>
        )}
      </div>
    );
  };

  const blocks = useMemo(() => {
    const items: Array<{ id: string; label: string; isTheme?: boolean }> = [{ id: THEME_ID, label: "Theme & Brand", isTheme: true }];
    for (const s of state.sections) {
      items.push({ id: s.id, label: labelForSectionType(s.type) });
    }
    return items;
  }, [state.sections]);

  const selectedSection = useMemo(() => {
    return state.sections.find((s) => s.id === selectedId) || null;
  }, [state.sections, selectedId]);

  const renderThemeEditor = () => {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={state.name} onChange={(e) => setState((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={state.description || ""} onChange={(e) => setState((p) => ({ ...p, description: e.target.value }))} rows={3} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Set as default</Label>
              <Switch checked={state.isDefault} onCheckedChange={(v) => setState((p) => ({ ...p, isDefault: !!v }))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Brand</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Brand Name</Label>
              <Input value={String(state.globalSettings.brandName || "")} onChange={(e) => setState((p) => ({ ...p, globalSettings: { ...p.globalSettings, brandName: e.target.value } }))} />
            </div>
            <div className="space-y-2">
              <Label>Logo</Label>
              <ImageUpload
                aspectRatio="banner"
                folder="newsletter"
                currentImage={String(state.assets.logoUrl || "")}
                onUploadComplete={(url) => setState((p) => ({ ...p, assets: { ...(p.assets || {}), logoUrl: url } }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Logo Link</Label>
              <Input value={String(state.assets.logoHref || "")} onChange={(e) => setState((p) => ({ ...p, assets: { ...(p.assets || {}), logoHref: e.target.value } }))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Colors</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Background</Label>
              <Input type="color" value={String(state.globalSettings.backgroundColor || "#0b0b0f")} onChange={(e) => setState((p) => ({ ...p, globalSettings: { ...p.globalSettings, backgroundColor: e.target.value } }))} />
            </div>
            <div className="space-y-2">
              <Label>Container</Label>
              <Input type="color" value={String(state.globalSettings.containerBackgroundColor || "#111827")} onChange={(e) => setState((p) => ({ ...p, globalSettings: { ...p.globalSettings, containerBackgroundColor: e.target.value } }))} />
            </div>
            <div className="space-y-2">
              <Label>Text</Label>
              <Input type="color" value={String(state.globalSettings.textColor || "#ffffff")} onChange={(e) => setState((p) => ({ ...p, globalSettings: { ...p.globalSettings, textColor: e.target.value } }))} />
            </div>
            <div className="space-y-2">
              <Label>Accent</Label>
              <Input type="color" value={String(state.globalSettings.accentColor || "#8B5CF6")} onChange={(e) => setState((p) => ({ ...p, globalSettings: { ...p.globalSettings, accentColor: e.target.value } }))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Layout</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Width</Label>
              <Input type="number" value={String(state.globalSettings.containerWidth ?? 600)} onChange={(e) => setState((p) => ({ ...p, globalSettings: { ...p.globalSettings, containerWidth: Number(e.target.value) } }))} />
            </div>
            <div className="space-y-2">
              <Label>Radius</Label>
              <Input type="number" value={String(state.globalSettings.borderRadius ?? 12)} onChange={(e) => setState((p) => ({ ...p, globalSettings: { ...p.globalSettings, borderRadius: Number(e.target.value) } }))} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const blocksList = (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Blocks</div>
        <div />
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Select value={newSectionType} onValueChange={(v) => setNewSectionType(v as TemplateSectionType)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select block" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="header">Header</SelectItem>
            <SelectItem value="hero">Hero</SelectItem>
            <SelectItem value="richText">Rich Text</SelectItem>
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="buttonRow">Buttons</SelectItem>
            <SelectItem value="twoColumn">Two Column</SelectItem>
            <SelectItem value="divider">Divider</SelectItem>
            <SelectItem value="spacer">Spacer</SelectItem>
            <SelectItem value="latestReleases">Latest Releases</SelectItem>
            <SelectItem value="upcomingEvents">Upcoming Events</SelectItem>
            <SelectItem value="footer">Footer</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const sec = newSection(newSectionType);
            setState((p) => ({ ...p, sections: [...p.sections, sec] }));
            setSelectedId(sec.id);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>

      <div className="space-y-1">
        {blocks.map((b) => {
          if (b.isTheme) {
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
                Theme & Brand
              </button>
            );
          }

          const sectionIdx = state.sections.findIndex((s) => s.id === b.id);
          const section = sectionIdx >= 0 ? state.sections[sectionIdx] : undefined;

          return (
            <div
              key={b.id}
              className={cn(
                "flex items-center gap-2 px-2 py-2 rounded-md border",
                selectedId === b.id ? "bg-primary/10 border-primary/30" : "bg-muted/20 border-border/50 hover:bg-muted/30",
                dragOverSectionId === b.id ? "ring-2 ring-primary" : ""
              )}
              onDragOver={(e) => {
                if (!draggingSectionId) return;
                e.preventDefault();
                setDragOverSectionId(b.id);
              }}
              onDragLeave={() => {
                if (dragOverSectionId === b.id) setDragOverSectionId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const fromId = e.dataTransfer.getData("text/plain") || draggingSectionId;
                if (!fromId) return;
                if (fromId === b.id) return;
                reorderSections(fromId, b.id);
                setDraggingSectionId(null);
                setDragOverSectionId(null);
              }}
            >
              {section && (
                <div
                  className="inline-flex items-center gap-2 text-xs text-muted-foreground select-none"
                  draggable
                  onDragStart={(e) => {
                    setDraggingSectionId(section.id);
                    e.dataTransfer.setData("text/plain", section.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => {
                    setDraggingSectionId(null);
                    setDragOverSectionId(null);
                  }}
                >
                  <GripVertical className="h-4 w-4" />
                </div>
              )}

              <button type="button" className="flex-1 text-left text-sm" onClick={() => selectBlock(b.id)}>
                <div className="font-medium">{b.label}</div>
              </button>

              {section && (
                <div className="flex items-center gap-1">
                  <Switch checked={section.enabled !== false} onCheckedChange={(v) => updateSection(section.id, { enabled: !!v })} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeSection(section.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}

        {state.sections.length === 0 && <div className="text-sm text-muted-foreground text-center py-6">No blocks yet</div>}
      </div>
    </div>
  );

  const editorPane = (
    <div className="space-y-4">
      {selectedId === THEME_ID ? (
        renderThemeEditor()
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
          <Button type="button" variant={previewMode === "desktop" ? "secondary" : "outline"} size="sm" onClick={() => setPreviewMode("desktop")}>
            <Eye className="h-4 w-4 mr-2" />
            Desktop
          </Button>
          <Button type="button" variant={previewMode === "mobile" ? "secondary" : "outline"} size="sm" onClick={() => setPreviewMode("mobile")}>
            <Eye className="h-4 w-4 mr-2" />
            Mobile
          </Button>
        </div>
      </div>
      <div className="rounded-md border overflow-hidden bg-muted/20">
        <div className={cn("mx-auto", previewMode === "mobile" ? "w-[380px] max-w-full" : "w-full")} style={previewMode === "mobile" ? { maxWidth: 380 } : undefined}>
          <iframe title="Newsletter preview" className={cn("w-full bg-background", "min-h-[70vh]")} sandbox="allow-scripts" srcDoc={previewHtml} />
        </div>
        <div className="px-3 py-2 text-xs text-muted-foreground border-t">Tip: click a block in the preview to select it.</div>
      </div>
    </div>
  );

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-7xl sm:max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>{props.template ? "Edit Template" : "Create Template"}</DialogTitle>
          <DialogDescription>Design your email layout and save it for reuse.</DialogDescription>
        </DialogHeader>

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

        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            Cancel
          </Button>
          <div className="mx-auto text-xs text-muted-foreground py-2">
            {saveMutation.isPending ? "Saving…" : dirty ? "Unsaved changes" : lastSavedAt ? "Saved" : ""}
          </div>
          <Button
            onClick={() => saveMutation.mutate({ closeAfter: true, snapshot: snapshotOf(state) })}
            disabled={saveMutation.isPending || !state.name.trim()}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
