import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Radio,
  MessageCircle,
  ChevronUp,
  ChevronDown,
  Clock,
  Users,
  RefreshCw,
  Wifi,
  WifiOff,
  Minimize2,
  Maximize2,
  ExternalLink,
  Music,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useRadio } from "@/lib/radio-context";
import { Link } from "wouter";
import { resolveMediaUrl } from "@/lib/media";

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatCountdown(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

function WaveformAnimation({
  isPlaying,
  className,
}: {
  isPlaying: boolean;
  className?: string;
}) {
  const bars = 5;

  return (
    <div className={cn("flex items-end gap-[2px] h-4", className)}>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] bg-primary rounded-full"
          animate={
            isPlaying
              ? {
                  height: ["40%", "100%", "60%", "90%", "40%"],
                }
              : {
                  height: "40%",
                }
          }
          transition={
            isPlaying
              ? {
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeInOut",
                }
              : {}
          }
          style={{ minHeight: "4px" }}
        />
      ))}
    </div>
  );
}

function AnimatedListenerCount({ count }: { count: number }) {
  const [displayCount, setDisplayCount] = useState(count);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (count !== displayCount) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setDisplayCount(count);
        setIsAnimating(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [count, displayCount]);

  return (
    <motion.span
      animate={isAnimating ? { scale: [1, 1.2, 1] } : {}}
      transition={{ duration: 0.3 }}
      className="tabular-nums"
    >
      {displayCount.toLocaleString()}
    </motion.span>
  );
}

