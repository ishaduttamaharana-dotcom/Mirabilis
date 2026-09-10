import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { work } from "@/content/site";

import { usePublicCollection } from "@/hooks/use-public-content";

export const Route = createFileRoute("/work")({
  head: () => ({
    meta: [
      { title: "Selected Work — Mirabilis Visual Production" },
      {
        name: "description",
        content:
          "Resort, hospitality and brand-film projects by Mirabilis: golden-hour and after-dark photography, cinematography and 360° tours across Maharashtra.",
      },
      { property: "og:title", content: "Selected Work — Mirabilis Visual Production" },
      {
        property: "og:description",
        content:
          "A selection of resort, brand-film and 360° tour projects shot in Nagpur and across Maharashtra.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WorkPage,
});

function WorkPage() {
  const { items: liveWork } = usePublicCollection<any>("projects", work);

  return (
    <>
      <SiteHeader />
      <main id="main" className="w-full min-h-screen">
        <section className="w-full border-b pb-16 pt-40">
          <div className="shell">
            <p className="eyebrow">Portfolio</p>
            <h1 className="mt-5 max-w-3xl font-display text-5xl leading-tight sm:text-7xl">
              Selected work.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              A short selection of recent projects. Full case studies and unlisted client work are
              available on request.
            </p>
          </div>
        </section>

        <section className="w-full py-20">
          <div className="shell space-y-24">
            {liveWork.map((item: any, i: number) => (
              <article
                key={item.slug || item.id}
                className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
              >
                <div className={i % 2 === 1 ? "lg:order-2" : undefined}>
                  <img
                    src={item.image || item.coverImage || "/placeholder.svg"}
                    alt={item.alt || item.title || "Project image"}
                    width={1200}
                    height={1500}
                    loading="lazy"
                    className="aspect-4/5 w-full border object-cover"
                  />
                </div>
                <div>
                  <p className="eyebrow">
                    {item.category || "Portfolio"} {item.location ? `· ${item.location}` : ""}
                  </p>
                  <h2 className="mt-4 font-display text-4xl">{item.title || item.name}</h2>
                  <div className="rule-copper mt-6 max-w-24" />
                  <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                    {item.blurb || item.shortDescription || item.description}
                  </p>
                  <Link
                    to="/contact"
                    className="mt-8 inline-block border border-border px-6 py-3 text-xs uppercase tracking-[0.22em] transition-colors hover:border-primary hover:text-primary"
                  >
                    Discuss a similar project
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
