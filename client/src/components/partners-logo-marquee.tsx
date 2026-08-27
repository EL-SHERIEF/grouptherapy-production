import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/media";
import type { PartnerMarqueeItem } from "@/lib/database";

function useResizeObserverWidth(target: React.RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = target.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const ro = new ResizeObserver(() => {
      setWidth(el.offsetWidth);
    });

    ro.observe(el);
    setWidth(el.offsetWidth);

    return () => ro.disconnect();
  }, [target]);

  return width;
}

export function PartnersLogoMarquee({
  items,
  speed = 40,
  gap = 48,
  logoHeight = 32,
  useMutedBg = false,
  className,
}: {
  items: PartnerMarqueeItem[];
  speed?: number;
  gap?: number;
  logoHeight?: number;
  useMutedBg?: boolean;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const containerWidth = useResizeObserverWidth(containerRef);
  const trackWidth = useResizeObserverWidth(trackRef);

  const normalizedItems = useMemo(() => {
    return (items || [])
      .map((i) => ({
        imageUrl: (i?.imageUrl || "").trim(),
        alt: (i?.alt || "Partner logo").trim() || "Partner logo",
        href: (i?.href || "").trim(),
      }))
      .filter((i) => i.imageUrl.length > 0);
  }, [items]);

  const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    normalizedItems.forEach((item) => {
      if (aspectRatios[item.imageUrl]) return;
      const img = new Image();
      img.onload = () => {
        const ratio = img.naturalWidth > 0 && img.naturalHeight > 0 ? img.naturalWidth / img.naturalHeight : 1;
        setAspectRatios((prev) => (prev[item.imageUrl] ? prev : { ...prev, [item.imageUrl]: ratio || 1 }));
      };
      img.src = resolveMediaUrl(item.imageUrl, "thumb");
    });
  }, [aspectRatios, normalizedItems]);

  if (normalizedItems.length === 0) return null;

  const duration = Math.max(8, Math.min(120, speed || 40));
  const gapPx = Math.max(8, Math.min(160, gap || 48));
  const logoHeightPx = Math.max(18, Math.min(56, logoHeight || 32));

  const needsDuplicate = trackWidth > 0 && containerWidth > 0 ? trackWidth < containerWidth * 1.2 : true;
  const repeatCount = needsDuplicate ? 3 : 2;
  const visibleItems = Array.from({ length: repeatCount }, () => normalizedItems).flat();
  const shiftDistance = trackWidth > 0 ? trackWidth / repeatCount : 600;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full overflow-hidden",
        useMutedBg ? "bg-muted/30" : "bg-background",
        className
      )}
      style={{
        WebkitMaskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
        maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
      }}
    >
      <motion.div
        ref={trackRef}
        className="flex w-max items-center py-5 px-6"
        style={{ gap: gapPx }}
        animate={
          reducedMotion
            ? undefined
            : {
                x: [0, -shiftDistance],
              }
        }
        transition={
          reducedMotion
            ? undefined
            : {
                duration,
                ease: "linear",
                repeat: Infinity,
              }
        }
      >
        {visibleItems.map((item, idx) => {
          const ratio = aspectRatios[item.imageUrl] || 3;
          const minWidthPx = Math.round(logoHeightPx * 2);
          const maxWidthPx = Math.round(logoHeightPx * 7);
          const img = (
            <div
              className="flex items-center justify-center"
              style={{
                height: `${logoHeightPx}px`,
                aspectRatio: String(ratio),
                minWidth: `${minWidthPx}px`,
                maxWidth: `${maxWidthPx}px`,
              }}
            >
              <img
                src={resolveMediaUrl(item.imageUrl, "thumb")}
                alt={item.alt}
                className="h-full w-full object-contain opacity-40 grayscale brightness-0 dark:invert"
                loading="lazy"
              />
            </div>
          );

          return (
            <div key={`${item.imageUrl}-${idx}`} className="flex items-center">
              {item.href ? (
                <a href={item.href} target="_blank" rel="noreferrer" className="inline-flex items-center">
                  {img}
                </a>
              ) : (
                img
              )}
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
