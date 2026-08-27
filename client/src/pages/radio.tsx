import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Volume2, Radio, Clock, Calendar, Users, ChevronRight, Music, ExternalLink } from "lucide-react";
import { RadioTrack } from "@/lib/database";
import { ConfiguredPageHero } from "@/components/hero-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { RadioChat } from "@/components/radio-chat";
import { useRadio } from "@/lib/radio-context";
import { useToast } from "@/hooks/use-toast";
import { db, RadioShow} from "@/lib/database";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/media";
import { sanitizeHtml } from "@/lib/sanitize-html";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

function getCurrentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export default function RadioPage() {
  const { isPlaying, volume, currentTrack, isLive, togglePlay, setVolume, listenerCount, hasAudioUrl, hasScheduledShow, recentStreams, playStream, countdownSeconds, currentShow } = useRadio();
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [shows, setShows] = useState<RadioShow[]>([]);
  const [loading, setLoading] = useState(true);
  
  const isUpcoming = !isLive && currentShow && countdownSeconds !== null && countdownSeconds > 0;
  const canPlay = (isLive || hasScheduledShow) && hasAudioUrl && !isUpcoming;

  useEffect(() => {
    async function fetchShows() {
      try {
        const allShows = await db.radioShows.getAll();
        const publishedShows = allShows.filter(show => show.published);
        setShows(publishedShows);
      } catch (error) {
        console.error('Error fetching radio shows:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchShows();
  }, []);

  const showsForSelectedDay = shows
    .filter(show => show.dayOfWeek === selectedDay)
    .map(show => {
      // Check if this day has 24-hour repeat enabled
      const dayShows = shows.filter(s => s.dayOfWeek === selectedDay && s.published);
      const is24hRepeatDay = dayShows.length > 0 && dayShows.every(s => s.repeat24h);
      
      if (!show.startTime || !show.endTime) return { ...show, isLive: false };
      
      // For 24-hour repeat days, determine which show is currently playing
      if (is24hRepeatDay && show.published && selectedDay === new Date().getDay()) {
        const totalMinutesInDay = 24 * 60;
        const currentMinutes = getCurrentMinutes();
        const minutesPerShow = Math.floor(totalMinutesInDay / dayShows.length);
        const currentShowIndex = Math.floor(currentMinutes / minutesPerShow) % dayShows.length;
        const currentShow = dayShows[currentShowIndex];
        
        return { ...show, isLive: currentShow ? currentShow.id === show.id : false };
      }
      
      const currentMinutes = getCurrentMinutes();
      const startMinutes = parseTimeToMinutes(show.startTime);
      const endMinutes = parseTimeToMinutes(show.endTime);
      const isCurrentlyLive = selectedDay === new Date().getDay() && currentMinutes >= startMinutes && currentMinutes < endMinutes;
      return { ...show, isLive: isCurrentlyLive };
    })
    .sort((a, b) => {
      if (!a.startTime) return 1;
      if (!b.startTime) return -1;
      return parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime);
    });

  return (
    <div className="min-h-screen">
      <ConfiguredPageHero
        pageKey="/radio"
        title="GroupTherapy Radio"
        subtitle="24/7 curated radio shows, guest mixes, and discoveries"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Player Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <Card className="overflow-hidden">
            <div className="grid md:grid-cols-2">
              {/* Player Visual */}
              <div className="relative aspect-square md:aspect-auto bg-gradient-to-br from-primary/20 via-muted to-background p-8 flex flex-col items-center justify-center">
                {/* Animated circles */}
                <div className="absolute inset-0 overflow-hidden">
                  {isPlaying && (
                    <>
                      <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-primary/20"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      />
                      <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-primary/10"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                      />
                      <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-primary/5"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
                        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                      />
                    </>
                  )}
                </div>

                {/* Cover / Logo */}
                <div className="relative z-10 w-32 h-32 lg:w-48 lg:h-48 rounded-full bg-card shadow-xl flex items-center justify-center">
                  {currentTrack?.coverUrl ? (
                    <img
                      src={resolveMediaUrl(currentTrack.coverUrl, "card")}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <Radio className={cn("h-16 w-16 lg:h-24 lg:w-24", isPlaying && "text-primary")} />
                  )}
                </div>

                {/* Live Badge */}
                {isLive && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="default" className="gap-1">
                      <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                      LIVE
                    </Badge>
                  </div>
                )}
              </div>

              {/* Player Controls */}
              <CardContent className="p-8 flex flex-col justify-center">
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-1">Now Playing</p>
                  <h2 className="text-2xl lg:text-3xl font-bold mb-2" data-testid="text-radio-now-playing">
                    {currentTrack?.title || "GroupTherapy Radio"}
                  </h2>
                  <p className="text-muted-foreground" data-testid="text-radio-artist-name">
                    {currentTrack?.artist || "Live Stream"}
                  </p>
                </div>

                {/* Big Play Button */}
                <div className="flex items-center gap-6 mb-8">
                  <Button
                    size="lg"
                    className="h-16 w-16 rounded-full"
                    onClick={togglePlay}
                    disabled={!canPlay}
                    data-testid="button-radio-main-play"
                  >
                    {isPlaying ? (
                      <Pause className="h-8 w-8" />
                    ) : (
                      <Play className="h-8 w-8 ml-1" />
                    )}
                  </Button>
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-2">Volume</p>
                    <div className="flex items-center gap-3">
                      <Volume2 className="h-4 w-4 text-muted-foreground" />
                      <Slider
                        value={[volume * 100]}
                        onValueChange={([val]) => val !== undefined && setVolume(val / 100)}
                        max={100}
                        className="flex-1"
                        disabled={!canPlay}
                        data-testid="slider-radio-main-volume"
                      />
                      <span className="text-sm text-muted-foreground w-8">
                        {Math.round(volume * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Listener Count */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{listenerCount} listener{listenerCount !== 1 ? 's' : ''}</span>
                </div>
              </CardContent>
            </div>
          </Card>
        </motion.div>

        {/* Tabs: Schedule, Recent & Chat */}
        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="schedule" data-testid="tab-schedule">
              <Calendar className="h-4 w-4 mr-2" />
              Show Schedule
            </TabsTrigger>
            <TabsTrigger value="recent" data-testid="tab-recent">
              <Clock className="h-4 w-4 mr-2" />
              Recent Streams
            </TabsTrigger>
            <TabsTrigger value="chat" data-testid="tab-chat">
              <Users className="h-4 w-4 mr-2" />
              Live Chat
            </TabsTrigger>
          </TabsList>

          {/* Schedule */}
          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Schedule</CardTitle>
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                  {days.map((day, index) => (
                    <Button
                      key={day}
                      variant={selectedDay === index ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDay(index)}
                      data-testid={`button-day-${day.toLowerCase()}`}
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <p className="text-muted-foreground text-center py-8">Loading shows...</p>
                  ) : showsForSelectedDay.length > 0 ? (
                    showsForSelectedDay.map((show) => (
                      <ShowCard key={show.id} show={show} isSchedule={true} />
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No scheduled shows for {days[selectedDay]}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Streams */}
          <TabsContent value="recent">
            <Card>
              <CardHeader>
                <CardTitle>Recent Streams</CardTitle>
              </CardHeader>
              <CardContent>
                {recentStreams.length > 0 ? (
                  <div className="space-y-3">
                    {recentStreams.map((track, index) => (
                      <StreamCard key={track.id || index} track={track} onPlay={() => playStream(track)} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Radio className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Stream history will appear here as shows are broadcast.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live Chat */}
          <TabsContent value="chat" className="h-[600px]">
            <RadioChat />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ShowCard({ show, isSchedule = false }: { show: RadioShow; isSchedule?: boolean }) {
  const { playStream } = useRadio();
  
  const handlePlay = useCallback(() => {
    if (show.recordedUrl) {
      // Create a temporary track object for playback
      const track: RadioTrack = {
        id: show.id,
        title: show.title,
        artist: show.hostName || '',
        coverUrl: show.coverUrl,
        playedAt: new Date().toISOString(),
        createdAt: show.createdAt || new Date().toISOString(),
        showId: show.id,
      };
      playStream(track as any);
    }
  }, [show, playStream]);

  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 rounded-md border transition-colors",
        isSchedule ? "cursor-default" : "cursor-pointer",
        show.isLive ? "border-primary bg-primary/5" : "hover:bg-muted/50"
      )}
      data-testid={`card-show-${show.id}`}
      onClick={isSchedule ? undefined : handlePlay}
    >
      {/* Host Image */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-muted">
          {show.hostImageUrl ? (
            <img
              src={resolveMediaUrl(show.hostImageUrl, "thumb")}
              alt={show.hostName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Radio className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
        {show.isLive && (
          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-background" />
        )}
      </div>

      {/* Show Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold truncate">{show.title}</h4>
          {show.isLive && (
            <Badge variant="default" className="text-[10px]">
              LIVE
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-1">with {show.hostName}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">{show.description}</p>
      </div>

      {/* Time */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-medium">
          {show.startTime} - {show.endTime}
        </p>
        <p className="text-xs text-muted-foreground">{show.timezone}</p>
      </div>

      {/* Play Button - only show if not in schedule */}
      {!isSchedule && (
        <Button 
          size="icon" 
          variant="ghost" 
          className="flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            handlePlay();
          }}
        >
          <Play className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

interface SoundCloudOEmbed {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  html?: string;
}

function useSoundCloudMetadata(soundcloudUrl?: string) {
  const [metadata, setMetadata] = useState<SoundCloudOEmbed | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!soundcloudUrl) {
      setMetadata(null);
      return;
    }

    async function fetchMetadata() {
      setLoading(true);
      try {
        const response = await fetch(
          `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(soundcloudUrl || '')}`
        );
        if (response.ok) {
          const data = await response.json();
          setMetadata(data);
        }
      } catch (error) {
        console.error('Failed to fetch SoundCloud metadata:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMetadata();
  }, [soundcloudUrl]);

  return { metadata, loading };
}

function StreamCard({ track, onPlay }: { track: RadioTrack; onPlay: () => void }) {
  const playedAt = track.playedAt ? new Date(track.playedAt) : new Date();
  const timeAgo = getTimeAgo(playedAt);
  const [showEmbed, setShowEmbed] = useState(false);
  const { metadata, loading } = useSoundCloudMetadata(track.soundcloudUrl);

  const displayTitle = metadata?.title || track.title;
  const displayArtist = metadata?.author_name || track.artist;
  const displayCover = metadata?.thumbnail_url || track.coverUrl;

  const handleClick = useCallback(() => {
    if (track.soundcloudUrl) {
      setShowEmbed(!showEmbed);
    } else {
      onPlay();
    }
  }, [track.soundcloudUrl, showEmbed, onPlay]);

  return (
    <div className="space-y-2">
      <div 
        className="flex items-center gap-4 p-3 rounded-md hover:bg-muted/50 transition-colors cursor-pointer group"
        onClick={handleClick}
      >
        <div className="relative w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
          {displayCover ? (
            <img
              src={resolveMediaUrl(displayCover, "thumb")}
              alt={displayTitle}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="h-5 w-5 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium truncate">{displayTitle}</h4>
            {track.soundcloudUrl && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-orange-500 border-orange-500/50">
                SoundCloud
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">{displayArtist}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
          {track.duration && (
            <p className="text-xs text-muted-foreground">{formatDuration(track.duration)}</p>
          )}
        </div>
        {track.soundcloudUrl ? (
          <div className="flex gap-1 flex-shrink-0">
            <Button 
              size="icon" 
              variant="ghost" 
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                window.open(track.soundcloudUrl, '_blank');
              }}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button size="icon" variant="ghost" className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {track.soundcloudUrl && showEmbed && metadata?.html && (
        <div 
          className="ml-16 rounded-md overflow-hidden"
          dangerouslySetInnerHTML={{ 
            __html: sanitizeHtml(
              metadata.html.replace(/height="\d+"/, 'height="166"').replace(/width="\d+%?"/, 'width="100%"'),
              {
                allowIframes: true,
                allowedIframeSrcPrefixes: [
                  "https://w.soundcloud.com/",
                  "https://player.soundcloud.com/",
                  "https://soundcloud.com/",
                ],
              }
            )
          }} 
        />
      )}
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
