import { useRoute, Link } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, Calendar, MapPin, Clock, Ticket, Users, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { db, type Event, type Artist } from "@/lib/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { EventCountdown } from "@/components/event-countdown";
import { resolveMediaUrl } from "@/lib/media";

function getCurrencySymbol(currency?: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    CAD: "C$",
    AUD: "A$",
  };
  const code = (currency || "USD").toUpperCase();
  return symbols[code] || "$";
}

export default function EventDetailPage() {
  const [, params] = useRoute("/events/:slug");
  const slug = params?.slug;

  const heroRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroImageY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const heroImageScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  const { data: event, isLoading } = useQuery<Event | null>({
    queryKey: ["event", slug],
    queryFn: async () => {
      if (!slug) return null;
      const bySlug = await db.events.getBySlug(slug);
      if (bySlug) return bySlug;
      return db.events.getById(slug);
    },
    enabled: !!slug,
  });

  const { data: allArtists } = useQuery<Artist[]>({
    queryKey: ["artists-all"],
    queryFn: () => db.artists.getAll(),
  });

  const eventArtists = allArtists?.filter(a => event?.artistIds?.includes(a.id)) || [];
  const eventDate = event?.date ? new Date(event.date) : null;
  const isEventPast = eventDate ? isPast(eventDate) : false;

  const trackTicketClick = (source: string) => {
    if (!event) return;
    db.analytics.trackEvent("event_ticket_click", {
      category: "engagement",
      entityType: "event",
      entityId: event.id,
      entityName: event.title,
      metadata: {
        source,
        slug: event.slug,
        ticketUrl: event.ticketUrl,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <Link href="/events">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div ref={heroRef} className="relative">
        <div className="absolute inset-0 h-[60vh] overflow-hidden">
          {event.imageUrl ? (
            <motion.img
              src={resolveMediaUrl(event.imageUrl, "full")}
              alt={event.title}
              className="w-full h-full object-cover"
              style={{ y: heroImageY, scale: heroImageScale }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-muted" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
        </div>

        <div className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Link href="/events">
              <Button variant="ghost" className="mb-8 text-white hover:text-white hover:bg-white/10">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Events
              </Button>
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3 mb-4">
                {isEventPast ? (
                  <Badge variant="secondary">Past Event</Badge>
                ) : (
                  <Badge variant="default" className="animate-pulse">Upcoming</Badge>
                )}
                {event.featured && <Badge variant="outline" className="border-primary">Featured</Badge>}
              </div>

              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">{event.title}</h1>

              <div className="flex flex-wrap items-center gap-6 text-foreground mb-8">
                {eventDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <span>{format(eventDate, "EEEE, MMMM d, yyyy")}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <span>{event.venue}, {event.city}, {event.country}</span>
                </div>
                {event.capacity && (
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span>Capacity: {event.capacity.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {eventDate && (
                <div className="mb-8">
                  <EventCountdown targetDate={eventDate} variant="large" />
                </div>
              )}

              {event.ticketUrl && !isEventPast && (
                <a
                  href={event.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackTicketClick("event_detail_hero")}
                >
                  <Button size="lg" className="bg-primary hover:bg-primary/90">
                    <Ticket className="h-5 w-5 mr-2" />
                    Get Tickets{event.ticketPrice ? ` - ${getCurrencySymbol(event.currency)}${event.ticketPrice}` : ""}
                  </Button>
                </a>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 z-1 relative">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            {event.description && (
              <section>
                <h2 className="text-2xl font-bold mb-4">About This Event</h2>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
                </div>
              </section>
            )}

            {eventArtists.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6">Lineup</h2>
                <div className="grid gap-4">
                  {eventArtists.map((artist) => (
                    <Link key={artist.id} href={`/artists/${artist.slug || artist.id}`}>
                      <div className="flex items-center gap-4 p-4 bg-card rounded-lg hover:bg-card/80 transition-colors">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
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
                          <h3 className="font-semibold text-lg">{artist.name}</h3>
                          {artist.bio && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{artist.bio}</p>
                          )}
                        </div>
                        <ExternalLink className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-lg">Event Details</h3>
                
                <div className="space-y-3 text-sm">
                  {eventDate && (
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">{format(eventDate, "EEEE, MMMM d, yyyy")}</p>
                        <p className="text-muted-foreground">{format(eventDate, "h:mm a")}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{event.venue}</p>
                      {event.address && <p className="text-muted-foreground">{event.address}</p>}
                      <p className="text-muted-foreground">{event.city}, {event.country}</p>
                    </div>
                  </div>

                  {event.ticketPrice && (
                    <div className="flex items-start gap-3">
                      <Ticket className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Price</p>
                        <p className="text-muted-foreground">{getCurrencySymbol(event.currency)}{event.ticketPrice}</p>
                      </div>
                    </div>
                  )}
                </div>

                {event.ticketUrl && !isEventPast && (
                  <a
                    href={event.ticketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                    onClick={() => trackTicketClick("event_detail_sidebar")}
                  >
                    <Button className="w-full" size="lg">
                      <Ticket className="h-4 w-4 mr-2" />
                      Buy Tickets
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
