import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar as CalendarLucide, Ticket, MapPin, Megaphone, CalendarIcon } from "lucide-react";
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

const promoteEventSchema = z.object({
  eventName: z.string().min(2, "Event name must be at least 2 characters"),
  eventDate: z.string().min(4, "Please include an event date"),
  eventLocation: z.string().min(2, "Please include an event location"),
  eventType: z.string().min(2, "Please include an event type"),
  tellUsMore: z.string().min(10, "Tell us more about your event"),
  expectedAttendance: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(Number(v)), "Expected attendance must be a number"),
  ticketingLink: z.string().optional(),
  promoContent: z.string().min(10, "Please include content for your promo"),
  instagramOrWebsiteLink: z.string().optional(),
  whatDoYouNeedFromUs: z.string().min(5, "Please tell us what you need from us"),
  budget: z.string().optional(),
  email: z.string().email("Please enter a valid email"),
});

type PromoteEventFormData = z.infer<typeof promoteEventSchema>;

export default function PromoteYourEventPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PromoteEventFormData>({
    resolver: zodResolver(promoteEventSchema),
    defaultValues: {
      email: "",
      eventName: "",
      eventDate: "",
      eventLocation: "",
      eventType: "",
      tellUsMore: "",
      expectedAttendance: "",
      ticketingLink: "",
      promoContent: "",
      instagramOrWebsiteLink: "",
      whatDoYouNeedFromUs: "",
      budget: "",
    },
  });

  const subjectForPreview = useMemo(() => {
    const e = form.watch("eventName");
    const d = form.watch("eventDate");
    const safeE = e?.trim() ? e.trim() : "Event";
    const safeD = d?.trim() ? d.trim() : "Date";
    return `Event Promo Request: ${safeE} — ${safeD}`;
  }, [form]);

  const submitMutation = useMutation({
    mutationFn: async (data: PromoteEventFormData) => {
      const expectedAttendance = data.expectedAttendance?.trim() ? Number(data.expectedAttendance) : undefined;
      return db.promoteEventSubmissions.create({
        eventName: data.eventName,
        eventDate: data.eventDate?.trim() ? data.eventDate.trim() : undefined,
        eventLocation: data.eventLocation,
        eventType: data.eventType,
        tellUsMore: data.tellUsMore,
        expectedAttendance: typeof expectedAttendance === "number" && !Number.isNaN(expectedAttendance) ? expectedAttendance : undefined,
        ticketingLink: data.ticketingLink?.trim() ? data.ticketingLink.trim() : undefined,
        promoContent: data.promoContent,
        instagramOrWebsiteLink: data.instagramOrWebsiteLink?.trim() ? data.instagramOrWebsiteLink.trim() : undefined,
        whatDoYouNeedFromUs: data.whatDoYouNeedFromUs,
        budget: data.budget?.trim() ? data.budget.trim() : undefined,
        email: data.email,
        status: "new",
      });
    },
    onSuccess: () => {
      toast({
        title: "Request sent!",
        description: "We’ll review your event and reply with a promo approach.",
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

  const onSubmit = async (data: PromoteEventFormData) => {
    setIsSubmitting(true);
    submitMutation.mutate(data);
  };

  return (
    <div className="min-h-screen">
      <ConfiguredPageHero
        pageKey="/promote-your-event"
        title="Promote Your Event"
        subtitle="Creative that sells tickets — and targeting that finds the right crowd."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-1 space-y-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-2xl font-bold mb-4">Turn interest into attendance</h2>
              <p className="text-muted-foreground">
                We build an event promo system: clear value proposition, scroll-stopping creatives, partner boosts,
                and tracking that tells you what’s actually converting.
              </p>
            </motion.div>

            <div className="space-y-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <Card>
                  <CardContent className="p-4 flex gap-4">
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CalendarLucide className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Timeline + wave strategy</h3>
                      <p className="text-sm text-muted-foreground">Announcement, lineup, reminders, last call.</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                  <CardContent className="p-4 flex gap-4">
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Ticket className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Ticket funnel tuning</h3>
                      <p className="text-sm text-muted-foreground">Reduce friction and lift conversion.</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card>
                  <CardContent className="p-4 flex gap-4">
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Megaphone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Ads + partner amplification</h3>
                      <p className="text-sm text-muted-foreground">Target lookalikes, retarget engagers, activate collabs.</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card>
                  <CardContent className="p-4 flex gap-4">
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Geo + audience fit</h3>
                      <p className="text-sm text-muted-foreground">Put the message in front of the right locals.</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">What to send</h3>
                <p className="text-sm text-muted-foreground">
                  Lineup, venue details, ticket link, previous event stats (if any), and the vibe reference.
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
                <CardTitle>Get an event promo plan</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your@email.com" {...field} data-testid="input-promo-event-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="eventName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event name</FormLabel>
                            <FormControl>
                              <Input placeholder="Event title" {...field} data-testid="input-promo-event-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="eventDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                    data-testid="input-promo-event-date"
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

                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="eventLocation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event location</FormLabel>
                            <FormControl>
                              <Input placeholder="Venue / city / address" {...field} data-testid="input-promo-event-location" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="eventType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event type</FormLabel>
                            <FormControl>
                              <Input placeholder="Club night / festival / showcase" {...field} data-testid="input-promo-event-type" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="expectedAttendance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>How many people do you expect? (optional)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Example: 250" {...field} data-testid="input-promo-event-attendance" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="ticketingLink"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ticketing Link (optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="https://..." {...field} data-testid="input-promo-event-ticket" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="tellUsMore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tell us more about your event</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Lineup, vibe, target crowd, history, and what makes it special"
                              className="min-h-[110px]"
                              {...field}
                              data-testid="textarea-promo-event-about"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="promoContent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content for your promo</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Links to assets, copy, lineup poster, videos, or references"
                              className="min-h-[110px]"
                              {...field}
                              data-testid="textarea-promo-event-content"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="instagramOrWebsiteLink"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instagram or website link (optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="https://..." {...field} data-testid="input-promo-event-instagram" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="whatDoYouNeedFromUs"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>What do you need from us?</FormLabel>
                            <FormControl>
                              <Input placeholder="Ads / creatives / partners / strategy" {...field} data-testid="input-promo-event-need" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="budget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Budget (optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Example: $200–$2,000" {...field} data-testid="input-promo-event-budget" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <p className="text-xs text-muted-foreground">
                        We’ll reply with a plan and a timeline for your event promo.
                      </p>
                      <Button type="submit" disabled={isSubmitting} data-testid="button-promo-event-submit">
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
