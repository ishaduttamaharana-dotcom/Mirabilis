import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { ArrowUpRight, Filter, Search, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { work } from "@/content/site";
import { usePublicCollection } from "@/hooks/use-public-content";
import { getMediaUrl } from "@/lib/api-client";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — Mirabilis Visual Production" },
      {
        name: "description",
        content:
          "Selected resort, architectural, hospitality, and brand-film projects by Mirabilis: golden-hour and after-dark photography, cinematography and 360° tours.",
      },
      { property: "og:title", content: "Portfolio — Mirabilis Visual Production" },
      {
        property: "og:description",
        content:
          "Selected visual productions, architectural shoots, and hospitality campaigns by Mirabilis studio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PortfolioPage,
});

export function PortfolioPage() {
  const { items: liveProjects, isLoading } = usePublicCollection<any>("projects", work);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Extract unique categories from projects
  const categories = useMemo(() => {
    const set = new Set<string>();
    liveProjects.forEach((p: any) => {
      if (p.category) set.add(p.category);
      if (Array.isArray(p.categories)) {
        p.categories.forEach((c: string) => c && set.add(c));
      }
    });
    return ["All", ...Array.from(set)];
  }, [liveProjects]);

  // Filter projects by category and search term
  const filteredProjects = useMemo(() => {
    return liveProjects.filter((item: any) => {
      const title = (item.title || item.name || "").toLowerCase();
      const client = (item.clientRef || item.client || "").toLowerCase();
      const loc = (item.location || "").toLowerCase();
      const desc = (item.shortDescription || item.blurb || item.description || "").toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !query ||
        title.includes(query) ||
        client.includes(query) ||
        loc.includes(query) ||
        desc.includes(query);

      const matchesCategory =
        activeCategory === "All" ||
        item.category === activeCategory ||
        (Array.isArray(item.categories) && item.categories.includes(activeCategory));

      return matchesSearch && matchesCategory;
    });
  }, [liveProjects, activeCategory, searchQuery]);

  return (
    <>
      <SiteHeader />
      <main id="main" className="w-full min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative w-full border-b pb-16 pt-36 sm:pt-44 overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-primary/5 blur-[120px] pointer-events-none" />

          <div className="shell relative z-10">
            <div className="flex items-center gap-2">
              <span className="h-px w-8 bg-primary/60" />
              <p className="eyebrow text-primary">PORTFOLIO & CASE STUDIES</p>
            </div>
            <h1 className="mt-5 max-w-4xl font-display text-4xl sm:text-6xl lg:text-7xl font-light leading-[1.08] tracking-tight">
              Selected works & <br className="hidden sm:inline" />
              <span className="italic font-normal text-gradient">cinematic narratives.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-muted-foreground font-light">
              A curation of hospitality campaigns, luxury architectural spaces, and cinematic brand
              films captured across golden hour and night passes.
            </p>
          </div>
        </section>

        {/* Filter & Search Bar */}
        <section className="w-full border-b bg-card/20 backdrop-blur-md sticky top-16 z-30 py-4 transition-all">
          <div className="shell flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Category pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full px-4 py-1.5 text-xs uppercase tracking-[0.16em] transition-all whitespace-nowrap ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground font-semibold shadow-[0_0_15px_rgba(225,29,72,0.35)]"
                      : "border border-border/80 bg-background/60 text-muted-foreground hover:text-foreground hover:border-primary/40"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search box */}
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search projects or clients…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 h-9 text-xs rounded-full border-border/70 bg-background/60 focus-visible:ring-primary/40"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Projects Grid */}
        <section className="w-full py-16 sm:py-24">
          <div className="shell">
            {/* Result count */}
            <div className="flex items-center justify-between mb-10 text-xs uppercase tracking-widest text-muted-foreground">
              <span>
                Showing {filteredProjects.length}{" "}
                {filteredProjects.length === 1 ? "Project" : "Projects"}
              </span>
              {activeCategory !== "All" && (
                <span className="text-primary">Filtered by {activeCategory}</span>
              )}
            </div>

            {isLoading ? (
              <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="rounded-2xl border border-border/40 p-4 space-y-4 animate-pulse"
                  >
                    <div className="aspect-16/10 w-full rounded-xl bg-muted/40" />
                    <div className="h-4 w-1/3 bg-muted/40 rounded" />
                    <div className="h-6 w-3/4 bg-muted/40 rounded" />
                    <div className="h-12 w-full bg-muted/20 rounded" />
                  </div>
                ))}
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 p-16 text-center max-w-lg mx-auto">
                <Sparkles className="size-8 text-primary mx-auto mb-4 opacity-70" />
                <h3 className="font-display text-2xl font-normal">No projects found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  No projects match your current search or category filter.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory("All");
                    setSearchQuery("");
                  }}
                  className="mt-6 rounded-full border border-primary/50 px-6 py-2 text-xs uppercase tracking-widest text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProjects.map((item: any) => {
                  const slug = item.slug || item.id;
                  const cover = getMediaUrl(
                    item.cardImage || item.coverImage || item.image || "/placeholder.svg",
                  );
                  const title = item.title || item.name;
                  const cat =
                    item.category ||
                    (Array.isArray(item.categories) && item.categories[0]) ||
                    "Portfolio";
                  const loc = item.location;
                  const client = item.clientRef || item.client;
                  const excerpt = item.shortDescription || item.blurb || item.description;
                  const servicesList = Array.isArray(item.services)
                    ? item.services
                    : Array.isArray(item.servicesUsed)
                      ? item.servicesUsed
                      : [];

                  return (
                    <article
                      key={slug}
                      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-card/40 transition-all duration-500 hover:border-primary/60 hover:shadow-2xl hover:bg-card/70"
                    >
                      <Link
                        to="/portfolio/$slug"
                        params={{ slug }}
                        className="flex flex-col flex-1"
                      >
                        {/* Cover Image Container */}
                        <div className="relative aspect-16/10 w-full overflow-hidden bg-black/60">
                          <img
                            src={cover}
                            alt={item.alt || title || "Project cover"}
                            loading="lazy"
                            className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent opacity-80" />

                          {/* Top Badges */}
                          <div className="absolute top-4 inset-x-4 flex items-center justify-between gap-2 pointer-events-none">
                            <span className="rounded-full bg-background/80 backdrop-blur-md border border-border/60 px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-foreground shadow-sm">
                              {cat}
                            </span>
                            {loc && (
                              <span className="rounded-full bg-background/80 backdrop-blur-md border border-border/60 px-2.5 py-1 text-[0.65rem] font-light text-muted-foreground shadow-sm">
                                {loc}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            {client && (
                              <p className="text-[0.7rem] uppercase tracking-[0.2em] font-semibold text-primary/90">
                                {client}
                              </p>
                            )}
                            <h3 className="font-display text-2xl font-normal leading-tight text-foreground transition-colors group-hover:text-primary">
                              {title}
                            </h3>
                            {excerpt && (
                              <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground line-clamp-3 font-light">
                                {excerpt}
                              </p>
                            )}
                          </div>

                          {/* Services / Tags */}
                          {servicesList.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-2">
                              {servicesList.slice(0, 3).map((srv: string) => (
                                <span
                                  key={srv}
                                  className="rounded-md border border-border/40 bg-background/50 px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-muted-foreground"
                                >
                                  {srv}
                                </span>
                              ))}
                              {servicesList.length > 3 && (
                                <span className="rounded-md border border-border/40 bg-background/50 px-1.5 py-0.5 text-[0.65rem] text-muted-foreground">
                                  +{servicesList.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Footer Action link */}
                      <div className="border-t border-border/40 px-6 py-3.5 bg-background/30 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary transition-colors">
                        <span>View Project Case Study</span>
                        <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Discuss a Project CTA Section */}
        <section className="w-full border-t section-padding bg-gradient-to-b from-card/30 via-background to-background">
          <div className="shell text-center max-w-3xl mx-auto space-y-6">
            <p className="eyebrow text-primary">COMMISSION A PRODUCTION</p>
            <h2 className="font-display text-3xl sm:text-5xl font-light">
              Have a space, resort, or campaign ready to be captured?
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground font-light leading-relaxed">
              We shoot golden-hour and after-dark passes with a minimal crew that respects your
              space and guests in service.
            </p>
            <div className="pt-4">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-full bg-primary px-9 py-4 text-xs font-semibold uppercase tracking-[0.24em] text-primary-foreground shadow-[0_0_30px_rgba(225,29,72,0.4)] transition-all hover:bg-primary/90 hover:scale-[1.02]"
              >
                Discuss Your Space With Us
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
