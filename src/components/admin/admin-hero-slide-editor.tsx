import { useState, type ChangeEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiClientError, getMediaUrl } from "@/lib/api-client";
import { AdminMediaUploader } from "@/components/admin/admin-media-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowUpRight,
  Eye,
  Film,
  Image as ImageIcon,
  Play,
  RotateCcw,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";

export interface HeroSlideData {
  id?: string;
  eyebrow?: string;
  headline?: string;
  title?: string;
  subhead?: string;
  quote?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  primaryCtaShow?: boolean;
  primaryCtaNewTab?: boolean;
  secondaryCtaLabel?: string;
  secondaryCtaUrl?: string;
  secondaryCtaShow?: boolean;
  secondaryCtaNewTab?: boolean;
  mediaType?: "image" | "video";
  imageUrl?: string;
  media?: string;
  imagePosition?: string;
  altText?: string;
  videoSource?: string;
  videoUrl?: string;
  posterUrl?: string;
  posterImage?: string;
  videoAutoplay?: boolean;
  videoMuted?: boolean;
  videoLoop?: boolean;
  videoPlayInline?: boolean;
  overlayEnabled?: boolean;
  overlayType?: string;
  overlayOpacity?: number;
  horizontalPos?: "left" | "center" | "right";
  verticalPos?: "top" | "center" | "bottom";
  mobileImageUrl?: string;
  mobileVideoUrl?: string;
  mobileMedia?: string;
  slideDuration?: number;
  transitionDuration?: number;
  visible?: boolean;
  sortOrder?: number;
}

