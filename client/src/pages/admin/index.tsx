import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Music,
  Users,
  Calendar,
  FileText,
  Radio,
  ListMusic,
  Video,
  Mail,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Tv,
  TrendingUp,
  Eye,
  Play,
  Heart,
  BarChart3,
  Globe,
  Clock,
  MousePointerClick,
  UserCheck,
  Send,
  Ticket,
  MessageSquareQuote,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { MetricsChart } from "@/components/metrics-chart";
import { AnalyticsChart } from "@/components/analytics-chart";
import { cn, parseDateTime } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryClient, queryFunctions } from "@/lib/queryClient";
import type { Release, Event, Post, RadioShow, Artist, Contact, AnalyticsSummary, NewsletterSubscriber, Playlist, Video as VideoType, Career, Tour, CareerApplication } from "@/lib/database";
import { useAuth } from "@/lib/auth-context";
import { subscribeToListenerCount } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import favicon from "/favicon.png";

const sidebarLinks = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/releases", icon: Music, label: "Releases" },
  { href: "/admin/artists", icon: Users, label: "Artists" },
  { href: "/admin/events", icon: Calendar, label: "Events" },
  { href: "/admin/tours", icon: TrendingUp, label: "Tours" },
  { href: "/admin/posts", icon: FileText, label: "Blog / News" },
  { href: "/admin/radio", icon: Radio, label: "Radio Shows" },
  { href: "/admin/playlists", icon: ListMusic, label: "Playlists" },
  { href: "/admin/videos", icon: Video, label: "Videos" },
  { href: "/admin/awards", icon: Trophy, label: "Awards" },
  { href: "/admin/careers", icon: Heart, label: "Careers" },
  { href: "/admin/newsletters", icon: Send, label: "Newsletter" },
  { href: "/admin/press-kit", icon: Tv, label: "Press Kit" },
  { href: "/admin/static-pages", icon: FileText, label: "Content Management" },
  { href: "/admin/contacts", icon: Mail, label: "Messages" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
  { href: "/admin/seo-settings", icon: Globe, label: "SEO Settings" },
];
export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout, username } = useAuth();

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["contacts"],
    queryFn: queryFunctions.contacts,
    refetchInterval: 30000,
  });

  const newMessageCount = contacts.filter((c) => c.status === "new").length;

  const { data: careerApplications = [] } = useQuery<CareerApplication[]>({
    queryKey: ["careerApplications"],
    queryFn: queryFunctions.careerApplications,
    refetchInterval: 30000,
  });

  const newCareerApplicationCount = careerApplications.filter((a) => (a.status || "new") === "new").length;

  async function handleLogout() {
    await logout();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-background/80 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-full"
          data-testid="button-admin-menu"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
         <Link href="/" className="flex items-center gap-1 group" data-testid="link-logo">
            <img src={favicon} className="w-6 h-6" alt="GroupTherapy Records Logo" />
              <span className="text-md font-semibold tracking-tight">
                GROUP<span className="text-primary transition-colors">THERAPY</span>
              </span>
            </Link>
        <ThemeToggle />
      </header>

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-60 bg-sidebar/50 backdrop-blur-xl border-r border-sidebar-border/50 transform transition-transform duration-300",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="h-14 flex items-center px-5 border-b border-sidebar-border/50">
                 <Link href="/" className="flex items-center gap-1 group" data-testid="link-logo">
            <img src={favicon} className="w-6 h-6" alt="GroupTherapy Records Logo" />
              <span className="text-md font-semibold tracking-tight">
                GROUP<span className="text-primary transition-colors">THERAPY</span>
              </span>
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto py-3 px-3">
            <div className="space-y-0.5">
              {sidebarLinks.map((link) => {
                const isActive = location === link.href || 
                  (link.href !== "/admin" && location.startsWith(link.href));
                const showMessagesBadge = link.label === "Messages" && newMessageCount > 0;
                const showCareersBadge = link.label === "Careers" && newCareerApplicationCount > 0;
                return (
                  <Link key={link.href} href={link.href}>
                    <button
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                      )}
                      onClick={() => setSidebarOpen(false)}
                      data-testid={`link-admin-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <link.icon className={cn("h-4 w-4", isActive && "text-primary")} />
                      {link.label}
                      {showMessagesBadge && (
                        <span className="ml-auto h-5 min-w-[20px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-md sm:text-sm font-medium px-1.5">
                          {newMessageCount > 9 ? "9+" : newMessageCount}
                        </span>
                      )}
                      {showCareersBadge && (
                        <span className="ml-auto h-5 min-w-[20px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-md sm:text-sm font-medium px-1.5">
                          {newCareerApplicationCount > 9 ? "9+" : newCareerApplicationCount}
                        </span>
                      )}
                    </button>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="p-3 border-t border-sidebar-border/50 space-y-0.5">
            <Link href="/">
              <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors" data-testid="link-admin-view-site">
                <Eye className="h-4 w-4" />
                View Site
              </button>
            </Link>
            <button 
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
              data-testid="button-admin-logout"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="lg:pl-60 pt-14 lg:pt-0 min-h-screen">
        <div className="hidden lg:flex h-14 items-center justify-between px-6 border-b border-border/50 bg-background/50 backdrop-blur-sm">
          <div className="text-sm text-muted-foreground">
            Welcome back, <span className="font-medium text-foreground">{username || "Admin"}</span>
          </div>
          <ThemeToggle />
        </div>
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: releases = [] } = useQuery<Release[]>({
    queryKey: ["releases"],
    queryFn: queryFunctions.releases,
  });

  const { data: artists = [] } = useQuery<Artist[]>({
    queryKey: ["artists"],
    queryFn: queryFunctions.artists,
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["events"],
    queryFn: queryFunctions.events,
  });

  const { data: posts = [] } = useQuery<Post[]>({
    queryKey: ["posts"],
    queryFn: queryFunctions.posts,
  });

  const { data: radioShows = [] } = useQuery<RadioShow[]>({
    queryKey: ["radioShows"],
    queryFn: queryFunctions.radioShows,
  });

  const { data: playlists = [] } = useQuery<Playlist[]>({
    queryKey: ["playlists"],
    queryFn: queryFunctions.playlists,
  });

  const { data: videos = [] } = useQuery<VideoType[]>({
    queryKey: ["videos"],
    queryFn: queryFunctions.videos,
  });

  const { data: careers = [] } = useQuery<Career[]>({
    queryKey: ["careers"],
    queryFn: queryFunctions.careers,
  });

  const { data: tours = [] } = useQuery<Tour[]>({
    queryKey: ["tours"],
    queryFn: queryFunctions.tours,
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["contacts"],
    queryFn: queryFunctions.contacts,
  });

  const { data: newsletterSubs = [] } = useQuery<NewsletterSubscriber[]>({
    queryKey: ["newsletterSubscribers"],
    queryFn: queryFunctions.newsletterSubscribers,
  });

  const { data: analytics } = useQuery<AnalyticsSummary>({
    queryKey: ["analyticsSummary"],
    queryFn: queryFunctions.analyticsSummary,
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!supabase) return;

    const invalidate = (keys: string[]) => {
      keys.forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));
    };

    const channel = supabase
      .channel("admin-dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "releases" },
        () => invalidate(["releases"])
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "artists" },
        () => invalidate(["artists"])
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        () => invalidate(["events", "analyticsSummary"])
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        () => invalidate(["posts"])
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contacts" },
        () => invalidate(["contacts", "analyticsSummary"])
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "newsletter_subscribers" },
        () => invalidate(["newsletterSubscribers", "analyticsSummary"])
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "page_views" },
        () => invalidate(["analyticsSummary"])
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "analytics_events" },
        () => invalidate(["analyticsSummary"])
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "radio_tracks" },
        () => invalidate(["analyticsSummary"])
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "radio_sessions" },
        () => invalidate(["analyticsSummary"])
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [queryClient]);

  const [liveListenerCount, setLiveListenerCount] = useState<number | null>(null);
  useEffect(() => {
    const unsubscribe = subscribeToListenerCount((count) => {
      setLiveListenerCount(count);
    });
    return () => unsubscribe();
  }, []);

  const publishedReleases = releases.filter(r => r.published);
  const upcomingEvents = events.filter(e => (parseDateTime(e.date)?.getTime() ?? 0) > Date.now());
  const activeSubscribers = newsletterSubs.filter(s => s.active);

  const primaryStats = [
    { 
      label: "Total Page Views", 
      value: analytics?.totalPageViews?.toLocaleString() || "0", 
      change: `${analytics?.todayPageViews || 0} today`, 
      icon: Eye,
      color: "text-blue-500",
      href: "/admin"
    },
    { 
      label: "This Month", 
      value: analytics?.monthPageViews?.toLocaleString() || "0", 
      change: `${analytics?.weekPageViews || 0} this week`, 
      icon: BarChart3,
      color: "text-green-500",
      href: "/admin"
    },
    { 
      label: "Newsletter Subscribers", 
      value: activeSubscribers.length.toString(), 
      change: `${newsletterSubs.length} total`, 
      icon: Mail,
      color: "text-purple-500",
      href: "/admin/newsletters"
    },
    { 
      label: "Contact Submissions", 
      value: analytics?.contactSubmissions?.toString() || contacts.length.toString(), 
      change: `${analytics?.newContactSubmissions || contacts.filter(c => c.status === 'new').length} new`, 
      icon: Send,
      color: "text-orange-500",
      href: "/admin/contacts"
    },
  ];

  const secondaryStats = [
    { 
      label: "Total Releases", 
      value: releases.length.toString(), 
      change: `${publishedReleases.length} published`, 
      icon: Music,
      color: "text-pink-500",
      href: "/admin/releases"
    },
    { 
      label: "Active Artists", 
      value: artists.length.toString(), 
      change: "All time", 
      icon: Users,
      color: "text-cyan-500",
      href: "/admin/artists"
    },
    { 
      label: "Get Tickets Clicks", 
      value: analytics?.totalEventTicketClicks?.toString() || "0", 
      change: `${upcomingEvents.length} upcoming`, 
      icon: MousePointerClick,
      color: "text-amber-500",
      href: "/admin/events"
    },
    { 
      label: "Radio Listeners", 
      value: liveListenerCount !== null ? liveListenerCount.toString() : "-", 
      change: `Listeners Now`, 
      icon: Radio,
      color: "text-red-500",
      href: "/admin/radio"
    },
  ];

  type PageViewsRange = "today" | "7d" | "30d" | "90d" | "custom";
  const [pageViewsRange, setPageViewsRange] = useState<PageViewsRange>("30d");
  const [pageViewsStart, setPageViewsStart] = useState<Date | undefined>();
  const [pageViewsEnd, setPageViewsEnd] = useState<Date | undefined>();

  const pageViewsChartData = useMemo(() => {
    if (!analytics) return [];

    if (pageViewsRange === "today") {
      const byHour = new Map<number, number>();
      (analytics.pageViewsTodayByHour || []).forEach((h) => {
        byHour.set(h.hour, h.views);
      });
      return Array.from({ length: 24 }).map((_, hour) => ({
        date: `${String(hour).padStart(2, "0")}:00`,
        views: byHour.get(hour) ?? 0,
      }));
    }

    const toDateKey = (value: string) => {
      const trimmed = String(value || "").trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
      const dt = new Date(trimmed);
      if (Number.isNaN(dt.getTime())) return trimmed;
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, "0");
      const d = String(dt.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };

    const dateKeyToDate = (key: string) => {
      const [y, m, d] = key.split("-").map((v) => Number(v));
      if (!y || !m || !d) return new Date(key);
      return new Date(y, m - 1, d);
    };

    const startOfDay = (dt: Date) => {
      const d = new Date(dt);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const addDays = (dt: Date, daysToAdd: number) => {
      const d = new Date(dt);
      d.setDate(d.getDate() + daysToAdd);
      return d;
    };

    const dailyMap = new Map<string, number>();
    (analytics.pageViewsByDay || []).forEach((row) => {
      const key = toDateKey(row.date);
      dailyMap.set(key, (dailyMap.get(key) ?? 0) + (row.views ?? 0));
    });

    const today = startOfDay(new Date());
    let start: Date;
    let end: Date;

    if (pageViewsRange === "custom" && pageViewsStart && pageViewsEnd) {
      start = startOfDay(pageViewsStart);
      end = startOfDay(pageViewsEnd);
    } else if (pageViewsRange === "7d") {
      end = today;
      start = addDays(end, -6);
    } else if (pageViewsRange === "30d") {
      end = today;
      start = addDays(end, -29);
    } else {
      end = today;
      start = addDays(end, -89);
    }

    if (start > end) {
      const tmp = start;
      start = end;
      end = tmp;
    }

    const startKey = toDateKey(`${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`);
    const endKey = toDateKey(`${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`);

    const startDate = dateKeyToDate(startKey);
    const endDate = dateKeyToDate(endKey);

    const out: { date: string; views: number }[] = [];
    for (let d = startDate; d <= endDate; d = addDays(d, 1)) {
      const key = toDateKey(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
      out.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        views: dailyMap.get(key) ?? 0,
      });
    }

    return out;
  }, [analytics, pageViewsRange, pageViewsStart, pageViewsEnd]);

  const contentCounts = [
    { label: "Releases", count: releases.length, icon: Music, href: "/admin/releases" },
    { label: "Artists", count: artists.length, icon: Users, href: "/admin/artists" },
    { label: "Events", count: events.length, icon: Calendar, href: "/admin/events" },
    { label: "Posts", count: posts.length, icon: FileText, href: "/admin/posts" },
    { label: "Radio Shows", count: radioShows.length, icon: Radio, href: "/admin/radio" },
    { label: "Playlists", count: playlists.length, icon: ListMusic, href: "/admin/playlists" },
    { label: "Videos", count: videos.length, icon: Video, href: "/admin/videos" },
    { label: "Careers", count: careers.length, icon: Heart, href: "/admin/careers" },
    { label: "Tours", count: tours.length, icon: TrendingUp, href: "/admin/tours" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight" data-testid="text-admin-title">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Overview of your record label performance
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {primaryStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className="border-border/50 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setLocation(stat.href)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                      <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
                      <p className="text-xs text-primary font-medium">{stat.change}</p>
                    </div>
                    <div className={cn("h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center", stat.color)}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {secondaryStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
            >
              <Card
                className="border-border/50 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setLocation(stat.href)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                      <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.change}</p>
                    </div>
                    <div className={cn("h-10 w-10 rounded-xl bg-muted flex items-center justify-center", stat.color)}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
              <CardDescription className="text-xs">Common tasks at your fingertips</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Link href="/admin/releases/new">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-auto py-2 text-sm rounded-lg border-border/50 whitespace-normal text-left items-start" data-testid="button-quick-new-release">
                  <Music className="h-4 w-4 text-primary shrink-0" />
                  Add a New Release
                </Button>
              </Link>
              <Link href="/admin/events/new">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-auto py-2 text-sm rounded-lg border-border/50 whitespace-normal text-left items-start" data-testid="button-quick-new-event">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  Add a New Event
                </Button>
              </Link>
              <Link href="/admin/posts/new">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-auto py-2 text-sm rounded-lg border-border/50 whitespace-normal text-left items-start" data-testid="button-quick-new-post">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  Write a New Post
                </Button>
              </Link>
              <Link href="/admin/artists">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-auto py-2 text-sm rounded-lg border-border/50 whitespace-normal text-left items-start" data-testid="button-quick-artists">
                  <Users className="h-4 w-4 text-primary shrink-0" />
                  Manage Artists
                </Button>
              </Link>
              <Link href="/admin/videos">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-auto py-2 text-sm rounded-lg border-border/50 whitespace-normal text-left items-start" data-testid="button-quick-videos">
                  <Video className="h-4 w-4 text-primary shrink-0" />
                  Manage Videos
                </Button>
              </Link>
              <Link href="/admin/playlists">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-auto py-2 text-sm rounded-lg border-border/50 whitespace-normal text-left items-start" data-testid="button-quick-playlists">
                  <ListMusic className="h-4 w-4 text-primary shrink-0" />
                  Manage Playlists
                </Button>
              </Link>
              <Link href="/admin/awards">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-auto py-2 text-sm rounded-lg border-border/50 whitespace-normal text-left items-start" data-testid="button-quick-awards">
                  <Trophy className="h-4 w-4 text-primary shrink-0" />
                  Manage Awards
                </Button>
              </Link>
              <Link href="/admin/contacts">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-auto py-2 text-sm rounded-lg border-border/50 whitespace-normal text-left items-start" data-testid="button-quick-messages">
                  <Mail className="h-4 w-4 text-primary shrink-0" />
                  View Messages
                </Button>
              </Link>
              <Link href="/admin/settings">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-auto py-2 text-sm rounded-lg border-border/50 whitespace-normal text-left items-start" data-testid="button-quick-settings">
                  <Settings className="h-4 w-4 text-primary shrink-0" />
                  Settings
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
              <CardDescription className="text-xs">Latest updates from your content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {publishedReleases.slice(0, 2).map((release) => (
                  <Link key={release.id} href={`/admin/releases/${release.id}`}>
                    <div
                      className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4 pb-3 border-b border-border/50 last:border-0  cursor-pointer hover:bg-muted/50 transition-colors rounded-md p-2 -mx-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Release published</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 break-words">
                          {release.title} - {release.artistName}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground sm:whitespace-nowrap self-end sm:self-auto">
                        {release.releaseDate ? new Date(release.releaseDate).toLocaleDateString() : "-"}
                      </span>
                    </div>
                  </Link>
                ))}
                {upcomingEvents.slice(0, 1).map((event) => (
                  <Link key={event.id} href={`/admin/events/${event.id}`}>
                    <div
                      className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4 pb-3 border-b border-border/50 last:border-0  cursor-pointer hover:bg-muted/50 transition-colors rounded-md p-2 -mx-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Event scheduled</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 break-words">
                          {event.title}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground sm:whitespace-nowrap self-end sm:self-auto">
                        {new Date(event.date).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
                {posts.slice(0, 1).map((post) => (
                  <Link key={post.id} href={`/admin/posts/${post.id}`}>
                    <div
                      className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4 cursor-pointer hover:bg-muted/50 transition-colors rounded-md p-2 -mx-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Blog post {post.published ? 'published' : 'drafted'}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 break-words">
                          {post.title}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground sm:whitespace-nowrap self-end sm:self-auto">
                        {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
                {releases.length === 0 && events.length === 0 && posts.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No recent activity
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {analytics && pageViewsChartData.length > 0 ? (
            <AnalyticsChart
              title="Page Views Trend"
              description={
                pageViewsRange === "today"
                  ? "Today views by hour"
                    : "Daily page views over time"
              }
              data={pageViewsChartData}
              onDateRangeChange={(range, start, end) => {
                setPageViewsRange(range);
                setPageViewsStart(start);
                setPageViewsEnd(end);
              }}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Page Views Trend</CardTitle>
                <CardDescription>Daily page views over time</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  No page view data yet. Analytics will appear as visitors browse your site.
                </p>
              </CardContent>
            </Card>
          )}

          {analytics?.topPages && analytics.topPages.length > 0 ? (
            <MetricsChart
              title="Top Pages"
              description="Most visited pages this month"
              data={analytics.topPages.slice(0, 8).map((page) => ({
                label: page.path === '/' ? 'Home' : page.path,
                value: page.views,
              }))}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
                <CardDescription>Most visited pages</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  No page data yet. Analytics will appear as visitors browse your site.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {analytics?.topReleases && analytics.topReleases.length > 0 ? (
            <MetricsChart
              title="Top Releases"
              description="Most clicked releases this month"
              data={analytics.topReleases.map((release) => ({
                label: release.name,
                value: release.clicks,
              }))}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Top Releases</CardTitle>
                <CardDescription>Most clicked releases</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  No release click data yet. Analytics will appear when users click on release links.
                </p>
              </CardContent>
            </Card>
          )}

          {analytics?.topReferrers && analytics.topReferrers.length > 0 ? (
            <MetricsChart
              title="Top Referrers"
              description="Where your visitors come from"
              data={analytics.topReferrers.map((ref) => ({
                label: ref.referrer,
                value: ref.count,
              }))}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Top Referrers</CardTitle>
                <CardDescription>Where your visitors come from</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  No referrer data yet. This will show traffic sources once visitors arrive from other sites.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {analytics?.radioShowStats && analytics.radioShowStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5" />
                Radio Show Analytics
              </CardTitle>
              <CardDescription>Listener statistics for your radio shows</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Show Name</TableHead>
                    <TableHead className="text-right">Total Listens</TableHead>
                    <TableHead className="text-right">Avg Duration</TableHead>
                    <TableHead className="text-right">Total Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.radioShowStats.map((show) => (
                    <TableRow key={show.showId}>
                      <TableCell className="font-medium">{show.showName}</TableCell>
                      <TableCell className="text-right">{show.listens}</TableCell>
                      <TableCell className="text-right">{formatDuration(show.avgDuration)}</TableCell>
                      <TableCell className="text-right">{formatDuration(show.totalDuration)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Content Overview</CardTitle>
            <CardDescription>Total content across all sections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-4">
              {contentCounts.map((item) => (
                <Link key={item.label} href={item.href}>
                  <div className="flex flex-col items-center p-4 rounded-md border hover:bg-muted/50 transition-colors cursor-pointer group text-center">
                    <item.icon className="h-6 w-6 text-muted-foreground mb-2" />
                    <p className="text-2xl font-bold">{item.count}</p>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
