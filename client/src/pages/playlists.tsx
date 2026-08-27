import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Music2, Clock, ListMusic, ExternalLink } from "lucide-react";
import { Link, useRoute } from "wouter";
import { ConfiguredPageHero } from "@/components/hero-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PlaylistPlayer, SpotifyEmbed, type PlaylistTrack } from "@/components/playlist-player";
import { useQuery } from "@tanstack/react-query";
import { db, Playlist } from "@/lib/database";
import { cn } from "@/lib/utils";
import { SiSpotify } from "react-icons/si";
import { resolveMediaUrl } from "@/lib/media";

function extractSpotifyId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
  return match?.[1] ?? null;
}

export default function PlaylistsPage() {
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  const { data: playlists = [], isLoading } = useQuery<Playlist[]>({
    queryKey: ["playlists", "published", { limit: 48 }],
    queryFn: () => db.playlists.getPublishedPage(48, 0),
  });

  const handlePlayPlaylist = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setIsPlayerOpen(true);
  };

  const getSpotifyEmbedId = (playlist: Playlist): string | null => {
    return playlist.spotifyPlaylistId ?? extractSpotifyId(playlist.spotifyUrl || "") ?? null;
  };

  return (
    <div className="min-h-screen">
      <ConfiguredPageHero
        pageKey="/playlists"
        title="Curated Playlists"
        subtitle="Official selections of playlists that reflects our sound"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-muted rounded-lg mb-3" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : playlists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {playlists.map((playlist, index) => (
              <motion.div
                key={playlist.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <PlaylistCard
                  playlist={playlist}
                  onPlay={() => handlePlayPlaylist(playlist)}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <ListMusic className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Playlists Yet</h2>
            <p className="text-muted-foreground">
              Check back soon for curated playlists from our team.
            </p>
          </div>
        )}
      </div>

      <Dialog open={isPlayerOpen} onOpenChange={setIsPlayerOpen}>
        <DialogContent className="sm:max-w-4xl sm:p-0 sm:overflow-hidden sm:bg-transparent sm:border-none">
          <DialogTitle className="sr-only">Playlist player</DialogTitle>
          <DialogDescription className="sr-only">Listen to the selected playlist.</DialogDescription>
          {selectedPlaylist && (
            <div className="bg-card rounded-xl overflow-hidden">
              <div className="p-6 mt-2">
                {getSpotifyEmbedId(selectedPlaylist) ? (
                  <SpotifyEmbed 
                    playlistId={getSpotifyEmbedId(selectedPlaylist)!} 
                    showLoginHint={true}
                  />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Music2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No playable content available for this playlist.</p>
                    {selectedPlaylist.spotifyUrl && (
                      <Button asChild className="mt-4" variant="outline">
                        <a
                          href={selectedPlaylist.spotifyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <SiSpotify className="h-4 w-4 mr-2" />
                          Open in Spotify
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PlaylistCard({ playlist, onPlay }: { playlist: Playlist; onPlay: () => void }) {
  const hasSpotifyEmbed = playlist.spotifyPlaylistId || extractSpotifyId(playlist.spotifyUrl || "");

  return (
    <div className="group cursor-pointer" onClick={onPlay}>
      <div className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-3 shadow-lg">
        {playlist.coverUrl ? (
          <img
            src={resolveMediaUrl(playlist.coverUrl, "card")}
            alt={playlist.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-muted flex items-center justify-center">
            <ListMusic className="h-16 w-16 text-muted-foreground/50" />
          </div>
        )}

        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button
            size="lg"
            className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90"
          >
            <Play className="h-6 w-6 ml-0.5" />
          </Button>
        </div>

        {playlist.featured && (
          <Badge className="absolute top-3 left-3" variant="default">
            Featured
          </Badge>
        )}

        {hasSpotifyEmbed && (
          <div className="absolute bottom-3 right-3">
            <SiSpotify className="h-6 w-6 text-[#1DB954]" />
          </div>
        )}
      </div>

      <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
        {playlist.title}
      </h3>
      <p className="text-sm text-muted-foreground line-clamp-2">
        {playlist.description || `${playlist.trackCount || 0} tracks`}
      </p>
    </div>
  );
}
