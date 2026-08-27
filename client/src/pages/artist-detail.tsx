import { useRoute, Link } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, Calendar, MapPin, ExternalLink } from "lucide-react";
import { SiSpotify, SiInstagram, SiSoundcloud, SiYoutube, SiX } from "react-icons/si";
import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { db, type Artist, type Release, type Event } from "@/lib/database";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { parseDateTime } from "@/lib/utils";
import { format } from "date-fns";
import { resolveMediaUrl } from "@/lib/media";

export default function ArtistDetailPage() {
  const [match, params] = useRoute("/artists/:slug");
  const slug = params?.slug;

  const heroRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroImageY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const heroImageScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  const { data: artist, isLoading: artistLoading } = useQuery<Artist | null>({
    queryKey: ["artist", slug],
    queryFn: async () => {
      if (!slug) return null;
      const bySlug = await db.artists.getBySlug(slug);
      if (bySlug) return bySlug;
      return db.artists.getById(slug);
    },
    enabled: !!slug,
  });

  const { data: allReleases, isLoading: releasesLoading } = useQuery<Release[]>({
    queryKey: ["releases-all"],
    queryFn: () => db.releases.getAll(),
  });

  const { data: allEvents, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["events-all"],
    queryFn: () => db.events.getAll(),
  });

  const artistNameLower = (artist?.name || "").trim().toLowerCase();

  const artistReleases = allReleases?.filter(
    (r) =>
      r.published &&
      (
        r.artistId === artist?.id ||
        (!!artistNameLower && (r.artistName || "").toLowerCase().includes(artistNameLower))
      ),
  ) ?? [];

  const artistEvents = allEvents?.filter(
    (e) => {
      if (!e.published) return false;
      const upcoming = (parseDateTime(e.date)?.getTime() ?? 0) >= Date.now();
      if (!upcoming) return false;

      const matchesById = !!artist?.id && (e.artistIds || []).includes(artist.id);
      const haystack = `${e.title || ""} ${e.description || ""}`.toLowerCase();
      const matchesByName = !!artistNameLower && haystack.includes(artistNameLower);

      return matchesById || matchesByName;
    },
  ) ?? [];


  if (artistLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Artist Not Found</h1>
          <Link href="/artists">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Artists
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div ref={heroRef} className="relative">
        <div className="absolute inset-0 h-[100vh] overflow-hidden">
          {artist.imageUrl ? (
            <motion.img
              src={resolveMediaUrl(artist.imageUrl, "full")}
              alt={artist.name}
              className="w-full h-full object-cover blur-xl"
              style={{ y: heroImageY, scale: heroImageScale }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-muted" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
        </div>

        <div className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Link href="/artists">
              <Button variant="ghost" className="mb-8 text-white hover:text-white hover:bg-white/10">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Artists
              </Button>
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col md:flex-row gap-8 items-start"
            >
              <div className="w-48 h-48 md:w-64 md:h-64 rounded-lg overflow-hidden shadow-2xl flex-shrink-0">
                {artist.imageUrl ? (
                  <img
                    src={resolveMediaUrl(artist.imageUrl, "card")}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/30 to-muted" />
                )}
              </div>

              <div className="flex-1 text-white">
                <h1 className="text-4xl md:text-6xl font-bold mb-4">{artist.name}</h1>
                {artist.bio && (
                  <p className="text-lg text-white/80 max-w-2xl mb-6 leading-relaxed">
                    {artist.bio}
                  </p>
                )}

                <div className="flex items-center gap-4">
                  {artist.socialLinks?.spotify && (
                    <a
                      href={artist.socialLinks.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-12 w-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-[#1DB954] text-white transition-colors"
                    >
                      <SiSpotify className="h-6 w-6" />
                    </a>
                  )}
                  {artist.socialLinks?.instagram && (
                    <a
                      href={artist.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-12 w-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-pink-500 text-white transition-colors"
                    >
                      <SiInstagram className="h-6 w-6" />
                    </a>
                  )}
                  {artist.socialLinks?.soundcloud && (
                    <a
                      href={artist.socialLinks.soundcloud}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-12 w-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-orange-500 text-white transition-colors"
                    >
                      <SiSoundcloud className="h-6 w-6" />
                    </a>
                  )}
                  {artist.socialLinks?.youtube && (
                    <a
                      href={artist.socialLinks.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-12 w-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-red-600 text-white transition-colors"
                    >
                      <SiYoutube className="h-6 w-6" />
                    </a>
                  )}
                  {artist.socialLinks?.twitter && (
                    <a
                      href={artist.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-12 w-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-neutral-800 text-white transition-colors"
                    >
                      <SiX className="h-6 w-6" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 z-1 relative">
        {releasesLoading ? (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8">Releases</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="space-y-3">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          </section>
        ) : artistReleases.length > 0 ? (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8">Releases</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {artistReleases.map((release, index) => (
                <motion.div
                  key={release.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group"
                >
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-3">
                    {release.coverUrl ? (
                      <img
                        src={resolveMediaUrl(release.coverUrl, "card")}
                        alt={release.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-muted" />
                    )}
                    {release.spotifyUrl && (
                      <a
                        href={release.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <SiSpotify className="h-12 w-12 text-[#1DB954]" />
                      </a>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">
                    {release.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {release.type} {release.releaseDate && `• ${format(new Date(release.releaseDate), "yyyy")}`}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>
        ) : null}

        {eventsLoading ? (
          <section>
            <h2 className="text-2xl font-bold mb-8">Upcoming Events</h2>
            <div className="grid gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center gap-6 p-4 rounded-lg bg-card">
                  <Skeleton className="h-20 w-20 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                  <Skeleton className="h-9 w-24 rounded-md" />
                </div>
              ))}
            </div>
          </section>
        ) : artistEvents.length > 0 ? (
          <section>
            <h2 className="text-2xl font-bold mb-8">Upcoming Events</h2>
            <div className="grid gap-4">
              {artistEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-6 p-4 rounded-lg bg-card hover:bg-card/80 transition-colors"
                >
                  {event.imageUrl && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={resolveMediaUrl(event.imageUrl, "thumb")}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{event.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {event.date && format(new Date(event.date), "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {event.venue}, {event.city}
                      </span>
                    </div>
                  </div>
                  <Link href={`/events/${event.slug || event.id}`}>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Details
                    </Button>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        ) : null}

        {!releasesLoading && !eventsLoading && artistReleases.length === 0 && artistEvents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No releases or events found for this artist.</p>
          </div>
        )}
      </div>
    </div>
  );
}
