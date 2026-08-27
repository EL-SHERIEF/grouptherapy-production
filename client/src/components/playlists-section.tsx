import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Music2, ListMusic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { SiSpotify } from "react-icons/si";
import { SpotifyEmbed } from "@/components/playlist-player";
import { useCarouselAutoplay } from "@/hooks/use-carousel-autoplay";
import type { Playlist } from "@/lib/database";
import { resolveMediaUrl } from "@/lib/media";

interface PlaylistsSectionProps {
  playlists?: Playlist[];
  title?: string;
  autoPlay?: boolean;
  autoPlayIntervalMs?: number;
}

const demoPlaylists: Partial<Playlist>[] = [
  {
    id: "1",
    title: "GroupTherapy Essentials",
    description: "The best tracks from our roster",
    coverUrl: "https://images.unsplash.com/photo-1614149162883-504ce4d13909?w=400&h=400&fit=crop",
    trackCount: 50,
    spotifyPlaylistId: "37i9dQZF1DXcBWIGoYBM5M",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
    featured: true,
  },
  {
    id: "2",
    title: "Late Night Sessions",
    description: "Deep cuts for the after hours",
    coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    trackCount: 35,
    spotifyPlaylistId: "37i9dQZF1DX6VDO8a6cQME",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX6VDO8a6cQME",
  },
  {
    id: "3",
    title: "Peak Time Energy",
    description: "High-energy tracks for the main room",
    coverUrl: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=400&fit=crop",
    trackCount: 42,
    spotifyPlaylistId: "37i9dQZF1DX0hvUZG3c29E",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX0hvUZG3c29E",
  },
  {
    id: "4",
    title: "Chill Therapy",
    description: "Ambient and downtempo selections",
    coverUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop",
    trackCount: 28,
    spotifyPlaylistId: "37i9dQZF1DX4WYpdgoIcn6",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX4WYpdgoIcn6",
  },
];

function extractSpotifyId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
  return match ? match[1] || null : null;
}

export function PlaylistsSection({
  playlists,
  title = "",
  autoPlay = true,
  autoPlayIntervalMs = 6000,
}: PlaylistsSectionProps) {
  const [selectedPlaylist, setSelectedPlaylist] = useState<Partial<Playlist> | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const shouldUseDemo = playlists === undefined;
  const displayPlaylists = shouldUseDemo ? demoPlaylists : playlists;

  const handlePlayPlaylist = (playlist: Partial<Playlist>) => {
    setSelectedPlaylist(playlist);
    setIsPlayerOpen(true);
  };

  const getSpotifyEmbedId = (playlist: Partial<Playlist>): string | null => {
    return playlist.spotifyPlaylistId ?? extractSpotifyId(playlist.spotifyUrl || "") ?? null;
  };

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
    <>
      <div className="relative">
        {title && (
          <div className="max-w-7xl mx-auto px-6 md:px-8 mb-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scroll("left")}
                  disabled={!canScrollLeft}
                  className="rounded-full"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scroll("right")}
                  disabled={!canScrollRight}
                  className="rounded-full"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {!displayPlaylists || displayPlaylists.length === 0 ? (
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
              No playlists available.
            </div>
          </div>
        ) : (

        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 px-6 md:px-8 snap-x snap-mandatory overflow-y-hidden"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {displayPlaylists.map((playlist, index) => (
            <motion.div
              key={playlist.id || index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
              className="flex-shrink-0 w-[220px] md:w-[260px] snap-start"
            >
              <PlaylistCard
                playlist={playlist as Playlist}
                onPlay={() => handlePlayPlaylist(playlist)}
              />
            </motion.div>
          ))}
        </div>
        )}
      </div>

      <Dialog open={isPlayerOpen} onOpenChange={setIsPlayerOpen}>
        <DialogContent className="sm:max-w-3xl sm:p-0 sm:overflow-hidden sm:bg-card sm:border-border/50 sm:rounded-2xl">
          <DialogTitle className="sr-only">Playlist player</DialogTitle>
          <DialogDescription className="sr-only">Listen to the selected playlist.</DialogDescription>
          {selectedPlaylist && (
            <>
           
              <div className="p-6">
                {getSpotifyEmbedId(selectedPlaylist) ? (
                  <SpotifyEmbed playlistId={getSpotifyEmbedId(selectedPlaylist)!}/>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Music2 className="h-10 w-10 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No playable content available.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function PlaylistCard({ playlist, onPlay }: { playlist: Playlist; onPlay: () => void }) {
  const hasSpotifyEmbed = playlist.spotifyPlaylistId || extractSpotifyId(playlist.spotifyUrl || "");

  return (
    <div 
      className="group cursor-pointer" 
      data-testid={`card-playlist-${playlist.id}`}
      onClick={onPlay}
    >
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted mb-3">
        {playlist.coverUrl ? (
          <img
            src={resolveMediaUrl(playlist.coverUrl, "card")}
            alt={playlist.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-muted flex items-center justify-center">
            <Play className="h-10 w-10 text-muted-foreground/50" />
          </div>
        )}

        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button
            size="icon"
            className="h-12 w-12 rounded-full bg-white text-black hover:bg-white/90"
          >
            <Play className="h-5 w-5 ml-0.5" />
          </Button>
        </div>

        {hasSpotifyEmbed && (
          <div className="absolute bottom-3 right-3">
            <SiSpotify className="h-5 w-5 text-[#1DB954]" />
          </div>
        )}
      </div>

      <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors" data-testid={`text-playlist-title-${playlist.id}`}>
        {playlist.title}
      </h3>
      <p className="text-xs text-muted-foreground truncate" data-testid={`text-playlist-desc-${playlist.id}`}>
        {playlist.trackCount} tracks
      </p>
    </div>
  );
}
