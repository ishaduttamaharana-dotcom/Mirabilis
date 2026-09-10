import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { usePublicItemBySlug } from "@/hooks/use-public-content";

export const Route = createFileRoute("/industries/$slug")({
  component: IndustryDetailPage,
});

function IndustryDetailPage() {
  const { slug } = Route.useParams();
  const { item: industry, isLoading } = usePublicItemBySlug<any>("industries", slug);

  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="border-b pb-16 pt-40">
          <div className="shell max-w-4xl">
            <Link
              to="/services"
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-primary"
            >
              ← Back to Services
            </Link>
            {isLoading ? (
              <p className="mt-8 text-sm text-muted-foreground">Loading industry details...</p>
            ) : !industry ? (
              <div className="mt-8 border bg-card p-8">
                <h1 className="font-display text-3xl">Industry Not Found</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  The industry sector you requested is not listed or has been updated.
                </p>
              </div>
            ) : (
              <>
                <p className="eyebrow mt-6">Industry Sector</p>
                <h1 className="mt-4 font-display text-4xl leading-tight sm:text-6xl">
                  {industry.title || industry.name}
                </h1>
                {industry.intro && (
                  <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                    {industry.intro}
                  </p>
                )}
              </>
            )}
          </div>
        </section>

        {industry && (
          <section className="py-16">
            <div className="shell max-w-4xl space-y-8">
              {industry.image && (
                <img
                  src={industry.image}
                  alt={industry.name}
                  className="aspect-16/9 w-full border object-cover"
                />
              )}
              <div className="text-base leading-relaxed text-foreground whitespace-pre-line">
                {industry.description ||
                  industry.details ||
                  "Custom visual production packages tailored specifically for this sector."}
              </div>
              <div className="pt-8 border-t">
                <Link
                  to="/contact"
                  className="inline-block bg-primary px-8 py-4 text-xs uppercase tracking-[0.24em] text-primary-foreground transition-opacity hover:opacity-90"
                >
                  {industry.ctaLabel || "Enquire for this industry"} →
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
