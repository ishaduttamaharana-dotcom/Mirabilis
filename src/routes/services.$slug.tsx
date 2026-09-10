import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Check } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { services } from "@/content/site";

export const Route = createFileRoute("/services/$slug")({
  loader: ({ params }) => {
    const service = services.find((s) => s.slug === params.slug);
    if (!service) throw notFound();
    return service;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — Mirabilis Visual Production` },
          { name: "description", content: loaderData.summary },
          { property: "og:title", content: `${loaderData.title} — Mirabilis` },
          { property: "og:description", content: loaderData.summary },
          { property: "og:type", content: "website" },
          { name: "twitter:card", content: "summary_large_image" },
        ]
      : [],
  }),
  component: ServiceDetailPage,
});

function ServiceDetailPage() {
  const service = Route.useLoaderData();

  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="border-b pb-16 pt-40">
          <div className="shell">
            <Link
              to="/services"
              className="group inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
              All services
            </Link>
            <p className="eyebrow mt-8">Service</p>
            <h1 className="mt-5 max-w-3xl font-display text-5xl leading-tight sm:text-7xl">
              {service.title}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              {service.summary}
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="shell grid gap-14 lg:grid-cols-[1.2fr_0.8fr] lg:gap-20">
            <div>
              <p className="eyebrow">How it works</p>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                {service.detail}
              </p>
              <div className="mt-10 border-t pt-8">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Ideal for
                </p>
                <p className="mt-3 font-display text-2xl">{service.idealFor}</p>
              </div>
            </div>

            <div className="border bg-card/40 p-8">
              <p className="eyebrow">What's included</p>
              <ul className="mt-6 space-y-3">
                {service.inclusions.map((inc) => (
                  <li key={inc} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    {inc}
                  </li>
                ))}
              </ul>
              <Link
                to="/contact"
                className="mt-10 inline-block w-full border border-primary/60 px-6 py-3 text-center text-xs uppercase tracking-[0.22em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                Enquire about this
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t py-20">
          <div className="shell">
            <p className="eyebrow">Other services</p>
            <div className="mt-10 grid gap-px border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {services
                .filter((s) => s.slug !== service.slug)
                .map((s) => (
                  <Link
                    key={s.slug}
                    to="/services/$slug"
                    params={{ slug: s.slug }}
                    className="group bg-background p-8 transition-colors hover:bg-card"
                  >
                    <h3 className="font-display text-xl">{s.title}</h3>
                    <div className="rule-copper mt-4 max-w-12 transition-all group-hover:max-w-full" />
                  </Link>
                ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
