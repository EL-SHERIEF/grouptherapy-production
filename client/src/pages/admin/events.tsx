import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MapPin,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { useRoute, useLocation } from "wouter";
import { AdminLayout } from "./index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { isEventPast } from "@/lib/utils";
import { db, Event } from "@/lib/database";
import { useToast } from "@/hooks/use-toast";

// Helper function to get currency symbol
function getCurrencySymbol(currency?: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    CAD: "C$",
    AUD: "A$",
  };
  return symbols[currency || "USD"] || "$";
}

interface EventFormData {
  title: string;
  description: string;
  venue: string;
  address: string;
  city: string;
  country: string;
  date: string;
  endDate: string;
  ticketUrl: string;
  ticketPrice: string;
  currency: string;
  capacity: string;
  imageUrl: string;
  featured: boolean;
  published: boolean;
}

const defaultFormData: EventFormData = {
  title: "",
  description: "",
  venue: "",
  address: "",
  city: "",
  country: "",
  date: "",
  endDate: "",
  ticketUrl: "",
  ticketPrice: "",
  currency: "USD",
  capacity: "",
  imageUrl: "",
  featured: false,
  published: false,
};

export default function AdminEvents() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [matchNew] = useRoute("/admin/events/new");
  const [matchEdit, params] = useRoute("/admin/events/:id");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<EventFormData>(defaultFormData);

  const { data: events } = useQuery<Event[]>({
    queryKey: ["events"],
    queryFn: queryFunctions.events,
  });

  const displayEvents = events || [];

  useEffect(() => {
    if (matchNew) {
      setEditingEvent(null);
      setFormData(defaultFormData);
      setIsDialogOpen(true);
    } else if (matchEdit && params?.id && params.id !== "new") {
      const event = displayEvents.find(e => e.id === params.id);
      if (event) {
        handleEdit(event);
      } else if (displayEvents.length > 0) {
        db.events.getById(params.id).then(event => {
          if (event) {
            handleEdit(event);
          }
        });
      }
    }
  }, [matchNew, matchEdit, params?.id, displayEvents.length]);

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingEvent(null);
    setFormData(defaultFormData);
    setLocation("/admin/events");
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title || "",
      description: event.description || "",
      venue: event.venue || "",
      address: event.address || "",
      city: event.city || "",
      country: event.country || "",
      date: event.date ? new Date(event.date).toISOString().slice(0, 16) : "",
      endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : "",
      ticketUrl: event.ticketUrl || "",
      ticketPrice: event.ticketPrice || "",
      currency: event.currency || "USD",
      capacity: event.capacity?.toString() || "",
      imageUrl: event.imageUrl || "",
      featured: event.featured || false,
      published: event.published || false,
    });
    setIsDialogOpen(true);
  };

  const filteredEvents = displayEvents.filter((event) => {
    const matchesSearch =
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "published" && event.published) ||
      (filterStatus === "draft" && !event.published);
    return matchesSearch && matchesStatus;
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      return db.events.update(id, { published });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Event updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return db.events.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Event deleted" });
      setDeleteId(null);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { isEdit: boolean; id?: string; event: Partial<Event> }) => {
      if (data.isEdit && data.id) {
        return db.events.update(data.id, data.event);
      } else {
        return db.events.create(data.event);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: variables.isEdit ? "Event updated" : "Event created",
        description: variables.isEdit ? "The event has been updated." : "The event has been created.",
      });
      handleDialogClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save event",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!formData.title || !formData.venue || !formData.city || !formData.country) {
      toast({
        title: "Missing fields",
        description: "Please fill in required fields: title, venue, city, and country.",
        variant: "destructive",
      });
      return;
    }

    const slug = formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const eventData: Partial<Event> = {
      title: formData.title,
      slug,
      description: formData.description || undefined,
      venue: formData.venue,
      address: formData.address || undefined,
      city: formData.city,
      country: formData.country,
      date: formData.date ? new Date(formData.date).toISOString() : undefined,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      ticketUrl: formData.ticketUrl || undefined,
      ticketPrice: formData.ticketPrice || undefined,
      currency: formData.currency || undefined,
      capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
      imageUrl: formData.imageUrl || undefined,
      featured: formData.featured,
      published: formData.published,
    };
    
    saveMutation.mutate({
      isEdit: !!editingEvent,
      id: editingEvent?.id,
      event: eventData,
    });
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
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
            <h1 className="text-3xl font-bold" data-testid="text-admin-events-title">Events</h1>
            <p className="text-muted-foreground">
              Manage tours, shows, and festivals
            </p>
          </div>
          <Button 
            className="gap-2" 
            data-testid="button-new-event"
            onClick={() => setLocation("/admin/events/new")}
          >
            <Plus className="h-4 w-4" />
            Add Event
          </Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-admin-search-events"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[140px]" data-testid="select-events-status">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[180px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => {
                  const isPast = isEventPast(event);
                  return (
                    <TableRow 
                      key={event.id} 
                      data-testid={`row-event-${event.id}`}
                      className="cursor-pointer hover:bg-muted/50 transition-colors group"
                      onClick={() => setLocation(`/admin/events/${event.id}`)}
                    >
                      <TableCell>
                        <div className="font-medium">{event.title}</div>
                        {event.featured && (
                          <Badge variant="default" className="text-xs mt-1">
                            Featured
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {event.venue}, {event.city}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {formatDate(event.date)}
                        </div>
                        {isPast && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            Past
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {event.ticketPrice ? `${getCurrencySymbol(event.currency)}${event.ticketPrice}` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={event.published ? "default" : "secondary"}>
                          {event.published ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 px-2 opacity-70 group-hover:opacity-100 transition-opacity"
                            onClick={() => setLocation(`/admin/events/${event.id}`)}
                            data-testid={`button-edit-event-${event.id}`}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 opacity-70 group-hover:opacity-100 transition-opacity"
                            onClick={() =>
                              togglePublishMutation.mutate({
                                id: event.id!,
                                published: !event.published,
                              })
                            }
                            data-testid={`button-toggle-publish-${event.id}`}
                          >
                            {event.published ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-70 group-hover:opacity-100 transition-opacity"
                            onClick={() => setDeleteId(event.id!)}
                            data-testid={`button-delete-event-${event.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {filteredEvents.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No events found
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-md overflow-x-hidden">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <DialogTitle>Delete Event</DialogTitle>
                <DialogDescription className="mt-1">
                  This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to permanently delete this event? All associated data will be removed.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Yes, Delete Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleDialogClose()}>
        <DialogContent className="sm:max-w-2xl sm:max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Edit Event" : "Create Event"}</DialogTitle>
            <DialogDescription>
              {editingEvent ? "Update the event details below." : "Fill in the details to create a new event."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Event title"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Event description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="venue">Venue *</Label>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="Venue name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Country"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Start Date & Time</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date & Time</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ticketPrice">Ticket Price</Label>
                <Input
                  id="ticketPrice"
                  value={formData.ticketPrice}
                  onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value })}
                  placeholder="e.g., 25"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="e.g., 500"
                />
              </div>
              <div className="hidden sm:grid gap-2">
                {/* Empty cell for grid alignment */}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ticketUrl">Ticket URL</Label>
              <Input
                id="ticketUrl"
                type="url"
                value={formData.ticketUrl}
                onChange={(e) => setFormData({ ...formData, ticketUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="grid gap-2">
              <Label>Event Image</Label>
              <ImageUpload
                currentImage={formData.imageUrl}
                onUploadComplete={(url: string) => setFormData({ ...formData, imageUrl: url })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                />
                <Label htmlFor="featured">Featured event</Label>
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
              {saveMutation.isPending ? "Saving..." : editingEvent ? "Update Event" : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
