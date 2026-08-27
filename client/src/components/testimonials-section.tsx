import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { resolveMediaUrl } from "../lib/media";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { queryFunctions } from "@/lib/queryClient";
import type { Testimonial } from "@/lib/database";

const fallbackTestimonials = [
  {
    id: "1",
    name: "Alex Rivera",
    role: "DJ & Producer",
    content: "GroupTherapy has been instrumental in launching my career. Their support for underground artists is unmatched.",
    rating: 5,
  },
  {
    id: "2",
    name: "Sarah Chen",
    role: "Music Journalist",
    content: "The quality of releases from GroupTherapy consistently sets the bar for electronic music.",
    rating: 5,
  },
  {
    id: "3",
    name: "Marcus Johnson",
    role: "Club Promoter",
    content: "Every event with GroupTherapy artists is a guaranteed sell-out. Their roster brings incredible energy.",
    rating: 5,
  },
];

export function TestimonialsSection() {
  const { data: dbTestimonials = [] } = useQuery<Testimonial[]>({
    queryKey: ["testimonialsPublished"],
    queryFn: queryFunctions.testimonialsPublished,
  });

  const testimonials = dbTestimonials.length > 0 ? dbTestimonials : fallbackTestimonials;

  const getAvatarUrl = (testimonial: Testimonial | (typeof fallbackTestimonials)[number]) => {
    if ("avatarUrl" in testimonial && typeof testimonial.avatarUrl === "string") {
      return testimonial.avatarUrl;
    }
    return undefined;
  };

  return (
    <section className="py-24 md:py-32  shadow-sm">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-4">
            What people <span className="gradient-text">say</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Hear from artists, fans, and industry professionals.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.slice(0, 3).map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <div className="h-full bg-card rounded-2xl p-6 border border-border/50 hover:border-border transition-colors">
                <div className="flex items-center gap-1 mb-4">
                  {testimonial.rating && [...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>

                <p className="text-foreground leading-relaxed mb-6">
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={(testimonial as any).avatarUrl ? resolveMediaUrl((testimonial as any).avatarUrl, "thumb") : undefined} alt={testimonial.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {testimonial.name.split(' ').map((n) => n.charAt(0)).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
