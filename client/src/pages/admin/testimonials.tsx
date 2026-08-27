import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Quote, Star, GripVertical, Eye, EyeOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/image-upload";
import { AdminLayout } from "./index";
import { queryClient, queryFunctions } from "@/lib/queryClient";
import { db, Testimonial } from "@/lib/database";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { resolveMediaUrl } from "@/lib/media";

export default function AdminTestimonials() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    content: "",
    avatarUrl: "",
    rating: 5,
    displayOrder: 0,
    published: true,
  });

  const { data: testimonials = [] } = useQuery<Testimonial[]>({
    queryKey: ["testimonials"],
    queryFn: queryFunctions.testimonials,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return db.testimonials.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["testimonialsPublished"] });
      toast({
        title: "Testimonial deleted",
        description: "The testimonial has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete testimonial",
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { isEdit: boolean; id?: string; testimonial: Partial<Testimonial> }) => {
      if (data.isEdit && data.id) {
        return db.testimonials.update(data.id, data.testimonial);
      } else {
        return db.testimonials.create(data.testimonial);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["testimonialsPublished"] });
      toast({
        title: variables.isEdit ? "Testimonial updated" : "Testimonial created",
        description: variables.isEdit ? "The testimonial has been updated." : "The testimonial has been created.",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save testimonial",
        variant: "destructive",
      });
    },
  });

  const togglePublishedMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      return db.testimonials.update(id, { published });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["testimonialsPublished"] });
      toast({
        title: "Status updated",
        description: "The testimonial visibility has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      name: testimonial.name || "",
      role: testimonial.role || "",
      content: testimonial.content || "",
      avatarUrl: testimonial.avatarUrl || "",
      rating: testimonial.rating || 5,
      displayOrder: testimonial.displayOrder || 0,
      published: testimonial.published,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this testimonial?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSave = () => {
    const testimonialData: Partial<Testimonial> = {
      name: formData.name,
      role: formData.role,
      content: formData.content,
      avatarUrl: formData.avatarUrl || undefined,
      rating: formData.rating,
      displayOrder: formData.displayOrder,
      published: formData.published,
    };
    
    saveMutation.mutate({
      isEdit: !!editingTestimonial,
      id: editingTestimonial?.id,
      testimonial: testimonialData,
    });
  };

  const resetForm = () => {
    setEditingTestimonial(null);
    setFormData({
      name: "",
      role: "",
      content: "",
      avatarUrl: "",
      rating: 5,
      displayOrder: 0,
      published: true,
    });
  };

  const openAddDialog = () => {
    resetForm();
    setFormData(prev => ({
      ...prev,
      displayOrder: testimonials.length,
    }));
    setIsDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Testimonials</h1>
            <p className="text-muted-foreground">Manage customer testimonials and reviews</p>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Testimonial
          </Button>
        </div>

        {testimonials.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Quote className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No testimonials yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first testimonial to showcase customer feedback on your website.
              </p>
              <Button onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Testimonial
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className={!testimonial.published ? "opacity-60" : ""}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GripVertical className="h-5 w-5 cursor-grab" />
                      <span className="text-sm font-mono w-6 text-center">{testimonial.displayOrder}</span>
                    </div>
                    
                    <Avatar className="h-14 w-14 flex-shrink-0">
                      <AvatarImage src={resolveMediaUrl(testimonial.avatarUrl, "thumb")} alt={testimonial.name} />
                      <AvatarFallback className="bg-primary/20 text-primary text-lg">
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{testimonial.name}</h3>
                        <Badge variant={testimonial.published ? "default" : "secondary"}>
                          {testimonial.published ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{testimonial.role}</p>
                      <p className="text-sm line-clamp-2 mb-2">"{testimonial.content}"</p>
                      <div className="flex items-center gap-0.5">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                        {[...Array(5 - testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-muted-foreground/30" />
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => togglePublishedMutation.mutate({ 
                          id: testimonial.id, 
                          published: !testimonial.published 
                        })}
                        title={testimonial.published ? "Unpublish" : "Publish"}
                      >
                        {testimonial.published ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleEdit(testimonial)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDelete(testimonial.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-2xl sm:max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <DialogHeader>
              <DialogTitle>{editingTestimonial ? "Edit Testimonial" : "Add New Testimonial"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role / Title</Label>
                  <Input
                    id="role"
                    placeholder="CEO, DJ, Music Producer, etc."
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="content">Testimonial Content</Label>
                <Textarea
                  id="content"
                  rows={4}
                  placeholder="What did they say about you?"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />
              </div>
              
              <div>
                <Label>Avatar Image</Label>
                <ImageUpload
                  onUploadComplete={(url) => setFormData({ ...formData, avatarUrl: url })}
                  bucket="media"
                  folder="testimonials"
                  aspectRatio="square"
                  currentImage={formData.avatarUrl}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rating">Rating (1-5)</Label>
                  <div className="flex items-center gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: star })}
                        className="focus:outline-none"
                      >
                        <Star 
                          className={`w-6 h-6 transition-colors ${
                            star <= formData.rating 
                              ? "fill-amber-400 text-amber-400" 
                              : "text-muted-foreground/30 hover:text-amber-400/50"
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="displayOrder">Display Order</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    min={0}
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Switch
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                />
                <Label htmlFor="published">Published (visible on website)</Label>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={!formData.name || !formData.role || !formData.content}>
                  {editingTestimonial ? "Update" : "Create"} Testimonial
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
