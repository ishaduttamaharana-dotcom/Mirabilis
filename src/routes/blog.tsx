import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { usePublicCollection } from "@/hooks/use-public-content";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Journal & Insights — Mirabilis" },
      {
        name: "description",
        content:
          "Articles on hospitality photography, brand filmmaking, lighting, and visual production in Nagpur and central India.",
      },
    ],
  }),
  component: BlogPage,
});

function BlogPage() {
  const { items: posts, isLoading } = usePublicCollection<any>("blog_posts", []);

  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="border-b pb-16 pt-40">
          <div className="shell">
            <p className="eyebrow">Journal</p>
            <h1 className="mt-5 max-w-3xl font-display text-5xl leading-tight sm:text-7xl">
              Insights & Stories.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              Notes on lighting, production workflows, hospitality branding, and behind-the-scenes
              craft.
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="shell">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading journal articles...</p>
            ) : posts.length === 0 ? (
              <div className="border bg-card p-12 text-center">
                <p className="font-display text-2xl">No articles published yet.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Check back soon for stories and photography guides.
                </p>
              </div>
            ) : (
              <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post: any) => (
                  <article key={post.slug || post.id} className="group border bg-background p-6">
                    {post.coverImage && (
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="mb-4 aspect-16/9 w-full object-cover"
                      />
                    )}
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {post.category || "Journal"} {post.publishDate ? `· ${post.publishDate}` : ""}
                    </p>
                    <h2 className="mt-2 font-display text-2xl transition-colors group-hover:text-primary">
                      {post.title}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                      {post.excerpt || post.description}
                    </p>
                    <Link
                      to="/blog/$slug"
                      params={{ slug: post.slug }}
                      className="mt-6 inline-block text-xs uppercase tracking-[0.2em] text-primary"
                    >
                      Read story →
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
