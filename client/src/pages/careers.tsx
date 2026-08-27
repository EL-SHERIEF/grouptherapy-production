import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, MapPin, Clock, ArrowRight, Upload, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ConfiguredPageHero } from "@/components/hero-section";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { queryFunctions } from "@/lib/queryClient";
import { db, type Career } from "@/lib/database";
import { useToast } from "@/hooks/use-toast";
import { isCloudinaryConfigured, uploadToCloudinaryWithProgress } from "@/lib/cloudinary";

const careerApplicationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  linkedinUrl: z.string().optional(),
  portfolioUrl: z.string().optional(),
  coverLetter: z.string().optional(),
});

type CareerApplicationFormData = z.infer<typeof careerApplicationSchema>;

export default function CareersPage() {
  const { toast } = useToast();

  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeUploadProgress, setResumeUploadProgress] = useState(0);

  const { data: careers = [], isLoading } = useQuery<Career[]>({
    queryKey: ["careersPublished"],
    queryFn: queryFunctions.careersPublished,
  });

  const form = useForm<CareerApplicationFormData>({
    resolver: zodResolver(careerApplicationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      linkedinUrl: "",
      portfolioUrl: "",
      coverLetter: "",
    },
  });

  const openApply = (career: Career) => {
    setSelectedCareer(career);
    setResumeFile(null);
    form.reset();
    setApplyOpen(true);
  };

  const onSubmit = async (data: CareerApplicationFormData) => {
    if (!selectedCareer) return;
    setIsSubmitting(true);
    setResumeUploadProgress(0);
    try {
      let resumeUrl: string | undefined;

      if (resumeFile) {
        if (!isCloudinaryConfigured()) {
          throw new Error("Resume upload is not configured");
        }
        const extension = resumeFile.name.split(".").pop()?.toLowerCase();
        if (extension && !["pdf", "doc", "docx"].includes(extension)) {
          throw new Error("Please upload a PDF or Word document");
        }
        resumeUrl = await uploadToCloudinaryWithProgress(
          resumeFile,
          {
            folder: "resumes",
            resourceType: "auto",
          },
          (p) => setResumeUploadProgress(p)
        );
      }

      await db.careerApplications.create({
        careerId: selectedCareer.id,
        name: data.name,
        email: data.email,
        phone: data.phone?.trim() ? data.phone.trim() : undefined,
        linkedinUrl: data.linkedinUrl?.trim() ? data.linkedinUrl.trim() : undefined,
        portfolioUrl: data.portfolioUrl?.trim() ? data.portfolioUrl.trim() : undefined,
        coverLetter: data.coverLetter?.trim() ? data.coverLetter.trim() : undefined,
        resumeUrl,
        status: "new",
      });

      toast({
        title: "Application submitted",
        description: "We’ve received your application and will get back to you soon.",
      });

      setApplyOpen(false);
      setSelectedCareer(null);
      setResumeFile(null);
      form.reset();
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to submit application",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const departments = [...new Set(careers.map((c) => c.department))];
  const resumeDisplayName = useMemo(() => {
    if (!resumeFile) return "No file selected";
    const maxLen = 38;
    if (resumeFile.name.length <= maxLen) return resumeFile.name;
    const ext = resumeFile.name.split(".").pop();
    const base = resumeFile.name.replace(new RegExp(`\\.${ext}$`), "");
    return `${base.slice(0, 28)}…${ext ? `.${ext}` : ""}`;
  }, [resumeFile]);

  return (
    <div className="min-h-screen bg-background">
      <ConfiguredPageHero
        pageKey="/careers"
        title="Join Our Team"
        subtitle="Be part of something special. We're looking for passionate people to help shape the future of electronic music."
      />

      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : careers.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No Open Positions</h2>
              <p className="text-muted-foreground">
                We don't have any open positions at the moment, but check back soon!
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {departments.map((department) => (
                <div key={department}>
                  <h2 className="text-xl font-semibold mb-4">{department}</h2>
                  <div className="space-y-4">
                    {careers
                      .filter((c) => c.department === department)
                      .map((career, index) => (
                        <motion.div
                          key={career.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card className="hover:shadow-lg transition-shadow">
                            <CardContent className="p-6">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold">{career.title}</h3>
                                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-4 w-4" />
                                      {career.location}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      {career.type}
                                    </span>
                                  </div>
                                  {career.salary && (
                                    <Badge variant="secondary" className="mt-2">
                                      {career.salary}
                                    </Badge>
                                  )}
                                </div>
                                <Button className="w-full md:w-auto" onClick={() => openApply(career)}>
                                  Apply Now <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                              </div>
                              {career.description && (
                                <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
                                  {career.description}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-12 md:py-16 bg-muted/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Why Work With Us?</h2>
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎵</span>
              </div>
              <h3 className="font-semibold mb-2">Passion for Music</h3>
              <p className="text-sm text-muted-foreground">
                Work with talented artists and be part of the electronic music scene.
              </p>
            </div>
            <div className="p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌍</span>
              </div>
              <h3 className="font-semibold mb-2">Global Impact</h3>
              <p className="text-sm text-muted-foreground">
                Our music reaches millions of listeners worldwide.
              </p>
            </div>
            <div className="p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="font-semibold mb-2">Growth & Learning</h3>
              <p className="text-sm text-muted-foreground">
                Continuous opportunities to grow and develop your skills.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Dialog open={applyOpen} onOpenChange={(open) => {
        setApplyOpen(open);
        if (!open) {
          setSelectedCareer(null);
          setResumeFile(null);
          setResumeUploadProgress(0);
          form.reset();
        }
      }}>
        <DialogContent className="sm:max-w-2xl sm:max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>
              Apply{selectedCareer?.title ? `: ${selectedCareer.title}` : ""}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Please share a few details. If you attach a resume, keep it as PDF/DOC/DOCX.
                </p>
                {selectedCareer?.location || selectedCareer?.type ? (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {selectedCareer?.department ? (
                      <Badge variant="secondary">{selectedCareer.department}</Badge>
                    ) : null}
                    {selectedCareer?.location ? (
                      <Badge variant="outline">{selectedCareer.location}</Badge>
                    ) : null}
                    {selectedCareer?.type ? (
                      <Badge variant="outline" className="capitalize">{selectedCareer.type}</Badge>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <Separator />

              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} />
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
                        <Input type="email" placeholder="you@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 ..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <FormLabel>Resume (optional)</FormLabel>
                  <div className="rounded-md border bg-background p-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-9 w-9 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                        {resumeFile ? <FileText className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{resumeDisplayName}</p>
                        <p className="text-xs text-muted-foreground">PDF, DOC, DOCX. Optional.</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isSubmitting}
                          onClick={() => {
                            const el = document.getElementById("career-resume-input") as HTMLInputElement | null;
                            el?.click();
                          }}
                        >
                          {resumeFile ? "Replace" : "Upload"}
                        </Button>
                        {resumeFile ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isSubmitting}
                            onClick={() => {
                              setResumeFile(null);
                              setResumeUploadProgress(0);
                              const el = document.getElementById("career-resume-input") as HTMLInputElement | null;
                              if (el) el.value = "";
                            }}
                          >
                            Remove
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    <input
                      id="career-resume-input"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        setResumeFile(f);
                        setResumeUploadProgress(0);
                      }}
                    />

                    {isSubmitting && resumeFile ? (
                      <div className="pt-3">
                        <Progress value={resumeUploadProgress} />
                        <p className="mt-1 text-xs text-muted-foreground">Uploading resume…</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="linkedinUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn URL (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://linkedin.com/in/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="portfolioUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Portfolio URL (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="coverLetter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover letter (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-[110px]"
                        placeholder="Tell us why you’re a great fit..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setApplyOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting…" : "Submit application"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
