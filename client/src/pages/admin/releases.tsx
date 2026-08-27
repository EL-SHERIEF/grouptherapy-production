import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  MoreVertical,
  Link,
  Loader2,
  GripVertical,
} from "lucide-react";
import { useRoute, useLocation } from "wouter";
import { AdminLayout } from "./index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/image-upload";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, queryFunctions } from "@/lib/queryClient";
import { db, Release, type PageSectionConfig, type SiteSettings } from "@/lib/database";
import { useToast } from "@/hooks/use-toast";
import { resolveMediaUrl } from "@/lib/media";

function normalizeFeaturedReleaseIds(savedIds: string[], featuredIds: string[]) {
  const featuredSet = new Set(featuredIds);
  const normalized = (savedIds || []).filter((id) => featuredSet.has(id));
  const normalizedSet = new Set(normalized);
  for (const id of featuredIds) {
    if (!normalizedSet.has(id)) normalized.push(id);
  }
  return normalized;
}

function updateHomeSectionsFeaturedOrder(homeSections: PageSectionConfig[] | undefined, featuredReleaseIds: string[]) {
  const existing = Array.isArray(homeSections) ? homeSections : [];
  const idx = existing.findIndex((s) => s?.id === "releases");
  if (idx === -1) {
    return [
      ...existing,
      {
        id: "releases",
        enabled: true,
        order: 4,
        featuredReleaseIds,
      },
    ];
  }

  return existing.map((s) => (s?.id === "releases" ? { ...s, featuredReleaseIds } : s));
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
        if (errorMessage.includes('NetworkError') || errorMessage.includes('Failed to fetch')) {
          console.error('Network error - check your internet connection and CORS settings');
        }
        return null;
      }
      
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

interface ReleaseFormData {
  title: string;
  artistName: string;
  coverUrl: string;
  releaseDate: string;
  type: string;
  spotifyUrl: string;
  appleMusicUrl: string;
  soundcloudUrl: string;
  featured: boolean;
  published: boolean;
}

const defaultFormData: ReleaseFormData = {
  title: "",
  artistName: "",
  coverUrl: "",
  releaseDate: "",
  type: "single",
  spotifyUrl: "",
  appleMusicUrl: "",
  soundcloudUrl: "",
  featured: false,
  published: false,
};

