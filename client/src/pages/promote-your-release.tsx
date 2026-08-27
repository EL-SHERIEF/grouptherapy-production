import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Megaphone, Music2, Sparkles, TrendingUp, CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";

import { ConfiguredPageHero } from "@/components/hero-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/database";
import { cn } from "@/lib/utils";

const promoteReleaseSchema = z.object({
  artistName: z.string().min(2, "Artist name must be at least 2 characters"),
  instagram: z.string().optional(),
  trackTitle: z.string().min(2, "Track title must be at least 2 characters"),
  trackLink: z.string().min(5, "Please include a track link"),
  releaseDate: z.string().optional(),
  describeTrack: z.string().min(5, "Describe your track in a few words"),
  monthlyListeners: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(Number(v)), "Monthly listeners must be a number"),
  promoContent: z.string().min(10, "Please include content for your promo"),
  promotionGoal: z.string().min(5, "Please include a promotion goal"),
  budget: z.string().optional(),
  email: z.string().email("Please enter a valid email"),
});

type PromoteReleaseFormData = z.infer<typeof promoteReleaseSchema>;

export default function PromoteYourReleasePage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PromoteReleaseFormData>({
    resolver: zodResolver(promoteReleaseSchema),
    defaultValues: {
      artistName: "",
      instagram: "",
      trackTitle: "",
      trackLink: "",
      releaseDate: "",
      describeTrack: "",
      monthlyListeners: "",
      promoContent: "",
      promotionGoal: "",
      budget: "",
      email: "",
    },
  });

  const subjectForPreview = useMemo(() => {
    const a = form.watch("artistName");
    const r = form.watch("trackTitle");
    const safeA = a?.trim() ? a.trim() : "Artist";
    const safeR = r?.trim() ? r.trim() : "Track";
    return `Track Promo Request: ${safeA} — ${safeR}`;
  }, [form]);

  const submitMutation = useMutation({
    mutationFn: async (data: PromoteReleaseFormData) => {
      const monthlyListeners = data.monthlyListeners?.trim() ? Number(data.monthlyListeners) : undefined;
      return db.promoteReleaseSubmissions.create({
        artistName: data.artistName,
        instagram: data.instagram?.trim() ? data.instagram.trim() : undefined,
        trackTitle: data.trackTitle,
        trackLink: data.trackLink?.trim() ? data.trackLink.trim() : undefined,
        releaseDate: data.releaseDate?.trim() ? data.releaseDate.trim() : undefined,
        describeTrack: data.describeTrack,
        monthlyListeners: typeof monthlyListeners === "number" && !Number.isNaN(monthlyListeners) ? monthlyListeners : undefined,
        promoContent: data.promoContent,
        promotionGoal: data.promotionGoal,
        budget: data.budget?.trim() ? data.budget.trim() : undefined,
        email: data.email,
        status: "new",
      });
    },
    onSuccess: () => {
      toast({
        title: "Request sent!",
        description: "We’ll review your track and get back to you with next steps.",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send request. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => setIsSubmitting(false),
  });

  const onSubmit = async (data: PromoteReleaseFormData) => {
    setIsSubmitting(true);
    submitMutation.mutate(data);
  };

  return (
    <div className="min-h-screen">
      <ConfiguredPageHero
        pageKey="/promote-your-release"
        title="Promote Your Release"
        subtitle="A sharper rollout. Cleaner narrative. Better conversion."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-1 space-y-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-2xl font-bold mb-4">Make the drop feel inevitable</h2>
              <p className="text-muted-foreground">
                We help you craft a release moment that travels: pitch-ready copy, high-performing creatives,
                smart targeting, and a rollout timeline that respects your audience.
              </p>
            </motion.div>

            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <Card>
                  <CardContent className="p-4 flex gap-4">
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Narrative + positioning</h3>
                      <p className="text-sm text-muted-foreground">What are we really selling — and to whom?</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardContent className="p-4 flex gap-4">
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Megaphone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Pitch + press assets</h3>
                      <p className="text-sm text-muted-foreground">Short, sharp copy and a media-ready kit.</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Card>
                  <CardContent className="p-4 flex gap-4">
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Paid + conversion tracking</h3>
                      <p className="text-sm text-muted-foreground">Spend where it matters, measure what moves.</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardContent className="p-4 flex gap-4">
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Music2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Platform-aware rollout</h3>
                      <p className="text-sm text-muted-foreground">Spotify, TikTok, IG, YouTube — one story, many cuts.</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">What to send</h3>
                <p className="text-sm text-muted-foreground">
                  A private streaming link, artwork, a short bio, and any angles you want us to lean into.
                </p>
              </CardContent>
            </Card>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle>Get a promo plan</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="artistName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Artist / project name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your artist name" {...field} data-testid="input-promo-release-artist" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="instagram"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instagram (optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="@yourhandle" {...field} data-testid="input-promo-release-instagram" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="trackTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Track Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Track name" {...field} data-testid="input-promo-release-track-title" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="releaseDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Release Date</FormLabel>
                            <FormControl>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                    data-testid="input-promo-release-date"
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(parseISO(field.value), "MMM d, yyyy") : "Pick a date"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value ? parseISO(field.value) : undefined}
                                    onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="trackLink"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Track Link</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://..."
                              {...field}
                              data-testid="input-promo-release-track-link"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="describeTrack"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Describe your track in a few words</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Mood, genre, references, or the story behind it"
                              className="min-h-[90px]"
                              {...field}
                              data-testid="textarea-promo-release-describe"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="monthlyListeners"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your current monthly listeners (optional)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Example: 12000" {...field} data-testid="input-promo-release-monthly-listeners" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="promotionGoal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Promotion goal</FormLabel>
                            <FormControl>
                              <Input placeholder="Streams / editorial / growth / press" {...field} data-testid="input-promo-release-goal" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="promoContent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content for your promo</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Links to assets, copies, concepts, or anything you want us to use"
                              className="min-h-[110px]"
                              {...field}
                              data-testid="textarea-promo-release-content"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid sm:grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="budget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Budget (optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Example: $250–$1,000" {...field} data-testid="input-promo-release-budget" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your@email.com" {...field} data-testid="input-promo-release-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center justify-between gap-4">
                      <p className="text-xs text-muted-foreground">
                        We’ll reply with a rollout recommendation and a next-step checklist.
                      </p>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        data-testid="button-promo-release-submit"
                      >
                        {isSubmitting ? "Sending…" : "Send request"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
