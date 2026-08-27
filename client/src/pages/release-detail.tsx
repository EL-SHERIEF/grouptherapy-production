import { useRoute, Link } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, Calendar, ExternalLink, Music, Play } from "lucide-react";
import { SiSpotify, SiApplemusic, SiSoundcloud } from "react-icons/si";
import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { db, type Release, type Artist } from "@/lib/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { resolveMediaUrl } from "@/lib/media";

function trackReleaseClick(release: Release, platform: string) {
  db.analytics.trackEvent('release_click', {
    category: 'engagement',
    entityType: 'release',
    entityId: release.id,
    entityName: release.title,
    metadata: { platform, artistName: release.artistName }
  });
}

export default function ReleaseDetailPage() {
  const [, params] = useRoute("/releases/:slug");
  const slug = params?.slug;

  const heroRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroImageY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const heroImageScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.15]);

  const { data: release, isLoading } = useQuery<Release | null>({
    queryKey: ["release", slug],
    queryFn: async () => {
      if (!slug) return null;
      const bySlug = await db.releases.getBySlug(slug);
      if (bySlug) return bySlug;
      return db.releases.getById(slug);
    },
    enabled: !!slug,
  });

  const { data: artist } = useQuery<Artist | null>({
    queryKey: ["release-artist", release?.artistId],
    queryFn: async () => {
      if (!release?.artistId) return null;
      return db.artists.getById(release.artistId);
    },
    enabled: !!release?.artistId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!release) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Release Not Found</h1>
          <Link href="/releases">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Releases
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div ref={heroRef} className="relative">
        <div className="absolute inset-0 h-[50vh] overflow-hidden">
          {release.coverUrl ? (
            <motion.img
              src={resolveMediaUrl(release.coverUrl, "full")}
              alt={release.title}
              className="w-full h-full object-cover blur-xl scale-110"
              style={{ y: heroImageY, scale: heroImageScale }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-muted" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
        </div>

        <div className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Link href="/releases">
              <Button variant="ghost" className="mb-8 text-white hover:text-white hover:bg-white/10">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Releases
              </Button>
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col md:flex-row gap-8 items-start"
            >
              <div className="w-64 h-64 md:w-80 md:h-80 rounded-lg overflow-hidden shadow-2xl flex-shrink-0">
                {release.coverUrl ? (
                  <img
                    src={resolveMediaUrl(release.coverUrl, "hero")}
                    alt={release.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/30 to-muted flex items-center justify-center">
                    <Music className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1 text-white">
                <Badge variant="secondary" className="mb-4">
                  {release.type}
                </Badge>
                <h1 className="text-4xl md:text-6xl font-bold mb-2">{release.title}</h1>
                <Link href={artist ? `/artists/${artist.slug || artist.id}` : "#"}>
                  <p className="text-xl text-white/80 hover:text-white transition-colors mb-4">
                    {release.artistName}
                  </p>
                </Link>

                {release.releaseDate && (
                  <div className="flex items-center gap-2 text-white/60 mb-6">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(release.releaseDate), "MMMM d, yyyy")}</span>
                  </div>
                )}

                {release.genres && release.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {release.genres.map((genre, i) => (
                      <Badge key={i} variant="outline" className="border-white/30 text-white">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  {release.spotifyUrl && (
                    <a 
                      href={release.spotifyUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={() => trackReleaseClick(release, 'spotify')}
                    >
                      <Button className="bg-[#1DB954] hover:bg-[#1ed760] text-white">
                        <SiSpotify className="h-5 w-5 mr-2" />
                        Play on Spotify
                      </Button>
                    </a>
                  )}
                  {release.appleMusicUrl && (
                    <a 
                      href={release.appleMusicUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={() => trackReleaseClick(release, 'apple_music')}
                    >
                      <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                        <SiApplemusic className="h-5 w-5 mr-2" />
                        Apple Music
                      </Button>
                    </a>
                  )}
                  {release.soundcloudUrl && (
                    <a 
                      href={release.soundcloudUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={() => trackReleaseClick(release, 'soundcloud')}
                    >
                      <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                        <SiSoundcloud className="h-5 w-5 mr-2" />
                        SoundCloud
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 z-1 relative">
        {release.previewUrl && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Preview</h2>
            <div className="bg-card rounded-lg p-6">
              <audio controls className="w-full" src={release.previewUrl}>
                Your browser does not support the audio element.
              </audio>
            </div>
          </section>
        )}

        {artist && (
          <section>
            <h2 className="text-2xl font-bold mb-6">About the Artist</h2>
            <Link href={`/artists/${artist.slug || artist.id}`}>
              <div className="flex items-center gap-6 p-6 bg-card rounded-lg hover:bg-card/80 transition-colors">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  {artist.imageUrl ? (
                    <img
                      src={resolveMediaUrl(artist.imageUrl, "thumb")}
                      alt={artist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-muted" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{artist.name}</h3>
                  {artist.bio && (
                    <p className="text-muted-foreground line-clamp-2 mt-1">{artist.bio}</p>
                  )}
                </div>
                <ExternalLink className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
