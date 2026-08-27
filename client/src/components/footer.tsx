import { useMemo, useState } from "react";
import { Link } from "wouter";
import { SiSpotify, SiInstagram, SiX, SiYoutube, SiSoundcloud, SiTiktok } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/database";
import { Loader2, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const footerLinks = {
  music: [
    { label: "Releases", href: "/releases" },
    { label: "Artists", href: "/artists" },
    { label: "Playlists", href: "/playlists" },
    { label: "Radio", href: "/radio" },
  ],
  discover: [
    { label: "Events", href: "/events" },
    { label: "Tours", href: "/tours" },
    { label: "Awards", href: "/awards" },
    { label: "Videos", href: "/videos" },
    { label: "News", href: "/news" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Careers", href: "/careers" },
    { label: "Press", href: "/press" },
    { label: "Promote Your Release", href: "/promote-your-release" },
    { label: "Promote Your Event", href: "/promote-your-event" },
  ],
};

export function Footer() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { data: siteSettings } = useQuery({
    queryKey: ["siteSettings"],
    queryFn: () => db.siteSettings.get(),
  });

  const socialLinks = useMemo(() => {
    const links = siteSettings?.socialLinks;
    return [
      { icon: SiSpotify, href: links?.spotify, label: "Spotify" },
      { icon: SiInstagram, href: links?.instagram, label: "Instagram" },
      { icon: SiX, href: links?.x, label: "X" },
      { icon: SiYoutube, href: links?.youtube, label: "YouTube" },
      { icon: SiSoundcloud, href: links?.soundcloud, label: "SoundCloud" },
      { icon: SiTiktok, href: links?.tiktok, label: "TikTok" },
    ].filter((item) => !!item.href);
  }, [siteSettings?.socialLinks]);

  const linkGroups = useMemo(
    () => [
      { id: "music", title: "Music", links: footerLinks.music },
      { id: "discover", title: "Discover", links: footerLinks.discover },
      { id: "company", title: "Company", links: footerLinks.company },
    ],
    []
  );

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await db.newsletterSubscribers.subscribe(email, undefined, 'footer');
      toast({
        title: "Subscribed",
        description: "You're now part of the community.",
      });
      setEmail("");
    } catch (error: any) {
      if (error?.message?.includes("already subscribed") || error?.message?.includes("duplicate") || error?.code === "23505") {
        toast({
          title: "Already subscribed",
          description: "This email is already on our list.",
        });
      } else {
        toast({
          title: "Something went wrong",
          description: "Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <footer className="bg-card border-t border-border/50 pb-20">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-10">
          <div className="lg:col-span-4">
            <div className="space-y-5">
              <Link href="/" className="flex items-center gap-1 group" data-testid="link-logo">
                <img src="/favicon.png" className="w-8 h-8" alt="GroupTherapy Logo" />
                <span className="text-lg lg:text-xl font-semibold tracking-tight">
                  GROUP<span className="text-primary transition-colors">THERAPY</span>
                </span>
              </Link>

              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                Home of Artists
              </p>

              {socialLinks.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Follow</p>
                  <div className="flex flex-wrap gap-2">
                    {socialLinks.map((social) => (
                      <a
                        key={social.label}
                        href={social.href!}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.label}
                        className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        data-testid={`link-social-${social.label.toLowerCase()}`}
                      >
                        <social.icon className="h-4 w-4" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubscribe} className="space-y-2.5">
                <p className="text-sm font-medium">Stay updated</p>
                <div className="flex flex-row gap-2">
                  <Input
                    id="newsletter-email-footer"
                    name="newsletterEmailFooter"
                    type="email"
                    placeholder="your@email.com"
                    aria-label="Email address"
                    autoComplete="email"
                    className="w-full sm:max-w-[260px] rounded-full bg-background border-border/50 focus:border-primary/50 h-10 text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    data-testid="input-newsletter-email"
                  />
                  <Button
                    size="icon"
                    type="submit"
                    disabled={isLoading}
                    className="rounded-full shrink-0 h-10 w-10"
                    data-testid="button-newsletter-submit"
                    aria-label="Subscribe"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-8">
            <nav aria-label="Footer" className="w-full">
              <div className="md:hidden">
                <Accordion type="multiple" className="w-full" defaultValue={["music"]}>
                  {linkGroups.map((group) => (
                    <AccordionItem key={group.id} value={group.id} className="border-border/50">
                      <AccordionTrigger className="text-sm font-medium hover:no-underline">
                        {group.title}
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2">
                          {group.links.map((link) => (
                            <li key={link.href}>
                              <Link
                                href={link.href}
                                className="flex w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {link.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-8">
                {linkGroups.map((group) => (
                  <div key={group.id}>
                    <h4 className="text-sm font-medium mb-3">{group.title}</h4>
                    <ul className="space-y-2">
                      {group.links.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            className="inline-flex py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </nav>
          </div>
        </div>

        <div className="border-t border-border/50 mt-12 pt-6 flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            {new Date().getFullYear()} GroupTherapy Eg. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/cookies" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
