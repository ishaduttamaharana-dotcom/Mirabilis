import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Instagram, Mail, MapPin, Phone } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { brand, services } from "@/content/site";

import { api } from "@/lib/api-client";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Mirabilis — Nagpur Visual Production Studio" },
      {
        name: "description",
        content:
          "Enquire about photography, cinematography, brand films or a 360° tour. Mirabilis is based in Nagpur, Maharashtra and shoots across central India.",
      },
      { property: "og:title", content: "Contact Mirabilis — Nagpur Visual Production Studio" },
      {
        property: "og:description",
        content: "Tell us about your space, dates and scope. We reply with a plan and a quote.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sending, setSending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSending(true);

    const serviceVal = data.get("service");
    if (serviceVal && !data.get("service_interest")) {
      data.append("service_interest", String(serviceVal));
    }

    try {
      await api.postForm("/public/contact", data);
      toast.success("Thank you for contacting, we'll get back to you in 24hr-36 working hours!");
      form.reset();
    } catch {
      // Fallback to mailto if server is unreachable
      const body = [
        `Name: ${data.get("name")}`,
        `Email: ${data.get("email")}`,
        `Phone: ${data.get("phone")}`,
        `Service: ${data.get("service")}`,
        `Location: ${data.get("location")}`,
        "",
        String(data.get("message") ?? ""),
      ].join("\n");

      window.location.href = `mailto:${brand.email}?subject=${encodeURIComponent(
        `Project enquiry — ${data.get("name")}`,
      )}&body=${encodeURIComponent(body)}`;
      toast.success("Thank you for contacting, we'll get back to you in 24hr-36 working hours!");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="border-b pb-16 pt-40">
          <div className="shell">
            <p className="eyebrow">Enquire</p>
            <h1 className="mt-5 max-w-3xl font-display text-5xl leading-tight sm:text-7xl">
              Let's plan the shoot.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              Share the space, your dates and what the footage is for. We usually reply within one
              working day with a plan and a quote.
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="shell grid gap-16 lg:grid-cols-[1.3fr_0.7fr]">
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Name" name="name" required />
                <Field label="Email" name="email" type="email" required />
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Phone" name="phone" type="tel" required />
                <div>
                  <label
                    htmlFor="service"
                    className="text-xs uppercase tracking-[0.22em] text-muted-foreground"
                  >
                    Service
                  </label>
                  <select
                    id="service"
                    name="service"
                    className="mt-3 w-full border border-input bg-transparent px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
                  >
                    {services.map((s) => (
                      <option key={s.slug} value={s.title} className="bg-card">
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Field label="Location" name="location" />
              <div>
                <label
                  htmlFor="message"
                  className="text-xs uppercase tracking-[0.22em] text-muted-foreground"
                >
                  About the project
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  required
                  className="mt-3 w-full border border-input bg-transparent px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                We use your details only to respond to this enquiry.
              </p>
              <button
                type="submit"
                disabled={sending}
                className="bg-primary px-8 py-4 text-xs uppercase tracking-[0.24em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                Send enquiry
              </button>
            </form>

            <aside className="space-y-6 border-l pl-8">
              <p className="eyebrow">Direct</p>
              <ContactRow
                icon={<Mail className="size-4 text-primary" aria-hidden />}
                href={`mailto:${brand.email}`}
              >
                {brand.email}
              </ContactRow>
              {brand.phones.map((phone) => (
                <ContactRow
                  key={phone}
                  icon={<Phone className="size-4 text-primary" aria-hidden />}
                  href={`tel:+91${phone}`}
                >
                  +91 {phone}
                </ContactRow>
              ))}
              <ContactRow
                icon={<Instagram className="size-4 text-primary" aria-hidden />}
                href={brand.instagramUrl}
              >
                {brand.instagram}
              </ContactRow>
              <p className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="size-4 text-primary" aria-hidden />
                {brand.location}
              </p>
            </aside>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="mt-3 w-full border border-input bg-transparent px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
      />
    </div>
  );
}

function ContactRow({
  icon,
  href,
  children,
}: {
  icon: React.ReactNode;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-primary"
    >
      {icon}
      {children}
    </a>
  );
}
