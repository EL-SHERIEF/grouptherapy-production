import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, MapPin, Calendar, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { isEventPast, parseDateTime } from "@/lib/utils";
import type { Event } from "@/lib/database";
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
  return symbols[currency || "USD"] || "$";
}

interface EventsCarouselProps {
  events: Event[];
  title?: string;
  showViewAll?: boolean;
}

export function EventsCarousel({
  events = [],
  title = "",
  showViewAll = true,
}: EventsCarouselProps) {
  // Filter only featured events
  const featuredEvents = events.filter((event) => event.featured);
  
  // Sort by date (upcoming first)
  const sortedEvents = [...featuredEvents].sort((a, b) => {
    const dateA = parseDateTime(a.date)?.getTime() ?? 0;
    const dateB = parseDateTime(b.date)?.getTime() ?? 0;
    return dateA - dateB;
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollability = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollability();
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", checkScrollability);
      window.addEventListener("resize", checkScrollability);
      return () => {
        scrollElement.removeEventListener("scroll", checkScrollability);
        window.removeEventListener("resize", checkScrollability);
      };
    }
  }, [sortedEvents]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return { month: "", day: "" };
    const d = new Date(date);
    return {
      month: d.toLocaleDateString("en-US", { month: "short" }),
      day: d.getDate().toString(),
    };
  };

  if (sortedEvents.length === 0) {
    return null;
  }

  return (
    <section>
      {title && (
        <div className="max-w-7xl mx-auto px-6 md:px-8 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
              {title}
            </h2>
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

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 px-6 md:px-8 snap-x snap-mandatory overflow-y-hidden"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {sortedEvents.map((event, index) => {
            const { month, day } = formatDate(event.date!);
            const isPast = isEventPast(event);

            return (
              <motion.div
                key={event.id || index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                className="flex-shrink-0 w-[300px] md:w-[350px] snap-start"
              >
                <Link href={`/events/${event.slug || event.id}`}>
                  <div 
                    className="group cursor-pointer rounded-2xl overflow-hidden bg-card border border-border/50 hover:border-border transition-all"
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
                    </div>

                    <div className="p-5">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                        {event.title}
                      </h3>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{event.city}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          <span>{event.venue}</span>
                        </div>
                      </div>

                      {event.ticketPrice && !isPast && (
                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                          <span className="font-semibold text-primary">
                            From {getCurrencySymbol(event.currency)}{event.ticketPrice}
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
      </div>
    </section>
  );
}


