import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { brand } from "@/content/site";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  to: string;
  hash?: string;
};

const nav: NavItem[] = [
  { label: "Work", to: "/work" },
  { label: "Services", to: "/services" },
  { label: "Gallery", to: "/", hash: "gallery" },
  { label: "Products", to: "/", hash: "products" },
  { label: "Blog", to: "/blog" },
  { label: "Pricing", to: "/pricing" },
  { label: "Contact", to: "/contact" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500 min-h-[var(--header-height)] flex items-center border-none outline-none shadow-none",
        scrolled
          ? "bg-background/80 backdrop-blur-xl py-2 sm:py-2.5"
          : "bg-gradient-to-b from-black/80 via-black/30 to-transparent py-3 sm:py-4",
      )}
    >
      <div className="shell flex h-16 items-center justify-between">
        <Link to="/" className="group flex flex-col leading-none">
          <span className="font-display text-2xl tracking-[0.38em] text-foreground transition-colors group-hover:text-primary">
            {brand.name}
          </span>
          <span className="mt-1 text-[0.65rem] tracking-[0.32em] uppercase text-primary/80 font-medium">
            {brand.descriptor}
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              {...(item.hash ? { hash: item.hash } : {})}
              className="relative text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground transition-all duration-300 hover:text-foreground [&.active]:text-primary [&.active]:after:w-full after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/contact"
            className="relative inline-flex items-center justify-center overflow-hidden rounded-full bg-primary/10 border border-primary/50 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.24em] text-primary transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_20px_rgba(225,29,72,0.4)]"
          >
            Start a project
          </Link>
        </nav>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-foreground hover:bg-muted md:hidden"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <div className="border-b border-primary/20 bg-background/95 backdrop-blur-2xl md:hidden animate-in slide-in-from-top-4 duration-300">
          <nav aria-label="Mobile" className="shell flex flex-col gap-2 py-6">
            {nav.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                {...(item.hash ? { hash: item.hash } : {})}
                onClick={() => setOpen(false)}
                className="py-3 text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/contact"
              onClick={() => setOpen(false)}
              className="mt-4 text-center rounded-full bg-primary py-3 text-xs font-semibold uppercase tracking-[0.24em] text-primary-foreground"
            >
              Start a project
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
