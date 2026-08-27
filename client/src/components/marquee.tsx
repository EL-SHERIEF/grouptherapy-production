import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Calendar,
  Disc3,
  Globe,
  Headphones,
  Heart,
  Mic,
  Music2,
  Play,
  Radio,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarqueeItem } from "@/lib/database";

const iconMap: Record<string, LucideIcon> = {
  Disc3,
  Radio,
  Music2,
  Users,
  Play,
  Headphones,
  Mic,
  Heart,
  Star,
  Globe,
  Calendar,
  Trophy,
};

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

export function Marquee({
  items,
  speed = 40,
  className,
}: {
  items: MarqueeItem[];
  speed?: number;
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
        text: (i?.text || "").trim(),
        icon: (i?.icon || "").trim(),
      }))
      .filter((i) => i.text.length > 0);
  }, [items]);

  if (normalizedItems.length === 0) return null;

  const duration = Math.max(8, Math.min(120, speed || 40));

  const needsDuplicate = trackWidth > 0 && containerWidth > 0 ? trackWidth < containerWidth * 1.2 : true;
  const repeatCount = needsDuplicate ? 3 : 2;
  const visibleItems = Array.from({ length: repeatCount }, () => normalizedItems).flat();
  const shiftDistance = trackWidth > 0 ? trackWidth / repeatCount : 600;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full overflow-hidden border-y border-border/40",
        className
      )}
      style={{
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 30%, black 70%, transparent)",
        maskImage: "linear-gradient(to right, transparent, black 30%, black 70%, transparent)",
      }}
    >
      <motion.div
        ref={trackRef}
        className="flex w-max items-center gap-8 py-2.5 px-6"
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
          const Icon = iconMap[item.icon] || Disc3;
          return (
            <div key={`${item.text}-${idx}`} className="flex items-center gap-3 text-sm text-muted-foreground">
              <Icon className="h-4 w-4 text-muted-foreground/80" />
              <span className="whitespace-nowrap tracking-wide">{item.text}</span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
