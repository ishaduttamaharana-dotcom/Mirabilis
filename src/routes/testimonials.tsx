import { createFileRoute } from "@tanstack/react-router";
import { usePublicCollection } from "@/hooks/use-public-content";
import { Star, Quote } from "lucide-react";

export const Route = createFileRoute("/testimonials")({
  component: TestimonialsPage,
});

function TestimonialsPage() {
  const { items: testimonials, isLoading } = usePublicCollection<any>("testimonials", [
    {
      id: "test-1",
      quote:
        "Mirabilis captured our luxury retreat during golden hour in a way that tripled our direct booking conversions within 60 days.",
      author: "Vikramaditya Singhania",
      role: "Managing Director",
      venue: "Hillside Retreats & Spas",
      rating: 5,
    },
    {
      id: "test-2",
      quote:
        "The contrast between their daytime architectural passes and twilight lighting turns every property photo into a piece of fine art.",
      author: "Radhika Kapoor",
      role: "Chief Architect",
      venue: "Zenith Living Urban Towers",
      rating: 5,
    },
    {
      id: "test-3",
      quote:
        "Working with Ishadutta and team on our brand launch film was seamless. The 700MB 4K Master delivered on time was breathtaking.",
      author: "Devendra Patel",
      role: "Founder",
      venue: "Copper & Charcoal Hospitality Group",
      rating: 5,
    },
  ]);

  return (
    <main className="min-h-screen bg-background pt-32 pb-24">
      <div className="shell space-y-12">
        <div className="max-w-3xl space-y-4">
          <p className="eyebrow text-primary">CLIENT FEEDBACK</p>
          <h1 className="font-display text-4xl font-light text-foreground sm:text-5xl">
            Testimonials & Reviews
          </h1>
          <p className="text-muted-foreground text-lg font-light">
            Endorsements from resort owners, lead architects, real estate developers, and
            hospitality groups.
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading client reviews…</p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((item: any) => (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-7 shadow-lg transition-all duration-500 hover:border-primary/80 hover:shadow-2xl"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-amber-400">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: item.rating || 5 }).map((_, i) => (
                        <Star key={i} className="size-4 fill-current" />
                      ))}
                    </div>
                    <Quote className="size-8 text-primary/30" />
                  </div>

                  <p className="text-sm text-foreground/90 leading-relaxed font-light italic">
                    “{item.quote || item.content}”
                  </p>
                </div>

                <div className="pt-6 border-t border-border/40">
                  <p className="font-display text-lg font-medium text-foreground">
                    {item.author || item.name}
                  </p>
                  <p className="text-xs text-primary font-medium">
                    {item.role || item.designation}
                  </p>
                  {item.venue && (
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      {item.venue}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
