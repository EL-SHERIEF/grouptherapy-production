
import { useState, useRef } from "react";
import { Upload, X, Loader2, Video as VideoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { uploadVideo, isCloudinaryConfigured } from "@/lib/cloudinary";

interface VideoUploadProps {
  onUploadComplete: (url: string) => void;
  bucket?: string;
  folder?: string;
  currentVideo?: string;
  acceptedFormats?: string[];
}

export function VideoUpload({
  onUploadComplete,
  bucket = "media",
  folder = "videos",
  currentVideo,
  acceptedFormats = [".mp4", ".mov", ".avi", ".webm"]
}: VideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(currentVideo || null);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please select a video file",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Video must be less than 100MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setFileName(file.name);

    try {
      const url = await uploadVideo(file, folder, (progress) => {
        setUploadProgress(progress);
      });
      
      setVideoUrl(url);
      onUploadComplete(url);
      toast({ title: "Video uploaded successfully" });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
      setVideoUrl(null);
      setFileName("");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = () => {
    setVideoUrl(null);
    setFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(",")}
        onChange={handleFileSelect}
        className="hidden"
      />

      {videoUrl ? (
        <Card className="overflow-hidden">
          <div className="relative aspect-video">
            <video controls className="w-full h-full" src={videoUrl}>
              Your browser does not support the video element.
            </video>
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3 p-4">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <div className="w-full max-w-xs">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-white text-sm text-center mt-2">{uploadProgress}%</p>
                </div>
              </div>
            )}
          </div>
          {!uploading && (
            <div className="p-3 flex items-center justify-between bg-muted">
              <p className="text-sm truncate">{fileName}</p>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemove}
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          )}
        </Card>
      ) : uploading ? (
        <Card className="aspect-video">
          <div className="h-full flex flex-col items-center justify-center gap-4 text-muted-foreground p-4">
            <VideoIcon className="h-12 w-12" />
            <div className="w-full max-w-xs">
              <p className="text-center font-medium mb-2">Uploading {fileName}...</p>
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-sm text-center mt-2">{uploadProgress}%</p>
            </div>
          </div>
        </Card>
      ) : (
        <Card
          className="border-2 border-dashed hover:border-primary/50 transition-colors cursor-pointer aspect-video"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <VideoIcon className="h-12 w-12" />
            <div className="text-center">
              <p className="font-medium">Click to upload video</p>
              <p className="text-sm">MP4, MOV, AVI, WebM up to 100MB</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
