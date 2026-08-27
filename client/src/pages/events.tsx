import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MapPin, Calendar, Ticket, Clock, Filter, Grid, List as ListIcon, Map, ArrowRight, Calendar as CalendarIcon } from "lucide-react";
import { Link } from "wouter";
import { ConfiguredPageHero } from "@/components/hero-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, isEventPast, parseDateTime } from "@/lib/utils";
import { useRoute, useLocation } from "wouter";
import { queryFunctions } from "@/lib/queryClient";
import { db, type Event } from "@/lib/database";
import { EventCountdown } from "@/components/event-countdown";
import { resolveMediaUrl } from "@/lib/media";

// Helper function to get currency symbol
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

const demoEvents: Partial<Event>[] = [
  {
    id: "1",
    title: "GroupTherapy Sessions Vol. 1",
    venue: "Warehouse 23",
    city: "London",
    country: "UK",
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    imageUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600&h=400&fit=crop",
    ticketUrl: "#",
    ticketPrice: "25",
    featured: true,
    description: "An immersive night of electronic music featuring our top artists.",
  },
  {
    id: "2",
    title: "Summer Festival 2024",
    venue: "Victoria Park",
    city: "Manchester",
    country: "UK",
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&h=400&fit=crop",
    ticketUrl: "#",
    ticketPrice: "45",
    description: "A full day of outdoor music with multiple stages.",
  },
  {
    id: "3",
    title: "Club Night: Neon Pulse",
    venue: "The Underground",
    city: "Berlin",
    country: "Germany",
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    imageUrl: "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=600&h=400&fit=crop",
    ticketUrl: "#",
    ticketPrice: "20",
    featured: true,
    description: "Techno night with Neon Pulse headlining.",
  },
  {
    id: "4",
    title: "Rooftop Sessions",
    venue: "Sky Lounge",
    city: "Amsterdam",
    country: "Netherlands",
    date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
    imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=400&fit=crop",
    ticketUrl: "#",
    ticketPrice: "30",
    description: "Sunset vibes with deep house and panoramic views.",
  },
  {
    id: "5",
    title: "Past Event: New Year's Eve",
    venue: "The Grand",
    city: "Paris",
    country: "France",
    date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop",
    description: "Ring in the new year with GroupTherapy.",
  },
];

