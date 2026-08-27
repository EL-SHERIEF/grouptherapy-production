import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  Trophy,
  Calendar,
  Users,
  Music,
  Vote,
  Crown,
  CheckCircle,
  Link,
  Loader2,
  GripVertical,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/image-upload";
import { AudioUpload } from "@/components/audio-upload";
import { AdminLayout } from "./index";
import { queryClient } from "@/lib/queryClient";
import { db, AwardCategory, AwardPeriod, AwardEntry } from "@/lib/database";
import { resolveMediaUrl } from "@/lib/media";

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  type: "artist" | "track";
  period: "week" | "month";
  isActive: boolean;
  displayOrder: number;
}

interface PeriodFormData {
  categoryId: string;
  name: string;
  startDate: string;
  endDate: string;
  votingOpen: boolean;
}

interface EntryFormData {
  periodId: string;
  artistName: string;
  artistImageUrl: string;
  artistBio: string;
  trackTitle: string;
  trackArtist: string;
  trackCoverUrl: string;
  trackAudioUrl: string;
  spotifyUrl: string;
  appleMusicUrl: string;
  soundcloudUrl: string;
  displayOrder: number;
}

interface FetchedMetadata {
  title: string;
  artistName: string;
  coverUrl: string;
  sourceUrl: string;
  source: 'soundcloud' | 'spotify';
}

async function fetchSoundCloudMetadata(url: string): Promise<FetchedMetadata | null> {
  try {
    const oembedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl);
    if (!response.ok) throw new Error('Failed to fetch SoundCloud metadata');
    const data = await response.json();
    
    let coverUrl = data.thumbnail_url || '';
    if (coverUrl) {
      coverUrl = coverUrl.replace('-t500x500', '-t500x500').replace('-large', '-t500x500');
    }
    
    const title = data.title || '';
    const artistName = data.author_name || '';
    
    return {
      title,
      artistName,
      coverUrl,
      sourceUrl: url,
      source: 'soundcloud',
    };
  } catch (error) {
    console.error('SoundCloud fetch error:', error);
    return null;
  }
}

async function getSpotifyAccessToken(retries = 3): Promise<string | null> {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.error('Spotify credentials not configured. Please add VITE_SPOTIFY_CLIENT_ID and VITE_SPOTIFY_CLIENT_SECRET to your environment variables.');
    return null;
  }
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`),
        },
        body: 'grant_type=client_credentials',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        const errorData = errorText ? JSON.parse(errorText).catch(() => ({})) : {};
        const errorMessage = errorData.error_description || errorData.error || `HTTP ${response.status}`;
        
        if (attempt < retries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        
        throw new Error(`Failed to get Spotify access token: ${errorMessage}`);
      }
      
      const data = await response.json();
      if (!data.access_token) {
        throw new Error('No access token in response');
      }
      
      return data.access_token;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (attempt === retries) {
        console.error(`Error getting Spotify access token after ${retries} attempts:`, errorMessage);
        // Check for specific error types
        if (errorMessage.includes('NetworkError') || errorMessage.includes('Failed to fetch')) {
          console.error('Network error - check your internet connection and CORS settings');
        }
        return null;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  return null;
}

function extractSpotifyIdAndType(url: string): { id: string; type: 'track' | 'album' } | null {
  // Handle both spotify.com and open.spotify.com URLs
  const trackMatch = url.match(/(?:open\.)?spotify\.com\/track\/([a-zA-Z0-9]+)/);
  if (trackMatch && trackMatch[1]) {
    return { id: trackMatch[1], type: 'track' };
  }
  
  const albumMatch = url.match(/(?:open\.)?spotify\.com\/album\/([a-zA-Z0-9]+)/);
  if (albumMatch && albumMatch[1]) {
    return { id: albumMatch[1], type: 'album' };
  }
  
  return null;
}

async function fetchSpotifyMetadata(url: string): Promise<FetchedMetadata | null> {
  try {
    const extracted = extractSpotifyIdAndType(url);
    if (!extracted) {
      console.error('Could not extract Spotify ID from URL. Please ensure the URL is a valid Spotify track or album link.');
      return null;
    }

    const accessToken = await getSpotifyAccessToken();
    if (!accessToken) {
      console.error('Could not get Spotify access token. Please check your Spotify API credentials.');
      return null;
    }

    const apiUrl = extracted.type === 'track' 
      ? `https://api.spotify.com/v1/tracks/${extracted.id}`
      : `https://api.spotify.com/v1/albums/${extracted.id}`;

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Failed to fetch Spotify ${extracted.type}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorMessage;
      } catch {
        // If parsing fails, use default message
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    let title = '';
    let artistName = '';
    let coverUrl = '';

    if (extracted.type === 'track') {
      title = data.name || '';
      artistName = data.artists?.map((a: { name: string }) => a.name).join(', ') || '';
      coverUrl = data.album?.images?.[0]?.url || '';
    } else {
      title = data.name || '';
      artistName = data.artists?.map((a: { name: string }) => a.name).join(', ') || '';
      coverUrl = data.images?.[0]?.url || '';
    }
    
    return {
      title,
      artistName,
      coverUrl,
      sourceUrl: url,
      source: 'spotify',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Spotify fetch error:', errorMessage);
    return null;
  }
}

