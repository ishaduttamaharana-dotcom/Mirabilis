import { useState, type ChangeEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiClientError, getMediaUrl } from "@/lib/api-client";
import {
  AdminMediaUploader,
  type MediaUploaderItem,
} from "@/components/admin/admin-media-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Plus,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";

export interface GalleryItem {
  id: string;
  imageUrl: string;
  caption?: string;
  altText?: string;
  sortOrder?: number;
}

export interface KeyFeatureItem {
  id: string;
  title: string;
  description: string;
  sortOrder?: number;
}

export interface ProjectData {
  id?: string;
  title: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  body?: string;
  creativeDirection?: string;
  approach?: string;
  outcome?: string;
  coverImage?: string;
  cardImage?: string;
  clientRef?: string;
  projectDate?: string;
  location?: string;
  featured?: boolean;
  sortOrder?: number;
  state?: "draft" | "published" | string;
  services?: string[];
  gallery?: (GalleryItem | string)[];
  keyFeatures?: KeyFeatureItem[];
  projectDetails?: {
    industry?: string;
    duration?: string;
    teamSize?: string;
    deliverables?: string;
    productionType?: string;
  };
  testimonial?: {
    quote?: string;
    clientName?: string;
    designation?: string;
  };
  video?: {
    url?: string;
    posterImage?: string;
  };
}

const AVAILABLE_SERVICES = [
  "Photography",
  "Videography",
  "Cinematography",
  "Drone / Aerial",
  "Editing",
  "Color Grading",
  "Motion Graphics",
  "3D / CGI",
];

