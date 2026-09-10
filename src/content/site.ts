/**
 * Canonical public content for the Mirabilis site.
 *
 * This module is the single data-access surface the public pages read from.
 * When the CMS API is live, replace the exported values with loader data
 * fetched over HTTPS — component code will not need to change.
 */

import heroImage from "@/assets/hero-afterglow.jpg";
import sceneDay from "@/assets/scene-day.jpg";
import sceneNight from "@/assets/scene-night.jpg";
import workResort from "@/assets/work-resort.jpg";
import workBrandFilm from "@/assets/work-brandfilm.jpg";
import workVilla from "@/assets/work-villa.jpg";

export const brand = {
  name: "MIRABILIS",
  descriptor: "Design · Build · Film",
  services: "Photography · Videography · Cinematography",
  quote: "We don't just capture spaces. We tell their story.",
  location: "Nagpur, Maharashtra",
  instagram: "@mirabilis_byt",
  instagramUrl: "https://instagram.com/mirabilis_byt",
  email: "mirabilis.byt2026@gmail.com",
  phones: ["8600266620", "9975531681"],
  promise: "Premium storytelling for cafes, resorts, villas, brands, and businesses.",
};

export const media = {
  hero: heroImage,
  sceneDay,
  sceneNight,
};

export const services = [
  {
    slug: "photography",
    title: "Photography",
    summary:
      "Architectural, interior, food and product frames built around real light and honest texture.",
    inclusions: ["Space & interior sets", "Food & menu stories", "Brand stills"],
    detail:
      "We shoot interiors, exteriors, food and product with the room's own light as the starting point — window light, table candles, kitchen pass — then shape it just enough to hold a frame. Every set is planned around a golden-hour and a night-light pass, so a single shoot leaves you with a still library that reads right at brunch and at last call.",
    idealFor: "Cafes, restaurants, resorts, villas and product-led brands.",
  },
  {
    slug: "videography",
    title: "Videography",
    summary: "Reels, launch films and social cutdowns shot to hold attention in the first second.",
    inclusions: ["Vertical reels", "Event coverage", "Social cutdowns"],
    detail:
      "Built for how people actually watch: vertical-first, cut to hold attention in the first second, with a shot list planned before the crew ever arrives on site. We cover events and everyday service alike, then deliver platform-ready cutdowns alongside a longer master.",
    idealFor: "Social-first brands, events and hospitality launches.",
  },
  {
    slug: "cinematography",
    title: "Cinematography",
    summary:
      "Cinematic direction, lighting and grade for films that carry a mood rather than a checklist.",
    inclusions: ["Lighting design", "Colour grade", "Sound pass"],
    detail:
      "Lighting design, blocking and a considered colour grade for work that needs to carry a mood, not just document a space. We plan camera movement and light windows in advance so the day on set is calm and the footage cuts together with intent.",
    idealFor: "Brand films, short films and campaigns with a directorial angle.",
  },
  {
    slug: "brand-films",
    title: "Brand Films",
    summary:
      "Narrative-led films for hospitality and lifestyle brands, from concept to final master.",
    inclusions: ["Script & storyboard", "Direction", "Edit & master"],
    detail:
      "A full narrative arc for a brand or a space: script, storyboard, direction on the day and an edited master built for your primary channel. We keep crews small and the story specific — the aim is a film that feels like the place, not a template with your logo on it.",
    idealFor: "Resorts, villas and brands that need a signature piece to lead a campaign.",
  },
  {
    slug: "short-films",
    title: "Short Films & Song Videos",
    summary: "Original storytelling work: shorts, music videos and independent passion projects.",
    inclusions: ["Casting support", "Location scouting", "Post production"],
    detail:
      "Independent narrative and music-video work — casting support, location scouting across Maharashtra, and a full post-production pass through picture and sound. Scoped project by project, with the same day-and-night light discipline we bring to commercial work.",
    idealFor: "Independent filmmakers and artists building original work.",
  },
  {
    slug: "virtual-tours",
    title: "360° Virtual Tours",
    summary: "Walkable, high-fidelity tours that let guests move through a space before they book.",
    inclusions: ["360° capture", "Hotspot linking", "Web embed"],
    detail:
      "Full 360° capture stitched into a walkable tour with linked hotspots for rooms, amenities and key sightlines, delivered as a lightweight web embed. Guests move through the space themselves before they ever book — no imagination required.",
    idealFor: "Resorts, hotels and villas selling a stay before a visit.",
  },
];