export function AdminHeroSlideEditor({
  initial,
  onClose,
}: {
  initial: HeroSlideData | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const queryKey = ["admin-collection", "hero_slides"];

  // 1. Text content
  const [eyebrow, setEyebrow] = useState(initial?.eyebrow ?? "VISUAL PRODUCTION STUDIO");
  const [headline, setHeadline] = useState(
    initial?.headline ?? initial?.title ?? "Golden hour and after dark, in one story.",
  );
  const [subhead, setSubhead] = useState(
    initial?.subhead ??
      "Photography · Videography · 360° Virtual Tours for Hospitality & Lifestyle Spaces.",
  );
  const [quote, setQuote] = useState(initial?.quote ?? "We capture the light that sells the room.");

  // 2. Media resolution from initial object
  const initialIsVideo =
    initial?.mediaType === "video" ||
    !!initial?.videoUrl ||
    !!(initial as any)?.backgroundVideo ||
    (typeof initial?.media === "string" && initial.media.endsWith(".mp4")) ||
    (typeof (initial as any)?.backgroundMedia === "string" &&
      (initial as any).backgroundMedia.endsWith(".mp4")) ||
    (typeof (initial as any)?.mediaUrl === "string" && (initial as any).mediaUrl.endsWith(".mp4"));

  const [mediaType, setMediaType] = useState<"image" | "video">(
    initial?.mediaType ?? (initialIsVideo ? "video" : "image"),
  );

  const initialImageUrl =
    initial?.imageUrl ||
    (initial as any)?.backgroundImage ||
    (!initialIsVideo
      ? (initial as any)?.backgroundMedia || (initial as any)?.mediaUrl || initial?.media
      : "") ||
    "";

  const initialVideoUrl =
    initial?.videoUrl ||
    (initial as any)?.backgroundVideo ||
    (initialIsVideo
      ? (initial as any)?.backgroundMedia || (initial as any)?.mediaUrl || initial?.media
      : "") ||
    "";

  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [imagePosition, setImagePosition] = useState(initial?.imagePosition ?? "center");
  const [altText, setAltText] = useState(initial?.altText ?? "Hero background image");

  const [videoUrl, setVideoUrl] = useState(initialVideoUrl);
  const [posterUrl, setPosterUrl] = useState(initial?.posterUrl ?? initial?.posterImage ?? "");
  const [videoAutoplay, setVideoAutoplay] = useState(initial?.videoAutoplay ?? true);
  const [videoMuted, setVideoMuted] = useState(initial?.videoMuted ?? true);
  const [videoLoop, setVideoLoop] = useState(initial?.videoLoop ?? true);
  const [videoPlayInline, setVideoPlayInline] = useState(initial?.videoPlayInline ?? true);

  const [mobileImageUrl, setMobileImageUrl] = useState(
    initial?.mobileImageUrl ?? initial?.mobileMedia ?? "",
  );
  const [mobileVideoUrl, setMobileVideoUrl] = useState(initial?.mobileVideoUrl ?? "");

  // 3. Overlay
  const [overlayEnabled, setOverlayEnabled] = useState(initial?.overlayEnabled ?? true);
  const [overlayType, setOverlayType] = useState(initial?.overlayType ?? "solid");
  const [overlayOpacity, setOverlayOpacity] = useState(initial?.overlayOpacity ?? 65);

  // 4. Alignment / Positioning
  const [horizontalPos, setHorizontalPos] = useState<"left" | "center" | "right">(
    initial?.horizontalPos ?? "left",
  );
  const [verticalPos, setVerticalPos] = useState<"top" | "center" | "bottom">(
    initial?.verticalPos ?? "bottom",
  );

  // 5. CTAs
  const [primaryCtaShow, setPrimaryCtaShow] = useState(initial?.primaryCtaShow ?? true);
  const [ctaLabel, setCtaLabel] = useState(initial?.ctaLabel ?? "Start a project");
  const [ctaUrl, setCtaUrl] = useState(initial?.ctaUrl ?? "/contact");
  const [primaryCtaNewTab, setPrimaryCtaNewTab] = useState(initial?.primaryCtaNewTab ?? false);

  const [secondaryCtaShow, setSecondaryCtaShow] = useState(initial?.secondaryCtaShow ?? true);
  const [secondaryCtaLabel, setSecondaryCtaLabel] = useState(
    initial?.secondaryCtaLabel ?? "View work",
  );
  const [secondaryCtaUrl, setSecondaryCtaUrl] = useState(initial?.secondaryCtaUrl ?? "/work");
  const [secondaryCtaNewTab, setSecondaryCtaNewTab] = useState(
    initial?.secondaryCtaNewTab ?? false,
  );

  // 6. Settings
  const [slideDuration, setSlideDuration] = useState(initial?.slideDuration ?? 7);
  const [transitionDuration, setTransitionDuration] = useState(initial?.transitionDuration ?? 1.2);
  const [visible, setVisible] = useState(initial?.visible ?? true);
  const [sortOrder, setSortOrder] = useState<number>(initial?.sortOrder ?? 0);

  const [uploading, setUploading] = useState(false);

  // Video Chunked Upload State
  interface VideoUploadProgress {
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
  }

  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState<VideoUploadProgress | null>(null);
  const [videoFileName, setVideoFileName] = useState("");
  const [videoAbortController, setVideoAbortController] = useState<AbortController | null>(null);

  function formatMb(bytes: number): string {
    if (!bytes) return "0 MB";
    const mb = bytes / (1024 * 1024);
    return mb >= 1000 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`;
  }

  async function uploadChunkedVideo(
    file: File,
    options: {
      onProgress?: (p: VideoUploadProgress) => void;
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

    // Call init ONCE at start of upload
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

      // Retry chunk loop with exponential backoff & 429 Retry-After handling
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
          if (attempt >= maxAttempts) {
            throw err;
          }

          let retryDelaySec = Math.pow(2, attempt);
          if (err instanceof ApiClientError && err.status === 429) {
            if (err.retryAfter && typeof err.retryAfter === "number") {
              retryDelaySec = err.retryAfter;
            }
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

  async function handleVideoUploadSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > 1000) {
      toast.error(`Video is too large (${sizeMb.toFixed(1)} MB). Maximum allowed size is 1000 MB.`);
      return;
    }

    setVideoFileName(file.name);
    setUploadingVideo(true);
    const controller = new AbortController();
    setVideoAbortController(controller);

    setVideoProgress({
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
        onProgress: (p) => setVideoProgress(p),
      });
      setVideoUrl(url);
      setVideoProgress({
        percent: 100,
        uploadedBytes: file.size,
        totalBytes: file.size,
        speedBytesPerSec: 0,
        etaSeconds: 0,
        currentChunk: Math.ceil(file.size / (20 * 1024 * 1024)),
        totalChunks: Math.ceil(file.size / (20 * 1024 * 1024)),
        status: "completed",
      });
      toast.success("Video uploaded successfully!");
    } catch (err: any) {
      if (controller.signal?.aborted) {
        toast.info("Video upload cancelled.");
        setVideoProgress(null);
      } else {
        const msg =
          err instanceof ApiClientError ? err.message : err?.message || "Video upload failed";
        toast.error(msg);
        setVideoProgress({
          percent: 0,
          uploadedBytes: 0,
          totalBytes: file.size,
          speedBytesPerSec: 0,
          etaSeconds: 0,
          currentChunk: 1,
          totalChunks: Math.ceil(file.size / (20 * 1024 * 1024)),
          status: "error",
          errorMessage: msg,
        });
      }
    } finally {
      setUploadingVideo(false);
      setVideoAbortController(null);
    }
  }

  function cancelVideoUpload() {
    if (videoAbortController) {
      videoAbortController.abort();
    }
  }

  // Media upload helper
  async function uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("altText", file.name);
    try {
      const res = await api.postForm<{ publicUrl?: string; url?: string }>(
        "/admin/media/upload",
        formData,
      );
      const uploaded = res.publicUrl || res.url;
      if (!uploaded) throw new Error("Upload failed");
      return getMediaUrl(uploaded);
    } catch (err: any) {
      const msg = err instanceof ApiClientError ? err.message : err?.message || "Upload failed";
      throw new Error(msg);
    }
  }

  async function handleMediaUpload(
    e: ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      setter(url);
      toast.success("Media uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  // Mutation save logic
  const saveMutation = useMutation({
    mutationFn: () => {
      const activeMedia = mediaType === "video" ? videoUrl : imageUrl;
      const payload = {
        eyebrow,
        headline,
        title: headline,
        subhead,
        quote,
        ctaLabel,
        ctaUrl,
        primaryCtaShow,
        primaryCtaNewTab,
        secondaryCtaLabel,
        secondaryCtaUrl,
        secondaryCtaShow,
        secondaryCtaNewTab,
        mediaType,
        imageUrl,
        videoUrl,
        mediaUrl: activeMedia,
        media: activeMedia,
        backgroundMedia: activeMedia,
        backgroundImage: imageUrl,
        backgroundVideo: videoUrl,
        imagePosition,
        altText,
        videoSource: "url",
        posterUrl,
        posterImage: posterUrl,
        videoAutoplay,
        videoMuted,
        videoLoop,
        videoPlayInline,
        overlayEnabled,
        overlayType,
        overlayOpacity: Number(overlayOpacity),
        horizontalPos,
        verticalPos,
        mobileImageUrl,
        mobileVideoUrl,
        mobileMedia: mobileVideoUrl || mobileImageUrl,
        slideDuration: Number(slideDuration),
        transitionDuration: Number(transitionDuration),
        visible,
        sortOrder: Number(sortOrder),
      };

      if (initial?.id) {
        return api.put(`/admin/hero_slides/${initial.id}`, payload);
      }
      return api.post("/admin/hero_slides", payload);
    },
    onSuccess: () => {
      toast.success("Hero slide saved and published to homepage!");
      queryClient.invalidateQueries({ queryKey: ["admin-collection", "hero_slides"] });
      queryClient.invalidateQueries({ queryKey: ["public-collection", "hero_slides"] });
      onClose();
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Failed to save hero slide");
    },
  });

  // Calculate live preview positioning classes
  const flexHorizClass =
    horizontalPos === "center"
      ? "items-center text-center"
      : horizontalPos === "right"
        ? "items-end text-right"
        : "items-start text-left";

  const flexVertClass =
    verticalPos === "top"
      ? "justify-start pt-16"
      : verticalPos === "center"
        ? "justify-center"
        : "justify-end pb-16";

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-border/80 px-6 py-4 bg-card/60 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold tracking-tight font-display">
            {initial ? "Edit Hero Slide" : "Create Hero Slide"}
          </h2>
          <p className="text-xs text-muted-foreground">
            Complete hero slide composer with live interactive preview.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saveMutation.isPending ? "Saving…" : "Save & Publish Slide"}
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* LIVE HERO SLIDE INTERACTIVE PREVIEW */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="eyebrow text-primary">Live Hero Slide Preview</Label>
            <span className="text-[11px] text-muted-foreground">
              Updates in real-time as you edit settings below
            </span>
          </div>

          <div className="relative aspect-21/9 w-full overflow-hidden rounded-2xl border border-border/80 shadow-2xl bg-black">
            {/* Background Media Layer */}
            {mediaType === "video" && videoUrl ? (
              <video
                src={videoUrl}
                poster={posterUrl || imageUrl}
                autoPlay={videoAutoplay}
                muted={videoMuted}
                loop={videoLoop}
                playsInline={videoPlayInline}
                className="absolute inset-0 size-full object-cover"
              />
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt={altText}
                className={`absolute inset-0 size-full object-cover object-${imagePosition}`}
              />
            ) : null}

            {/* Configurable Overlay */}
            {overlayEnabled && (
              <div
                className="absolute inset-0 transition-opacity"
                style={{
                  backgroundColor: overlayType === "solid" ? "black" : undefined,
                  backgroundImage:
                    overlayType === "gradient"
                      ? "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)"
                      : undefined,
                  opacity: overlayOpacity / 100,
                }}
              />
            )}

            {/* Live Content Overlay */}
            <div
              className={`relative z-10 flex size-full flex-col p-8 ${flexHorizClass} ${flexVertClass}`}
            >
              <div className="max-w-2xl space-y-3">
                {eyebrow && (
                  <p className="eyebrow text-xs tracking-[0.28em] text-copper">{eyebrow}</p>
                )}
                {headline && (
                  <h1 className="font-display text-2xl sm:text-4xl text-white leading-tight">
                    {headline}
                  </h1>
                )}
                {quote && (
                  <blockquote className="border-l-2 border-primary/80 pl-4 text-xs italic text-muted-foreground">
                    “{quote}”
                  </blockquote>
                )}
                {(primaryCtaShow || secondaryCtaShow) && (
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    {primaryCtaShow && ctaLabel && (
                      <span className="rounded-full bg-primary px-5 py-2 text-[10px] uppercase tracking-widest text-primary-foreground font-semibold">
                        {ctaLabel}
                      </span>
                    )}
                    {secondaryCtaShow && secondaryCtaLabel && (
                      <span className="rounded-full border border-white/40 bg-black/30 px-5 py-2 text-[10px] uppercase tracking-widest text-white font-semibold">
                        {secondaryCtaLabel}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* EDITOR ACCORDION SECTIONS */}
        <Accordion
          type="multiple"
          defaultValue={["text", "media", "overlay", "position", "cta"]}
          className="w-full space-y-4"
        >
          {/* 1. Text Content */}
          <AccordionItem
            value="text"
            className="rounded-xl border border-border/70 bg-card/40 px-5"
          >
            <AccordionTrigger className="font-display text-lg font-medium hover:no-underline">
              1. Hero Text Content
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2 pb-5">
              <div className="space-y-1.5">
                <Label>Eyebrow Label</Label>
                <Input
                  value={eyebrow}
                  onChange={(e) => setEyebrow(e.target.value)}
                  placeholder="e.g. VISUAL PRODUCTION STUDIO"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Headline Title *</Label>
                <Textarea
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Golden hour and after dark, in one story."
                  rows={2}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Subhead / Promise</Label>
                <Textarea
                  value={subhead}
                  onChange={(e) => setSubhead(e.target.value)}
                  placeholder="e.g. Photography, videography and 360° virtual tours for spaces."
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Quote Excerpt</Label>
                <Textarea
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  placeholder="e.g. We capture the light that sells the room."
                  rows={2}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 2. Hero Media Manager */}
          <AccordionItem
            value="media"
            className="rounded-xl border border-border/70 bg-card/40 px-5"
          >
            <AccordionTrigger className="font-display text-lg font-medium hover:no-underline">
              2. Hero Media Manager (Image or Video)
            </AccordionTrigger>
            <AccordionContent className="space-y-5 pt-2 pb-5">
              <div className="space-y-2">
                <Label>Select Media Type</Label>
                <RadioGroup
                  value={mediaType}
                  onValueChange={(val) => setMediaType(val as "image" | "video")}
                  className="flex items-center gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="image" id="m-image" />
                    <Label htmlFor="m-image" className="cursor-pointer font-medium">
                      Background Image
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="video" id="m-video" />
                    <Label htmlFor="m-video" className="cursor-pointer font-medium">
                      Background Video
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {mediaType === "image" ? (
                <div className="space-y-4 rounded-xl border border-border/60 p-4 bg-background/50">
                  <AdminMediaUploader
                    mode="single"
                    value={imageUrl}
                    onChange={(val) =>
                      setImageUrl(typeof val === "string" ? val : val[0]?.url || "")
                    }
                    label="Desktop Image (Drag & drop or browse file)"
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Image Focal Position</Label>
                      <RadioGroup
                        value={imagePosition}
                        onValueChange={setImagePosition}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-1.5">
                          <RadioGroupItem value="top" id="pos-top" />
                          <Label htmlFor="pos-top" className="text-xs">
                            Top
                          </Label>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <RadioGroupItem value="center" id="pos-center" />
                          <Label htmlFor="pos-center" className="text-xs">
                            Center
                          </Label>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <RadioGroupItem value="bottom" id="pos-bottom" />
                          <Label htmlFor="pos-bottom" className="text-xs">
                            Bottom
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Alt Text</Label>
                      <Input
                        value={altText}
                        onChange={(e) => setAltText(e.target.value)}
                        placeholder="Hero image description"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 rounded-xl border border-border/60 p-4 bg-background/50">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        Background Video (MP4 / WebM / MOV up to 1000MB)
                      </Label>
                      <span className="text-[11px] text-muted-foreground">
                        Recommended: ≤ 100MB
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Input
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://.../hero.mp4 or select file below"
                      />
                      <label className="cursor-pointer">
                        <Button type="button" variant="outline" disabled={uploadingVideo} asChild>
                          <span>
                            <Video className="mr-1.5 h-3.5 w-3.5" />
                            {uploadingVideo
                              ? "Uploading…"
                              : videoUrl
                                ? "Replace Video"
                                : "Select Video"}
                          </span>
                        </Button>
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                          className="hidden"
                          onChange={handleVideoUploadSelected}
                        />
                      </label>
                      {videoUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setVideoUrl("")}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Resumable Chunked Progress Banner */}
                  {videoProgress && (
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium truncate max-w-[260px] text-foreground">
                          {videoFileName || "hero_video.mp4"} ({formatMb(videoProgress.totalBytes)})
                        </span>
                        <span className="font-semibold text-primary">{videoProgress.percent}%</span>
                      </div>

                      <Progress value={videoProgress.percent} className="h-2" />

                      <div className="flex items-center justify-between text-[11px]">
                        <div>
                          {videoProgress.status === "uploading" && (
                            <span className="text-muted-foreground">
                              {videoProgress.throttled ? (
                                <span className="text-amber-400 font-medium">
                                  Upload temporarily throttled — retrying chunk{" "}
                                  {videoProgress.currentChunk}/{videoProgress.totalChunks} in{" "}
                                  {videoProgress.retryInSeconds}s...
                                </span>
                              ) : (
                                <>
                                  {formatMb(videoProgress.uploadedBytes)} /{" "}
                                  {formatMb(videoProgress.totalBytes)} • Chunk{" "}
                                  {videoProgress.currentChunk} / {videoProgress.totalChunks} •{" "}
                                  {(videoProgress.speedBytesPerSec / (1024 * 1024)).toFixed(1)} MB/s
                                  {videoProgress.etaSeconds > 0 &&
                                    ` • ~${videoProgress.etaSeconds}s remaining`}
                                </>
                              )}
                            </span>
                          )}
                          {videoProgress.status === "completed" && (
                            <span className="text-emerald-400 font-medium">✓ Upload complete</span>
                          )}
                          {videoProgress.status === "error" && (
                            <span className="text-destructive font-medium">
                              {videoProgress.errorMessage || "Upload failed"}
                            </span>
                          )}
                        </div>

                        {videoProgress.status === "uploading" && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="h-7 text-xs px-2.5"
                            onClick={cancelVideoUpload}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label>Poster / Fallback Image</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        value={posterUrl}
                        onChange={(e) => setPosterUrl(e.target.value)}
                        placeholder="Fallback image if video fails"
                      />
                      <label className="cursor-pointer">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploading}
                          asChild
                        >
                          <span>
                            <Upload className="mr-1.5 h-3.5 w-3.5" />
                            Upload Poster
                          </span>
                        </Button>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleMediaUpload(e, setPosterUrl)}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 pt-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="v-auto"
                        checked={videoAutoplay}
                        onCheckedChange={setVideoAutoplay}
                      />
                      <Label htmlFor="v-auto" className="cursor-pointer text-xs">
                        Autoplay (Recommended ON)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="v-mute" checked={videoMuted} onCheckedChange={setVideoMuted} />
                      <Label htmlFor="v-mute" className="cursor-pointer text-xs">
                        Muted (Required for Autoplay)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="v-loop" checked={videoLoop} onCheckedChange={setVideoLoop} />
                      <Label htmlFor="v-loop" className="cursor-pointer text-xs">
                        Loop Continuous
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="v-inline"
                        checked={videoPlayInline}
                        onCheckedChange={setVideoPlayInline}
                      />
                      <Label htmlFor="v-inline" className="cursor-pointer text-xs">
                        Plays Inline (Mobile)
                      </Label>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Media Option */}
              <div className="space-y-3 border-t pt-4">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Mobile-Specific Media (Optional)
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    value={mobileImageUrl}
                    onChange={(e) => setMobileImageUrl(e.target.value)}
                    placeholder="Separate mobile image/video URL"
                  />
                  <label className="cursor-pointer">
                    <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
                      <span>
                        <Upload className="mr-1.5 h-3.5 w-3.5" />
                        Upload Mobile
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => handleMediaUpload(e, setMobileImageUrl)}
                    />
                  </label>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 3. Overlay & Atmosphere */}
          <AccordionItem
            value="overlay"
            className="rounded-xl border border-border/70 bg-card/40 px-5"
          >
            <AccordionTrigger className="font-display text-lg font-medium hover:no-underline">
              3. Overlay & Atmosphere Control
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2 pb-5">
              <div className="flex items-center justify-between">
                <Label htmlFor="ov-toggle" className="cursor-pointer font-medium">
                  Enable Dark Overlay Veil
                </Label>
                <Switch
                  id="ov-toggle"
                  checked={overlayEnabled}
                  onCheckedChange={setOverlayEnabled}
                />
              </div>

              {overlayEnabled && (
                <div className="space-y-4 rounded-xl border border-border/60 p-4 bg-background/50">
                  <div className="space-y-1.5">
                    <Label>Overlay Type</Label>
                    <RadioGroup
                      value={overlayType}
                      onValueChange={setOverlayType}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-1.5">
                        <RadioGroupItem value="solid" id="ov-solid" />
                        <Label htmlFor="ov-solid" className="text-xs">
                          Solid Dark Veil
                        </Label>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <RadioGroupItem value="gradient" id="ov-grad" />
                        <Label htmlFor="ov-grad" className="text-xs">
                          Cinematic Gradient
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <Label>Overlay Opacity</Label>
                      <span className="font-mono text-primary">{overlayOpacity}%</span>
                    </div>
                    <Slider
                      value={[overlayOpacity]}
                      min={0}
                      max={100}
                      step={5}
                      onValueChange={(val) => setOverlayOpacity(val[0] ?? 65)}
                    />
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* 4. Content Position & Layout */}
          <AccordionItem
            value="position"
            className="rounded-xl border border-border/70 bg-card/40 px-5"
          >
            <AccordionTrigger className="font-display text-lg font-medium hover:no-underline">
              4. Content Alignment & Position
            </AccordionTrigger>
            <AccordionContent className="grid gap-6 sm:grid-cols-2 pt-2 pb-5">
              <div className="space-y-2">
                <Label>Horizontal Alignment</Label>
                <RadioGroup
                  value={horizontalPos}
                  onValueChange={(val) => setHorizontalPos(val as any)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-1.5">
                    <RadioGroupItem value="left" id="h-left" />
                    <Label htmlFor="h-left" className="text-xs">
                      Left
                    </Label>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <RadioGroupItem value="center" id="h-center" />
                    <Label htmlFor="h-center" className="text-xs">
                      Center
                    </Label>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <RadioGroupItem value="right" id="h-right" />
                    <Label htmlFor="h-right" className="text-xs">
                      Right
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Vertical Alignment</Label>
                <RadioGroup
                  value={verticalPos}
                  onValueChange={(val) => setVerticalPos(val as any)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-1.5">
                    <RadioGroupItem value="top" id="v-top" />
                    <Label htmlFor="v-top" className="text-xs">
                      Top
                    </Label>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <RadioGroupItem value="center" id="v-center" />
                    <Label htmlFor="v-center" className="text-xs">
                      Center
                    </Label>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <RadioGroupItem value="bottom" id="v-bottom" />
                    <Label htmlFor="v-bottom" className="text-xs">
                      Bottom
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 5. CTAs */}
          <AccordionItem value="cta" className="rounded-xl border border-border/70 bg-card/40 px-5">
            <AccordionTrigger className="font-display text-lg font-medium hover:no-underline">
              5. Call to Action Buttons
            </AccordionTrigger>
            <AccordionContent className="space-y-6 pt-2 pb-5">
              {/* Primary CTA */}
              <div className="space-y-3 rounded-xl border border-border/60 p-4 bg-background/50">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="p-show"
                    className="font-semibold text-xs uppercase tracking-wider text-primary"
                  >
                    Primary Button
                  </Label>
                  <Switch
                    id="p-show"
                    checked={primaryCtaShow}
                    onCheckedChange={setPrimaryCtaShow}
                  />
                </div>
                {primaryCtaShow && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      value={ctaLabel}
                      onChange={(e) => setCtaLabel(e.target.value)}
                      placeholder="Button Label (e.g. Start a project)"
                    />
                    <Input
                      value={ctaUrl}
                      onChange={(e) => setCtaUrl(e.target.value)}
                      placeholder="Target URL (e.g. /contact)"
                    />
                  </div>
                )}
              </div>

              {/* Secondary CTA */}
              <div className="space-y-3 rounded-xl border border-border/60 p-4 bg-background/50">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="s-show"
                    className="font-semibold text-xs uppercase tracking-wider"
                  >
                    Secondary Button
                  </Label>
                  <Switch
                    id="s-show"
                    checked={secondaryCtaShow}
                    onCheckedChange={setSecondaryCtaShow}
                  />
                </div>
                {secondaryCtaShow && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      value={secondaryCtaLabel}
                      onChange={(e) => setSecondaryCtaLabel(e.target.value)}
                      placeholder="Button Label (e.g. View work)"
                    />
                    <Input
                      value={secondaryCtaUrl}
                      onChange={(e) => setSecondaryCtaUrl(e.target.value)}
                      placeholder="Target URL (e.g. /work)"
                    />
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 6. Timing & Settings */}
          <AccordionItem
            value="settings"
            className="rounded-xl border border-border/70 bg-card/40 px-5"
          >
            <AccordionTrigger className="font-display text-lg font-medium hover:no-underline">
              6. Slide Timing & Visibility
            </AccordionTrigger>
            <AccordionContent className="grid gap-4 sm:grid-cols-2 pt-2 pb-5">
              <div className="space-y-1.5">
                <Label>Slide Display Duration (seconds)</Label>
                <Input
                  type="number"
                  value={slideDuration}
                  onChange={(e) => setSlideDuration(Number(e.target.value))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Display Sort Order</Label>
                <Input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                />
              </div>

              <div className="flex items-center gap-3 pt-4 sm:col-span-2">
                <Switch id="visible-s" checked={visible} onCheckedChange={setVisible} />
                <Label htmlFor="visible-s" className="cursor-pointer font-medium">
                  Slide Active & Visible on Homepage
                </Label>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-between border-t border-border/80 px-6 py-4 bg-card/60">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {saveMutation.isPending ? "Saving…" : "Save & Publish Slide"}
        </Button>
      </div>
    </div>
  );
}
