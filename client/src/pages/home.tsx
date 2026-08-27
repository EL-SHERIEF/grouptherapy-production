import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { HeroSection } from "@/components/hero-section";
import { ReleasesCarousel } from "@/components/releases-carousel";
import { EventsCarousel } from "@/components/events-carousel";
import { PlaylistsSection } from "@/components/playlists-section";
import { PostsCarousel } from "@/components/posts-carousel";
import { AwardEntryCard } from "@/components/award-entry-card";
import { FeaturedArtists } from "@/components/featured-artists";
import { ArtistsCarousel } from "@/components/artists-carousel";
import { VideosCarousel } from "@/components/videos-carousel";
import { PartnersLogoMarquee } from "@/components/partners-logo-marquee";
import { NewsletterSection } from "@/components/newsletter-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import { Marquee } from "@/components/marquee";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import {
  db,
  type Release,
  type Event,
  type Playlist,
  type Artist,
  type Post,
  type Video,
  type SiteSettings,
  type MarqueeItem,
  type StatItem,
  type PageSectionConfig,
  type AwardPeriod,
  type AwardEntry,
} from "@/lib/database";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  Users,
  Disc3,
  Radio,
  Headphones,
  Music2,
  Mic,
  Heart,
  Star,
  Globe,
  Calendar,
  Trophy,
  Play,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCarouselAutoplay } from "@/hooks/use-carousel-autoplay";

const iconMap: Record<string, LucideIcon> = {
  Disc3,
  Radio,
  Music2,
  Users,
  Play,
  Headphones,
  Mic,
  Heart,
  Star,
  Globe,
  Calendar,
  Trophy,
};

