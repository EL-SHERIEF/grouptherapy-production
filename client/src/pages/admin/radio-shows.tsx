
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Radio, Users, Loader2, CloudDownload, ExternalLink, Music } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Repeat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/image-upload";
import { AudioUpload } from "@/components/audio-upload";
import { AdminLayout } from "./index";
import { queryClient, queryFunctions } from "@/lib/queryClient";
import { db, RadioShow, RadioTrack } from "@/lib/database";
import { subscribeToListenerCount } from "@/lib/firebase";
import { resolveMediaUrl } from "@/lib/media";

const daysOfWeek = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

function getShowStatus(
  show: RadioShow,
  allShows: RadioShow[] = [],
  now: Date = new Date(),
): { status: "live" | "scheduled" | "recorded"; label: string } {
  const currentDay = now.getDay();

  // Check if this show is part of a 24-hour repeat day
  const dayShows = allShows.filter((s) => s.dayOfWeek === show.dayOfWeek && s.published);
  const is24hRepeatDay = dayShows.length > 0 && dayShows.every((s) => s.repeat24h);

  // For 24-hour repeat days, determine which show is currently playing
  if (is24hRepeatDay && currentDay === show.dayOfWeek && show.published) {
    const totalMinutesInDay = 24 * 60;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const minutesPerShow = Math.floor(totalMinutesInDay / dayShows.length);
    const currentShowIndex = Math.floor(currentMinutes / minutesPerShow) % dayShows.length;
    const currentShow = dayShows[currentShowIndex];
    
    if (currentShow && currentShow.id === show.id) {
      return { status: 'live', label: 'Live' };
    } else {
      return { status: 'scheduled', label: 'Upcoming' };
    }
  }

  if (show.dayOfWeek !== undefined && show.startTime && show.endTime && !is24hRepeatDay) {
    const startMins = parseTimeToMinutes(show.startTime);
    const endMins = parseTimeToMinutes(show.endTime);
    const nowMins = now.getHours() * 60 + now.getMinutes();

    let isCurrentlyLive = false;
    if (endMins > startMins) {
      isCurrentlyLive = currentDay === show.dayOfWeek && nowMins >= startMins && nowMins < endMins;
    } else {
      const isShowDay = currentDay === show.dayOfWeek && nowMins >= startMins;
      const isNextDay = currentDay === ((show.dayOfWeek + 1) % 7) && nowMins < endMins;
      isCurrentlyLive = isShowDay || isNextDay;
    }

    if (isCurrentlyLive) {
      return { status: 'live', label: 'Live' };
    }

    const daysUntilShow = (show.dayOfWeek - currentDay + 7) % 7;
    if (daysUntilShow > 0 || (daysUntilShow === 0 && nowMins < startMins)) {
      return { status: 'scheduled', label: 'Scheduled' };
    }
  }

  if (show.recordedUrl) {
    return { status: 'recorded', label: 'Recorded' };
  }

  return { status: 'scheduled', label: 'Scheduled' };
}

