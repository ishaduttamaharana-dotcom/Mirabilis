import { Link } from "@tanstack/react-router";
import { Instagram, Mail, MapPin, Phone } from "lucide-react";
import { brand } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="relative border-t border-primary/20 bg-gradient-to-b from-card/80 via-background to-black pt-20 pb-12 overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-primary/10 blur-[100px] pointer-events-none" />

      <div className="shell grid gap-12 pb-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-4xl tracking-[0.38em] text-foreground">{brand.name}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            {brand.services}
          </p>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
            {brand.promise}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/contact"
              className="rounded-full bg-primary px-8 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-primary-foreground shadow-[0_0_20px_rgba(225,29,72,0.3)] transition-all hover:bg-primary/90"
            >
              Start a project
            </Link>
            <Link
              to="/work"
              className="rounded-full border border-border px-8 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Explore portfolio
            </Link>
          </div>
        </div>

        <div>
          <p className="eyebrow text-primary">Reach us</p>
          <ul className="mt-6 space-y-4 text-sm text-muted-foreground">
            <li>
              <a
                className="inline-flex items-center gap-3 transition-colors hover:text-primary"
                href={`mailto:${brand.email}`}
              >
                <Mail className="size-4 text-primary" aria-hidden />
                {brand.email}
              </a>
            </li>
            {brand.phones.map((phone) => (
              <li key={phone}>
                <a
                  className="inline-flex items-center gap-3 transition-colors hover:text-primary"
                  href={`tel:+91${phone}`}
                >
                  <Phone className="size-4 text-primary" aria-hidden />
                  +91 {phone}
                </a>
              </li>
            ))}
            <li>
              <a
                className="inline-flex items-center gap-3 transition-colors hover:text-primary"
                href={brand.instagramUrl}
                target="_blank"
                rel="noreferrer"
              >
                <Instagram className="size-4 text-primary" aria-hidden />
                {brand.instagram}
              </a>
            </li>
            <li className="inline-flex items-center gap-3">
              <MapPin className="size-4 text-primary" aria-hidden />
              {brand.location}
            </li>
          </ul>
        </div>

        <div>
          <p className="eyebrow text-primary">Explore</p>
          <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
            <li>
              <Link to="/work" className="transition-colors hover:text-primary">
                Selected work
              </Link>
            </li>
            <li>
              <Link to="/services" className="transition-colors hover:text-primary">
                Services
              </Link>
            </li>
            <li>
              <Link to="/studio" className="transition-colors hover:text-primary">
                The studio
              </Link>
            </li>
            <li>
              <Link to="/pricing" className="transition-colors hover:text-primary">
                Pricing & Packages
              </Link>
            </li>
            <li>
              <Link to="/blog" className="transition-colors hover:text-primary">
                Journal & Insights
              </Link>
            </li>
            <li>
              <Link to="/contact" className="transition-colors hover:text-primary">
                Contact & Enquiries
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="shell flex flex-col gap-4 border-t border-border/40 pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {brand.name}. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          <Link to="/privacy" className="transition-colors hover:text-primary">
            Privacy Policy
          </Link>
          <Link to="/terms" className="transition-colors hover:text-primary">
            Terms of Service
          </Link>
          <p className="tracking-[0.24em] uppercase text-primary/70">{brand.descriptor}</p>
        </div>
      </div>
    </footer>
  );
}
