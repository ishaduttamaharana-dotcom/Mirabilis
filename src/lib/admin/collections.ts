/**
 * Frontend mirror of backend/app/core/content_registry.py's field allowlist.
 * Drives the generic admin list + form for every non-bespoke collection.
 * `key` here is what the API expects; keep this in sync if the backend
 * registry changes field names.
 */

export type AdminFieldType =
  "text" | "textarea" | "number" | "boolean" | "select" | "tags" | "image";

export interface AdminFieldConfig {
  key: string;
  label: string;
  type: AdminFieldType;
  required?: boolean;
  options?: string[]; // for "select"
  showInTable?: boolean;
}

export interface AdminCollectionConfig {
  /** URL segment under /admin/:collection, e.g. "portfolio" for projects. */
  routeSegment: string;
  /** Backend collection name, e.g. "projects". */
  apiName: string;
  title: string;
  singular: string;
  hasSlug: boolean;
  hasState: boolean; // draft/published vs. a plain visible flag
  stateOptions?: string[]; // defaults to ["draft", "published"] when hasState
  fields: AdminFieldConfig[];
}

const COMMON_VISIBILITY: AdminFieldConfig = { key: "visible", label: "Visible", type: "boolean" };
const COMMON_SORT: AdminFieldConfig = { key: "sortOrder", label: "Sort order", type: "number" };

