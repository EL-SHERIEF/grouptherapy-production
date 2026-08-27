import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, MapPin, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/image-upload";
import { AdminLayout } from "./index";
import { queryClient, queryFunctions } from "@/lib/queryClient";
import { db, Tour, TourDate } from "@/lib/database";
import { resolveMediaUrl } from "@/lib/media";

export default function AdminTours() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    artistName: "",
    description: "",
    imageUrl: "",
    startDate: "",
    endDate: "",
    published: true,
  });

  const { data: tours = [] } = useQuery<Tour[]>({
    queryKey: ["tours"],
    queryFn: queryFunctions.tours,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return db.tours.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
      toast({
        title: "Tour deleted",
        description: "The tour has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete tour",
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { isEdit: boolean; id?: string; tour: Partial<Tour> }) => {
      if (data.isEdit && data.id) {
        return db.tours.update(data.id, data.tour);
      } else {
        return db.tours.create(data.tour);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
      toast({
        title: variables.isEdit ? "Tour updated" : "Tour created",
        description: variables.isEdit ? "The tour has been updated." : "The tour has been created.",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save tour",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (tour: Tour) => {
    setEditingTour(tour);
    const startDateStr: string = tour.startDate ? String(tour.startDate).split('T')[0] ?? "" : "";
    const endDateStr: string = tour.endDate ? String(tour.endDate).split('T')[0] ?? "" : "";
    setFormData({
      title: tour.title || "",
      artistName: tour.artistName || "",
      description: tour.description || "",
      imageUrl: tour.imageUrl || "",
      startDate: startDateStr,
      endDate: endDateStr,
      published: tour.published ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this tour?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSave = () => {
    const slug = formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const tourData: Partial<Tour> = {
      title: formData.title,
      slug,
      artistName: formData.artistName,
      description: formData.description,
      imageUrl: formData.imageUrl,
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      published: formData.published,
    };
    
    saveMutation.mutate({
      isEdit: !!editingTour,
      id: editingTour?.id,
      tour: tourData,
    });
  };

  const resetForm = () => {
    setEditingTour(null);
    setFormData({
      title: "",
      artistName: "",
      description: "",
      imageUrl: "",
      startDate: "",
      endDate: "",
      published: true,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tours</h1>
            <p className="text-muted-foreground">Manage artist tours and dates</p>
          </div>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Tour
          </Button>
        </div>

        <div className="grid gap-4">
          {tours.map((tour) => (
            <Card 
              key={tour.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleEdit(tour)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    {tour.imageUrl ? (
                      <img src={resolveMediaUrl(tour.imageUrl, "thumb")} alt={tour.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MapPin className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{tour.title}</h3>
                      {!tour.published && <Badge variant="secondary">Draft</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{tour.artistName}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {tour.startDate && new Date(tour.startDate).toLocaleDateString()}
                      {tour.endDate && ` - ${new Date(tour.endDate).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(tour); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(tour.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {tours.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No tours yet. Add your first tour to get started.
            </div>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-2xl sm:max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <DialogHeader>
              <DialogTitle>{editingTour ? "Edit Tour" : "Add New Tour"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Tour Name</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., World Tour 2025"
                />
              </div>
              <div>
                <Label htmlFor="artistName">Artist Name</Label>
                <Input
                  id="artistName"
                  value={formData.artistName}
                  onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                  placeholder="e.g., Above & Beyond"
                />
              </div>
              <div>
                <Label>Tour Image</Label>
                <ImageUpload
                  onUploadComplete={(url) => setFormData({ ...formData, imageUrl: url })}
                  bucket="media"
                  folder="tours"
                  currentImage={formData.imageUrl}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the tour..."
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
