import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MoreVertical,
  FileText,
  Sparkles,
  Loader2,
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
import { MarkdownEditor } from "@/components/markdown-editor";
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
import { db, Post } from "@/lib/database";
import { useToast } from "@/hooks/use-toast";
import { generateContent, isGeminiConfigured } from "@/lib/gemini";
import { resolveMediaUrl } from "@/lib/media";

interface PostFormData {
  title: string;
  excerpt: string;
  content: string;
  coverUrl: string;
  category: string;
  authorName: string;
  tags: string;
  metaTitle: string;
  metaDescription: string;
  featured: boolean;
  published: boolean;
}

const defaultFormData: PostFormData = {
  title: "",
  excerpt: "",
  content: "",
  coverUrl: "",
  category: "news",
  authorName: "",
  tags: "",
  metaTitle: "",
  metaDescription: "",
  featured: false,
  published: false,
};

export default function AdminPosts() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [matchNew] = useRoute("/admin/posts/new");
  const [matchEdit, params] = useRoute("/admin/posts/:id");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [formData, setFormData] = useState<PostFormData>(defaultFormData);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: posts } = useQuery<Post[]>({
    queryKey: ["posts"],
    queryFn: queryFunctions.posts,
  });

  const displayPosts = posts || [];

  useEffect(() => {
    if (matchNew) {
      setEditingPost(null);
      setFormData(defaultFormData);
      setIsDialogOpen(true);
    } else if (matchEdit && params?.id && params.id !== "new") {
      const post = displayPosts.find(p => p.id === params.id);
      if (post) {
        handleEdit(post);
      } else if (displayPosts.length > 0) {
        db.posts.getById(params.id).then(post => {
          if (post) {
            handleEdit(post);
          }
        });
      }
    }
  }, [matchNew, matchEdit, params?.id, displayPosts.length]);

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingPost(null);
    setFormData(defaultFormData);
    setLocation("/admin/posts");
  };

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    setFormData({
      title: post.title || "",
      excerpt: post.excerpt || "",
      content: post.content || "",
      coverUrl: post.coverUrl || "",
      category: post.category || "news",
      authorName: post.authorName || "",
      tags: post.tags?.join(", ") || "",
      metaTitle: post.metaTitle || "",
      metaDescription: post.metaDescription || "",
      featured: post.featured || false,
      published: post.published || false,
    });
    setIsDialogOpen(true);
  };

  const filteredPosts = displayPosts.filter((post) => {
    const matchesSearch = post.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || post.category === filterCategory;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "published" && post.published) ||
      (filterStatus === "draft" && !post.published);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      return db.posts.update(id, { published, publishedAt: published ? new Date().toISOString() : undefined });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast({ title: "Post updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return db.posts.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast({ title: "Post deleted" });
      setDeleteId(null);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { isEdit: boolean; id?: string; post: Partial<Post> }) => {
      if (data.isEdit && data.id) {
        return db.posts.update(data.id, data.post);
      } else {
        return db.posts.create(data.post);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast({
        title: variables.isEdit ? "Post updated" : "Post created",
        description: variables.isEdit ? "The post has been updated." : "The post has been created.",
      });
      handleDialogClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save post",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!formData.title) {
      toast({
        title: "Missing fields",
        description: "Please provide a title for the post.",
        variant: "destructive",
      });
      return;
    }

    const slug = formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const postData: Partial<Post> = {
      title: formData.title,
      slug,
      excerpt: formData.excerpt || undefined,
      content: formData.content || undefined,
      coverUrl: formData.coverUrl || undefined,
      category: formData.category,
      authorName: formData.authorName || undefined,
      tags: formData.tags ? formData.tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
      metaTitle: formData.metaTitle || undefined,
      metaDescription: formData.metaDescription || undefined,
      featured: formData.featured,
      published: formData.published,
      publishedAt: formData.published ? new Date().toISOString() : undefined,
    };
    
    saveMutation.mutate({
      isEdit: !!editingPost,
      id: editingPost?.id,
      post: postData,
    });
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleGeneratePost = async () => {
    if (!formData.title) {
      toast({
        title: "Title required",
        description: "Please enter a title first to generate content.",
        variant: "destructive",
      });
      return;
    }

    if (!isGeminiConfigured()) {
      toast({
        title: "AI not configured",
        description: "Please add a Gemini API key to use AI generation.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
const prompt = `You are an expert SEO strategist and music industry blogger for GroupTherapy Records, a community based electronic music label.

Generate an SEO-optimized blog post about: "${formData.title}"

IMPORTANT SEO REQUIREMENTS:
1. Use proper heading structure with ## for H2 and ### for H3 headings only in the "content" field.
2. Include trending music industry Competitive keywords naturally, derived from the title context (e.g., electronic music, EDM, DJ, producer, remix, festival, streaming, vinyl, etc.).
3. Identify and incorporate primary and secondary keywords from the title topic for SEO optimization.
4. Add relevant internal links using markdown format to these pages where contextually appropriate:
   - [our latest releases](/releases)
   - [our latest videos](/videos)
   - [Promote your event](/promote-your-event)
   - [Promote your release](/promote-your-release)
   - [Vote now in grouptherapy awards](/awards)
   - [featured artists](/artists)
   - [contact us](/contact)
   - [our latest news](/news)
   - [upcoming events](/events)
   - [live radio](/radio)
   - [tour dates](/tours)
5. Determine the content format (news article, listicle, opinion piece, etc.) based on the title context and structure the post accordingly (e.g., use a numbered list for listicles).
6. Use casual, human-like language (to help pass Google AI detectors). Avoid extra words and long sentences. Use direct headings. no complex vocabulary. Maintain a conversational tone throughout the article, speak directly to readers and build a real connection.
7. Write engaging, shareable content that establishes thought leadership in the music industry.
8. Include a compelling call-to-action at the end.
9. do any kind of online search to get the latest news and updates about the music industry if needed.
Format your response as JSON with these fields:
{
  "excerpt": "A compelling 1-2 sentence summary with primary keyword for previews",
  "content": "The full blog post content in Markdown format with:\n- An engaging intro paragraph\n- ## H2 headings for main sections\n- ### H3 subheadings where appropriate\n- 3-5 paragraphs of valuable content (or list items for listicles)\n- Natural keyword placement\n- 2-3 internal links to /releases, /artists, /events, /radio, or /tours\n- A strong conclusion with call-to-action",
  "tags": "comma-separated trending relevant tags (5-8 tags, including primary keywords)",
  "metaTitle": "SEO-optimized title under 60 characters with primary keyword at the start",
  "metaDescription": "Compelling meta description under 155 characters with primary and secondary keywords, ending with a call-to-action"
}

Return only valid JSON, no markdown code blocks or additional text.`;


      const result = await generateContent(prompt);
      
      if (result.startsWith('Error:')) {
        toast({
          title: "Generation failed",
          description: result,
          variant: "destructive",
        });
        return;
      }

      try {
        const cleanResult = result.replace(/```json\n?|\n?```/g, '').trim();
        const generated = JSON.parse(cleanResult);
        
        setFormData(prev => ({
          ...prev,
          excerpt: generated.excerpt || prev.excerpt,
          content: generated.content || prev.content,
          tags: generated.tags || prev.tags,
          metaTitle: generated.metaTitle || prev.metaTitle,
          metaDescription: generated.metaDescription || prev.metaDescription,
        }));

        toast({
          title: "Content generated",
          description: "AI has generated content for your post. Review and edit as needed.",
        });
      } catch {
        toast({
          title: "Parse error",
          description: "Could not parse AI response. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-admin-posts-title">Blog / News</h1>
            <p className="text-muted-foreground">
              Manage articles and news posts
            </p>
          </div>
          <Button 
            className="gap-2" 
            data-testid="button-new-post"
            onClick={() => setLocation("/admin/posts/new")}
          >
            <Plus className="h-4 w-4" />
            New Post
          </Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-admin-search-posts"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="news">News</SelectItem>
                  <SelectItem value="releases">Releases</SelectItem>
                  <SelectItem value="events">Events</SelectItem>
                  <SelectItem value="interviews">Interviews</SelectItem>
                  <SelectItem value="features">Features</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[140px]">
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
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map((post) => (
                  <TableRow 
                    key={post.id} 
                    data-testid={`row-post-${post.id}`}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setLocation(`/admin/posts/${post.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                          {post.coverUrl ? (
                            <img src={resolveMediaUrl(post.coverUrl, "thumb")} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium line-clamp-1">{post.title}</div>
                          {post.featured && (
                            <Badge variant="default" className="text-xs mt-1">
                              Featured
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {post.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{post.authorName || "-"}</TableCell>
                    <TableCell>{formatDate(post.publishedAt)}</TableCell>
                    <TableCell>
                      <Badge variant={post.published ? "default" : "secondary"}>
                        {post.published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setLocation(`/admin/posts/${post.id}`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              togglePublishMutation.mutate({
                                id: post.id!,
                                published: !post.published,
                              })
                            }
                          >
                            {post.published ? (
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
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteId(post.id!)}
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

            {filteredPosts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No posts found
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-md overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
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
        <DialogContent className="sm:max-w-2xl sm:max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>{editingPost ? "Edit Post" : "Create Post"}</DialogTitle>
            <DialogDescription>
              {editingPost ? "Update the post details below." : "Fill in the details to create a new post."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="title">Title *</Label>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleGeneratePost}
                  disabled={isGenerating || !formData.title}
                  className="gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate with AI
                    </>
                  )}
                </Button>
              </div>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Post title"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Brief description of the post"
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <MarkdownEditor
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value })}
                placeholder="Full post content (supports Markdown)"
                minHeight="250px"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="news">News</SelectItem>
                    <SelectItem value="releases">Releases</SelectItem>
                    <SelectItem value="events">Events</SelectItem>
                    <SelectItem value="interviews">Interviews</SelectItem>
                    <SelectItem value="features">Features</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="authorName">Author Name</Label>
                <Input
                  id="authorName"
                  value={formData.authorName}
                  onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                  placeholder="Author name"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g., music, electronic, festival"
              />
            </div>

            <div className="grid gap-2">
              <Label>Cover Image</Label>
              <ImageUpload
                currentImage={formData.coverUrl}
                onUploadComplete={(url: string) => setFormData({ ...formData, coverUrl: url })}
                aspectRatio="video"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="metaTitle">Meta Title (SEO)</Label>
                <Input
                  id="metaTitle"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                  placeholder="SEO title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="metaDescription">Meta Description (SEO)</Label>
                <Input
                  id="metaDescription"
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  placeholder="SEO description"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                />
                <Label htmlFor="featured">Featured post</Label>
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
              {saveMutation.isPending ? "Saving..." : editingPost ? "Update Post" : "Create Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
