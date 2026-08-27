import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Briefcase, Mail, MoreVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "./index";
import { queryClient, queryFunctions } from "@/lib/queryClient";
import { db, Career, CareerApplication } from "@/lib/database";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";

export default function AdminCareers() {
  const { toast } = useToast();
  const [tab, setTab] = useState("jobs");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCareer, setEditingCareer] = useState<Career | null>(null);
  const [applicationSearch, setApplicationSearch] = useState("");
  const [applicationStatus, setApplicationStatus] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState<CareerApplication | null>(null);
  const [deleteApplicationId, setDeleteApplicationId] = useState<string | null>(null);
  const [isSigningResume, setIsSigningResume] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    location: "",
    type: "full-time",
    description: "",
    requirements: "",
    benefits: "",
    salary: "",
    published: true,
  });

  const updateApplicationStatusMutation = useMutation({
    mutationFn: async (args: { id: string; status: string }) => {
      return db.careerApplications.update(args.id, { status: args.status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["careerApplications"] });
      toast({ title: "Status updated" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const deleteApplicationMutation = useMutation({
    mutationFn: async (id: string) => {
      return db.careerApplications.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["careerApplications"] });
      toast({ title: "Application deleted" });
      setDeleteApplicationId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete application",
        variant: "destructive",
      });
    },
  });

  const { data: careers = [] } = useQuery<Career[]>({
    queryKey: ["careers"],
    queryFn: queryFunctions.careers,
  });

  const { data: applications = [] } = useQuery<CareerApplication[]>({
    queryKey: ["careerApplications"],
    queryFn: queryFunctions.careerApplications,
  });

  const careerById = useMemo(() => {
    const m = new Map<string, Career>();
    careers.forEach((c) => m.set(c.id, c));
    return m;
  }, [careers]);

  const filteredApplications = useMemo(() => {
    const q = applicationSearch.trim().toLowerCase();
    return applications.filter((a) => {
      const matchesSearch =
        !q ||
        a.name?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        (careerById.get(a.careerId || "")?.title || "").toLowerCase().includes(q);
      const matchesStatus = applicationStatus === "all" || (a.status || "new") === applicationStatus;
      return matchesSearch && matchesStatus;
    });
  }, [applications, applicationSearch, applicationStatus, careerById]);

  const getApplicationStatusBadge = (status?: string) => {
    const s = (status || "new").toLowerCase();
    if (s === "new") return { label: "new", className: "bg-blue-500/15 text-blue-600 border-blue-500/30" };
    if (s === "reviewing") return { label: "reviewing", className: "bg-amber-500/15 text-amber-700 border-amber-500/30" };
    if (s === "shortlisted") return { label: "shortlisted", className: "bg-purple-500/15 text-purple-700 border-purple-500/30" };
    if (s === "hired") return { label: "hired", className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" };
    if (s === "rejected") return { label: "rejected", className: "bg-red-500/15 text-red-700 border-red-500/30" };
    return { label: s, className: "bg-muted text-muted-foreground border-border" };
  };

  const handleDownloadResume = async (resumeUrl: string, filename?: string) => {
    try {
      if (!resumeUrl) return;

      const isCloudinary = /\/\/res\.cloudinary\.com\//i.test(resumeUrl);

      const isProtected = /\/authenticated\//i.test(resumeUrl) || /\/private\//i.test(resumeUrl);

      const safeFilename = (filename || "resume")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9._-]/g, "");

      // Prefer Cloudinary's real /download API when the URL is hosted on Cloudinary.
      if (isCloudinary) {
        if (!supabase) {
          throw new Error("Supabase is not configured");
        }

        setIsSigningResume(true);
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) {
          throw new Error("You must be logged in to download resumes");
        }

        const params = new URLSearchParams();
        params.set("url", resumeUrl);
        params.set("download_api", "1");
        params.set("filename", safeFilename || "resume");
        const resp = await fetch(`/api/cloudinary-signed-url?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await resp.json().catch(() => null);
        if (!resp.ok || !json?.success || !json?.signedUrl) {
          const msg = json?.error || `Failed to generate download URL (HTTP ${resp.status})`;
          throw new Error(msg);
        }

        window.open(String(json.signedUrl), "_blank", "noopener,noreferrer");
        return;
      }

      // Non-cloudinary: try to download directly.
      if (!isProtected) {
        const a = document.createElement("a");
        a.href = resumeUrl;
        a.download = safeFilename || "resume";
        a.rel = "noreferrer";
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }

      if (!supabase) {
        throw new Error("Supabase is not configured");
      }

      setIsSigningResume(true);
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        throw new Error("You must be logged in to download resumes");
      }

      const params = new URLSearchParams();
      params.set("url", resumeUrl);
      params.set("download", "1");
      const resp = await fetch(`/api/cloudinary-signed-url?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await resp.json().catch(() => null);
      if (!resp.ok || !json?.success || !json?.signedUrl) {
        const msg = json?.error || `Failed to generate signed URL (HTTP ${resp.status})`;
        throw new Error(msg);
      }

      const a = document.createElement("a");
      a.href = String(json.signedUrl);
      a.download = safeFilename || "resume";
      a.rel = "noreferrer";
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      toast({
        title: "Resume download failed",
        description: e instanceof Error ? e.message : "Failed to download resume",
        variant: "destructive",
      });
    } finally {
      setIsSigningResume(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return db.careers.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["careers"] });
      toast({
        title: "Job deleted",
        description: "The job posting has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete job",
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { isEdit: boolean; id?: string; career: Partial<Career> }) => {
      if (data.isEdit && data.id) {
        return db.careers.update(data.id, data.career);
      } else {
        return db.careers.create(data.career);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["careers"] });
      toast({
        title: variables.isEdit ? "Job updated" : "Job created",
        description: variables.isEdit ? "The job posting has been updated." : "The job posting has been created.",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save job",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (career: Career) => {
    setEditingCareer(career);
    setFormData({
      title: career.title || "",
      department: career.department || "",
      location: career.location || "",
      type: career.type || "full-time",
      description: career.description || "",
      requirements: career.requirements || "",
      benefits: career.benefits || "",
      salary: career.salary || "",
      published: career.published ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this job posting?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSave = () => {
    const slug = formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const careerData: Partial<Career> = {
      title: formData.title,
      slug,
      department: formData.department,
      location: formData.location,
      type: formData.type,
      description: formData.description,
      requirements: formData.requirements,
      benefits: formData.benefits,
      salary: formData.salary,
      published: formData.published,
    };
    
    saveMutation.mutate({
      isEdit: !!editingCareer,
      id: editingCareer?.id,
      career: careerData,
    });
  };

  const resetForm = () => {
    setEditingCareer(null);
    setFormData({
      title: "",
      department: "",
      location: "",
      type: "full-time",
      description: "",
      requirements: "",
      benefits: "",
      salary: "",
      published: true,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Careers</h1>
            <p className="text-muted-foreground">Manage job postings and applications</p>
          </div>
          {tab === "jobs" && (
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Job
            </Button>
          )}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="mt-4">
            <div className="grid gap-4">
              {careers.map((career) => (
                <Card key={career.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Briefcase className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{career.title}</h3>
                          {!career.published && <Badge variant="secondary">Draft</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{career.department} · {career.location}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{career.type}</Badge>
                          {career.salary && <Badge variant="outline">{career.salary}</Badge>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(career)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(career.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {careers.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No job postings yet. Add your first job to get started.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="applications" className="mt-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Input
                    placeholder="Search applications (name, email, job title)..."
                    value={applicationSearch}
                    onChange={(e) => setApplicationSearch(e.target.value)}
                  />
                  <Select value={applicationStatus} onValueChange={setApplicationStatus}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="reviewing">Reviewing</SelectItem>
                      <SelectItem value="shortlisted">Shortlisted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="hired">Hired</SelectItem>
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
                      <TableHead>Applicant</TableHead>
                      <TableHead>Job</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((app) => {
                      const job = app.careerId ? careerById.get(app.careerId) : undefined;
                      const statusBadge = getApplicationStatusBadge(app.status);
                      return (
                        <TableRow
                          key={app.id}
                          className="cursor-pointer"
                          onClick={() => setSelectedApplication(app)}
                        >
                          <TableCell>
                            <div className="font-medium">{app.name}</div>
                            <div className="text-sm text-muted-foreground">{app.email}</div>
                          </TableCell>
                          <TableCell>{job?.title || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`capitalize ${statusBadge.className}`}>
                              {statusBadge.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "-"}
                          </TableCell>
                          <TableCell>
                            <div onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedApplication(app)}>
                                  <Briefcase className="h-4 w-4 mr-2" />
                                  View Application
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <a href={`mailto:${app.email}`}>
                                    <Mail className="h-4 w-4 mr-2" />
                                    Reply
                                  </a>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => updateApplicationStatusMutation.mutate({ id: app.id, status: "reviewing" })}>
                                  Mark Reviewing
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateApplicationStatusMutation.mutate({ id: app.id, status: "shortlisted" })}>
                                  Mark Shortlisted
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateApplicationStatusMutation.mutate({ id: app.id, status: "rejected" })}>
                                  Mark Rejected
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateApplicationStatusMutation.mutate({ id: app.id, status: "hired" })}>
                                  Mark Hired
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteApplicationId(app.id)}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {filteredApplications.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No applications found.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-2xl sm:max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <DialogHeader>
              <DialogTitle>{editingCareer ? "Edit Job" : "Add New Job"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Senior A&R Manager"
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g., A&R, Marketing"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., London, UK / Remote"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Employment Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="salary">Salary Range (Optional)</Label>
                <Input
                  id="salary"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="e.g., $60,000 - $80,000"
                />
              </div>
              <div>
                <Label htmlFor="description">Job Description</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the role and responsibilities..."
                />
              </div>
              <div>
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  rows={4}
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="List the required skills and qualifications..."
                />
              </div>
              <div>
                <Label htmlFor="benefits">Benefits (Optional)</Label>
                <Textarea
                  id="benefits"
                  rows={3}
                  value={formData.benefits}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  placeholder="List any benefits and perks..."
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

        <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
          <DialogContent className="sm:max-w-2xl sm:max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <DialogHeader>
              <DialogTitle>Application</DialogTitle>
              <DialogDescription>
                {selectedApplication?.name} ({selectedApplication?.email})
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {(() => {
                  const b = getApplicationStatusBadge(selectedApplication?.status);
                  return (
                    <Badge variant="outline" className={`capitalize ${b.className}`}>{b.label}</Badge>
                  );
                })()}
                <span>
                  {selectedApplication?.createdAt ? new Date(selectedApplication.createdAt).toLocaleString() : "-"}
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Job</p>
                  <p className="text-sm break-words">
                    {selectedApplication?.careerId ? (careerById.get(selectedApplication.careerId)?.title || "-") : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm break-words">{selectedApplication?.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">LinkedIn</p>
                  {selectedApplication?.linkedinUrl ? (
                    <a className="text-sm break-words underline" href={selectedApplication.linkedinUrl} target="_blank" rel="noreferrer">
                      {selectedApplication.linkedinUrl}
                    </a>
                  ) : (
                    <p className="text-sm break-words">-</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Portfolio</p>
                  {selectedApplication?.portfolioUrl ? (
                    <a className="text-sm break-words underline" href={selectedApplication.portfolioUrl} target="_blank" rel="noreferrer">
                      {selectedApplication.portfolioUrl}
                    </a>
                  ) : (
                    <p className="text-sm break-words">-</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cover letter</p>
                <div className="p-4 bg-muted rounded-md">
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {selectedApplication?.coverLetter?.trim() ? selectedApplication.coverLetter : "-"}
                  </p>
                </div>
              </div>
              {selectedApplication?.resumeUrl && (
                <div>
                  <p className="text-xs text-muted-foreground">Resume</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    disabled={isSigningResume}
                    onClick={() => handleDownloadResume(selectedApplication.resumeUrl!, selectedApplication.name)}
                  >
                    {isSigningResume ? "Downloading…" : "Download resume"}
                  </Button>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedApplication(null)}>Close</Button>
              <Button asChild>
                <a href={`mailto:${selectedApplication?.email}`}>
                  <Mail className="h-4 w-4 mr-2" />
                  Reply
                </a>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteApplicationId} onOpenChange={() => setDeleteApplicationId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Application</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this application? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteApplicationId(null)}>Cancel</Button>
              <Button
                variant="destructive"
                disabled={deleteApplicationMutation.isPending}
                onClick={() => {
                  if (!deleteApplicationId) return;
                  deleteApplicationMutation.mutate(deleteApplicationId);
                }}
              >
                {deleteApplicationMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
