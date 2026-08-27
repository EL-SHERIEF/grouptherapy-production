import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCarouselAutoplay } from "@/hooks/use-carousel-autoplay";
import type { Release } from "@/lib/database";
import { resolveMediaUrl } from "@/lib/media";

interface ReleasesCarouselProps {
  releases: Release[];
  title?: string;
  autoPlay?: boolean;
  autoPlayIntervalMs?: number;
  showViewAll?: boolean;
}

const demoReleases: Partial<Release>[] = [
  {
    id: "1",
    title: "Midnight Sessions",
    artistName: "Luna Wave",
    coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    type: "album",
    genres: ["Electronic", "House"],
    spotifyUrl: "#",
    featured: true,
  },
  {
    id: "2",
    title: "Echoes of Tomorrow",
    artistName: "Neon Pulse",
    coverUrl: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop",
    type: "single",
    genres: ["Techno"],
    spotifyUrl: "#",
  },
  {
    id: "3",
    title: "Deep Waters",
    artistName: "Aqua Dreams",
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
    type: "ep",
    genres: ["Deep House"],
    spotifyUrl: "#",
    featured: true,
  },
  {
    id: "4",
    title: "Velocity",
    artistName: "Circuit Breaker",
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop",
    type: "album",
    genres: ["Drum & Bass"],
    spotifyUrl: "#",
  },
  {
    id: "5",
    title: "Solar Flare",
    artistName: "Cosmic Ray",
    coverUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop",
    type: "single",
    genres: ["Progressive"],
    spotifyUrl: "#",
  },
  {
    id: "6",
    title: "Urban Nights",
    artistName: "Street Beat",
    coverUrl: "https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=400&h=400&fit=crop",
    type: "album",
    genres: ["UK Garage"],
    spotifyUrl: "#",
  },
];

export function ReleasesCarousel({
  releases = [],
  title = "",
  autoPlay = true,
  autoPlayIntervalMs = 6000,
  showViewAll = true,
}: ReleasesCarouselProps) {
  const displayReleases = releases.length > 0 ? releases : demoReleases;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true });
      checkScroll();
      return () => el.removeEventListener("scroll", checkScroll);
    }
  }, []);

  useCarouselAutoplay({
    scrollRef,
    enabled: !!autoPlay,
    intervalMs: autoPlayIntervalMs,
    scrollByPx: 280,
  });

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 280;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section>
      {title && (
        <div className="max-w-7xl mx-auto px-6 md:px-8 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight" data-testid="text-releases-title">
              {title}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                className="rounded-full"
                data-testid="button-carousel-prev"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                className="rounded-full"
                data-testid="button-carousel-next"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 px-6 md:px-8 snap-x snap-mandatory overflow-y-hidden"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {displayReleases.map((release, index) => (
            <motion.div
              key={release.id || index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
              className="flex-shrink-0 w-[220px] md:w-[260px] snap-start"
            >
              <ReleaseCard release={release as Release} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReleaseCard({ release }: { release: Release }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href={`/releases/${release.slug || release.id}`}>
      <div
        className="group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-testid={`card-release-${release.id}`}
      >
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted mb-4">
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
            className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none sm:group-hover:pointer-events-auto"
          >
            <Button
              size="icon"
              className="h-14 w-14 rounded-full bg-white text-black hover:bg-white/90"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (release.spotifyUrl && release.spotifyUrl !== '#') {
                  window.open(release.spotifyUrl, '_blank', 'noopener,noreferrer');
                } else if (release.previewUrl) {
                  const audio = new Audio(release.previewUrl);
                  audio.play();
                } else {
                  window.location.href = `/releases/${release.slug || release.id}`;
                }
              }}
              data-testid={`button-play-${release.id}`}
            >
              <Play className="h-6 w-6 ml-0.5" />
            </Button>
          </motion.div>

          {release.featured && (
            <Badge className="absolute top-3 left-3 rounded-full" variant="default">
              Featured
            </Badge>
          )}
        </div>

        <h3 className="font-medium text-base truncate group-hover:text-primary transition-colors" data-testid={`text-release-title-${release.id}`}>
          {release.title}
        </h3>
        <p className="text-sm text-muted-foreground truncate" data-testid={`text-release-artist-${release.id}`}>
          {release.artistName}
        </p>
      </div>
    </Link>
  );
}
