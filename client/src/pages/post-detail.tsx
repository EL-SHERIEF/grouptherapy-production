import { useRoute, Link } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, Calendar, User, Tag, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef } from "react";
import { db, type Post } from "@/lib/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { resolveMediaUrl } from "@/lib/media";
import { sanitizeHtml } from "@/lib/sanitize-html";

function renderMarkdown(markdown: string): string {
  if (!markdown) return "";

  let html = markdown;

  html = html.replace(
    /^### (.+)$/gm,
    '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>',
  );
  html = html.replace(
    /^## (.+)$/gm,
    '<h2 class="text-3xl font-semibold mt-8 mb-4 pt-4">$1</h2>',
  );
  html = html.replace(
    /^# (.+)$/gm,
    '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>',
  );

  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-primary underline hover:no-underline">$1</a>',
  );

  html = html.replace(
    /^(\d+)\. (.+)$/gm,
    '<li class="ml-4 list-decimal">$2</li>',
  );
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$2</li>');

  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => {
    if (match.includes("list-decimal")) {
      return `<ol class="my-4 space-y-2">${match}</ol>`;
    }
    return `<ul class="my-4 space-y-2">${match}</ul>`;
  });

  html = html.replace(/\n\n/g, '</p><p class="mb-4 leading-relaxed">');
  html = `<p class="mb-4 leading-relaxed">${html}</p>`;

  html = html.replace(/<p class="mb-4 leading-relaxed"><\/p>/g, "");
  html = html.replace(/<p class="mb-4 leading-relaxed">(<h[1-3])/g, "$1");
  html = html.replace(/(<\/h[1-3]>)<\/p>/g, "$1");
  html = html.replace(/<p class="mb-4 leading-relaxed">(<[uo]l)/g, "$1");
  html = html.replace(/(<\/[uo]l>)<\/p>/g, "$1");

  return html;
}

function estimateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

export default function PostDetailPage() {
  const [, params] = useRoute("/news/:slug");
  const slug = params?.slug;

  const heroRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroImageY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const heroImageScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  const { data: post, isLoading } = useQuery<Post | null>({
    queryKey: ["post", slug],
    queryFn: async () => {
      if (!slug) return null;
      const bySlug = await db.posts.getBySlug(slug);
      if (bySlug) return bySlug;
      return db.posts.getById(slug);
    },
    enabled: !!slug,
  });

  const { data: relatedPosts } = useQuery<Post[]>({
    queryKey: ["related-posts", post?.category],
    queryFn: async () => {
      if (!post?.category) return [];
      const candidates = await db.posts.getPublishedPage(36, 0);
      return candidates
        .filter(
          (p) =>
            p.published && p.category === post.category && p.id !== post.id,
        )
        .slice(0, 3);
    },
    enabled: !!post?.category,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
          <Link href="/news">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to News
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const readTime = post.content ? estimateReadTime(post.content) : 0;

  return (
    <div className="min-h-screen">
      <div ref={heroRef} className="relative">
        {post.coverUrl && (
          <div className="absolute inset-0 h-[50vh] overflow-hidden">
            <motion.img
              src={resolveMediaUrl(post.coverUrl, "full")}
              alt={post.title}
              className="w-full h-full object-cover"
              style={{ y: heroImageY, scale: heroImageScale }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
          </div>
        )}

        <div
          className={`relative pt-24 pb-12 px-4 sm:px-6 lg:px-8 ${post.coverUrl ? "" : "bg-muted/30"}`}
        >
          <div className="max-w-4xl mx-auto">
            <Link href="/news">
              <Button
                variant="ghost"
                className={`mb-8 ${post.coverUrl ? "text-white hover:text-white hover:bg-white/10" : ""}`}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to News
              </Button>
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Badge variant="secondary" className="mb-4">
                {post.category}
              </Badge>

              <h1
                className={`text-3xl md:text-5xl font-bold mb-6 ${post.coverUrl ? "text-white" : ""}`}
              >
                {post.title}
              </h1>

              <div
                className={`flex flex-wrap items-center gap-6 ${post.coverUrl ? "text-white/80" : "text-muted-foreground"}`}
              >
                {post.authorName && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{post.authorName}</span>
                  </div>
                )}
                {(post.publishedAt || post.createdAt) && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(
                        new Date(post.publishedAt || post.createdAt),
                        "MMMM d, yyyy",
                      )}
                    </span>
                  </div>
                )}
                {readTime > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{readTime} min read</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <article className="md:col-span-3">
            {post.excerpt && (
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed z-10 relative">
                {post.excerpt}
              </p>
            )}

            {post.content && (
              <div
                className="prose prose-lg dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(renderMarkdown(post.content)),
                }}
              />
            )}

            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Tags</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, i) => (
                    <Badge key={i} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </article>

          <aside className="space-y-3 z-10 w-[300px] relative">
            {relatedPosts && relatedPosts.length > 0 && (
              <div className="bg-card/50 border border-border/50 rounded-2xl p-5 w-full relative sm:sticky top-[70px]">
                <h3 className="font-semibold text-lg mb-5">Related Articles</h3>
                <div className="space-y-4">
                  {relatedPosts.map((relatedPost) => (
                    <Link
                      key={relatedPost.id}
                      href={`/news/${relatedPost.slug || relatedPost.id}`}
                    >
                      <div className="group p-3 -mx-3 rounded-xl hover:bg-muted/50 transition-colors">
                        <div className="flex gap-3">
                          {relatedPost.coverUrl && (
                            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                              <img
                                src={resolveMediaUrl(relatedPost.coverUrl, "thumb")}
                                alt={relatedPost.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                              {relatedPost.title}
                            </h4>
                            {relatedPost.publishedAt && (
                              <p className="text-xs text-muted-foreground mt-1.5">
                                {format(
                                  new Date(relatedPost.publishedAt),
                                  "MMM d, yyyy",
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
