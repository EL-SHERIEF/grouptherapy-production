import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  ExternalLink,
  Loader2,
  Music,
  Pause,
  Play,
  User,
  Vote,
} from "lucide-react";
import { FaSoundcloud, FaSpotify } from "react-icons/fa";
import { SiApplemusic } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { AwardEntry } from "@/lib/database";
import { useRadio } from "@/lib/radio-context";
import { resolveMediaUrl } from "@/lib/media";

const STOP_PREVIEW_EVENT = "gt:stop-preview-audio";

export function AwardEntryCard({
  entry,
  categoryType,
  onVote,
  hasVoted,
  isVoting,
  totalVotes = 0,
}: {
  entry: AwardEntry;
  categoryType?: "artist" | "track";
  onVote?: () => void;
  hasVoted: boolean;
  isVoting: boolean;
  totalVotes?: number;
}) {
  const inferredCategoryType: "artist" | "track" = categoryType
    ? categoryType
    : entry.trackTitle || entry.trackArtist || entry.trackCoverUrl || entry.trackAudioUrl
      ? "track"
      : "artist";

  const votePercentage =
    totalVotes > 0 && entry.voteCount > 0
      ? Math.round((entry.voteCount / totalVotes) * 100)
      : 0;

  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const radio = useRadio();

  const stopLocalPreview = useCallback(() => {
    if (audio) {
      audio.pause();
    }
    setIsPlaying(false);
  }, [audio]);

  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        audio.src = "";
      }
    };
  }, [audio]);

  useEffect(() => {
    const onStop = () => stopLocalPreview();
    window.addEventListener(STOP_PREVIEW_EVENT, onStop);
    return () => window.removeEventListener(STOP_PREVIEW_EVENT, onStop);
  }, [stopLocalPreview]);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!entry.trackAudioUrl) return;

    if (isPlaying && audio) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // Ensure only one preview plays at a time
      window.dispatchEvent(new Event(STOP_PREVIEW_EVENT));

      // Ensure preview and radio are mutually exclusive
      if (radio.isPlaying) {
        radio.pause();
      }

      if (!audio) {
        const newAudio = new Audio(entry.trackAudioUrl);
        newAudio.addEventListener("ended", () => setIsPlaying(false));
        newAudio.addEventListener("error", () => {
          setIsPlaying(false);
          console.error("Audio playback error");
        });
        setAudio(newAudio);
        newAudio.play().then(() => setIsPlaying(true)).catch(console.error);
      } else {
        audio.play().then(() => setIsPlaying(true)).catch(console.error);
      }
    }
  };

  const imageUrl =
    inferredCategoryType === "artist" ? entry.artistImageUrl : entry.trackCoverUrl;
  const title =
    inferredCategoryType === "artist" ? entry.artistName : entry.trackTitle;
  const subtitle =
    inferredCategoryType === "track" ? entry.trackArtist : entry.artistBio;

  return (
    <Card className="group overflow-hidden bg-background border-border/50 transition-colors hover:border-border">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {imageUrl ? (
          <img
            src={resolveMediaUrl(imageUrl, "card")}
            alt={title || "Entry"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-muted flex items-center justify-center">
            {inferredCategoryType === "artist" ? (
              <User className="h-16 w-16 text-muted-foreground/50" />
            ) : (
              <Music className="h-16 w-16 text-muted-foreground/50" />
            )}
          </div>
        )}

        {hasVoted && entry.voteCount > 0 && (
          <Badge className="absolute top-3 left-3 bg-background/90 text-foreground border-border/50">
            {entry.voteCount}
          </Badge>
        )}

        {entry.trackAudioUrl && (
          <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            className="absolute bottom-3 right-3"
          >
            <Button
              size="icon"
              variant="outline"
              className="h-10 w-10 rounded-full bg-background/90 hover:bg-background border-border/50 text-foreground hover:text-foreground [&_svg]:size-5"
              onClick={handlePlayPause}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>
          </motion.div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="min-w-0">
          <h3 className="font-semibold leading-tight truncate">
            {title || "Unknown"}
          </h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {entry.spotifyUrl && (
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9 rounded-full border-border/50"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(entry.spotifyUrl!, "_blank");
                }}
              >
                <FaSpotify className="h-4 w-4" />
              </Button>
            )}
            {entry.appleMusicUrl && (
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9 rounded-full border-border/50"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(entry.appleMusicUrl!, "_blank");
                }}
              >
                <SiApplemusic className="h-4 w-4" />
              </Button>
            )}
            {entry.soundcloudUrl && (
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9 rounded-full border-border/50"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(entry.soundcloudUrl!, "_blank");
                }}
              >
                <FaSoundcloud className="h-4 w-4" />
              </Button>
            )}
          </div>

          {hasVoted && entry.voteCount > 0 && totalVotes > 0 && (
            <div className="text-xs text-muted-foreground tabular-nums">
              {votePercentage}%
            </div>
          )}
        </div>

        {hasVoted && totalVotes > 0 && entry.voteCount > 0 && (
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.min(100, Math.max(0, votePercentage))}%` }}
            />
          </div>
        )}

        {onVote && (
          <Button
            className="w-full gap-2 rounded-full"
            onClick={onVote}
            disabled={hasVoted || isVoting}
            variant={hasVoted ? "secondary" : "default"}
            size="sm"
          >
            {isVoting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : hasVoted ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Voted
              </>
            ) : (
              <>
                <Vote className="h-4 w-4" />
                Vote
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
