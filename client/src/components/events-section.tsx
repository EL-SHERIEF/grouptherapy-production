import { motion } from "framer-motion";
import { MapPin, Calendar, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { isEventPast, parseDateTime } from "@/lib/utils";
import type { Event } from "@shared/schema";

interface EventsSectionProps {
  events?: Event[];
  title?: string;
  showViewAll?: boolean;
}

const demoEvents: Partial<Event>[] = [
  {
    id: "1",
    title: "GroupTherapy Sessions Vol. 1",
    venue: "Warehouse 23",
    city: "London",
    country: "UK",
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    imageUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600&h=400&fit=crop",
    ticketUrl: "#",
    ticketPrice: "25",
    featured: true,
  },
  {
    id: "2",
    title: "Summer Festival 2024",
    venue: "Victoria Park",
    city: "Manchester",
    country: "UK",
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&h=400&fit=crop",
    ticketUrl: "#",
    ticketPrice: "45",
  },
  {
    id: "3",
    title: "Club Night: Neon Pulse",
    venue: "The Underground",
    city: "Berlin",
    country: "Germany",
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    imageUrl: "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=600&h=400&fit=crop",
    ticketUrl: "#",
    ticketPrice: "20",
    featured: true,
  },
];

export function EventsSection({
  events = [],
  title = "",
  showViewAll = true,
}: EventsSectionProps) {
  const displayEvents = events.length > 0 
    ? [...events].sort((a, b) => {
        // Sort by featured first, then by date
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        const dateA = parseDateTime(a.date)?.getTime() ?? 0;
        const dateB = parseDateTime(b.date)?.getTime() ?? 0;
        return dateA - dateB;
      })
    : demoEvents;

  const formatDate = (date: Date | string | null) => {
    if (!date) return { month: "", day: "" };
    const d = new Date(date);
    return {
      month: d.toLocaleDateString("en-US", { month: "short" }),
      day: d.getDate().toString(),
    };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {displayEvents.slice(0, 3).map((event, index) => {
        const { month, day } = formatDate(event.date!);
        const isPast = isEventPast(event);

        return (
          <motion.div
            key={event.id || index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
            <Link href={`/events/${event.slug || event.id}`}>
              <div 
                className="group cursor-pointer rounded-2xl overflow-hidden bg-card border border-border/50 hover:border-border transition-all"
                data-testid={`card-event-${event.id}`}
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  {event.imageUrl ? (
                    <img
                      src={event.imageUrl}
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

                  {event.ticketPrice && !isPast && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                      <span className="font-semibold text-primary" data-testid={`text-event-price-${event.id}`}>
                        From ${event.ticketPrice}
                      </span>
                      <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                        Get Tickets
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
