import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Pencil,
  FileText,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Home,
  GripVertical,
  Star,
  ChevronDown,
  Sparkles,
  Repeat,
  BarChart3,
  Disc3,
  Users,
  Calendar,
  ListMusic,
  Newspaper,
  MessageSquareQuote,
  Trophy,
  Mail,
  Megaphone,
  Radio,
  TrendingUp,
  Video,
  Globe,
  Heart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "./index";
import { queryClient, queryFunctions } from "@/lib/queryClient";
import {
  db,
  StaticPage,
  SiteSettings,
  MarqueeItem,
  PartnerMarqueeItem,
  StatItem,
  PageSectionConfig,
  PageHeroOverrides,
  Testimonial,
} from "@/lib/database";
import { Link } from "wouter";
import { VideoUpload } from "@/components/video-upload";
import { ImageUpload } from "@/components/image-upload";
import { MarkdownEditor } from "@/components/markdown-editor";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveMediaUrl } from "@/lib/media";

type AboutPageModel = {
  sections: Array<{ id: string; enabled: boolean; order: number }>;
  heroTitle: string;
  heroSubtitle: string;
  missionHeading: string;
  missionText: string;
  stats: Array<{ value: string; label: string }>;
  timelineHeading: string;
  milestones: Array<{ year: string; title: string; description: string }>;
  teamHeading: string;
  teamMembers: Array<{
    id: string;
    name: string;
    role: string;
    bio?: string;
    imageUrl?: string;
    socialLinks?: { linkedin?: string; twitter?: string; instagram?: string };
    order?: number;
  }>;
  ctaHeading: string;
  ctaDescription: string;
  ctaPrimaryText: string;
  ctaSecondaryText: string;
};

const defaultAboutSections: Array<{ id: string; enabled: boolean; order: number }> = [
  { id: "marquee", enabled: true, order: 1 },
  { id: "mission", enabled: true, order: 2 },
  { id: "stats", enabled: true, order: 3 },
  { id: "timeline", enabled: true, order: 4 },
  { id: "team", enabled: true, order: 5 },
  { id: "cta", enabled: true, order: 6 },
  { id: "partners", enabled: true, order: 7 },
];

const defaultAboutPageModel: AboutPageModel = {
  sections: defaultAboutSections,
  heroTitle: "About Us",
  heroSubtitle: "The story behind the sound",
  missionHeading: "Our Mission",
  missionText:
    "GroupTherapy Records is more than a record label – it's a movement. We're dedicated to discovering, nurturing, and amplifying the most innovative voices in electronic music. From underground clubs to festival main stages, we're building a community that celebrates the transformative power of sound.",
  stats: [
    { value: "200+", label: "Releases" },
    { value: "50+", label: "Artists" },
    { value: "1M+", label: "Monthly Listeners" },
    { value: "100+", label: "Events" },
  ],
  timelineHeading: "Our Journey",
  milestones: [
    { year: "2015", title: "Founded", description: "GroupTherapy Records was born in a London basement studio" },
    { year: "2017", title: "First Festival", description: "Launched our flagship festival event" },
    { year: "2019", title: "100 Releases", description: "Reached 100 releases milestone" },
    { year: "2021", title: "Radio Launch", description: "GroupTherapy Radio goes live 24/7" },
    { year: "2023", title: "Global Expansion", description: "Opened offices in Berlin and Los Angeles" },
    { year: "2024", title: "Today", description: "Continuing to push boundaries in electronic music" },
  ],
  teamHeading: "Meet the Team",
  teamMembers: [
    {
      id: "1",
      name: "Alex Thompson",
      role: "Founder & CEO",
      bio: "Visionary behind GroupTherapy Records, Alex has been shaping electronic music culture for over 15 years.",
      imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop",
      socialLinks: { linkedin: "#", twitter: "#" },
      order: 1,
    },
    {
      id: "2",
      name: "Sarah Chen",
      role: "Head of A&R",
      bio: "With an ear for the next big sound, Sarah discovers and develops the talent that defines our roster.",
      imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop",
      socialLinks: { linkedin: "#", instagram: "#" },
      order: 2,
    },
    {
      id: "3",
      name: "Marcus Rivera",
      role: "Creative Director",
      bio: "Marcus crafts the visual identity of GroupTherapy, from album art to live show production.",
      imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
      socialLinks: { twitter: "#", instagram: "#" },
      order: 3,
    },
    {
      id: "4",
      name: "Emma Wilson",
      role: "Marketing Director",
      bio: "Emma leads our global marketing strategy, connecting artists with fans worldwide.",
      imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop",
      socialLinks: { linkedin: "#" },
      order: 4,
    },
  ],
  ctaHeading: "Want to work with us?",
  ctaDescription:
    "Whether you have a question about our artists, event promos, or submitting a demo, get in touch.",
  ctaPrimaryText: "Get in Touch",
  ctaSecondaryText: "Press Kit",
};

function tryParseAboutPageModel(raw: string): AboutPageModel | null {
  const trimmed = (raw || "").trim();
  if (!trimmed || !trimmed.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.heroTitle || !parsed.heroSubtitle) return null;
    return parsed as AboutPageModel;
  } catch {
    return null;
  }
}

function normalizeAboutSections(
  incoming: AboutPageModel["sections"],
  defaults: Array<{ id: string; enabled: boolean; order: number }>
) {
  const byId = new Map(
    (Array.isArray(incoming) ? incoming : [])
      .filter((s) => !!s && typeof s.id === "string")
      .map((s) => [s.id, s] as const)
  );

  return defaults
    .map((d) => {
      const inc = byId.get(d.id);
      if (!inc) return d;
      return {
        ...d,
        ...inc,
        id: d.id,
        enabled: typeof inc.enabled === "boolean" ? inc.enabled : d.enabled,
        order: typeof inc.order === "number" ? inc.order : d.order,
      };
    })
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function normalizeAboutPageModel(input: Partial<AboutPageModel> | null | undefined): AboutPageModel {
  const m: any = input || {};
  return {
    sections: normalizeAboutSections(m.sections, defaultAboutSections),
    heroTitle: m.heroTitle ?? defaultAboutPageModel.heroTitle,
    heroSubtitle: m.heroSubtitle ?? defaultAboutPageModel.heroSubtitle,
    missionHeading: m.missionHeading ?? defaultAboutPageModel.missionHeading,
    missionText: m.missionText ?? defaultAboutPageModel.missionText,
    stats: Array.isArray(m.stats) ? m.stats : defaultAboutPageModel.stats,
    timelineHeading: m.timelineHeading ?? defaultAboutPageModel.timelineHeading,
    milestones: Array.isArray(m.milestones) ? m.milestones : defaultAboutPageModel.milestones,
    teamHeading: m.teamHeading ?? defaultAboutPageModel.teamHeading,
    teamMembers: Array.isArray(m.teamMembers) ? m.teamMembers : defaultAboutPageModel.teamMembers,
    ctaHeading: m.ctaHeading ?? defaultAboutPageModel.ctaHeading,
    ctaDescription: m.ctaDescription ?? defaultAboutPageModel.ctaDescription,
    ctaPrimaryText: m.ctaPrimaryText ?? defaultAboutPageModel.ctaPrimaryText,
    ctaSecondaryText: m.ctaSecondaryText ?? defaultAboutPageModel.ctaSecondaryText,
  };
}

function renderMarkdown(markdown: string): string {
  if (!markdown) return '';
  
  let html = markdown;
  
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>');
  
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline hover:no-underline">$1</a>');
  
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>');
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$2</li>');
  
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => {
    if (match.includes('list-decimal')) {
      return `<ol class="my-2 space-y-1">${match}</ol>`;
    }
    return `<ul class="my-2 space-y-1">${match}</ul>`;
  });
  
  html = html.replace(/\n\n/g, '</p><p class="mb-4">');
  html = `<p class="mb-4">${html}</p>`;
  
  html = html.replace(/<p class="mb-4"><\/p>/g, '');
  html = html.replace(/<p class="mb-4">(<h[1-3])/g, '$1');
  html = html.replace(/(<\/h[1-3]>)<\/p>/g, '$1');
  html = html.replace(/<p class="mb-4">(<[uo]l)/g, '$1');
  html = html.replace(/(<\/[uo]l>)<\/p>/g, '$1');
  
  return html;
}

