import { useMemo, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Play, ArrowRight, Radio } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useRadio } from "@/lib/radio-context";
import { resolveMediaUrl } from "@/lib/media";
import { useQuery } from "@tanstack/react-query";
import { db, type SiteSettings } from "@/lib/database";

interface HeroProps {
  heroTag?: string;
  title?: string;
  subtitle?: string;
  backgroundImage?: string;
  backgroundVideo?: string;
  backgroundType?: "image" | "video";
  showRadio?: boolean;
  ctaText?: string;
  ctaLink?: string;
  heroStats?: { value: string; label: string }[];
}

export function ConfiguredPageHero({
  pageKey,
  title,
  subtitle,
  backgroundImage,
}: {
  pageKey: string;
  title: string;
  subtitle?: string;
  backgroundImage?: string;
}) {
  const { data: siteSettings } = useQuery<SiteSettings | null>({
    queryKey: ["siteSettings"],
    queryFn: () => db.siteSettings.get(),
  });

  const normalizedKey = (pageKey || "").trim() || "/";
  const override = siteSettings?.pageHeroOverrides?.[normalizedKey];

  return (
    <PageHero
      title={override?.title ?? title}
      subtitle={override?.subtitle ?? subtitle}
      backgroundImage={override?.backgroundImage ?? backgroundImage}
    />
  );
}

export function HeroSection({
  heroTag = "New: Finaly Launching our platform",
  title = "GROUPTHERAPY",
  subtitle = "Home of Artists. Built for Sound, Culture, and Community.",
  backgroundImage,
  backgroundVideo,
  backgroundType = "image",
  showRadio = true,
  ctaText = "Explore Releases",
  ctaLink = "/releases",
  heroStats,
}: HeroProps) {
  const { togglePlay, isPlaying } = useRadio();

  const titleParts = useMemo(() => {
    const raw = String(title || "").trim();
    if (!raw) return { lead: "", highlight: "" };

    const words = raw.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return { lead: words[0] ?? "", highlight: words.slice(1).join(" ") };
    }

    const therapyIndex = raw.toUpperCase().indexOf("THERAPY");
    if (therapyIndex > 0) {
      return { lead: raw.slice(0, therapyIndex), highlight: raw.slice(therapyIndex) };
    }

    return { lead: raw, highlight: "" };
  }, [title]);

  const displayHeroStats =
    heroStats && heroStats.length > 0
      ? heroStats
      : [
          { value: "50+", label: "Artists" },
          { value: "387+", label: "Releases" },
          { value: "24/7", label: "Radio" },
        ];

  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        {backgroundType === "video" && backgroundVideo ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src={backgroundVideo} type="video/mp4" />
          </video>
        ) : backgroundImage ? (
          <motion.img
            src={resolveMediaUrl(backgroundImage, "full")}
            alt=""
            className="w-full h-full object-cover"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1] }}
          />
        ) : (
          <div className="w-full h-full bg-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      </div>

      <motion.div
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.03]"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.03, 0.05, 0.03],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.02]"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.02, 0.04, 0.02],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      <div className="relative z-10 text-center px-6 md:px-8 mx-auto flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <motion.span
            className="px-4 py-1 rounded-full inline-block text-xs md:text-sm uppercase tracking-[0.25em] text-primary font-medium mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {heroTag}
          </motion.span>
        </motion.div>

        <motion.h1
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold tracking-[-0.04em] mb-8 leading-[0.9] w-fit mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          data-testid="text-hero-title"
        >
          <span className="text-foreground">{titleParts.lead}</span>
          {titleParts.highlight ? (
            <span className="gradient-text">{titleParts.highlight}</span>
          ) : null}
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl lg:text-xl text-muted-foreground font-light max-w-2xl mx-auto mb-12 leading-relaxed text-balance"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          data-testid="text-hero-subtitle"
        >
          {subtitle}
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {showRadio && (
            <Button
              size="lg"
              onClick={togglePlay}
              className={`min-w-[180px] h-14 text-base gap-3 rounded-full transition-all duration-300 ${
                isPlaying
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/25"
              }`}
              data-testid="button-hero-radio"
            >
              {isPlaying ? (
                <>
                  <Radio className="h-5 w-5" />
                  <span className="flex items-center gap-2">
                    Now Playing
                    <span className="flex gap-0.5">
                      {[1, 2, 3].map((i) => (
                        <motion.span
                          key={i}
                          className="w-0.5 h-3 bg-current rounded-full"
                          animate={{ scaleY: [1, 0.3, 1] }}
                          transition={{
                            duration: 0.5,
                            delay: i * 0.1,
                            repeat: Infinity,
                          }}
                        />
                      ))}
                    </span>
                  </span>
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 fill-current" />
                  Listen Live
                </>
              )}
            </Button>
          )}

          <Link href={ctaLink}>
            <Button
              size="lg"
              variant="outline"
              className="min-w-[180px] h-14 text-base gap-3 rounded-full border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
              data-testid="button-hero-cta"
            >
              {ctaText}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </motion.div>

      </div>

      <motion.div
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-3"
        >
          <span className="text-[0.5rem] uppercase tracking-[0.2em] text-muted-foreground/60">
            Scroll
          </span>
          <div className="w-5 h-8 border border-border/50 rounded-full flex justify-center pt-1.5">
            <motion.div
              animate={{ y: [0, 8, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-1 h-1 bg-primary rounded-full"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

export function PageHero({
  title,
  subtitle,
  backgroundImage,
}: {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[30vh] flex items-center justify-center overflow-hidden pt-20"
    >
      <div className="absolute inset-0 z-0">
        {backgroundImage ? (
          <motion.img
            src={resolveMediaUrl(backgroundImage, "hero")}
            alt=""
            className="w-full h-full object-cover"
            style={{ y: imageY, scale: imageScale }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-muted/30 to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />
      </div>

      <div className="relative z-10 text-center px-6 md:px-8 max-w-4xl mx-auto py-10">
        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-[-0.03em] mb-6 leading-[1.1]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          data-testid="text-page-title"
        >
          {title}
        </motion.h1>

        {subtitle && (
          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.15,
              duration: 0.6,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            data-testid="text-page-subtitle"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
    </section>
  );
}