function StatusBadge({
  show,
  shows,
  now,
}: {
  show: RadioShow;
  shows: RadioShow[];
  now: Date;
}) {
  const { status, label } = getShowStatus(show, shows, now);

  const variants: Record<string, string> = {
    live: 'bg-green-500/10 text-green-600 border-green-500/20',
    scheduled: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    recorded: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  };

  return (
    <Badge className={`${variants[status]} text-[10px] px-1.5 py-0`}>
      {status === 'live' && <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse" />}
      {label}
    </Badge>
  );
}

export default function AdminRadioShows() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTrackDialogOpen, setIsTrackDialogOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<RadioShow | null>(null);
  const [soundcloudUrl, setSoundcloudUrl] = useState("");
  const [trackSoundcloudUrl, setTrackSoundcloudUrl] = useState("");
  const [isFetchingSoundcloud, setIsFetchingSoundcloud] = useState(false);
  const [isFetchingTrackSoundcloud, setIsFetchingTrackSoundcloud] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    hostName: "",
    description: "",
    hostImageUrl: "",
    coverUrl: "",
    recordedUrl: "",
    dayOfWeek: 1,
    startTime: "00:00",
    endTime: "00:00",
    timezone: "UTC",
    repeat24h: false,
  });
  const [trackFormData, setTrackFormData] = useState({
    title: "",
    artist: "",
    album: "",
    coverUrl: "",
    soundcloudUrl: "",
  });

  const { data: shows = [] } = useQuery<RadioShow[]>({
    queryKey: ["radioShows"],
    queryFn: queryFunctions.radioShows,
  });

  const { data: recentTracks = [] } = useQuery<RadioTrack[]>({
    queryKey: ["recentRadioTracks"],
    queryFn: async () => {
      try {
        return await db.radioTracks.getRecent(20);
      } catch {
        return [];
      }
    },
  });

  const toggleDayRepeat24hMutation = useMutation({
    mutationFn: async ({ day, enabled }: { day: number; enabled: boolean }) => {
      const dayShows = shows.filter((show) => show.dayOfWeek === day);
      const updates = dayShows.map(show => 
        db.radioShows.update(show.id, { repeat24h: enabled })
      );
      await Promise.all(updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["radioShows"] });
      const dayLabel = daysOfWeek.find(d => d.value === variables.day)?.label || '';
      toast({
        title: "24h Repeat Updated",
        description: `24-hour repeat mode ${variables.enabled ? 'enabled' : 'disabled'} for ${dayLabel}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update 24h repeat mode",
        variant: "destructive",
      });
    },
  });

  const deleteTrackMutation = useMutation({
    mutationFn: async (id: string) => {
      return db.radioTracks.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recentRadioTracks"] });
      toast({
        title: "Track deleted",
        description: "The track has been removed from recent streams.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete track",
        variant: "destructive",
      });
    },
  });

  const createTrackMutation = useMutation({
    mutationFn: async (track: Partial<RadioTrack>) => {
      return db.radioTracks.create(track);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recentRadioTracks"] });
      toast({
        title: "Stream added",
        description: "The track has been added to recent streams.",
      });
      setIsTrackDialogOpen(false);
      resetTrackForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add track",
        variant: "destructive",
      });
    },
  });

  const fetchTrackSoundcloudMetadata = async () => {
    if (!trackSoundcloudUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a SoundCloud URL",
        variant: "destructive",
      });
      return;
    }

    setIsFetchingTrackSoundcloud(true);
    try {
      const response = await fetch(
        `https://soundcloud.com/oembed?url=${encodeURIComponent(trackSoundcloudUrl)}&format=json`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch SoundCloud metadata");
      }

      const data = await response.json();
      
      const titleMatch = data.title?.match(/^(.+?) by (.+)$/);
      const extractedTitle = titleMatch ? titleMatch[1] : data.title || "";
      const extractedArtist = titleMatch ? titleMatch[2] : data.author_name || "";
      const thumbnailUrl = data.thumbnail_url || "";

      setTrackFormData(prev => ({
        ...prev,
        title: extractedTitle || prev.title,
        artist: extractedArtist || prev.artist,
        coverUrl: thumbnailUrl || prev.coverUrl,
        soundcloudUrl: trackSoundcloudUrl,
      }));

      toast({
        title: "Metadata fetched",
        description: "SoundCloud track info has been auto-filled.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch SoundCloud metadata. Please check the URL.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingTrackSoundcloud(false);
    }
  };

  const resetTrackForm = () => {
    setTrackSoundcloudUrl("");
    setTrackFormData({
      title: "",
      artist: "",
      album: "",
      coverUrl: "",
      soundcloudUrl: "",
    });
  };

  const handleSaveTrack = () => {
    if (!trackFormData.title || !trackFormData.artist) {
      toast({
        title: "Error",
        description: "Please fill in title and artist",
        variant: "destructive",
      });
      return;
    }
    createTrackMutation.mutate({
      title: trackFormData.title,
      artist: trackFormData.artist,
      album: trackFormData.album || undefined,
      coverUrl: trackFormData.coverUrl || undefined,
      soundcloudUrl: trackFormData.soundcloudUrl || undefined,
      playedAt: new Date().toISOString(),
    });
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return db.radioShows.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["radioShows"] });
      toast({
        title: "Show deleted",
        description: "The radio show has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete show",
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { isEdit: boolean; id?: string; show: Partial<RadioShow> }) => {
      if (data.isEdit && data.id) {
        return db.radioShows.update(data.id, data.show);
      } else {
        return db.radioShows.create(data.show);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["radioShows"] });
      toast({
        title: variables.isEdit ? "Show updated" : "Show created",
        description: variables.isEdit ? "The radio show has been updated." : "The radio show has been created.",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save show",
        variant: "destructive",
      });
    },
  });

  const fetchSoundcloudMetadata = async () => {
    if (!soundcloudUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a SoundCloud URL",
        variant: "destructive",
      });
      return;
    }

    setIsFetchingSoundcloud(true);
    try {
      const response = await fetch(
        `https://soundcloud.com/oembed?url=${encodeURIComponent(soundcloudUrl)}&format=json`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch SoundCloud metadata");
      }

      const data = await response.json();
      
      const titleMatch = data.title?.match(/^(.+?) by (.+)$/);
      const extractedTitle = titleMatch ? titleMatch[1] : data.title || "";
      const extractedArtist = titleMatch ? titleMatch[2] : data.author_name || "";
      
      const thumbnailUrl = data.thumbnail_url || "";

      setFormData(prev => ({
        ...prev,
        title: extractedTitle || prev.title,
        hostName: extractedArtist || prev.hostName,
        description: data.description || prev.description,
        coverUrl: thumbnailUrl || prev.coverUrl,
        hostImageUrl: thumbnailUrl || prev.hostImageUrl,
      }));

      toast({
        title: "Metadata fetched",
        description: "SoundCloud track info has been auto-filled.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch SoundCloud metadata. Please check the URL.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingSoundcloud(false);
    }
  };

  const handleEdit = (show: RadioShow) => {
    setEditingShow(show);
    setSoundcloudUrl("");
    setFormData({
      title: show.title || "",
      hostName: show.hostName || "",
      description: show.description || "",
      hostImageUrl: show.hostImageUrl || "",
      coverUrl: show.coverUrl || "",
      recordedUrl: show.recordedUrl || "",
      dayOfWeek: show.dayOfWeek || 1,
      startTime: show.startTime || "00:00",
      endTime: show.endTime || "00:00",
      timezone: show.timezone || "UTC",
      repeat24h: false, // Not used in form anymore
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this show?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSave = () => {
    const slug = formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const showData: Partial<RadioShow> = {
      title: formData.title,
      slug,
      hostName: formData.hostName,
      description: formData.description,
      hostImageUrl: formData.hostImageUrl,
      coverUrl: formData.coverUrl,
      recordedUrl: formData.recordedUrl,
      dayOfWeek: formData.dayOfWeek,
      startTime: formData.startTime,
      endTime: formData.endTime,
      timezone: formData.timezone,
      isLive: editingShow?.isLive ?? false,
      published: editingShow?.published ?? true,
    };
    
    saveMutation.mutate({
      isEdit: !!editingShow,
      id: editingShow?.id,
      show: showData,
    });
  };

  const resetForm = () => {
    setEditingShow(null);
    setSoundcloudUrl("");
    setFormData({
      title: "",
      hostName: "",
      description: "",
      hostImageUrl: "",
      coverUrl: "",
      recordedUrl: "",
      dayOfWeek: 1,
      startTime: "00:00",
      endTime: "00:00",
      timezone: "UTC",
      repeat24h: false,
    });
  };

  const handleOpenNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Force periodic rerenders so Live/Upcoming badges update without refresh.
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);
  const now = useMemo(() => new Date(nowTick), [nowTick]);

  const [liveListenerCount, setLiveListenerCount] = useState<number | null>(null);
  useEffect(() => {
    const unsubscribe = subscribeToListenerCount((count) => {
      setLiveListenerCount(count);
    });
    return () => unsubscribe();
  }, []);

  const todayShowsCount = useMemo(() => {
    const today = new Date().getDay();
    return shows.filter((s) => s.published && s.dayOfWeek === today).length;
  }, [shows]);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Radio Shows</h1>
            <p className="text-sm text-muted-foreground">Manage radio show schedule</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="w-full sm:w-auto flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded">
              <Users className="h-3.5 w-3.5" />
              <span>{liveListenerCount !== null ? liveListenerCount : "-"}</span>
              <span className="text-xs">listeners</span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs">Total Tracks today {todayShowsCount}</span>
            </div>
            <Button size="sm" onClick={handleOpenNew} className="w-full sm:w-auto">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Show
            </Button>
          </div>
        </div>

        <Tabs defaultValue="shows" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="shows">Shows</TabsTrigger>
            <TabsTrigger value="recent">Recent Streams</TabsTrigger>
          </TabsList>

          <TabsContent value="shows" className="space-y-4">
            {daysOfWeek.map((day) => {
              const dayShows = shows.filter((show) => show.dayOfWeek === day.value);
              const dayRepeat24h = dayShows.length > 0 && dayShows.every((show) => show.repeat24h);
              
              return (
                <Collapsible key={day.value} defaultOpen={dayShows.length > 0}>
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardContent className="p-4 cursor-pointer hover:bg-muted/50 transition-colors group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-base">{day.label}</h3>
                            <Badge
                              variant={dayShows.length > 0 ? "outline" : "secondary"}
                              className={dayShows.length > 0 ? "text-xs border-primary/30 text-primary" : "text-xs opacity-70"}
                            >
                              {dayShows.length} {dayShows.length === 1 ? 'show' : 'shows'}
                            </Badge>
                            {dayRepeat24h && (
                              <Badge variant="default" className="text-xs gap-1">
                                <Repeat className="h-3 w-3" />
                                24h Repeat
                              </Badge>
                            )}
                          </div>
                          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 space-y-3">
                        {/* 24h Repeat Switch for the Day */}
                        {dayShows.length > 0 && (
                          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                            <div className="space-y-0.5">
                              <Label htmlFor={`repeat24h-${day.value}`} className="text-sm font-medium cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <Repeat className="h-4 w-4" />
                                  24-Hour Repeat Mode
                                </div>
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                Play all shows for {day.label} continuously in a loop for 24 hours
                              </p>
                            </div>
                            <Switch
                              id={`repeat24h-${day.value}`}
                              checked={dayRepeat24h}
                              onCheckedChange={(checked) => toggleDayRepeat24hMutation.mutate({ day: day.value, enabled: checked })}
                              disabled={toggleDayRepeat24hMutation.isPending}
                            />
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          {dayShows.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">
                              No shows scheduled for {day.label}
                            </p>
                          ) : (
                            dayShows
                              .sort((a, b) => {
                                if (!a.startTime) return 1;
                                if (!b.startTime) return -1;
                                return parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime);
                              })
                              .map((show) => (
                                <Card 
                                  key={show.id} 
                                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                                  onClick={() => handleEdit(show)}
                                >
                                  <CardContent className="p-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-muted rounded-full overflow-hidden flex-shrink-0">
                                        {show.hostImageUrl ? (
                                          <img src={resolveMediaUrl(show.hostImageUrl, "thumb")} alt={show.hostName} className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center">
                                            <Radio className="h-4 w-4 text-muted-foreground" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <h4 className="font-medium text-sm truncate">{show.title}</h4>
                                          <StatusBadge show={show} shows={shows} now={now} />
                                          {show.repeat24h && (
                                            <Badge variant="secondary" className="text-[10px] gap-1">
                                              <Repeat className="h-2.5 w-2.5" />
                                              24h
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                          {show.hostName} • {show.startTime}-{show.endTime}
                                        </p>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-7 w-7" 
                                          onClick={(e) => { e.stopPropagation(); handleEdit(show); }}
                                        >
                                          <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-7 w-7" 
                                          onClick={(e) => handleDelete(show.id, e)}
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </TabsContent>

          <TabsContent value="recent" className="space-y-2">
            <div className="flex justify-end mb-2">
              <Button size="sm" onClick={() => { resetTrackForm(); setIsTrackDialogOpen(true); }}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Stream
              </Button>
            </div>
            {recentTracks.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent streams found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-2">
                {recentTracks.map((track) => (
                  <Card 
                    key={track.id} 
                    className={track.soundcloudUrl ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
                    onClick={() => {
                      if (track.soundcloudUrl) {
                        window.open(track.soundcloudUrl, '_blank', 'noopener,noreferrer');
                      }
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded overflow-hidden flex-shrink-0">
                          {track.coverUrl ? (
                            <img src={resolveMediaUrl(track.coverUrl, "thumb")} alt={track.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm truncate">{track.title}</h3>
                            {track.soundcloudUrl && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-orange-500 border-orange-500/20">
                                <ExternalLink className="h-2.5 w-2.5 mr-1" />
                                SoundCloud
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {track.artist} {track.album ? `• ${track.album}` : ''} • {new Date(track.playedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7" 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Are you sure you want to delete this track?")) {
                                deleteTrackMutation.mutate(track.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-full max-w-full sm:max-w-2xl sm:max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                {editingShow ? "Edit Show" : "Add New Show"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4 w-full min-w-0 overflow-x-hidden">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CloudDownload className="h-4 w-4 text-orange-500" />
                  <h3 className="text-sm font-medium">Import from SoundCloud</h3>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Paste SoundCloud track URL..."
                    value={soundcloudUrl}
                    onChange={(e) => setSoundcloudUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={fetchSoundcloudMetadata}
                    disabled={isFetchingSoundcloud}
                  >
                    {isFetchingSoundcloud ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Fetch"
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Auto-fill title, artist, and artwork from a SoundCloud URL
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Show Information</h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Show Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter show title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hostName">Host Name</Label>
                    <Input
                      id="hostName"
                      placeholder="Enter host name"
                      value={formData.hostName}
                      onChange={(e) => setFormData({ ...formData, hostName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      rows={3}
                      placeholder="Describe the show..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Images</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Host Image</Label>
                    <ImageUpload
                      currentImage={formData.hostImageUrl}
                      onUploadComplete={(url) => setFormData({ ...formData, hostImageUrl: url })}
                      bucket="media"
                      folder="hosts"
                      aspectRatio="square"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Show Cover Image</Label>
                    <ImageUpload
                      currentImage={formData.coverUrl}
                      onUploadComplete={(url) => setFormData({ ...formData, coverUrl: url })}
                      bucket="media"
                      folder="shows"
                      aspectRatio="square"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Audio</h3>
                <div className="space-y-2">
                  <Label>Recorded Episode</Label>
                  <AudioUpload
                    currentAudio={formData.recordedUrl}
                    onUploadComplete={(url) => setFormData({ ...formData, recordedUrl: url })}
                    bucket="media"
                    folder="radio-recordings"
                  />
                  {formData.recordedUrl && (
                    <p className="text-xs text-muted-foreground truncate">
                      Current: {formData.recordedUrl}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Schedule</h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dayOfWeek">Day of Week</Label>
                    <Select 
                      value={formData.dayOfWeek.toString()} 
                      onValueChange={(value) => setFormData({ ...formData, dayOfWeek: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {daysOfWeek.map((day) => (
                          <SelectItem key={day.value} value={day.value.toString()}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select 
                      value={formData.timezone} 
                      onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                        <SelectItem value="America/New_York">EST/EDT (Eastern Time)</SelectItem>
                        <SelectItem value="America/Chicago">CST/CDT (Central Time)</SelectItem>
                        <SelectItem value="America/Denver">MST/MDT (Mountain Time)</SelectItem>
                        <SelectItem value="America/Los_Angeles">PST/PDT (Pacific Time)</SelectItem>
                        <SelectItem value="Europe/London">GMT/BST (London)</SelectItem>
                        <SelectItem value="Europe/Paris">CET/CEST (Paris)</SelectItem>
                        <SelectItem value="Europe/Berlin">CET/CEST (Berlin)</SelectItem>
                        <SelectItem value="Asia/Tokyo">JST (Tokyo)</SelectItem>
                        <SelectItem value="Australia/Sydney">AEST/AEDT (Sydney)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Show"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isTrackDialogOpen} onOpenChange={setIsTrackDialogOpen}>
          <DialogContent className="sm:max-w-md overflow-x-hidden">
            <DialogHeader>
              <DialogTitle>Add Recent Stream</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CloudDownload className="h-4 w-4 text-orange-500" />
                  <h3 className="text-sm font-medium">Import from SoundCloud</h3>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Paste SoundCloud URL..."
                    value={trackSoundcloudUrl}
                    onChange={(e) => setTrackSoundcloudUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={fetchTrackSoundcloudMetadata}
                    disabled={isFetchingTrackSoundcloud}
                  >
                    {isFetchingTrackSoundcloud ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fetch"}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="trackTitle">Title *</Label>
                  <Input
                    id="trackTitle"
                    placeholder="Track title"
                    value={trackFormData.title}
                    onChange={(e) => setTrackFormData({ ...trackFormData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trackArtist">Artist *</Label>
                  <Input
                    id="trackArtist"
                    placeholder="Artist name"
                    value={trackFormData.artist}
                    onChange={(e) => setTrackFormData({ ...trackFormData, artist: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trackAlbum">Album</Label>
                  <Input
                    id="trackAlbum"
                    placeholder="Album name (optional)"
                    value={trackFormData.album}
                    onChange={(e) => setTrackFormData({ ...trackFormData, album: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trackCover">Cover URL</Label>
                  <Input
                    id="trackCover"
                    placeholder="Cover image URL (optional)"
                    value={trackFormData.coverUrl}
                    onChange={(e) => setTrackFormData({ ...trackFormData, coverUrl: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsTrackDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveTrack} disabled={createTrackMutation.isPending}>
                  {createTrackMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Stream"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