function SyncStatusIndicator({
  isSynced,
  isBuffering,
  isConnected,
}: {
  isSynced: boolean;
  isBuffering: boolean;
  isConnected: boolean;
}) {
  if (isBuffering) {
    return (
      <div className="flex items-center gap-1.5 text-amber-500">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="h-3 w-3" />
        </motion.div>
        <span className="text-[10px] font-medium uppercase">Syncing</span>
      </div>
    );
  }

  if (isSynced) {
    return (
      <div className="flex items-center gap-1.5 text-emerald-500">
        <Wifi className="h-3 w-3" />
        <span className="text-[10px] font-medium uppercase">Synced</span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-1.5 text-blue-500">
        <Wifi className="h-3 w-3" />
        <span className="text-[10px] font-medium uppercase">Online</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <WifiOff className="h-3 w-3" />
      <span className="text-[10px] font-medium uppercase">Offline</span>
    </div>
  );
}

function ProgressBar({
  progress,
  duration,
  onSeek,
  canSeek,
  isLive,
}: {
  progress: number;
  duration: number;
  onSeek: (time: number) => void;
  canSeek: boolean;
  isLive: boolean;
}) {
  const percentage = duration > 0 ? (progress / duration) * 100 : 0;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!canSeek || duration <= 0) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = x / rect.width;
      const newTime = percent * duration;
      onSeek(newTime);
    },
    [canSeek, duration, onSeek],
  );

  return (
    <div
      className={cn(
        "relative h-1 w-full bg-muted rounded-full overflow-hidden group",
        canSeek && "cursor-pointer hover:h-2 transition-all",
      )}
      onClick={handleClick}
    >
      <motion.div
        className={cn(
          "absolute inset-y-0 left-0 rounded-full",
          isLive ? "bg-primary" : "bg-primary/80",
        )}
        style={{ width: `${Math.min(percentage, 100)}%` }}
        transition={{ duration: 0.1 }}
      />
      {isLive && (
        <motion.div
          className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary"
          animate={{
            opacity: [1, 0.5, 1],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      {canSeek && (
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
          style={{ left: `calc(${Math.min(percentage, 100)}% - 6px)` }}
        />
      )}
    </div>
  );
}

export function GlobalRadioPlayer() {
  const {
    isPlaying,
    volume,
    currentTrack,
    isLive,
    isExpanded,
    progress,
    duration,
    listenerCount,
    togglePlay,
    setVolume,
    setExpanded,
    hasScheduledShow,
    hasAudioUrl,
    currentShow,
    countdownSeconds,
    isBuffering,
    isSynced,
    isConnected,
    recentStreams,
    seek,
    syncToServerTime,
    currentSession,
    playStream,
  } = useRadio();

  const [isMiniMode, setIsMiniMode] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);

  const isShowLive = isLive && currentShow;
  const isUpcoming =
    !isLive && currentShow && countdownSeconds !== null && countdownSeconds > 0;
  const canPlay = hasAudioUrl && !isUpcoming;
  const canSeek = !currentSession && !isLive;

  const recentTracks = useMemo(() => {
    return recentStreams.map((track) => ({
      id: track.id,
      title: track.title,
      artist: track.artist,
      coverUrl: track.coverUrl,
      showId: track.showId,
    }));
  }, [recentStreams]);

  useEffect(() => {
    if (!hasScheduledShow) {
      document.documentElement.style.setProperty("--gt-radio-player-offset", "24px");
      return;
    }

    const el = playerContainerRef.current;
    if (!el) {
      document.documentElement.style.setProperty(
        "--gt-radio-player-offset",
        isMiniMode ? "96px" : "80px",
      );
      return;
    }

    const update = () => {
      const height = el.getBoundingClientRect().height;
      const extraBottom = isMiniMode ? 16 : 0;
      document.documentElement.style.setProperty(
        "--gt-radio-player-offset",
        `${Math.max(0, Math.round(height + extraBottom))}px`,
      );
    };

    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(el);

    return () => {
      ro.disconnect();
    };
  }, [hasScheduledShow, isMiniMode, isExpanded]);

  if (!hasScheduledShow) {
    return null;
  }

  if (isMiniMode) {
    return (
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="fixed bottom-4 right-4 z-50"
        ref={playerContainerRef}
      >
        <motion.div
          className={cn(
            "flex items-center gap-2 p-2 rounded-full bg-card/85 backdrop-blur-lg border border-border shadow-lg",
            isPlaying && "ring-2 ring-primary/50",
          )}
          whileHover={{ scale: 1.05 }}
        >
          <Button
            size="icon"
            variant="ghost"
            onClick={() => window.dispatchEvent(new Event("gt:open-chat"))}
            className="h-11 w-11 rounded-full"
            aria-label="Open chat"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant={isPlaying ? "default" : "secondary"}
            onClick={togglePlay}
            className="h-10 w-10 rounded-full"
            disabled={!canPlay}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>
          {isPlaying && <WaveformAnimation isPlaying={isPlaying} />}
          {isShowLive && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsMiniMode(false)}
            className="h-8 w-8"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-card/85 backdrop-blur-lg border-t border-border transition-all duration-300",
          isExpanded
            ? "h-auto pb-[env(safe-area-inset-bottom)]"
            : "h-[calc(5rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)]",
        )}
        ref={playerContainerRef}
      >
        {!isLive && canSeek && (
          <ProgressBar
            progress={progress}
            duration={duration}
            onSeek={seek}
            canSeek={canSeek}
            isLive={false}
          />
        )}

        <div className="max-w-7xl mx-auto px-4 h-full">
          <div className="flex items-center justify-between py-2 sm:py-3 gap-3 sm:gap-4 h-full">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <motion.div
                className={cn(
                  "relative w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0",
                  isPlaying &&
                    "ring-2 ring-primary shadow-lg shadow-primary/20",
                )}
                animate={isPlaying ? { scale: [1, 1.02, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {currentTrack?.coverUrl ? (
                  <img
                    src={resolveMediaUrl(currentTrack.coverUrl, "thumb")}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Radio
                    className={cn("h-6 w-6", isPlaying && "text-primary")}
                  />
                )}
                {isPlaying && (
                  <motion.div
                    className="absolute inset-0 bg-primary/20"
                    animate={{ opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                {isUpcoming && (
                  <div className="absolute top-1.5 left-1.5 h-2 w-2 rounded-full bg-amber-500 shadow-sm sm:hidden" />
                )}
              </motion.div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  {isShowLive && (
                    <span
                      className="h-2 w-2 rounded-full bg-red-500 shadow-sm animate-pulse sm:hidden flex-shrink-0"
                      aria-label="Live"
                      title="Live"
                    />
                  )}
                  <p
                    className="text-[13px] sm:text-sm font-semibold truncate"
                    data-testid="text-radio-title"
                  >
                    {currentTrack?.title || currentShow?.title || "Radio Show"}
                  </p>
                  {isShowLive && (
                    <motion.span
                      className="hidden sm:flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase bg-red-500 text-white rounded-sm"
                      animate={{ opacity: [1, 0.7, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      Live
                    </motion.span>
                  )}
                  {isUpcoming && (
                    <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase bg-amber-500 text-white rounded-sm">
                      <Clock className="w-2.5 h-2.5" />
                      Upcoming
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-0.5">
                  <p
                    className="text-xs text-muted-foreground truncate"
                    data-testid="text-radio-artist"
                  >
                    {isUpcoming && countdownSeconds !== null
                      ? `Starts in ${formatCountdown(countdownSeconds)}`
                      : currentTrack?.artist || currentShow?.hostName || "Host"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <AnimatedListenerCount count={listenerCount} />
                <span className="text-xs text-muted-foreground">listening</span>
              </div>

              <div className="hidden md:block">
                <SyncStatusIndicator
                  isSynced={isSynced}
                  isBuffering={isBuffering}
                  isConnected={isConnected}
                />
              </div>

              {currentSession && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={syncToServerTime}
                  className="h-8 w-8 hidden sm:flex"
                  title="Re-sync with server"
                >
                  <RefreshCw
                    className={cn("h-4 w-4", isBuffering && "animate-spin")}
                  />
                </Button>
              )}

              <Button
                size="icon"
                variant="ghost"
                onClick={() => window.dispatchEvent(new Event("gt:open-chat"))}
                className="h-11 w-11 rounded-full"
                title="Open chat"
                aria-label="Open chat"
              >
                <MessageCircle className="h-5 w-5" />
              </Button>

              <Button
                size="icon"
                variant={isPlaying ? "default" : "secondary"}
                onClick={togglePlay}
                className="h-11 w-11 rounded-full shadow-lg"
                disabled={!canPlay}
                data-testid="button-radio-play"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </Button>

              <div className="hidden sm:flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setVolume(volume > 0 ? 0 : 0.7)}
                  disabled={!canPlay}
                  className="h-8 w-8"
                  data-testid="button-radio-mute"
                >
                  {volume === 0 ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <Slider
                  value={[volume * 100]}
                  onValueChange={([val]) =>
                    val !== undefined && setVolume(val / 100)
                  }
                  max={100}
                  step={1}
                  className="w-20"
                  disabled={!canPlay}
                  data-testid="slider-radio-volume"
                />
              </div>

              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsMiniMode(true)}
                  className="h-8 w-8 hidden sm:flex"
                  title="Mini mode"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setExpanded(!isExpanded)}
                  className="h-8 w-8"
                  data-testid="button-radio-expand"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-border overflow-hidden"
              >
                <div className="py-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          <AnimatedListenerCount count={listenerCount} />{" "}
                          listeners
                        </span>
                      </div>

                      <SyncStatusIndicator
                        isSynced={isSynced}
                        isBuffering={isBuffering}
                        isConnected={isConnected}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      {currentSession && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={syncToServerTime}
                          className="gap-2"
                        >
                          <RefreshCw
                            className={cn(
                              "h-3 w-3",
                              isBuffering && "animate-spin",
                            )}
                          />
                          Re-sync
                        </Button>
                      )}

                      <Link href="/radio">
                        <Button size="sm" variant="outline" className="gap-2">
                          <ExternalLink className="h-3 w-3" />
                          Full Radio Page
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {currentShow?.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {currentShow.description}
                    </p>
                  )}

                  {recentTracks.length > 0 && (
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-md sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                          Recent Streams
                        </span>
                        <Link href="/radio">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs gap-1"
                          >
                            View All
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                        {recentTracks.slice(0, 5).map((track, i) => (
                          <motion.div
                            key={track.id || i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const stream = recentStreams[i];
                              if (stream) {
                                playStream(stream);
                              } else {
                                console.warn("No stream found at index:", i);
                              }
                            }}
                            className="flex items-center gap-2 flex-shrink-0 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer group"
                          >
                            <div className="relative w-10 h-10 rounded-md bg-muted overflow-hidden">
                              {track.coverUrl ? (
                                <img
                                  src={resolveMediaUrl(track.coverUrl, "thumb")}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Music className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play className="h-4 w-4 text-white" />
                              </div>
                            </div>
                            <div className="max-w-[120px]">
                              <p className="text-md sm:text-sm font-medium truncate">
                                {track.title}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {track.artist}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex sm:hidden items-center gap-3 pt-2 border-t border-border">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setVolume(volume > 0 ? 0 : 0.7)}
                      disabled={!canPlay}
                      className="h-8 w-8"
                    >
                      {volume === 0 ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                    <Slider
                      value={[volume * 100]}
                      onValueChange={([val]) =>
                        val !== undefined && setVolume(val / 100)
                      }
                      max={100}
                      step={1}
                      className="flex-1"
                      disabled={!canPlay}
                    />
                    <span className="text-xs text-muted-foreground w-8 text-right">
                      {Math.round(volume * 100)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
