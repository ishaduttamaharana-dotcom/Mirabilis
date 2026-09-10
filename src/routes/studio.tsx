import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { brand, process, media } from "@/content/site";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "The Studio — Mirabilis, Nagpur" },
      {
        name: "description",
        content:
          "Mirabilis is a small visual production studio in Nagpur shooting hospitality spaces at golden hour and after dark. Our approach, crew and process.",
      },
      { property: "og:title", content: "The Studio — Mirabilis, Nagpur" },
      {
        property: "og:description",
        content:
          "A small, quiet crew shooting cafes, resorts and villas across Maharashtra — how we work, from listening to delivery.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudioPage,
});

function StudioPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="border-b pb-16 pt-40">
          <div className="shell">
            <p className="eyebrow">The studio</p>
            <h1 className="mt-5 max-w-3xl font-display text-5xl leading-tight sm:text-7xl">
              {brand.quote}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              {brand.promise} Based in {brand.location}, working across central India with a compact
              crew that respects a room in service.
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="shell grid gap-12 lg:grid-cols-2 lg:gap-20">
            <img
              src={media.sceneDay}
              alt="Daylight interior of a boutique hospitality space with soft window light"
              width={1400}
              height={1750}
              loading="lazy"
              className="aspect-4/5 w-full border object-cover"
            />
            <div className="space-y-8">
              <h2 className="font-display text-4xl leading-tight">Two personalities, one visit.</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Hospitality spaces are rarely one thing. A courtyard that reads calm and open at
                11am becomes intimate and copper-lit at 9pm. We schedule for both, so a single
                project gives you a library that works across seasons, campaigns and platforms.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                No stock-looking sets, no over-lit rooms. We work with the light a guest actually
                walks into, then shape it just enough to hold a frame.
              </p>
              <dl className="grid grid-cols-2 gap-8 border-t pt-8">
                <div>
                  <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Based in
                  </dt>
                  <dd className="mt-2 font-display text-2xl">{brand.location}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Studio
                  </dt>
                  <dd className="mt-2 font-display text-2xl">{brand.descriptor}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <section className="border-y bg-card/40 py-20">
          <div className="shell">
            <p className="eyebrow">Process</p>
            <h2 className="mt-5 font-display text-4xl leading-tight sm:text-5xl">
              How a project runs.
            </h2>
            <div className="mt-14 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
              {process.map((item) => (
                <div key={item.step} className="bg-background p-8">
                  <p className="text-xs tracking-[0.3em] text-primary">{item.step}</p>
                  <h3 className="mt-5 font-display text-2xl">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>
            <Link
              to="/contact"
              className="mt-14 inline-block border border-primary/60 px-7 py-3 text-xs uppercase tracking-[0.22em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Start a project
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
