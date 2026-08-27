import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { resolveMediaUrl } from "../lib/media";
import { MapPin, Calendar, Ticket, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfiguredPageHero } from "@/components/hero-section";
import { queryFunctions } from "@/lib/queryClient";
import { db } from "@/lib/database";
import type { Tour, TourDate } from "@/lib/database";

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const now = new Date();
  const target = new Date(targetDate);
  const diff = target.getTime() - now.getTime();
  
  if (diff <= 0) return null;
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-mono bg-primary/10 px-2 py-1 rounded">{days}d</span>
      <span className="font-mono bg-primary/10 px-2 py-1 rounded">{hours}h</span>
      <span className="text-muted-foreground">until show</span>
    </div>
  );
}

export default function ToursPage() {
  const { data: tours = [], isLoading } = useQuery<Tour[]>({
    queryKey: ["toursPublished"],
    queryFn: queryFunctions.toursPublished,
  });

  const upcomingTours = tours.filter((tour) => {
    const endDate = tour.endDate || tour.startDate;
    return new Date(endDate) >= new Date();
  });

  const pastTours = tours.filter((tour) => {
    const endDate = tour.endDate || tour.startDate;
    return new Date(endDate) < new Date();
  });

  return (
    <div className="min-h-screen bg-background">
      <ConfiguredPageHero
        pageKey="/tours"
        title="Tours"
        subtitle="Catch Your artists live around the world. Don't miss the opportunity to experience the music in person."
      />

      <section className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : upcomingTours.length === 0 && pastTours.length === 0 ? (
            <div className="text-center py-16">
              <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No Tours Announced</h2>
              <p className="text-muted-foreground">
                Stay tuned for upcoming tour announcements!
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {upcomingTours.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Upcoming Tours</h2>
                  <div className="grid gap-6 md:grid-cols-2">
                    {upcomingTours.map((tour, index) => (
                      <motion.div
                        key={tour.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                          {tour.imageUrl && (
                            <div className="h-48 overflow-hidden">
                              <img
                                src={resolveMediaUrl(tour.imageUrl, "card")}
                                alt={tour.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <CardHeader>
                            <CardTitle>{tour.title}</CardTitle>
                            <p className="text-muted-foreground">{tour.artistName}</p>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                              <Calendar className="h-4 w-4" />
                              {tour.startDate && new Date(tour.startDate).toLocaleDateString()}
                              {tour.endDate && ` - ${new Date(tour.endDate).toLocaleDateString()}`}
                            </div>
                            {tour.startDate && <CountdownTimer targetDate={tour.startDate} />}
                            {tour.description && (
                              <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
                                {tour.description}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {pastTours.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-muted-foreground">Past Tours</h2>
                  <div className="grid gap-4 md:grid-cols-3">
                    {pastTours.map((tour) => (
                      <Card key={tour.id} className="opacity-75">
                        <CardContent className="p-4">
                          <h3 className="font-semibold">{tour.title}</h3>
                          <p className="text-sm text-muted-foreground">{tour.artistName}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {tour.startDate && new Date(tour.startDate).toLocaleDateString()}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
