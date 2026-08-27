import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Loader2, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/database";

export function NewsletterSection({
  title = "Join the community",
  description = "Get exclusive releases, early event access, and behind-the-scenes content.",
  buttonText = "Subscribe",
  disclaimer = "No spam. Unsubscribe anytime.",
}: {
  title?: string;
  description?: string;
  buttonText?: string;
  disclaimer?: string;
} = {}) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

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
      await db.newsletterSubscribers.subscribe(email, undefined, 'newsletter_section');
      setIsSubscribed(true);
      toast({
        title: "Welcome aboard",
        description: "You're now part of the community.",
      });
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
    <section className="py-24 md:py-32 relative overflow-hidden bg-muted/30">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
      </div>
      
      <div className="max-w-3xl mx-auto px-6 md:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-8">
            <Mail className="w-6 h-6" />
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-4">
            {(() => {
              const parts = (title || "").trim().split(/\s+/).filter(Boolean);
              if (parts.length <= 1) return <span className="gradient-text">{title}</span>;
              const last = parts[parts.length - 1];
              const leading = parts.slice(0, -1).join(" ");
              return (
                <>
                  {leading} <span className="gradient-text">{last}</span>
                </>
              );
            })()}
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
            {description}
          </p>

          {isSubscribed ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-lg font-medium">You're on the list</p>
              <p className="text-muted-foreground">Check your inbox for a welcome message.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                id="newsletter-email-section"
                name="newsletterEmailSection"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="flex-1 h-12 min-h-12 px-5 rounded-full bg-background border-border/50"
                autoComplete="email"
                data-testid="input-newsletter-email-section"
              />
              <Button 
                type="submit" 
                disabled={isLoading}
                className="h-12 px-8 rounded-full"
                data-testid="button-newsletter-submit-section"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    {buttonText}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          )}
          
          <p className="text-xs text-muted-foreground mt-6">
            {disclaimer}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
