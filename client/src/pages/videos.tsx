import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Search, X } from "lucide-react";
import { ConfiguredPageHero } from "@/components/hero-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { db, type Video } from "@/lib/database";
import { resolveMediaUrl } from "@/lib/media";

const categories = [
  { value: "all", label: "All Videos" },
  { value: "music-video", label: "Music Videos" },
  { value: "live", label: "Live Performances" },
  { value: "behind-the-scenes", label: "Behind the Scenes" },
  { value: "event", label: "Event Videos" },
];

export default function VideosPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const getEmbedSrc = (video: Video) => {
    if (video.youtubeId) {
      return `https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0`;
    }

    return video.videoUrl || "";
  };

  const { data: videos = [], isLoading } = useQuery<Video[]>({
    queryKey: ["videos", "published", { limit: 48 }],
    queryFn: () => db.videos.getPublishedPage(48, 0),
  });

  const filteredVideos = videos.filter((video) => {
    const matchesSearch =
      video.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.artistName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || video.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen">
      <ConfiguredPageHero
        pageKey="/videos"
        title="Videos"
        subtitle="Watch music videos, live performances, and behind-the-scenes content"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-videos"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]" data-testid="select-video-category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="aspect-video w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Featured Videos */}
            {filteredVideos.some((v) => v.featured) && selectedCategory === "all" && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold mb-6">Featured</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredVideos
                    .filter((v) => v.featured)
                    .map((video, index) => (
                      <motion.div
                        key={video.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <VideoCard
                          video={video as Video}
                          featured
                          onClick={() => setSelectedVideo(video as Video)}
                        />
                      </motion.div>
                    ))}
                </div>
              </section>
            )}

            {/* All Videos */}
            <section>
              <h2 className="text-2xl font-bold mb-6">
                {selectedCategory === "all" ? "All Videos" : categories.find((c) => c.value === selectedCategory)?.label}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVideos.map((video, index) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <VideoCard
                      video={video as Video}
                      onClick={() => setSelectedVideo(video as Video)}
                    />
                  </motion.div>
                ))}
              </div>
            </section>

            {filteredVideos.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No videos found</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Video Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
        <DialogContent className="sm:overflow-hidden sm:w-[min(96vw,72rem)] sm:max-w-none sm:p-0 sm:pb-0 [&>button]:hidden">
          <DialogTitle className="sr-only">{selectedVideo?.title}</DialogTitle>
          {selectedVideo && (
            <div className="sm:grid sm:grid-rows-[auto,1fr]">
              <div className="flex items-start justify-between pb-6 sm:p-4 sm:pb-2">
                  <div className="-mx-4 space-y-2 px-4 pt-4 sm:mx-4 sm:px-0 sm:p-4">
                <h3 className="text-lg font-semibold leading-tight tracking-tight sm:text-2xl">
                  {selectedVideo.title}
                </h3>
                <div className="flex flex-row items-center gap-1 space-x-1">
                {selectedVideo.artistName && (
                  <p className="text-sm text-muted-foreground">{selectedVideo.artistName}</p>
                )}

                {(selectedVideo.description || selectedVideo.category || selectedVideo.duration) && (
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedVideo.category && (
                        <Badge variant="secondary">{selectedVideo.category}</Badge>
                      )}
                      {selectedVideo.duration && (
                        <Badge variant="outline">{selectedVideo.duration}</Badge>
                      )}
                    </div>
                    {selectedVideo.description && (
                      <p className="whitespace-pre-line text-sm text-muted-foreground">
                        {selectedVideo.description}
                      </p>
                    )}
                  </div>
                )}
              </div></div>
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Close video"
                    className="h-11 w-11 rounded-full bg-background/85 backdrop-blur"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </DialogClose>
              </div>
              <div className="-mx-4 mb-20 sm:mb-0 overflow-hidden rounded-md bg-black sm:mx-0 sm:rounded-none sm:rounded-t-lg">
                {getEmbedSrc(selectedVideo) ? (
                  <iframe
                    title={selectedVideo.title}
                    src={getEmbedSrc(selectedVideo)}
                    className="aspect-video h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center text-sm text-muted-foreground">
                    Video unavailable
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

function VideoCard({
  video,
  featured = false,
  onClick,
}: {
  video: Video;
  featured?: boolean;
  onClick: () => void;
}) {
  const getCategoryLabel = (category: string) => {
    return categories.find((c) => c.value === category)?.label || category;
  };

  return (
    <div
      className="group cursor-pointer"
      onClick={onClick}
      data-testid={`card-video-${video.id}`}
    >
      <div className={`relative overflow-hidden rounded-md bg-muted mb-3 ${featured ? "aspect-video" : "aspect-video"}`}>
        {video.thumbnailUrl ? (
          <img
            src={resolveMediaUrl(video.thumbnailUrl, featured ? "hero" : "card")}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-muted flex items-center justify-center">
            <Play className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}

        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center">
            <Play className="h-8 w-8 text-white ml-1" fill="white"/>
          </div>
        </div>

        {/* Duration */}
        {video.duration && (
          <span className="absolute bottom-2 right-2 px-2 py-1 text-md sm:text-sm font-medium bg-black/80 text-white rounded">
            {video.duration}
          </span>
        )}

        {/* Category Badge */}
        <Badge className="absolute top-2 left-2" variant="secondary">
          {getCategoryLabel(video.category || "video")}
        </Badge>
      </div>

      <h3 className={`font-semibold line-clamp-2 group-hover:text-primary transition-colors ${featured ? "text-lg" : "text-sm"}`}>
        {video.title}
      </h3>
      <p className="text-sm text-muted-foreground">{video.artistName}</p>
    </div>
  );
}