function detectLinkType(url: string): 'soundcloud' | 'spotify' | null {
  if (url.includes('soundcloud.com')) return 'soundcloud';
  if (url.includes('spotify.com') || url.includes('open.spotify.com')) return 'spotify';
  return null;
}

const defaultCategoryForm: CategoryFormData = {
  name: "",
  slug: "",
  description: "",
  type: "artist",
  period: "month",
  isActive: true,
  displayOrder: 0,
};

const defaultPeriodForm: PeriodFormData = {
  categoryId: "",
  name: "",
  startDate: "",
  endDate: "",
  votingOpen: false,
};

const defaultEntryForm: EntryFormData = {
  periodId: "",
  artistName: "",
  artistImageUrl: "",
  artistBio: "",
  trackTitle: "",
  trackArtist: "",
  trackCoverUrl: "",
  trackAudioUrl: "",
  spotifyUrl: "",
  appleMusicUrl: "",
  soundcloudUrl: "",
  displayOrder: 0,
};

export default function AdminAwards() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("categories");

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AwardCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>(defaultCategoryForm);

  const [periodDialogOpen, setPeriodDialogOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<AwardPeriod | null>(null);
  const [periodForm, setPeriodForm] = useState<PeriodFormData>(defaultPeriodForm);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AwardEntry | null>(null);
  const [entryForm, setEntryForm] = useState<EntryFormData>(defaultEntryForm);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [quickAddLink, setQuickAddLink] = useState("");
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [metadataFetched, setMetadataFetched] = useState(false);

  const { data: categories = [] } = useQuery<AwardCategory[]>({
    queryKey: ["awardCategories"],
    queryFn: () => db.awards.categories.getAll(),
  });

  const { data: periods = [] } = useQuery<AwardPeriod[]>({
    queryKey: ["awardPeriods"],
    queryFn: () => db.awards.periods.getAll(),
  });

  const { data: entries = [] } = useQuery<AwardEntry[]>({
    queryKey: ["awardEntries", selectedPeriodId],
    queryFn: () => selectedPeriodId ? db.awards.entries.getByPeriodId(selectedPeriodId) : Promise.resolve([]),
    enabled: !!selectedPeriodId,
  });

  const [orderedEntries, setOrderedEntries] = useState<AwardEntry[]>([]);
  const [draggingEntryId, setDraggingEntryId] = useState<string | null>(null);
  const orderedEntriesRef = useRef<AwardEntry[]>([]);
  const dragStateRef = useRef<{ entryId: string | null; didMove: boolean }>({
    entryId: null,
    didMove: false,
  });
  const bodyStyleRef = useRef<{ userSelect: string; cursor: string }>({ userSelect: "", cursor: "" });

  useEffect(() => {
    setOrderedEntries(entries);
    orderedEntriesRef.current = entries;
    dragStateRef.current = { entryId: null, didMove: false };
    setDraggingEntryId(null);
  }, [entries]);

  useEffect(() => {
    orderedEntriesRef.current = orderedEntries;
  }, [orderedEntries]);

  const saveCategoryMutation = useMutation({
    mutationFn: async (data: { isEdit: boolean; id?: string; category: Partial<AwardCategory> }) => {
      if (data.isEdit && data.id) {
        return db.awards.categories.update(data.id, data.category);
      } else {
        return db.awards.categories.create(data.category);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["awardCategories"] });
      toast({
        title: variables.isEdit ? "Category updated" : "Category created",
        description: variables.isEdit ? "The award category has been updated." : "The award category has been created.",
      });
      setCategoryDialogOpen(false);
      resetCategoryForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save category",
        variant: "destructive",
      });
    },
  });

  const moveEntry = (fromEntryId: string, toEntryId: string) => {
    setOrderedEntries((prev) => {
      const fromIndex = prev.findIndex((e) => e.id === fromEntryId);
      const toIndex = prev.findIndex((e) => e.id === toEntryId);
      if (fromIndex < 0 || toIndex < 0) return prev;
      if (fromIndex === toIndex) return prev;

      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      if (!moved) return prev;
      next.splice(toIndex, 0, moved);
      orderedEntriesRef.current = next;
      return next;
    });
  };

  const handleEntryPointerDown = (event: ReactPointerEvent<HTMLButtonElement>, entryId: string) => {
    event.preventDefault();
    event.stopPropagation();

    dragStateRef.current = { entryId, didMove: false };
    setDraggingEntryId(entryId);

    event.currentTarget.setPointerCapture(event.pointerId);

    bodyStyleRef.current = {
      userSelect: document.body.style.userSelect,
      cursor: document.body.style.cursor,
    };
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
  };

  const handleEntryPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const draggingId = dragStateRef.current.entryId;
    if (!draggingId) return;

    const target = document.elementFromPoint(event.clientX, event.clientY);
    const rowEl = target?.closest?.('[data-entry-row="true"]') as HTMLElement | null;
    const overId = rowEl?.getAttribute("data-entry-id");
    if (!overId) return;
    if (overId === draggingId) return;

    dragStateRef.current.didMove = true;
    moveEntry(draggingId, overId);
  };

  const handleEntryPointerEnd = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const didMove = dragStateRef.current.didMove;
    dragStateRef.current = { entryId: null, didMove: false };
    setDraggingEntryId(null);

    document.body.style.userSelect = bodyStyleRef.current.userSelect;
    document.body.style.cursor = bodyStyleRef.current.cursor;

    if (didMove) {
      updateEntryOrderMutation.mutate(orderedEntriesRef.current);
    }
  };

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => db.awards.categories.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["awardCategories"] });
      toast({ title: "Category deleted", description: "The award category has been removed." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to delete category", variant: "destructive" });
    },
  });

  const savePeriodMutation = useMutation({
    mutationFn: async (data: { isEdit: boolean; id?: string; period: Partial<AwardPeriod> }) => {
      if (data.isEdit && data.id) {
        return db.awards.periods.update(data.id, data.period);
      } else {
        return db.awards.periods.create(data.period);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["awardPeriods"] });
      toast({
        title: variables.isEdit ? "Period updated" : "Period created",
        description: variables.isEdit ? "The voting period has been updated." : "The voting period has been created.",
      });
      setPeriodDialogOpen(false);
      resetPeriodForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save period",
        variant: "destructive",
      });
    },
  });

  const deletePeriodMutation = useMutation({
    mutationFn: (id: string) => db.awards.periods.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["awardPeriods"] });
      toast({ title: "Period deleted", description: "The voting period has been removed." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to delete period", variant: "destructive" });
    },
  });

  const toggleVotingMutation = useMutation({
    mutationFn: async ({ id, votingOpen }: { id: string; votingOpen: boolean }) => {
      return db.awards.periods.update(id, { votingOpen });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["awardPeriods"] });
      toast({ title: "Voting status updated" });
    },
  });

  const saveEntryMutation = useMutation({
    mutationFn: async (data: { isEdit: boolean; id?: string; entry: Partial<AwardEntry> }) => {
      if (data.isEdit && data.id) {
        return db.awards.entries.update(data.id, data.entry);
      } else {
        return db.awards.entries.create(data.entry);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["awardEntries", selectedPeriodId] });
      toast({
        title: variables.isEdit ? "Entry updated" : "Entry created",
        description: variables.isEdit ? "The nominee has been updated." : "The nominee has been added.",
      });
      setEntryDialogOpen(false);
      resetEntryForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save entry",
        variant: "destructive",
      });
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (id: string) => db.awards.entries.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["awardEntries", selectedPeriodId] });
      toast({ title: "Entry deleted", description: "The nominee has been removed." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to delete entry", variant: "destructive" });
    },
  });

  const declareWinnerMutation = useMutation({
    mutationFn: async ({ entryId, periodId }: { entryId: string; periodId: string }) => {
      await db.awards.entries.update(entryId, { isWinner: true });
      await db.awards.periods.update(periodId, { winnerId: entryId, announcedAt: new Date().toISOString(), votingOpen: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["awardEntries", selectedPeriodId] });
      queryClient.invalidateQueries({ queryKey: ["awardPeriods"] });
      toast({ title: "Winner declared!", description: "The winner has been announced." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to declare winner", variant: "destructive" });
    },
  });

  const updateEntryOrderMutation = useMutation({
    mutationFn: async (nextEntries: AwardEntry[]) => {
      const updates = nextEntries.map((e, idx) => ({ id: e.id, displayOrder: idx }));
      await Promise.all(
        updates.map((u) => db.awards.entries.update(u.id, { displayOrder: u.displayOrder }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["awardEntries", selectedPeriodId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update nominee order",
        variant: "destructive",
      });
    },
  });

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryForm(defaultCategoryForm);
  };

  const resetPeriodForm = () => {
    setEditingPeriod(null);
    setPeriodForm(defaultPeriodForm);
  };

  const resetEntryForm = () => {
    setEditingEntry(null);
    setEntryForm(defaultEntryForm);
    setQuickAddLink("");
    setIsFetchingMetadata(false);
    setMetadataFetched(false);
  };

  const handleEditCategory = (category: AwardCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      type: category.type,
      period: category.period,
      isActive: category.isActive,
      displayOrder: category.displayOrder,
    });
    setCategoryDialogOpen(true);
  };

  const handleSaveCategory = () => {
    const slug = categoryForm.slug || categoryForm.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    saveCategoryMutation.mutate({
      isEdit: !!editingCategory,
      id: editingCategory?.id,
      category: { ...categoryForm, slug },
    });
  };

  const handleEditPeriod = (period: AwardPeriod) => {
    setEditingPeriod(period);
    setPeriodForm({
      categoryId: period.categoryId,
      name: period.name,
      startDate: period.startDate ? new Date(period.startDate).toISOString().slice(0, 10) : "",
      endDate: period.endDate ? new Date(period.endDate).toISOString().slice(0, 10) : "",
      votingOpen: period.votingOpen,
    });
    setPeriodDialogOpen(true);
  };

  const handleSavePeriod = () => {
    savePeriodMutation.mutate({
      isEdit: !!editingPeriod,
      id: editingPeriod?.id,
      period: periodForm,
    });
  };

  const handleEditEntry = (entry: AwardEntry) => {
    setEditingEntry(entry);
    setEntryForm({
      periodId: entry.periodId,
      artistName: entry.artistName || "",
      artistImageUrl: entry.artistImageUrl || "",
      artistBio: entry.artistBio || "",
      trackTitle: entry.trackTitle || "",
      trackArtist: entry.trackArtist || "",
      trackCoverUrl: entry.trackCoverUrl || "",
      trackAudioUrl: entry.trackAudioUrl || "",
      spotifyUrl: entry.spotifyUrl || "",
      appleMusicUrl: entry.appleMusicUrl || "",
      soundcloudUrl: entry.soundcloudUrl || "",
      displayOrder: entry.displayOrder,
    });
    setEntryDialogOpen(true);
  };

  const handleQuickAddLink = async (url: string) => {
    setQuickAddLink(url);
    
    if (!url.trim()) return;
    
    const linkType = detectLinkType(url);
    if (!linkType) {
      return;
    }
    
    setIsFetchingMetadata(true);
    
    try {
      let metadata: FetchedMetadata | null = null;
      
      if (linkType === 'soundcloud') {
        metadata = await fetchSoundCloudMetadata(url);
      } else if (linkType === 'spotify') {
        metadata = await fetchSpotifyMetadata(url);
      }
      
      if (metadata) {
        const categoryType = getSelectedCategory()?.type;
        setEntryForm(prev => ({
          ...prev,
          ...(categoryType === 'artist' ? {
            artistName: metadata!.artistName || prev.artistName,
            artistImageUrl: metadata!.coverUrl || prev.artistImageUrl,
          } : {
            trackTitle: metadata!.title || prev.trackTitle,
            trackArtist: metadata!.artistName || prev.trackArtist,
            trackCoverUrl: metadata!.coverUrl || prev.trackCoverUrl,
          }),
          ...(linkType === 'soundcloud' ? { soundcloudUrl: url } : {}),
          ...(linkType === 'spotify' ? { spotifyUrl: url } : {}),
        }));
        
        setMetadataFetched(true);
        
        toast({
          title: "Metadata fetched",
          description: `Successfully imported from ${linkType === 'soundcloud' ? 'SoundCloud' : 'Spotify'}`,
        });
      } else {
        const errorMsg = linkType === 'spotify' 
          ? "Could not fetch metadata from Spotify. Please check your Spotify API credentials (VITE_SPOTIFY_CLIENT_ID and VITE_SPOTIFY_CLIENT_SECRET) or enter details manually."
          : "Could not fetch metadata. Please enter the details manually.";
        toast({
          title: "Could not fetch metadata",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error fetching metadata",
        description: "Please enter the details manually.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  const handleSaveEntry = () => {
    saveEntryMutation.mutate({
      isEdit: !!editingEntry,
      id: editingEntry?.id,
      entry: {
        ...entryForm,
        periodId: selectedPeriodId,
        voteCount: editingEntry?.voteCount || 0,
        isWinner: editingEntry?.isWinner || false,
      },
    });
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || "Unknown";
  };

  const getPeriodName = (periodId: string) => {
    return periods.find((p) => p.id === periodId)?.name || "Unknown";
  };

  const getSelectedPeriod = () => {
    return periods.find((p) => p.id === selectedPeriodId);
  };

  const getSelectedCategory = () => {
    const period = getSelectedPeriod();
    return period ? categories.find((c) => c.id === period.categoryId) : null;
  };

  const filteredPeriods = selectedCategoryId
    ? periods.filter((p) => p.categoryId === selectedCategoryId)
    : periods;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Trophy className="h-8 w-8" />
              Awards Management
            </h1>
            <p className="text-muted-foreground">
              Manage Therapy Awards categories, voting periods, and nominees
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="periods" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Periods
            </TabsTrigger>
            <TabsTrigger value="entries" className="flex items-center gap-2">
              <Vote className="h-4 w-4" />
              Entries
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Award Categories</h2>
              <Button onClick={() => setCategoryDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow 
                      key={category.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleEditCategory(category)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-muted-foreground select-none">{category.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={category.type === "artist" ? "default" : "secondary"}>
                          {category.type === "artist" ? <Users className="h-3 w-3 mr-1" /> : <Music className="h-3 w-3 mr-1" />}
                          {category.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{category.period}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={category.isActive ? "default" : "secondary"}>
                          {category.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{category.displayOrder}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditCategory(category)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this category?")) {
                                deleteCategoryMutation.mutate(category.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {categories.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No award categories found. Create one to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="periods" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <h2 className="text-xl font-semibold">Voting Periods</h2>
                <Select value={selectedCategoryId || "all"} onValueChange={(val) => setSelectedCategoryId(val === "all" ? "" : val)}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setPeriodDialogOpen(true)} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Period
              </Button>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Voting</TableHead>
                    <TableHead>Winner</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPeriods.map((period) => (
                    <TableRow 
                      key={period.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleEditPeriod(period)}
                    >
                      <TableCell className="font-medium">{period.name}</TableCell>
                      <TableCell>{getCategoryName(period.categoryId)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{new Date(period.startDate).toLocaleDateString()}</p>
                          <p className="text-muted-foreground">to {new Date(period.endDate).toLocaleDateString()}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={period.votingOpen}
                            onCheckedChange={(checked) =>
                              toggleVotingMutation.mutate({ id: period.id, votingOpen: checked })
                            }
                          />
                          <span className="text-sm">{period.votingOpen ? "Open" : "Closed"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {period.winnerId ? (
                          <Badge variant="default" className="flex items-center gap-1 w-fit">
                            <Crown className="h-3 w-3" />
                            Announced
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not yet</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditPeriod(period)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this period?")) {
                                deletePeriodMutation.mutate(period.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredPeriods.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No voting periods found. Create one to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="entries" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <h2 className="text-xl font-semibold">Nominees / Entries</h2>
                <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
                  <SelectTrigger className="w-full sm:w-[300px]">
                    <SelectValue placeholder="Select a voting period" />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map((period) => (
                      <SelectItem key={period.id} value={period.id}>
                        {period.name} ({getCategoryName(period.categoryId)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => setEntryDialogOpen(true)}
                disabled={!selectedPeriodId}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Nominee
              </Button>
            </div>

            {selectedPeriodId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>
                      {getPeriodName(selectedPeriodId)} - {getCategoryName(getSelectedPeriod()?.categoryId || "")}
                    </span>
                    {getSelectedPeriod()?.votingOpen && (
                      <Badge variant="default">Voting Open</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="select-none">
                        <TableHead className="w-10" />
                        <TableHead>Nominee</TableHead>
                        <TableHead>Votes</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderedEntries.map((entry) => (
                        <TableRow 
                          key={entry.id} 
                          data-entry-row="true"
                          data-entry-id={entry.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => {
                            if (draggingEntryId) return;
                            handleEditEntry(entry);
                          }}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onPointerDown={(e) => handleEntryPointerDown(e, entry.id)}
                              onPointerMove={handleEntryPointerMove}
                              onPointerUp={handleEntryPointerEnd}
                              onPointerCancel={handleEntryPointerEnd}
                              className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 touch-none"
                              aria-label="Drag to reorder"
                            >
                              <GripVertical className="h-4 w-4" />
                            </button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3 select-none">
                              {(entry.artistImageUrl || entry.trackCoverUrl) && (
                                <img
                                  src={resolveMediaUrl(entry.artistImageUrl || entry.trackCoverUrl, "thumb")}
                                  alt=""
                                  className="w-10 h-10 rounded-full object-cover select-none"
                                />
                              )}
                              <div>
                                {getSelectedCategory()?.type === "artist" ? (
                                  <p className="font-medium select-none">{entry.artistName}</p>
                                ) : (
                                  <>
                                    <p className="font-medium">{entry.trackTitle}</p>
                                    <p className="text-sm text-muted-foreground select-none">{entry.trackArtist}</p>
                                  </>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-lg px-3 py-1">
                              {entry.voteCount}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {entry.isWinner ? (
                              <Badge variant="default" className="flex items-center gap-1 w-fit">
                                <Crown className="h-3 w-3" />
                                Winner
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">Nominee</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-2">
                              {!entry.isWinner && !getSelectedPeriod()?.winnerId && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm("Declare this entry as the winner? This will also close voting.")) {
                                      declareWinnerMutation.mutate({
                                        entryId: entry.id,
                                        periodId: selectedPeriodId,
                                      });
                                    }
                                  }}
                                >
                                  <Crown className="h-4 w-4 mr-1" />
                                  Declare Winner
                                </Button>
                              )}
                              <Button variant="outline" size="sm" onClick={() => handleEditEntry(entry)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this entry?")) {
                                    deleteEntryMutation.mutate(entry.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {orderedEntries.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No nominees found for this period. Add some to get started.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {!selectedPeriodId && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Select a voting period above to view and manage nominees.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
          <DialogContent className="sm:max-w-lg sm:max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Edit Category" : "Add Award Category"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="cat-name">Category Name</Label>
                <Input
                  id="cat-name"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g., Artist of the Month"
                />
              </div>
              <div>
                <Label htmlFor="cat-slug">Slug</Label>
                <Input
                  id="cat-slug"
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  placeholder="auto-generated from name if empty"
                />
              </div>
              <div>
                <Label htmlFor="cat-desc">Description</Label>
                <Textarea
                  id="cat-desc"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select
                    value={categoryForm.type}
                    onValueChange={(v) => setCategoryForm({ ...categoryForm, type: v as "artist" | "track" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="artist">Artist</SelectItem>
                      <SelectItem value="track">Track</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Period</Label>
                  <Select
                    value={categoryForm.period}
                    onValueChange={(v) => setCategoryForm({ ...categoryForm, period: v as "week" | "month" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Weekly</SelectItem>
                      <SelectItem value="month">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cat-order">Display Order</Label>
                  <Input
                    id="cat-order"
                    type="number"
                    value={categoryForm.displayOrder}
                    onChange={(e) => setCategoryForm({ ...categoryForm, displayOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    checked={categoryForm.isActive}
                    onCheckedChange={(checked) => setCategoryForm({ ...categoryForm, isActive: checked })}
                  />
                  <Label>Active</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setCategoryDialogOpen(false); resetCategoryForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleSaveCategory}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={periodDialogOpen} onOpenChange={setPeriodDialogOpen}>
          <DialogContent className="sm:max-w-lg sm:max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <DialogHeader>
              <DialogTitle>{editingPeriod ? "Edit Period" : "Add Voting Period"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={periodForm.categoryId}
                  onValueChange={(v) => setPeriodForm({ ...periodForm, categoryId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="period-name">Period Name</Label>
                <Input
                  id="period-name"
                  value={periodForm.name}
                  onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })}
                  placeholder="e.g., December 2024"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="period-start">Start Date</Label>
                  <Input
                    id="period-start"
                    type="date"
                    value={periodForm.startDate}
                    onChange={(e) => setPeriodForm({ ...periodForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="period-end">End Date</Label>
                  <Input
                    id="period-end"
                    type="date"
                    value={periodForm.endDate}
                    onChange={(e) => setPeriodForm({ ...periodForm, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={periodForm.votingOpen}
                  onCheckedChange={(checked) => setPeriodForm({ ...periodForm, votingOpen: checked })}
                />
                <Label>Open Voting</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setPeriodDialogOpen(false); resetPeriodForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleSavePeriod}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={entryDialogOpen} onOpenChange={setEntryDialogOpen}>
          <DialogContent className="sm:max-w-2xl sm:max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <DialogHeader>
              <DialogTitle>{editingEntry ? "Edit Nominee" : "Add Nominee"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {!editingEntry && (
                <div className="grid gap-2 p-4 border rounded-lg bg-muted/30">
                  <Label htmlFor="quickAddLink" className="flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    Quick Add from Link
                  </Label>
                  <div className="relative">
                    <Input
                      id="quickAddLink"
                      value={quickAddLink}
                      onChange={(e) => handleQuickAddLink(e.target.value)}
                      placeholder="Paste SoundCloud or Spotify URL..."
                      disabled={isFetchingMetadata}
                      className="pr-10"
                    />
                    {isFetchingMetadata && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Paste a SoundCloud or Spotify link to auto-fill title, artist, and cover image
                  </p>
                </div>
              )}

              {getSelectedCategory()?.type === "artist" ? (
                <>
                  <div>
                    <Label htmlFor="entry-artist-name">
                      Artist Name {!quickAddLink && '*'}
                    </Label>
                    <Input
                      id="entry-artist-name"
                      value={entryForm.artistName}
                      onChange={(e) => setEntryForm({ ...entryForm, artistName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Artist Image {metadataFetched && entryForm.artistImageUrl && "(fetched from link)"}</Label>
                    {metadataFetched && entryForm.artistImageUrl ? (
                      <div className="relative w-full aspect-square max-w-[200px] rounded-lg overflow-hidden border bg-muted">
                        <img 
                          src={entryForm.artistImageUrl} 
                          alt="Artist image" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <ImageUpload
                        onUploadComplete={(url) => setEntryForm({ ...entryForm, artistImageUrl: url })}
                        bucket="media"
                        folder="awards"
                        aspectRatio="square"
                        currentImage={entryForm.artistImageUrl}
                      />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="entry-artist-bio">Artist Bio</Label>
                    <Textarea
                      id="entry-artist-bio"
                      value={entryForm.artistBio}
                      onChange={(e) => setEntryForm({ ...entryForm, artistBio: e.target.value })}
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="entry-track-title">
                        Track Title {!quickAddLink && '*'}
                      </Label>
                      <Input
                        id="entry-track-title"
                        value={entryForm.trackTitle}
                        onChange={(e) => setEntryForm({ ...entryForm, trackTitle: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="entry-track-artist">
                        Artist {!quickAddLink && '*'}
                      </Label>
                      <Input
                        id="entry-track-artist"
                        value={entryForm.trackArtist}
                        onChange={(e) => setEntryForm({ ...entryForm, trackArtist: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Track Cover {metadataFetched && entryForm.trackCoverUrl && "(fetched from link)"}</Label>
                    {metadataFetched && entryForm.trackCoverUrl ? (
                      <div className="relative w-full aspect-square max-w-[200px] rounded-lg overflow-hidden border bg-muted">
                        <img 
                          src={entryForm.trackCoverUrl} 
                          alt="Track cover" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <ImageUpload
                        onUploadComplete={(url) => setEntryForm({ ...entryForm, trackCoverUrl: url })}
                        bucket="media"
                        folder="awards"
                        aspectRatio="square"
                        currentImage={entryForm.trackCoverUrl}
                      />
                    )}
                  </div>
                  <div>
                    <Label>Track Audio</Label>
                    <AudioUpload
                      onUploadComplete={(url) => setEntryForm({ ...entryForm, trackAudioUrl: url })}
                      currentAudio={entryForm.trackAudioUrl}
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label>Streaming Links</Label>
                <Input
                  placeholder="Spotify URL"
                  value={entryForm.spotifyUrl}
                  onChange={(e) => setEntryForm({ ...entryForm, spotifyUrl: e.target.value })}
                />
                <Input
                  placeholder="Apple Music URL"
                  value={entryForm.appleMusicUrl}
                  onChange={(e) => setEntryForm({ ...entryForm, appleMusicUrl: e.target.value })}
                />
                <Input
                  placeholder="SoundCloud URL"
                  value={entryForm.soundcloudUrl}
                  onChange={(e) => setEntryForm({ ...entryForm, soundcloudUrl: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="entry-order">Display Order</Label>
                <Input
                  id="entry-order"
                  type="number"
                  value={entryForm.displayOrder}
                  onChange={(e) => setEntryForm({ ...entryForm, displayOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setEntryDialogOpen(false); resetEntryForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleSaveEntry}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
