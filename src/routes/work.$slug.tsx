import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Check, Film, Quote, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { work } from "@/content/site";
import { api, getMediaUrl } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/work/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — Mirabilis Visual Production` },
      { name: "description", content: "Visual production case study by Mirabilis studio." },
    ],
  }),
  component: WorkDetailPage,
});

function WorkDetailPage() {
  const params = Route.useParams();
  const slug = params?.slug || "";

  // 1. Fetch live project from database if available
  const { data: dbProject } = useQuery({
    queryKey: ["project-public", slug],
    queryFn: async () => {
      if (!slug) return null;
      try {
        const res = await api.get<any>(`/projects/${slug}`);
        return res;
      } catch {
        return null;
      }
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });

  // 2. Fallback to static mock content if not in db
  const staticProject = work.find((w) => w.slug === slug);

  const p = dbProject ||
    staticProject || {
      title: slug.replace(/-/g, " ").toUpperCase(),
      slug,
      shortDescription: "A visual narrative campaign crafted by Mirabilis.",
      description:
        "Every space holds two distinct stories: one in the warm glow of golden hour, and another in the quiet atmosphere after dark.",
      coverImage: "/placeholder.svg",
      clientRef: "Mirabilis Client",
      location: "Nagpur, MH",
      projectDate: "2026",
      services: ["Photography", "Cinematography"],
      gallery: [],
      keyFeatures: [],
    };

  const title = p.title || p.name || slug;
  const coverImage = getMediaUrl(p.coverImage || p.cardImage || p.image || "/placeholder.svg");
  const shortDesc = p.shortDescription || p.blurb || "";
  const fullDesc = p.description || p.body || p.fullStory || "";
  const creativeDir = p.creativeDirection || "";
  const approach = p.approach || "";
  const outcome = p.outcome || "";
  const client = p.clientRef || p.client || "";
  const location = p.location || "Nagpur, India";
  const date = p.projectDate || p.date || "";
  const servicesList: string[] = Array.isArray(p.services)
    ? p.services
    : Array.isArray(p.servicesUsed)
      ? p.servicesUsed
      : [];

  const galleryItems = Array.isArray(p.gallery) ? p.gallery : [];
  const keyFeatures = Array.isArray(p.keyFeatures) ? p.keyFeatures : [];
  const projectDetails = p.projectDetails || {};
  const testimonial = p.testimonial || {};
  const video = p.video || {};

  return (
    <>
      <SiteHeader />
      <main id="main" className="w-full min-h-screen">
        {/* Hero Banner Header */}
        <section className="w-full border-b pb-16 pt-40 bg-gradient-to-b from-card/60 via-background to-background">
          <div className="shell">
            <Link
              to="/work"
              className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
              All Projects
            </Link>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {client && (
                <Badge variant="outline" className="text-xs uppercase tracking-wider">
                  {client}
                </Badge>
              )}
              {location && (
                <Badge variant="secondary" className="text-xs uppercase tracking-wider">
                  {location}
                </Badge>
              )}
              {date && (
                <Badge variant="outline" className="text-xs">
                  {date}
                </Badge>
              )}
            </div>

            <h1 className="mt-6 max-w-4xl font-display text-hero-fluid text-glow">{title}</h1>

            {shortDesc && (
              <p className="mt-6 max-w-2xl text-xl leading-relaxed text-muted-foreground font-light">
                {shortDesc}
              </p>
            )}

            {servicesList.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {servicesList.map((srv) => (
                  <span
                    key={srv}
                    className="rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-primary"
                  >
                    {srv}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Full Viewport Hero Cover Photo */}
        <section className="w-full py-12">
          <div className="shell">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/60 shadow-2xl">
              <img src={coverImage} alt={title} className="size-full object-cover" />
            </div>
          </div>
        </section>

        {/* Narrative Description & Project Story */}
        {fullDesc && (
          <section className="w-full border-t section-padding">
            <div className="shell grid gap-14 lg:grid-cols-[1.2fr_0.8fr] lg:gap-20">
              <div>
                <p className="eyebrow">The Story</p>
                <h2 className="mt-4 font-display text-3xl sm:text-4xl">
                  Architectural & Visual Narrative
                </h2>
                <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
                  {fullDesc.split("\n\n").map((para: string, i: number) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>

              {/* Structured Sidebar Details */}
              <div className="space-y-6 rounded-2xl border border-border/70 bg-card/40 p-8">
                <p className="eyebrow text-primary">Project Overview</p>
                <dl className="space-y-4 text-sm">
                  {projectDetails.industry && (
                    <div className="border-b border-border/40 pb-3">
                      <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                        Industry
                      </dt>
                      <dd className="mt-1 font-medium">{projectDetails.industry}</dd>
                    </div>
                  )}
                  {projectDetails.duration && (
                    <div className="border-b border-border/40 pb-3">
                      <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                        Duration
                      </dt>
                      <dd className="mt-1 font-medium">{projectDetails.duration}</dd>
                    </div>
                  )}
                  {projectDetails.teamSize && (
                    <div className="border-b border-border/40 pb-3">
                      <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                        Crew Size
                      </dt>
                      <dd className="mt-1 font-medium">{projectDetails.teamSize}</dd>
                    </div>
                  )}
                  {projectDetails.deliverables && (
                    <div className="border-b border-border/40 pb-3">
                      <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                        Deliverables
                      </dt>
                      <dd className="mt-1 font-medium">{projectDetails.deliverables}</dd>
                    </div>
                  )}
                  {projectDetails.productionType && (
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                        Production Type
                      </dt>
                      <dd className="mt-1 font-medium">{projectDetails.productionType}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </section>
        )}

        {/* Project Multi-Photo Visual Gallery */}
        {galleryItems.length > 0 && (
          <section className="w-full border-t section-padding bg-card/30">
            <div className="shell">
              <p className="eyebrow">Visual Gallery</p>
              <h2 className="mt-4 font-display text-heading-fluid">Frames & Perspectives.</h2>

              <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {galleryItems.map((item: any, idx: number) => {
                  const url = getMediaUrl(
                    typeof item === "string" ? item : item.imageUrl || item.url,
                  );
                  const caption = typeof item === "object" ? item.caption : "";
                  const alt = typeof item === "object" ? item.altText : `Gallery frame ${idx + 1}`;
                  return (
                    <div
                      key={idx}
                      className="group relative overflow-hidden rounded-2xl border border-border/60 shadow-xl bg-background"
                    >
                      <img
                        src={url}
                        alt={alt || title}
                        loading="lazy"
                        className="aspect-4/3 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      {caption && (
                        <div className="p-4 border-t bg-background/95">
                          <p className="text-xs text-muted-foreground italic">{caption}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Creative Direction & Key Features */}
        {(creativeDir || keyFeatures.length > 0) && (
          <section className="w-full border-t section-padding">
            <div className="shell space-y-16">
              {creativeDir && (
                <div className="max-w-4xl">
                  <p className="eyebrow">Creative Direction</p>
                  <h2 className="mt-4 font-display text-3xl sm:text-4xl">
                    Visual Language & Concept
                  </h2>
                  <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                    {creativeDir}
                  </p>
                </div>
              )}

              {keyFeatures.length > 0 && (
                <div>
                  <p className="eyebrow">Highlights</p>
                  <h2 className="mt-4 font-display text-3xl sm:text-4xl">
                    Key Production Features
                  </h2>
                  <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {keyFeatures.map((kf: any, i: number) => (
                      <div
                        key={kf.id || i}
                        className="rounded-2xl border border-border/60 bg-card/60 p-8 shadow-md"
                      >
                        <Sparkles className="size-6 text-primary mb-4" />
                        <h3 className="font-display text-2xl">{kf.title}</h3>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                          {kf.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Video Stream Section */}
        {video?.url && (
          <section className="w-full border-t section-padding bg-black/40">
            <div className="shell">
              <p className="eyebrow">Motion Film</p>
              <h2 className="mt-4 font-display text-heading-fluid">Cinematic Reel</h2>
              <div className="mt-10 relative aspect-video w-full overflow-hidden rounded-2xl border border-primary/40 shadow-2xl">
                {video.url.includes("youtube") || video.url.includes("vimeo") ? (
                  <iframe
                    src={video.url}
                    title="Project Video"
                    className="size-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={video.url}
                    poster={video.posterImage || coverImage}
                    controls
                    className="size-full object-cover"
                  />
                )}
              </div>
            </div>
          </section>
        )}

        {/* Our Approach & Outcome */}
        {(approach || outcome) && (
          <section className="w-full border-t section-padding">
            <div className="shell grid gap-14 lg:grid-cols-2">
              {approach && (
                <div className="rounded-2xl border border-border/60 bg-card/30 p-10">
                  <p className="eyebrow">Approach</p>
                  <h3 className="mt-4 font-display text-3xl">Execution Strategy</h3>
                  <p className="mt-5 text-base leading-relaxed text-muted-foreground">{approach}</p>
                </div>
              )}

              {outcome && (
                <div className="rounded-2xl border border-primary/40 bg-primary/5 p-10">
                  <p className="eyebrow text-primary">Outcome</p>
                  <h3 className="mt-4 font-display text-3xl">Results & Impact</h3>
                  <p className="mt-5 text-base leading-relaxed text-muted-foreground">{outcome}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Client Testimonial */}
        {testimonial?.quote && (
          <section className="w-full border-t section-padding gradient-afterglow">
            <div className="shell text-center max-w-4xl mx-auto">
              <Quote className="size-10 text-primary mx-auto mb-6 opacity-80" />
              <blockquote className="font-display text-3xl sm:text-4xl italic text-foreground leading-relaxed">
                “{testimonial.quote}”
              </blockquote>
              {testimonial.clientName && (
                <p className="mt-8 font-semibold uppercase tracking-[0.24em] text-primary text-sm">
                  {testimonial.clientName}{" "}
                  {testimonial.designation ? `— ${testimonial.designation}` : ""}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Contact CTA */}
        <section className="w-full border-t section-padding">
          <div className="shell text-center">
            <p className="eyebrow">Start a Conversation</p>
            <h2 className="mt-6 font-display text-heading-fluid max-w-3xl mx-auto">
              Have a similar space or campaign in mind?
            </h2>
            <Link
              to="/contact"
              className="mt-10 inline-block rounded-full bg-primary px-10 py-4 text-xs font-semibold uppercase tracking-[0.26em] text-primary-foreground shadow-[0_0_25px_rgba(225,29,72,0.4)] transition-all hover:bg-primary/90"
            >
              Enquire For Your Space
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
