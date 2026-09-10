import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { brand } from "@/content/site";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Mirabilis" },
      {
        name: "description",
        content: "Terms governing use of the Mirabilis website and booking of shoots.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="border-b pb-16 pt-40">
          <div className="shell">
            <p className="eyebrow">Legal</p>
            <h1 className="mt-5 max-w-3xl font-display text-5xl leading-tight sm:text-6xl">
              Terms of Service
            </h1>
            <p className="mt-6 max-w-xl text-sm text-muted-foreground">
              Last updated{" "}
              {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long" })}. This is
              a working draft and has not been reviewed by a lawyer.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="shell max-w-2xl space-y-10 text-sm leading-relaxed text-muted-foreground">
            <div>
              <h2 className="font-display text-2xl text-foreground">Website use</h2>
              <p className="mt-3">
                This website is provided by {brand.name}, a visual production studio based in{" "}
                {brand.location}. Content on this site — including copy, photography, film and
                design — is the property of {brand.name} unless otherwise credited, and may not be
                reproduced without permission.
              </p>
            </div>
            <div>
              <h2 className="font-display text-2xl text-foreground">Enquiries and quotes</h2>
              <p className="mt-3">
                Package pricing shown on this site is indicative and does not constitute a binding
                quote. Final scope, pricing and timelines for any project are confirmed separately
                once a shoot is discussed and agreed.
              </p>
            </div>
            <div>
              <h2 className="font-display text-2xl text-foreground">Bookings</h2>
              <p className="mt-3">
                A shoot is considered booked once both parties have confirmed scope, date and terms
                in writing (email or a signed agreement). Cancellation, rescheduling and payment
                terms are set out per project.
              </p>
            </div>
            <div>
              <h2 className="font-display text-2xl text-foreground">Delivered work</h2>
              <p className="mt-3">
                Ownership and usage rights for delivered photography and film are set out in the
                agreement for each project. Unless agreed otherwise, {brand.name} retains the right
                to feature completed work in its own portfolio and marketing.
              </p>
            </div>
            <div>
              <h2 className="font-display text-2xl text-foreground">Contact</h2>
              <p className="mt-3">
                Questions about these terms can be sent to {brand.email} or +91 {brand.phones[0]}.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
