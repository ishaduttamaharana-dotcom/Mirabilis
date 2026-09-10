import { createFileRoute, Link } from "@tanstack/react-router";
import { usePublicCollection } from "@/hooks/use-public-content";
import { getMediaUrl } from "@/lib/api-client";
import { ShoppingBag, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/products")({
  component: ProductsPage,
});

function ProductsPage() {
  const { items: products, isLoading } = usePublicCollection<any>("products", [
    {
      id: "prod-1",
      title: "Cinematic LUT Preset Collection 2026",
      subtitle: "Color profiles for Sony S-Log3 & Canon C-Log2",
      description:
        "12 handcrafted cinematic LUTs calibrated specifically for luxury hospitality, architectural interiors, and dusk video footage.",
      price: "₹4,999",
      imageUrl: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=1200",
      ctaLabel: "Buy LUT Pack",
    },
    {
      id: "prod-2",
      title: "Arch-Viz Fine Art Print Series",
      subtitle: "Limited Edition Metallic Canvas Prints",
      description:
        "Museum-grade metallic canvas prints signed by lead photographer, measuring 36x24 inches.",
      price: "₹18,500",
      imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200",
      ctaLabel: "Order Fine Art Print",
    },
  ]);

  return (
    <main className="min-h-screen bg-background pt-32 pb-24">
      <div className="shell space-y-12">
        <div className="max-w-3xl space-y-4">
          <p className="eyebrow text-primary">MIRABILIS STORE</p>
          <h1 className="font-display text-4xl font-light text-foreground sm:text-5xl">
            Digital Assets & Fine Art Prints
          </h1>
          <p className="text-muted-foreground text-lg font-light">
            Color profiles, preset packs, and museum-grade physical prints created in our studio.
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading products…</p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((item: any) => (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-5 shadow-lg transition-all duration-500 hover:border-primary/80 hover:shadow-2xl"
              >
                <div className="space-y-4">
                  <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-black/80">
                    <img
                      src={getMediaUrl(item.imageUrl || item.image)}
                      alt={item.title}
                      className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-3 right-3 rounded-full bg-primary/90 backdrop-blur-md px-3.5 py-1 text-xs font-semibold text-primary-foreground shadow-lg">
                      {item.price}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-display text-xl font-medium text-foreground">
                      {item.title}
                    </h3>
                    {item.subtitle && (
                      <p className="text-xs text-primary font-medium mt-1">{item.subtitle}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-3 leading-relaxed font-light">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="pt-6">
                  <Link
                    to="/contact"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border/80 bg-background/50 py-3 text-xs font-semibold uppercase tracking-widest text-foreground transition-all duration-300 group-hover:bg-primary group-hover:border-primary group-hover:text-primary-foreground"
                  >
                    <ShoppingBag className="size-4" />
                    {item.ctaLabel || "Purchase / Enquire"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
