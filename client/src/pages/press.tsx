import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ConfiguredPageHero } from "@/components/hero-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, FileText, Loader2 } from "lucide-react";
import { db, type PressAsset } from "@/lib/database";
import { resolveMediaUrl } from "@/lib/media";

export default function PressPage() {
  const {
    data: pressAssets = [],
    isLoading,
    error,
  } = useQuery<PressAsset[]>({
    queryKey: ["pressAssets", "published"],
    queryFn: () => db.pressAssets.getPublished(),
  });

  const grouped = useMemo(() => {
    return pressAssets.reduce<Record<string, PressAsset[]>>((acc, asset) => {
      const key = (asset.category || "other").toLowerCase();
      if (!acc[key]) acc[key] = [];
      acc[key].push(asset);
      return acc;
    }, {});
  }, [pressAssets]);

  const orderedCategories = useMemo(() => {
    const preferred = ["logo", "photo", "document", "video", "audio", "other"];
    const keys = Object.keys(grouped);
    return [...preferred.filter((k) => keys.includes(k)), ...keys.filter((k) => !preferred.includes(k))];
  }, [grouped]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Unable to load Press</h1>
          <p className="text-muted-foreground">Please try again in a moment.</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen">
      <ConfiguredPageHero
        pageKey="/press"
        title="Press"
        subtitle="Download official assets and media for GroupTherapy Records"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {pressAssets.length === 0 ? (
          <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
            No press assets available.
          </div>
        ) : (
          <div className="space-y-10">
            {orderedCategories.map((category) => {
              const assets = grouped[category] || [];
              if (assets.length === 0) return null;

              return (
                <section key={category} className="space-y-4">
                  <h2 className="text-xl font-semibold tracking-tight capitalize">{category}</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {assets.map((asset) => {
                      const isImage = asset.category === "logo" || asset.category === "photo";

                      return (
                        <Card key={asset.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-16 h-16 bg-muted rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {isImage && asset.fileUrl ? (
                                  <img
                                    src={resolveMediaUrl(asset.fileUrl, "thumb")}
                                    alt={asset.title}
                                    className="w-full h-full object-contain p-1"
                                  />
                                ) : (
                                  <FileText className="h-7 w-7 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm truncate">{asset.title}</div>
                                {asset.description ? (
                                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{asset.description}</div>
                                ) : null}
                              </div>
                            </div>

                            {asset.fileUrl ? (
                              <div className="mt-4">
                                <a href={asset.fileUrl} className="inline-flex">
                                  <Button variant="outline" size="sm" className="gap-2">
                                    <Download className="h-4 w-4" />
                                    Download
                                  </Button>
                                </a>
                              </div>
                            ) : null}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
