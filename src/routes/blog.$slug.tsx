import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { usePublicItemBySlug } from "@/hooks/use-public-content";

export const Route = createFileRoute("/blog/$slug")({
  component: BlogPostPage,
});

function BlogPostPage() {
  const { slug } = Route.useParams();
  const { item: post, isLoading } = usePublicItemBySlug<any>("blog_posts", slug);

  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="border-b pb-16 pt-40">
          <div className="shell max-w-4xl">
            <Link
              to="/blog"
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-primary"
            >
              ← Back to Journal
            </Link>
            {isLoading ? (
              <p className="mt-8 text-sm text-muted-foreground">Loading post...</p>
            ) : !post ? (
              <div className="mt-8 border bg-card p-8">
                <h1 className="font-display text-3xl">Article Not Found</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  The journal article you requested could not be found or is no longer published.
                </p>
              </div>
            ) : (
              <>
                <p className="eyebrow mt-6">
                  {post.category || "Journal"} {post.publishDate ? `· ${post.publishDate}` : ""}
                </p>
                <h1 className="mt-4 font-display text-4xl leading-tight sm:text-6xl">
                  {post.title}
                </h1>
                {post.author && (
                  <p className="mt-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    By {post.author}
                  </p>
                )}
                {post.excerpt && (
                  <p className="mt-6 text-lg leading-relaxed text-muted-foreground font-light">
                    {post.excerpt}
                  </p>
                )}
              </>
            )}
          </div>
        </section>

        {post && (
          <section className="py-16">
            <div className="shell max-w-4xl space-y-8">
              {post.coverImage && (
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="aspect-16/9 w-full border object-cover"
                />
              )}
              <div className="prose prose-invert max-w-none text-base leading-relaxed text-foreground whitespace-pre-line">
                {post.content || post.description || post.body || "No content provided."}
              </div>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
