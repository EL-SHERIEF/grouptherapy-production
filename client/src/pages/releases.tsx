import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, ExternalLink, Search, Grid, List, Calendar } from "lucide-react";
import { Link } from "wouter";
import { ConfiguredPageHero } from "@/components/hero-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInfiniteQuery } from "@tanstack/react-query";
import { db, type Release } from "@/lib/database";
import { resolveMediaUrl } from "@/lib/media";

const releaseTypes = [
  { label: "All", value: "all" },
  { label: "Album", value: "album" },
  { label: "EP", value: "ep" },
  { label: "Single", value: "single" },
] as const;

function getMonthKey(value: string | Date | null | undefined): string {
  if (!value) return "unknown";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(monthKey: string): string {
  if (monthKey === "unknown") return "Unknown";
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const date = new Date(year, monthIndex, 1);
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function MonthSpacer({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-8">
      <span className="text-sm font-semibold tracking-widest text-primary uppercase whitespace-nowrap flex items-center gap-2">
       <Calendar className="h-4 w-4"/> {label}
      </span>
      <div className="h-px flex-1 bg-border/70" />
    </div>
  );
}

export default function ReleasesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<(typeof releaseTypes)[number]["value"]>("all");
  const [sortBy, setSortBy] = useState("newest");

  const PAGE_SIZE = 48;

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const queryParams = useMemo(
    () => ({
      searchQuery,
      selectedType,
      sortBy,
      pageSize: PAGE_SIZE,
    }),
    [searchQuery, selectedType, sortBy]
  );

  const {
    data: releasesPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery<Release[]>({
    queryKey: ["releases", "published", queryParams],
    queryFn: ({ pageParam }) =>
      db.releases.searchPublishedPage({
        limit: PAGE_SIZE,
        offset: (pageParam as number) ?? 0,
        searchQuery,
        type: selectedType,
        sortBy: sortBy as "newest" | "oldest" | "title",
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
  });

  const releases = releasesPages?.pages?.flat() ?? [];

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    if (!hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        if (isFetchingNextPage) return;
        fetchNextPage();
      },
      { rootMargin: "800px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const releasesByMonth = (() => {
    const map = new Map<string, Release[]>();
    for (const release of releases as Release[]) {
      const key = getMonthKey(release.releaseDate ?? null);
      const current = map.get(key);
      if (current) {
        current.push(release);
      } else {
        map.set(key, [release]);
      }
    }

    const keys = Array.from(map.keys());
    const direction = sortBy === "oldest" ? 1 : -1;
    keys.sort((a, b) => {
      if (a === "unknown") return 1;
      if (b === "unknown") return -1;
      return a.localeCompare(b) * direction;
    });

    return keys.map((key) => ({
      key,
      label: getMonthLabel(key),
      releases: map.get(key) ?? [],
    }));
  })();

  return (
    <div className="min-h-screen">
      <ConfiguredPageHero
        pageKey="/releases"
        title="Release Radar"
        subtitle="Releases supported and shared by the Group Therapy community"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search releases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-releases"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Type Filter */}
            <Select
              value={selectedType}
              onValueChange={(value) => setSelectedType(value as (typeof releaseTypes)[number]["value"])}
            >
              <SelectTrigger className="w-[120px]" data-testid="select-type">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {releaseTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[130px]" data-testid="select-sort">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
                data-testid="button-view-grid"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
                data-testid="button-view-list"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        {isLoading ? (
          <Skeleton className="h-4 w-44 mb-6" />
        ) : (
          <p className="text-sm text-muted-foreground mb-8">
            Showing {releases.length} releases
          </p>
        )}

        {/* Releases Grid/List */}
        {isLoading ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
              {Array.from({ length: 20 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="aspect-square w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4 p-3 rounded-md">
                  <Skeleton className="h-16 w-16 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    <Skeleton className="h-5 w-14" />
                    <Skeleton className="h-5 w-14" />
                  </div>
                  <Skeleton className="hidden md:flex h-5 w-14" />
                  <Skeleton className="hidden lg:block h-4 w-24" />
                </div>
              ))}
            </div>
          )
        ) : releases.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No releases found</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="space-y-10">
            {releasesByMonth.map((group) => (
              <div key={group.key} className="space-y-4">
                <MonthSpacer label={group.label} />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
                  {group.releases.map((release, index) => (
                    <motion.div
                      key={release.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <ReleaseGridCard release={release as Release} />
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            {releasesByMonth.map((group) => (
              <div key={group.key} className="space-y-3">
                <MonthSpacer label={group.label} />
                <div className="space-y-3">
                  {group.releases.map((release, index) => (
                    <motion.div
                      key={release.id}
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <ReleaseListCard release={release as Release} />
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && (
          <div className="mt-10 flex justify-center">
            <div ref={sentinelRef} className="h-10 w-full" />
            {isFetchingNextPage && (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ReleaseGridCard({ release }: { release: Release }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href={`/releases/${release.slug || release.id}`}>
      <div
        className="group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-testid={`card-release-${release.id}`}
      >
        <div className="relative aspect-square rounded-md overflow-hidden bg-muted mb-3">
          {release.coverUrl ? (
            <img
              src={resolveMediaUrl(release.coverUrl, "card")}
              alt={release.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
              <Play className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}

          <motion.div
            initial={false}
            animate={{ opacity: isHovered ? 1 : 0 }}
            className="absolute inset-0 bg-black/60 flex items-center justify-center gap-3 pointer-events-none"
          >
            <Button
              size="icon"
              variant="secondary"
              className="h-12 w-12 rounded-full"
            >
              <Play className="h-5 w-5 ml-0.5" />
            </Button>
          </motion.div>

          {release.featured && (
            <Badge className="absolute top-2 left-2">Featured</Badge>
          )}
          <Badge variant="secondary" className="absolute top-2 right-2">
            {release.type}
          </Badge>
        </div>

        <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
          {release.title}
        </h3>
        <p className="text-sm text-muted-foreground truncate">{release.artistName}</p>
      </div>
    </Link>
  );
}

function ReleaseListCard({ release }: { release: Release }) {
  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Link href={`/releases/${release.slug || release.id}`}>
      <div
        className="flex items-center gap-4 p-3 rounded-md hover:bg-muted/50 transition-colors group"
        data-testid={`card-release-list-${release.id}`}
      >
        <div className="relative w-16 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
          {release.coverUrl ? (
            <img
              src={resolveMediaUrl(release.coverUrl, "thumb")}
              alt={release.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
            {release.title}
          </h3>
          <p className="text-sm text-muted-foreground truncate">{release.artistName}</p>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          {release.genres?.slice(0, 2).map((genre) => (
            <Badge key={genre} variant="outline" className="text-xs">
              {genre}
            </Badge>
          ))}
        </div>

        <Badge variant="secondary" className="hidden md:flex">
          {release.type}
        </Badge>

        <span className="text-sm text-muted-foreground hidden lg:block w-24 text-right">
          {formatDate(release.releaseDate ?? null)}
        </span>

        {release.spotifyUrl && (
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.preventDefault();
              window.open(release.spotifyUrl!, "_blank");
            }}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Link>
  );
}
