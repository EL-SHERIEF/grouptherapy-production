import { useEffect, useState, type RefObject } from "react";

type UseCarouselAutoplayOptions = {
  scrollRef: RefObject<HTMLElement>;
  enabled: boolean;
  intervalMs: number;
  scrollByPx?: number;
  threshold?: number;
};

export function useCarouselAutoplay({
  scrollRef,
  enabled,
  intervalMs,
  scrollByPx = 280,
  threshold = 0.25,
}: UseCarouselAutoplayOptions) {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsInView(!!entry?.isIntersecting);
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [scrollRef, threshold]);

  useEffect(() => {
    if (!enabled) return;
    if (!isInView) return;
    if (!intervalMs || intervalMs <= 0) return;

    const tick = () => {
      const el = scrollRef.current;
      if (!el) return;

      const scrollLeft = (el as any).scrollLeft as number;
      const scrollWidth = (el as any).scrollWidth as number;
      const clientWidth = (el as any).clientWidth as number;

      const isAtEnd = scrollLeft >= scrollWidth - clientWidth - 10;

      if (isAtEnd) {
        (el as any).scrollTo?.({ left: 0, behavior: "smooth" });
      } else {
        (el as any).scrollBy?.({ left: scrollByPx, behavior: "smooth" });
      }
    };

    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [enabled, intervalMs, isInView, scrollByPx, scrollRef]);

  return { isInView };
}
