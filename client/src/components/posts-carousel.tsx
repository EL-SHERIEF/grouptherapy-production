import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Radio } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useCarouselAutoplay } from "@/hooks/use-carousel-autoplay";
import type { Post } from "@/lib/database";
import { resolveMediaUrl } from "@/lib/media";

interface PostsCarouselProps {
  posts: Post[];
  autoPlay?: boolean;
  autoPlayIntervalMs?: number;
}

export function PostsCarousel({ posts = [], autoPlay = true, autoPlayIntervalMs = 6000 }: PostsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true });
      checkScroll();
      return () => el.removeEventListener("scroll", checkScroll);
    }
  }, []);

  useCarouselAutoplay({
    scrollRef,
    enabled: !!autoPlay,
    intervalMs: autoPlayIntervalMs,
    scrollByPx: 280,
  });

  if (posts.length === 0) return null;

  return (
    <section>
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 px-6 md:px-8 snap-x snap-mandatory overflow-y-hidden"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {posts.map((post, index) => (
            <motion.div
              key={post.id || index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
              className="flex-shrink-0 w-[260px] md:w-[320px] snap-start"
            >
              <PostCard post={post} />
            </motion.div>
          ))}
        </div>

        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent transition-opacity",
            canScrollLeft ? "opacity-100" : "opacity-0"
          )}
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent transition-opacity",
            canScrollRight ? "opacity-100" : "opacity-0"
          )}
        />
      </div>
    </section>
  );
}

function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/news/${post.slug}`}> 
      <div className="group cursor-pointer bg-background rounded-2xl overflow-hidden border border-border/50 hover:border-border transition-colors">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {post.coverUrl ? (
            <img
              src={resolveMediaUrl(post.coverUrl, "card")}
              alt={post.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-muted flex items-center justify-center">
              <Radio className="h-10 w-10 text-muted-foreground/50" />
            </div>
          )}
          {post.category && (
            <div className="absolute top-3 left-3">
              <span className="px-2 py-1 text-[10px] font-medium bg-background/90 text-foreground rounded-full uppercase tracking-wide border border-border/50">
                {post.category}
              </span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
              {post.excerpt}
            </p>
          )}
          <div className="mt-3 inline-flex items-center gap-2 text-md sm:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            Read article
            <ArrowRight className="h-3 w-3" />
          </div>
        </div>
      </div>
    </Link>
  );
}
