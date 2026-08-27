import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Calendar, Tag, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { ConfiguredPageHero } from "@/components/hero-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { db, type Post } from "@/lib/database";
import { resolveMediaUrl } from "@/lib/media";

const categories = ["all", "news", "releases", "events", "interviews", "features"];

export default function NewsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["posts", "published", { limit: 24 }],
    queryFn: () => db.posts.getPublishedPage(24, 0),
  });

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = filteredPosts.filter((p) => p.featured);
  const regularPosts = filteredPosts.filter((p) => !p.featured);

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen">
      <ConfiguredPageHero
        pageKey="/news"
        title="News"
        subtitle="The latest music news from around the world"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-news"
            />
          </div>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="overflow-x-auto">
              {categories.map((cat) => (
                <TabsTrigger key={cat} value={cat} className="capitalize" data-testid={`tab-${cat}`}>
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <>
            <section className="mb-12">
              <Skeleton className="h-7 w-48 mb-6" />
              <div className="grid lg:grid-cols-2 gap-6">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="space-y-3">
                    <Skeleton className="aspect-[16/9] w-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <Skeleton className="h-7 w-56 mb-6" />
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="space-y-3">
                    <Skeleton className="aspect-[3/2] w-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            {/* Featured Posts */}
            {featuredPosts.length > 0 && selectedCategory === "all" && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold mb-6">Featured Stories</h2>
                <div className="grid lg:grid-cols-2 gap-6">
                  {featuredPosts.slice(0, 2).map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <FeaturedPostCard post={post as Post} formatDate={formatDate} />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* All Posts */}
            <section>
              <h2 className="text-2xl font-bold mb-6">
                {selectedCategory === "all" ? "Latest Articles" : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <PostCard post={post as Post} formatDate={formatDate} />
                  </motion.div>
                ))}
              </div>
            </section>

            {filteredPosts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No articles found</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FeaturedPostCard({
  post,
  formatDate,
}: {
  post: Post;
  formatDate: (date: Date | string | null) => string;
}) {
  return (
    <Link href={`/news/${post.slug || post.id}`}>
      <Card className="overflow-hidden group h-full bg-background" data-testid={`card-post-featured-${post.id}`}>
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          {post.coverUrl ? (
            <img
              src={resolveMediaUrl(post.coverUrl, "hero")}
              alt={post.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-muted" />
          )}
          {post.category && (
            <div className="absolute top-4 left-4">
              <span className="px-2 py-1 text-[10px] font-medium bg-background/90 text-foreground rounded-full uppercase tracking-wide border border-border/50">
                {post.category}
              </span>
            </div>
          )}
        </div>
        <CardContent className="p-5">
          <h3 className="text-xl md:text-2xl font-semibold tracking-tight leading-snug group-hover:text-primary transition-colors">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
              {post.excerpt}
            </p>
          )}
          <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(post.publishedAt ?? null)}
            </span>
            <span className="flex items-center gap-1 font-medium">
              Read
              <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function PostCard({
  post,
  formatDate,
}: {
  post: Post;
  formatDate: (date: Date | string | null) => string;
}) {
  return (
    <Link href={`/news/${post.slug || post.id}`}>
      <Card className="overflow-hidden group h-full bg-background" data-testid={`card-post-${post.id}`}>
        <div className="relative aspect-[3/2] overflow-hidden bg-muted">
          {post.coverUrl ? (
            <img
              src={resolveMediaUrl(post.coverUrl, "card")}
              alt={post.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-muted" />
          )}
          {post.category && (
            <div className="absolute top-3 left-3">
              <span className="px-2 py-1 text-[10px] font-medium bg-background/90 text-foreground rounded-full uppercase tracking-wide border border-border/50">
                {post.category}
              </span>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
              {post.excerpt}
            </p>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-4">
            <span>{formatDate(post.publishedAt ?? null)}</span>
            <span className="flex items-center gap-1 font-medium group-hover:text-foreground transition-colors">
              Read
              <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
