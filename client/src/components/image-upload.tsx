
import { useState, useRef, useEffect } from "react";
import { X, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { uploadImage } from "@/lib/cloudinary";
import { resolveMediaUrl } from "@/lib/media";

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  bucket?: string;
  folder?: string;
  currentImage?: string;
  aspectRatio?: "square" | "video" | "banner";
  onUploadingChange?: (uploading: boolean) => void;
}

export function ImageUpload({
  onUploadComplete,
  bucket = "media",
  folder = "uploads",
  currentImage,
  aspectRatio = "square",
  onUploadingChange,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setPreview(currentImage || null);
  }, [currentImage]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    onUploadingChange?.(true);
    setUploadProgress(0);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    try {
      const url = await uploadImage(file, folder, (progress) => {
        setUploadProgress(progress);
      });
      
      onUploadComplete(url);
      toast({ title: "Image uploaded successfully" });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
      setPreview(null);
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    onUploadComplete("");
    onUploadingChange?.(false);
  };

  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    banner: "aspect-[21/9]"
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        data-testid="input-file-upload"
      />

      {preview ? (
        <Card className="relative overflow-hidden">
          <div className={cn("relative", aspectClasses[aspectRatio])}>
            <img
              src={preview.startsWith("data:") ? preview : resolveMediaUrl(preview, "card")}
              alt="Preview"
              className="w-full h-full object-cover"
            />
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
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleRemove}
              data-testid="button-remove-image"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </Card>
      ) : (
        <Card
          className={cn(
            "border-2 border-dashed hover:border-primary/50 transition-colors cursor-pointer",
            aspectClasses[aspectRatio]
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageIcon className="h-12 w-12" />
            <div className="text-center">
              <p className="font-medium">Click to upload image</p>
              <p className="text-sm">PNG, JPG up to 5MB</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
