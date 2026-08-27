import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "./index";
import { db } from "@/lib/database";
import { Loader2 } from "lucide-react";

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState({
    email: "",
    emailSubtext: "",
    phone: "",
    phoneSubtext: "",
    address: "",
    addressSubtext: "",
    spotify: "",
    instagram: "",
    soundcloud: "",
    x: "",
    youtube: "",
    tiktok: "",
  });

  const { data: siteSettings } = useQuery({
    queryKey: ["siteSettings"],
    queryFn: () => db.siteSettings.get(),
  });

  useEffect(() => {
    if (!siteSettings) return;
    setSettings((prev) => ({
      ...prev,
      email: siteSettings.contactEmail || prev.email,
      emailSubtext: siteSettings.contactEmailSubtext || prev.emailSubtext,
      phone: siteSettings.contactPhone || prev.phone,
      phoneSubtext: siteSettings.contactPhoneSubtext || prev.phoneSubtext,
      address: siteSettings.contactAddress || prev.address,
      addressSubtext: siteSettings.contactAddressSubtext || prev.addressSubtext,
      spotify: siteSettings.socialLinks?.spotify || prev.spotify,
      instagram: siteSettings.socialLinks?.instagram || prev.instagram,
      soundcloud: siteSettings.socialLinks?.soundcloud || prev.soundcloud,
      x: siteSettings.socialLinks?.x || prev.x,
      youtube: siteSettings.socialLinks?.youtube || prev.youtube,
      tiktok: siteSettings.socialLinks?.tiktok || prev.tiktok,
    }));
  }, [siteSettings]);

  const updateSiteSettingsMutation = useMutation({
    mutationFn: async (data: {
      email: string;
      emailSubtext: string;
      phone: string;
      phoneSubtext: string;
      address: string;
      addressSubtext: string;
      spotify: string;
      instagram: string;
      soundcloud: string;
      x: string;
      youtube: string;
      tiktok: string;
    }) => {
      return db.siteSettings.update({
        contactEmail: data.email,
        contactEmailSubtext: data.emailSubtext,
        contactPhone: data.phone,
        contactPhoneSubtext: data.phoneSubtext,
        contactAddress: data.address,
        contactAddressSubtext: data.addressSubtext,
        socialLinks: {
          spotify: data.spotify || undefined,
          instagram: data.instagram || undefined,
          soundcloud: data.soundcloud || undefined,
          x: data.x || undefined,
          youtube: data.youtube || undefined,
          tiktok: data.tiktok || undefined,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateSiteSettingsMutation.mutate({
      email: settings.email,
      emailSubtext: settings.emailSubtext,
      phone: settings.phone,
      phoneSubtext: settings.phoneSubtext,
      address: settings.address,
      addressSubtext: settings.addressSubtext,
      spotify: settings.spotify,
      instagram: settings.instagram,
      soundcloud: settings.soundcloud,
      x: settings.x,
      youtube: settings.youtube,
      tiktok: settings.tiktok,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your site settings and configuration</p>
        </div>

        <div className="grid gap-6">
          {/* contact Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>How people can reach you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">Small text shown under the email on the Contact page</p>
                <Input
                  id="emailSubtext"
                  value={settings.emailSubtext}
                  onChange={(e) => setSettings({ ...settings, emailSubtext: e.target.value })}
                  placeholder="e.g. We'll respond within 24 hours"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">Small text shown under the phone on the Contact page</p>
                <Input
                  id="phoneSubtext"
                  value={settings.phoneSubtext}
                  onChange={(e) => setSettings({ ...settings, phoneSubtext: e.target.value })}
                  placeholder="e.g. Mon-Fri, 9am-6pm"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  rows={3}
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">Small text shown under the address on the Contact page</p>
                <Input
                  id="addressSubtext"
                  value={settings.addressSubtext}
                  onChange={(e) => setSettings({ ...settings, addressSubtext: e.target.value })}
                  placeholder="e.g. Shoreditch Creative Hub"
                />
              </div>
            </CardContent>
          </Card>

          {/* Social Media */}
          <Card>
            <CardHeader>
              <CardTitle>Social Media</CardTitle>
              <CardDescription>Your social media profiles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="spotify">Spotify URL</Label>
                <Input
                  id="spotify"
                  value={settings.spotify}
                  onChange={(e) => setSettings({ ...settings, spotify: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="instagram">Instagram URL</Label>
                <Input
                  id="instagram"
                  value={settings.instagram}
                  onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="x">X URL</Label>
                <Input
                  id="x"
                  value={settings.x}
                  onChange={(e) => setSettings({ ...settings, x: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="youtube">YouTube URL</Label>
                <Input
                  id="youtube"
                  value={settings.youtube}
                  onChange={(e) => setSettings({ ...settings, youtube: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="soundcloud">SoundCloud URL</Label>
                <Input
                  id="soundcloud"
                  value={settings.soundcloud}
                  onChange={(e) => setSettings({ ...settings, soundcloud: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="tiktok">TikTok URL</Label>
                <Input
                  id="tiktok"
                  value={settings.tiktok}
                  onChange={(e) => setSettings({ ...settings, tiktok: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} size="lg" disabled={updateSiteSettingsMutation.isPending}>
            {updateSiteSettingsMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}