export default function EventsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["events", "all"],
    queryFn: () => db.events.getAll(),
  });

  const filteredEvents = events.filter((event) => {
    if (!event.published) return false;

    const matchesSearch =
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.city?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const isPast = isEventPast(event);
    
    if (filter === "upcoming") return matchesSearch && !isPast;
    if (filter === "past") return matchesSearch && isPast;
    return matchesSearch;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const dateA = parseDateTime(a.date)?.getTime() ?? 0;
    const dateB = parseDateTime(b.date)?.getTime() ?? 0;
    return filter === "past" ? dateB - dateA : dateA - dateB;
  });

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: Date | string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen">
      <ConfiguredPageHero
        pageKey="/events"
        title="Events"
        subtitle="Your refrence for international electronic music events and experiences"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="flex-1">
            <TabsList>
              <TabsTrigger value="upcoming" data-testid="tab-upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past" data-testid="tab-past">Past</TabsTrigger>
              <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2">
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48"
              data-testid="input-search-events"
            />
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
                data-testid="button-events-grid"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
                data-testid="button-events-list"
              >
                <ListIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        <p className="text-sm text-muted-foreground mb-8">
          {sortedEvents.length} {filter === "past" ? "past" : filter === "upcoming" ? "upcoming" : ""} events
        </p>

        {/* Events Display */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : sortedEvents.length === 0 ? (
          <div className="text-center py-16">
            <CalendarIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No Events Announced</h2>
            <p className="text-muted-foreground">
              Stay tuned for upcoming event announcements!
            </p>
          </div>
        ) : (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <EventCard event={event as Event} formatDate={formatDate} formatTime={formatTime} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <EventListCard event={event as Event} formatDate={formatDate} formatTime={formatTime} />
                  </motion.div>
                ))}
              </div>
            )}

            {sortedEvents.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No events found</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EventCard({
  event,
  formatDate,
  formatTime,
}: {
  event: Event;
  formatDate: (date: Date | string | null) => string;
  formatTime: (date: Date | string | null) => string;
}) {
  const isPast = isEventPast(event);
  const dateObj = parseDateTime(event.date);
  const month = dateObj ? dateObj.toLocaleDateString("en-US", { month: "short" }) : "";
  const day = dateObj ? dateObj.getDate().toString() : "";

  return (
    <Link href={`/events/${event.slug || event.id}`}>
      <div 
        className={cn(
          "group cursor-pointer rounded-2xl overflow-hidden bg-card border border-border/50 hover:border-border hover:shadow-lg transition-all",
          isPast && "opacity-70"
        )} 
        data-testid={`card-event-${event.id}`}
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          {event.imageUrl ? (
            <img
              src={resolveMediaUrl(event.imageUrl, "card")}
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-muted" />
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          <div className="absolute top-4 left-4 bg-card border border-border rounded-xl px-3 py-2 text-center min-w-[52px]">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {month}
            </div>
            <div className="text-xl font-bold text-card-foreground leading-none">
              {day}
            </div>
          </div>

          {event.featured && !isPast && (
            <Badge className="absolute top-4 right-4 rounded-full" variant="default">
              Featured
            </Badge>
          )}
          {isPast && (
            <Badge variant="secondary" className="absolute top-4 right-4 rounded-full">Past</Badge>
          )}
        </div>

        <div className="p-5">
          <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors" data-testid={`text-event-title-${event.id}`}>
            {event.title}
          </h3>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span className="truncate" data-testid={`text-event-location-${event.id}`}>
                {event.city}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span data-testid={`text-event-date-${event.id}`}>
                {event.venue}
              </span>
            </div>
          </div>

          {event.date && (
            <div className="mt-3">
              <EventCountdown targetDate={event.date} variant="compact" />
            </div>
          )}

          {event.ticketPrice && !isPast && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
              <span className="font-semibold text-primary" data-testid={`text-event-price-${event.id}`}>
                From {getCurrencySymbol(event.currency)}{event.ticketPrice}
              </span>
              {event.ticketUrl ? (
                <span 
                  className="text-sm text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    db.analytics.trackEvent("event_ticket_click", {
                      category: "engagement",
                      entityType: "event",
                      entityId: event.id,
                      entityName: event.title,
                      metadata: {
                        source: "events_card",
                        slug: event.slug,
                        ticketUrl: event.ticketUrl,
                      },
                    });
                    window.open(event.ticketUrl, '_blank');
                  }}
                >
                  Get Tickets
                  <ArrowRight className="h-4 w-4" />
                </span>
              ) : (
                <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                  Get Tickets
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function EventListCard({
  event,
  formatDate,
  formatTime,
}: {
  event: Event;
  formatDate: (date: Date | string | null) => string;
  formatTime: (date: Date | string | null) => string;
}) {
  const isPast = isEventPast(event);
  const dateObj = parseDateTime(event.date);

  return (
    <Link href={`/events/${event.slug || event.id}`}>
      <div 
        className={cn(
          "overflow-hidden cursor-pointer rounded-2xl bg-card border border-border/50 hover:border-border hover:shadow-lg transition-all group",
          isPast && "opacity-70"
        )} 
        data-testid={`card-event-list-${event.id}`}
      >
        <div className="flex flex-col sm:flex-row">
          <div className="relative w-full sm:w-48 aspect-video sm:aspect-square flex-shrink-0 overflow-hidden">
            {event.imageUrl ? (
              <img
                src={resolveMediaUrl(event.imageUrl, "card")}
                alt={event.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-muted" />
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            <div className="absolute top-2 left-2 bg-card border border-border rounded-lg px-2 py-1 text-center">
              <div className="text-xs font-bold text-card-foreground">
                {dateObj ? dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{event.title}</h3>
                {event.featured && !isPast && <Badge className="rounded-full">Featured</Badge>}
                {isPast && <Badge variant="secondary" className="rounded-full">Past</Badge>}
              </div>
              
              {event.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {event.description}
                </p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{event.city}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(event.date)}</span>
                </div>
                {event.date && formatTime(event.date) && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(event.date)}</span>
                  </div>
                )}
                {event.date && (
                  <EventCountdown targetDate={event.date} variant="compact" />
                )}
              </div>
            </div>

            {!isPast && event.ticketPrice && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                <span className="font-semibold text-primary">From {getCurrencySymbol(event.currency)}{event.ticketPrice}</span>
                {event.ticketUrl ? (
                  <span 
                    className="text-sm text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      db.analytics.trackEvent("event_ticket_click", {
                        category: "engagement",
                        entityType: "event",
                        entityId: event.id,
                        entityName: event.title,
                        metadata: {
                          source: "events_list",
                          slug: event.slug,
                          ticketUrl: event.ticketUrl,
                        },
                      });
                      window.open(event.ticketUrl, '_blank');
                    }}
                  >
                    Get Tickets
                    <ArrowRight className="h-4 w-4" />
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                    Get Tickets
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
