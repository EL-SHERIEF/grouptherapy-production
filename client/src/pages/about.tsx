import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { resolveMediaUrl } from "../lib/media";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { PageHero } from "@/components/hero-section";
import { Marquee } from "@/components/marquee";
import { PartnersLogoMarquee } from "@/components/partners-logo-marquee";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiLinkedin, SiX, SiInstagram } from "react-icons/si";
import { db, type StaticPage, type SiteSettings } from "@/lib/database";
import type { TeamMember } from "@shared/schema";

const demoTeam: Partial<TeamMember>[] = [
  {
    id: "1",
    name: "Alex Thompson",
    role: "Founder & CEO",
    bio: "Visionary behind GroupTherapy Records, Alex has been shaping electronic music culture for over 15 years.",
    imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop",
    socialLinks: { linkedin: "#", twitter: "#" },
    order: 1,
  },
  {
    id: "2",
    name: "Sarah Chen",
    role: "Head of A&R",
    bio: "With an ear for the next big sound, Sarah discovers and develops the talent that defines our roster.",
    imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop",
    socialLinks: { linkedin: "#", instagram: "#" },
    order: 2,
  },
  {
    id: "3",
    name: "Marcus Rivera",
    role: "Creative Director",
    bio: "Marcus crafts the visual identity of GroupTherapy, from album art to live show production.",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
    socialLinks: { twitter: "#", instagram: "#" },
    order: 3,
  },
  {
    id: "4",
    name: "Emma Wilson",
    role: "Marketing Director",
    bio: "Emma leads our global marketing strategy, connecting artists with fans worldwide.",
    imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop",
    socialLinks: { linkedin: "#" },
    order: 4,
  },
];

const milestones = [
  { year: "2015", title: "Founded", description: "GroupTherapy Records was born in a London basement studio" },
  { year: "2017", title: "First Festival", description: "Launched our flagship festival event" },
  { year: "2019", title: "100 Releases", description: "Reached 100 releases milestone" },
  { year: "2021", title: "Radio Launch", description: "GroupTherapy Radio goes live 24/7" },
  { year: "2023", title: "Global Expansion", description: "Opened offices in Berlin and Los Angeles" },
  { year: "2024", title: "Today", description: "Continuing to push boundaries in electronic music" },
];

type AboutPageModel = {
  heroTitle?: string;
  heroSubtitle?: string;
  sections?: Array<{ id: string; enabled: boolean; order: number }>;
  missionHeading?: string;
  missionText?: string;
  stats?: Array<{ value: string; label: string }>;
  timelineHeading?: string;
  milestones?: Array<{ year: string; title: string; description: string }>;
  teamHeading?: string;
  teamMembers?: Array<Partial<TeamMember>>;
  ctaHeading?: string;
  ctaDescription?: string;
  ctaPrimaryText?: string;
  ctaSecondaryText?: string;
};

const defaultAboutSections: Array<{ id: string; enabled: boolean; order: number }> = [
  { id: "marquee", enabled: true, order: 1 },
  { id: "mission", enabled: true, order: 2 },
  { id: "stats", enabled: true, order: 3 },
  { id: "timeline", enabled: true, order: 4 },
  { id: "team", enabled: true, order: 5 },
  { id: "cta", enabled: true, order: 6 },
  { id: "partners", enabled: true, order: 7 },
];

