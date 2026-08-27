import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  subscribeToRadioMetadata,
  subscribeToListenerCount,
  trackListener,
  RadioMetadata,
  subscribeToCurrentSession,
  RadioSession,
  subscribeToServerTimeOffset,
  restartSession,
  endRadioSession,
  isFirebaseConnected,
} from "./firebase";
import { db, RadioShow, RadioTrack as DbRadioTrack } from "./database";

interface CurrentTrack {
  title: string;
  artist: string;
  coverUrl?: string;
  showName?: string;
  hostName?: string;
  audioUrl?: string;
}

interface RadioContextType {
  isPlaying: boolean;
  volume: number;
  currentTrack: CurrentTrack | null;
  isLive: boolean;
  isExpanded: boolean;
  progress: number;
  duration: number;
  listenerCount: number;
  hasScheduledShow: boolean;
  hasAudioUrl: boolean;
  currentShow: RadioShow | null;
  nextShowTime: Date | null;
  countdownSeconds: number | null;
  serverTimeOffset: number;
  currentSession: RadioSession | null;
  autoPlayEnabled: boolean;
  isBuffering: boolean;
  isSynced: boolean;
  isConnected: boolean;
  recentStreams: DbRadioTrack[];
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  setExpanded: (expanded: boolean) => void;
  setCurrentTrack: (track: CurrentTrack) => void;
  seek: (time: number) => void;
  enableAutoPlay: () => void;
  syncToServerTime: () => void;
  playStream: (stream: DbRadioTrack) => void;
}

const RadioContext = createContext<RadioContextType | undefined>(undefined);

const FALLBACK_STREAM_URL = null;
const SYNC_THRESHOLD_SECONDS = 0.5;
const SYNC_SOFT_THRESHOLD_SECONDS = 0.12;
const SYNC_INTERVAL_MS = 1000;
const MAX_PLAYBACK_RATE_ADJUST = 0.03;

function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

function getCurrentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export function RadioProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.7);
  const [isExpanded, setExpanded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [listenerCount, setListenerCount] = useState(127);
  const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [hasScheduledShow, setHasScheduledShow] = useState(false);
  const [currentShow, setCurrentShow] = useState<RadioShow | null>(null);
  const [nextShowTime, setNextShowTime] = useState<Date | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const [currentSession, setCurrentSession] = useState<RadioSession | null>(
    null,
  );
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [recentStreams, setRecentStreams] = useState<DbRadioTrack[]>([]);
  const [pendingAutoPlay, setPendingAutoPlay] = useState(false);
  const [scheduledStartPosition, setScheduledStartPosition] = useState<
    number | null
  >(null);

  useEffect(() => {
    setIsConnected(isFirebaseConnected());
  }, []);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isLiveSessionRef = useRef<boolean>(false);

  useEffect(() => {
    const unsubscribe = subscribeToServerTimeOffset((offset) => {
      setServerTimeOffset(offset);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchRecentStreams() {
      try {
        const streams = await db.radioTracks.getRecent(20);
        setRecentStreams(streams);
      } catch (error) {
        console.error("Failed to fetch recent streams:", error);
      }
    }
    fetchRecentStreams();
    const interval = setInterval(fetchRecentStreams, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
      }
    };

    const events = ["click", "scroll", "touchstart", "keydown"];
    events.forEach((event) => {
      window.addEventListener(event, handleInteraction, {
        once: true,
        passive: true,
      });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleInteraction);
      });
    };
  }, [hasInteracted]);

  useEffect(() => {
    if (hasInteracted && pendingAutoPlay && audioUrl && !isPlaying) {
      setPendingAutoPlay(false);
      if (audioRef.current) {
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
    }
  }, [hasInteracted, pendingAutoPlay, audioUrl, isPlaying]);

  useEffect(() => {
    if (
      hasInteracted &&
      autoPlayEnabled &&
      audioUrl &&
      !isPlaying &&
      currentSession
    ) {
      if (audioRef.current) {
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
    }
  }, [hasInteracted, autoPlayEnabled, audioUrl, isPlaying, currentSession]);

  useEffect(() => {
    const unsubscribe = subscribeToCurrentSession((session) => {
      const previousSession = currentSession;
      setCurrentSession(session);

      if (session && session.isActive) {
        isLiveSessionRef.current = true;
        setIsSynced(false);

        setAudioUrl(session.audioUrl);
        setCurrentTrack({
          title: session.showName,
          artist: session.hostName || "Live",
          coverUrl: session.coverUrl,
          showName: session.showName,
          hostName: session.hostName,
        });
        setIsLive(true);
        setHasScheduledShow(true);
        setDuration(session.duration);

        if (hasInteracted && autoPlayEnabled) {
          setPendingAutoPlay(true);
        }

        if (
          previousSession &&
          previousSession.startedAt !== session.startedAt
        ) {
          setIsSynced(false);
          setProgress(0);
        }
      } else {
        isLiveSessionRef.current = false;
        if (previousSession && previousSession.isActive) {
          setIsPlaying(false);
          setProgress(0);
          setIsLive(false);
        }
      }
    });

    return () => unsubscribe();
  }, [hasInteracted, autoPlayEnabled, currentSession]);

  useEffect(() => {
    async function fetchAndProcessShows() {
      if (currentSession && currentSession.isActive) {
        return;
      }

      try {
        const shows = await db.radioShows.getAll();
        const today = new Date().getDay();
        const currentMinutes = getCurrentMinutes();

        const todayShows = shows.filter(
          (show) =>
            show.published &&
            show.dayOfWeek === today &&
            (show.streamUrl || show.recordedUrl),
        );

        if (todayShows.length === 0) {
          setHasScheduledShow(false);
          setCurrentShow(null);
          setNextShowTime(null);
          setCountdownSeconds(null);
          setAudioUrl(null);
          setCurrentTrack({
            title: "GroupTherapy Radio",
            artist: "24/7 Mix",
          });
          return;
        }

        // Check if today has 24-hour repeat enabled
        const is24hRepeatDay =
          todayShows.length > 0 && todayShows.every(show => show.repeat24h);

        let liveShow = null;
        
        if (is24hRepeatDay) {
          // For 24-hour repeat days, rotate through shows based on current time
          const publishedShows = todayShows.filter(show => show.published);
          if (publishedShows.length > 0) {
            // Calculate which show should be "current" based on time of day
            const totalMinutesInDay = 24 * 60;
            const currentMinutes = getCurrentMinutes();
            const minutesPerShow = Math.floor(totalMinutesInDay / publishedShows.length);
            const currentShowIndex = Math.floor(currentMinutes / minutesPerShow) % publishedShows.length;
            liveShow = publishedShows[currentShowIndex];
          }
        } else {
          // Normal scheduling logic
          liveShow = todayShows.find((show) => {
            if (!show.startTime || !show.endTime) return false;
            const startMinutes = parseTimeToMinutes(show.startTime);
            const endMinutes = parseTimeToMinutes(show.endTime);
            return currentMinutes >= startMinutes && currentMinutes < endMinutes;
          });
        }

        if (liveShow) {
          setHasScheduledShow(true);
          setCurrentShow(liveShow);
          setIsLive(true);
          setNextShowTime(null);
          setCountdownSeconds(null);
          const url =
            liveShow.streamUrl || liveShow.recordedUrl || null;
          setAudioUrl(url);
          setCurrentTrack({
            title: liveShow.title,
            artist: liveShow.hostName,
            coverUrl: liveShow.coverUrl,
            showName: liveShow.title,
            hostName: liveShow.hostName,
          });

          return;
        }

        const upcomingShows = is24hRepeatDay ? [] : todayShows
          .filter((show) => {
            if (!show.startTime) return false;
            const startMinutes = parseTimeToMinutes(show.startTime);
            return startMinutes > currentMinutes;
          })
          .sort((a, b) => {
            const aStart = parseTimeToMinutes(a.startTime!);
            const bStart = parseTimeToMinutes(b.startTime!);
            return aStart - bStart;
          });

        if (upcomingShows.length > 0) {
          const nextShow = upcomingShows[0]!;
          setHasScheduledShow(true);
          setCurrentShow(nextShow);
          setIsLive(false);

          const timeParts = nextShow.startTime!.split(":").map(Number);
          const hours = timeParts[0] ?? 0;
          const minutes = timeParts[1] ?? 0;
          const nextTime = new Date();
          nextTime.setHours(hours, minutes, 0, 0);
          setNextShowTime(nextTime);

          const secondsUntil = Math.floor(
            (nextTime.getTime() - Date.now()) / 1000,
          );
          setCountdownSeconds(secondsUntil > 0 ? secondsUntil : null);

          // Don't set audioUrl for upcoming shows - use fallback stream instead
          setAudioUrl(null);
          setCurrentTrack({
            title: nextShow.title,
            artist: nextShow.hostName,
            coverUrl: nextShow.coverUrl,
            showName: nextShow.title,
            hostName: nextShow.hostName,
          });
        } else {
          setHasScheduledShow(false);
          setCurrentShow(null);
          setNextShowTime(null);
          setCountdownSeconds(null);
          setAudioUrl(null);
          setCurrentTrack({
            title: "GroupTherapy Radio",
            artist: "24/7 Mix",
          });
        }
      } catch (error) {
        console.error("Error fetching radio shows:", error);
        setHasScheduledShow(false);
        setAudioUrl(null);
        setCurrentTrack({
          title: "GroupTherapy Radio",
          artist: "24/7 Mix",
        });
      }
    }

    fetchAndProcessShows();
    const interval = setInterval(fetchAndProcessShows, 60000);
    return () => clearInterval(interval);
  }, [currentSession]);

  useEffect(() => {
    if (countdownSeconds === null || countdownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdownSeconds]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audio.volume = volume;
    audio.preload = "auto";
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (audioRef.current) {
        setProgress(audioRef.current.currentTime);
        if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
          setDuration(audioRef.current.duration);
        }
      }
    };

    const handleLoadedMetadata = () => {
      if (
        audioRef.current &&
        audioRef.current.duration &&
        !isNaN(audioRef.current.duration)
      ) {
        setDuration(audioRef.current.duration);
      }
    };

    const handleEnded = async () => {
      if (currentSession) {
        if (currentSession.replayEnabled) {
          await restartSession();
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(console.error);
          }
          setProgress(0);
        } else {
          try {
            await db.radioTracks.create({
              title: currentSession.showName,
              artist: currentSession.hostName || "Unknown",
              coverUrl: currentSession.coverUrl,
              duration: currentSession.duration,
              playedAt: new Date().toISOString(),
              showId: currentSession.showId,
            });
          } catch (e) {
            console.error("Failed to save track to recent streams:", e);
          }

          await endRadioSession();
          setIsPlaying(false);
          setProgress(0);
        }
      } else {
        setIsPlaying(false);
        setProgress(0);
      }
    };

    const handleWaiting = () => {
      setIsBuffering(true);
    };

    const handleCanPlay = () => {
      setIsBuffering(false);
    };

    const handlePlaying = () => {
      setIsBuffering(false);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("playing", handlePlaying);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("playing", handlePlaying);
      audio.pause();
    };
  }, [audioUrl, currentSession]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Simple time-based sync for live sessions only
  useEffect(() => {
    if (
      !isPlaying ||
      !isLiveSessionRef.current ||
      !currentSession ||
      !currentSession.isActive ||
      !audioRef.current
    ) {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      if (audioRef.current && audioRef.current.playbackRate !== 1) {
        audioRef.current.playbackRate = 1;
      }
      return;
    }

    const performSync = () => {
      if (
        !audioRef.current ||
        !currentSession ||
        !currentSession.isActive ||
        !isLiveSessionRef.current
      )
        return;

      // Calculate expected position: current time - start time
      const now = Date.now() + serverTimeOffset;
      const elapsed = now - currentSession.startedAt;
      let expectedPosition = elapsed / 1000; // Convert to seconds

      // Handle looping if enabled
      if (currentSession.replayEnabled && currentSession.duration > 0) {
        expectedPosition = expectedPosition % currentSession.duration;
      }

      // Check if we're drifting
      const currentPosition = audioRef.current.currentTime;
      const signedDrift = currentPosition - expectedPosition;
      const drift = Math.abs(signedDrift);

      if (drift > SYNC_THRESHOLD_SECONDS && expectedPosition >= 0) {
        const audioDuration = audioRef.current.duration;
        const isValidDuration =
          audioDuration && !isNaN(audioDuration) && isFinite(audioDuration);

        if (isValidDuration) {
          audioRef.current.currentTime = Math.min(
            expectedPosition,
            audioDuration,
          );
        } else {
          audioRef.current.currentTime = expectedPosition;
        }
        audioRef.current.playbackRate = 1;
        setIsSynced(false);
      } else {
        if (drift > SYNC_SOFT_THRESHOLD_SECONDS) {
          const adjust = Math.max(
            -MAX_PLAYBACK_RATE_ADJUST,
            Math.min(MAX_PLAYBACK_RATE_ADJUST, -signedDrift * 0.15),
          );
          audioRef.current.playbackRate = 1 + adjust;
          setIsSynced(false);
        } else {
          audioRef.current.playbackRate = 1;
          if (!isSynced) {
            setIsSynced(true);
          }
        }
      }
    };

    performSync();
    syncIntervalRef.current = setInterval(performSync, SYNC_INTERVAL_MS);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [isPlaying, currentSession, serverTimeOffset, isSynced]);

  useEffect(() => {
    const unsubscribeMetadata = subscribeToRadioMetadata(
      (metadata: RadioMetadata) => {
        if (!currentShow && !currentSession) {
          setCurrentTrack({
            title: metadata.title || "GroupTherapy Radio",
            artist: metadata.artist || "Live Stream",
            coverUrl: metadata.coverUrl,
            showName: metadata.showName,
            hostName: metadata.hostName,
          });
        }
      },
    );

    const unsubscribeListeners = subscribeToListenerCount((count) => {
      setListenerCount(count);
    });

    return () => {
      unsubscribeMetadata();
      unsubscribeListeners();
    };
  }, [currentShow, currentSession]);

  useEffect(() => {
    if (isPlaying) {
      const untrack = trackListener();
      return () => untrack();
    }
  }, [isPlaying]);

  const play = useCallback(() => {
    if (!audioRef.current || !audioUrl) return;

    // Only sync if this is a live session
    if (
      isLiveSessionRef.current &&
      currentSession &&
      currentSession.isActive
    ) {
      setIsSynced(false);
      const now = Date.now() + serverTimeOffset;
      const elapsed = now - currentSession.startedAt;
      let expectedPosition = elapsed / 1000;

      if (currentSession.replayEnabled && currentSession.duration > 0) {
        expectedPosition = expectedPosition % currentSession.duration;
      }

      if (expectedPosition >= 0) {
        const audioDuration = audioRef.current.duration;
        const isValidDuration =
          audioDuration && !isNaN(audioDuration) && isFinite(audioDuration);

        if (isValidDuration) {
          audioRef.current.currentTime = Math.min(
            expectedPosition,
            audioDuration,
          );
        } else {
          audioRef.current.currentTime = expectedPosition;
        }
      }
      audioRef.current.playbackRate = 1;
    } else if (
      !currentSession &&
      isLive &&
      currentShow &&
      currentShow.recordedUrl &&
      currentShow.startTime
    ) {
      // Calculate scheduled position for recorded shows when play is pressed
      const now = new Date();
      const [hours, minutes] = currentShow.startTime.split(":").map(Number);
      const showStart = new Date();
      showStart.setHours(hours ?? 0, minutes ?? 0, 0, 0);

      const elapsedMs = now.getTime() - showStart.getTime();
      const elapsedSeconds = Math.floor(elapsedMs / 1000);

      if (elapsedSeconds > 0) {
        const audioDuration = audioRef.current.duration;
        if (audioDuration && !isNaN(audioDuration) && isFinite(audioDuration)) {
          const position =
            audioDuration > 0 ? elapsedSeconds % audioDuration : elapsedSeconds;
          audioRef.current.currentTime = position;
          setProgress(position);
        }
      }
    }
    // For non-live sessions (recent streams), just play from current position

    audioRef.current.play().catch(console.error);
    setIsPlaying(true);
  }, [
    audioUrl,
    currentSession,
    serverTimeOffset,
    isLive,
    currentShow,
  ]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current && !isLiveSessionRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  const enableAutoPlay = useCallback(() => {
    setAutoPlayEnabled(true);
    if (hasInteracted && !isPlaying && audioUrl) {
      if (audioRef.current) {
        if (isLiveSessionRef.current && currentSession) {
          const now = Date.now() + serverTimeOffset;
          const elapsed = now - currentSession.startedAt;
          let expectedPosition = elapsed / 1000;

          if (currentSession.replayEnabled && currentSession.duration > 0) {
            expectedPosition = expectedPosition % currentSession.duration;
          }

          if (expectedPosition >= 0) {
            audioRef.current.currentTime = expectedPosition;
          }
        }
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
    } else if (!hasInteracted && audioUrl) {
      setPendingAutoPlay(true);
    }
  }, [hasInteracted, isPlaying, audioUrl, currentSession, serverTimeOffset]);

  const syncToServerTime = useCallback(() => {
    if (!audioRef.current || !currentSession || !isLiveSessionRef.current)
      return;

    const now = Date.now() + serverTimeOffset;
    const elapsed = now - currentSession.startedAt;
    let expectedPosition = elapsed / 1000;

    if (currentSession.replayEnabled && currentSession.duration > 0) {
      expectedPosition = expectedPosition % currentSession.duration;
    }

    if (expectedPosition < 0) {
      expectedPosition = 0;
    }

    const audioDuration = audioRef.current.duration;
    const isValidDuration =
      audioDuration && !isNaN(audioDuration) && isFinite(audioDuration);

    if (isValidDuration) {
      audioRef.current.currentTime = Math.min(expectedPosition, audioDuration);
    } else {
      audioRef.current.currentTime = expectedPosition;
    }

    setIsSynced(true);
  }, [serverTimeOffset, currentSession]);

  const playStream = useCallback((stream: DbRadioTrack) => {
    if (!stream) {
      console.warn("No stream provided to playStream");
      return;
    }

    // Handle SoundCloud URLs - open in new tab since they can't be played directly
    if (stream.soundcloudUrl) {
      window.open(stream.soundcloudUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // Mark this as NOT a live session
    isLiveSessionRef.current = false;
    setIsLive(false);
    setIsSynced(false);

    // Stop current playback
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    // Clear sync interval
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }

    const startPlayback = (
      url: string,
      trackInfo?: {
        title: string;
        artist?: string;
        coverUrl?: string;
        showName?: string;
        hostName?: string;
      },
    ) => {
      if (!url) {
        console.warn("No audio URL provided for playback");
        return;
      }

      const track = trackInfo || {
        title: stream.title,
        artist: stream.artist || "",
        coverUrl: stream.coverUrl,
      };

      setCurrentTrack({
        ...track,
        artist: track.artist ?? "",
      });
      setAudioUrl(url);
      setHasScheduledShow(true);
      setProgress(0);

      // Start playback from beginning after audio element recreates
      setTimeout(() => {
        if (audioRef.current && !isLiveSessionRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current
            .play()
            .then(() => {
              setIsPlaying(true);
            })
            .catch((err) => {
              console.error("Playback failed:", err);
              // If playback fails, try to open URL in new tab as fallback
              if (url.startsWith('http')) {
                window.open(url, '_blank', 'noopener,noreferrer');
              }
            });
        }
      }, 200);
    };

    // Check if stream has a direct audio URL (not in the interface but might be added)
    const audioUrl = (stream as any).audioUrl;
    if (audioUrl) {
      startPlayback(audioUrl);
      return;
    }

    // Try to get audio from associated show
    if (stream.showId) {
      db.radioShows
        .getById(stream.showId)
        .then((show) => {
          if (show) {
            const url = show.recordedUrl || show.streamUrl;
            if (url) {
              startPlayback(url, {
                title: stream.title || show.title,
                artist: stream.artist || show.hostName,
                coverUrl: stream.coverUrl || show.coverUrl,
                showName: show.title,
                hostName: show.hostName,
              });
            } else {
              console.warn("No audio URL found for show:", show.title);
            }
          } else {
            console.warn("Show not found for stream:", stream.title);
          }
        })
        .catch((err) => {
          console.error("Error fetching show for stream:", err);
        });
      return;
    }

    console.warn("No audio URL, show ID, or SoundCloud URL for stream:", stream.title);
  }, []);

  return (
    <RadioContext.Provider
      value={{
        isPlaying,
        volume,
        currentTrack,
        isLive,
        isExpanded,
        progress,
        duration,
        listenerCount,
        hasScheduledShow,
        hasAudioUrl: !!audioUrl,
        currentShow,
        nextShowTime,
        countdownSeconds,
        serverTimeOffset,
        currentSession,
        autoPlayEnabled,
        isBuffering,
        isSynced,
        isConnected,
        recentStreams,
        play,
        pause,
        togglePlay,
        setVolume,
        setExpanded,
        setCurrentTrack,
        seek,
        enableAutoPlay,
        syncToServerTime,
        playStream,
      }}
    >
      {children}
    </RadioContext.Provider>
  );
}

export function useRadio() {
  const context = useContext(RadioContext);
  if (!context) {
    throw new Error("useRadio must be used within a RadioProvider");
  }
  return context;
}
