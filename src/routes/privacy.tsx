import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { brand } from "@/content/site";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Mirabilis" },
      {
        name: "description",
        content: "How Mirabilis handles enquiry information and website data.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="border-b pb-16 pt-40">
          <div className="shell">
            <p className="eyebrow">Legal</p>
            <h1 className="mt-5 max-w-3xl font-display text-5xl leading-tight sm:text-6xl">
              Privacy Policy
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
              <h2 className="font-display text-2xl text-foreground">What we collect</h2>
              <p className="mt-3">
                When you use the contact form on this site, the details you enter — name, phone
                number, service of interest, location and your message — are placed into an email
                addressed to {brand.email} via your own email application. We do not currently store
                enquiry submissions in a database; the form does not send data directly to our
                servers.
              </p>
            </div>
            <div>
              <h2 className="font-display text-2xl text-foreground">How we use it</h2>
              <p className="mt-3">
                Information you send us is used only to respond to your enquiry, plan a shoot, and
                provide the services you have requested. We do not sell or share your information
                with third parties for marketing purposes.
              </p>
            </div>
            <div>
              <h2 className="font-display text-2xl text-foreground">Cookies and analytics</h2>
              <p className="mt-3">
                This site does not currently set marketing or tracking cookies. If analytics or
                cookie-based tools are added in future, this policy will be updated accordingly.
              </p>
            </div>
            <div>
              <h2 className="font-display text-2xl text-foreground">Media and portfolio use</h2>
              <p className="mt-3">
                Photography and film delivered to clients remains subject to the terms agreed for
                each project. Any client work featured in our portfolio is included with permission.
              </p>
            </div>
            <div>
              <h2 className="font-display text-2xl text-foreground">Contact</h2>
              <p className="mt-3">
                Questions about this policy can be sent to {brand.email} or +91 {brand.phones[0]}.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