function normalizeAboutSections(
  incoming: AboutPageModel["sections"],
  defaults: Array<{ id: string; enabled: boolean; order: number }>
) {
  const byId = new Map(
    (Array.isArray(incoming) ? incoming : [])
      .filter((s) => !!s && typeof s.id === "string")
      .map((s) => [s.id, s] as const)
  );

  return defaults
    .map((d) => {
      const inc = byId.get(d.id);
      if (!inc) return d;
      return {
        ...d,
        ...inc,
        id: d.id,
        enabled: typeof inc.enabled === "boolean" ? inc.enabled : d.enabled,
        order: typeof inc.order === "number" ? inc.order : d.order,
      };
    })
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function parseAboutModel(raw: string): AboutPageModel | null {
  const trimmed = (raw || "").trim();
  if (!trimmed || !trimmed.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as AboutPageModel;
  } catch {
    return null;
  }
}

const defaultAboutModel: AboutPageModel = {
  heroTitle: "About Us",
  heroSubtitle: "The story behind the sound",
  missionHeading: "Our Mission",
  missionText:
    "GroupTherapy Records is more than a record label – it's a movement. We're dedicated to discovering, nurturing, and amplifying the most innovative voices in electronic music. From underground clubs to festival main stages, we're building a community that celebrates the transformative power of sound.",
  stats: [
    { value: "200+", label: "Releases" },
    { value: "50+", label: "Artists" },
    { value: "1M+", label: "Monthly Listeners" },
    { value: "100+", label: "Events" },
  ],
  timelineHeading: "Our Journey",
  milestones,
  teamHeading: "Meet the Team",
  teamMembers: demoTeam,
  ctaHeading: "Want to work with us?",
  ctaDescription:
    "Whether you have a question about our artists, event promos, or submitting a demo, get in touch.",
  ctaPrimaryText: "Get in Touch",
  ctaSecondaryText: "Press Kit",
};

export default function AboutPage() {
  const { data: aboutPage } = useQuery<StaticPage | null>({
    queryKey: ["staticPage", "about"],
    queryFn: () => db.staticPages.getBySlug("about"),
  });

  const { data: siteSettings } = useQuery<SiteSettings | null>({
    queryKey: ["siteSettings"],
    queryFn: () => db.siteSettings.get(),
  });

  const aboutModel = useMemo(() => {
    return aboutPage?.content ? parseAboutModel(aboutPage.content) : null;
  }, [aboutPage?.content]);

  const orderedSections = useMemo(() => {
    return normalizeAboutSections(aboutModel?.sections, defaultAboutSections);
  }, [aboutModel?.sections]);

  const heroTitle = aboutModel?.heroTitle ?? "About Us";
  const heroSubtitle = aboutModel?.heroSubtitle ?? "The story behind the sound";
  const missionHeading = aboutModel?.missionHeading ?? "Our Mission";
  const missionText =
    aboutModel?.missionText ??
    "GroupTherapy Records is more than a record label – it's a movement. We're dedicated to discovering, nurturing, and amplifying the most innovative voices in electronic music. From underground clubs to festival main stages, we're building a community that celebrates the transformative power of sound.";
  const stats =
    aboutModel?.stats ??
    [
      { value: "200+", label: "Releases" },
      { value: "50+", label: "Artists" },
      { value: "1M+", label: "Monthly Listeners" },
      { value: "100+", label: "Events" },
    ];
  const timelineHeading = aboutModel?.timelineHeading ?? "Our Journey";
  const timelineMilestones = aboutModel?.milestones ?? milestones;
  const teamHeading = aboutModel?.teamHeading ?? "Meet the Team";
  const teamMembers = (aboutModel?.teamMembers?.length ? aboutModel.teamMembers : demoTeam) as Partial<TeamMember>[];
  const ctaHeading = aboutModel?.ctaHeading ?? "Want to work with us?";
  const ctaDescription =
    aboutModel?.ctaDescription ??
    "Whether you have a question about our artists, event promos, or submitting a demo, get in touch.";
  const ctaPrimaryText = aboutModel?.ctaPrimaryText ?? "Get in Touch";
  const ctaSecondaryText = aboutModel?.ctaSecondaryText ?? "Press Kit";

  return (
    <div className="min-h-screen">
      <PageHero
        title={heroTitle}
        subtitle={heroSubtitle}
      />

      {orderedSections.map((section) => {
        if (!section.enabled) return null;

        if (section.id === "marquee") {
          return (
            <Marquee
              key={section.id}
              items={siteSettings?.marqueeItems || []}
              speed={siteSettings?.marqueeSpeed || 40}
            />
          );
        }

        if (section.id === "partners") {
          return (
            <PartnersLogoMarquee
              key={section.id}
              items={siteSettings?.partnersMarqueeItems || []}
              speed={siteSettings?.partnersMarqueeSpeed || 40}
              gap={siteSettings?.partnersMarqueeGap || 48}
              logoHeight={siteSettings?.partnersMarqueeLogoHeight || 32}
              useMutedBg={siteSettings?.partnersMarqueeUseMutedBg || false}
            />
          );
        }

        if (section.id === "mission") {
          return (
            <div key={section.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <section className="mb-20">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="max-w-3xl mx-auto text-center"
                >
                  <h2 className="text-3xl lg:text-4xl font-bold mb-6">{missionHeading}</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">{missionText}</p>
                </motion.div>
              </section>
            </div>
          );
        }

        if (section.id === "stats") {
          return (
            <div key={section.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <section className="mb-20">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="text-center p-6">
                        <CardContent className="p-0">
                          <div className="text-4xl lg:text-5xl font-bold text-primary mb-2">
                            {stat.value}
                          </div>
                          <div className="text-muted-foreground">{stat.label}</div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </section>
            </div>
          );
        }

        if (section.id === "timeline") {
          return (
            <div key={section.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <section className="mb-20">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-3xl font-bold mb-12 text-center"
                >
                  {timelineHeading}
                </motion.h2>
                <div className="relative">
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-border hidden lg:block" />

                  <div className="space-y-8 lg:space-y-0">
                    {timelineMilestones.map((milestone, index) => (
                      <motion.div
                        key={milestone.year}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className={`relative lg:flex lg:items-center ${
                          index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                        }`}
                      >
                        <div
                          className={`lg:w-1/2 ${
                            index % 2 === 0 ? "lg:pr-12 lg:text-right" : "lg:pl-12"
                          }`}
                        >
                          <Card className="inline-block">
                            <CardContent className="p-4">
                              <div className="text-primary font-bold text-xl mb-1">{milestone.year}</div>
                              <div className="font-semibold mb-1">{milestone.title}</div>
                              <p className="text-sm text-muted-foreground">{milestone.description}</p>
                            </CardContent>
                          </Card>
                        </div>
                        <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-primary hidden lg:block" />
                        <div className="lg:w-1/2" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          );
        }

        if (section.id === "team") {
          return (
            <div key={section.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <section className="mb-20">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-3xl font-bold mb-12 text-center"
                >
                  {teamHeading}
                </motion.h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {teamMembers.map((member, index) => (
                    <motion.div
                      key={member.id || String(index)}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <TeamCard member={member as TeamMember} />
                    </motion.div>
                  ))}
                </div>
              </section>
            </div>
          );
        }

        if (section.id === "cta") {
          return (
            <div key={section.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <section>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-card rounded-md p-8 lg:p-12 text-center"
                >
                  <h2 className="text-2xl lg:text-3xl font-bold mb-4">{ctaHeading}</h2>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">{ctaDescription}</p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/contact">
                      <Button size="lg" className="gap-2" data-testid="button-contact-cta">
                        {ctaPrimaryText}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/press">
                      <Button size="lg" variant="outline" data-testid="button-press-cta">
                        {ctaSecondaryText}
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              </section>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

function TeamCard({ member }: { member: TeamMember }) {
  return (
    <Card className="overflow-hidden group" data-testid={`card-team-${member.id}`}>
      <div className="relative aspect-square overflow-hidden">
        {member.imageUrl ? (
          <img
            src={resolveMediaUrl(member.imageUrl, "thumb")}
            alt={member.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-muted" />
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold">{member.name}</h3>
        <p className="text-sm text-primary mb-2">{member.role}</p>
        {member.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2">{member.bio}</p>
        )}
        <div className="flex items-center gap-2 mt-3">
          {member.socialLinks?.linkedin && (
            <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
              <a href={member.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                <SiLinkedin className="h-4 w-4" />
              </a>
            </Button>
          )}
          {member.socialLinks?.twitter && (
            <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
              <a href={member.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                <SiX className="h-4 w-4" />
              </a>
            </Button>
          )}
          {member.socialLinks?.instagram && (
            <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
              <a href={member.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                <SiInstagram className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
