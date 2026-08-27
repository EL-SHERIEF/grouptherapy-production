import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Radio, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sheet, SheetClose, SheetContent } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { useRadio } from "@/lib/radio-context";

const musicDropdownItems = [
    { href: "/radio", label: "Radio" },
  { href: "/releases", label: "Releases" },
  { href: "/artists", label: "Artists" },
  { href: "/playlists", label: "Playlists" }
];

const discoverDropdownItems = [
  { href: "/events", label: "Events" },
  { href: "/tours", label: "Tours" },
  { href: "/videos", label: "Videos" },
  { href: "/news", label: "News" },
    { href: "/awards", label: "Awards" },
];
const companyDropdownItems = [
  { href: "/about", label: "About" },
  { href: "/careers", label: "Careers" },
  { href: "/press", label: "Press" },
  { href: "/promote-your-release", label: "Release Promotion" },
  { href: "/promote-your-event", label: "Event Promotion" },
];
const navLinks = [
  { href: "/", label: "Home" },
  { type: "dropdown", label: "Music", items: musicDropdownItems },
  { type: "dropdown", label: "Discover", items: discoverDropdownItems },
  { type: "dropdown", label: "Company", items: companyDropdownItems },
  { href: "/contact", label: "Contact" },
];

function NavDropdown({ 
  label, 
  items, 
  isActive 
}: { 
  label: string; 
  items: { href: string; label: string }[];
  isActive: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();

  const dropdownId = `nav-dropdown-${label.toLowerCase().replace(/\s+/g, "-")}`;

  const isCurrentActive = items.some(item => location === item.href);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        className={cn(
          "relative px-4 py-2 text-sm font-medium transition-colors rounded-full flex items-center gap-1",
          isCurrentActive
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={dropdownId}
      >
        {label}
        <ChevronDown className={cn(
          "h-3.5 w-3.5 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
        {isCurrentActive && (
          <motion.div
            className="absolute inset-0 bg-primary/10 rounded-full -z-10"
            layoutId="navActive"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 pt-2 z-50"
          >
            <div
              id={dropdownId}
              role="menu"
              aria-label={label}
              className="bg-popover/95 border border-border/50 rounded-xl shadow-lg shadow-black/10 overflow-hidden min-w-[160px]"
            >
              <div className="p-1.5">
                {items.map((item, index) => (
                  <Link key={item.href} href={item.href}>
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={cn(
                        "w-full text-left px-3.5 py-2 text-sm rounded-lg transition-colors",
                        location === item.href
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                      onClick={() => setIsOpen(false)}
                      role="menuitem"
                    >
                      {item.label}
                    </motion.button>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Navigation() {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isPlaying, isLive } = useRadio();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <motion.header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          isScrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border/50"
            : "bg-transparent"
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <nav className="flex items-center justify-between h-14 lg:h-16">
            <Link href="/" className="flex items-center gap-1 group" data-testid="link-logo">
            <img
              src="/favicon.png"
              className="w-8 h-8"
              alt="GroupTherapy Logo"
              width={32}
              height={32}
              decoding="async"
            />
              <span className="text-lg lg:text-xl font-semibold tracking-tight">
                GROUP<span className="text-primary transition-colors">THERAPY</span>
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-0.5">
              {navLinks.map((link) => (
                link.type === "dropdown" ? (
                  <NavDropdown 
                    key={link.label} 
                    label={link.label} 
                    items={link.items!} 
                    isActive={false}
                  />
                ) : (
                  <Link key={link.href} href={link.href!}>
                    <button
                      type="button"
                      className={cn(
                        "relative px-4 py-2 text-sm font-medium transition-colors rounded-full",
                        location === link.href
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      data-testid={`link-nav-${link.label.toLowerCase()}`}
                    >
                      {link.label}
                      {location === link.href && (
                        <motion.div
                          className="absolute inset-0 bg-primary/10 rounded-full -z-10"
                          layoutId="navActive"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </button>
                  </Link>
                )
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Link href="/radio" className="hidden sm:block">
                <Button
                  variant={isPlaying ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "rounded-full gap-2 transition-all duration-300 h-8 text-xs",
                    isPlaying 
                      ? "shadow-md shadow-primary/20" 
                      : "border-border/50 hover:border-primary/30"
                  )}
                  data-testid="button-radio-cta"
                  aria-label={isPlaying ? "Radio: Live" : "Radio: Listen"}
                >
                  <Radio className="h-3 w-3" />
                  {isPlaying ? "Live" : "Listen"}
                </Button>
              </Link>

              <ThemeToggle className="h-11 w-11 sm:h-9 sm:w-9 rounded-full" />

              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden rounded-full h-11 w-11"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                data-testid="button-mobile-menu"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-nav"
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {isMobileMenuOpen ? <X className="h-6 w-6 scale-150" /> : <Menu className="h-6 w-6 scale-150" />}
                </motion.div>
              </Button>
            </div>
          </nav>
        </div>
      </motion.header>

      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent
          side="right"
          hideClose
          className={cn(
            "lg:hidden p-0 w-[min(92vw,26rem)]",
            "border border-border/40",
            "bg-background/75 supports-[backdrop-filter]:bg-background/55",
            "backdrop-blur-2xl",
            "shadow-2xl shadow-black/30",
            "ring-1 ring-white/10",
            "shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_20px_70px_rgba(0,0,0,0.45)]"
          )}
        >
          <div className="relative h-full">
            <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

            <div id="mobile-nav" aria-label="Mobile" className="relative flex h-full flex-col">
            <div className="px-5 pt-5 pb-4 border-b border-border/25">
              <div className="flex items-center justify-between gap-3">
                <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <img
                    src="/favicon.png"
                    className="w-8 h-8"
                    alt="GroupTherapy Logo"
                    width={32}
                    height={32}
                    decoding="async"
                  />
                  <div className="leading-none">
                    <div className="text-base font-semibold tracking-tight">
                      GROUP<span className="text-primary">THERAPY</span>
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-2">
                  <ThemeToggle className="h-10 w-10 rounded-full" />
                  <SheetClose asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-full"
                      aria-label="Close menu"
                      data-testid="button-mobile-menu-close"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </SheetClose>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Link href="/radio" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button
                    variant={isPlaying ? "default" : "outline"}
                    className={cn(
                      "w-full justify-center gap-2 rounded-2xl h-11",
                      isPlaying
                        ? "shadow-md shadow-primary/20"
                        : "border-border/40 hover:border-primary/30 bg-background/20 hover:bg-background/30"
                    )}
                    aria-label={isPlaying ? "Radio: Live" : "Radio: Listen"}
                  >
                    <Radio className="h-4 w-4" />
                    {isPlaying ? "Live Radio" : "Listen"}
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-6 pt-2">
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                    <button
                      type="button"
                      className={cn(
                        "w-full rounded-2xl px-4 py-3 text-left text-base font-medium transition-colors border",
                        location === "/"
                          ? "bg-primary/10 text-primary border-primary/25"
                          : "bg-background/15 hover:bg-background/25 text-foreground border-border/25"
                      )}
                      data-testid="link-mobile-home"
                    >
                      Home
                    </button>
                  </Link>
                  <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)}>
                    <button
                      type="button"
                      className={cn(
                        "w-full rounded-2xl px-4 py-3 text-left text-base font-medium transition-colors border",
                        location === "/contact"
                          ? "bg-primary/10 text-primary border-primary/25"
                          : "bg-background/15 hover:bg-background/25 text-foreground border-border/25"
                      )}
                      data-testid="link-mobile-contact"
                    >
                      Contact
                    </button>
                  </Link>
                </div>

                <Accordion type="single" collapsible className="space-y-2">
                  {navLinks
                    .filter((l) => l.type === "dropdown")
                    .map((l) => {
                      const items = l.items || [];
                      const isGroupActive = items.some((it) => it.href === location);
                      const value = `mobile-${l.label.toLowerCase()}`;

                      return (
                        <AccordionItem
                          key={l.label}
                          value={value}
                          className={cn(
                            "border-0 rounded-2xl overflow-hidden",
                            "border border-border/25 bg-background/10"
                          )}
                        >
                          <AccordionTrigger
                            className={cn(
                              "px-4 py-3 hover:no-underline",
                              "data-[state=open]:bg-background/10",
                              isGroupActive ? "text-primary" : "text-foreground"
                            )}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <span className="text-base font-semibold tracking-tight">{l.label}</span>
                                {isGroupActive ? <span className="h-1.5 w-1.5 rounded-full bg-primary" /> : null}
                              </div>
                              <span className="sr-only">Toggle</span>
                            </div>
                          </AccordionTrigger>

                          <AccordionContent className="px-3 pb-3">
                            <div className="space-y-1">
                              {items.map((it) => (
                                <Link key={it.href} href={it.href} onClick={() => setIsMobileMenuOpen(false)}>
                                  <button
                                    type="button"
                                    className={cn(
                                      "w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors border",
                                      "flex items-center justify-between",
                                      location === it.href
                                        ? "bg-primary/10 text-primary font-medium border-primary/20"
                                        : "text-foreground/85 hover:text-foreground bg-background/10 hover:bg-background/20 border-border/20"
                                    )}
                                    data-testid={`link-mobile-${it.label.toLowerCase().replace(/\s+/g, "-")}`}
                                  >
                                    <span>{it.label}</span>
                                    <span className={cn("text-xs", location === it.href ? "text-primary" : "text-muted-foreground")}>Open</span>
                                  </button>
                                </Link>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                </Accordion>
              </div>
            </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
