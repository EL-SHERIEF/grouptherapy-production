import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Send, Mail, MapPin, Phone, Upload, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ConfiguredPageHero } from "@/components/hero-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { db } from "@/lib/database";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  category: z.string().min(1, "Please select a category"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(20, "Message must be at least 20 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

const categories = [
  { value: "general", label: "General Inquiry" },
  { value: "press", label: "Press / Media" },
  { value: "booking", label: "Artist Booking" },
  { value: "demo", label: "Demo Submission" },
  { value: "partnership", label: "Partnership / Sponsorship" },
  { value: "support", label: "Support" },
];

export default function ContactPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: siteSettings, isLoading: isSiteSettingsLoading } = useQuery({
    queryKey: ["siteSettings"],
    queryFn: () => db.siteSettings.get(),
  });

  const siteSettingsForDisplay = useMemo(() => {
    if (siteSettings) return siteSettings;
    if (isSiteSettingsLoading) return null;
    return {
      contactEmail: "hello@grouptherapyeg.com",
      contactEmailSubtext: "",
      contactPhone: "",
      contactPhoneSubtext: "",
      contactAddress: "London, United Kingdom",
      contactAddressSubtext: "",
    };
  }, [siteSettings, isSiteSettingsLoading]);

  const contactInfo = useMemo(() => {
    const email = siteSettingsForDisplay?.contactEmail || "";
    const phone = siteSettingsForDisplay?.contactPhone || "";
    const address = siteSettingsForDisplay?.contactAddress || "";

    return [
      {
        icon: Mail,
        title: "Email",
        details: email,
        subtext: siteSettingsForDisplay?.contactEmailSubtext || "",
        href: email ? `mailto:${email}` : undefined,
      },
      {
        icon: MapPin,
        title: "Office",
        details: address,
        subtext: siteSettingsForDisplay?.contactAddressSubtext || "",
        href: address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : undefined,
      },
      {
        icon: Phone,
        title: "Phone",
        details: phone,
        subtext: siteSettingsForDisplay?.contactPhoneSubtext || "",
        href: phone ? `tel:${phone.replace(/\s+/g, "")}` : undefined,
      },
    ].filter((i) => i.details);
  }, [siteSettingsForDisplay]);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      category: "",
      subject: "",
      message: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      return db.contacts.create(data);
    },
    onSuccess: () => {
      toast({
        title: "Message sent!",
        description: "We'll get back to you as soon as possible.",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    submitMutation.mutate(data);
  };

  return (
    <div className="min-h-screen">
      <ConfiguredPageHero
        pageKey="/contact"
        title="Contact Us"
        subtitle="Get in touch with the Group Therapy team"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
              <p className="text-muted-foreground mb-8">
                Whether you have a question about our artists, event promos, or submitting a demo, get in touch.
              </p>
            </motion.div>

            {isSiteSettingsLoading && contactInfo.length === 0 ? (
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Loading contact details...</p>
                </CardContent>
              </Card>
            ) : (
              contactInfo.map((info, index) => (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="flex items-start gap-4 p-4">
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <info.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{info.title}</h3>
                      {info.href ? (
                        <a
                          className="text-sm hover:text-primary transition-colors"
                          href={info.href}
                          target={info.href.startsWith("http") ? "_blank" : undefined}
                          rel={info.href.startsWith("http") ? "bookmark" : undefined}
                        >
                          {info.details}
                        </a>
                      ) : (
                        <p className="text-sm">{info.details}</p>
                      )}
                      {!!info.subtext && (
                        <p className="text-xs text-muted-foreground">{info.subtext}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              ))
            )}

            {/* Demo Submission Note */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Demo Submissions</h3>
                  <p className="text-sm text-muted-foreground">
                    Submitting a demo? Select "Demo Submission" as your category 
                    and include links to your music in the message. We listen to 
                    every submission!
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle>Send us a message</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Your name" 
                                {...field} 
                                data-testid="input-contact-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="your@email.com" 
                                {...field}
                                data-testid="input-contact-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-contact-category">
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="What is this about?" 
                              {...field}
                              data-testid="input-contact-subject"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Tell us more about your inquiry..." 
                              className="min-h-[150px]"
                              {...field}
                              data-testid="textarea-contact-message"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Honeypot field for spam protection */}
                    <div className="hidden">
                      <Input 
                        name="website" 
                        tabIndex={-1} 
                        autoComplete="off"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full sm:w-auto"
                      disabled={submitMutation.isPending}
                      data-testid="button-contact-submit"
                    >
                      {submitMutation.isPending ? (
                        <>Sending...</>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
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