export const work = [
  {
    slug: "hillside-resort",
    title: "Hillside Resort",
    category: "Resorts",
    location: "Maharashtra",
    image: workResort,
    alt: "Boutique hillside resort at blue hour with mist rolling through the valley",
    blurb: "Blue-hour exteriors and warm interior sets for a monsoon campaign.",
    fullStory:
      "A two-day shoot built around the resort's monsoon campaign: exteriors timed to blue hour, when mist rolling through the valley reads best, paired with warm interior sets shot after check-in. The library covers the terrace, the pool deck and every guest-facing room, delivered as a graded still set plus a 60-second cutdown for social.",
    servicesUsed: ["photography", "videography"],
  },
  {
    slug: "kitchen-brand-film",
    title: "Kitchen Brand Film",
    category: "Brand Films",
    location: "Nagpur",
    image: workBrandFilm,
    alt: "Cinema camera filming a chef plating a dish in a warm, dim kitchen",
    blurb: "A three-minute film following one dish from prep to plate.",
    fullStory:
      "A three-minute brand film following a single signature dish from prep to plate, shot handheld and close in a working kitchen with minimal disruption to service. Lit almost entirely with the kitchen's own practicals, graded warm, and cut with a sound pass built around real kitchen noise rather than a stock score.",
    servicesUsed: ["cinematography", "brand-films"],
  },
  {
    slug: "private-villa-tour",
    title: "Private Villa Tour",
    category: "360° Tours",
    location: "Nagpur",
    image: workVilla,
    alt: "Wide interior view of a modern luxury villa living room lit at night",
    blurb: "A walkable 360° tour paired with a night-light stills set.",
    fullStory:
      "A full walkable 360° capture of a private villa, linked with hotspots between the living areas, bedrooms and pool deck, paired with a night-light stills set for listing and social use. Built so a prospective guest can move through the property themselves before ever booking a viewing.",
    servicesUsed: ["virtual-tours", "photography"],
  },
];

export const process = [
  {
    step: "01",
    title: "Listen",
    body: "We start with the space and the people in it — what it feels like at 7am and at 9pm.",
  },
  {
    step: "02",
    title: "Design the shoot",
    body: "Shot list, light plan, golden-hour and night windows, references, and a clear call sheet.",
  },
  {
    step: "03",
    title: "Film",
    body: "A small, quiet crew. Minimal disruption to service, maximum control over light.",
  },
  {
    step: "04",
    title: "Deliver",
    body: "Graded masters, platform-ready cuts, and organised libraries you can actually use.",
  },
];

export const pricing = [
  {
    name: "Essential",
    bestFor: "Cafes & small studios",
    priceLabel: "From ₹25,000",
    features: ["Half-day shoot", "25 edited stills", "1 vertical reel"],
  },
  {
    name: "Signature",
    bestFor: "Resorts & villas",
    priceLabel: "From ₹65,000",
    features: ["Day + night full-day shoot", "60 edited stills", "60s brand film + 3 reels"],
    featured: true,
  },
  {
    name: "Production",
    bestFor: "Brands & campaigns",
    priceLabel: "On request",
    features: [
      "Multi-day, multi-location",
      "Full crew & direction",
      "360° tour + campaign library",
    ],
  },
];

export const faqs = [
  {
    question: "How far do you travel for a shoot?",
    answer:
      "We are based in Nagpur and shoot across Maharashtra and central India. Travel and stay are quoted separately for outstation work.",
  },
  {
    question: "What is the day + night approach?",
    answer:
      "Most spaces have two personalities. We plan a golden-hour window and a night-light window in the same schedule, so you get both in one project.",
  },
  {
    question: "How long until we get the files?",
    answer:
      "Stills are typically delivered in 5–7 working days, films in 10–14 working days, depending on scope. Rush timelines can be arranged.",
  },
  {
    question: "Do you shoot while our venue is open?",
    answer:
      "Yes. We work with a compact crew and plan around your service hours, or shoot pre-opening when full control of the room is needed.",
  },
];
