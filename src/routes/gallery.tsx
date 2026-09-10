import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { usePublicCollection } from "@/hooks/use-public-content";
import { getMediaUrl } from "@/lib/api-client";
import { Maximize2, Play, X } from "lucide-react";

export const Route = createFileRoute("/gallery")({
  component: GalleryPage,
});

function GalleryPage() {
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);

  const { items: galleryItems, isLoading } = usePublicCollection<any>("gallery", [
    {
      id: "gal-1",
      title: "The Grand Pavilion Twilight Pass",
      category: "Architectural",
      mediaType: "image",
      imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1200",
    },
    {
      id: "gal-2",
      title: "Infinity Pool Blue Hour Reflections",
      category: "Hospitality",
      mediaType: "image",
      imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200",
    },
    {
      id: "gal-3",
      title: "Atmospheric Dining Room Still",
      category: "Interiors",
      mediaType: "image",
      imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200",
    },
    {
      id: "gal-4",
      title: "Penthouse Sunset Balcony View",
      category: "Real Estate",
      mediaType: "image",
      imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200",
    },
  ]);

  return (
    <main className="min-h-screen bg-background pt-32 pb-24">
      <div className="shell space-y-12">
        <div className="max-w-3xl space-y-4">
          <p className="eyebrow text-primary">PORTFOLIO STILLS & REELS</p>
          <h1 className="font-display text-4xl font-light text-foreground sm:text-5xl">
            Visual Media Gallery
          </h1>
          <p className="text-muted-foreground text-lg font-light">
            High-resolution architectural photography stills, dusk passes, and video frame captures.
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading gallery…</p>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {galleryItems.map((item: any) => {
              const src = getMediaUrl(item.imageUrl || item.image || item.url);
              const isVid = item.mediaType === "video" || src.match(/\.(mp4|webm|mov)$/i);

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedMedia(item)}
                  className="group relative aspect-4/3 cursor-pointer overflow-hidden rounded-2xl border border-border/60 bg-black shadow-lg transition-all duration-500 hover:border-primary/80 hover:shadow-2xl"
                >
                  {isVid ? (
                    <div className="relative size-full">
                      <video src={src} preload="metadata" className="size-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="rounded-full bg-primary/90 p-3 text-primary-foreground shadow-lg">
                          <Play className="size-6 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={src}
                      alt={item.title || "Gallery Item"}
                      className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 p-5 flex flex-col justify-between">
                    <span className="self-end rounded-full bg-black/60 backdrop-blur-md p-2 text-white">
                      <Maximize2 className="size-4" />
                    </span>
                    <div>
                      {item.category && (
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                          {item.category}
                        </p>
                      )}
                      <h3 className="font-display text-base font-medium text-white">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-xl"
          onClick={() => setSelectedMedia(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] w-full overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full pb-4 border-b border-border/40">
              <div>
                <h3 className="font-display text-xl text-foreground">{selectedMedia.title}</h3>
                {selectedMedia.category && (
                  <p className="text-xs text-primary font-medium">{selectedMedia.category}</p>
                )}
              </div>
              <button
                type="button"
                className="rounded-full bg-muted p-2.5 text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => setSelectedMedia(null)}
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="my-6 max-h-[70vh] w-full flex items-center justify-center overflow-hidden rounded-2xl bg-black">
              {selectedMedia.mediaType === "video" ||
              (selectedMedia.imageUrl || selectedMedia.url || "").match(/\.(mp4|webm|mov)$/i) ? (
                <video
                  src={getMediaUrl(selectedMedia.imageUrl || selectedMedia.url)}
                  controls
                  autoPlay
                  className="max-h-[70vh] w-auto max-w-full"
                />
              ) : (
                <img
                  src={getMediaUrl(selectedMedia.imageUrl || selectedMedia.url)}
                  alt={selectedMedia.title}
                  className="max-h-[70vh] w-auto object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