export const ADMIN_COLLECTIONS: AdminCollectionConfig[] = [
  {
    routeSegment: "services",
    apiName: "services",
    title: "Services",
    singular: "Service",
    hasSlug: true,
    hasState: true,
    fields: [
      { key: "title", label: "Title", type: "text", required: true, showInTable: true },
      { key: "subtitle", label: "Subtitle", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "cardImage", label: "Card Photo", type: "image", showInTable: true },
      { key: "heroMedia", label: "Hero Photo / Video", type: "image" },
      { key: "pricingLabel", label: "Pricing label", type: "text" },
      { key: "pricingRange", label: "Pricing range", type: "text" },
      { key: "ctaLabel", label: "CTA label", type: "text" },
      { key: "ctaUrl", label: "CTA URL", type: "text" },
      { key: "tags", label: "Tags", type: "tags" },
      COMMON_SORT,
    ],
  },
  {
    routeSegment: "portfolio",
    apiName: "projects",
    title: "Portfolio",
    singular: "Project",
    hasSlug: true,
    hasState: true,
    fields: [
      { key: "title", label: "Title", type: "text", required: true, showInTable: true },
      { key: "shortDescription", label: "Short description", type: "textarea" },
      { key: "cardImage", label: "Cover Photo", type: "image", showInTable: true },
      { key: "clientRef", label: "Client", type: "text" },
      { key: "projectDate", label: "Project date", type: "text" },
      { key: "location", label: "Location", type: "text" },
      { key: "featured", label: "Featured", type: "boolean" },
      COMMON_SORT,
    ],
  },
  {
    routeSegment: "products",
    apiName: "products",
    title: "Products",
    singular: "Product",
    hasSlug: true,
    hasState: true,
    fields: [
      { key: "name", label: "Name", type: "text", required: true, showInTable: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "image", label: "Product Photo", type: "image", showInTable: true },
      { key: "featured", label: "Featured", type: "boolean" },
      COMMON_SORT,
    ],
  },
  {
    routeSegment: "industries",
    apiName: "industries",
    title: "Industries",
    singular: "Industry",
    hasSlug: true,
    hasState: true,
    fields: [
      { key: "name", label: "Name", type: "text", required: true, showInTable: true },
      { key: "title", label: "Page title", type: "text" },
      { key: "bannerImage", label: "Banner Photo", type: "image", showInTable: true },
      { key: "intro", label: "Intro", type: "textarea" },
      { key: "ctaLabel", label: "CTA label", type: "text" },
      { key: "ctaUrl", label: "CTA URL", type: "text" },
      COMMON_SORT,
    ],
  },
  {
    routeSegment: "clients",
    apiName: "clients",
    title: "Clients",
    singular: "Client",
    hasSlug: false,
    hasState: false,
    fields: [
      { key: "name", label: "Name", type: "text", required: true, showInTable: true },
      { key: "logoMedia", label: "Client Logo / Photo", type: "image", showInTable: true },
      { key: "url", label: "URL", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      COMMON_VISIBILITY,
      COMMON_SORT,
    ],
  },
  {
    routeSegment: "partners",
    apiName: "partners",
    title: "Partners",
    singular: "Partner",
    hasSlug: false,
    hasState: false,
    fields: [
      { key: "name", label: "Name", type: "text", required: true, showInTable: true },
      { key: "logoMedia", label: "Partner Logo / Photo", type: "image", showInTable: true },
      { key: "url", label: "URL", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      COMMON_VISIBILITY,
      COMMON_SORT,
    ],
  },
  {
    routeSegment: "categories",
    apiName: "categories",
    title: "Categories",
    singular: "Category",
    hasSlug: true,
    hasState: false,
    fields: [
      { key: "name", label: "Name", type: "text", required: true, showInTable: true },
      {
        key: "type",
        label: "Type",
        type: "select",
        required: true,
        options: ["portfolio", "blog", "product", "gallery"],
        showInTable: true,
      },
      { key: "image", label: "Category Photo", type: "image", showInTable: true },
      { key: "description", label: "Description", type: "textarea" },
      COMMON_SORT,
    ],
  },
  {
    routeSegment: "team",
    apiName: "team_members",
    title: "Team",
    singular: "Team member",
    hasSlug: false,
    hasState: false,
    fields: [
      { key: "name", label: "Name", type: "text", required: true, showInTable: true },
      { key: "photo", label: "Member Photo", type: "image", showInTable: true },
      { key: "role", label: "Role / title", type: "text", showInTable: true },
      { key: "bio", label: "Bio", type: "textarea" },
      COMMON_VISIBILITY,
      COMMON_SORT,
    ],
  },
  {
    routeSegment: "testimonials",
    apiName: "testimonials",
    title: "Testimonials",
    singular: "Testimonial",
    hasSlug: false,
    hasState: false,
    fields: [
      { key: "quote", label: "Quote", type: "textarea", required: true },
      { key: "author", label: "Author", type: "text", required: true, showInTable: true },
      { key: "authorPhoto", label: "Author Photo", type: "image", showInTable: true },
      { key: "company", label: "Company", type: "text", showInTable: true },
      { key: "rating", label: "Rating (1-5)", type: "number" },
      COMMON_VISIBILITY,
      COMMON_SORT,
    ],
  },
  {
    routeSegment: "pricing",
    apiName: "pricing_plans",
    title: "Pricing plans",
    singular: "Plan",
    hasSlug: false,
    hasState: false,
    fields: [
      { key: "planName", label: "Plan name", type: "text", required: true, showInTable: true },
      { key: "summary", label: "Summary", type: "textarea" },
      { key: "image", label: "Plan Photo / Badge", type: "image" },
      { key: "priceLabel", label: "Price label", type: "text", showInTable: true },
      { key: "priceAmount", label: "Price amount", type: "number" },
      { key: "currency", label: "Currency", type: "text" },
      { key: "bestFor", label: "Best for", type: "text" },
      { key: "featured", label: "Featured", type: "boolean" },
      { key: "ctaLabel", label: "CTA label", type: "text" },
      { key: "ctaUrl", label: "CTA URL", type: "text" },
      COMMON_VISIBILITY,
      COMMON_SORT,
    ],
  },
  {
    routeSegment: "hero-slides",
    apiName: "hero_slides",
    title: "Hero slides",
    singular: "Slide",
    hasSlug: false,
    hasState: false,
    fields: [
      { key: "eyebrow", label: "Eyebrow", type: "text" },
      { key: "headline", label: "Headline", type: "text", required: true, showInTable: true },
      { key: "media", label: "Background Photo / Video", type: "image", showInTable: true },
      { key: "subhead", label: "Subhead", type: "textarea" },
      { key: "quote", label: "Quote", type: "text" },
      { key: "ctaLabel", label: "CTA label", type: "text" },
      { key: "ctaUrl", label: "CTA URL", type: "text" },
      { key: "secondaryCtaLabel", label: "Secondary CTA label", type: "text" },
      { key: "secondaryCtaUrl", label: "Secondary CTA URL", type: "text" },
      COMMON_VISIBILITY,
      COMMON_SORT,
    ],
  },
  {
    routeSegment: "gallery",
    apiName: "gallery_items",
    title: "Gallery",
    singular: "Gallery item",
    hasSlug: false,
    hasState: false,
    fields: [
      { key: "title", label: "Title / caption", type: "text", showInTable: true },
      {
        key: "media",
        label: "Photo / Media File",
        type: "image",
        required: true,
        showInTable: true,
      },
      { key: "altText", label: "Alt text", type: "text", required: true },
      COMMON_VISIBILITY,
      COMMON_SORT,
    ],
  },
  {
    routeSegment: "faqs",
    apiName: "faqs",
    title: "FAQs",
    singular: "FAQ",
    hasSlug: false,
    hasState: false,
    fields: [
      { key: "question", label: "Question", type: "text", required: true, showInTable: true },
      { key: "answer", label: "Answer", type: "textarea", required: true },
      { key: "image", label: "Illustration Photo", type: "image" },
      { key: "group", label: "Group", type: "text", showInTable: true },
      COMMON_SORT,
      COMMON_VISIBILITY,
    ],
  },
  {
    routeSegment: "statistics",
    apiName: "statistics",
    title: "Statistics",
    singular: "Statistic",
    hasSlug: false,
    hasState: false,
    fields: [
      { key: "label", label: "Label", type: "text", required: true, showInTable: true },
      { key: "value", label: "Value", type: "text", required: true, showInTable: true },
      { key: "icon", label: "Icon / Graphic Photo", type: "image" },
      { key: "suffix", label: "Suffix", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      COMMON_SORT,
      COMMON_VISIBILITY,
    ],
  },
  {
    routeSegment: "blogs",
    apiName: "blog_posts",
    title: "Blog posts",
    singular: "Post",
    hasSlug: true,
    hasState: true,
    stateOptions: ["draft", "scheduled", "published"],
    fields: [
      { key: "title", label: "Title", type: "text", required: true, showInTable: true },
      { key: "coverImage", label: "Cover Photo", type: "image", showInTable: true },
      { key: "excerpt", label: "Excerpt", type: "textarea" },
      { key: "author", label: "Author", type: "text", showInTable: true },
      { key: "category", label: "Category", type: "text" },
      { key: "tags", label: "Tags", type: "tags" },
      { key: "publishDate", label: "Publish date", type: "text" },
    ],
  },
];

export function findCollectionConfig(routeSegment: string): AdminCollectionConfig | undefined {
  return ADMIN_COLLECTIONS.find((c) => c.routeSegment === routeSegment);
}
