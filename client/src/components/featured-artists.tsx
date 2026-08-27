import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { SiSpotify, SiInstagram, SiSoundcloud } from "react-icons/si";
import type { Artist } from "@/lib/database";
import { resolveMediaUrl } from "@/lib/media";

interface FeaturedArtistsProps {
  artists?: Artist[];
  title?: string;
}

export function FeaturedArtists({
  artists = [],
  title = "",
}: FeaturedArtistsProps) {
  // Don't render anything if there are no real artists
  if (artists.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {artists.slice(0, 3).map((artist, index) => (
            <motion.div
              key={artist.id || index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <ArtistCard artist={artist as Artist} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ArtistCard({ artist }: { artist: Artist }) {
  const [, setLocation] = useLocation();
  const artistUrl = `/artists/${artist.slug || artist.id}`;

  const handleCardClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('a[data-social]')) {
      return;
    }
    setLocation(artistUrl);
  };

  return (
    <motion.article 
      className="group relative overflow-hidden rounded-3xl bg-card cursor-pointer" 
      data-testid={`card-artist-${artist.id}`}
      onClick={handleCardClick}
      role="link"
      tabIndex={0}
      aria-label={`View ${artist.name}'s profile`}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        {artist.imageUrl ? (
          <motion.img
            src={resolveMediaUrl(artist.imageUrl, "card")}
            alt={artist.name}
            className="w-full h-full object-cover"
            loading="lazy"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-muted" />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="bg-white/10 backdrop-blur-md rounded-full p-2.5">
            <ArrowUpRight className="h-4 w-4 text-white" />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-6">
          <h3 className="text-2xl font-semibold text-white mb-1" data-testid={`text-artist-name-${artist.id}`}>
            {artist.name}
          </h3>
          {artist.bio && (
            <p className="text-sm text-white/70 line-clamp-2 mb-4" data-testid={`text-artist-bio-${artist.id}`}>
              {artist.bio}
            </p>
          )}
          
          <div className="flex items-center gap-2">
            {artist.socialLinks?.spotify && (
              <motion.a
                href={artist.socialLinks.spotify}
                target="_blank"
                rel="noopener noreferrer"
                data-social
                className="flex items-center justify-center h-9 w-9 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-[#1DB954] transition-colors"
                data-testid={`button-artist-spotify-${artist.id}`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <SiSpotify className="h-4 w-4" />
              </motion.a>
            )}
            {artist.socialLinks?.instagram && (
              <motion.a
                href={artist.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                data-social
                className="flex items-center justify-center h-9 w-9 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 transition-colors"
                data-testid={`button-artist-instagram-${artist.id}`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <SiInstagram className="h-4 w-4" />
              </motion.a>
            )}
            {artist.socialLinks?.soundcloud && (
              <motion.a
                href={artist.socialLinks.soundcloud}
                target="_blank"
                rel="noopener noreferrer"
                data-social
                className="flex items-center justify-center h-9 w-9 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-orange-500 transition-colors"
                data-testid={`button-artist-soundcloud-${artist.id}`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <SiSoundcloud className="h-4 w-4" />
              </motion.a>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
