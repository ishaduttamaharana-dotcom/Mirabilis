import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { toast } from "sonner";
import { api, ApiClientError, getMediaUrl } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowDown,
  ArrowUp,
  Check,
  GripVertical,
  Image as ImageIcon,
  Loader2,
  Play,
  Star,
  Trash2,
  Upload,
  Video,
} from "lucide-react";

export interface MediaUploaderItem {
  id?: string;
  url: string;
  mediaType?: "image" | "video";
  posterUrl?: string;
  altText?: string;
  sortOrder?: number;
  isCover?: boolean;
}

export interface AdminMediaUploaderProps {
  /** "single" for 1 file input, "multiple" for gallery lists */
  mode?: "single" | "multiple";
  /** Current list of items (multiple mode) or single URL string (single mode) */
  value?: MediaUploaderItem[] | string;
  /** Callback when media value changes */
  onChange?: (val: any) => void;
  /** Optional callback to persist reordered items directly to API */
  onReorderSave?: (items: MediaUploaderItem[]) => Promise<void> | void;
  /** Allowed file mime types */
  accept?: string;
  /** Allow video uploads */
  allowVideo?: boolean;
  /** Custom title label */
  label?: string;
  /** Max image size MB (default 15) */
  maxImageSizeMb?: number;
  /** Max video size MB (default 1000) */
  maxVideoSizeMb?: number;
}