export default function AdminReleases() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [matchNew] = useRoute("/admin/releases/new");
  const [matchEdit, params] = useRoute("/admin/releases/:id");
  const PAGE_SIZE = 10;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRelease, setEditingRelease] = useState<Release | null>(null);
  const [formData, setFormData] = useState<ReleaseFormData>(defaultFormData);
  const [quickAddLink, setQuickAddLink] = useState("");
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [metadataFetched, setMetadataFetched] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollYRef = useRef(0);
  const restoreScrollPendingRef = useRef(false);
  const restoreScrollTargetPathRef = useRef<string | null>(null);
  const [featuredReleaseIds, setFeaturedReleaseIds] = useState<string[]>([]);
  const [draggingFeaturedReleaseId, setDraggingFeaturedReleaseId] = useState<string | null>(null);
  const [dragOverFeaturedReleaseId, setDragOverFeaturedReleaseId] = useState<string | null>(null);

  const { data: releases } = useQuery<Release[]>({
    queryKey: ["releases"],
    queryFn: queryFunctions.releases,
  });

  const { data: siteSettings } = useQuery<SiteSettings | null>({
    queryKey: ["siteSettings"],
    queryFn: () => db.siteSettings.get(),
  });

  const displayReleases = releases || [];

  const featuredReleases = displayReleases.filter((r) => r.featured);

  useEffect(() => {
    const savedIds =
      siteSettings?.homeSections?.find((s) => s?.id === "releases")?.featuredReleaseIds ?? [];
    const next = normalizeFeaturedReleaseIds(savedIds, featuredReleases.map((r) => r.id));
    setFeaturedReleaseIds((prev) => {
      if (prev.length === next.length && prev.every((id, i) => id === next[i])) return prev;
      return next;
    });
  }, [siteSettings?.homeSections, featuredReleases]);

  const orderedFeaturedReleases = (() => {
    const byId = new Map(featuredReleases.map((r) => [r.id, r] as const));
    const ordered: Release[] = [];
    for (const id of featuredReleaseIds) {
      const r = byId.get(id);
      if (r) ordered.push(r);
    }
    const orderedIds = new Set(ordered.map((r) => r.id));
    for (const r of featuredReleases) {
      if (!orderedIds.has(r.id)) ordered.push(r);
    }
    return ordered;
  })();

  const reorderFeaturedReleaseIds = (fromId: string, toId: string) => {
    setFeaturedReleaseIds((prev) => {
      const fromIndex = prev.indexOf(fromId);
      const toIndex = prev.indexOf(toId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      if (!moved) return prev;
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  useEffect(() => {
    if (matchNew) {
      setEditingRelease(null);
      setFormData(defaultFormData);
      setIsDialogOpen(true);
    } else if (matchEdit && params?.id && params.id !== "new") {
      const release = displayReleases.find(r => r.id === params.id);
      if (release) {
        handleEdit(release);
      } else if (displayReleases.length > 0) {
        db.releases.getById(params.id).then(release => {
          if (release) {
            handleEdit(release);
          }
        });
      }
    }
  }, [matchNew, matchEdit, params?.id, displayReleases.length]);

  useEffect(() => {
    if (!restoreScrollPendingRef.current) return;
    if (!restoreScrollTargetPathRef.current) return;
    if (location !== restoreScrollTargetPathRef.current) return;

    const y = scrollYRef.current;
    restoreScrollPendingRef.current = false;
    restoreScrollTargetPathRef.current = null;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: y, left: 0, behavior: "auto" });
      });
    });
  }, [location]);

  const navigatePreserveScroll = (href: string) => {
    scrollYRef.current = window.scrollY;
    restoreScrollPendingRef.current = true;
    restoreScrollTargetPathRef.current = href;
    setLocation(href);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingRelease(null);
    setFormData(defaultFormData);
    setQuickAddLink("");
    setIsFetchingMetadata(false);
    setMetadataFetched(false);
    restoreScrollPendingRef.current = true;
    restoreScrollTargetPathRef.current = "/admin/releases";
    setLocation("/admin/releases");
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
        setFormData(prev => ({
          ...prev,
          title: metadata!.title || prev.title,
          artistName: metadata!.artistName || prev.artistName,
          coverUrl: metadata!.coverUrl || prev.coverUrl,
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

  const handleEdit = (release: Release) => {
    setEditingRelease(release);
    setFormData({
      title: release.title || "",
      artistName: release.artistName || "",
      coverUrl: release.coverUrl || "",
      releaseDate: release.releaseDate ? new Date(release.releaseDate).toISOString().slice(0, 10) : "",
      type: release.type || "single",
      spotifyUrl: release.spotifyUrl || "",
      appleMusicUrl: release.appleMusicUrl || "",
      soundcloudUrl: release.soundcloudUrl || "",
      featured: release.featured || false,
      published: release.published || false,
    });
    setIsDialogOpen(true);
  };

  const filteredReleases = displayReleases.filter((release) => {
    const matchesSearch =
      release.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      release.artistName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || release.type === filterType;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "published" && release.published) ||
      (filterStatus === "draft" && !release.published);
    return matchesSearch && matchesType && matchesStatus;
  });

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [PAGE_SIZE, searchQuery, filterType, filterStatus]);

  const hasMore = visibleCount < filteredReleases.length;
  const pagedReleases = filteredReleases.slice(0, visibleCount);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredReleases.length));
      },
      { rootMargin: "800px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [PAGE_SIZE, filteredReleases.length, hasMore]);

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      return db.releases.update(id, { published });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["releases"] });
      toast({ title: "Release updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return db.releases.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["releases"] });
      toast({ title: "Release deleted" });
      setDeleteId(null);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { isEdit: boolean; id?: string; release: Partial<Release> }) => {
      if (data.isEdit && data.id) {
        return db.releases.update(data.id, data.release);
      } else {
        return db.releases.create(data.release);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["releases"] });
      toast({
        title: variables.isEdit ? "Release updated" : "Release created",
        description: variables.isEdit ? "The release has been updated." : "The release has been created.",
      });
      handleDialogClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save release",
        variant: "destructive",
      });
    },
  });

  const saveFeaturedOrderMutation = useMutation({
    mutationFn: async (nextIds: string[]) => {
      const nextHomeSections = updateHomeSectionsFeaturedOrder(siteSettings?.homeSections, nextIds);
      return db.siteSettings.update({ homeSections: nextHomeSections });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
      toast({ title: "Featured order saved" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save featured order", variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (!formData.title || !formData.artistName) {
      toast({
        title: "Missing fields",
        description: "Please fill in required fields: title and artist name.",
        variant: "destructive",
      });
      return;
    }

    const slug = formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const releaseData: Partial<Release> = {
      title: formData.title,
      slug,
      artistName: formData.artistName,
      coverUrl: formData.coverUrl || undefined,
      releaseDate: formData.releaseDate ? new Date(formData.releaseDate).toISOString() : undefined,
      type: formData.type,
      spotifyUrl: formData.spotifyUrl || undefined,
      appleMusicUrl: formData.appleMusicUrl || undefined,
      soundcloudUrl: formData.soundcloudUrl || undefined,
      featured: formData.featured,
      published: formData.published,
    };
    
    saveMutation.mutate({
      isEdit: !!editingRelease,
      id: editingRelease?.id,
      release: releaseData,
    });
  };

  useEffect(() => {
    if (!saveMutation.data?.id) return;
    const savedRelease = saveMutation.data;
    const releaseId = savedRelease.id;
    if (!releaseId) return;

    const isFeatured = !!savedRelease.featured;
    setFeaturedReleaseIds((prev) => {
      const has = prev.includes(releaseId);
      if (isFeatured && !has) {
        const next = [...prev, releaseId];
        saveFeaturedOrderMutation.mutate(next);
        return next;
      }
      if (!isFeatured && has) {
        const next = prev.filter((id) => id !== releaseId);
        saveFeaturedOrderMutation.mutate(next);
        return next;
      }
      return prev;
    });
  }, [saveMutation.data]);

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-admin-releases-title">Releases</h1>
            <p className="text-muted-foreground">
              Manage your music catalog
            </p>
          </div>
          <Button 
            className="gap-2" 
            data-testid="button-new-release"
            onClick={() => navigatePreserveScroll("/admin/releases/new")}
          >
            <Plus className="h-4 w-4" />
            Add Release
          </Button>
        </div>

        {featuredReleases.length > 0 ? (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium">Featured Releases</div>
                  <div className="text-xs text-muted-foreground">Drag to reorder featured releases on the homepage</div>
                </div>
                {saveFeaturedOrderMutation.isPending ? (
                  <div className="text-xs text-muted-foreground">Saving...</div>
                ) : null}
              </div>

              <div className="mt-4 w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[56px]"></TableHead>
                      <TableHead className="w-[44px] text-xs text-muted-foreground">#</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="hidden md:table-cell">Artist</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderedFeaturedReleases.map((release, index) => (
                      <TableRow
                        key={release.id}
                        className={
                          "hover:bg-muted/50 " +
                          (dragOverFeaturedReleaseId === release.id ? "ring-2 ring-primary" : "")
                        }
                        onDragOver={(e) => {
                          if (!draggingFeaturedReleaseId) return;
                          e.preventDefault();
                          setDragOverFeaturedReleaseId(release.id);
                        }}
                        onDragLeave={() => {
                          if (dragOverFeaturedReleaseId === release.id) setDragOverFeaturedReleaseId(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const fromId = e.dataTransfer.getData("text/plain") || draggingFeaturedReleaseId;
                          if (!fromId) return;
                          if (fromId === release.id) return;
                          reorderFeaturedReleaseIds(fromId, release.id);
                          setDraggingFeaturedReleaseId(null);
                          setDragOverFeaturedReleaseId(null);
                          const next = (() => {
                            const ids = [...featuredReleaseIds];
                            const fromIndex = ids.indexOf(fromId);
                            const toIndex = ids.indexOf(release.id);
                            if (fromIndex === -1 || toIndex === -1) return ids;
                            const [moved] = ids.splice(fromIndex, 1);
                            if (!moved) return ids;
                            ids.splice(toIndex, 0, moved);
                            return ids;
                          })();
                          saveFeaturedOrderMutation.mutate(next);
                        }}
                      >
                        <TableCell>
                          <div
                            className="inline-flex items-center gap-2 text-xs text-muted-foreground select-none"
                            draggable
                            onDragStart={(e) => {
                              setDraggingFeaturedReleaseId(release.id);
                              e.dataTransfer.setData("text/plain", release.id);
                              e.dataTransfer.effectAllowed = "move";
                            }}
                            onDragEnd={() => {
                              setDraggingFeaturedReleaseId(null);
                              setDragOverFeaturedReleaseId(null);
                            }}
                          >
                            <GripVertical className="h-4 w-4" />
                            Drag
                          </div>
                        </TableCell>
                        <TableCell className="text-xs tabular-nums text-muted-foreground">{index + 1}</TableCell>
                        <TableCell>
                          <div className="w-10 h-10 rounded overflow-hidden bg-muted">
                            {release.coverUrl ? (
                              <img
                                src={resolveMediaUrl(release.coverUrl, "thumb")}
                                alt={release.title}
                                className="w-full h-full object-cover"
                              />
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{release.title}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{release.artistName}</TableCell>
                        <TableCell>
                          <Badge variant={release.published ? "default" : "secondary"}>
                            {release.published ? "Published" : "Draft"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search releases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-admin-search-releases"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-[140px]" data-testid="select-filter-type">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="album">Album</SelectItem>
                  <SelectItem value="ep">EP</SelectItem>
                  <SelectItem value="single">Single</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[140px]" data-testid="select-filter-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[44px] text-xs text-muted-foreground">#</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden md:table-cell">Artist</TableHead>
                    <TableHead className="hidden lg:table-cell">Type</TableHead>
                    <TableHead className="hidden sm:table-cell">Release Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedReleases.map((release, index) => (
                    <TableRow 
                      key={release.id} 
                      data-testid={`row-release-${release.id}`}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigatePreserveScroll(`/admin/releases/${release.id}`)}
                    >
                      <TableCell className="text-xs tabular-nums text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="w-10 h-10 rounded overflow-hidden bg-muted">
                          {release.coverUrl ? (
                            <img
                              src={resolveMediaUrl(release.coverUrl, "thumb")}
                              alt={release.title}
                              className="w-full h-full object-cover"
                            />
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{release.title}</div>
                        {release.featured && (
                          <Badge variant="default" className="text-xs mt-1">
                            Featured
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{release.artistName}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline" className="capitalize">
                          {release.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{formatDate(release.releaseDate)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={release.published ? "default" : "secondary"}
                        >
                          {release.published ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-release-actions-${release.id}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigatePreserveScroll(`/admin/releases/${release.id}`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                togglePublishMutation.mutate({
                                  id: release.id!,
                                  published: !release.published,
                                })
                              }
                            >
                              {release.published ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Publish
                                </>
                              )}
                            </DropdownMenuItem>
                            {release.spotifyUrl && (
                              <DropdownMenuItem asChild>
                                <a
                                  href={release.spotifyUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View on Spotify
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteId(release.id!)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredReleases.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No releases found
              </div>
            )}

            {filteredReleases.length > 0 && (
              <div className="px-4 py-6">
                <div ref={sentinelRef} className="h-10 w-full" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent
          className="sm:max-w-md overflow-x-hidden"
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Delete Release</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this release? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleDialogClose()}>
        <DialogContent
          className="sm:max-w-xl sm:max-h-[90vh] overflow-y-auto overflow-x-hidden"
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{editingRelease ? "Edit Release" : "Create Release"}</DialogTitle>
            <DialogDescription>
              {editingRelease ? "Update the release details below." : "Fill in the details to create a new release."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {!editingRelease && (
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

            <div className="grid gap-2">
              <Label htmlFor="title">
                Title {!quickAddLink && '*'}
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Release title"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="artistName">
                Artist Name {!quickAddLink && '*'}
              </Label>
              <Input
                id="artistName"
                value={formData.artistName}
                onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                placeholder="Artist name"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="ep">EP</SelectItem>
                    <SelectItem value="album">Album</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="releaseDate">Release Date</Label>
                <Input
                  id="releaseDate"
                  type="date"
                  value={formData.releaseDate}
                  onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Cover Art {metadataFetched && formData.coverUrl && "(fetched from link)"}</Label>
              {metadataFetched && formData.coverUrl ? (
                <div className="relative w-full aspect-square max-w-[200px] rounded-lg overflow-hidden border bg-muted">
                  <img 
                    src={formData.coverUrl} 
                    alt="Cover art" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <ImageUpload
                  currentImage={formData.coverUrl}
                  onUploadComplete={(url: string) => setFormData({ ...formData, coverUrl: url })}
                />
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="spotifyUrl">Spotify URL</Label>
              <Input
                id="spotifyUrl"
                type="url"
                value={formData.spotifyUrl}
                onChange={(e) => setFormData({ ...formData, spotifyUrl: e.target.value })}
                placeholder="https://open.spotify.com/..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="appleMusicUrl">Apple Music URL</Label>
              <Input
                id="appleMusicUrl"
                type="url"
                value={formData.appleMusicUrl}
                onChange={(e) => setFormData({ ...formData, appleMusicUrl: e.target.value })}
                placeholder="https://music.apple.com/..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="soundcloudUrl">SoundCloud URL</Label>
              <Input
                id="soundcloudUrl"
                type="url"
                value={formData.soundcloudUrl}
                onChange={(e) => setFormData({ ...formData, soundcloudUrl: e.target.value })}
                placeholder="https://soundcloud.com/..."
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                />
                <Label htmlFor="featured">Featured release</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                />
                <Label htmlFor="published">Published</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleDialogClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : editingRelease ? "Update Release" : "Create Release"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
