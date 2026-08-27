import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Mail, Send, Loader2, Trash2, Download, Sparkles, Settings, CheckCircle2, AlertCircle, Plus, Pencil, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "./index";
import { queryClient, queryFunctions } from "@/lib/queryClient";
import { db, NewsletterCampaign, NewsletterState, NewsletterSubscriber, NewsletterTemplate } from "@/lib/database";
import { generateContent, isGeminiConfigured } from "@/lib/gemini";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { NewsletterTemplateBuilderDialog } from "@/components/newsletter-template-builder";
import { NewsletterCampaignBuilderDialog } from "@/components/newsletter-campaign-builder";
import {
  createNewsletterSenderProfile,
  deleteNewsletterSenderProfile,
  fetchNewsletterSenderProfiles,
  NewsletterSenderProfile,
  updateNewsletterSenderProfile,
} from "@/lib/newsletter-sender-profiles";
import { sendNewsletterViaApi } from "@/lib/newsletter-send";

const EMPTY_SENDER_PROFILES: NewsletterSenderProfile[] = [];

export default function AdminNewsletters() {
  const { toast } = useToast();
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTemplateBuilderOpen, setIsTemplateBuilderOpen] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<NewsletterTemplate | null>(null);
  const [isCampaignBuilderOpen, setIsCampaignBuilderOpen] = useState(false);
  const [campaignToEdit, setCampaignToEdit] = useState<NewsletterCampaign | null>(null);
  const [initialCampaignTemplateId, setInitialCampaignTemplateId] = useState<string | undefined>(undefined);
  const [filterStateId, setFilterStateId] = useState<string>("all");
  const [filterOptOut, setFilterOptOut] = useState<string>("deliverable");
  const [isAddSubscriberOpen, setIsAddSubscriberOpen] = useState(false);
  const [isManageStatesOpen, setIsManageStatesOpen] = useState(false);
  const [newStateName, setNewStateName] = useState<string>("");
  const [newStateColor, setNewStateColor] = useState<string>("#64748b");
  const [newSubscriber, setNewSubscriber] = useState<{ email: string; name: string; stateId: string }>({
    email: "",
    name: "",
    stateId: "",
  });
  const [isEditSubscriberOpen, setIsEditSubscriberOpen] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState<NewsletterSubscriber | null>(null);
  const [editSubscriberForm, setEditSubscriberForm] = useState<{ name: string; stateId: string; optedOut: boolean }>({
    name: "",
    stateId: "",
    optedOut: false,
  });
  const [emailData, setEmailData] = useState({
    subject: "",
    content: "",
    prompt: "",
  });

  const { data: subscribers = [] } = useQuery<NewsletterSubscriber[]>({
    queryKey: ["newsletterSubscribers"],
    queryFn: queryFunctions.newsletterSubscribers,
  });

  const { data: states = [] } = useQuery<NewsletterState[]>({
    queryKey: ["newsletterStates"],
    queryFn: queryFunctions.newsletterStates,
  });

  const { data: templates = [] } = useQuery<NewsletterTemplate[]>({
    queryKey: ["newsletterTemplates"],
    queryFn: queryFunctions.newsletterTemplates,
  });

  const { data: campaigns = [] } = useQuery<NewsletterCampaign[]>({
    queryKey: ["newsletterCampaigns"],
    queryFn: queryFunctions.newsletterCampaigns,
  });

  const { data: releases = [] } = useQuery<any[]>({
    queryKey: ["releasesPublished"],
    queryFn: queryFunctions.releasesPublished as any,
  });

  const { data: events = [] } = useQuery<any[]>({
    queryKey: ["eventsUpcoming"],
    queryFn: queryFunctions.eventsUpcoming as any,
  });

  const { data: senderProfiles = EMPTY_SENDER_PROFILES } = useQuery<NewsletterSenderProfile[]>({
    queryKey: ["newsletterSenderProfiles"],
    queryFn: fetchNewsletterSenderProfiles,
  });

  const deliverableSubscribers = subscribers.filter((s) => s.active && !s.optedOut);
  const optedOutOrInactiveCount = subscribers.filter((s) => !s.active || s.optedOut).length;
  const defaultTemplate = templates.find((t) => t.isDefault) || templates[0] || null;

  const filteredSubscribers = subscribers.filter((s) => {
    const stateOk = filterStateId === "all" || s.stateId === filterStateId;
    const optOk =
      filterOptOut === "all" ||
      (filterOptOut === "deliverable" ? s.active && !s.optedOut : (s.optedOut || !s.active));
    return stateOk && optOk;
  });

  const defaultSenderProfile = senderProfiles.find((p) => p.isDefault) || null;
  const firstSenderProfile = senderProfiles.length ? senderProfiles[0] : null;

  const [selectedSenderProfileId, setSelectedSenderProfileId] = useState<string | null>(null);
  const [isCreatingSenderProfile, setIsCreatingSenderProfile] = useState(false);
  const [isSenderProfileFormDirty, setIsSenderProfileFormDirty] = useState(false);
  const [senderProfileForm, setSenderProfileForm] = useState<{
    name: string;
    service: string;
    fromEmail: string;
    senderName: string;
    apiUrl: string;
    apiKey: string;
    makeDefault: boolean;
  }>({
    name: "",
    service: "resend",
    fromEmail: "",
    senderName: "",
    apiUrl: "",
    apiKey: "",
    makeDefault: false,
  });

  useEffect(() => {
    if (isSettingsOpen) return;
    setIsSenderProfileFormDirty(false);
    setIsCreatingSenderProfile(false);
    setSelectedSenderProfileId(null);
  }, [isSettingsOpen]);

  useEffect(() => {
    if (!isSettingsOpen) return;
    if (isCreatingSenderProfile) return;
    if (selectedSenderProfileId) return;
    const initial = defaultSenderProfile?.id || firstSenderProfile?.id || null;
    setSelectedSenderProfileId(initial);
  }, [isSettingsOpen, defaultSenderProfile?.id, firstSenderProfile?.id, selectedSenderProfileId, isCreatingSenderProfile]);

  useEffect(() => {
    if (!isSettingsOpen) return;
    if (isSenderProfileFormDirty) return;
    const profile = senderProfiles.find((p) => p.id === selectedSenderProfileId) || null;
    if (!profile) {
      setSenderProfileForm({
        name: "",
        service: "resend",
        fromEmail: "",
        senderName: "",
        apiUrl: "",
        apiKey: "",
        makeDefault: senderProfiles.length === 0,
      });
      return;
    }

    setSenderProfileForm({
      name: profile.name,
      service: profile.service,
      fromEmail: profile.fromEmail,
      senderName: profile.senderName || "",
      apiUrl: profile.apiUrl || "",
      apiKey: "",
      makeDefault: !!profile.isDefault,
    });
  }, [isSettingsOpen, senderProfiles, selectedSenderProfileId, isSenderProfileFormDirty]);

  const saveSenderProfileMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: senderProfileForm.name,
        service: senderProfileForm.service,
        fromEmail: senderProfileForm.fromEmail,
        senderName: senderProfileForm.senderName || undefined,
        apiUrl: senderProfileForm.apiUrl || undefined,
        apiKey: senderProfileForm.apiKey || undefined,
        isDefault: !!senderProfileForm.makeDefault,
      };

      if (selectedSenderProfileId) {
        return updateNewsletterSenderProfile({ id: selectedSenderProfileId, ...payload });
      }
      return createNewsletterSenderProfile(payload);
    },
    onSuccess: async (profile: NewsletterSenderProfile) => {
      await queryClient.invalidateQueries({ queryKey: ["newsletterSenderProfiles"] });
      setSelectedSenderProfileId(profile.id);
      setSenderProfileForm((p) => ({ ...p, apiKey: "" }));
      setIsSenderProfileFormDirty(false);
      setIsCreatingSenderProfile(false);
      toast({ title: "Sender profile saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to save sender profile", variant: "destructive" });
    },
  });

  const duplicateTemplateMutation = useMutation({
    mutationFn: async (template: NewsletterTemplate) => {
      const name = `${template.name} (Copy)`;
      return db.newsletterTemplates.create({
        name,
        description: template.description || "",
        schemaVersion: template.schemaVersion || 1,
        isDefault: false,
        globalSettings: (template.globalSettings || {}) as any,
        assets: (template.assets || {}) as any,
        sections: (Array.isArray(template.sections) ? template.sections : []) as any,
      });
    },
    onSuccess: async (template: NewsletterTemplate) => {
      await queryClient.invalidateQueries({ queryKey: ["newsletterTemplates"] });
      toast({ title: "Template duplicated" });
      setTemplateToEdit(template);
      setIsTemplateBuilderOpen(true);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to duplicate template.", variant: "destructive" });
    },
  });

  const deleteSenderProfileMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteNewsletterSenderProfile(id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["newsletterSenderProfiles"] });
      toast({ title: "Sender profile deleted" });
      setSelectedSenderProfileId(null);
      setIsSenderProfileFormDirty(false);
      setIsCreatingSenderProfile(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to delete sender profile", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return db.newsletterSubscribers.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletterSubscribers"] });
      toast({
        title: "Subscriber removed",
        description: "The subscriber has been deleted.",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      return db.newsletterTemplates.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletterTemplates"] });
      toast({
        title: "Template deleted",
        description: "The template has been deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete template.",
        variant: "destructive",
      });
    },
  });

  const setDefaultTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      await db.newsletterTemplates.setDefault(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletterTemplates"] });
      toast({
        title: "Default template updated",
        description: "This template will be used for new campaigns.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to set default template.",
        variant: "destructive",
      });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data: { subject: string; content: string; recipients: string[] }) => {
      if (data.recipients.length === 0) {
        throw new Error("No recipients to send to.");
      }

      const byEmail = new Map((deliverableSubscribers || []).map((s) => [String(s.email || "").toLowerCase(), s] as const));
      const recipients = data.recipients
        .map((email) => {
          const e = String(email || "").trim();
          if (!e) return null;
          const sub = byEmail.get(e.toLowerCase());
          return { email: e, name: sub?.name || null };
        })
        .filter((x): x is { email: string; name: string | null } => !!x);

      await sendNewsletterViaApi({
        recipients,
        subject: data.subject,
        html: data.content,
      });
    },
    onSuccess: () => {
      toast({
        title: "Newsletter Sent!",
        description: `Email sent to ${deliverableSubscribers.length} subscribers.`,
      });
      setIsComposeOpen(false);
      setEmailData({ subject: "", content: "", prompt: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send newsletter.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateContent = async () => {
    if (!emailData.prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt to generate content.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
const prompt = `Write a professional, energetic, and mobile-responsive email newsletter for a music record label called GroupTherapy Records.
Topic: ${emailData.prompt}

Requirements:
1. SUBJECT LINE:
   - Create an engaging, click-worthy subject line that fits the electronic music industry vibe.
2. EMAIL BODY (HTML format):
   - Use inline CSS only.
   - Follow a dark theme with primary accent color #8B5CF6 (light purple/blue) and clean modern fonts.
   - Include our logo at the top: "https://grouptherapyrecords.com/logo.png"
   - Structure content into clear sections:
     a) Header/intro
     b) Main content or featured news
     c) Call-to-action buttons
     d) Footer with © ${new Date().getFullYear()} GroupTherapy Records. All rights reserved.
   - Ensure mobile responsiveness (scales nicely on mobile devices)
   - Use a professional but energetic tone, matching the electronic music scene.
3. DO NOT include extra commentary outside of the HTML.

Format the response exactly like this:
SUBJECT: [subject line here]
---
[Full HTML content here]`;

      const result = await generateContent(prompt);

      if (result.startsWith("Error:")) {
        toast({
          title: "Generation Failed",
          description: result,
          variant: "destructive",
        });
        return;
      }

      // Parse the result
      const parts = result.split("---");
      if (parts.length >= 2) {
        const subjectLine = (parts[0] || "").replace("SUBJECT:", "").trim();
        const htmlContent = parts[1] || "";
        
        setEmailData((prev) => ({
          ...prev,
          subject: subjectLine,
          content: htmlContent,
        }));

        toast({
          title: "Content Generated!",
          description: "Your newsletter content has been created.",
        });
      } else {
        setEmailData((prev) => ({
          ...prev,
          content: result,
        }));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate content.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendNewsletter = () => {
    if (!emailData.subject.trim() || !emailData.content.trim()) {
      toast({
        title: "Error",
        description: "Please provide both subject and content.",
        variant: "destructive",
      });
      return;
    }

    sendEmailMutation.mutate({
      subject: emailData.subject,
      content: emailData.content,
      recipients: deliverableSubscribers.map((s) => s.email),
    });
  };

  const upsertSubscriberMutation = useMutation({
    mutationFn: async (payload: { email: string; name?: string; stateId?: string }) => {
      return db.newsletterSubscribers.upsert({
        email: payload.email,
        name: payload.name,
        stateId: payload.stateId,
        source: "manual",
        active: true,
        optedOut: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletterSubscribers"] });
      toast({ title: "Subscriber added" });
      setIsAddSubscriberOpen(false);
      setNewSubscriber({ email: "", name: "", stateId: "" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to add subscriber", variant: "destructive" });
    },
  });

  const updateSubscriberMutation = useMutation({
    mutationFn: async (payload: { id: string; name?: string | null; stateId?: string | null; optedOut: boolean }) => {
      const now = new Date().toISOString();
      const update: any = {
        name: payload.name ?? null,
        stateId: payload.stateId || null,
      };

      if (payload.optedOut) {
        update.optedOut = true;
        update.optedOutAt = now;
        update.active = false;
        update.unsubscribedAt = now;
      } else {
        update.optedOut = false;
        update.optedOutAt = null;
        update.active = true;
        update.unsubscribedAt = null;
      }

      return db.newsletterSubscribers.update(payload.id, update);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletterSubscribers"] });
      toast({ title: "Subscriber updated" });
      setIsEditSubscriberOpen(false);
      setEditingSubscriber(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to update subscriber", variant: "destructive" });
    },
  });

  const createStateMutation = useMutation({
    mutationFn: async (payload: { name: string; color: string }) => {
      return db.newsletterStates.create({ name: payload.name, color: payload.color });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletterStates"] });
      toast({ title: "State created" });
      setNewStateName("");
      setNewStateColor("#64748b");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to create state", variant: "destructive" });
    },
  });

  const updateStateMutation = useMutation({
    mutationFn: async (payload: { id: string; name: string; color: string }) => {
      return db.newsletterStates.update(payload.id, { name: payload.name, color: payload.color });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletterStates"] });
      toast({ title: "State updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to update state", variant: "destructive" });
    },
  });

  const deleteStateMutation = useMutation({
    mutationFn: async (id: string) => {
      return db.newsletterStates.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletterStates"] });
      toast({ title: "State deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to delete state", variant: "destructive" });
    },
  });

  const handleExportSubscribers = () => {
    const csv = [
      ["Email", "Name", "Source", "Subscribed At", "Status"].join(","),
      ...subscribers.map((s) =>
        [
          s.email,
          s.name || "",
          s.source || "",
          new Date(s.subscribedAt).toLocaleString(),
          s.active ? "Active" : "Unsubscribed",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isConfigured = (() => {
    const p = defaultSenderProfile;
    if (!p) return false;
    if (!p.service || p.service === "none") return false;
    if (!p.fromEmail) return false;
    if ((p.service === "resend" || p.service === "sendgrid") && !p.hasApiKey) return false;
    if ((p.service === "ses" || p.service === "smtp") && !String(p.apiUrl || "").trim()) return false;
    return true;
  })();

  const previewData = {
    siteUrl: (import.meta as any).env?.VITE_SITE_URL || (typeof window !== "undefined" ? window.location.origin : undefined),
    releases: (releases || []).map((r: any) => ({
      title: r.title,
      artistName: r.artistName,
      coverUrl: r.coverUrl,
      spotifyUrl: r.spotifyUrl,
      appleMusicUrl: r.appleMusicUrl,
      soundcloudUrl: r.soundcloudUrl,
      slug: r.slug,
    })),
    events: (events || []).map((e: any) => ({
      title: e.title,
      date: e.date,
      city: e.city,
      country: e.country,
      ticketUrl: e.ticketUrl,
      slug: e.slug,
      imageUrl: e.imageUrl,
    })),
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Newsletter Management</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage subscribers and send newsletters
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 w-full sm:w-auto">
            <Button className="w-full sm:w-auto" variant="outline" onClick={handleExportSubscribers}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button className="w-full sm:w-auto" variant="outline" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Sender Profiles
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                setCampaignToEdit(null);
                setInitialCampaignTemplateId(defaultTemplate?.id);
                setIsCampaignBuilderOpen(true);
              }}
              disabled={!isConfigured || templates.length === 0}
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </div>
        </div>

        {/* Email Service Status */}
        {!isConfigured && (
          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                    Sender profile not configured
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    Please create a sender profile and set a global default to send newsletters.
                  </p>
                </div>
                <Button className="w-full sm:w-auto" size="sm" variant="outline" onClick={() => setIsSettingsOpen(true)}>
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isConfigured && (
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Sender profile configured: {defaultSenderProfile?.name || "Default"}
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                    From: {defaultSenderProfile?.fromEmail || "-"} ({defaultSenderProfile?.service || "-"})
                  </p>
                </div>
                <Button className="w-full sm:w-auto" size="sm" variant="ghost" onClick={() => setIsSettingsOpen(true)}>
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="subscribers" className="w-full">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          </TabsList>

          <TabsContent value="subscribers" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold tracking-tight">{subscribers.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">All time</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active</CardTitle>
                  <Badge variant="default">{deliverableSubscribers.length}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold tracking-tight text-green-600 dark:text-green-400">
                    {deliverableSubscribers.length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Ready to receive</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unsubscribed</CardTitle>
                  <Badge variant="secondary">{optedOutOrInactiveCount}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold tracking-tight text-muted-foreground">
                    {optedOutOrInactiveCount}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Opted out</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Subscribers</CardTitle>
                <CardDescription>Manage your newsletter subscriber list</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row md:items-end gap-3 mb-4">
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Select value={filterStateId} onValueChange={setFilterStateId}>
                      <SelectTrigger className="w-full md:w-[220px]">
                        <SelectValue placeholder="All states" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All states</SelectItem>
                        {states.map((st) => (
                          <SelectItem key={st.id} value={st.id}>
                            {st.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Delivery</Label>
                    <Select value={filterOptOut} onValueChange={setFilterOptOut}>
                      <SelectTrigger className="w-full md:w-[220px]">
                        <SelectValue placeholder="Deliverable" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deliverable">Deliverable only</SelectItem>
                        <SelectItem value="optedout">Opted out / inactive</SelectItem>
                        <SelectItem value="all">All</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:ml-auto">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button className="w-full sm:w-auto" variant="outline" onClick={() => setIsManageStatesOpen(true)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Manage States
                      </Button>
                      <Button type="button" className="w-full sm:w-auto" variant="outline" onClick={() => setIsAddSubscriberOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Subscriber
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="sm:hidden space-y-2">
                  {filteredSubscribers.map((subscriber) => {
                    const st = states.find((x) => x.id === subscriber.stateId);
                    const color = st?.color || "#64748b";
                    return (
                      <div key={subscriber.id} className="rounded-lg border border-border/50 bg-card p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{subscriber.email}</div>
                            <div className="text-xs text-muted-foreground truncate">{subscriber.name || "-"}</div>
                          </div>
                          <div className="inline-flex items-center gap-1 whitespace-nowrap">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setEditingSubscriber(subscriber);
                                setEditSubscriberForm({
                                  name: subscriber.name || "",
                                  stateId: subscriber.stateId || "",
                                  optedOut: !!subscriber.optedOut || !subscriber.active,
                                });
                                setIsEditSubscriberOpen(true);
                              }}
                              disabled={updateSubscriberMutation.isPending}
                              aria-label={`Edit ${subscriber.email}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                deleteMutation.mutate(subscriber.id);
                              }}
                              aria-label={`Delete ${subscriber.email}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge variant={subscriber.active && !subscriber.optedOut ? "default" : "secondary"}>
                            {subscriber.active && !subscriber.optedOut ? "Deliverable" : "Opted out"}
                          </Badge>
                          {st ? (
                            <Badge variant="secondary" style={{ backgroundColor: color, borderColor: color, color: "white" }}>
                              {st.name}
                            </Badge>
                          ) : (
                            <Badge variant="outline">No state</Badge>
                          )}
                          {subscriber.source === "contact" ? (
                            <Badge variant="outline">Contact</Badge>
                          ) : (
                            <Badge variant="outline">{subscriber.source || "-"}</Badge>
                          )}
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Subscribed: {new Date(subscriber.subscribedAt).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden sm:block w-full overflow-x-auto">
                  <Table className="min-w-[720px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[280px]">Email</TableHead>
                        <TableHead className="hidden sm:table-cell">Name</TableHead>
                        <TableHead className="hidden md:table-cell">State</TableHead>
                        <TableHead className="hidden md:table-cell">Source</TableHead>
                        <TableHead className="hidden md:table-cell">Subscribed</TableHead>
                        <TableHead className="w-[140px]">Status</TableHead>
                        <TableHead className="w-[112px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubscribers.map((subscriber) => (
                        <TableRow key={subscriber.id}>
                          <TableCell className="font-medium">
                            <div className="max-w-[260px] truncate">{subscriber.email}</div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">{subscriber.name || "-"}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {(() => {
                              const st = states.find((x) => x.id === subscriber.stateId);
                              if (!st) return "-";
                              const color = st.color || "#64748b";
                              return (
                                <Badge variant="secondary" style={{ backgroundColor: color, borderColor: color, color: "white" }}>
                                  {st.name}
                                </Badge>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {subscriber.source === "contact" ? <Badge variant="outline">Contact</Badge> : subscriber.source || "-"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{new Date(subscriber.subscribedAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={subscriber.active && !subscriber.optedOut ? "default" : "secondary"}>
                              {subscriber.active && !subscriber.optedOut ? "Deliverable" : "Opted out"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center justify-end gap-1 whitespace-nowrap">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setEditingSubscriber(subscriber);
                                  setEditSubscriberForm({
                                    name: subscriber.name || "",
                                    stateId: subscriber.stateId || "",
                                    optedOut: !!subscriber.optedOut || !subscriber.active,
                                  });
                                  setIsEditSubscriberOpen(true);
                                }}
                                disabled={updateSubscriberMutation.isPending}
                                aria-label={`Edit ${subscriber.email}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  deleteMutation.mutate(subscriber.id);
                                }}
                                aria-label={`Delete ${subscriber.email}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {filteredSubscribers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No subscribers yet</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">Templates</h2>
                <p className="text-sm text-muted-foreground">Design reusable newsletter templates.</p>
              </div>
              <Button
                onClick={() => {
                  setTemplateToEdit(null);
                  setIsTemplateBuilderOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </div>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Saved Templates</CardTitle>
                <CardDescription>Pick a default template for new campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <Table className="min-w-[720px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden md:table-cell">Updated</TableHead>
                        <TableHead className="w-[120px]">Default</TableHead>
                        <TableHead className="w-[140px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {templates.map((t) => (
                        <TableRow
                          key={t.id}
                          className="cursor-pointer"
                          tabIndex={0}
                          onClick={() => {
                            setTemplateToEdit(t);
                            setIsTemplateBuilderOpen(true);
                          }}
                          onKeyDown={(e) => {
                            if (e.key !== "Enter" && e.key !== " ") return;
                            e.preventDefault();
                            setTemplateToEdit(t);
                            setIsTemplateBuilderOpen(true);
                          }}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <span>{t.name}</span>
                              {t.isDefault && <Badge variant="default">Default</Badge>}
                            </div>
                            {t.description && <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{t.description}</div>}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                            {t.updatedAt ? new Date(t.updatedAt).toLocaleString() : "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant={t.isDefault ? "secondary" : "outline"}
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDefaultTemplateMutation.mutate(t.id);
                              }}
                              disabled={setDefaultTemplateMutation.isPending || t.isDefault}
                            >
                              Set Default
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center justify-end gap-1 whitespace-nowrap">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setTemplateToEdit(t);
                                  setIsTemplateBuilderOpen(true);
                                }}
                                aria-label={`Edit template ${t.name}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  duplicateTemplateMutation.mutate(t);
                                }}
                                disabled={duplicateTemplateMutation.isPending}
                                aria-label={`Duplicate template ${t.name}`}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  deleteTemplateMutation.mutate(t.id);
                                }}
                                aria-label={`Delete template ${t.name}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {templates.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No templates yet</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">Campaigns</h2>
                <p className="text-sm text-muted-foreground">Create drafts from a template and send to subscribers.</p>
              </div>
              <Button
                onClick={() => {
                  setCampaignToEdit(null);
                  setInitialCampaignTemplateId(defaultTemplate?.id);
                  setIsCampaignBuilderOpen(true);
                }}
                disabled={templates.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </div>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Campaign History</CardTitle>
                <CardDescription>Drafts and sent newsletters</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <Table className="min-w-[720px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead className="hidden md:table-cell">Template</TableHead>
                        <TableHead className="w-[120px]">Status</TableHead>
                        <TableHead className="hidden md:table-cell">Created</TableHead>
                        <TableHead className="w-[112px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.map((c) => {
                        const t = templates.find((x) => x.id === c.templateId);
                        return (
                          <TableRow
                            key={c.id}
                            className="cursor-pointer"
                            tabIndex={0}
                            onClick={() => {
                              setCampaignToEdit(c);
                              setInitialCampaignTemplateId(undefined);
                              setIsCampaignBuilderOpen(true);
                            }}
                            onKeyDown={(e) => {
                              if (e.key !== "Enter" && e.key !== " ") return;
                              e.preventDefault();
                              setCampaignToEdit(c);
                              setInitialCampaignTemplateId(undefined);
                              setIsCampaignBuilderOpen(true);
                            }}
                          >
                            <TableCell className="font-medium">
                              {c.subject || "(No subject)"}
                              {c.preheader && <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{c.preheader}</div>}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{t?.name || "-"}</TableCell>
                            <TableCell>
                              <Badge variant={c.status === "sent" ? "default" : "secondary"}>{c.status}</Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                              {c.createdAt ? new Date(c.createdAt).toLocaleString() : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="inline-flex items-center justify-end gap-1 whitespace-nowrap">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setCampaignToEdit(c);
                                    setInitialCampaignTemplateId(undefined);
                                    setIsCampaignBuilderOpen(true);
                                  }}
                                  aria-label={`Edit campaign ${c.subject || "(No subject)"}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {campaigns.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No campaigns yet</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <NewsletterTemplateBuilderDialog
        open={isTemplateBuilderOpen}
        onOpenChange={setIsTemplateBuilderOpen}
        template={templateToEdit}
        previewData={previewData as any}
      />

      <NewsletterCampaignBuilderDialog
        open={isCampaignBuilderOpen}
        onOpenChange={setIsCampaignBuilderOpen}
        templates={templates}
        campaign={campaignToEdit}
        initialTemplateId={initialCampaignTemplateId}
        previewData={previewData as any}
        subscribers={deliverableSubscribers}
        states={states}
        onSend={async ({ subject, html, targeting, senderProfileId }) => {
          const stateIds = Array.isArray(targeting?.stateIds) ? targeting?.stateIds : [];

          const recipients = deliverableSubscribers.filter((s) => {
            const stateOk = !stateIds.length || stateIds.includes(String(s.stateId || ""));
            if (!stateOk) return false;

            return true;
          });

          if (recipients.length === 0) {
            throw new Error("No recipients match the selected targeting.");
          }

          await sendNewsletterViaApi({
            recipients: recipients.map((s) => ({ email: s.email, name: s.name || null })),
            subject,
            html,
            senderProfileId,
          });

          toast({
            title: "Newsletter Sent!",
            description: `Email sent to ${recipients.length} subscribers.`,
          });
        }}
      />

      <Dialog open={isAddSubscriberOpen} onOpenChange={setIsAddSubscriberOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Subscriber</DialogTitle>
            <DialogDescription>Add a subscriber manually. They will be included in the newsletter list.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newSubEmail">Email</Label>
              <Input
                id="newSubEmail"
                value={newSubscriber.email}
                onChange={(e) => setNewSubscriber((p) => ({ ...p, email: e.target.value }))}
                placeholder="user@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newSubName">Name (optional)</Label>
              <Input
                id="newSubName"
                value={newSubscriber.name}
                onChange={(e) => setNewSubscriber((p) => ({ ...p, name: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label>State (optional)</Label>
              <Select
                value={newSubscriber.stateId || "__none__"}
                onValueChange={(value) => setNewSubscriber((p) => ({ ...p, stateId: value === "__none__" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No state</SelectItem>
                  {states.map((st) => (
                    <SelectItem key={st.id} value={st.id}>
                      {st.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSubscriberOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                upsertSubscriberMutation.mutate({
                  email: newSubscriber.email,
                  name: newSubscriber.name || undefined,
                  stateId: newSubscriber.stateId || undefined,
                });
              }}
              disabled={upsertSubscriberMutation.isPending}
            >
              {upsertSubscriberMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditSubscriberOpen}
        onOpenChange={(open) => {
          setIsEditSubscriberOpen(open);
          if (!open) setEditingSubscriber(null);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Subscriber</DialogTitle>
            <DialogDescription>Update subscriber state and opt-out status.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={editingSubscriber?.email || ""} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editSubName">Name</Label>
              <Input
                id="editSubName"
                value={editSubscriberForm.name}
                onChange={(e) => setEditSubscriberForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Full name"
              />
            </div>

            <div className="space-y-2">
              <Label>State</Label>
              <Select
                value={editSubscriberForm.stateId || "__none__"}
                onValueChange={(value) => setEditSubscriberForm((p) => ({ ...p, stateId: value === "__none__" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No state</SelectItem>
                  {states.map((st) => (
                    <SelectItem key={st.id} value={st.id}>
                      {st.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border/50 p-3">
              <div>
                <div className="text-sm font-medium">Opted out</div>
                <div className="text-xs text-muted-foreground">If enabled, subscriber will not receive emails.</div>
              </div>
              <Switch
                checked={editSubscriberForm.optedOut}
                onCheckedChange={(checked) => setEditSubscriberForm((p) => ({ ...p, optedOut: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditSubscriberOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!editingSubscriber) return;
                const name = String(editSubscriberForm.name || "").trim();
                updateSubscriberMutation.mutate({
                  id: editingSubscriber.id,
                  name: name.length ? name : null,
                  stateId: editSubscriberForm.stateId || null,
                  optedOut: !!editSubscriberForm.optedOut,
                });
              }}
              disabled={!editingSubscriber || updateSubscriberMutation.isPending}
            >
              {updateSubscriberMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isManageStatesOpen} onOpenChange={setIsManageStatesOpen}>
        <DialogContent className="sm:max-w-2xl sm:max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Subscriber States</DialogTitle>
            <DialogDescription>Create and rename states globally. Existing subscribers update automatically.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2 flex flex-row gap-3 items-end">
              <Input
                id="newStateName"
                value={newStateName}
                onChange={(e) => setNewStateName(e.target.value)}
                placeholder="DJ"
              />
              <div className="flex items-center gap-3">
                <Input
                  id="newStateColor"
                  type="color"
                  value={newStateColor}
                  onChange={(e) => setNewStateColor(e.target.value)}
                  className="h-10 w-16 p-0 border-none"
                />
              </div>
            </div>
            <div>
              <Button
                onClick={() => createStateMutation.mutate({ name: newStateName, color: newStateColor })}
                disabled={createStateMutation.isPending || !newStateName.trim()}
              >
                {createStateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create State"
                )}
              </Button>
            </div>

            <div className="border-t border-border/50 pt-4 space-y-3">
              {states.map((st) => (
                <div key={st.id} className="flex flex-col sm:flex-row gap-2 sm:items-end">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={st.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        queryClient.setQueryData(["newsletterStates"], (prev: NewsletterState[] | undefined) =>
                          (prev || []).map((x) => (x.id === st.id ? { ...x, name } : x))
                        );
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="color"
                      value={st.color || "#64748b"}
                      onChange={(e) => {
                        const color = e.target.value;
                        queryClient.setQueryData(["newsletterStates"], (prev: NewsletterState[] | undefined) =>
                          (prev || []).map((x) => (x.id === st.id ? { ...x, color } : x))
                        );
                      }}
                      className="h-9 w-16 p-0 border-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => updateStateMutation.mutate({ id: st.id, name: st.name, color: st.color || "#64748b" })}
                      disabled={updateStateMutation.isPending}
                    >
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteStateMutation.mutate(st.id)}
                      disabled={deleteStateMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {states.length === 0 && (
                <div className="text-sm text-muted-foreground">No states found.</div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManageStatesOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-4xl overflow-hidden p-0">
          <div className="flex flex-col max-h-[90vh]">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
              <DialogTitle>Sender Profiles</DialogTitle>
              <DialogDescription>Create multiple sender profiles and choose a global default.</DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-hidden px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-4 h-full">
                <Card className="border-border/50 flex flex-col overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-base">Profiles</CardTitle>
                      <CardDescription>create a new profile.</CardDescription>
                    </div>
                    <Button
                      size="sm"
                      type="button"
                      onClick={() => {
                        setIsCreatingSenderProfile(true);
                        setIsSenderProfileFormDirty(false);
                        setSelectedSenderProfileId(null);
                        setSenderProfileForm({
                          name: "",
                          service: "resend",
                          fromEmail: "",
                          senderName: "",
                          apiUrl: "",
                          apiKey: "",
                          makeDefault: senderProfiles.length === 0,
                        });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New
                    </Button>
                  </CardHeader>

                  <CardContent className="flex-1 overflow-auto space-y-2">
                    {senderProfiles.map((p) => {
                      const selected = p.id === selectedSenderProfileId;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          className={
                            "w-full text-left rounded-md border px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 " +
                            (selected
                              ? "bg-primary/10 border-primary/30"
                              : "bg-muted/20 border-border/50 hover:bg-muted/30")
                          }
                          onClick={() => {
                            setIsCreatingSenderProfile(false);
                            setIsSenderProfileFormDirty(false);
                            setSelectedSenderProfileId(p.id);
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-medium text-sm flex items-center gap-2">
                                <span className="truncate">{p.name}</span>
                                {p.isDefault && <Badge variant="default">Default</Badge>}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5 truncate">{p.fromEmail}</div>
                            </div>
                            <Badge variant="secondary" className="shrink-0">
                              {p.service}
                            </Badge>
                          </div>
                        </button>
                      );
                    })}

                    {senderProfiles.length === 0 && (
                      <div className="text-sm text-muted-foreground py-10 text-center">
                        No sender profiles yet. Create one to enable sending.
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/50 flex flex-col overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {selectedSenderProfileId ? "Edit Profile" : isCreatingSenderProfile ? "New Profile" : "Profile Details"}
                    </CardTitle>
                    {(selectedSenderProfileId || isCreatingSenderProfile) && (
                      <CardDescription>
                        {selectedSenderProfileId ? "Update this sender configuration." : "Create a new sender configuration."}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="flex-1 overflow-auto space-y-4">
                    {!selectedSenderProfileId && !isCreatingSenderProfile ? (
                      <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center px-6 py-10">
                        <div className="text-sm font-medium">Select a profile to edit</div>
                        <div className="text-xs text-muted-foreground mt-1">Or create a new profile to start sending.</div>
                        <Button
                          type="button"
                          className="mt-4"
                          onClick={() => {
                            setIsCreatingSenderProfile(true);
                            setIsSenderProfileFormDirty(false);
                            setSelectedSenderProfileId(null);
                            setSenderProfileForm({
                              name: "",
                              service: "resend",
                              fromEmail: "",
                              senderName: "",
                              apiUrl: "",
                              apiKey: "",
                              makeDefault: senderProfiles.length === 0,
                            });
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create profile
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="profileName">Profile name</Label>
                          <Input
                            id="profileName"
                            value={senderProfileForm.name}
                            onChange={(e) => {
                              setIsSenderProfileFormDirty(true);
                              setSenderProfileForm((p) => ({ ...p, name: e.target.value }));
                            }}
                            placeholder="Main Resend sender"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Email service</Label>
                          <Select
                            value={senderProfileForm.service}
                            onValueChange={(value) => {
                              setIsSenderProfileFormDirty(true);
                              setSenderProfileForm((p) => ({ ...p, service: value, apiKey: "" }));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select email service" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="resend">Resend</SelectItem>
                              <SelectItem value="sendgrid">SendGrid</SelectItem>
                              <SelectItem value="ses">AWS SES</SelectItem>
                              <SelectItem value="smtp">SMTP (via Backend)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="profileFromEmail">From email</Label>
                            <Input
                              id="profileFromEmail"
                              type="email"
                              value={senderProfileForm.fromEmail}
                              onChange={(e) => {
                                setIsSenderProfileFormDirty(true);
                                setSenderProfileForm((p) => ({ ...p, fromEmail: e.target.value }));
                              }}
                              placeholder="user@yourdomain.com"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="profileSenderName">Sender name</Label>
                            <Input
                              id="profileSenderName"
                              value={senderProfileForm.senderName}
                              onChange={(e) => {
                                setIsSenderProfileFormDirty(true);
                                setSenderProfileForm((p) => ({ ...p, senderName: e.target.value }));
                              }}
                              placeholder="GroupTherapy Records"
                            />
                          </div>
                        </div>

                        {(senderProfileForm.service === "resend" || senderProfileForm.service === "sendgrid") && (
                          <div className="space-y-2">
                            <Label htmlFor="profileApiKey">API key</Label>
                            <Input
                              id="profileApiKey"
                              type="password"
                              placeholder={(() => {
                                const current = senderProfiles.find((x) => x.id === selectedSenderProfileId);
                                if (current?.hasApiKey) return `Saved (ends with ${current.apiKeyLast4 || "****"}) — enter to replace`;
                                return "Enter API key";
                              })()}
                              value={senderProfileForm.apiKey}
                              onChange={(e) => {
                                setIsSenderProfileFormDirty(true);
                                setSenderProfileForm((p) => ({ ...p, apiKey: e.target.value }));
                              }}
                            />
                            <div className="text-xs text-muted-foreground">Stored securely in the database. Leave blank to keep current key.</div>
                          </div>
                        )}

                        {(senderProfileForm.service === "ses" || senderProfileForm.service === "smtp") && (
                          <div className="space-y-2">
                            <Label htmlFor="profileApiUrl">API URL</Label>
                            <Input
                              id="profileApiUrl"
                              type="url"
                              value={senderProfileForm.apiUrl}
                              onChange={(e) => {
                                setIsSenderProfileFormDirty(true);
                                setSenderProfileForm((p) => ({ ...p, apiUrl: e.target.value }));
                              }}
                              placeholder="https://api.example.com/send-email"
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-between rounded-md border border-border/50 p-3">
                          <div>
                            <div className="text-sm font-medium">Global default</div>
                            <div className="text-xs text-muted-foreground">Used when sending unless a campaign overrides it.</div>
                          </div>
                          <Switch
                            checked={senderProfileForm.makeDefault}
                            onCheckedChange={(checked) => {
                              setIsSenderProfileFormDirty(true);
                              setSenderProfileForm((p) => ({ ...p, makeDefault: checked }));
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>

                  <div className="border-t border-border/50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        if (!selectedSenderProfileId) return;
                        deleteSenderProfileMutation.mutate(selectedSenderProfileId);
                      }}
                      disabled={!selectedSenderProfileId || deleteSenderProfileMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>

                    <div className="flex items-center gap-2 justify-end">
                      <Button variant="outline" type="button" onClick={() => setIsSettingsOpen(false)}>
                        Close
                      </Button>

                      <Button
                        type="button"
                        onClick={() => saveSenderProfileMutation.mutate()}
                        disabled={saveSenderProfileMutation.isPending}
                      >
                        {saveSenderProfileMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Save Profile
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Compose Dialog */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="sm:max-w-4xl sm:max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>Compose Newsletter</DialogTitle>
            <DialogDescription>
              Create and send a newsletter to {deliverableSubscribers.length} deliverable subscribers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isGeminiConfigured() && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Label htmlFor="prompt">
                      <Sparkles className="h-4 w-4 inline mr-1" />
                      Generate with AI
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="prompt"
                        placeholder="E.g., 'Announce our new summer release compilation'"
                        value={emailData.prompt}
                        onChange={(e) =>
                          setEmailData((prev) => ({ ...prev, prompt: e.target.value }))
                        }
                      />
                      <Button
                        onClick={handleGenerateContent}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Newsletter subject"
                value={emailData.subject}
                onChange={(e) =>
                  setEmailData((prev) => ({ ...prev, subject: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content (HTML supported)</Label>
              <Textarea
                id="content"
                placeholder="Newsletter content..."
                value={emailData.content}
                onChange={(e) =>
                  setEmailData((prev) => ({ ...prev, content: e.target.value }))
                }
                rows={15}
                className="font-mono text-sm"
              />
            </div>

            {emailData.content && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(emailData.content) }}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsComposeOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendNewsletter}
              disabled={sendEmailMutation.isPending || !isConfigured}
            >
              {sendEmailMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Newsletter
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