function formatMb(bytes: number): string {
  if (!bytes) return "0 MB";
  const mb = bytes / (1024 * 1024);
  return mb >= 1000 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`;
}

// Chunked Video Uploader Helper
async function uploadChunkedVideo(
  file: File,
  options: {
    onProgress?: (p: {
      percent: number;
      uploadedBytes: number;
      totalBytes: number;
      speedBytesPerSec: number;
      etaSeconds: number;
      currentChunk: number;
      totalChunks: number;
      status: "idle" | "uploading" | "completed" | "error";
      errorMessage?: string;
      throttled?: boolean;
      retryInSeconds?: number;
    }) => void;
    signal?: AbortSignal;
  },
): Promise<string> {
  const totalBytes = file.size;
  const sizeMb = totalBytes / (1024 * 1024);

  if (sizeMb > 1000) {
    throw new ApiClientError(
      400,
      "FILE_TOO_LARGE",
      `Video is too large (${sizeMb.toFixed(1)} MB). Maximum allowed size is 1000 MB.`,
    );
  }

  const initRes = await api.post<{
    uploadId: string;
    chunkSize: number;
    totalChunks: number;
    maxSizeMb: number;
  }>("/admin/media/upload/init", {
    filename: file.name,
    fileSize: totalBytes,
    mimeType: file.type || "video/mp4",
    altText: file.name,
  });

  const { uploadId, chunkSize, totalChunks } = initRes;
  const startTime = Date.now();
  let uploadedBytes = 0;

  for (let i = 0; i < totalChunks; i++) {
    if (options.signal?.aborted) {
      try {
        await api.delete(`/admin/media/upload/cancel/${uploadId}`);
      } catch {
        /* ignore cancel error */
      }
      throw new Error("Upload cancelled");
    }

    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, totalBytes);
    const chunkBlob = file.slice(start, end);

    const formData = new FormData();
    formData.append("uploadId", uploadId);
    formData.append("chunkIndex", String(i));
    formData.append("file", chunkBlob, `${file.name}.part${i}`);

    let attempt = 0;
    const maxAttempts = 5;
    let success = false;

    while (!success && attempt < maxAttempts) {
      if (options.signal?.aborted) {
        throw new Error("Upload cancelled");
      }

      try {
        await api.postForm("/admin/media/upload/chunk", formData);
        success = true;
      } catch (err: any) {
        attempt++;
        if (attempt >= maxAttempts) throw err;

        let retryDelaySec = Math.pow(2, attempt);
        if (err instanceof ApiClientError && err.status === 429 && err.retryAfter) {
          retryDelaySec = err.retryAfter;
        }

        options.onProgress?.({
          percent: Math.round((uploadedBytes / totalBytes) * 100),
          uploadedBytes,
          totalBytes,
          speedBytesPerSec: 0,
          etaSeconds: 0,
          currentChunk: i + 1,
          totalChunks,
          status: "uploading",
          throttled: true,
          retryInSeconds: retryDelaySec,
        });

        await new Promise((res) => setTimeout(res, retryDelaySec * 1000));
      }
    }

    uploadedBytes = end;
    const elapsedSec = (Date.now() - startTime) / 1000;
    const speed = elapsedSec > 0 ? uploadedBytes / elapsedSec : 0;
    const remainingBytes = totalBytes - uploadedBytes;
    const etaSec = speed > 0 ? remainingBytes / speed : 0;

    options.onProgress?.({
      percent: Math.round((uploadedBytes / totalBytes) * 100),
      uploadedBytes,
      totalBytes,
      speedBytesPerSec: speed,
      etaSeconds: Math.round(etaSec),
      currentChunk: i + 1,
      totalChunks,
      status: "uploading",
      throttled: false,
    });
  }

  const completeRes = await api.post<{ publicUrl?: string; url?: string }>(
    "/admin/media/upload/complete",
    { uploadId },
  );

  const uploadedUrl = completeRes.publicUrl || completeRes.url;
  if (!uploadedUrl) throw new Error("Upload completion failed");
  return getMediaUrl(uploadedUrl);
}

export function AdminMediaUploader({
  mode = "multiple",
  value,
  onChange,
  onReorderSave,
  accept = "image/*,video/*",
  allowVideo = true,
  label,
  maxImageSizeMb = 15,
  maxVideoSizeMb = 1000,
}: AdminMediaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderSavedSuccess, setOrderSavedSuccess] = useState(false);

  // Upload Progress State
  const [uploadProgress, setUploadProgress] = useState<{
    fileName: string;
    percent: number;
    uploadedBytes: number;
    totalBytes: number;
    speedBytesPerSec: number;
    etaSeconds: number;
    currentChunk: number;
    totalChunks: number;
    status: "idle" | "uploading" | "completed" | "error";
    errorMessage?: string;
    throttled?: boolean;
    retryInSeconds?: number;
  } | null>(null);

  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Normalize value to array of MediaUploaderItem
  const items: MediaUploaderItem[] = Array.isArray(value)
    ? value.map((item, idx) =>
        typeof item === "string"
          ? { id: `item-${idx}`, url: item, sortOrder: idx + 1 }
          : { ...item, sortOrder: item.sortOrder ?? idx + 1 },
      )
    : typeof value === "string" && value.trim()
      ? [{ id: "single-item", url: value, sortOrder: 1 }]
      : [];

  const singleValueUrl =
    mode === "single" ? (typeof value === "string" ? value : items[0]?.url || "") : "";

  // Helper to commit updated items
  async function notifyChange(newItems: MediaUploaderItem[]) {
    // Recalculate sequence numbers
    const updated = newItems.map((item, idx) => ({
      ...item,
      sortOrder: idx + 1,
    }));

    if (mode === "single") {
      onChange?.(updated[0]?.url || "");
    } else {
      onChange?.(updated);
    }

    if (onReorderSave) {
      setSavingOrder(true);
      setOrderSavedSuccess(false);
      try {
        await onReorderSave(updated);
        setOrderSavedSuccess(true);
        setTimeout(() => setOrderSavedSuccess(false), 2500);
      } catch (err: any) {
        toast.error("Failed to save sequence order");
      } finally {
        setSavingOrder(false);
      }
    }
  }

  // Upload single file handler
  async function uploadFile(file: File): Promise<MediaUploaderItem> {
    const isVid = file.type.startsWith("video/") || file.name.match(/\.(mp4|webm|mov)$/i);
    const sizeMb = file.size / (1024 * 1024);

    if (isVid && !allowVideo) {
      throw new ApiClientError(400, "INVALID_TYPE", "Videos are not allowed in this upload field.");
    }

    if (isVid && sizeMb > maxVideoSizeMb) {
      throw new ApiClientError(
        400,
        "FILE_TOO_LARGE",
        `Video exceeds ${maxVideoSizeMb}MB size limit.`,
      );
    }

    if (!isVid && sizeMb > maxImageSizeMb) {
      throw new ApiClientError(
        400,
        "FILE_TOO_LARGE",
        `Image exceeds ${maxImageSizeMb}MB size limit.`,
      );
    }

    if (isVid) {
      const controller = new AbortController();
      setAbortController(controller);
      setUploadProgress({
        fileName: file.name,
        percent: 0,
        uploadedBytes: 0,
        totalBytes: file.size,
        speedBytesPerSec: 0,
        etaSeconds: 0,
        currentChunk: 1,
        totalChunks: Math.ceil(file.size / (20 * 1024 * 1024)),
        status: "uploading",
      });

      try {
        const url = await uploadChunkedVideo(file, {
          signal: controller.signal,
          onProgress: (p) => setUploadProgress((prev) => (prev ? { ...prev, ...p } : null)),
        });

        setUploadProgress((prev) => (prev ? { ...prev, percent: 100, status: "completed" } : null));
        return {
          url,
          mediaType: "video",
          altText: file.name,
        };
      } finally {
        setAbortController(null);
      }
    } else {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("altText", file.name);

      const res = await api.postForm<{ publicUrl?: string; url?: string }>(
        "/admin/media/upload",
        formData,
      );
      const uploaded = res.publicUrl || res.url;
      if (!uploaded) throw new Error("Upload failed");
      return {
        url: getMediaUrl(uploaded),
        mediaType: "image",
        altText: file.name,
      };
    }
  }

  // Handle incoming FileList from drop or file input
  async function processFiles(files: FileList | File[]) {
    if (!files || files.length === 0) return;
    setUploading(true);

    const uploadedList: MediaUploaderItem[] = [];
    const fileArray = Array.from(files);

    try {
      for (const file of fileArray) {
        try {
          const item = await uploadFile(file);
          uploadedList.push(item);
          toast.success(`Uploaded ${file.name}`);
        } catch (err: any) {
          const msg =
            err instanceof ApiClientError
              ? err.message
              : err?.message || `Failed to upload ${file.name}`;
          toast.error(msg);
        }
      }

      if (uploadedList.length > 0) {
        if (mode === "single" && uploadedList[0]) {
          await notifyChange([uploadedList[0]]);
        } else {
          await notifyChange([...items, ...uploadedList]);
        }
      }
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  // Handle File Input Change
  function handleFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      processFiles(e.target.files);
    }
    e.target.value = "";
  }

  // Replace single item handler
  async function handleReplaceInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || replaceIndex === null || !items[replaceIndex]) return;

    setUploading(true);
    try {
      const newItem = await uploadFile(file);
      const updated = [...items];
      const target = updated[replaceIndex];
      if (target) {
        updated[replaceIndex] = {
          ...target,
          url: newItem.url,
          mediaType: newItem.mediaType ?? "image",
        };
        await notifyChange(updated);
        toast.success("Media replaced!");
      }
    } catch (err: any) {
      toast.error(err?.message || "Replacement failed");
    } finally {
      setUploading(false);
      setReplaceIndex(null);
      e.target.value = "";
    }
  }

  // Drag & Drop Handlers for Dropzone
  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }

  // Drag & Drop Reordering Handlers
  function handleItemDragStart(e: DragEvent<HTMLDivElement>, index: number) {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  }

  function handleItemDragOver(e: DragEvent<HTMLDivElement>, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  async function handleItemDrop(e: DragEvent<HTMLDivElement>, targetIndex: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex || !items[draggedIndex]) return;

    const reordered = [...items];
    const movedItem = reordered.splice(draggedIndex, 1)[0];
    if (movedItem) {
      reordered.splice(targetIndex, 0, movedItem);
      setDraggedIndex(null);
      await notifyChange(reordered);
    }
  }

  // Move Up / Move Down Button Handlers
  async function moveItem(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length || !items[index]) return;

    const reordered = [...items];
    const movedItem = reordered.splice(index, 1)[0];
    if (movedItem) {
      reordered.splice(targetIndex, 0, movedItem);
      await notifyChange(reordered);
    }
  }

  // Remove Item
  async function removeItem(index: number) {
    const updated = items.filter((_, i) => i !== index);
    await notifyChange(updated);
    toast.info("Media removed");
  }

  // Set Cover Image
  async function setCoverItem(index: number) {
    const updated = items.map((item, i) => ({
      ...item,
      isCover: i === index,
    }));
    await notifyChange(updated);
    toast.success(`Set ${items[index]?.altText || `item ${index + 1}`} as cover`);
  }

  return (
    <div className="space-y-4 w-full">
      {/* Dropzone Header Status */}
      <div className="flex items-center justify-between">
        {label && <span className="text-sm font-medium text-foreground">{label}</span>}
        {savingOrder && (
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-medium animate-pulse">
            <Loader2 className="size-3 animate-spin" />
            Saving order…
          </span>
        )}
        {orderSavedSuccess && (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <Check className="size-3.5" />✓ Order saved
          </span>
        )}
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={mode === "multiple"}
        accept={accept}
        className="hidden"
        onChange={handleFileInputChange}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleReplaceInputChange}
      />

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-300 ${
          isDragOver
            ? "border-primary bg-primary/10 scale-[1.01]"
            : "border-border/80 bg-background/40 hover:border-primary/60 hover:bg-card/40"
        }`}
      >
        <div className="rounded-full bg-primary/10 p-3 text-primary mb-3 transition-transform group-hover:scale-110">
          <Upload className="size-6" />
        </div>
        <p className="text-sm font-semibold text-foreground">
          {isDragOver ? "Drop files here to upload" : "Drag & drop files here"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          or <span className="text-primary font-medium underline">Browse Files</span>
        </p>
        <p className="mt-2 text-[11px] text-muted-foreground/80">
          JPG, PNG, WEBP {allowVideo && "• MP4, WEBM, MOV up to 1000MB"}
        </p>
      </div>

      {/* Upload Progress Banner */}
      {uploadProgress && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium truncate max-w-[260px] text-foreground">
              {uploadProgress.fileName} ({formatMb(uploadProgress.totalBytes)})
            </span>
            <span className="font-semibold text-primary">{uploadProgress.percent}%</span>
          </div>

          <Progress value={uploadProgress.percent} className="h-2" />

          <div className="flex items-center justify-between text-[11px]">
            <div>
              {uploadProgress.status === "uploading" && (
                <span className="text-muted-foreground">
                  {uploadProgress.throttled ? (
                    <span className="text-amber-400 font-medium">
                      Upload throttled — retrying chunk {uploadProgress.currentChunk}/
                      {uploadProgress.totalChunks} in {uploadProgress.retryInSeconds}s…
                    </span>
                  ) : (
                    <>
                      {formatMb(uploadProgress.uploadedBytes)} /{" "}
                      {formatMb(uploadProgress.totalBytes)} • Chunk {uploadProgress.currentChunk}/
                      {uploadProgress.totalChunks} •{" "}
                      {(uploadProgress.speedBytesPerSec / (1024 * 1024)).toFixed(1)} MB/s
                    </>
                  )}
                </span>
              )}
              {uploadProgress.status === "completed" && (
                <span className="text-emerald-400 font-medium">✓ Upload complete</span>
              )}
            </div>

            {uploadProgress.status === "uploading" && abortController && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={(e) => {
                  e.stopPropagation();
                  abortController.abort();
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Single Mode Preview Display */}
      {mode === "single" && singleValueUrl && (
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative h-32 w-44 shrink-0 overflow-hidden rounded-xl bg-black">
            {singleValueUrl.match(/\.(mp4|webm|mov)$/i) ? (
              <video
                src={getMediaUrl(singleValueUrl)}
                preload="metadata"
                className="size-full object-cover"
              />
            ) : (
              <img
                src={getMediaUrl(singleValueUrl)}
                alt="Preview"
                className="size-full object-cover"
              />
            )}
          </div>
          <div className="flex flex-1 flex-col justify-between space-y-3 w-full">
            <div className="truncate text-xs font-mono text-muted-foreground">{singleValueUrl}</div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setReplaceIndex(0);
                  replaceInputRef.current?.click();
                }}
              >
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => notifyChange([])}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Multiple Gallery Draggable Cards Grid */}
      {mode === "multiple" && items.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>{items.length} item(s) in gallery — drag ≡ or use ↑↓ to reorder sequence</span>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, idx) => {
              const isVid = item.mediaType === "video" || item.url.match(/\.(mp4|webm|mov)$/i);
              const seqNum = String(idx + 1).padStart(2, "0");

              return (
                <div
                  key={item.id || idx}
                  draggable
                  onDragStart={(e) => handleItemDragStart(e, idx)}
                  onDragOver={(e) => handleItemDragOver(e, idx)}
                  onDrop={(e) => handleItemDrop(e, idx)}
                  onDragEnd={() => setDraggedIndex(null)}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border transition-all duration-300 ${
                    draggedIndex === idx
                      ? "opacity-40 scale-95 border-primary"
                      : "border-border/60 bg-card/60 hover:border-primary/80 hover:shadow-xl"
                  }`}
                >
                  {/* Media Thumbnail Container */}
                  <div className="relative h-44 w-full overflow-hidden bg-black/80">
                    {isVid ? (
                      <div className="relative size-full">
                        <video
                          src={getMediaUrl(item.url)}
                          poster={item.posterUrl ? getMediaUrl(item.posterUrl) : undefined}
                          preload="metadata"
                          className="size-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <div className="rounded-full bg-primary/90 p-2.5 text-primary-foreground shadow-lg">
                            <Play className="size-5 fill-current ml-0.5" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={getMediaUrl(item.url)}
                        alt={item.altText || `Gallery image ${idx + 1}`}
                        className="size-full object-cover"
                      />
                    )}

                    {/* Sequence Badge */}
                    <div className="absolute top-2 left-2 rounded-md bg-black/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold font-mono text-primary shadow">
                      {seqNum}
                    </div>

                    {/* Cover Badge */}
                    {item.isCover && (
                      <div className="absolute top-2 right-2 rounded-md bg-amber-500 text-black px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider shadow">
                        ★ COVER
                      </div>
                    )}
                  </div>

                  {/* Card Controls Footer */}
                  <div className="p-3 bg-background/80 backdrop-blur-md flex items-center justify-between gap-2 border-t border-border/40">
                    {/* Drag Handle & Sequence controls */}
                    <div className="flex items-center gap-1">
                      <div
                        title="Drag to reorder"
                        className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
                      >
                        <GripVertical className="size-4" />
                      </div>
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveItem(idx, "up")}
                        title="Move Up"
                        className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        <ArrowUp className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === items.length - 1}
                        onClick={() => moveItem(idx, "down")}
                        title="Move Down"
                        className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        <ArrowDown className="size-3.5" />
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCoverItem(idx)}
                        title={item.isCover ? "Primary Cover" : "Set as Cover"}
                        className={`p-1.5 rounded transition-colors ${
                          item.isCover
                            ? "text-amber-400"
                            : "text-muted-foreground hover:text-amber-400"
                        }`}
                      >
                        <Star className="size-3.5 fill-current" />
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => {
                          setReplaceIndex(idx);
                          replaceInputRef.current?.click();
                        }}
                      >
                        Replace
                      </Button>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        title="Remove media"
                        className="p-1.5 rounded text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
