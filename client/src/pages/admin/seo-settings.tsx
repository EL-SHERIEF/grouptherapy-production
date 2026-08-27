import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "./index";
import { db, SeoSettings } from "@/lib/database";
import { Loader2, Save, Code, Image, FileText, Globe, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImageUpload } from "@/components/image-upload";

const defaultOrganizationSchema = {
  "@type": "Organization",
  "name": "GroupTherapy Records",
  "url": "https://www.grouptherapyeg.com",
  "logo": "https://www.grouptherapyeg.com/logo.png",
  "sameAs": []
};

const defaultWebsiteSchema = {
  "@type": "WebSite",
  "name": "GroupTherapy Records",
  "url": "https://www.grouptherapyeg.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://www.grouptherapyeg.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

const defaultMusicGroupSchema = {
  "@type": "MusicGroup",
  "name": "GroupTherapy",
  "genre": ["Electronic", "House", "Techno"],
  "url": "https://www.grouptherapyeg.com"
};

export default function AdminSeoSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isOgUploading, setIsOgUploading] = useState(false);
  const [isTwitterUploading, setIsTwitterUploading] = useState(false);

  const [formData, setFormData] = useState({
    defaultTitle: "",
    defaultDescription: "",
    defaultKeywords: "",
    ogImage: "",
    twitterImage: "",
    twitterHandle: "",
    organizationSchema: JSON.stringify(defaultOrganizationSchema, null, 2),
    websiteSchema: JSON.stringify(defaultWebsiteSchema, null, 2),
    musicGroupSchema: JSON.stringify(defaultMusicGroupSchema, null, 2),
    headScripts: "",
    bodyScripts: "",
  });

  const [jsonErrors, setJsonErrors] = useState({
    organizationSchema: "",
    websiteSchema: "",
    musicGroupSchema: "",
  });

  const { data: seoSettings, isLoading } = useQuery({
    queryKey: ["seoSettings"],
    queryFn: () => db.seoSettings.get(),
  });

  useEffect(() => {
    if (seoSettings) {
      setFormData({
        defaultTitle: seoSettings.defaultTitle || "",
        defaultDescription: seoSettings.defaultDescription || "",
        defaultKeywords: Array.isArray(seoSettings.defaultKeywords) 
          ? seoSettings.defaultKeywords.join(", ") 
          : "",
        ogImage: seoSettings.ogImage || "",
        twitterImage: seoSettings.twitterImage || "",
        twitterHandle: seoSettings.twitterHandle || "",
        organizationSchema: seoSettings.organizationSchema 
          ? JSON.stringify(seoSettings.organizationSchema, null, 2) 
          : JSON.stringify(defaultOrganizationSchema, null, 2),
        websiteSchema: seoSettings.websiteSchema 
          ? JSON.stringify(seoSettings.websiteSchema, null, 2) 
          : JSON.stringify(defaultWebsiteSchema, null, 2),
        musicGroupSchema: seoSettings.musicGroupSchema 
          ? JSON.stringify(seoSettings.musicGroupSchema, null, 2) 
          : JSON.stringify(defaultMusicGroupSchema, null, 2),
        headScripts: seoSettings.headScripts || "",
        bodyScripts: seoSettings.bodyScripts || "",
      });
    }
  }, [seoSettings]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<SeoSettings>) => db.seoSettings.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seoSettings"] });
      toast({
        title: "Settings saved",
        description: "Your SEO settings have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const validateJson = (value: string, field: string): boolean => {
    try {
      JSON.parse(value);
      setJsonErrors(prev => ({ ...prev, [field]: "" }));
      return true;
    } catch (e) {
      setJsonErrors(prev => ({ ...prev, [field]: "Invalid JSON format" }));
      return false;
    }
  };

  const handleJsonChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateJson(value, field);
  };

  const combinedJsonLd = useMemo(() => {
    try {
      const schemas = [];
      
      if (formData.organizationSchema) {
        const org = JSON.parse(formData.organizationSchema);
        schemas.push(org);
      }
      
      if (formData.websiteSchema) {
        const website = JSON.parse(formData.websiteSchema);
        schemas.push(website);
      }
      
      if (formData.musicGroupSchema) {
        const musicGroup = JSON.parse(formData.musicGroupSchema);
        schemas.push(musicGroup);
      }

      return {
        "@context": "https://schema.org",
        "@graph": schemas
      };
    } catch {
      return null;
    }
  }, [formData.organizationSchema, formData.websiteSchema, formData.musicGroupSchema]);

  const handleSave = () => {
    if (isOgUploading || isTwitterUploading) {
      toast({
        title: "Upload in progress",
        description: "Please wait for the image upload(s) to finish before saving.",
        variant: "destructive",
      });
      return;
    }

    const hasJsonErrors = Object.values(jsonErrors).some(error => error !== "");
    if (hasJsonErrors) {
      toast({
        title: "Validation error",
        description: "Please fix the JSON errors before saving.",
        variant: "destructive",
      });
      return;
    }

    let orgSchema, webSchema, musicSchema;
    try {
      orgSchema = JSON.parse(formData.organizationSchema);
      webSchema = JSON.parse(formData.websiteSchema);
      musicSchema = JSON.parse(formData.musicGroupSchema);
    } catch {
      toast({
        title: "Validation error",
        description: "One or more schema fields contain invalid JSON.",
        variant: "destructive",
      });
      return;
    }

    const keywords = formData.defaultKeywords
      .split(",")
      .map(k => k.trim())
      .filter(k => k.length > 0);

    updateMutation.mutate({
      defaultTitle: formData.defaultTitle,
      defaultDescription: formData.defaultDescription,
      defaultKeywords: keywords,
      ogImage: formData.ogImage || undefined,
      twitterImage: formData.twitterImage || undefined,
      twitterHandle: formData.twitterHandle,
      organizationSchema: orgSchema,
      websiteSchema: webSchema,
      musicGroupSchema: musicSchema,
      headScripts: formData.headScripts || undefined,
      bodyScripts: formData.bodyScripts || undefined,
    });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">SEO Settings</h1>
            <p className="text-muted-foreground">Manage search engine optimization and structured data</p>
          </div>
          <Button onClick={handleSave} disabled={updateMutation.isPending || isOgUploading || isTwitterUploading}>
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Settings
          </Button>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle>Default Meta Tags</CardTitle>
              </div>
              <CardDescription>Default SEO metadata for pages without custom settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="defaultTitle">Default Title</Label>
                <Input
                  id="defaultTitle"
                  placeholder="GroupTherapy Records | Electronic Music Label"
                  value={formData.defaultTitle}
                  onChange={(e) => setFormData({ ...formData, defaultTitle: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended: 50-60 characters
                </p>
              </div>
              <div>
                <Label htmlFor="defaultDescription">Default Description</Label>
                <Textarea
                  id="defaultDescription"
                  rows={3}
                  placeholder="GroupTherapy is a cutting-edge electronic music label featuring the best in house, techno, and dance music."
                  value={formData.defaultDescription}
                  onChange={(e) => setFormData({ ...formData, defaultDescription: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended: 150-160 characters. Current: {formData.defaultDescription.length}
                </p>
              </div>
              <div>
                <Label htmlFor="defaultKeywords">Default Keywords</Label>
                <Input
                  id="defaultKeywords"
                  placeholder="electronic music, house, techno, record label, dance music"
                  value={formData.defaultKeywords}
                  onChange={(e) => setFormData({ ...formData, defaultKeywords: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Comma-separated list of keywords
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Image className="h-5 w-5 text-primary" />
                <CardTitle>Social Preview</CardTitle>
              </div>
              <CardDescription>Images and settings for social media sharing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Open Graph Image</Label>
                  <ImageUpload
                    currentImage={formData.ogImage}
                    onUploadComplete={(url) => setFormData({ ...formData, ogImage: url })}
                    onUploadingChange={setIsOgUploading}
                    bucket="media"
                    folder="seo"
                    aspectRatio="video"
                  />
                  <Input
                    id="ogImage"
                    placeholder="Or paste an image URL (https://...)"
                    value={formData.ogImage}
                    onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended: 1200×630 pixels
                  </p>
                </div>
                <div className="space-y-3">
                  <Label>Twitter Image</Label>
                  <ImageUpload
                    currentImage={formData.twitterImage}
                    onUploadComplete={(url) => setFormData({ ...formData, twitterImage: url })}
                    onUploadingChange={setIsTwitterUploading}
                    bucket="media"
                    folder="seo"
                    aspectRatio="video"
                  />
                  <Input
                    id="twitterImage"
                    placeholder="Or paste an image URL (https://...)"
                    value={formData.twitterImage}
                    onChange={(e) => setFormData({ ...formData, twitterImage: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended: 1200×600 pixels
                  </p>
                </div>
              </div>
              <div>
                <Label htmlFor="twitterHandle">Twitter Handle</Label>
                <Input
                  id="twitterHandle"
                  placeholder="@grouptherapy"
                  value={formData.twitterHandle}
                  onChange={(e) => setFormData({ ...formData, twitterHandle: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Include the @ symbol
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <CardTitle>JSON-LD Schema Generator</CardTitle>
              </div>
              <CardDescription>Structured data for rich search results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="organizationSchema">Organization Schema</Label>
                    <Textarea
                      id="organizationSchema"
                      rows={8}
                      className="font-mono text-sm"
                      value={formData.organizationSchema}
                      onChange={(e) => handleJsonChange("organizationSchema", e.target.value)}
                    />
                    {jsonErrors.organizationSchema && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{jsonErrors.organizationSchema}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="websiteSchema">Website Schema</Label>
                    <Textarea
                      id="websiteSchema"
                      rows={8}
                      className="font-mono text-sm"
                      value={formData.websiteSchema}
                      onChange={(e) => handleJsonChange("websiteSchema", e.target.value)}
                    />
                    {jsonErrors.websiteSchema && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{jsonErrors.websiteSchema}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="musicGroupSchema">Music Group Schema</Label>
                    <Textarea
                      id="musicGroupSchema"
                      rows={8}
                      className="font-mono text-sm"
                      value={formData.musicGroupSchema}
                      onChange={(e) => handleJsonChange("musicGroupSchema", e.target.value)}
                    />
                    {jsonErrors.musicGroupSchema && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{jsonErrors.musicGroupSchema}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Combined JSON-LD Preview</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    This is what will be inserted into the page &lt;head&gt;
                  </p>
                  <div className="bg-muted rounded-lg p-4 overflow-auto max-h-[600px]">
                    {combinedJsonLd ? (
                      <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                        <code>
                          {`<script type="application/ld+json">\n${JSON.stringify(combinedJsonLd, null, 2)}\n</script>`}
                        </code>
                      </pre>
                    ) : (
                      <p className="text-sm text-destructive">Invalid JSON in one or more schema fields</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                <CardTitle>Custom Scripts</CardTitle>
              </div>
              <CardDescription>Add analytics, tracking, or other custom scripts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="headScripts">Head Scripts</Label>
                <Textarea
                  id="headScripts"
                  rows={6}
                  className="font-mono text-sm"
                  placeholder="<!-- Google Analytics, Meta Pixel, etc. -->"
                  value={formData.headScripts}
                  onChange={(e) => setFormData({ ...formData, headScripts: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Scripts added to the &lt;head&gt; section. Include full &lt;script&gt; tags.
                </p>
              </div>
              <div>
                <Label htmlFor="bodyScripts">Body Scripts</Label>
                <Textarea
                  id="bodyScripts"
                  rows={6}
                  className="font-mono text-sm"
                  placeholder="<!-- Chat widgets, conversion tracking, etc. -->"
                  value={formData.bodyScripts}
                  onChange={(e) => setFormData({ ...formData, bodyScripts: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Scripts added before &lt;/body&gt;. Include full &lt;script&gt; tags.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending || isOgUploading || isTwitterUploading}
              size="lg"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save All Settings
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
