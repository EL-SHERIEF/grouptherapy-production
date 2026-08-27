import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Users } from "lucide-react";
import { Link, useLocation } from "wouter";
import { ConfiguredPageHero } from "@/components/hero-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiSpotify, SiInstagram, SiSoundcloud } from "react-icons/si";
import { useQuery } from "@tanstack/react-query";
import { db, type Artist } from "@/lib/database";
import { resolveMediaUrl } from "@/lib/media";

export default function ArtistsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: artists = [], isLoading } = useQuery<Artist[]>({
    queryKey: ["artists"],
    queryFn: () => db.artists.getAll(),
  });

  const filteredArtists = artists.filter((artist) =>
    artist.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <ConfiguredPageHero
        pageKey="/artists"
        title="Artists"
        subtitle="The artists shaping the Group Therapy community"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search */}
        <div className="flex justify-center mb-12">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-artists"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : artists.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No Artists Announced</h2>
            <p className="text-muted-foreground">
              Stay tuned for upcoming artist announcements!
            </p>
          </div>
        ) : (
          <>
            {/* Featured Artists */}
            {filteredArtists.some((a) => a.featured) && (
              <section className="mb-16">
                <h2 className="text-2xl font-bold mb-6">Featured Artists</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredArtists
                    .filter((a) => a.featured)
                    .map((artist, index) => (
                      <motion.div
                        key={artist.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <ArtistCard artist={artist} featured />
                      </motion.div>
                    ))}
                </div>
              </section>
            )}

            {/* All Artists */}
            <section>
              <h2 className="text-2xl font-bold mb-6">All Artists</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
                {filteredArtists.map((artist, index) => (
                  <motion.div
                    key={artist.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <ArtistCard artist={artist} />
                  </motion.div>
                ))}
              </div>
            </section>

            {filteredArtists.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No artists found</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ArtistCard({ artist, featured = false }: { artist: Artist; featured?: boolean }) {
  const [, setLocation] = useLocation();
  
  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('a')) return;
    setLocation(`/artists/${artist.slug || artist.id}`);
  };

  if (featured) {
    return (
      <div 
        className="group relative overflow-hidden rounded-md bg-card cursor-pointer" 
        data-testid={`card-artist-featured-${artist.id}`}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setLocation(`/artists/${artist.slug || artist.id}`)}
      >
        <div className="relative aspect-[4/5] overflow-hidden">
          {artist.imageUrl ? (
            <img
              src={resolveMediaUrl(artist.imageUrl, featured ? "card" : "thumb")}
              alt={artist.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-muted" />
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-6">
            <h3 className="text-xl lg:text-2xl font-bold text-white mb-2">{artist.name}</h3>
            {artist.bio && (
              <p className="text-sm text-white/70 line-clamp-2 mb-4">{artist.bio}</p>
            )}
            
            <div className="flex items-center gap-3">
              {artist.socialLinks?.spotify && (
                <a 
                  href={artist.socialLinks.spotify} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-8 w-8 flex items-center justify-center rounded-md text-white/80 hover:text-[#1DB954] hover:bg-white/10 transition-colors"
                >
                  <SiSpotify className="h-4 w-4" />
                </a>
              )}
              {artist.socialLinks?.instagram && (
                <a 
                  href={artist.socialLinks.instagram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-8 w-8 flex items-center justify-center rounded-md text-white/80 hover:text-pink-500 hover:bg-white/10 transition-colors"
                >
                  <SiInstagram className="h-4 w-4" />
                </a>
              )}
              {artist.socialLinks?.soundcloud && (
                <a 
                  href={artist.socialLinks.soundcloud} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-8 w-8 flex items-center justify-center rounded-md text-white/80 hover:text-orange-500 hover:bg-white/10 transition-colors"
                >
                  <SiSoundcloud className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link href={`/artists/${artist.slug || artist.id}`}>
      <div className="group cursor-pointer" data-testid={`card-artist-${artist.id}`}>
        <div className="relative aspect-square rounded-md overflow-hidden bg-muted mb-3">
          {artist.imageUrl ? (
            <img
              src={resolveMediaUrl(artist.imageUrl, "thumb")}
              alt={artist.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-muted" />
          )}
        </div>
        <h3 className="font-semibold text-sm text-center group-hover:text-primary transition-colors">
          {artist.name}
        </h3>
      </div>
    </Link>
  );
}