function MarkdownPreview({ content }: { content: string }) {
  const html = useMemo(() => renderMarkdown(content), [content]);
  const sanitizedHtml = useMemo(() => sanitizeHtml(html), [html]);
  
  return (
    <div 
      className="prose prose-sm dark:prose-invert max-w-none min-h-[300px] p-4 border rounded-md bg-muted/30"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}

const iconOptions = [
  { value: "Disc3", label: "💿 Disc" },
  { value: "Radio", label: "📻 Radio" },
  { value: "Music2", label: "🎵 Music" },
  { value: "Users", label: "👥 Users" },
  { value: "Play", label: "▶️ Play" },
  { value: "Headphones", label: "🎧 Headphones" },
  { value: "Mic", label: "🎤 Mic" },
  { value: "Heart", label: "❤️ Heart" },
  { value: "Star", label: "⭐ Star" },
  { value: "Globe", label: "🌍 Globe" },
  { value: "Calendar", label: "📅 Calendar" },
  { value: "Trophy", label: "🏆 Trophy" },
];

const defaultMarqueeItems: MarqueeItem[] = [
  { text: "New Release: ECHOES EP", icon: "Disc3" },
  { text: "Live Radio 24/7", icon: "Radio" },
  { text: "Summer Tour 2025", icon: "Music2" },
  { text: "50+ Artists Worldwide", icon: "Users" },
  { text: "Stream Now on All Platforms", icon: "Play" },
  { text: "GroupTherapy Sessions", icon: "Headphones" },
];

const defaultStatsItems: StatItem[] = [
  { value: 50, suffix: "+", prefix: "", label: "Artists", icon: "Users" },
  { value: 200, suffix: "+", prefix: "", label: "Releases", icon: "Disc3" },
  { value: 24, suffix: "/7", prefix: "", label: "Radio", icon: "Radio" },
  { value: 1, suffix: "M+", prefix: "", label: "Streams", icon: "Headphones" },
];

const defaultHomeSections: PageSectionConfig[] = [
  { id: "hero", enabled: true, order: 1 },
  {
    id: "stats",
    enabled: true,
    order: 2,
    title: "Growing the future of",
    highlight: "music",
    description: "Our numbers tell the story of a community united by sound.",
  },
  { id: "marquee", enabled: true, order: 3 },
  { id: "partners", enabled: true, order: 14 },
  {
    id: "releases",
    enabled: true,
    order: 4,
    title: "New",
    highlight: "Releases",
    description: "The latest releases from our comunity",
    actionLabel: "View All Releases",
    actionHref: "/releases",
    carouselEnabled: true,
    carouselIntervalMs: 6000,
  },
  {
    id: "artists",
    enabled: true,
    order: 5,
    title: "Supported",
    highlight: "Artists",
    description: "The artists shaping the Group Therapy community",
    actionLabel: "Meet The Artists",
    actionHref: "/artists",
    carouselEnabled: true,
    carouselIntervalMs: 6000,
  },
  {
    id: "events",
    enabled: true,
    order: 6,
    title: "Upcoming",
    highlight: "Events",
    description: "Experience the music live",
    actionLabel: "View All Events",
    actionHref: "/events",
  },
  {
    id: "playlists",
    enabled: true,
    order: 7,
    title: "Curated",
    highlight: "Playlists",
    description: "Official selections of playlists that reflects our sound",
    actionLabel: "View All Playlists",
    actionHref: "/playlists",
    carouselEnabled: true,
    carouselIntervalMs: 6000,
  },
  {
    id: "news",
    enabled: true,
    order: 8,
    title: "Latest",
    highlight: "News",
    description: "The latest music news from around the world",
    actionLabel: "View All News",
    actionHref: "/news",
    carouselEnabled: true,
    carouselIntervalMs: 6000,
  },
  {
    id: "videos",
    enabled: true,
    order: 9,
    title: "Latest",
    highlight: "Videos",
    description: "Watch music videos, live performances, and behind-the-scenes content",
    actionLabel: "View All Videos",
    actionHref: "/videos",
    carouselEnabled: true,
    carouselIntervalMs: 6000,
  },
  { id: "testimonials", enabled: true, order: 10 },
  {
    id: "awards",
    enabled: true,
    order: 11,
    tag: "Therapy Awards",
    title: "Voting is",
    highlight: "live",
    description: "Vote for your favorites, make them win the battle.",
    actionLabel: "View Awards",
    actionHref: "/awards",
  },
  { id: "newsletter", enabled: true, order: 12 },
  {
    id: "newsCta",
    enabled: true,
    order: 13,
    title: "Stay in the",
    highlight: "loop",
    description:
      "Get the latest news, interviews, and behind-the-scenes content from the label.",
    actionLabel: "Read Latest News",
    actionHref: "/news",
  },
];

function normalizeSections(
  incoming: PageSectionConfig[] | null | undefined,
  defaults: PageSectionConfig[]
): PageSectionConfig[] {
  const incomingById = new Map(
    (Array.isArray(incoming) ? incoming : [])
      .filter((s): s is PageSectionConfig => !!s && typeof s.id === "string")
      .map((s) => [s.id, s] as const)
  );

  return defaults.map((d) => {
    const inc = incomingById.get(d.id);
    if (!inc) return d;
    return {
      ...d,
      ...inc,
      id: d.id,
      enabled: typeof inc.enabled === "boolean" ? inc.enabled : d.enabled,
      order: typeof inc.order === "number" ? inc.order : d.order,
    };
  });
}

const heroOverridePages = [
  { key: "/releases", label: "Releases" },
  { key: "/artists", label: "Artists" },
  { key: "/playlists", label: "Playlists" },
  { key: "/radio", label: "Radio" },
  { key: "/events", label: "Events" },
  { key: "/tours", label: "Tours" },
  { key: "/videos", label: "Videos" },
  { key: "/news", label: "News" },
  { key: "/awards", label: "Awards" },
  { key: "/contact", label: "Contact" },
  { key: "/press", label: "Press" },
  { key: "/careers", label: "Careers" },
  { key: "/promote-your-event", label: "Promote Your Event" },
  { key: "/promote-your-release", label: "Promote Your Release" },
];

const homeSectionMeta: Record<string, { label: string; Icon: any }> = {
  hero: { label: "Hero", Icon: Sparkles },
  marquee: { label: "Marquee", Icon: Repeat },
  partners: { label: "Partners", Icon: Globe },
  stats: { label: "Stats", Icon: BarChart3 },
  releases: { label: "Releases", Icon: Disc3 },
  artists: { label: "Artists", Icon: Users },
  events: { label: "Events", Icon: Calendar },
  playlists: { label: "Playlists", Icon: ListMusic },
  news: { label: "News", Icon: Newspaper },
  videos: { label: "Videos", Icon: Video },
  testimonials: { label: "Testimonials", Icon: MessageSquareQuote },
  awards: { label: "Awards", Icon: Trophy },
  newsletter: { label: "Newsletter", Icon: Mail },
  newsCta: { label: "News CTA", Icon: Megaphone },
};

const pageHeaderMeta: Record<string, { label: string; Icon: any }> = {
  "/releases": { label: "Releases", Icon: Disc3 },
  "/artists": { label: "Artists", Icon: Users },
  "/playlists": { label: "Playlists", Icon: ListMusic },
  "/radio": { label: "Radio", Icon: Radio },
  "/events": { label: "Events", Icon: Calendar },
  "/tours": { label: "Tours", Icon: TrendingUp },
  "/videos": { label: "Videos", Icon: Video },
  "/news": { label: "News", Icon: Newspaper },
  "/awards": { label: "Awards", Icon: Trophy },
  "/contact": { label: "Contact", Icon: Mail },
  "/press": { label: "Press", Icon: FileText },
  "/careers": { label: "Careers", Icon: Heart },
  "/promote-your-event": { label: "Promote Your Event", Icon: Megaphone },
  "/promote-your-release": { label: "Promote Your Release", Icon: Megaphone },
};

export default function AdminStaticPages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<StaticPage | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    metaTitle: "",
    metaDescription: "",
    published: true,
  });

  const [aboutForm, setAboutForm] = useState<AboutPageModel>(defaultAboutPageModel);
  const [draggingTeamMemberId, setDraggingTeamMemberId] = useState<string | null>(null);
  const [dragOverTeamMemberId, setDragOverTeamMemberId] = useState<string | null>(null);
  const [draggingAboutSectionId, setDraggingAboutSectionId] = useState<string | null>(null);
  const [dragOverAboutSectionId, setDragOverAboutSectionId] = useState<string | null>(null);

  const [heroSettings, setHeroSettings] = useState({
    heroTag: "",
    heroTitle: "GROUPTHERAPY",
    heroSubtitle: "The sound of tomorrow, today. Discover the future of the music you love.",
    heroBackgroundImage: "",
    heroBackgroundVideo: "",
    heroBackgroundType: "image" as "image" | "video",
    heroCtaText: "Explore Releases",
    heroCtaLink: "/releases",
    showHeroRadio: true,
  });

  const [marqueeItems, setMarqueeItems] = useState<MarqueeItem[]>(defaultMarqueeItems);
  const [marqueeSpeed, setMarqueeSpeed] = useState(40);

  const [partnersMarqueeItems, setPartnersMarqueeItems] = useState<PartnerMarqueeItem[]>([]);
  const [partnersMarqueeSpeed, setPartnersMarqueeSpeed] = useState(40);
  const [partnersMarqueeGap, setPartnersMarqueeGap] = useState(48);
  const [partnersMarqueeLogoHeight, setPartnersMarqueeLogoHeight] = useState(32);
  const [partnersMarqueeUseMutedBg, setPartnersMarqueeUseMutedBg] = useState(false);
  const [draggingPartnerIndex, setDraggingPartnerIndex] = useState<number | null>(null);
  const [dragOverPartnerIndex, setDragOverPartnerIndex] = useState<number | null>(null);
  const [openPartnerIndex, setOpenPartnerIndex] = useState<number | null>(null);

  const [statsItems, setStatsItems] = useState<StatItem[]>(defaultStatsItems);

  const [newsletterContent, setNewsletterContent] = useState({
    newsletterTitle: "Join the community",
    newsletterDescription: "Get exclusive releases, early event access, and behind-the-scenes content.",
    newsletterButtonText: "Subscribe",
    newsletterDisclaimer: "No spam. Unsubscribe anytime.",
  });

  const [isTestimonialDialogOpen, setIsTestimonialDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [testimonialFormData, setTestimonialFormData] = useState({
    name: "",
    role: "",
    content: "",
    avatarUrl: "",
    rating: 5,
    displayOrder: 0,
    published: true,
  });

  const [homeSections, setHomeSections] = useState<PageSectionConfig[]>(defaultHomeSections);
  const [draggingHomeSectionId, setDraggingHomeSectionId] = useState<string | null>(null);
  const [dragOverHomeSectionId, setDragOverHomeSectionId] = useState<string | null>(null);
  const [openHomeSectionId, setOpenHomeSectionId] = useState<string | null>(null);
  const [openPageHeaderKey, setOpenPageHeaderKey] = useState<string | null>(null);
  const lastSettingsSaveContextRef = useRef<"homepage" | "pageHeaders" | null>(null);
  const [pageHeroOverrides, setPageHeroOverrides] = useState<PageHeroOverrides>({});

  const { data: pages = [] } = useQuery<StaticPage[]>({
    queryKey: ["staticPages"],
    queryFn: queryFunctions.staticPages,
  });

  const { data: testimonials = [] } = useQuery<Testimonial[]>({
    queryKey: ["testimonials"],
    queryFn: queryFunctions.testimonials,
  });

  const { data: siteSettings, isLoading: isLoadingSettings } = useQuery<SiteSettings | null>({
    queryKey: ["siteSettings"],
    queryFn: () => db.siteSettings.get(),
  });

  // Update local state when site settings are fetched
  useEffect(() => {
    if (siteSettings) {
      setHeroSettings({
        heroTag: siteSettings.heroTag || "",
        heroTitle: siteSettings.heroTitle || "GROUPTHERAPY",
        heroSubtitle: siteSettings.heroSubtitle || "The sound of tomorrow, today. Discover the future of the music you love.",
        heroBackgroundImage: siteSettings.heroBackgroundImage || "",
        heroBackgroundVideo: siteSettings.heroBackgroundVideo || "",
        heroBackgroundType: siteSettings.heroBackgroundType || "image",
        heroCtaText: siteSettings.heroCtaText || "Explore Releases",
        heroCtaLink: siteSettings.heroCtaLink || "/releases",
        showHeroRadio: siteSettings.showHeroRadio ?? true,
      });
      setMarqueeItems(siteSettings.marqueeItems || defaultMarqueeItems);
      setMarqueeSpeed(siteSettings.marqueeSpeed || 40);
      setPartnersMarqueeItems(siteSettings.partnersMarqueeItems || []);
      setPartnersMarqueeSpeed(siteSettings.partnersMarqueeSpeed || 40);
      setPartnersMarqueeGap(siteSettings.partnersMarqueeGap || 48);
      setPartnersMarqueeLogoHeight(siteSettings.partnersMarqueeLogoHeight || 32);
      setPartnersMarqueeUseMutedBg(siteSettings.partnersMarqueeUseMutedBg || false);
      setStatsItems(siteSettings.statsItems || defaultStatsItems);
      setNewsletterContent({
        newsletterTitle: siteSettings.newsletterTitle || "Join the community",
        newsletterDescription:
          siteSettings.newsletterDescription || "Get exclusive releases, early event access, and behind-the-scenes content.",
        newsletterButtonText: siteSettings.newsletterButtonText || "Subscribe",
        newsletterDisclaimer: siteSettings.newsletterDisclaimer || "No spam. Unsubscribe anytime.",
      });
      setHomeSections(
        normalizeSections(siteSettings.homeSections, defaultHomeSections)
          .slice()
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      );
      setPageHeroOverrides(siteSettings.pageHeroOverrides || {});
    }
  }, [siteSettings]);

  const saveMutation = useMutation({
    mutationFn: async (data: { id: string; page: Partial<StaticPage> }) => {
      return db.staticPages.update(data.id, data.page);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staticPages"] });
      toast({
        title: "Page updated",
        description: "The page has been updated successfully.",
      });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save page",
        variant: "destructive",
      });
    },
  });

  const resetTestimonialForm = () => {
    setEditingTestimonial(null);
    setTestimonialFormData({
      name: "",
      role: "",
      content: "",
      avatarUrl: "",
      rating: 5,
      displayOrder: 0,
      published: true,
    });
  };

  const openAddTestimonialDialog = () => {
    resetTestimonialForm();
    setTestimonialFormData((prev) => ({
      ...prev,
      displayOrder: (testimonials || []).length,
    }));
    setIsTestimonialDialogOpen(true);
  };

  const handleEditTestimonial = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setTestimonialFormData({
      name: testimonial.name || "",
      role: testimonial.role || "",
      content: testimonial.content || "",
      avatarUrl: testimonial.avatarUrl || "",
      rating: testimonial.rating || 5,
      displayOrder: testimonial.displayOrder || 0,
      published: testimonial.published,
    });
    setIsTestimonialDialogOpen(true);
  };

  const handleSaveTestimonial = () => {
    const testimonialData: Partial<Testimonial> = {
      name: testimonialFormData.name,
      role: testimonialFormData.role,
      content: testimonialFormData.content,
      avatarUrl: testimonialFormData.avatarUrl || undefined,
      rating: testimonialFormData.rating,
      displayOrder: testimonialFormData.displayOrder,
      published: testimonialFormData.published,
    };

    saveTestimonialMutation.mutate({
      isEdit: !!editingTestimonial,
      id: editingTestimonial?.id,
      testimonial: testimonialData,
    });
  };

  const deleteTestimonialMutation = useMutation({
    mutationFn: async (id: string) => {
      return db.testimonials.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["testimonialsPublished"] });
      toast({
        title: "Testimonial deleted",
        description: "The testimonial has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete testimonial",
        variant: "destructive",
      });
    },
  });

  const saveTestimonialMutation = useMutation({
    mutationFn: async (data: { isEdit: boolean; id?: string; testimonial: Partial<Testimonial> }) => {
      if (data.isEdit && data.id) {
        return db.testimonials.update(data.id, data.testimonial);
      }
      return db.testimonials.create(data.testimonial);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["testimonialsPublished"] });
      toast({
        title: variables.isEdit ? "Testimonial updated" : "Testimonial created",
        description: variables.isEdit ? "The testimonial has been updated." : "The testimonial has been created.",
      });
      setIsTestimonialDialogOpen(false);
      resetTestimonialForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save testimonial",
        variant: "destructive",
      });
    },
  });

  const toggleTestimonialPublishedMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      return db.testimonials.update(id, { published });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["testimonialsPublished"] });
      toast({
        title: "Status updated",
        description: "The testimonial visibility has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: (settings: Partial<SiteSettings>) => {
      return db.siteSettings.update(settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
      toast({
        title: "Success",
        description:
          lastSettingsSaveContextRef.current === "pageHeaders"
            ? "Page headers saved successfully"
            : "Homepage settings saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description:
          lastSettingsSaveContextRef.current === "pageHeaders"
            ? "Failed to save page headers"
            : "Failed to save homepage settings",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (page: StaticPage) => {
    setEditingPage(page);
    setFormData({
      title: page.title || "",
      slug: page.slug || "",
      content: page.content || "",
      metaTitle: page.metaTitle || "",
      metaDescription: page.metaDescription || "",
      published: page.published ?? true,
    });

    if ((page.slug || "").toLowerCase() === "about") {
      const parsed = page.content ? tryParseAboutPageModel(page.content) : null;
      if (!parsed && (page.content || "").trim()) {
        toast({
          title: "About editor",
          description: "Existing About content is not in the structured format. Loading the default template.",
        });
      }
      setAboutForm(normalizeAboutPageModel(parsed || defaultAboutPageModel));
    }
    setIsDialogOpen(true);
  };

  const reorderAboutTeamMembers = (fromId: string, toId: string) => {
    if (!fromId || !toId || fromId === toId) return;

    setAboutForm((prev) => {
      const fromIndex = prev.teamMembers.findIndex((m) => m.id === fromId);
      const toIndex = prev.teamMembers.findIndex((m) => m.id === toId);
      if (fromIndex === -1 || toIndex === -1) return prev;

      const nextMembers = [...prev.teamMembers];
      const [moved] = nextMembers.splice(fromIndex, 1);
      if (!moved) return prev;
      nextMembers.splice(toIndex, 0, moved);

      const normalized = nextMembers.map((m, idx) => ({ ...m, order: idx + 1 }));
      return { ...prev, teamMembers: normalized };
    });
  };

  const updateHomeSection = (id: string, patch: Partial<PageSectionConfig>) => {
    setHomeSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const reorderHomeSections = (fromId: string, toId: string) => {
    if (!fromId || !toId || fromId === toId) return;
    setHomeSections((prev) => {
      const ordered = prev.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const fromIndex = ordered.findIndex((s) => s.id === fromId);
      const toIndex = ordered.findIndex((s) => s.id === toId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const next = [...ordered];
      const [moved] = next.splice(fromIndex, 1);
      if (!moved) return prev;
      next.splice(toIndex, 0, moved);
      return next.map((s, idx) => ({ ...s, order: idx + 1 }));
    });
  };

  const reorderAboutSections = (fromId: string, toId: string) => {
    if (!fromId || !toId || fromId === toId) return;
    setAboutForm((prev) => {
      const ordered = (prev.sections || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const fromIndex = ordered.findIndex((s) => s.id === fromId);
      const toIndex = ordered.findIndex((s) => s.id === toId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const next = [...ordered];
      const [moved] = next.splice(fromIndex, 1);
      if (!moved) return prev;
      next.splice(toIndex, 0, moved);
      const normalized = next.map((s, idx) => ({ ...s, order: idx + 1 }));
      return { ...prev, sections: normalized };
    });
  };

  const handleSave = () => {
    if (!editingPage) return;

    const pageData: Partial<StaticPage> = {
      title: formData.title,
      content: (editingPage.slug || "").toLowerCase() === "about" ? JSON.stringify(aboutForm, null, 2) : formData.content,
      metaTitle: formData.metaTitle,
      metaDescription: formData.metaDescription,
      published: formData.published,
    };

    saveMutation.mutate({
      id: editingPage.id,
      page: pageData,
    });
  };

  const handleSaveHomepageSettings = () => {
    lastSettingsSaveContextRef.current = "homepage";
    saveSettingsMutation.mutate({
      ...heroSettings,
      marqueeItems,
      marqueeSpeed,
      partnersMarqueeItems,
      partnersMarqueeSpeed,
      partnersMarqueeGap,
      partnersMarqueeLogoHeight,
      partnersMarqueeUseMutedBg,
      statsItems,
      ...newsletterContent,
      homeSections,
    });
  };

  const handleSavePageHeaders = () => {
    lastSettingsSaveContextRef.current = "pageHeaders";
    saveSettingsMutation.mutate({
      pageHeroOverrides,
    });
  };

  const addMarqueeItem = () => {
    setMarqueeItems([...marqueeItems, { text: "", icon: "Disc3" }]);
  };

  const removeMarqueeItem = (index: number) => {
    setMarqueeItems(marqueeItems.filter((_, i) => i !== index));
  };

  const updateMarqueeItem = (index: number, field: keyof MarqueeItem, value: string) => {
    const updated = [...marqueeItems];
    const existing = updated[index];
    if (existing) {
      updated[index] = { ...existing, [field]: value };
      setMarqueeItems(updated);
    }
  };

  const addPartnerMarqueeItem = () => {
    setPartnersMarqueeItems((prev) => [...prev, { imageUrl: "", alt: "", href: "" }]);
  };

  const removePartnerMarqueeItem = (index: number) => {
    setPartnersMarqueeItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePartnerMarqueeItem = (index: number, patch: Partial<PartnerMarqueeItem>) => {
    setPartnersMarqueeItems((prev) => {
      const next = [...prev];
      const existing = next[index];
      if (!existing) return prev;
      next[index] = { ...existing, ...patch };
      return next;
    });
  };

  const reorderPartnerMarqueeItems = (fromIndex: number, toIndex: number) => {
    setPartnersMarqueeItems((prev) => {
      if (fromIndex === toIndex) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      if (!moved) return prev;
      next.splice(toIndex, 0, moved);
      return next;
    });
    setOpenPartnerIndex(null);
  };

  const addStatItem = () => {
    setStatsItems([...statsItems, { value: 0, suffix: "", prefix: "", label: "", icon: "Users" }]);
  };

  const removeStatItem = (index: number) => {
    setStatsItems(statsItems.filter((_, i) => i !== index));
  };

  const updateStatItem = (index: number, field: keyof StatItem, value: string | number) => {
    const updated = [...statsItems];
    const existing = updated[index];
    if (existing) {
      updated[index] = { ...existing, [field]: value };
      setStatsItems(updated);
    }
  };

  if (isLoadingSettings) {
    return (
      <AdminLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Content Management</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Content Management</h1>
          <p className="text-muted-foreground">Manage homepage settings and static pages</p>
        </div>

        <Tabs defaultValue="homepage" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-flex bg-muted/40 p-1 rounded-xl border border-border/50">
            <TabsTrigger
              value="homepage"
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm hover:bg-background/60 transition-colors"
            >
              Homepage
            </TabsTrigger>
            <TabsTrigger
              value="pageHeaders"
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm hover:bg-background/60 transition-colors"
            >
              Page Headers
            </TabsTrigger>
            <TabsTrigger
              value="staticPages"
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm hover:bg-background/60 transition-colors"
            >
              Static Pages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="homepage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Homepage Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">Drag to reorder. Toggle to enable/disable.</div>

                <div className="space-y-2">
                  {homeSections
                    .slice()
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((section) => (
                      <Collapsible
                        key={section.id}
                        open={openHomeSectionId === section.id}
                        onOpenChange={(open) => setOpenHomeSectionId(open ? section.id : null)}
                        className={
                          "rounded-lg border border-border/50 bg-muted/10 p-3 space-y-4 " +
                          (dragOverHomeSectionId === section.id ? "ring-2 ring-primary" : "")
                        }
                        onDragOver={(e) => {
                          if (!draggingHomeSectionId) return;
                          e.preventDefault();
                          setDragOverHomeSectionId(section.id);
                        }}
                        onDragLeave={() => {
                          if (dragOverHomeSectionId === section.id) setDragOverHomeSectionId(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const fromId = e.dataTransfer.getData("text/plain") || draggingHomeSectionId;
                          if (!fromId) return;
                          reorderHomeSections(fromId, section.id);
                          setDraggingHomeSectionId(null);
                          setDragOverHomeSectionId(null);
                        }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div
                            className="inline-flex items-center gap-2 text-xs text-muted-foreground select-none"
                            draggable
                            onDragStart={(e) => {
                              setDraggingHomeSectionId(section.id);
                              e.dataTransfer.setData("text/plain", section.id);
                              e.dataTransfer.effectAllowed = "move";
                            }}
                            onDragEnd={() => {
                              setDraggingHomeSectionId(null);
                              setDragOverHomeSectionId(null);
                            }}
                          >
                            <GripVertical className="h-4 w-4" />
                            Drag
                          </div>

                          <CollapsibleTrigger asChild>
                            <button type="button" className="flex-1 flex items-center gap-2 text-left">
                              {(() => {
                                const meta = homeSectionMeta[section.id] || { label: section.id, Icon: FileText };
                                const Icon = meta.Icon;
                                const isOpen = openHomeSectionId === section.id;
                                return (
                                  <>
                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium text-sm">{meta.label}</span>
                                    <span className="text-xs text-muted-foreground">#{section.order}</span>
                                    <ChevronDown
                                      className={
                                        "h-4 w-4 ml-auto text-muted-foreground transition-transform duration-200 " +
                                        (isOpen ? "rotate-180" : "")
                                      }
                                    />
                                  </>
                                );
                              })()}
                            </button>
                          </CollapsibleTrigger>

                          <div className="flex items-center gap-3">
                            <Switch
                              checked={section.enabled}
                              onCheckedChange={(checked) => updateHomeSection(section.id, { enabled: checked })}
                            />
                            <span className="text-xs text-muted-foreground">Enabled</span>
                          </div>
                        </div>

                        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                          <div className="pt-4 space-y-4">
                            {section.id === "hero" ? (
                              <div className="space-y-4">
                            <div>
                              <Label>Hero Tag</Label>
                              <Input
                                value={heroSettings.heroTag}
                                onChange={(e) => setHeroSettings({ ...heroSettings, heroTag: e.target.value })}
                                placeholder="New Release"
                              />
                            </div>
                            <div>
                              <Label>Title</Label>
                              <Input
                                value={heroSettings.heroTitle}
                                onChange={(e) => setHeroSettings({ ...heroSettings, heroTitle: e.target.value })}
                                placeholder="GROUPTHERAPY"
                              />
                            </div>
                            <div>
                              <Label>Subtitle</Label>
                              <Textarea
                                value={heroSettings.heroSubtitle}
                                onChange={(e) => setHeroSettings({ ...heroSettings, heroSubtitle: e.target.value })}
                                placeholder="The sound of tomorrow, today..."
                                rows={2}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Background Type</Label>
                              <Select
                                value={heroSettings.heroBackgroundType}
                                onValueChange={(value: "image" | "video") => setHeroSettings({ ...heroSettings, heroBackgroundType: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="image">Image</SelectItem>
                                  <SelectItem value="video">Video</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {heroSettings.heroBackgroundType === "image" ? (
                              <div className="space-y-2">
                                <Label>Background Image</Label>
                                <ImageUpload
                                  onUploadComplete={(url) => setHeroSettings({ ...heroSettings, heroBackgroundImage: url })}
                                  currentImage={heroSettings.heroBackgroundImage}
                                  folder="hero"
                                  aspectRatio="banner"
                                />
                                <Input
                                  value={heroSettings.heroBackgroundImage}
                                  onChange={(e) => setHeroSettings({ ...heroSettings, heroBackgroundImage: e.target.value })}
                                  placeholder="Or paste image URL"
                                />
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Label>Background Video</Label>
                                <VideoUpload
                                  onUploadComplete={(url) => setHeroSettings({ ...heroSettings, heroBackgroundVideo: url })}
                                  currentVideo={heroSettings.heroBackgroundVideo}
                                  folder="hero"
                                />
                                <Input
                                  value={heroSettings.heroBackgroundVideo}
                                  onChange={(e) => setHeroSettings({ ...heroSettings, heroBackgroundVideo: e.target.value })}
                                  placeholder="Or paste video URL"
                                />
                              </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <Label>CTA Text</Label>
                                <Input
                                  value={heroSettings.heroCtaText}
                                  onChange={(e) => setHeroSettings({ ...heroSettings, heroCtaText: e.target.value })}
                                  placeholder="Explore Releases"
                                />
                              </div>
                              <div>
                                <Label>CTA Link</Label>
                                <Input
                                  value={heroSettings.heroCtaLink}
                                  onChange={(e) => setHeroSettings({ ...heroSettings, heroCtaLink: e.target.value })}
                                  placeholder="/releases"
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-3 pt-1">
                              <Switch
                                checked={heroSettings.showHeroRadio}
                                onCheckedChange={(checked) => setHeroSettings({ ...heroSettings, showHeroRadio: checked })}
                              />
                              <Label>Show Radio Button</Label>
                            </div>
                          </div>
                            ) : null}

                            {section.id === "partners" ? (
                              <div className="space-y-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-center justify-between gap-3">
                                <div className="space-y-0.5">
                                  <div className="font-medium text-sm">Partners</div>
                                  <div className="text-xs text-muted-foreground">
                                    {partnersMarqueeItems.filter((p) => (p.imageUrl || "").trim().length > 0).length} logos
                                  </div>
                                </div>

                                <Button variant="outline" size="sm" onClick={addPartnerMarqueeItem}>
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add
                                </Button>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/10 px-2 py-1">
                                  <Switch
                                    checked={partnersMarqueeUseMutedBg}
                                    onCheckedChange={(checked) => setPartnersMarqueeUseMutedBg(checked)}
                                  />
                                  <span className="text-xs text-muted-foreground">Muted BG</span>
                                </div>

                                <div className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/10 px-2 py-1">
                                  <span className="text-xs text-muted-foreground">Size</span>
                                  <Input
                                    type="number"
                                    value={partnersMarqueeLogoHeight}
                                    onChange={(e) => setPartnersMarqueeLogoHeight(parseInt(e.target.value) || 32)}
                                    className="w-20 h-8"
                                    min={18}
                                    max={56}
                                  />
                                  <span className="text-xs text-muted-foreground">px</span>
                                </div>

                                <div className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/10 px-2 py-1">
                                  <span className="text-xs text-muted-foreground">Gap</span>
                                  <Input
                                    type="number"
                                    value={partnersMarqueeGap}
                                    onChange={(e) => setPartnersMarqueeGap(parseInt(e.target.value) || 48)}
                                    className="w-20 h-8"
                                    min={8}
                                    max={160}
                                  />
                                  <span className="text-xs text-muted-foreground">px</span>
                                </div>

                                <div className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/10 px-2 py-1">
                                  <span className="text-xs text-muted-foreground">Speed</span>
                                  <Input
                                    type="number"
                                    value={partnersMarqueeSpeed}
                                    onChange={(e) => setPartnersMarqueeSpeed(parseInt(e.target.value) || 40)}
                                    className="w-20 h-8"
                                    min={10}
                                    max={100}
                                  />
                                  <span className="text-xs text-muted-foreground">s</span>
                                </div>
                              </div>
                            </div>

                            <div
                              className={cn(
                                "relative overflow-hidden rounded-md border border-border/50",
                                partnersMarqueeUseMutedBg ? "bg-muted/30" : "bg-background"
                              )}
                              style={{
                                WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
                                maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
                              }}
                            >
                              <div className="overflow-x-auto">
                                <div
                                  className="flex w-max items-center px-6 py-4"
                                  style={{ gap: Math.max(8, Math.min(160, partnersMarqueeGap || 48)) }}
                                >
                                  {Array.from({ length: 2 }, () =>
                                    partnersMarqueeItems
                                      .filter((p) => (p.imageUrl || "").trim().length > 0)
                                      .map((p, i) => (
                                        <img
                                          key={`${p.imageUrl}-${i}`}
                                          src={resolveMediaUrl(p.imageUrl, "thumb")}
                                          alt={p.alt || "Partner logo"}
                                          className="w-auto object-contain opacity-70 grayscale brightness-0 dark:invert"
                                          style={{ height: Math.max(18, Math.min(56, partnersMarqueeLogoHeight || 32)) }}
                                          loading="lazy"
                                        />
                                      ))
                                  ).flat()}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              {partnersMarqueeItems.map((item, index) => {
                                const isOpen = openPartnerIndex === index;
                                return (
                                  <div
                                    key={index}
                                    className={cn(
                                      "rounded-md border border-border/50 bg-muted/10",
                                      dragOverPartnerIndex === index ? "ring-2 ring-primary" : ""
                                    )}
                                    onDragOver={(e) => {
                                      if (draggingPartnerIndex === null) return;
                                      e.preventDefault();
                                      setDragOverPartnerIndex(index);
                                    }}
                                    onDragLeave={() => {
                                      if (dragOverPartnerIndex === index) setDragOverPartnerIndex(null);
                                    }}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      if (draggingPartnerIndex === null) return;
                                      reorderPartnerMarqueeItems(draggingPartnerIndex, index);
                                      setDraggingPartnerIndex(null);
                                      setDragOverPartnerIndex(null);
                                    }}
                                  >
                                    <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-3">
                                      <div
                                        className="inline-flex items-center gap-2 text-xs text-muted-foreground select-none self-start sm:self-auto"
                                        draggable
                                        onDragStart={(e) => {
                                          setDraggingPartnerIndex(index);
                                          e.dataTransfer.setData("text/plain", String(index));
                                          e.dataTransfer.effectAllowed = "move";
                                        }}
                                        onDragEnd={() => {
                                          setDraggingPartnerIndex(null);
                                          setDragOverPartnerIndex(null);
                                        }}
                                      >
                                        <GripVertical className="h-4 w-4" />
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => setOpenPartnerIndex((prev) => (prev === index ? null : index))}
                                        className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 text-left"
                                      >
                                        <div className="h-10 w-24 sm:w-28 shrink-0 rounded-md border bg-background flex items-center justify-center px-3">
                                          {item.imageUrl ? (
                                            <img
                                              src={resolveMediaUrl(item.imageUrl, "thumb")}
                                              alt={item.alt || "Partner logo"}
                                              className="h-6 w-auto object-contain opacity-70 grayscale brightness-0 dark:invert"
                                              loading="lazy"
                                            />
                                          ) : (
                                            <span className="text-xs text-muted-foreground">No logo</span>
                                          )}
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 flex-1 w-full">
                                          <Input
                                            value={item.alt || ""}
                                            onChange={(e) => updatePartnerMarqueeItem(index, { alt: e.target.value })}
                                            placeholder="Alt (partner name)"
                                            className="h-8"
                                          />
                                          <Input
                                            value={item.href || ""}
                                            onChange={(e) => updatePartnerMarqueeItem(index, { href: e.target.value })}
                                            placeholder="Link (optional)"
                                            className="h-8"
                                          />
                                        </div>
                                      </button>

                                      <div className="flex items-center gap-1 self-end sm:self-auto">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => setOpenPartnerIndex((prev) => (prev === index ? null : index))}
                                          className="h-8 w-8"
                                        >
                                          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-180" : "")} />
                                        </Button>

                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => removePartnerMarqueeItem(index)}
                                          className="text-muted-foreground hover:text-destructive h-8 w-8"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>

                                    {isOpen ? (
                                      <div className="border-t border-border/50 p-3 space-y-2">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                          <div className="space-y-2">
                                            <Label>Logo</Label>
                                            <ImageUpload
                                              currentImage={item.imageUrl}
                                              onUploadComplete={(url) => updatePartnerMarqueeItem(index, { imageUrl: url })}
                                              folder="partners"
                                              aspectRatio="banner"
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <Label>Logo URL</Label>
                                            <Input
                                              value={item.imageUrl}
                                              onChange={(e) => updatePartnerMarqueeItem(index, { imageUrl: e.target.value })}
                                              placeholder="Paste image URL"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                            ) : null}

                            {section.id === "marquee" ? (
                              <div className="space-y-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="font-medium text-sm">Items</div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Speed:</span>
                                <Input
                                  type="number"
                                  value={marqueeSpeed}
                                  onChange={(e) => setMarqueeSpeed(parseInt(e.target.value) || 40)}
                                  className="w-20 h-8"
                                  min={10}
                                  max={100}
                                />
                                <span>s</span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              {marqueeItems.map((item, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <Select value={item.icon} onValueChange={(value) => updateMarqueeItem(index, "icon", value)}>
                                    <SelectTrigger className="w-28">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {iconOptions.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    value={item.text}
                                    onChange={(e) => updateMarqueeItem(index, "text", e.target.value)}
                                    placeholder="Marquee text..."
                                    className="flex-1"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeMarqueeItem(index)}
                                    className="text-muted-foreground hover:text-destructive h-8 w-8"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button variant="outline" size="sm" onClick={addMarqueeItem}>
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                              </Button>
                            </div>
                          </div>
                            ) : null}

                            {section.id === "stats" ? (
                              <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <Label>Title</Label>
                                <Input
                                  value={section.title || ""}
                                  onChange={(e) => updateHomeSection(section.id, { title: e.target.value })}
                                  placeholder="Growing the future of"
                                />
                              </div>
                              <div>
                                <Label>Highlight</Label>
                                <Input
                                  value={section.highlight || ""}
                                  onChange={(e) => updateHomeSection(section.id, { highlight: e.target.value })}
                                  placeholder="music"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <Label>Description</Label>
                                <Textarea
                                  rows={2}
                                  value={section.description || ""}
                                  onChange={(e) => updateHomeSection(section.id, { description: e.target.value })}
                                  placeholder="Our numbers tell the story..."
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="font-medium text-sm">Stats Items</div>
                              {statsItems.map((item, index) => (
                                <div key={index} className="rounded-lg border border-border/50 bg-muted/10 p-3 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Select value={item.icon} onValueChange={(value) => updateStatItem(index, "icon", value)}>
                                      <SelectTrigger className="w-full sm:w-28">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {iconOptions.map((opt) => (
                                          <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeStatItem(index)}
                                      className="ml-auto text-muted-foreground hover:text-destructive h-8 w-8"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>

                                  <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center">
                                    <Input
                                      value={item.prefix}
                                      onChange={(e) => updateStatItem(index, "prefix", e.target.value)}
                                      placeholder="$"
                                      className="w-full sm:w-12"
                                    />
                                    <Input
                                      type="number"
                                      value={item.value}
                                      onChange={(e) => updateStatItem(index, "value", parseInt(e.target.value) || 0)}
                                      placeholder="50"
                                      className="w-full sm:w-20"
                                    />
                                    <Input
                                      value={item.suffix}
                                      onChange={(e) => updateStatItem(index, "suffix", e.target.value)}
                                      placeholder="+"
                                      className="w-full sm:w-14"
                                    />
                                  </div>

                                  <Input
                                    value={item.label}
                                    onChange={(e) => updateStatItem(index, "label", e.target.value)}
                                    placeholder="Label"
                                    className="w-full"
                                  />
                                </div>
                              ))}
                              <Button variant="outline" size="sm" onClick={addStatItem}>
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                              </Button>
                            </div>
                          </div>
                            ) : null}

                            {section.id === "newsletter" ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="sm:col-span-2">
                              <Label>Title</Label>
                              <Input
                                value={newsletterContent.newsletterTitle}
                                onChange={(e) => setNewsletterContent({ ...newsletterContent, newsletterTitle: e.target.value })}
                                placeholder="Join the community"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <Label>Description</Label>
                              <Textarea
                                rows={2}
                                value={newsletterContent.newsletterDescription}
                                onChange={(e) =>
                                  setNewsletterContent({ ...newsletterContent, newsletterDescription: e.target.value })
                                }
                                placeholder="Get exclusive releases..."
                              />
                            </div>
                            <div>
                              <Label>Button Text</Label>
                              <Input
                                value={newsletterContent.newsletterButtonText}
                                onChange={(e) => setNewsletterContent({ ...newsletterContent, newsletterButtonText: e.target.value })}
                                placeholder="Subscribe"
                              />
                            </div>
                            <div>
                              <Label>Disclaimer</Label>
                              <Input
                                value={newsletterContent.newsletterDisclaimer}
                                onChange={(e) => setNewsletterContent({ ...newsletterContent, newsletterDisclaimer: e.target.value })}
                                placeholder="No spam. Unsubscribe anytime."
                              />
                            </div>
                          </div>
                            ) : null}

                            {section.id === "testimonials" ? (
                              <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="font-medium text-sm">Testimonials</div>
                              <Button type="button" size="sm" onClick={openAddTestimonialDialog}>
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                              </Button>
                            </div>

                            {(testimonials || []).length === 0 ? (
                              <div className="text-sm text-muted-foreground">No testimonials yet.</div>
                            ) : (
                              <div className="grid gap-2">
                                {testimonials
                                  .slice()
                                  .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
                                  .map((t) => (
                                    <div key={t.id} className={"rounded-lg border border-border/50 bg-background/40 p-3 " + (!t.published ? "opacity-60" : "")}
                                    >
                                      <div className="flex items-start gap-3">
                                        <Avatar className="h-10 w-10 flex-shrink-0">
                                          <AvatarImage src={resolveMediaUrl(t.avatarUrl, "thumb")} alt={t.name} />
                                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                                            {t.name
                                              .split(" ")
                                              .filter(Boolean)
                                              .map((n) => n.charAt(0))
                                              .join("")}
                                          </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <div className="font-medium text-sm truncate">{t.name}</div>
                                            <Badge variant={t.published ? "default" : "secondary"}>
                                              {t.published ? "Published" : "Draft"}
                                            </Badge>
                                          </div>
                                          <div className="text-xs text-muted-foreground truncate">{t.role}</div>
                                          <div className="mt-2 text-xs line-clamp-2">"{t.content}"</div>
                                          <div className="flex items-center gap-0.5 mt-2">
                                            {[...Array(t.rating)].map((_, i) => (
                                              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                            ))}
                                            {[...Array(5 - t.rating)].map((_, i) => (
                                              <Star key={i} className="w-3.5 h-3.5 text-muted-foreground/30" />
                                            ))}
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                              toggleTestimonialPublishedMutation.mutate({
                                                id: t.id,
                                                published: !t.published,
                                              })
                                            }
                                            title={t.published ? "Unpublish" : "Publish"}
                                          >
                                            {t.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                          </Button>
                                          <Button variant="outline" size="icon" onClick={() => handleEditTestimonial(t)}>
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => {
                                              if (confirm("Are you sure you want to delete this testimonial?")) {
                                                deleteTestimonialMutation.mutate(t.id);
                                              }
                                            }}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                            ) : null}

                            {[
                              "releases",
                              "artists",
                              "events",
                              "playlists",
                              "news",
                              "videos",
                              "awards",
                              "newsCta",
                            ].includes(section.id) ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {section.id === "awards" ? (
                              <div className="sm:col-span-2">
                                <Label>Tag</Label>
                                <Input
                                  value={section.tag || ""}
                                  onChange={(e) => updateHomeSection(section.id, { tag: e.target.value })}
                                  placeholder="Therapy Awards"
                                />
                              </div>
                            ) : null}

                            <div>
                              <Label>Title</Label>
                              <Input
                                value={section.title || ""}
                                onChange={(e) => updateHomeSection(section.id, { title: e.target.value })}
                                placeholder="Title"
                              />
                            </div>
                            <div>
                              <Label>Highlight</Label>
                              <Input
                                value={section.highlight || ""}
                                onChange={(e) => updateHomeSection(section.id, { highlight: e.target.value })}
                                placeholder="Highlight"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <Label>Description</Label>
                              <Textarea
                                rows={2}
                                value={section.description || ""}
                                onChange={(e) => updateHomeSection(section.id, { description: e.target.value })}
                                placeholder="Description"
                              />
                            </div>

                            {[
                              "releases",
                              "artists",
                              "playlists",
                              "news",
                              "videos",
                            ].includes(section.id) ? (
                              <>
                                <div className="flex items-center gap-3">
                                  <Switch
                                    checked={section.carouselEnabled ?? true}
                                    onCheckedChange={(checked) =>
                                      updateHomeSection(section.id, { carouselEnabled: checked })
                                    }
                                  />
                                  <Label>Carousel autoplay</Label>
                                </div>
                                <div>
                                  <Label>Carousel speed (ms)</Label>
                                  <Input
                                    type="number"
                                    value={section.carouselIntervalMs ?? 6000}
                                    onChange={(e) =>
                                      updateHomeSection(section.id, {
                                        carouselIntervalMs: Math.max(250, parseInt(e.target.value) || 0),
                                      })
                                    }
                                    min={250}
                                    step={250}
                                    disabled={(section.carouselEnabled ?? true) === false}
                                  />
                                </div>
                              </>
                            ) : null}

                            {[
                              "releases",
                              "artists",
                              "events",
                              "playlists",
                              "news",
                              "videos",
                              "awards",
                              "newsCta",
                            ].includes(section.id) ? (
                              <>
                                <div>
                                  <Label>Action label</Label>
                                  <Input
                                    value={section.actionLabel || ""}
                                    onChange={(e) => updateHomeSection(section.id, { actionLabel: e.target.value })}
                                    placeholder="Button text"
                                  />
                                </div>
                                <div>
                                  <Label>Action href</Label>
                                  <Input
                                    value={section.actionHref || ""}
                                    onChange={(e) => updateHomeSection(section.id, { actionHref: e.target.value })}
                                    placeholder="/path"
                                  />
                                </div>
                              </>
                            ) : null}
                          </div>
                            ) : null}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                </div>

                <div className="flex items-center justify-between">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="bg-red-500 hover:bg-red-700 hover:text-white" type="button" variant="outline">
                        ⚠ Set Default content
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset homepage sections?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will overwrite your current Homepage Sections order, enabled toggles, and section copy with the template defaults.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => setHomeSections(defaultHomeSections)}>
                          Yes, reset
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="sticky bottom-0 z-30 -mx-6 px-6 py-4 bg-background/80 backdrop-blur border-t border-border/50">
                  <div className="flex justify-end">
                    <Button onClick={handleSaveHomepageSettings} disabled={saveSettingsMutation.isPending}>
                      {saveSettingsMutation.isPending ? "Saving..." : "Save Homepage Settings"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pageHeaders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Page Headers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">Override page hero titles/subtitles without editing code.</div>

                <div className="space-y-2">
                  {heroOverridePages.map((p) => {
                    const current = pageHeroOverrides[p.key] || {};

                    const meta = pageHeaderMeta[p.key] || { label: p.label, Icon: Globe };
                    const Icon = meta.Icon;

                    return (
                      <Collapsible
                        key={p.key}
                        open={openPageHeaderKey === p.key}
                        onOpenChange={(open) => setOpenPageHeaderKey(open ? p.key : null)}
                        className="rounded-lg border border-border/50 bg-muted/10 p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <CollapsibleTrigger asChild>
                            <button type="button" className="flex-1 flex items-center gap-2 text-left">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-sm">{meta.label}</span>
                              <span className="text-xs text-muted-foreground">{p.key}</span>
                              <ChevronDown
                                className={
                                  "h-4 w-4 ml-auto text-muted-foreground transition-transform duration-200 " +
                                  (openPageHeaderKey === p.key ? "rotate-180" : "")
                                }
                              />
                            </button>
                          </CollapsibleTrigger>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPageHeroOverrides((prev) => {
                                const next = { ...prev };
                                delete next[p.key];
                                return next;
                              });
                            }}
                          >
                            Reset
                          </Button>
                        </div>

                        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                          <div className="pt-4 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <Label>Title</Label>
                                <Input
                                  value={current.title || ""}
                                  onChange={(e) =>
                                    setPageHeroOverrides((prev) => ({
                                      ...prev,
                                      [p.key]: { ...(prev[p.key] || {}), title: e.target.value },
                                    }))
                                  }
                                  placeholder="Page title"
                                />
                              </div>
                              <div>
                                <Label>Subtitle</Label>
                                <Input
                                  value={current.subtitle || ""}
                                  onChange={(e) =>
                                    setPageHeroOverrides((prev) => ({
                                      ...prev,
                                      [p.key]: { ...(prev[p.key] || {}), subtitle: e.target.value },
                                    }))
                                  }
                                  placeholder="Page subtitle"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Background Image</Label>
                              <ImageUpload
                                currentImage={current.backgroundImage || ""}
                                onUploadComplete={(url) =>
                                  setPageHeroOverrides((prev) => ({
                                    ...prev,
                                    [p.key]: { ...(prev[p.key] || {}), backgroundImage: url },
                                  }))
                                }
                                folder="page-headers"
                                aspectRatio="banner"
                              />
                              <Input
                                value={current.backgroundImage || ""}
                                onChange={(e) =>
                                  setPageHeroOverrides((prev) => ({
                                    ...prev,
                                    [p.key]: { ...(prev[p.key] || {}), backgroundImage: e.target.value },
                                  }))
                                }
                                placeholder="Or paste image URL"
                              />
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>

                <div className="sticky bottom-0 z-30 -mx-6 px-6 py-4 bg-background/80 backdrop-blur border-t border-border/50">
                  <div className="flex justify-end">
                    <Button onClick={handleSavePageHeaders} disabled={saveSettingsMutation.isPending}>
                      {saveSettingsMutation.isPending ? "Saving..." : "Save Page Headers"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staticPages" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Static Pages</h2>
              <p className="text-muted-foreground mb-4">Manage legal and informational pages</p>
            </div>

            <div className="grid gap-4">
              {pages.map((page) => (
                <Card
                  key={page.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleEdit(page)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{page.title}</h3>
                          {!page.published && <Badge variant="secondary">Draft</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">/{page.slug}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Last updated: {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString() : "Never"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/${page.slug}`}>
                          <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(page);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {pages.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">No static pages found. Run the database schema to create default pages.</div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-3xl sm:max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <DialogHeader>
              <DialogTitle>Edit {editingPage?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="slug">URL Slug (read-only)</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              {(editingPage?.slug || formData.slug).toLowerCase() === "about" ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Sections</Label>
                    <div className="space-y-2">
                      {aboutForm.sections
                        .slice()
                        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                        .map((section) => (
                          <div
                            key={section.id}
                            className={`flex items-center justify-between gap-3 rounded-md border p-3 ${
                              dragOverAboutSectionId === section.id ? "ring-2 ring-primary" : ""
                            }`}
                            onDragOver={(e) => {
                              if (!draggingAboutSectionId) return;
                              e.preventDefault();
                              setDragOverAboutSectionId(section.id);
                            }}
                            onDragLeave={() => {
                              if (dragOverAboutSectionId === section.id) setDragOverAboutSectionId(null);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              const fromId = e.dataTransfer.getData("text/plain") || draggingAboutSectionId;
                              if (!fromId || !section.id) return;
                              reorderAboutSections(fromId, section.id);
                              setDraggingAboutSectionId(null);
                              setDragOverAboutSectionId(null);
                            }}
                          >
                            <div
                              className="inline-flex items-center gap-2 text-xs text-muted-foreground select-none"
                              draggable
                              onDragStart={(e) => {
                                setDraggingAboutSectionId(section.id);
                                e.dataTransfer.setData("text/plain", section.id);
                                e.dataTransfer.effectAllowed = "move";
                              }}
                              onDragEnd={() => {
                                setDraggingAboutSectionId(null);
                                setDragOverAboutSectionId(null);
                              }}
                            >
                              <GripVertical className="h-4 w-4" />
                              Drag
                            </div>

                            <div className="flex-1 text-sm font-medium">{section.id}</div>

                            <div className="flex items-center gap-3">
                              <Switch
                                checked={section.enabled}
                                onCheckedChange={(checked) =>
                                  setAboutForm({
                                    ...aboutForm,
                                    sections: aboutForm.sections.map((s) =>
                                      s.id === section.id ? { ...s, enabled: checked } : s
                                    ),
                                  })
                                }
                              />
                              <span className="text-xs text-muted-foreground">Enabled</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Hero</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        value={aboutForm.heroTitle}
                        onChange={(e) => setAboutForm({ ...aboutForm, heroTitle: e.target.value })}
                        placeholder="Hero title"
                      />
                      <Input
                        value={aboutForm.heroSubtitle}
                        onChange={(e) => setAboutForm({ ...aboutForm, heroSubtitle: e.target.value })}
                        placeholder="Hero subtitle"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Mission</Label>
                    <Input
                      value={aboutForm.missionHeading}
                      onChange={(e) => setAboutForm({ ...aboutForm, missionHeading: e.target.value })}
                      placeholder="Heading"
                    />
                    <Textarea
                      rows={4}
                      value={aboutForm.missionText}
                      onChange={(e) => setAboutForm({ ...aboutForm, missionText: e.target.value })}
                      placeholder="Mission text"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Stats</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setAboutForm({
                            ...aboutForm,
                            stats: [...aboutForm.stats, { value: "", label: "" }],
                          })
                        }
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {aboutForm.stats.map((s, idx) => (
                        <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-start">
                          <Input
                            value={s.value}
                            onChange={(e) => {
                              const next = [...aboutForm.stats];
                              const existing = next[idx];
                              if (!existing) return;
                              next[idx] = { ...existing, value: e.target.value };
                              setAboutForm({ ...aboutForm, stats: next });
                            }}
                            placeholder="Value (e.g. 50+)"
                          />
                          <Input
                            value={s.label}
                            onChange={(e) => {
                              const next = [...aboutForm.stats];
                              const existing = next[idx];
                              if (!existing) return;
                              next[idx] = { ...existing, label: e.target.value };
                              setAboutForm({ ...aboutForm, stats: next });
                            }}
                            placeholder="Label"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive h-10 w-10"
                            onClick={() =>
                              setAboutForm({
                                ...aboutForm,
                                stats: aboutForm.stats.filter((_, i) => i !== idx),
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Timeline</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setAboutForm({
                            ...aboutForm,
                            milestones: [...aboutForm.milestones, { year: "", title: "", description: "" }],
                          })
                        }
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    <Input
                      value={aboutForm.timelineHeading}
                      onChange={(e) => setAboutForm({ ...aboutForm, timelineHeading: e.target.value })}
                      placeholder="Timeline heading"
                    />
                    <div className="space-y-3">
                      {aboutForm.milestones.map((m, idx) => (
                        <div key={idx} className="rounded-md border p-3 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <Input
                              value={m.year}
                              onChange={(e) => {
                                const next = [...aboutForm.milestones];
                                const existing = next[idx];
                                if (!existing) return;
                                next[idx] = { ...existing, year: e.target.value };
                                setAboutForm({ ...aboutForm, milestones: next });
                              }}
                              placeholder="Year"
                            />
                            <Input
                              className="sm:col-span-2"
                              value={m.title}
                              onChange={(e) => {
                                const next = [...aboutForm.milestones];
                                const existing = next[idx];
                                if (!existing) return;
                                next[idx] = { ...existing, title: e.target.value };
                                setAboutForm({ ...aboutForm, milestones: next });
                              }}
                              placeholder="Title"
                            />
                          </div>
                          <Textarea
                            rows={2}
                            value={m.description}
                            onChange={(e) => {
                              const next = [...aboutForm.milestones];
                              const existing = next[idx];
                              if (!existing) return;
                              next[idx] = { ...existing, description: e.target.value };
                              setAboutForm({ ...aboutForm, milestones: next });
                            }}
                            placeholder="Description"
                          />
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() =>
                                setAboutForm({
                                  ...aboutForm,
                                  milestones: aboutForm.milestones.filter((_, i) => i !== idx),
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Team</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setAboutForm({
                            ...aboutForm,
                            teamMembers: [
                              ...aboutForm.teamMembers,
                              { id: String(Date.now()), name: "", role: "", bio: "", imageUrl: "", order: aboutForm.teamMembers.length + 1 },
                            ],
                          })
                        }
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    <Input
                      value={aboutForm.teamHeading}
                      onChange={(e) => setAboutForm({ ...aboutForm, teamHeading: e.target.value })}
                      placeholder="Team heading"
                    />
                    <div className="space-y-3">
                      {aboutForm.teamMembers.map((tm, idx) => (
                        <div
                          key={tm.id || String(idx)}
                          className={`rounded-md border p-3 space-y-3 ${dragOverTeamMemberId === tm.id ? "ring-2 ring-primary" : ""}`}
                          onDragOver={(e) => {
                            if (!draggingTeamMemberId) return;
                            e.preventDefault();
                            setDragOverTeamMemberId(tm.id);
                          }}
                          onDragLeave={() => {
                            if (dragOverTeamMemberId === tm.id) setDragOverTeamMemberId(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const fromId = e.dataTransfer.getData("text/plain") || draggingTeamMemberId;
                            if (!fromId || !tm.id) return;
                            reorderAboutTeamMembers(fromId, tm.id);
                            setDraggingTeamMemberId(null);
                            setDragOverTeamMemberId(null);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div
                              className="inline-flex items-center gap-2 text-xs text-muted-foreground select-none"
                              draggable
                              onDragStart={(e) => {
                                if (!tm.id) return;
                                setDraggingTeamMemberId(tm.id);
                                e.dataTransfer.setData("text/plain", tm.id);
                                e.dataTransfer.effectAllowed = "move";
                              }}
                              onDragEnd={() => {
                                setDraggingTeamMemberId(null);
                                setDragOverTeamMemberId(null);
                              }}
                            >
                              <GripVertical className="h-4 w-4" />
                              Drag to reorder
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Input
                              value={tm.name}
                              onChange={(e) => {
                                const next = [...aboutForm.teamMembers];
                                const existing = next[idx];
                                if (!existing) return;
                                next[idx] = { ...existing, name: e.target.value };
                                setAboutForm({ ...aboutForm, teamMembers: next });
                              }}
                              placeholder="Name"
                            />
                            <Input
                              value={tm.role}
                              onChange={(e) => {
                                const next = [...aboutForm.teamMembers];
                                const existing = next[idx];
                                if (!existing) return;
                                next[idx] = { ...existing, role: e.target.value };
                                setAboutForm({ ...aboutForm, teamMembers: next });
                              }}
                              placeholder="Role"
                            />
                          </div>

                          <Textarea
                            rows={2}
                            value={tm.bio || ""}
                            onChange={(e) => {
                              const next = [...aboutForm.teamMembers];
                              const existing = next[idx];
                              if (!existing) return;
                              next[idx] = { ...existing, bio: e.target.value };
                              setAboutForm({ ...aboutForm, teamMembers: next });
                            }}
                            placeholder="Bio"
                          />

                          <div className="space-y-2">
                            <Label>Photo</Label>
                            <ImageUpload
                              currentImage={tm.imageUrl || ""}
                              onUploadComplete={(url) => {
                                const next = [...aboutForm.teamMembers];
                                const existing = next[idx];
                                if (!existing) return;
                                next[idx] = { ...existing, imageUrl: url };
                                setAboutForm({ ...aboutForm, teamMembers: next });
                              }}
                              bucket="media"
                              folder="about/team"
                              aspectRatio="square"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                            <Input
                              value={String(tm.order ?? "")}
                              onChange={(e) => {
                                const next = [...aboutForm.teamMembers];
                                const existing = next[idx];
                                if (!existing) return;
                                next[idx] = { ...existing, order: parseInt(e.target.value) || 0 };
                                setAboutForm({ ...aboutForm, teamMembers: next });
                              }}
                              placeholder="Order"
                            />
                            <Input
                              className="sm:col-span-3"
                              value={tm.socialLinks?.linkedin || ""}
                              onChange={(e) => {
                                const next = [...aboutForm.teamMembers];
                                const existing = next[idx];
                                if (!existing) return;
                                next[idx] = {
                                  ...existing,
                                  socialLinks: { ...(existing.socialLinks || {}), linkedin: e.target.value },
                                };
                                setAboutForm({ ...aboutForm, teamMembers: next });
                              }}
                              placeholder="LinkedIn URL"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Input
                              value={tm.socialLinks?.twitter || ""}
                              onChange={(e) => {
                                const next = [...aboutForm.teamMembers];
                                const existing = next[idx];
                                if (!existing) return;
                                next[idx] = {
                                  ...existing,
                                  socialLinks: { ...(existing.socialLinks || {}), twitter: e.target.value },
                                };
                                setAboutForm({ ...aboutForm, teamMembers: next });
                              }}
                              placeholder="X/Twitter URL"
                            />
                            <Input
                              value={tm.socialLinks?.instagram || ""}
                              onChange={(e) => {
                                const next = [...aboutForm.teamMembers];
                                const existing = next[idx];
                                if (!existing) return;
                                next[idx] = {
                                  ...existing,
                                  socialLinks: { ...(existing.socialLinks || {}), instagram: e.target.value },
                                };
                                setAboutForm({ ...aboutForm, teamMembers: next });
                              }}
                              placeholder="Instagram URL"
                            />
                          </div>

                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() =>
                                setAboutForm({
                                  ...aboutForm,
                                  teamMembers: aboutForm.teamMembers.filter((_, i) => i !== idx),
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>CTA</Label>
                    <Input
                      value={aboutForm.ctaHeading}
                      onChange={(e) => setAboutForm({ ...aboutForm, ctaHeading: e.target.value })}
                      placeholder="CTA heading"
                    />
                    <Textarea
                      rows={2}
                      value={aboutForm.ctaDescription}
                      onChange={(e) => setAboutForm({ ...aboutForm, ctaDescription: e.target.value })}
                      placeholder="CTA description"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input
                        value={aboutForm.ctaPrimaryText}
                        onChange={(e) => setAboutForm({ ...aboutForm, ctaPrimaryText: e.target.value })}
                        placeholder="Primary button text"
                      />
                      <Input
                        value={aboutForm.ctaSecondaryText}
                        onChange={(e) => setAboutForm({ ...aboutForm, ctaSecondaryText: e.target.value })}
                        placeholder="Secondary button text"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAboutForm(defaultAboutPageModel)}
                    >
                      Load Template
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <Label>Content (Markdown)</Label>
                  <div className="mt-2">
                    <MarkdownEditor
                      value={formData.content}
                      onChange={(value) => setFormData({ ...formData, content: value })}
                      placeholder="Enter content using Markdown..."
                      minHeight="350px"
                    />
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="metaTitle">SEO Title (Optional)</Label>
                <Input
                  id="metaTitle"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                  placeholder="Page title for search engines"
                />
              </div>
              <div>
                <Label htmlFor="metaDescription">SEO Description (Optional)</Label>
                <Textarea
                  id="metaDescription"
                  rows={2}
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  placeholder="Brief description for search engines"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                />
                <Label htmlFor="published">Published</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isTestimonialDialogOpen} onOpenChange={setIsTestimonialDialogOpen}>
          <DialogContent className="sm:max-w-2xl sm:max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <DialogHeader>
              <DialogTitle>{editingTestimonial ? "Edit Testimonial" : "Add New Testimonial"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="testimonialName">Name</Label>
                  <Input
                    id="testimonialName"
                    placeholder="John Doe"
                    value={testimonialFormData.name}
                    onChange={(e) => setTestimonialFormData({ ...testimonialFormData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="testimonialRole">Role / Title</Label>
                  <Input
                    id="testimonialRole"
                    placeholder="CEO, DJ, Music Producer, etc."
                    value={testimonialFormData.role}
                    onChange={(e) => setTestimonialFormData({ ...testimonialFormData, role: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="testimonialContent">Testimonial Content</Label>
                <Textarea
                  id="testimonialContent"
                  rows={4}
                  placeholder="What did they say about you?"
                  value={testimonialFormData.content}
                  onChange={(e) => setTestimonialFormData({ ...testimonialFormData, content: e.target.value })}
                />
              </div>

              <div>
                <Label>Avatar Image</Label>
                <ImageUpload
                  onUploadComplete={(url) => setTestimonialFormData({ ...testimonialFormData, avatarUrl: url })}
                  bucket="media"
                  folder="testimonials"
                  aspectRatio="square"
                  currentImage={testimonialFormData.avatarUrl}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Rating (1-5)</Label>
                  <div className="flex items-center gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setTestimonialFormData({ ...testimonialFormData, rating: star })}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            star <= testimonialFormData.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30 hover:text-amber-400/50"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="testimonialDisplayOrder">Display Order</Label>
                  <Input
                    id="testimonialDisplayOrder"
                    type="number"
                    min={0}
                    value={testimonialFormData.displayOrder}
                    onChange={(e) =>
                      setTestimonialFormData({ ...testimonialFormData, displayOrder: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id="testimonialPublished"
                  checked={testimonialFormData.published}
                  onCheckedChange={(checked) => setTestimonialFormData({ ...testimonialFormData, published: checked })}
                />
                <Label htmlFor="testimonialPublished">Published (visible on website)</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsTestimonialDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveTestimonial}
                  disabled={
                    saveTestimonialMutation.isPending ||
                    !testimonialFormData.name ||
                    !testimonialFormData.role ||
                    !testimonialFormData.content
                  }
                >
                  {editingTestimonial ? "Update" : "Create"} Testimonial
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}