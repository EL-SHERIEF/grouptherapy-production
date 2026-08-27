import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/database";
import type { StaticPage } from "@/lib/database";
import { Loader2 } from "lucide-react";
import { sanitizeHtml } from "@/lib/sanitize-html";

export default function StaticPageView() {
  const [, params] = useRoute("/:slug");
  const slug = params?.slug || "";

  const normalizedSlug =
    slug === "privacy"
      ? "privacy-policy"
      : slug === "terms"
      ? "terms-of-service"
      : slug === "cookies"
      ? "cookie-policy"
      : slug;

  const {
    data: page,
    isLoading,
    error,
  } = useQuery<StaticPage | null>({
    queryKey: ["staticPage", normalizedSlug],
    queryFn: () => db.staticPages.getBySlug(normalizedSlug),
    enabled: !!normalizedSlug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 my-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">{page.title}</h1>
          <div
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }}
          />
          {page.updatedAt && (
            <p className="mt-8 text-sm text-muted-foreground">
              Last updated: {new Date(page.updatedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
