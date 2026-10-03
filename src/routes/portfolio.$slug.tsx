import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, Check, Film, Quote, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { work } from "@/content/site";
import { api, getMediaUrl } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/portfolio/$slug")({
  head: ({ params }) => ({
    meta: [
      {
        title: `${(params.slug || "").replace(/-/g, " ").toUpperCase()} — Mirabilis Visual Production`,
      },
      {
        name: "description",
        content: "Visual production case study and cinematic narrative by Mirabilis studio.",
      },
    ],
  }),
  component: PortfolioDetailPage,
});

export function PortfolioDetailPage() {
  const params = Route.useParams();
  const slug = params?.slug || "";

  // 1. Fetch live project from database public endpoint
  const { data: dbProject, isLoading } = useQuery({
    queryKey: ["project-public", slug],
    queryFn: async () => {
      if (!slug) return null;
      try {
        const res = await api.get<any>(`/public/projects/${slug}`);
        return res;
      } catch {
        // Fallback check against older direct endpoint if any
        try {
          return await api.get<any>(`/projects/${slug}`);
        } catch {
          return null;
        }
      }
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });

  // 2. Fetch all projects to show "More Projects" at bottom
  const { data: allProjectsData } = useQuery({
    queryKey: ["public-projects-list"],
    queryFn: async () => {
      try {
        const res = await api.get<any>("/public/projects?page_size=20");
        return res?.items || [];
      } catch {
        return work;
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  // 3. Fallback to static mock content if not in db
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
  const category = p.category || (Array.isArray(p.categories) && p.categories[0]) || "Portfolio";
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

  // Find other projects excluding current
  const allList = allProjectsData && allProjectsData.length > 0 ? allProjectsData : work;
  const otherProjects = allList.filter((item: any) => (item.slug || item.id) !== slug).slice(0, 3);

  return (
    <>
      <SiteHeader />
      <main id="main" className="w-full min-h-screen bg-background">
        {/* Hero Banner Header */}
        <section className="relative w-full border-b pb-16 pt-36 sm:pt-44 bg-gradient-to-b from-card/60 via-background to-background overflow-hidden">
          <div className="absolute top-1/4 left-1/3 w-96 h-64 bg-primary/10 blur-[130px] pointer-events-none" />

          <div className="shell relative z-10">
            <Link
              to="/portfolio"
              className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
              All Projects
            </Link>

            <div className="mt-8 flex flex-wrap items-center gap-2.5">
              <span className="rounded-full bg-primary/20 border border-primary/40 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                {category}
              </span>
              {client && (
                <Badge variant="outline" className="text-xs uppercase tracking-wider px-3 py-1">
                  {client}
                </Badge>
              )}
              {location && (
                <Badge variant="secondary" className="text-xs uppercase tracking-wider px-3 py-1">
                  {location}
                </Badge>
              )}
              {date && (
                <Badge variant="outline" className="text-xs px-3 py-1">
                  {date}
                </Badge>
              )}
            </div>

            <h1 className="mt-6 max-w-4xl font-display text-4xl sm:text-6xl lg:text-7xl font-light text-glow leading-[1.08]">
              {title}
            </h1>

            {shortDesc && (
              <p className="mt-6 max-w-2xl text-lg sm:text-xl leading-relaxed text-muted-foreground font-light">
                {shortDesc}
              </p>
            )}

            {servicesList.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {servicesList.map((srv) => (
                  <span
                    key={srv}
                    className="rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-primary"
                  >
                    {srv}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Full Viewport Hero Cover Photo */}
        <section className="w-full py-12 sm:py-16">
          <div className="shell">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/60 shadow-2xl bg-black">
              <img src={coverImage} alt={title} className="size-full object-cover" />
            </div>
          </div>
        </section>

        {/* Narrative Description & Project Story */}
        {fullDesc && (
          <section className="w-full border-t section-padding">
            <div className="shell grid gap-14 lg:grid-cols-[1.2fr_0.8fr] lg:gap-20">
              <div>
                <p className="eyebrow text-primary">THE STORY</p>
                <h2 className="mt-4 font-display text-3xl sm:text-4xl font-light">
                  Architectural & Visual Narrative
                </h2>
                <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground font-light">
                  {fullDesc.split("\n\n").map((para: string, i: number) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>

              {/* Structured Sidebar Details */}
              <div className="space-y-6 rounded-2xl border border-border/70 bg-card/40 p-8 shadow-xl">
                <p className="eyebrow text-primary">Project Overview</p>
                <dl className="space-y-4 text-sm">
                  {category && (
                    <div className="border-b border-border/40 pb-3">
                      <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                        Category
                      </dt>
                      <dd className="mt-1 font-medium text-foreground">{category}</dd>
                    </div>
                  )}
                  {client && (
                    <div className="border-b border-border/40 pb-3">
                      <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                        Client
                      </dt>
                      <dd className="mt-1 font-medium text-foreground">{client}</dd>
                    </div>
                  )}
                  {projectDetails.industry && (
                    <div className="border-b border-border/40 pb-3">
                      <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                        Industry
                      </dt>
                      <dd className="mt-1 font-medium text-foreground">
                        {projectDetails.industry}
                      </dd>
                    </div>
                  )}
                  {projectDetails.duration && (
                    <div className="border-b border-border/40 pb-3">
                      <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                        Shoot Duration
                      </dt>
                      <dd className="mt-1 font-medium text-foreground">
                        {projectDetails.duration}
                      </dd>
                    </div>
                  )}
                  {projectDetails.teamSize && (
                    <div className="border-b border-border/40 pb-3">
                      <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                        Crew Size
                      </dt>
                      <dd className="mt-1 font-medium text-foreground">
                        {projectDetails.teamSize}
                      </dd>
                    </div>
                  )}
                  {projectDetails.deliverables && (
                    <div className="border-b border-border/40 pb-3">
                      <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                        Deliverables
                      </dt>
                      <dd className="mt-1 font-medium text-foreground">
                        {projectDetails.deliverables}
                      </dd>
                    </div>
                  )}
                  {projectDetails.productionType && (
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                        Production Type
                      </dt>
                      <dd className="mt-1 font-medium text-foreground">
                        {projectDetails.productionType}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </section>
        )}

        {/* Project Multi-Photo Visual Gallery */}
        {galleryItems.length > 0 && (
          <section className="w-full border-t section-padding bg-card/20">
            <div className="shell">
              <p className="eyebrow text-primary">VISUAL GALLERY</p>
              <h2 className="mt-4 font-display text-3xl sm:text-5xl font-light">
                Frames & Perspectives.
              </h2>
              <p className="mt-3 text-muted-foreground max-w-xl text-sm font-light">
                Captured during peak golden-hour atmosphere and after-dark illumination.
              </p>

              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                          <p className="text-xs text-muted-foreground italic font-light">
                            {caption}
                          </p>
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
                  <p className="eyebrow text-primary">CREATIVE DIRECTION</p>
                  <h2 className="mt-4 font-display text-3xl sm:text-4xl font-light">
                    Visual Language & Lighting Concept
                  </h2>
                  <p className="mt-6 text-base sm:text-lg leading-relaxed text-muted-foreground font-light">
                    {creativeDir}
                  </p>
                </div>
              )}

              {keyFeatures.length > 0 && (
                <div>
                  <p className="eyebrow text-primary">HIGHLIGHTS</p>
                  <h2 className="mt-4 font-display text-3xl sm:text-4xl font-light">
                    Key Production Highlights
                  </h2>
                  <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {keyFeatures.map((kf: any, i: number) => (
                      <div
                        key={kf.id || i}
                        className="rounded-2xl border border-border/60 bg-card/60 p-8 shadow-md"
                      >
                        <Sparkles className="size-6 text-primary mb-4" />
                        <h3 className="font-display text-2xl font-normal">{kf.title}</h3>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground font-light">
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

        {/* Video Reel Section */}
        {video?.url && (
          <section className="w-full border-t section-padding bg-black/60">
            <div className="shell">
              <p className="eyebrow text-primary">MOTION FILM</p>
              <h2 className="mt-4 font-display text-3xl sm:text-5xl font-light text-foreground">
                Cinematic Reel
              </h2>
              <div className="mt-10 relative aspect-video w-full overflow-hidden rounded-2xl border border-primary/40 shadow-2xl bg-black">
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
            <div className="shell grid gap-10 lg:grid-cols-2">
              {approach && (
                <div className="rounded-2xl border border-border/60 bg-card/30 p-10">
                  <p className="eyebrow text-primary">APPROACH</p>
                  <h3 className="mt-4 font-display text-3xl font-light">Execution Strategy</h3>
                  <p className="mt-5 text-base leading-relaxed text-muted-foreground font-light">
                    {approach}
                  </p>
                </div>
              )}

              {outcome && (
                <div className="rounded-2xl border border-primary/40 bg-primary/5 p-10">
                  <p className="eyebrow text-primary">OUTCOME</p>
                  <h3 className="mt-4 font-display text-3xl font-light">Results & Impact</h3>
                  <p className="mt-5 text-base leading-relaxed text-muted-foreground font-light">
                    {outcome}
                  </p>
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
              <blockquote className="font-display text-2xl sm:text-4xl italic text-foreground leading-relaxed font-light">
                “{testimonial.quote}”
              </blockquote>
              {testimonial.clientName && (
                <p className="mt-8 font-semibold uppercase tracking-[0.24em] text-primary text-xs sm:text-sm">
                  {testimonial.clientName}
                  {testimonial.designation ? ` — ${testimonial.designation}` : ""}
                </p>
              )}
            </div>
          </section>
        )}

        {/* More Projects Section */}
        {otherProjects.length > 0 && (
          <section className="w-full border-t section-padding bg-card/10">
            <div className="shell">
              <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
                <div>
                  <p className="eyebrow text-primary">MORE WORK</p>
                  <h2 className="mt-3 font-display text-3xl sm:text-4xl font-light">
                    Explore Other Case Studies.
                  </h2>
                </div>
                <Link
                  to="/portfolio"
                  className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary hover:text-foreground transition-colors"
                >
                  All Projects
                  <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5" />
                </Link>
              </div>

              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {otherProjects.map((item: any) => {
                  const s = item.slug || item.id;
                  const cov = getMediaUrl(
                    item.cardImage || item.coverImage || item.image || "/placeholder.svg",
                  );
                  return (
                    <Link
                      key={s}
                      to="/portfolio/$slug"
                      params={{ slug: s }}
                      className="group rounded-2xl border border-border/60 bg-card/40 overflow-hidden hover:border-primary/60 transition-all"
                    >
                      <div className="aspect-16/10 overflow-hidden bg-black/60">
                        <img
                          src={cov}
                          alt={item.title || "Project"}
                          className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-6 space-y-2">
                        <p className="text-[0.65rem] uppercase tracking-widest text-primary font-semibold">
                          {item.category || "Portfolio"}
                        </p>
                        <h4 className="font-display text-xl font-normal group-hover:text-primary transition-colors">
                          {item.title || item.name}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 font-light">
                          {item.shortDescription || item.blurb}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Contact CTA */}
        <section className="w-full border-t section-padding">
          <div className="shell text-center max-w-2xl mx-auto space-y-6">
            <p className="eyebrow text-primary">START A CONVERSATION</p>
            <h2 className="font-display text-3xl sm:text-5xl font-light">
              Have a similar space or campaign in mind?
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground font-light leading-relaxed">
              Tell us about your space, timeline, and vision. We will share shoot availability and
              tailored estimates within 24 hours.
            </p>
            <div className="pt-4">
              <Link
                to="/contact"
                className="inline-block rounded-full bg-primary px-10 py-4 text-xs font-semibold uppercase tracking-[0.26em] text-primary-foreground shadow-[0_0_25px_rgba(225,29,72,0.4)] transition-all hover:bg-primary/90 hover:scale-[1.02]"
              >
                Enquire For Your Space
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
