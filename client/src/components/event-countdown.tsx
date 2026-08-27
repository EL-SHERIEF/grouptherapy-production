import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface EventCountdownProps {
  targetDate: Date | string;
  variant?: "compact" | "default" | "large";
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const now = new Date().getTime();
  const target = targetDate.getTime();
  const difference = target - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: difference };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    total: difference,
  };
}

export function EventCountdown({ targetDate, variant = "default", className }: EventCountdownProps) {
  const date = typeof targetDate === "string" ? new Date(targetDate) : targetDate;
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(date));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(date));
    }, 1000);

    return () => clearInterval(timer);
  }, [date]);

  const isPast = timeLeft.total < 0;
  const isStarted = timeLeft.total <= 0 && timeLeft.total > -1000 * 60 * 60 * 24;

  if (isPast && !isStarted) {
    return (
      <div className={cn("text-muted-foreground", className)}>
        <span className="font-medium">Event Ended</span>
      </div>
    );
  }

  if (isStarted || (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0)) {
    return (
      <div className={cn("text-primary font-medium", className)}>
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-1"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          Event Started
        </motion.span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("font-mono text-sm text-primary tabular-nums", className)}>
        <span className="inline-block min-w-[120px]">
          {timeLeft.days > 0 && <span>{timeLeft.days}d </span>}
          {(timeLeft.days > 0 || timeLeft.hours > 0) && <span>{timeLeft.hours}h </span>}
          <span>{timeLeft.minutes}m </span>
          <span>{timeLeft.seconds}s</span>
        </span>
      </div>
    );
  }

  if (variant === "large") {
    return (
      <div className={cn("grid grid-cols-4 gap-4 max-w-md", className)}>
        {[
          { label: "Days", value: timeLeft.days },
          { label: "Hours", value: timeLeft.hours },
          { label: "Minutes", value: timeLeft.minutes },
          { label: "Seconds", value: timeLeft.seconds },
        ].map((item) => (
          <div key={item.label} className="text-center bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={item.value}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="text-3xl md:text-4xl font-bold text-white"
              >
                {item.value}
              </motion.div>
            </AnimatePresence>
            <div className="text-xs text-white/60 uppercase tracking-wider">{item.label}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { label: "d", value: timeLeft.days },
          { label: "h", value: timeLeft.hours },
          { label: "m", value: timeLeft.minutes },
          { label: "s", value: timeLeft.seconds },
        ].map((item, index) => (
          <div key={item.label} className="bg-primary/10 rounded-md px-2 py-1.5 min-w-[40px]">
            <span className="block text-lg font-bold text-primary tabular-nums">
              {item.value}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function useCountdown(targetDate: Date | string) {
  const date = typeof targetDate === "string" ? new Date(targetDate) : targetDate;
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(date));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(date));
    }, 1000);

    return () => clearInterval(timer);
  }, [date]);

  return {
    ...timeLeft,
    isPast: timeLeft.total < 0,
    isStarted: timeLeft.total <= 0 && timeLeft.total > -1000 * 60 * 60 * 24,
  };
}
