import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, X, Music2, ListMusic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/media";

export interface PlaylistTrack {
  id: string;
  title: string;
  artist: string;
  duration?: number;
  audioUrl?: string;
  coverUrl?: string;
  spotifyPreviewUrl?: string;
}

interface PlaylistPlayerProps {
  tracks: PlaylistTrack[];
  playlistTitle: string;
  playlistCover?: string;
  onClose?: () => void;
  isVisible?: boolean;
  spotifyPlaylistId?: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function PlaylistPlayer({
  tracks,
  playlistTitle,
  playlistCover,
  onClose,
  isVisible = true,
  spotifyPlaylistId
}: PlaylistPlayerProps) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [showTrackList, setShowTrackList] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = tracks[currentTrackIndex];

  const getAudioUrl = useCallback((track: PlaylistTrack) => {
    return track.audioUrl || track.spotifyPreviewUrl || null;
  }, []);

  useEffect(() => {
    if (!currentTrack) return;
    
    const audioUrl = getAudioUrl(currentTrack);
    if (!audioUrl) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    audioRef.current = new Audio(audioUrl);
    audioRef.current.volume = volume;

    const handleTimeUpdate = () => {
      if (audioRef.current) {
        setProgress(audioRef.current.currentTime);
        setDuration(audioRef.current.duration || 0);
      }
    };

    const handleEnded = () => {
      if (isRepeat) {
        audioRef.current?.play();
      } else {
        handleNext();
      }
    };

    const handleLoadedMetadata = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration);
      }
    };

    audioRef.current.addEventListener("timeupdate", handleTimeUpdate);
    audioRef.current.addEventListener("ended", handleEnded);
    audioRef.current.addEventListener("loadedmetadata", handleLoadedMetadata);

    if (isPlaying) {
      audioRef.current.play().catch(console.error);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("timeupdate", handleTimeUpdate);
        audioRef.current.removeEventListener("ended", handleEnded);
        audioRef.current.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audioRef.current.pause();
      }
    };
  }, [currentTrack, isRepeat]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handlePrevious = useCallback(() => {
    if (progress > 3) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      return;
    }
    
    let newIndex: number;
    if (isShuffle) {
      newIndex = Math.floor(Math.random() * tracks.length);
    } else {
      newIndex = currentTrackIndex > 0 ? currentTrackIndex - 1 : tracks.length - 1;
    }
    setCurrentTrackIndex(newIndex);
    setProgress(0);
  }, [currentTrackIndex, isShuffle, tracks.length, progress]);

  const handleNext = useCallback(() => {
    let newIndex: number;
    if (isShuffle) {
      newIndex = Math.floor(Math.random() * tracks.length);
    } else {
      newIndex = currentTrackIndex < tracks.length - 1 ? currentTrackIndex + 1 : 0;
    }
    setCurrentTrackIndex(newIndex);
    setProgress(0);
  }, [currentTrackIndex, isShuffle, tracks.length]);

  const handleSeek = useCallback((value: number[]) => {
    const time = value[0];
    if (audioRef.current && time !== undefined) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  }, []);

  const handleTrackSelect = useCallback((index: number) => {
    setCurrentTrackIndex(index);
    setProgress(0);
    setIsPlaying(true);
  }, []);

  const playableTracks = tracks.filter(t => t.audioUrl || t.spotifyPreviewUrl);

  if (!isVisible || playableTracks.length === 0) {
    if (spotifyPlaylistId) {
      return (
        <div className="w-full space-y-3">
          <div className="w-full h-[500px] rounded-lg overflow-hidden">
            <iframe
              src={`https://open.spotify.com/embed/playlist/${spotifyPlaylistId}?utm_source=generator&theme=0`}
              width="100%"
              height="100%"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-lg"
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Log in to your Spotify account to play full tracks. Free users can hear 30-second previews.
          </p>
        </div>
      );
    }
    return (
      <div className="bg-card/95 backdrop-blur-xl border rounded-xl p-8 text-center">
        <Music2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No playable tracks available for this playlist.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-card/95 backdrop-blur-xl border rounded-xl overflow-hidden shadow-2xl"
    >
      <div className="grid md:grid-cols-[1fr,300px]">
        <div className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0 shadow-lg">
              {currentTrack?.coverUrl || playlistCover ? (
                <img
                  src={currentTrack?.coverUrl || playlistCover}
                  alt={currentTrack?.title || playlistTitle}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-muted">
                  <Music2 className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Now Playing
              </p>
              <h3 className="text-xl font-bold truncate">{currentTrack?.title || "Select a track"}</h3>
              <p className="text-muted-foreground truncate">{currentTrack?.artist || "Unknown Artist"}</p>
              <p className="text-xs text-primary mt-1">{playlistTitle}</p>
            </div>
            {onClose && (
              <Button size="icon" variant="ghost" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Slider
                value={[progress]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsShuffle(!isShuffle)}
                className={cn(isShuffle && "text-primary")}
              >
                <Shuffle className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={handlePrevious}>
                <SkipBack className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                className="h-14 w-14 rounded-full"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-0.5" />
                )}
              </Button>
              <Button size="icon" variant="ghost" onClick={handleNext}>
                <SkipForward className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsRepeat(!isRepeat)}
                className={cn(isRepeat && "text-primary")}
              >
                <Repeat className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setVolume(volume > 0 ? 0 : 0.7)}
              >
                {volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <Slider
                value={[volume * 100]}
                max={100}
                step={1}
                onValueChange={([val]) => val !== undefined && setVolume(val / 100)}
                className="w-24"
              />
            </div>
          </div>
        </div>

        <div className="border-t md:border-t-0 md:border-l bg-muted/30">
          <div className="p-4 border-b flex items-center justify-between">
            <h4 className="font-semibold flex items-center gap-2">
              <ListMusic className="h-4 w-4" />
              Track List
            </h4>
            <span className="text-xs text-muted-foreground">{tracks.length} tracks</span>
          </div>
          <ScrollArea className="h-[35svh] md:h-[300px]">
            <div className="p-2">
              {tracks.map((track, index) => {
                const hasAudio = !!(track.audioUrl || track.spotifyPreviewUrl);
                return (
                  <button
                    key={track.id}
                    onClick={() => hasAudio && handleTrackSelect(index)}
                    disabled={!hasAudio}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors",
                      currentTrackIndex === index
                        ? "bg-primary/20 text-primary"
                        : hasAudio
                        ? "hover:bg-muted"
                        : "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                      {track.coverUrl ? (
                        <img
                          src={resolveMediaUrl(track.coverUrl, "thumb")}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{track.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                    </div>
                    {currentTrackIndex === index && isPlaying && (
                      <div className="hidden sm:flex gap-0.5 shrink-0">
                        {[...Array(3)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-0.5 bg-primary rounded-full"
                            animate={{ height: [4, 12, 4] }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                          />
                        ))}
                      </div>
                    )}
                    {track.duration && (
                      <span className="hidden sm:inline text-xs text-muted-foreground shrink-0">
                        {formatTime(track.duration)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </motion.div>
  );
}

export function SpotifyEmbed({ 
  playlistId, 
  compact = false,
  showLoginHint = false 
}: { 
  playlistId: string; 
  compact?: boolean;
  showLoginHint?: boolean;
}) {
  return (
    <div className="w-full space-y-3">
      <div className={cn(
        "w-full rounded-lg overflow-hidden",
        compact ? "h-[152px]" : "h-[55svh] sm:h-[500px]"
      )}>
        <iframe
          src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`}
          width="100%"
          height="100%"
          frameBorder="0"
          allowFullScreen
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-lg"
        />
      </div>
      {showLoginHint && (
        <p className="text-xs text-muted-foreground text-center">
          Log in to your Spotify account to play full tracks. Free users can hear 30-second previews.
        </p>
      )}
    </div>
  );
}