const defaultHomeSections: PageSectionConfig[] = [
  {
    id: "hero",
    enabled: true,
    order: 1,
  },
  {
    id: "stats",
    enabled: true,
    order: 2,
    title: "Growing the future of",
    highlight: "music",
    description: "Our numbers tell the story of a community united by sound.",
  },
  {
    id: "marquee",
    enabled: true,
    order: 3,
  },
  {
    id: "partners",
    enabled: true,
    order: 14,
  },
  {
    id: "releases",
    enabled: true,
    order: 4,
    title: "New",
    highlight: "Releases",
    description: "The latest releases from our comunity",
    actionLabel: "View All Releases",
    actionHref: "/releases",
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
  {
    id: "testimonials",
    enabled: true,
    order: 10,
  },
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
  {
    id: "newsletter",
    enabled: true,
    order: 12,
  },
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

function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  duration = 2,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: duration * 1000 });
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${Math.floor(latest)}${suffix}`;
      }
    });
    return unsubscribe;
  }, [springValue, prefix, suffix]);

  return (
    <span ref={ref} className="stat-number">
      {prefix}0{suffix}
    </span>
  );
}

function StatsSection({
  statsItems,
  title = "Growing the future of",
  highlight = "music",
  description = "Our numbers tell the story of a community united by sound.",
}: {
  statsItems: StatItem[];
  title?: string;
  highlight?: string;
  description?: string;
}) {
  return (
    <section className="py-24 md:py-32 relative">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-4">
            {title} <span className="gradient-text">{highlight}</span>
          </h2>
          {description ? (
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">{description}</p>
          ) : null}
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {statsItems.map((stat, index) => {
            const Icon = iconMap[stat.icon] || Users;
            return (
              <motion.div
                key={stat.label || index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="text-center group"
              >
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-4xl md:text-5xl font-semibold mb-2">
                  <AnimatedCounter
                    value={stat.value}
                    suffix={stat.suffix}
                    prefix={stat.prefix || ""}
                  />
                </div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SectionHeader({
  title,
  highlight,
  description,
  action,
}: {
  title: string;
  highlight: string;
  description?: string;
  action?: { label: string; href: string };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 relative"
    >
      <div>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">
          {title} <span className="gradient-text">{highlight}</span>
        </h2>
        {description && (
          <p className="text-muted-foreground max-w-lg">{description}</p>
        )}
      </div>
      {action && (
        <Link href={action.href}>
          <motion.span
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
            whileHover={{ x: 4 }}
          >
            {action.label}
            <ArrowRight className="w-4 h-4" />
          </motion.span>
        </Link>
      )}
    </motion.div>
  );
}

function AwardsSection({
  entries,
  hasActiveVoting,
  periodId,
  tag = "Therapy Awards",
  title = "Voting is",
  highlight = "live",
  description = "Vote for your favorites, make them win the battle.",
  actionLabel = "View Awards",
  actionHref = "/awards",
}: {
  entries: AwardEntry[];
  hasActiveVoting: boolean;
  periodId?: string;
  tag?: string;
  title?: string;
  highlight?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  const { toast } = useToast();
  const [votedPeriods, setVotedPeriods] = useState<Set<string>>(new Set());
  const [fingerprint, setFingerprint] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate fingerprint for duplicate vote prevention
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillText("fingerprint", 2, 2);
    }
    const nav = navigator;
    const data = [
      nav.userAgent,
      nav.language,
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      nav.platform,
    ].join("|");
    setFingerprint(btoa(data));

    const votedOnAwardsPage = localStorage.getItem("voted_periods");
    const votedOnHome = localStorage.getItem("voted_periods_home");

    const next = new Set<string>();
    for (const stored of [votedOnAwardsPage, votedOnHome]) {
      if (!stored) continue;
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          for (const id of parsed) {
            if (typeof id === "string") next.add(id);
          }
        }
      } catch {}
    }
    if (next.size > 0) setVotedPeriods(next);
  }, []);

  useCarouselAutoplay({
    scrollRef,
    enabled: true,
    intervalMs: 6000,
    scrollByPx: 280,
  });

  const voteMutation = useMutation({
    mutationFn: async (entryId: string) => {
      if (!periodId) throw new Error("No voting period available");
      return db.awards.votes.submit(entryId, periodId, undefined, fingerprint);
    },
    onSuccess: () => {
      if (!periodId) return;
      const newVoted = new Set(votedPeriods);
      newVoted.add(periodId);
      setVotedPeriods(newVoted);
      localStorage.setItem("voted_periods_home", JSON.stringify([...newVoted]));
      localStorage.setItem("voted_periods", JSON.stringify([...newVoted]));
      queryClient.invalidateQueries({ queryKey: ["featuredAwardEntries"] });
      toast({
        title: "Vote Submitted!",
        description: "Thank you for voting. Your voice matters!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Vote Failed",
        description: error.message || "Unable to submit vote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleVote = (entryId: string) => {
    if (!periodId) {
      toast({
        title: "No Active Voting",
        description: "There is no active voting period.",
        variant: "destructive",
      });
      return;
    }
    if (votedPeriods.has(periodId)) {
      toast({
        title: "Already Voted",
        description: "You have already voted in this period.",
        variant: "destructive",
      });
      return;
    }
    voteMutation.mutate(entryId);
  };

  // Calculate total votes for percentage
  const totalVotes = entries.reduce((sum, entry) => sum + (entry.voteCount || 0), 0);
  const hasVoted = periodId ? votedPeriods.has(periodId) : false;

  if (!hasActiveVoting || entries.length === 0) return null;

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-8 pt-12">
        <SectionHeader
          title={title}
          highlight={highlight}
          description={description}
          action={{ label: actionLabel, href: actionHref }}
        />
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 px-6 md:px-8 snap-x snap-mandatory overflow-y-hidden"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {entries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
              className="flex-shrink-0 w-[260px] snap-start"
            >
              <AwardEntryCard
                entry={entry}
                onVote={() => handleVote(entry.id)}
                hasVoted={hasVoted}
                isVoting={voteMutation.isPending}
                totalVotes={totalVotes}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const defaultMarqueeItems: MarqueeItem[] = [
  { text: "New Release: ECHOES EP", icon: "Disc3" },
  { text: "Live Radio 24/7", icon: "Radio" },
  { text: "Summer Tour 2025", icon: "Music2" },
  { text: "50+ Artists Worldwide", icon: "Users" },
];

const defaultStatsItems: StatItem[] = [
  { value: 50, suffix: "+", prefix: "", label: "Artists", icon: "Users" },
  { value: 200, suffix: "+", prefix: "", label: "Releases", icon: "Disc3" },
  { value: 24, suffix: "/7", prefix: "", label: "Radio", icon: "Radio" },
  { value: 1, suffix: "M+", prefix: "", label: "Streams", icon: "Headphones" },
];

export default function HomePage() {
  const { data: releases } = useQuery<Release[]>({
    queryKey: ["releases", "featured", "published", { limit: 50 }],
    queryFn: () => db.releases.getFeaturedPublishedPage(50, 0),
  });

  const { data: events } = useQuery<Event[]>({
    queryKey: ["events", "upcoming"],
    queryFn: () => db.events.getUpcoming(),
  });

  const { data: playlists } = useQuery<Playlist[]>({
    queryKey: ["playlists", "featured", "published", { limit: 24 }],
    queryFn: () => db.playlists.getFeaturedPublishedPage(24, 0),
  });

  const { data: posts } = useQuery<Post[]>({
    queryKey: ["posts", "published", { limit: 12 }],
    queryFn: () => db.posts.getPublishedPage(12, 0),
  });

  const { data: videos } = useQuery<Video[]>({
    queryKey: ["videos", "published", { limit: 24 }],
    queryFn: () => db.videos.getPublishedPage(24, 0),
  });

  const { data: artists } = useQuery<Artist[]>({
    queryKey: ["artists", "featured"],
    queryFn: () => db.artists.getFeatured(),
  });

  const { data: siteSettings } = useQuery<SiteSettings | null>({
    queryKey: ["siteSettings"],
    queryFn: () => db.siteSettings.get(),
  });

  const { data: activeVotingPeriods = [] } = useQuery<AwardPeriod[]>({
    queryKey: ["activeVotingPeriods"],
    queryFn: () => db.awards.periods.getActiveVoting(),
  });

  const { data: featuredEntries = [] } = useQuery<AwardEntry[]>({
    queryKey: ["featuredAwardEntries", activeVotingPeriods],
    queryFn: async () => {
      if (activeVotingPeriods.length === 0) return [];

      const all = await Promise.all(
        activeVotingPeriods.map((p) => db.awards.entries.getByPeriodId(p.id))
      );

      const merged = all.flat();
      merged.sort((a, b) => {
        const orderA = typeof a.displayOrder === "number" ? a.displayOrder : 0;
        const orderB = typeof b.displayOrder === "number" ? b.displayOrder : 0;
        if (orderA !== orderB) return orderA - orderB;
        const votesA = typeof a.voteCount === "number" ? a.voteCount : 0;
        const votesB = typeof b.voteCount === "number" ? b.voteCount : 0;
        return votesB - votesA;
      });

      return merged;
    },
    enabled: activeVotingPeriods.length > 0,
  });

  const heroTitle = siteSettings?.heroTitle || "GROUPTHERAPY";
  const heroTag = siteSettings?.heroTag || "New: Finaly Launching our platform";
  const heroSubtitle =
    siteSettings?.heroSubtitle ||
    "Home of Artists. Built for Sound, Culture, and Community.";
  const heroBackgroundImage = siteSettings?.heroBackgroundImage || undefined;
  const heroCtaText = siteSettings?.heroCtaText || "Explore Releases";
  const heroCtaLink = siteSettings?.heroCtaLink || "/releases";
  const showHeroRadio = siteSettings?.showHeroRadio ?? true;
  const marqueeItems = siteSettings?.marqueeItems || defaultMarqueeItems;
  const marqueeSpeed = siteSettings?.marqueeSpeed || 40;
  const partnersMarqueeItems = siteSettings?.partnersMarqueeItems || [];
  const partnersMarqueeSpeed = siteSettings?.partnersMarqueeSpeed || 40;
  const partnersMarqueeGap = siteSettings?.partnersMarqueeGap || 48;
  const partnersMarqueeLogoHeight = siteSettings?.partnersMarqueeLogoHeight || 32;
  const partnersMarqueeUseMutedBg = siteSettings?.partnersMarqueeUseMutedBg || false;
  const statsItems = siteSettings?.statsItems?.length
    ? siteSettings.statsItems
    : defaultStatsItems;

  const configuredSections = normalizeSections(siteSettings?.homeSections, defaultHomeSections)
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const featuredEvents = (events || []).filter((event) => event.featured);

  const hasStats = (statsItems?.length ?? 0) > 0;
  const hasReleases = (releases?.length ?? 0) > 0;
  const hasEvents = featuredEvents.length > 0;
  const hasPlaylists = (playlists?.length ?? 0) > 0;
  const hasPosts = (posts?.length ?? 0) > 0;
  const hasVideos = (videos?.length ?? 0) > 0;

  const heroStats = statsItems.slice(0, 3).map((stat) => ({
    value: `${stat.prefix || ""}${stat.value}${stat.suffix || ""}`,
    label: stat.label,
  }));

  return (
    <div className="min-h-screen">
      {configuredSections.map((section) => {
        if (!section.enabled) return null;

        if (section.id === "hero") {
          return (
            <HeroSection
              key={section.id}
              heroTag={heroTag}
              title={heroTitle}
              subtitle={heroSubtitle}
              backgroundImage={heroBackgroundImage}
              backgroundVideo={siteSettings?.heroBackgroundVideo}
              backgroundType={siteSettings?.heroBackgroundType}
              ctaText={heroCtaText}
              ctaLink={heroCtaLink}
              showRadio={showHeroRadio}
              heroStats={heroStats}
            />
          );
        }

        if (section.id === "videos") {
          if (!hasVideos) return null;
          return (
            <section key={section.id} className="py-16 md:py-24 bg-muted/30 shadow-sm">
              <div className="max-w-7xl mx-auto px-6 md:px-8">
                <SectionHeader
                  title={section.title || "Latest"}
                  highlight={section.highlight || "Videos"}
                  description={
                    section.description ||
                    "Watch music videos, live performances, and behind-the-scenes content"
                  }
                  action={
                    section.actionHref
                      ? {
                          label: section.actionLabel || "View All Videos",
                          href: section.actionHref,
                        }
                      : { label: "View All Videos", href: "/videos" }
                  }
                />
              </div>
              <VideosCarousel
                videos={(videos || []).slice(0, 12)}
                title=""
                autoPlay={section.carouselEnabled ?? true}
                autoPlayIntervalMs={section.carouselIntervalMs ?? 6000}
              />
            </section>
          );
        }

        if (section.id === "stats") {
          if (!hasStats) return null;
          return (
            <StatsSection
              key={section.id}
              statsItems={statsItems}
              title={section.title}
              highlight={section.highlight}
              description={section.description}
            />
          );
        }

        if (section.id === "marquee") {
          return <Marquee key={section.id} items={marqueeItems} speed={marqueeSpeed} />;
        }

        if (section.id === "partners") {
          return (
            <PartnersLogoMarquee
              key={section.id}
              items={partnersMarqueeItems}
              speed={partnersMarqueeSpeed}
              gap={partnersMarqueeGap}
              logoHeight={partnersMarqueeLogoHeight}
              useMutedBg={partnersMarqueeUseMutedBg}
            />
          );
        }

        if (section.id === "releases") {
          if (!hasReleases) return null;
          const featuredOrderIds = Array.isArray(section.featuredReleaseIds)
            ? section.featuredReleaseIds
            : [];
          const releasesById = new Map((releases || []).map((r) => [r.id, r] as const));
          const ordered = featuredOrderIds
            .map((id) => releasesById.get(id))
            .filter((r): r is Release => !!r);
          const orderedIdsSet = new Set(ordered.map((r) => r.id));
          const remaining = (releases || []).filter((r) => !orderedIdsSet.has(r.id));
          const homeReleases = [...ordered, ...remaining];
          return (
            <section key={section.id} className="py-16 md:py-24">
              <div className="max-w-7xl mx-auto px-6 md:px-8 pt-12">
                <SectionHeader
                  title={section.title || "New"}
                  highlight={section.highlight || "Releases"}
                  description={section.description || "The latest releases from our comunity"}
                  action={
                    section.actionHref
                      ? {
                          label: section.actionLabel || "View All Releases",
                          href: section.actionHref,
                        }
                      : { label: "View All Releases", href: "/releases" }
                  }
                />
              </div>
              <ReleasesCarousel
                releases={homeReleases}
                title=""
                autoPlay={section.carouselEnabled ?? true}
                autoPlayIntervalMs={section.carouselIntervalMs ?? 6000}
                showViewAll={false}
              />
            </section>
          );
        }

        if (section.id === "artists") {
          if (!(artists && artists.filter((a) => a.featured).length > 0)) return null;
          const featuredArtists = artists?.filter((a) => a.featured) || [];
          const artistsCarouselEnabled = section.carouselEnabled ?? true;
          return (
            <section key={section.id} className="py-16 md:py-24 bg-muted/30  shadow-sm">
              <div className="max-w-7xl mx-auto px-6 md:px-8">
                <SectionHeader
                  title={section.title || "Supported"}
                  highlight={section.highlight || "Artists"}
                  description={section.description || "The artists shaping the Group Therapy community"}
                  action={
                    section.actionHref
                      ? {
                          label: section.actionLabel || "Meet The Artists",
                          href: section.actionHref,
                        }
                      : { label: "Meet The Artists", href: "/artists" }
                  }
                />
              </div>
              {artistsCarouselEnabled ? (
                <ArtistsCarousel
                  artists={featuredArtists}
                  autoPlay={true}
                  autoPlayIntervalMs={section.carouselIntervalMs ?? 6000}
                />
              ) : (
                <FeaturedArtists artists={featuredArtists} title="" />
              )}
            </section>
          );
        }

        if (section.id === "events") {
          if (!hasEvents) return null;
          return (
            <section key={section.id} className="py-16 md:py-24">
              <div className="max-w-7xl mx-auto px-6 md:px-8">
                <SectionHeader
                  title={section.title || "Upcoming"}
                  highlight={section.highlight || "Events"}
                  description={section.description || "Experience the music live"}
                  action={
                    section.actionHref
                      ? {
                          label: section.actionLabel || "View All Events",
                          href: section.actionHref,
                        }
                      : { label: "View All Events", href: "/events" }
                  }
                />
                <EventsCarousel events={featuredEvents} title="" showViewAll={false} />
              </div>
            </section>
          );
        }

        if (section.id === "playlists") {
          if (!hasPlaylists) return null;
          return (
            <section key={section.id} className="py-16 md:py-24 bg-muted/30  shadow-sm">
              <div className="max-w-7xl mx-auto px-6 md:px-8">
                <SectionHeader
                  title={section.title || "Curated"}
                  highlight={section.highlight || "Playlists"}
                  description={section.description || "Official selections of playlists that reflects our sound"}
                  action={
                    section.actionHref
                      ? {
                          label: section.actionLabel || "View All Playlists",
                          href: section.actionHref,
                        }
                      : { label: "View All Playlists", href: "/playlists" }
                  }
                />
              </div>
              <PlaylistsSection
                playlists={playlists || []}
                title=""
                autoPlay={section.carouselEnabled ?? true}
                autoPlayIntervalMs={section.carouselIntervalMs ?? 6000}
              />
            </section>
          );
        }

        if (section.id === "news") {
          if (!hasPosts) return null;
          return (
            <section key={section.id} className="py-16 md:py-24  shadow-sm">
              <div className="max-w-7xl mx-auto px-6 md:px-8">
                <SectionHeader
                  title={section.title || "Latest"}
                  highlight={section.highlight || "News"}
                  description={section.description || "The latest music news from around the world"}
                  action={
                    section.actionHref
                      ? {
                          label: section.actionLabel || "View All News",
                          href: section.actionHref,
                        }
                      : { label: "View All News", href: "/news" }
                  }
                />
              </div>
              <PostsCarousel
                posts={(posts || []).slice(0, 8)}
                autoPlay={section.carouselEnabled ?? true}
                autoPlayIntervalMs={section.carouselIntervalMs ?? 6000}
              />
            </section>
          );
        }

        if (section.id === "testimonials") {
          return <TestimonialsSection key={section.id} />;
        }

        if (section.id === "awards") {
          return (
            <AwardsSection
              key={section.id}
              entries={featuredEntries}
              hasActiveVoting={activeVotingPeriods.length > 0}
              periodId={activeVotingPeriods[0]?.id}
              tag={section.tag}
              title={section.title}
              highlight={section.highlight}
              description={section.description}
              actionLabel={section.actionLabel}
              actionHref={section.actionHref}
            />
          );
        }

        if (section.id === "newsletter") {
          return (
            <NewsletterSection
              key={section.id}
              title={siteSettings?.newsletterTitle}
              description={siteSettings?.newsletterDescription}
              buttonText={siteSettings?.newsletterButtonText}
              disclaimer={siteSettings?.newsletterDisclaimer}
            />
          );
        }

        if (section.id === "newsCta") {
          return (
            <section key={section.id} className="py-24 md:py-32">
              <div className="max-w-4xl mx-auto px-6 md:px-8 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-8">
                    <Radio className="w-6 h-6" />
                  </div>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-6">
                    {section.title || "Stay in the"}{" "}
                    <span className="gradient-text">{section.highlight || "loop"}</span>
                  </h2>
                  <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
                    {section.description ||
                      "Get the latest news, interviews, and behind-the-scenes content from the label."}
                  </p>
                  <Link href={section.actionHref || "/news"}>
                    <motion.span
                      className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-full font-medium text-base hover:shadow-lg hover:shadow-primary/25 transition-all cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      data-testid="link-news-cta"
                    >
                      {section.actionLabel || "Read Latest News"}
                      <ArrowRight className="w-4 h-4" />
                    </motion.span>
                  </Link>
                </motion.div>
              </div>
            </section>
          );
        }

        return null;
      })}
    </div>
  );
}