export function AdminProjectEditor({
  initial,
  onClose,
}: {
  initial: ProjectData | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const queryKey = ["admin-collection", "projects"];

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [shortDescription, setShortDescription] = useState(initial?.shortDescription ?? "");
  const [description, setDescription] = useState(initial?.description ?? initial?.body ?? "");
  const [creativeDirection, setCreativeDirection] = useState(initial?.creativeDirection ?? "");
  const [approach, setApproach] = useState(initial?.approach ?? "");
  const [outcome, setOutcome] = useState(initial?.outcome ?? "");
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? initial?.cardImage ?? "");
  const [clientRef, setClientRef] = useState(initial?.clientRef ?? "");
  const [projectDate, setProjectDate] = useState(initial?.projectDate ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [sortOrder, setSortOrder] = useState<number>(initial?.sortOrder ?? 0);
  const [state, setState] = useState<string>(initial?.state ?? "draft");

  // Services list
  const [services, setServices] = useState<string[]>(initial?.services ?? []);

  // Gallery items normalized
  const [gallery, setGallery] = useState<GalleryItem[]>(() => {
    if (!initial?.gallery) return [];
    return initial.gallery.map((g, idx) => {
      if (typeof g === "string") {
        return { id: `g-${idx}`, imageUrl: g, caption: "", altText: "", sortOrder: idx };
      }
      return {
        id: g.id || `g-${idx}`,
        imageUrl: g.imageUrl || (g as any).url || "",
        caption: g.caption || "",
        altText: g.altText || "",
        sortOrder: g.sortOrder ?? idx,
      };
    });
  });

  // Key Features
  const [keyFeatures, setKeyFeatures] = useState<KeyFeatureItem[]>(initial?.keyFeatures ?? []);

  // Project Details
  const [industry, setIndustry] = useState(initial?.projectDetails?.industry ?? "");
  const [duration, setDuration] = useState(initial?.projectDetails?.duration ?? "");
  const [teamSize, setTeamSize] = useState(initial?.projectDetails?.teamSize ?? "");
  const [deliverables, setDeliverables] = useState(initial?.projectDetails?.deliverables ?? "");
  const [productionType, setProductionType] = useState(
    initial?.projectDetails?.productionType ?? "",
  );

  // Testimonial
  const [testimonialQuote, setTestimonialQuote] = useState(initial?.testimonial?.quote ?? "");
  const [testimonialName, setTestimonialName] = useState(initial?.testimonial?.clientName ?? "");
  const [testimonialRole, setTestimonialRole] = useState(initial?.testimonial?.designation ?? "");

  // Video
  const [videoUrl, setVideoUrl] = useState(initial?.video?.url ?? "");
  const [videoPoster, setVideoPoster] = useState(initial?.video?.posterImage ?? "");

  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // Upload helper
  async function uploadMedia(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("altText", file.name);
    const res = await api.postForm<{ publicUrl?: string; url?: string }>(
      "/admin/media/upload",
      formData,
    );
    const uploadedUrl = res.publicUrl || res.url;
    if (!uploadedUrl) throw new Error("Upload failed");
    return getMediaUrl(uploadedUrl);
  }

  // Cover photo upload/replace
  async function handleCoverUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await uploadMedia(file);
      setCoverImage(url);
      toast.success("Cover photo updated!");
    } catch {
      toast.error("Cover photo upload failed");
    } finally {
      setUploadingCover(false);
    }
  }

  // Gallery multi-upload
  async function handleGalleryUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingGallery(true);
    try {
      const newItems: GalleryItem[] = [];
      for (const f of files) {
        const url = await uploadMedia(f);
        newItems.push({
          id: `g-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          imageUrl: url,
          caption: "",
          altText: f.name,
          sortOrder: gallery.length + newItems.length,
        });
      }
      setGallery((prev) => [...prev, ...newItems]);
      toast.success(`Added ${newItems.length} photo(s) to gallery!`);
    } catch {
      toast.error("Failed to upload gallery photos");
    } finally {
      setUploadingGallery(false);
    }
  }

  // Gallery item replace
  async function handleGalleryReplace(id: string, file: File) {
    try {
      const url = await uploadMedia(file);
      setGallery((prev) =>
        prev.map((item) => (item.id === id ? { ...item, imageUrl: url } : item)),
      );
      toast.success("Photo replaced!");
    } catch {
      toast.error("Failed to replace photo");
    }
  }

  // Gallery reordering
  function moveGalleryItem(index: number, direction: "up" | "down") {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === gallery.length - 1)
    )
      return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const next = [...gallery];
    const item1 = next[index];
    const item2 = next[targetIndex];
    if (item1 && item2) {
      next[index] = item2;
      next[targetIndex] = item1;
      setGallery(next);
    }
  }

  // Key feature reordering
  function moveFeature(index: number, direction: "up" | "down") {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === keyFeatures.length - 1)
    )
      return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const next = [...keyFeatures];
    const item1 = next[index];
    const item2 = next[targetIndex];
    if (item1 && item2) {
      next[index] = item2;
      next[targetIndex] = item1;
      setKeyFeatures(next);
    }
  }

  // Mutation save logic
  const saveMutation = useMutation({
    mutationFn: (targetState: string) => {
      const payload = {
        title,
        slug: slug || undefined,
        shortDescription,
        body: description,
        description,
        creativeDirection,
        approach,
        outcome,
        coverImage,
        cardImage: coverImage,
        clientRef,
        projectDate,
        location,
        featured,
        sortOrder: Number(sortOrder),
        state: targetState,
        services,
        gallery,
        keyFeatures,
        projectDetails: {
          industry,
          duration,
          teamSize,
          deliverables,
          productionType,
        },
        testimonial: {
          quote: testimonialQuote,
          clientName: testimonialName,
          designation: testimonialRole,
        },
        video: {
          url: videoUrl,
          posterImage: videoPoster,
        },
      };

      if (initial?.id) {
        return api.put(`/admin/projects/${initial.id}`, payload);
      }
      return api.post("/admin/projects", payload);
    },
    onSuccess: (_, targetState) => {
      toast.success(`Project ${targetState === "published" ? "published" : "saved as draft"}!`);
      queryClient.invalidateQueries({ queryKey });
      onClose();
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Failed to save project");
    },
  });

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      {/* Top Header Control Bar */}
      <div className="flex items-center justify-between border-b border-border/80 px-6 py-4 bg-card/60 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold tracking-tight font-display">
            {initial ? `Edit Project: ${initial.title}` : "Create New Portfolio Project"}
          </h2>
          <p className="text-xs text-muted-foreground">
            Complete portfolio manager with gallery, features, and custom section storytelling.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {initial?.slug && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open(`/work/${initial.slug}`, "_blank")}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              Preview Project
              <ExternalLink className="ml-1.5 h-3 w-3" />
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => saveMutation.mutate("draft")}
            disabled={saveMutation.isPending}
          >
            Save Draft
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => saveMutation.mutate("published")}
            disabled={saveMutation.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saveMutation.isPending ? "Publishing…" : "Publish Project"}
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor Content Area with Accordion Sections */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <Accordion
          type="multiple"
          defaultValue={["basic", "cover", "gallery", "story", "services"]}
          className="w-full space-y-4"
        >
          {/* 1. Basic Information */}
          <AccordionItem
            value="basic"
            className="rounded-xl border border-border/70 bg-card/40 px-5"
          >
            <AccordionTrigger className="font-display text-lg font-medium hover:no-underline">
              1. Basic Information
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2 pb-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Hillside Sanctuary Resort"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="slug">Custom URL Slug</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="hillside-sanctuary-resort"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="client">Client Name</Label>
                  <Input
                    id="client"
                    value={clientRef}
                    onChange={(e) => setClientRef(e.target.value)}
                    placeholder="e.g. Oberoi Hotels & Resorts"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Nagpur Outskirts, Maharashtra"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="projectDate">Project Date</Label>
                  <Input
                    id="projectDate"
                    value={projectDate}
                    onChange={(e) => setProjectDate(e.target.value)}
                    placeholder="e.g. 2026-02"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sortOrder">Display Sort Order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                  />
                </div>

                <div className="flex items-center gap-3 pt-6 sm:col-span-2">
                  <Switch id="featured" checked={featured} onCheckedChange={setFeatured} />
                  <Label htmlFor="featured" className="cursor-pointer">
                    Feature on Homepage Highlights
                  </Label>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 2. Cover Photo Manager */}
          <AccordionItem
            value="cover"
            className="rounded-xl border border-border/70 bg-card/40 px-5"
          >
            <AccordionTrigger className="font-display text-lg font-medium hover:no-underline">
              2. Cover Photo Manager
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2 pb-5">
              <AdminMediaUploader
                mode="single"
                value={coverImage}
                onChange={(val) => setCoverImage(typeof val === "string" ? val : val[0]?.url || "")}
                label="Project Cover Image (Drag & drop or select file)"
              />
            </AccordionContent>
          </AccordionItem>

          {/* 3. Project Photo Gallery */}
          <AccordionItem
            value="gallery"
            className="rounded-xl border border-border/70 bg-card/40 px-5"
          >
            <AccordionTrigger className="font-display text-lg font-medium hover:no-underline">
              3. Project Photo Gallery ({gallery.length})
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2 pb-5">
              <AdminMediaUploader
                mode="multiple"
                allowVideo={true}
                value={gallery.map((g, idx) => ({
                  id: g.id || `g-${idx}`,
                  url: g.imageUrl,
                  altText: g.altText || g.caption || `Gallery photo ${idx + 1}`,
                  sortOrder: idx + 1,
                  isCover: coverImage === g.imageUrl,
                }))}
                onChange={(newItems: MediaUploaderItem[]) => {
                  if (Array.isArray(newItems)) {
                    setGallery(
                      newItems.map((item, idx) => ({
                        id: item.id || `g-${idx}-${Date.now()}`,
                        imageUrl: item.url,
                        caption: item.altText || "",
                        altText: item.altText || "",
                        sortOrder: idx + 1,
                      })),
                    );
                    const coverItem = newItems.find((i) => i.isCover);
                    if (coverItem) setCoverImage(coverItem.url);
                  }
                }}
                label="Project Gallery Media (Drag & drop multiple files, reorder sequence, set cover)"
              />
            </AccordionContent>
          </AccordionItem>

          {/* 4. Project Story & Description */}
          <AccordionItem
            value="story"
            className="rounded-xl border border-border/70 bg-card/40 px-5"
          >
            <AccordionTrigger className="font-display text-lg font-medium hover:no-underline">
              4. Project Story & Description
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2 pb-5">
              <div className="space-y-1.5">
                <Label htmlFor="shortDesc">Short Excerpt / Teaser</Label>
                <Textarea
                  id="shortDesc"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="A concise 1-2 sentence overview for cards and headers."
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fullDesc">Full Project Narrative Story</Label>
                <Textarea
                  id="fullDesc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write the full multi-paragraph narrative of the shoot, light windows, architectural details, and atmosphere."
                  rows={6}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 5. Creative Direction */}
          <AccordionItem
            value="creative"
            className="rounded-xl border border-border/70 bg-card/40 px-5"
          >
            <AccordionTrigger className="font-display text-lg font-medium hover:no-underline">
              5. Creative Direction
            </AccordionTrigger>
            <AccordionContent className="space-y-2 pt-2 pb-5">
              <Label htmlFor="creativeDir">Visual Concept Explanation</Label>
              <Textarea
                id="creativeDir"
                value={creativeDirection}
                onChange={(e) => setCreativeDirection(e.target.value)}
                placeholder="Describe the aesthetic direction, palette, lighting strategy (e.g. Golden hour warm glow to dusk after-burn)."
                rows={4}
              />
            </AccordionContent>
          </AccordionItem>

          {/* 6. Key Features */}
          <AccordionItem
            value="features"
            className="rounded-xl border border-border/70 bg-card/40 px-5"
          >
            <AccordionTrigger className="font-display text-lg font-medium hover:no-underline">
              6. Key Features ({keyFeatures.length})
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2 pb-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Add highlighted aspects of this production.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setKeyFeatures((prev) => [
                      ...prev,
                      {
                        id: `kf-${Date.now()}`,
                        title: "",
                        description: "",
                        sortOrder: prev.length,
                      },
                    ])
                  }
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add Feature
                </Button>
              </div>

              {keyFeatures.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground">
                  No features added yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {keyFeatures.map((kf, idx) => (
                    <div
                      key={kf.id}
                      className="flex items-start gap-3 rounded-xl border border-border/70 bg-background/80 p-4"
                    >
                      <div className="flex flex-col gap-1 pt-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={idx === 0}
                          onClick={() => moveFeature(idx, "up")}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={idx === keyFeatures.length - 1}
                          onClick={() => moveFeature(idx, "down")}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Feature Title (e.g. Architectural Photography)"
                          value={kf.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setKeyFeatures((prev) =>
                              prev.map((item) =>
                                item.id === kf.id ? { ...item, title: val } : item,
                              ),
                            );
                          }}
                        />
                        <Textarea
                          placeholder="Short description of this feature"
                          value={kf.description}
                          onChange={(e) => {
                            const val = e.target.value;
                            setKeyFeatures((prev) =>
                              prev.map((item) =>
                                item.id === kf.id ? { ...item, description: val } : item,
                              ),
                            );
                          }}
                          rows={2}
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() =>
                          setKeyFeatures((prev) => prev.filter((item) => item.id !== kf.id))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* 7. Services Provided */}
          <AccordionItem
            value="services"
            className="rounded-xl border border-border/70 bg-card/40 px-5"
          >
            <AccordionTrigger className="font-display text-lg font-medium hover:no-underline">
              7. Services Provided
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-5">
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                {AVAILABLE_SERVICES.map((srv) => {
                  const checked = services.includes(srv);
                  return (
                    <div
                      key={srv}
                      className={`flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                        checked ? "border-primary bg-primary/10" : "border-border bg-background/50"
                      }`}
                      onClick={() => {
                        if (checked) setServices(services.filter((s) => s !== srv));
                        else setServices([...services, srv]);
                      }}
                    >
                      <Checkbox id={`srv-${srv}`} checked={checked} />
                      <Label htmlFor={`srv-${srv}`} className="cursor-pointer text-xs font-medium">
                        {srv}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 8. Project Details */}
          <AccordionItem
            value="details"
            className="rounded-xl border border-border/70 bg-card/40 px-5"
          >
            <AccordionTrigger className="font-display text-lg font-medium hover:no-underline">
              8. Structured Project Details
            </AccordionTrigger>
            <AccordionContent className="grid gap-4 sm:grid-cols-2 pt-2 pb-5">
              <div className="space-y-1.5">
                <Label>Industry</Label>
                <Input
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Resort & Hospitality"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Shoot Duration</Label>
                <Input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 3 Days (Dusk + Night Pass)"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Crew / Team Size</Label>
                <Input
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                  placeholder="e.g. 4 Production Crew"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Deliverables Summary</Label>
                <Input
                  value={deliverables}
                  onChange={(e) => setDeliverables(e.target.value)}
                  placeholder="e.g. 45 Stills + 1 Brand Film"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label>Production Type</Label>
                <Input
                  value={productionType}
                  onChange={(e) => setProductionType(e.target.value)}
                  placeholder="e.g. Commercial Architectural Campaign"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 9. Our Approach */}
          <AccordionItem
            value="approach"
            className="rounded-xl border border-border/70 bg-card/40 px-5"
          >
            <AccordionTrigger className="font-display text-lg font-medium hover:no-underline">
              9. Our Approach
            </AccordionTrigger>
            <AccordionContent className="space-y-2 pt-2 pb-5">
              <Label htmlFor="approachText">Execution Methodology</Label>
              <Textarea
                id="approachText"
                value={approach}
                onChange={(e) => setApproach(e.target.value)}
                placeholder="Explain the step-by-step production plan on set, equipment choices, and camera movement strategy."
                rows={4}
              />
            </AccordionContent>
          </AccordionItem>

          {/* 10. Outcome */}
          <AccordionItem
            value="outcome"
            className="rounded-xl border border-border/70 bg-card/40 px-5"
          >
            <AccordionTrigger className="font-display text-lg font-medium hover:no-underline">
              10. Project Outcome
            </AccordionTrigger>
            <AccordionContent className="space-y-2 pt-2 pb-5">
              <Label htmlFor="outcomeText">Results & Final Assets Delivered</Label>
              <Textarea
                id="outcomeText"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="Summarize the final deliverables, launch results, or client ROI impact."
                rows={3}
              />
            </AccordionContent>
          </AccordionItem>

          {/* 11. Client Testimonial */}
          <AccordionItem
            value="testimonial"
            className="rounded-xl border border-border/70 bg-card/40 px-5"
          >
            <AccordionTrigger className="font-display text-lg font-medium hover:no-underline">
              11. Client Testimonial
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2 pb-5">
              <div className="space-y-1.5">
                <Label>Quote</Label>
                <Textarea
                  value={testimonialQuote}
                  onChange={(e) => setTestimonialQuote(e.target.value)}
                  placeholder="Client feedback quote..."
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Client Name</Label>
                  <Input
                    value={testimonialName}
                    onChange={(e) => setTestimonialName(e.target.value)}
                    placeholder="e.g. Rohan Deshmukh"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Designation / Company</Label>
                  <Input
                    value={testimonialRole}
                    onChange={(e) => setTestimonialRole(e.target.value)}
                    placeholder="e.g. Founder, Hillside Retreats"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 12. Project Video */}
          <AccordionItem
            value="video"
            className="rounded-xl border border-border/70 bg-card/40 px-5"
          >
            <AccordionTrigger className="font-display text-lg font-medium hover:no-underline">
              12. Project Video
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2 pb-5">
              <div className="space-y-1.5">
                <Label htmlFor="videoUrl">Video Embed / Stream URL</Label>
                <Input
                  id="videoUrl"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="e.g. https://www.youtube.com/watch?v=... or MP4 URL"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="videoPoster">Poster Frame Image URL</Label>
                <Input
                  id="videoPoster"
                  value={videoPoster}
                  onChange={(e) => setVideoPoster(e.target.value)}
                  placeholder="https://..."
                />
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
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => saveMutation.mutate("draft")}
            disabled={saveMutation.isPending}
          >
            Save Draft
          </Button>
          <Button
            type="button"
            onClick={() => saveMutation.mutate("published")}
            disabled={saveMutation.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saveMutation.isPending ? "Publishing…" : "Publish Project"}
          </Button>
        </div>
      </div>
    </div>
  );
}
