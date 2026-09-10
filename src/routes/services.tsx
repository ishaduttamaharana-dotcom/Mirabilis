import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { services, pricing, media } from "@/content/site";

import { usePublicCollection } from "@/hooks/use-public-content";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services & Packages — Mirabilis Visual Production" },
      {
        name: "description",
        content:
          "Photography, videography, cinematography, brand films and 360° virtual tours for cafes, resorts, villas and lifestyle brands, with indicative package pricing.",
      },
      { property: "og:title", content: "Services & Packages — Mirabilis" },
      {
        property: "og:description",
        content:
          "What we shoot and how projects are packaged: stills, films, cinematography and 360° tours for hospitality brands.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const { items: liveServices } = usePublicCollection<any>("services", services);
  const { items: livePricing } = usePublicCollection<any>("pricing_plans", pricing);

  return (
    <>
      <SiteHeader />
      <main id="main" className="w-full min-h-screen">
        <section className="w-full border-b pb-16 pt-40">
          <div className="shell">
            <p className="eyebrow">Services</p>
            <h1 className="mt-5 max-w-3xl font-display text-5xl leading-tight sm:text-7xl">
              What we shoot, and how.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              Every project is built around light: one window at golden hour, one after dark. The
              craft stays the same whether it is a single menu set or a multi-day campaign.
            </p>
          </div>
        </section>

        <section className="w-full py-20">
          <div className="shell grid gap-px border bg-border sm:grid-cols-2">
            {liveServices.map((service: any) => (
              <article key={service.slug || service.id} className="bg-background p-8 sm:p-10">
                <h2 className="font-display text-3xl">{service.title || service.name}</h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {service.summary || service.description || service.subtitle}
                </p>
                {Array.isArray(service.inclusions) && (
                  <ul className="mt-6 space-y-2">
                    {service.inclusions.map((inc: string) => (
                      <li
                        key={inc}
                        className="text-xs uppercase tracking-[0.18em] text-muted-foreground"
                      >
                        <span className="mr-3 text-primary">—</span>
                        {inc}
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  to="/services/$slug"
                  params={{ slug: service.slug || "brand-films" }}
                  className="mt-6 inline-block text-xs uppercase tracking-[0.22em] text-primary transition-colors hover:opacity-80"
                >
                  Learn more →
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y">
          <div className="shell grid items-center gap-12 py-20 lg:grid-cols-2 lg:gap-20">
            <img
              src={media.sceneNight}
              alt="Hotel interior lit warmly after dark, lamps reflected in glass"
              width={1400}
              height={1000}
              loading="lazy"
              className="aspect-4/3 w-full border object-cover"
            />
            <div>
              <p className="eyebrow">Packages</p>
              <h2 className="mt-5 font-display text-4xl leading-tight sm:text-5xl">
                Indicative pricing.
              </h2>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                Packages are a starting point, not a cage. Tell us the space, the dates and where
                the work will live, and we will shape a scope around it.
              </p>
              <div className="mt-10 space-y-px bg-border">
                {livePricing.map((tier: any) => (
                  <div
                    key={tier.name || tier.planName || tier.id}
                    className="flex flex-wrap items-baseline justify-between gap-3 bg-background px-6 py-5"
                  >
                    <div>
                      <p className="font-display text-2xl">{tier.name || tier.planName}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {tier.bestFor || tier.summary}
                      </p>
                    </div>
                    <p className="text-sm text-primary">
                      {tier.priceLabel ||
                        (tier.priceAmount ? `${tier.currency || "₹"}${tier.priceAmount}` : "")}
                    </p>
                  </div>
                ))}
              </div>
              <Link
                to="/contact"
                className="mt-10 inline-block border border-primary/60 px-7 py-3 text-xs uppercase tracking-[0.22em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                Request a quote
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
