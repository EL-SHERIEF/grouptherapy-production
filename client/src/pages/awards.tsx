import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Trophy, Vote, Music, User, Calendar, CheckCircle, Loader2, Crown } from "lucide-react";
import { resolveMediaUrl } from "../lib/media";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { db, type AwardCategory, type AwardPeriod, type AwardEntry, type SiteSettings } from "@/lib/database";
import { AwardEntryCard } from "@/components/award-entry-card";

function generateFingerprint(): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillText("fingerprint", 2, 2);
  }
  const nav = navigator;
  const data = [
    nav.userAgent,
    nav.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    canvas.toDataURL(),
  ].join("|");
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

interface PeriodWithEntries extends AwardPeriod {
  category?: AwardCategory;
  entries: AwardEntry[];
}

export default function AwardsPage() {
  const { toast } = useToast();
  const [votedPeriods, setVotedPeriods] = useState<Set<string>>(new Set());
  const [fingerprint, setFingerprint] = useState<string>("");

  useEffect(() => {
    setFingerprint(generateFingerprint());
    const stored = localStorage.getItem("voted_periods");
    if (stored) {
      try {
        setVotedPeriods(new Set(JSON.parse(stored)));
      } catch {}
    }
  }, []);

  const { data: categories = [] } = useQuery<AwardCategory[]>({
    queryKey: ["awardCategories"],
    queryFn: () => db.awards.categories.getActive(),
  });

  const { data: periods = [] } = useQuery<AwardPeriod[]>({
    queryKey: ["awardPeriods"],
    queryFn: () => db.awards.periods.getAll(),
  });

  const { data: siteSettings } = useQuery<SiteSettings | null>({
    queryKey: ["siteSettings"],
    queryFn: () => db.siteSettings.get(),
  });

  const awardsOverride = siteSettings?.pageHeroOverrides?.["/awards"];
  const heroTitle = awardsOverride?.title ?? "Therapy Awards";
  const heroSubtitle =
    awardsOverride?.subtitle ??
    "Celebrate the best in electronic music. Vote for your favorite artists and tracks.";
  const heroBackgroundImage = awardsOverride?.backgroundImage;

  const { data: periodsWithEntries = [], isLoading } = useQuery<PeriodWithEntries[]>({
    queryKey: ["awardPeriodsWithEntries", periods, categories],
    queryFn: async () => {
      const result: PeriodWithEntries[] = [];
      for (const period of periods) {
        const entries = await db.awards.entries.getByPeriodId(period.id);
        const category = categories.find((c) => c.id === period.categoryId);
        result.push({ ...period, category, entries });
      }
      return result;
    },
    enabled: periods.length > 0 && categories.length > 0,
  });

  const activeVotingPeriods = periodsWithEntries.filter((p) => p.votingOpen);
  const pastPeriods = periodsWithEntries.filter((p) => !p.votingOpen && p.winnerId);

  const voteMutation = useMutation({
    mutationFn: async ({ entryId, periodId }: { entryId: string; periodId: string }) => {
      return db.awards.votes.submit(entryId, periodId, undefined, fingerprint);
    },
    onSuccess: (_, variables) => {
      const newVoted = new Set(votedPeriods);
      newVoted.add(variables.periodId);
      setVotedPeriods(newVoted);
      localStorage.setItem("voted_periods", JSON.stringify([...newVoted]));
      queryClient.invalidateQueries({ queryKey: ["awardPeriodsWithEntries"] });
      toast({
        title: "Vote Submitted!",
        description: "Thank you for voting. Your voice matters!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Vote Failed",
        description: error.message || "Unable to submit vote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleVote = (entryId: string, periodId: string) => {
    if (votedPeriods.has(periodId)) {
      toast({
        title: "Already Voted",
        description: "You have already voted in this period.",
        variant: "destructive",
      });
      return;
    }
    voteMutation.mutate({ entryId, periodId });
  };

  return (
    <div className="min-h-screen">
      <section className="relative min-h-[52vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          {heroBackgroundImage ? (
            <motion.img
              src={resolveMediaUrl(heroBackgroundImage, "hero")}
              alt=""
              className="w-full h-full object-cover"
              initial={{ scale: 1.02 }}
              animate={{ scale: 1.08 }}
              transition={{ duration: 10, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-primary/10 via-background to-background" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
        </div>

        <motion.div
          className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.05]"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.08, 0.05],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <div className="relative z-10 text-center px-6 md:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Trophy className="h-16 w-16 mx-auto mb-6 text-primary" />
          </motion.div>

          <motion.h1
            className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-[-0.04em] mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            {heroTitle}
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {heroSubtitle}
          </motion.p>

          <motion.div
            className="flex items-center justify-center gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            {[
              { value: activeVotingPeriods.length.toString(), label: "Active Votes" },
              { value: categories.length.toString(), label: "Categories" },
              { value: pastPeriods.length.toString(), label: "Past Winners" },
            ].map((stat, i) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs defaultValue="vote" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12">
            <TabsTrigger value="vote" className="gap-2">
              <Vote className="h-4 w-4" />
              Vote Now
            </TabsTrigger>
            <TabsTrigger value="winners" className="gap-2">
              <Crown className="h-4 w-4" />
              Past Winners
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vote">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : activeVotingPeriods.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">No Active Voting</h3>
                <p className="text-muted-foreground">
                  Check back soon for the next voting period!
                </p>
              </motion.div>
            ) : (
              <div className="space-y-12">
                {activeVotingPeriods.map((period) => (
                  <VotingPeriodSection
                    key={period.id}
                    period={period}
                    hasVoted={votedPeriods.has(period.id)}
                    onVote={handleVote}
                    isVoting={voteMutation.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="winners">
            {pastPeriods.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <Crown className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">No Past Winners Yet</h3>
                <p className="text-muted-foreground">
                  Winners will be announced after each voting period ends.
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastPeriods.map((period, index) => {
                  const winner = period.entries.find((e) => e.id === period.winnerId || e.isWinner);
                  if (!winner) return null;

                  return (
                    <motion.div
                      key={period.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <WinnerCard period={period} winner={winner} />
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function VotingPeriodSection({
  period,
  hasVoted,
  onVote,
  isVoting,
}: {
  period: PeriodWithEntries;
  hasVoted: boolean;
  onVote: (entryId: string, periodId: string) => void;
  isVoting: boolean;
}) {
  // Calculate total votes for percentage
  const totalVotes = period.entries.reduce((sum, entry) => sum + (entry.voteCount || 0), 0);
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">{period.name}</h2>
            <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
              Voting Open
            </Badge>
          </div>
          {period.category && (
            <p className="text-muted-foreground flex items-center gap-2">
              {period.category.type === "artist" ? (
                <User className="h-4 w-4" />
              ) : (
                <Music className="h-4 w-4" />
              )}
              {period.category.name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {formatDate(period.startDate)} - {formatDate(period.endDate)}
          </span>
        </div>
      </div>

      {hasVoted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 p-4 rounded-lg bg-primary/10 border border-primary/20"
        >
          <CheckCircle className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">You have voted in this period</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        <AnimatePresence>
          {period.entries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <AwardEntryCard
                entry={entry}
                categoryType={period.category?.type}
                onVote={() => onVote(entry.id, period.id)}
                hasVoted={hasVoted}
                isVoting={isVoting}
                totalVotes={totalVotes}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

function WinnerCard({
  period,
  winner,
}: {
  period: PeriodWithEntries;
  winner: AwardEntry;
}) {
  const imageUrl = period.category?.type === "artist" ? winner.artistImageUrl : winner.trackCoverUrl;
  const title = period.category?.type === "artist" ? winner.artistName : winner.trackTitle;
  const subtitle = period.category?.type === "track" ? winner.trackArtist : undefined;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Card className="overflow-hidden bg-card/50 border-primary/20 hover:border-primary/40 transition-colors">
      <div className="relative aspect-square overflow-hidden">
        {imageUrl ? (
          <img
            src={resolveMediaUrl(imageUrl, "thumb")}
            alt={title || "Winner"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-muted flex items-center justify-center">
            <Trophy className="h-16 w-16 text-primary/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="absolute top-3 left-3">
          <Badge className="bg-primary text-primary-foreground gap-1">
            <Crown className="h-3 w-3" />
            Winner
          </Badge>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-bold text-lg text-white truncate">{title || "Unknown"}</h3>
          {subtitle && (
            <p className="text-sm text-white/70 truncate">{subtitle}</p>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">{period.name}</p>
            {period.category && (
              <p className="text-xs text-muted-foreground">{period.category.name}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-primary">{winner.voteCount} votes</p>
            <p className="text-xs text-muted-foreground">{formatDate(period.endDate)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
