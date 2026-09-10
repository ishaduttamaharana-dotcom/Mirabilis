import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiClientError, getMediaUrl, paginatedQuery } from "@/lib/api-client";
import { AdminMediaUploader } from "@/components/admin/admin-media-uploader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Film, Image as ImageIcon, Play, Trash2, X } from "lucide-react";

interface MediaItem {
  id: string;
  key: string;
  category: string;
  url: string;
  mimeType: string;
  size: number;
  referenceCount: number;
  altText: string;
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function AdminMediaPage() {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<string | undefined>();
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-media", category],
    queryFn: () => paginatedQuery<MediaItem>("/admin/media", { page: 1, page_size: 100, category }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/media/${id}`),
    onSuccess: () => {
      toast.success("Deleted media item");
      queryClient.invalidateQueries({ queryKey: ["admin-media"] });
      if (previewMedia) setPreviewMedia(null);
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiClientError
          ? err.message
          : "Delete failed — it may still be referenced by content",
      ),
  });

  function copyUrl(url: string) {
    const fullUrl = getMediaUrl(url);
    navigator.clipboard.writeText(fullUrl);
    toast.success("Public URL copied to clipboard");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Media Library</h1>
          <p className="text-sm text-muted-foreground">
            Manage, preview, and upload high-res images and videos across all CMS collections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={category ?? "all"}
            onValueChange={(v) => setCategory(v === "all" ? undefined : v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All media types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="images">Images</SelectItem>
              <SelectItem value="videos">Videos</SelectItem>
              <SelectItem value="documents">Documents</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Global Drag & Drop Upload Zone */}
      <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
        <AdminMediaUploader
          mode="multiple"
          label="Upload new media (Drag & drop multiple images or videos)"
          allowVideo={true}
          onChange={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-media"] });
          }}
        />
      </div>

      {/* Media Grid Header */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Media Assets ({data?.items.length || 0})
        </h2>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading media items…</p>}
      {!isLoading && data?.items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center text-muted-foreground">
          No media uploaded yet. Use the upload zone above to drop images and videos.
        </div>
      )}

      {/* Media Gallery Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {data?.items.map((item) => {
          const isVid =
            item.category === "videos" ||
            item.mimeType?.startsWith("video/") ||
            item.url.match(/\.(mp4|webm|mov)$/i);
          const fullMediaUrl = getMediaUrl(item.url);

          return (
            <div
              key={item.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/60 bg-card/60 shadow-md transition-all duration-300 hover:border-primary/80 hover:shadow-xl"
            >
              {/* Media Thumbnail Container */}
              <div
                className="relative aspect-square w-full cursor-pointer overflow-hidden bg-black/80"
                onClick={() => setPreviewMedia(item)}
              >
                {isVid ? (
                  <div className="relative size-full flex items-center justify-center">
                    <video
                      src={fullMediaUrl}
                      preload="metadata"
                      className="size-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="rounded-full bg-primary/90 p-2.5 text-primary-foreground shadow-lg transition-transform group-hover:scale-110">
                        <Play className="size-5 fill-current ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute top-2 left-2 rounded bg-black/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                      VIDEO
                    </span>
                  </div>
                ) : item.category === "images" || item.mimeType?.startsWith("image/") ? (
                  <div className="relative size-full">
                    <img
                      src={fullMediaUrl}
                      alt={item.altText || item.key}
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute top-2 left-2 rounded bg-black/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                      IMAGE
                    </span>
                  </div>
                ) : (
                  <div className="flex size-full items-center justify-center bg-muted text-xs uppercase text-muted-foreground font-mono">
                    {item.mimeType || item.category}
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-between p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-white/80">
                      {formatBytes(item.size)}
                    </span>
                    <span className="text-[10px] font-semibold text-primary">
                      {item.referenceCount} refs
                    </span>
                  </div>
                  <div className="text-center text-xs text-white font-medium truncate">
                    Click to Preview
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between p-2.5 bg-background/90 text-xs border-t border-border/40">
                <span
                  className="truncate max-w-[110px] text-[11px] font-mono text-muted-foreground"
                  title={item.altText || item.key}
                >
                  {item.altText || item.key}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    title="Copy Public URL"
                    onClick={() => copyUrl(item.url)}
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <Copy className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    title={
                      item.referenceCount > 0
                        ? `Referenced by ${item.referenceCount} content item(s) — remove references first`
                        : "Delete media"
                    }
                    disabled={item.referenceCount > 0}
                    onClick={() => deleteMutation.mutate(item.id)}
                    className="p-1 rounded text-muted-foreground hover:text-destructive disabled:opacity-30"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Preview Modal */}
      {previewMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          onClick={() => setPreviewMedia(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full pb-4 border-b border-border/40">
              <div className="truncate">
                <h3 className="font-display text-lg text-foreground truncate">
                  {previewMedia.altText || previewMedia.key}
                </h3>
                <p className="text-xs text-muted-foreground font-mono">
                  {previewMedia.mimeType} • {formatBytes(previewMedia.size)} •{" "}
                  {previewMedia.referenceCount} reference(s)
                </p>
              </div>
              <button
                type="button"
                className="rounded-full bg-muted p-2 text-foreground hover:bg-primary hover:text-primary-foreground"
                onClick={() => setPreviewMedia(null)}
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="my-6 max-h-[60vh] w-full flex items-center justify-center overflow-hidden rounded-xl bg-black">
              {previewMedia.category === "videos" ||
              previewMedia.mimeType?.startsWith("video/") ||
              previewMedia.url.match(/\.(mp4|webm|mov)$/i) ? (
                <video
                  src={getMediaUrl(previewMedia.url)}
                  controls
                  autoPlay
                  className="max-h-[60vh] w-auto max-w-full"
                />
              ) : (
                <img
                  src={getMediaUrl(previewMedia.url)}
                  alt={previewMedia.altText}
                  className="max-h-[60vh] w-auto object-contain"
                />
              )}
            </div>

            <div className="flex items-center justify-between w-full pt-2">
              <span className="text-xs font-mono text-muted-foreground truncate max-w-md">
                {getMediaUrl(previewMedia.url)}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => copyUrl(previewMedia.url)}
                  className="rounded-full border border-primary/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Copy URL
                </button>
                <button
                  type="button"
                  disabled={previewMedia.referenceCount > 0}
                  onClick={() => deleteMutation.mutate(previewMedia.id)}
                  className="rounded-full border border-destructive/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-destructive hover:bg-destructive hover:text-white disabled:opacity-40"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
