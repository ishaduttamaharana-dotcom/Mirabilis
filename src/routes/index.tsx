import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Check } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DayNight } from "@/components/day-night";
import { brand, faqs, media, pricing, process, services, work } from "@/content/site";

import { usePublicCollection } from "@/hooks/use-public-content";
import { getMediaUrl } from "@/lib/api-client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mirabilis — Visual Production Studio in Nagpur" },
      {
        name: "description",
        content:
          "Mirabilis is a Nagpur visual production studio: photography, cinematography, brand films and 360° tours for cafes, resorts, villas and brands.",
      },
      { property: "og:title", content: "Mirabilis — Visual Production Studio in Nagpur" },
      {
        property: "og:description",
        content:
          "Golden-hour and after-dark storytelling for hospitality and lifestyle brands. Photography · Videography · Cinematography.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="w-full min-h-screen">
        <Hero />
        <Services />
        <Signature />
        <Work />
        <IndustriesSection />
        <ProductsSection />
        <GallerySection />
        <Approach />
        <TeamSection />
        <TestimonialsSection />
        <ClientsPartnersSection />
        <Pricing />
        <Faq />
        <BlogSection />
        <ContactCta />
      </main>
      <SiteFooter />
    </>
  );
}

function Hero() {
  const defaultSlides = [
    {
      id: "default-slide-1",
      eyebrow: brand.services,
      headline: "Golden hour and after dark, in one story.",
      quote: brand.quote,
      imageUrl: "",
      media: "",
      backgroundMedia: "",
      mediaType: "image",
      overlayEnabled: true,
      overlayOpacity: 65,
      horizontalPos: "left",
      verticalPos: "bottom",
      primaryCtaShow: true,
      ctaLabel: "Start a project",
      ctaUrl: "/contact",
      secondaryCtaShow: true,
      secondaryCtaLabel: "View work",
      secondaryCtaUrl: "/work",
    },
  ];

  const { items: liveSlides } = usePublicCollection<any>("hero_slides", defaultSlides);

  const activeSlides = (liveSlides.length > 0 ? liveSlides : defaultSlides).filter(
    (s: any) => s.visible !== false,
  );

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const currentSlide = activeSlides[currentIndex];
    const durationMs = (currentSlide?.slideDuration || 7) * 1000;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, durationMs);

    return () => clearInterval(timer);
  }, [activeSlides, currentIndex]);

  const slide = activeSlides[currentIndex] || activeSlides[0] || defaultSlides[0];

  const isVideo =
    slide.mediaType === "video" ||
    !!slide.videoUrl ||
    !!slide.backgroundVideo ||
    (typeof slide.media === "string" && Boolean(slide.media.match(/\.(mp4|webm|mov|m4v|m3u8)/i))) ||
    (typeof slide.backgroundMedia === "string" &&
      Boolean(slide.backgroundMedia.match(/\.(mp4|webm|mov|m4v|m3u8)/i))) ||
    (typeof slide.mediaUrl === "string" &&
      Boolean(slide.mediaUrl.match(/\.(mp4|webm|mov|m4v|m3u8)/i)));

  const rawMedia =
    (isVideo
      ? slide.videoUrl ||
        slide.backgroundVideo ||
        slide.backgroundMedia ||
        slide.mediaUrl ||
        slide.media
      : slide.imageUrl ||
        slide.backgroundImage ||
        slide.backgroundMedia ||
        slide.mediaUrl ||
        slide.media) || "";

  const rawPoster =
    slide.posterUrl || slide.posterImage || slide.imageUrl || slide.backgroundImage || "";

  const mediaSrc = getMediaUrl(rawMedia);
  const posterSrc = getMediaUrl(rawPoster);

  const opacityVal = typeof slide.overlayOpacity === "number" ? slide.overlayOpacity / 100 : 0.65;

  const flexHoriz =
    slide.horizontalPos === "center"
      ? "items-center text-center"
      : slide.horizontalPos === "right"
        ? "items-end text-right"
        : "items-start text-left";

  const flexVert =
    slide.verticalPos === "top"
      ? "justify-start"
      : slide.verticalPos === "center"
        ? "justify-center"
        : "justify-end";

  return (
    <section
      className={`relative flex min-h-[100svh] w-full overflow-hidden flex-col ${flexVert} pt-[calc(var(--header-height)+2rem)] sm:pt-[calc(var(--header-height)+3rem)] pb-12 sm:pb-20`}
    >
      {/* Media Background Layer (z-0) */}
      {rawMedia &&
        mediaSrc !== "/placeholder.svg" &&
        (isVideo ? (
          <video
            key={mediaSrc}
            src={mediaSrc}
            poster={posterSrc !== "/placeholder.svg" ? posterSrc : undefined}
            autoPlay={slide.videoAutoplay ?? true}
            muted={slide.videoMuted ?? true}
            loop={slide.videoLoop ?? true}
            playsInline={slide.videoPlayInline ?? true}
            preload="auto"
            className="absolute inset-0 z-0 size-full object-cover pointer-events-none"
          />
        ) : (
          <img
            key={mediaSrc}
            src={mediaSrc}
            alt={slide.altText || slide.headline || "Mirabilis Hero Background"}
            width={1920}
            height={1088}
            className={`absolute inset-0 z-0 size-full object-cover object-${slide.imagePosition || "center"}`}
          />
        ))}

      {/* Dark Overlay Veil (z-10) */}
      {slide.overlayEnabled !== false && (
        <div
          className="absolute inset-0 z-10 transition-opacity duration-700 pointer-events-none"
          style={{
            backgroundColor: slide.overlayType === "gradient" ? undefined : "black",
            backgroundImage:
              slide.overlayType === "gradient"
                ? "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)"
                : undefined,
            opacity: opacityVal,
          }}
          aria-hidden
        />
      )}

      {/* Hero Content Shell (z-20) */}
      <div className={`shell relative z-20 flex flex-col ${flexHoriz}`}>
        <p className="eyebrow reveal">{slide.eyebrow || "VISUAL PRODUCTION STUDIO"}</p>
        <h1 className="reveal mt-5 sm:mt-6 max-w-5xl font-display text-hero-fluid text-glow whitespace-pre-line">
          {slide.headline || slide.title || "Golden hour and after dark, in one story."}
        </h1>
        {slide.subhead && (
          <p className="reveal mt-4 max-w-2xl text-lg text-muted-foreground font-light">
            {slide.subhead}
          </p>
        )}
        {slide.quote && (
          <blockquote className="reveal mt-8 max-w-2xl border-l-2 border-primary/80 pl-6 text-xl text-muted-foreground italic leading-relaxed">
            “{slide.quote}”
          </blockquote>
        )}
        <div className="reveal mt-10 flex flex-wrap items-center gap-5">
          {slide.primaryCtaShow !== false && (
            <Link
              to={slide.ctaUrl || "/contact"}
              {...(slide.primaryCtaNewTab ? { target: "_blank" } : {})}
              className="rounded-full bg-primary px-9 py-4 text-xs font-semibold uppercase tracking-[0.26em] text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:shadow-[0_0_25px_rgba(225,29,72,0.4)]"
            >
              {slide.ctaLabel || "Start a project"}
            </Link>
          )}
          {slide.secondaryCtaShow !== false && (
            <Link
              to={slide.secondaryCtaUrl || "/work"}
              {...(slide.secondaryCtaNewTab ? { target: "_blank" } : {})}
              className="group inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/30 backdrop-blur-md px-9 py-4 text-xs font-semibold uppercase tracking-[0.26em] text-foreground transition-all duration-300 hover:border-primary hover:text-primary"
            >
              {slide.secondaryCtaLabel || "View work"}
              <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5" />
            </Link>
          )}
        </div>
        {/* Multi-slide Indicators if > 1 slide */}
        {activeSlides.length > 1 && (
          <div className="mt-8 flex items-center gap-2">
            {activeSlides.map((_: any, idx: number) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  idx === currentIndex ? "w-8 bg-primary" : "w-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function SectionHead({ eyebrow, title, lede }: { eyebrow: string; title: string; lede?: string }) {
  return (
    <div className="max-w-3xl">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-5 font-display text-heading-fluid">{title}</h2>
      {lede && <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{lede}</p>}
    </div>
  );
}

function Services() {
  const { items: liveServices } = usePublicCollection<any>("services", services);

  return (
    <section id="services" className="w-full border-t section-padding">
      <div className="shell">
        <SectionHead
          eyebrow="What we do"
          title="Six ways to tell the story of a space."
          lede={brand.promise}
        />
        <div className="mt-16 grid gap-px border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-3 rounded-2xl overflow-hidden shadow-2xl">
          {liveServices.map((service: any) => (
            <Link
              key={service.slug || service.id}
              to="/services/$slug"
              params={{ slug: service.slug || "brand-films" }}
              className="group bg-background/95 p-10 transition-all duration-500 hover:bg-card"
            >
              <h3 className="font-display text-3xl transition-colors group-hover:text-primary">
                {service.title || service.name}
              </h3>
              <div className="rule-copper mt-6 max-w-16 transition-all duration-500 group-hover:max-w-full" />
              <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
                {service.summary || service.description}
              </p>
              {Array.isArray(service.inclusions) && (
                <ul className="mt-8 space-y-3">
                  {service.inclusions.map((item: string) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
                    >
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Signature() {
  return (
    <section className="w-full gradient-afterglow border-t section-padding">
      <div className="shell grid items-center gap-16 lg:grid-cols-2">
        <SectionHead
          eyebrow="Signature edge"
          title="One space. Two personalities."
          lede="Every project is planned across two light windows — a golden-hour pass and a night-light pass. You end up with a library that sells brunch and dinner, check-in and last call."
        />
        <DayNight />
      </div>
    </section>
  );
}

function Work() {
  const { items: liveWork } = usePublicCollection<any>("projects", work);

  return (
    <section id="work" className="w-full border-t section-padding">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SectionHead eyebrow="Selected work" title="Recent frames." />
          <Link
            to="/work"
            className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary"
          >
            All projects
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5" />
          </Link>
        </div>
        <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {liveWork.slice(0, 3).map((item: any) => (
            <Link
              key={item.slug || item.id}
              to="/work/$slug"
              params={{ slug: item.slug || "hillside-resort" }}
              className="group"
            >
              <div className="relative overflow-hidden rounded-2xl border border-border/40 shadow-2xl">
                <img
                  src={item.image || item.coverImage || item.cardImage || "/placeholder.svg"}
                  alt={item.alt || item.title || "Project image"}
                  width={1200}
                  height={1500}
                  loading="lazy"
                  className="aspect-4/5 w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                />
              </div>
              <p className="mt-6 eyebrow">{item.category || "Portfolio"}</p>
              <h3 className="mt-2 font-display text-3xl transition-colors group-hover:text-primary">
                {item.title || item.name}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.blurb || item.shortDescription}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Approach() {
  return (
    <section id="approach" className="w-full border-t bg-card/30 section-padding">
      <div className="shell">
        <SectionHead
          eyebrow="Approach"
          title="Calm on set. Ruthless in prep."
          lede="A small crew, a clear plan, and no guesswork on the day."
        />
        <ol className="mt-16 grid gap-px border border-border/60 bg-border/60 rounded-2xl overflow-hidden sm:grid-cols-2 lg:grid-cols-4">
          {process.map((item) => (
            <li key={item.step} className="bg-background/95 p-10">
              <span className="font-display text-5xl text-primary">{item.step}</span>
              <h3 className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-foreground">
                {item.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Pricing() {
  const { items: livePricing } = usePublicCollection<any>("pricing_plans", pricing);

  return (
    <section id="pricing" className="w-full border-t section-padding">
      <div className="shell">
        <SectionHead
          eyebrow="Pricing"
          title="Starting points, not straitjackets."
          lede="Every project is quoted to scope. These are the shapes most work takes."
        />
        <div className="mt-16 grid gap-10 lg:grid-cols-3">
          {livePricing.map((plan: any) => (
            <article
              key={plan.name || plan.planName || plan.id}
              className={
                plan.featured
                  ? "relative rounded-2xl border-2 border-primary bg-card/90 p-10 shadow-glow"
                  : "rounded-2xl border border-border/60 bg-background/95 p-10"
              }
            >
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-display text-3xl text-foreground">
                  {plan.name || plan.planName}
                </h3>
                {plan.featured && <span className="eyebrow text-primary">Most chosen</span>}
              </div>
              <p className="mt-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {plan.bestFor || plan.summary}
              </p>
              <p className="mt-8 font-display text-4xl text-primary">
                {plan.priceLabel ||
                  (plan.priceAmount ? `${plan.currency || "₹"}${plan.priceAmount}` : "")}
              </p>
              {Array.isArray(plan.features) && (
                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature: string) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3.5 text-sm text-muted-foreground"
                    >
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                      {feature}
                    </li>
                  ))}
                </ul>
              )}
              <Link
                to="/contact"
                className="mt-10 block text-center rounded-full border border-border px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.24em] transition-all hover:border-primary hover:text-primary hover:shadow-lg"
              >
                Enquire
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="w-full border-t section-padding">
      <div className="shell grid gap-16 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHead eyebrow="FAQ" title="The practical details." />
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={faq.question} value={`item-${i}`}>
              <AccordionTrigger className="text-left font-display text-2xl hover:no-underline hover:text-primary">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function ContactCta() {
  return (
    <section className="w-full gradient-afterglow border-t section-padding">
      <div className="shell text-center">
        <p className="eyebrow">Next project</p>
        <h2 className="mx-auto mt-6 max-w-4xl font-display text-heading-fluid">
          Tell us about the space. We'll tell you how it should be filmed.
        </h2>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
          <Link
            to="/contact"
            className="rounded-full bg-primary px-10 py-4 text-xs font-semibold uppercase tracking-[0.26em] text-primary-foreground shadow-[0_0_25px_rgba(225,29,72,0.4)] transition-all hover:bg-primary/90"
          >
            Start an enquiry
          </Link>
          <a
            href={`tel:+91${brand.phones[0]}`}
            className="rounded-full border border-border/80 bg-background/30 backdrop-blur-md px-10 py-4 text-xs font-semibold uppercase tracking-[0.26em] transition-colors hover:border-primary hover:text-primary"
          >
            +91 {brand.phones[0]}
          </a>
        </div>
      </div>
    </section>
  );
}

function StatisticsSection() {
  const defaultStats = [
    {
      metric: "120+",
      label: "Projects Completed",
      description: "Across Maharashtra & Central India",
    },
    { metric: "98%", label: "Client Satisfaction", description: "Repeat business & word-of-mouth" },
    { metric: "45+", label: "Luxury Venues Filmed", description: "Resorts, villas & fine dining" },
    {
      metric: "24h",
      label: "Fast-Turnaround Preview",
      description: "First cuts delivered within 24h",
    },
  ];
  const { items: liveStats } = usePublicCollection<any>("statistics", defaultStats);

  return (
    <section className="w-full border-y border-border/40 bg-card/20 py-12">
      <div className="shell">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {liveStats.map((stat: any, idx: number) => (
            <div key={idx} className="flex flex-col border-l-2 border-primary/60 pl-6">
              <span className="font-display text-4xl sm:text-5xl text-primary font-bold">
                {stat.metric || stat.value || stat.number}
              </span>
              <span className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
                {stat.label || stat.title || stat.name}
              </span>
              {(stat.description || stat.summary) && (
                <span className="mt-1 text-xs text-muted-foreground font-light">
                  {stat.description || stat.summary}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function IndustriesSection() {
  const defaultIndustries = [
    {
      title: "Luxury Hospitality & Resorts",
      description:
        "Visual assets built to increase direct booking conversions and elevate luxury perception.",
      bannerImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
      slug: "luxury-hospitality-resorts",
    },
    {
      title: "Boutique Cafes & Fine Dining",
      description:
        "Atmospheric food, beverage, and interior imagery designed for social engagement.",
      bannerImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80",
      slug: "boutique-cafes-fine-dining",
    },
    {
      title: "High-End Architectural Real Estate",
      description: "Immersive 3D virtual walkthroughs and twilight stills for premier estates.",
      bannerImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
      slug: "high-end-architectural-real-estate",
    },
  ];
  const { items: liveIndustries } = usePublicCollection<any>("industries", defaultIndustries);

  return (
    <section id="industries" className="w-full border-t section-padding">
      <div className="shell">
        <SectionHead
          eyebrow="Sectors we serve"
          title="Tailored production for every space."
          lede="Specific visual strategies designed for resort owners, restaurateurs, and luxury developers."
        />
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {liveIndustries.map((ind: any, idx: number) => (
            <Link
              key={ind.slug || idx}
              to="/industries/$slug"
              params={{ slug: ind.slug || "luxury-hospitality-resorts" }}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-8 shadow-xl transition-all duration-500 hover:border-primary hover:shadow-2xl flex flex-col justify-between"
            >
              <div>
                <div className="relative h-48 w-full overflow-hidden rounded-xl">
                  <img
                    src={getMediaUrl(ind.bannerImage || ind.coverImage || ind.image)}
                    alt={ind.title || ind.name}
                    width={800}
                    height={600}
                    className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                </div>
                <h3 className="mt-6 font-display text-2xl text-foreground transition-colors group-hover:text-primary">
                  {ind.title || ind.name}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {ind.description || ind.summary}
                </p>
              </div>
              <div className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Explore Industry
                <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductsSection() {
  const defaultProducts = [
    {
      name: "Mirabilis Afterglow LUT Preset Pack",
      description:
        "Signature color-grading LUTs engineered for architectural and twilight hospitality videos.",
      price: 2499,
      currency: "₹",
      images: ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80"],
    },
    {
      name: "Fine Art Architectural Print: Hillside Dawn",
      description: "Limited edition gallery print on archival museum-grade rag paper.",
      price: 7999,
      currency: "₹",
      images: ["https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80"],
    },
  ];
  const { items: liveProducts } = usePublicCollection<any>("products", defaultProducts);

  return (
    <section id="products" className="w-full border-t section-padding bg-card/10">
      <div className="shell">
        <SectionHead
          eyebrow="Studio Store"
          title="Assets & digital products."
          lede="Color presets, prints, and tools crafted by our senior colorists and photographers."
        />
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-2">
          {liveProducts.map((prod: any, idx: number) => {
            const imgSrc = Array.isArray(prod.images)
              ? prod.images[0]
              : prod.image || prod.coverImage || "/placeholder.svg";
            return (
              <div
                key={idx}
                className="flex flex-col sm:flex-row overflow-hidden rounded-2xl border border-border/60 bg-background/95 p-6 gap-6 shadow-xl"
              >
                <div className="relative h-48 sm:h-auto sm:w-48 shrink-0 overflow-hidden rounded-xl">
                  <img
                    src={getMediaUrl(imgSrc)}
                    alt={prod.name || prod.title}
                    width={600}
                    height={600}
                    className="size-full object-cover"
                  />
                </div>
                <div className="flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-2xl text-foreground">
                        {prod.name || prod.title}
                      </h3>
                      <span className="rounded-full bg-primary/10 border border-primary/30 px-3 py-1 text-xs font-semibold text-primary">
                        {prod.currency || "₹"}
                        {prod.price ? Number(prod.price).toLocaleString("en-IN") : "Enquire"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {prod.description || prod.summary}
                    </p>
                  </div>
                  <Link
                    to="/contact"
                    className="mt-6 inline-flex items-center justify-center rounded-full border border-primary/60 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    Purchase / Order
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function GallerySection() {
  const defaultGallery = [
    {
      title: "Twilight Resort Pool Deck",
      category: "Resorts",
      media: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
      caption: "Shot at 6:45 PM blue hour with subtle warm pool lighting.",
    },
    {
      title: "Artisan Coffee Bar Prep",
      category: "Cafes",
      media: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80",
      caption: "Handcrafted espresso pass lit with warm brass practicals.",
    },
    {
      title: "Modern Glasshouse Pavilion",
      category: "Architecture",
      media: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
      caption: "Floor-to-ceiling glass living suite lit at dusk.",
    },
  ];

  const { items: liveGallery1 } = usePublicCollection<any>("gallery_items");
  const { items: liveGallery2 } = usePublicCollection<any>("gallery", defaultGallery);
  const items = liveGallery1.length > 0 ? liveGallery1 : liveGallery2;

  const [activeModalImg, setActiveModalImg] = useState<string | null>(null);

  return (
    <section id="gallery" className="w-full border-t section-padding">
      <div className="shell">
        <SectionHead
          eyebrow="Visual Gallery"
          title="Stills from the field."
          lede="A curatorial look at lighting passes, spatial angles, and architectural details."
        />
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item: any, idx: number) => {
            const mediaUrl = getMediaUrl(
              item.media || item.imageUrl || item.url || item.image || "/placeholder.svg",
            );
            return (
              <div
                key={idx}
                onClick={() => setActiveModalImg(mediaUrl)}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border/60 shadow-xl"
              >
                <img
                  src={mediaUrl}
                  alt={item.title || item.caption || "Gallery item"}
                  width={800}
                  height={1000}
                  className="aspect-4/3 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 p-6 flex flex-col justify-end">
                  <span className="eyebrow text-primary-foreground">
                    {item.category || "Gallery"}
                  </span>
                  <h4 className="font-display text-lg text-white mt-1">{item.title || "Frame"}</h4>
                  {item.caption && (
                    <p className="text-xs text-white/80 mt-1 line-clamp-2">{item.caption}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {activeModalImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          onClick={() => setActiveModalImg(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl">
            <img
              src={activeModalImg}
              alt="Lightbox view"
              className="max-h-[85vh] w-auto object-contain"
            />
            <button
              type="button"
              className="absolute top-4 right-4 rounded-full bg-black/60 p-3 text-white hover:bg-primary"
              onClick={() => setActiveModalImg(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function TeamSection() {
  const defaultTeam = [
    {
      name: "Siddharth Sharma",
      role: "Director & Principal Cinematographer",
      bio: "Over 8 years directing visual campaigns for top luxury resorts and hospitality brands.",
      photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80",
    },
    {
      name: "Ananya Roy",
      role: "Lead Architectural Photographer",
      bio: "Specializes in natural light balance and twilight exterior architectural frames.",
      photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80",
    },
    {
      name: "Rohan Varma",
      role: "360° Spatial & Post Production Lead",
      bio: "Master colorist and Matterport 3D spatial tour developer.",
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
    },
  ];
  const { items: liveTeam1 } = usePublicCollection<any>("team_members");
  const { items: liveTeam2 } = usePublicCollection<any>("team", defaultTeam);
  const items = liveTeam1.length > 0 ? liveTeam1 : liveTeam2;

  return (
    <section id="team" className="w-full border-t section-padding bg-card/20">
      <div className="shell">
        <SectionHead
          eyebrow="The Crew"
          title="Behind the lens."
          lede="Specialization over volume. The artists and technicians on set."
        />
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((member: any, idx: number) => (
            <div
              key={idx}
              className="rounded-2xl border border-border/60 bg-background/95 p-6 shadow-xl"
            >
              <div className="relative h-64 w-full overflow-hidden rounded-xl">
                <img
                  src={getMediaUrl(member.photo || member.image || member.avatar)}
                  alt={member.name}
                  width={600}
                  height={600}
                  className="size-full object-cover"
                />
              </div>
              <h3 className="mt-6 font-display text-2xl text-foreground">{member.name}</h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                {member.role}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const defaultTestimonials = [
    {
      quote:
        "Mirabilis captured our villa with such cinematic warmth that our weekend occupancy surged 40% within a month of launching the campaign.",
      author: "Rohan Deshmukh",
      company: "Founder, Hillside Retreats",
    },
    {
      quote:
        "The 360° virtual tour and night-light food reels set a new standard for our marketing. Guests constantly compliment the aesthetic.",
      author: "Meera Kapoor",
      company: "Marketing Lead, Copper & Charcoal Bistro",
    },
  ];
  const { items: liveTestimonials } = usePublicCollection<any>("testimonials", defaultTestimonials);

  return (
    <section id="testimonials" className="w-full border-t section-padding">
      <div className="shell">
        <SectionHead
          eyebrow="Client Words"
          title="What venue owners say."
          lede="Feedback from founders, resort operators, and marketing directors."
        />
        <div className="mt-16 grid gap-8 sm:grid-cols-2">
          {liveTestimonials.map((t: any, idx: number) => (
            <div
              key={idx}
              className="rounded-2xl border border-border/60 bg-card/40 p-8 shadow-xl relative flex flex-col justify-between"
            >
              <blockquote className="text-lg leading-relaxed text-foreground italic">
                “{t.quote || t.body || t.text}”
              </blockquote>
              <div className="mt-6 border-t border-border/40 pt-4 flex items-center gap-4">
                {t.authorPhoto && (
                  <img
                    src={getMediaUrl(t.authorPhoto)}
                    alt={t.author || t.name}
                    className="size-12 rounded-full object-cover"
                  />
                )}
                <div>
                  <h4 className="font-display text-base font-semibold text-foreground">
                    {t.author || t.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">{t.company || t.role || t.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClientsPartnersSection() {
  const defaultClients = [
    { name: "Hillside Retreats Ltd.", industry: "Hospitality" },
    { name: "Copper & Charcoal Group", industry: "Culinary" },
    { name: "Zenith Living Estates", industry: "Real Estate" },
  ];
  const defaultPartners = [
    { name: "Sony Alpha Cinema India", partnerType: "Equipment Partner" },
    { name: "Matterport 3D Spatial Systems", partnerType: "Technology Partner" },
  ];

  const { items: liveClients } = usePublicCollection<any>("clients", defaultClients);
  const { items: livePartners } = usePublicCollection<any>("partners", defaultPartners);

  return (
    <section id="clients" className="w-full border-t section-padding bg-card/20">
      <div className="shell">
        <SectionHead
          eyebrow="Network & Trust"
          title="Clients & Technology Partners."
          lede="Working alongside visionaries and industry-standard camera platforms."
        />
        <div className="mt-16 grid gap-12 lg:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-6">
              Featured Clients
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {liveClients.map((client: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded-xl border border-border/60 bg-background/80 p-5 text-center shadow-md"
                >
                  <p className="font-display text-lg font-medium text-foreground">{client.name}</p>
                  {client.industry && (
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {client.industry}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-6">
              Equipment & Tech Partners
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {livePartners.map((partner: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded-xl border border-border/60 bg-background/80 p-5 text-center shadow-md"
                >
                  <p className="font-display text-lg font-medium text-foreground">{partner.name}</p>
                  {partner.partnerType && (
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {partner.partnerType}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BlogSection() {
  const defaultBlogs = [
    {
      title: "Why Night Photography Doubles Resort Booking Conversions",
      excerpt:
        "Most travel decisions happen in the evening. Here is how dramatic night lighting drives emotional check-in desires.",
      publishDate: "2026-02-15",
      category: "Hospitality Insights",
      slug: "why-night-photography-doubles-resort-bookings",
      coverImages: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80"],
    },
    {
      title: "How 360° Virtual Tours Engage Modern Travel Shoppers",
      excerpt:
        "Allowing prospective guests to walk through your resort before booking builds unmatched trust.",
      publishDate: "2026-02-10",
      category: "Behind The Lens",
      slug: "how-360-virtual-tours-engage-modern-travel-shoppers",
      coverImages: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80"],
    },
  ];
  const { items: liveBlogs1 } = usePublicCollection<any>("blog_posts");
  const { items: liveBlogs2 } = usePublicCollection<any>("blogs", defaultBlogs);
  const items = liveBlogs1.length > 0 ? liveBlogs1 : liveBlogs2;

  return (
    <section id="blog" className="w-full border-t section-padding">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SectionHead
            eyebrow="Insights & Articles"
            title="Latest from our blog."
            lede="Essays on light, architecture, cinematography, and hospitality marketing."
          />
          <Link
            to="/blog"
            className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary"
          >
            All Articles
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5" />
          </Link>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2">
          {items.slice(0, 2).map((post: any, idx: number) => {
            const cover = Array.isArray(post.coverImages)
              ? post.coverImages[0]
              : post.coverImage || post.image || "/placeholder.svg";
            return (
              <Link
                key={post.slug || idx}
                to="/blog/$slug"
                params={{ slug: post.slug || "why-night-photography-doubles-resort-bookings" }}
                className="group rounded-2xl border border-border/60 bg-card/30 overflow-hidden shadow-xl transition-all duration-500 hover:border-primary flex flex-col justify-between"
              >
                <div className="relative h-56 w-full overflow-hidden">
                  <img
                    src={getMediaUrl(cover)}
                    alt={post.title}
                    width={800}
                    height={500}
                    className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-8">
                  <span className="eyebrow">
                    {post.category || "Insight"} • {post.publishDate || "Feb 2026"}
                  </span>
                  <h3 className="mt-3 font-display text-2xl text-foreground transition-colors group-hover:text-primary">
                    {post.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {post.excerpt || post.summary}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
