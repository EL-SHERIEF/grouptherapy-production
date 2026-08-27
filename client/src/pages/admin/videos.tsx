
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Video as VideoIcon, Loader2, Link } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/image-upload";
import { VideoUpload } from "@/components/video-upload";
import { AdminLayout } from "./index";
import { queryClient, queryFunctions } from "@/lib/queryClient";
import { db, Video } from "@/lib/database";
import { resolveMediaUrl } from "@/lib/media";

type VideoPlatform = "youtube" | "vimeo" | null;

function detectPlatform(url: string): VideoPlatform {
  if (!url) return null;
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
    return "youtube";
  }
  if (lowerUrl.includes("vimeo.com")) {
    return "vimeo";
  }
  return null;
}

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

export default function AdminVideos() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    artistName: "",
    youtubeId: "",
    videoUrl: "",
    thumbnailUrl: "",
    category: "music-video",
    description: "",
    featured: false,
  });

  const { data: videos = [] } = useQuery<Video[]>({
    queryKey: ["videos"],
    queryFn: queryFunctions.videos,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return db.videos.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      toast({
        title: "Video deleted",
        description: "The video has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete video",
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { isEdit: boolean; id?: string; video: Partial<Video> }) => {
      if (data.isEdit && data.id) {
        return db.videos.update(data.id, data.video);
      } else {
        return db.videos.create(data.video);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      toast({
        title: variables.isEdit ? "Video updated" : "Video created",
        description: variables.isEdit ? "The video has been updated." : "The video has been created.",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save video",
        variant: "destructive",
      });
    },
  });

  const fetchVideoMetadata = async () => {
    if (!videoUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a video URL",
        variant: "destructive",
      });
      return;
    }

    const platform = detectPlatform(videoUrl);
    if (!platform) {
      toast({
        title: "Error",
        description: "URL not recognized. Please enter a valid YouTube or Vimeo URL.",
        variant: "destructive",
      });
      return;
    }

    setIsFetching(true);

    try {
      let oEmbedUrl: string;
      if (platform === "youtube") {
        oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
      } else {
        oEmbedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(videoUrl)}`;
      }

      const response = await fetch(oEmbedUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch video metadata");
      }

      const data = await response.json();

      const youtubeId = platform === "youtube" ? extractYoutubeId(videoUrl) : "";
      const embedUrl = platform === "youtube"
        ? `https://www.youtube.com/embed/${youtubeId}`
        : data.html?.match(/src="([^"]+)"/)?.[1] || "";

      setFormData((prev) => ({
        ...prev,
        title: data.title || prev.title,
        thumbnailUrl: data.thumbnail_url || prev.thumbnailUrl,
        youtubeId: youtubeId || prev.youtubeId,
        videoUrl: embedUrl || prev.videoUrl,
        artistName: data.author_name || prev.artistName,
      }));

      setIsAutoFilled(true);

      toast({
        title: "Metadata fetched",
        description: `Successfully fetched details from ${platform === "youtube" ? "YouTube" : "Vimeo"}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch video metadata",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleEdit = (video: Video) => {
    setEditingVideo(video);
    setVideoUrl("");
    setIsAutoFilled(false);
    setFormData({
      title: video.title || "",
      artistName: video.artistName || "",
      youtubeId: video.youtubeId || "",
      videoUrl: video.videoUrl || "",
      thumbnailUrl: video.thumbnailUrl || "",
      category: video.category || "music-video",
      description: video.description || "",
      featured: video.featured || false,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this video?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSave = () => {
    const slug = formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const videoData: Partial<Video> = {
      title: formData.title,
      slug,
      artistName: formData.artistName,
      youtubeId: formData.youtubeId,
      videoUrl: formData.videoUrl,
      thumbnailUrl: formData.thumbnailUrl,
      category: formData.category,
      description: formData.description,
      featured: formData.featured,
      published: true,
    };
    
    saveMutation.mutate({
      isEdit: !!editingVideo,
      id: editingVideo?.id,
      video: videoData,
    });
  };

  const resetForm = () => {
    setEditingVideo(null);
    setVideoUrl("");
    setIsAutoFilled(false);
    setFormData({
      title: "",
      artistName: "",
      youtubeId: "",
      videoUrl: "",
      thumbnailUrl: "",
      category: "music-video",
      description: "",
      featured: false,
    });
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setIsDialogOpen(open);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Videos</h1>
            <p className="text-muted-foreground">Manage video content</p>
          </div>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Video
          </Button>
        </div>

        <div className="grid gap-4">
          {videos.map((video) => (
            <Card 
              key={video.id} 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleEdit(video)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-32 h-20 bg-muted rounded overflow-hidden flex-shrink-0">
                    {video.thumbnailUrl ? (
                      <img src={resolveMediaUrl(video.thumbnailUrl, "card")} alt={video.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <VideoIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{video.title}</h3>
                    <p className="text-sm text-muted-foreground">{video.artistName}</p>
                    <p className="text-xs text-muted-foreground mt-1">Category: {video.category}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => { e.stopPropagation(); handleEdit(video); }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => handleDelete(video.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent className="sm:max-w-2xl sm:max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <DialogHeader>
              <DialogTitle>{editingVideo ? "Edit Video" : "Add New Video"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {!editingVideo && (
                <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Link className="h-4 w-4" />
                    Quick Add from URL
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Paste YouTube or Vimeo URL..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={fetchVideoMetadata} 
                      disabled={isFetching || !videoUrl.trim()}
                      variant="secondary"
                    >
                      {isFetching ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Fetching...
                        </>
                      ) : (
                        "Fetch"
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supports YouTube (youtube.com, youtu.be) and Vimeo (vimeo.com)
                  </p>
                </div>
              )}
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  readOnly={isAutoFilled}
                  className={isAutoFilled ? "bg-muted" : ""}
                />
                {isAutoFilled && (
                  <p className="text-xs text-muted-foreground mt-1">Auto-filled from video metadata</p>
                )}
              </div>
              <div>
                <Label htmlFor="artistName">Artist Name</Label>
                <Input
                  id="artistName"
                  value={formData.artistName}
                  onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="youtubeId">YouTube ID (Optional)</Label>
                <Input
                  id="youtubeId"
                  value={formData.youtubeId}
                  onChange={(e) => setFormData({ ...formData, youtubeId: e.target.value })}
                  placeholder="dQw4w9WgXcQ"
                  readOnly={isAutoFilled && !!formData.youtubeId}
                  className={isAutoFilled && formData.youtubeId ? "bg-muted" : ""}
                />
                <p className="text-xs text-muted-foreground mt-1">Or upload a video file below</p>
              </div>
              <div>
                <Label htmlFor="embedUrl">Embed URL</Label>
                <Input
                  id="embedUrl"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/embed/..."
                  readOnly={isAutoFilled && !!formData.videoUrl}
                  className={isAutoFilled && formData.videoUrl ? "bg-muted" : ""}
                />
                {isAutoFilled && formData.videoUrl && (
                  <p className="text-xs text-muted-foreground mt-1">Auto-filled from video metadata</p>
                )}
              </div>
              <div>
                <Label>Video Upload</Label>
                <VideoUpload
                  onUploadComplete={(url) => setFormData({ ...formData, videoUrl: url })}
                  bucket="media"
                  folder="videos"
                />
              </div>
              <div>
                <Label>Thumbnail Image</Label>
                {isAutoFilled && formData.thumbnailUrl && (
                  <div className="mb-2">
                    <img 
                      src={resolveMediaUrl(formData.thumbnailUrl, "card")} 
                      alt="Video thumbnail" 
                      className="w-full max-w-xs rounded border"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Auto-filled from video metadata</p>
                  </div>
                )}
                {!isAutoFilled && (
                  <ImageUpload
                    onUploadComplete={(url) => setFormData({ ...formData, thumbnailUrl: url })}
                    bucket="media"
                    folder="thumbnails"
                    aspectRatio="video"
                  />
                )}
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="music-video">Music Video</SelectItem>
                    <SelectItem value="live">Live Performance</SelectItem>
                    <SelectItem value="behind-the-scenes">Behind the Scenes</SelectItem>
                    <SelectItem value="event">Event Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                />
                <Label htmlFor="featured">Featured</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => handleDialogClose(false)}>Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
