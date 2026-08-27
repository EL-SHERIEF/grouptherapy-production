import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, FileText, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/image-upload";
import { AdminLayout } from "./index";
import { queryClient, queryFunctions } from "@/lib/queryClient";
import { db, PressAsset } from "@/lib/database";
import { resolveMediaUrl } from "@/lib/media";

export default function AdminPressKit() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<PressAsset | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "logo",
    fileUrl: "",
    fileType: "",
    published: true,
  });

  const { data: pressAssets = [] } = useQuery<PressAsset[]>({
    queryKey: ["pressAssets"],
    queryFn: queryFunctions.pressAssets,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return db.pressAssets.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pressAssets"] });
      toast({
        title: "Asset deleted",
        description: "The press asset has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete asset",
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { isEdit: boolean; id?: string; asset: Partial<PressAsset> }) => {
      if (data.isEdit && data.id) {
        return db.pressAssets.update(data.id, data.asset);
      } else {
        return db.pressAssets.create(data.asset);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pressAssets"] });
      toast({
        title: variables.isEdit ? "Asset updated" : "Asset created",
        description: variables.isEdit ? "The press asset has been updated." : "The press asset has been created.",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save asset",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (asset: PressAsset) => {
    setEditingAsset(asset);
    setFormData({
      title: asset.title || "",
      description: asset.description || "",
      category: asset.category || "logo",
      fileUrl: asset.fileUrl || "",
      fileType: asset.fileType || "",
      published: asset.published ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this asset?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSave = () => {
    const assetData: Partial<PressAsset> = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      fileUrl: formData.fileUrl,
      fileType: formData.fileType,
      published: formData.published,
    };
    
    saveMutation.mutate({
      isEdit: !!editingAsset,
      id: editingAsset?.id,
      asset: assetData,
    });
  };

  const resetForm = () => {
    setEditingAsset(null);
    setFormData({
      title: "",
      description: "",
      category: "logo",
      fileUrl: "",
      fileType: "",
      published: true,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Press Kit</h1>
            <p className="text-muted-foreground">Manage press assets and media files</p>
          </div>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pressAssets.map((asset) => (
            <Card key={asset.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 bg-muted rounded flex items-center justify-center flex-shrink-0">
                    {asset.fileUrl && asset.category === "logo" ? (
                      <img src={resolveMediaUrl(asset.fileUrl, "thumb")} alt={asset.title} className="w-full h-full object-contain p-1" />
                    ) : (
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{asset.title}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{asset.category}</p>
                    {asset.fileUrl && (
                      <a href={asset.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                        <Download className="h-3 w-3" /> Download
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(asset)}>
                    <Pencil className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(asset.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {pressAssets.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No press assets yet. Add your first asset to get started.
            </div>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-lg sm:max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <DialogHeader>
              <DialogTitle>{editingAsset ? "Edit Asset" : "Add New Asset"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., GroupTherapy Logo (White)"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="logo">Logo</SelectItem>
                    <SelectItem value="photo">Photo</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>File</Label>
                <ImageUpload
                  onUploadComplete={(url) => setFormData({ ...formData, fileUrl: url })}
                  bucket="media"
                  folder="press"
                  currentImage={formData.fileUrl}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the asset..."
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                />
                <Label htmlFor="published">Published</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
