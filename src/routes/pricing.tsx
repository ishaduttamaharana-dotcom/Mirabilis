import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { faqs, pricing } from "@/content/site";

import { usePublicCollection } from "@/hooks/use-public-content";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Mirabilis Visual Production" },
      {
        name: "description",
        content:
          "Indicative packages for photography, videography and 360° tours from Mirabilis, a Nagpur visual production studio. Every project is quoted to scope.",
      },
      { property: "og:title", content: "Pricing — Mirabilis" },
      {
        property: "og:description",
        content: "Starting points, not straitjackets. See how Mirabilis packages projects.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const { items: livePricing } = usePublicCollection<any>("pricing_plans", pricing);
  const { items: liveFaqs } = usePublicCollection<any>("faqs", faqs);

  return (
    <>
      <SiteHeader />
      <main id="main" className="w-full min-h-screen">
        <section className="w-full border-b pb-16 pt-40">
          <div className="shell">
            <p className="eyebrow">Pricing</p>
            <h1 className="mt-5 max-w-3xl font-display text-5xl leading-tight sm:text-7xl">
              Starting points, not straitjackets.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              Every project is quoted to scope. These are the shapes most work takes — tell us the
              space, the dates and where the work will live, and we'll shape a plan around it.
            </p>
          </div>
        </section>

        <section className="w-full py-20">
          <div className="shell grid gap-8 lg:grid-cols-3">
            {livePricing.map((plan: any) => (
              <article
                key={plan.name || plan.planName || plan.id}
                className={
                  plan.featured
                    ? "border border-primary/60 bg-card p-8 shadow-glow"
                    : "border bg-background p-8"
                }
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="font-display text-3xl">{plan.name || plan.planName}</h2>
                  {plan.featured && <span className="eyebrow">Most chosen</span>}
                </div>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {plan.bestFor || plan.summary}
                </p>
                <p className="mt-6 font-display text-2xl text-primary">
                  {plan.priceLabel ||
                    (plan.priceAmount ? `${plan.currency || "₹"}${plan.priceAmount}` : "")}
                </p>
                {Array.isArray(plan.features) && (
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature: string) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 text-sm text-muted-foreground"
                      >
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  to="/contact"
                  className="mt-8 inline-block border border-border px-6 py-3 text-xs uppercase tracking-[0.22em] transition-colors hover:border-primary hover:text-primary"
                >
                  Enquire
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t py-20">
          <div className="shell grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="eyebrow">FAQ</p>
              <h2 className="mt-5 font-display text-4xl leading-tight sm:text-5xl">
                The practical details.
              </h2>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {liveFaqs.map((faq: any, i: number) => (
                <AccordionItem key={faq.question || faq.id || i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left font-display text-xl hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
