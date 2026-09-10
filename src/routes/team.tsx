import { createFileRoute } from "@tanstack/react-router";
import { usePublicCollection } from "@/hooks/use-public-content";
import { getMediaUrl } from "@/lib/api-client";

export const Route = createFileRoute("/team")({
  component: TeamPage,
});

function TeamPage() {
  const { items: team, isLoading } = usePublicCollection<any>("team", [
    {
      id: "t-1",
      name: "Ishadutta Maharana",
      role: "Founder & Creative Director",
      bio: "Specializing in twilight cinematography and luxury hospitality visual identity for over 8 years.",
      imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800",
    },
    {
      id: "t-2",
      name: "Aarav Sharma",
      role: "Lead Architectural Photographer",
      bio: "Master of natural light shaping, architectural perspective control, and interior blue-hour capture.",
      imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800",
    },
    {
      id: "t-3",
      name: "Ananya Roy",
      role: "360 Spatial Technician & Colorist",
      bio: "Expert in Matterport 3D spatial capture and Davinci Resolve cinematic color grading pipelines.",
      imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800",
    },
  ]);

  return (
    <main className="min-h-screen bg-background pt-32 pb-24">
      <div className="shell space-y-12">
        <div className="max-w-3xl space-y-4">
          <p className="eyebrow text-primary">THE CREATIVE CREW</p>
          <h1 className="font-display text-4xl font-light text-foreground sm:text-5xl">
            Meet the Studio Team
          </h1>
          <p className="text-muted-foreground text-lg font-light">
            Architectural photographers, film directors, spatial technicians, and colorists based in
            Nagpur, India.
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading team members…</p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((member: any) => (
              <div
                key={member.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-6 shadow-lg transition-all duration-500 hover:border-primary/80 hover:shadow-2xl"
              >
                <div className="space-y-4">
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black/80">
                    <img
                      src={getMediaUrl(member.imageUrl || member.image || member.photoUrl)}
                      alt={member.name}
                      className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>

                  <div>
                    <h3 className="font-display text-2xl font-medium text-foreground">
                      {member.name}
                    </h3>
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary mt-1">
                      {member.role || member.title}
                    </p>
                    <p className="text-sm text-muted-foreground mt-4 leading-relaxed font-light">
                      {member.bio || member.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
