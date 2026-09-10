"""Seed MongoDB with sample content for all 15 collections + Super Admin user.

Usage: python -m scripts.seed_mongo
"""

import asyncio
from datetime import datetime, timezone
from app.core.config import get_settings
from app.core.db import get_db, ensure_indexes
from app.core.security import hash_password
from app.repositories.users import UsersRepository
from app.core.content_registry import slugify

async def main() -> None:
    print("[INFO] Initializing MongoDB connection & indexes...")
    await ensure_indexes()
    db = get_db()
    settings = get_settings()

    # 1. Seed Super Admin User
    users_repo = UsersRepository(db)
    existing_admin = await users_repo.find_by_email(settings.seed_admin_email)
    if not existing_admin:
        await users_repo.create(
            email=settings.seed_admin_email,
            password_hash=hash_password(settings.seed_admin_password),
            role="super_admin",
            must_change_password=True,
        )
        print(f"[OK] Seeded Super Admin: {settings.seed_admin_email}")
    else:
        await users_repo._collection.update_one(
            {"_id": existing_admin["_id"]},
            {"$set": {"passwordHash": hash_password(settings.seed_admin_password)}}
        )
        print(f"[OK] Updated Super Admin password for {settings.seed_admin_email}")

    now = datetime.now(timezone.utc).isoformat()

    # Helper function to seed collection items (re-populating if empty or force updated)
    async def seed_collection(coll_name: str, items: list[dict], force_reseed: bool = True):
        collection = db[coll_name]
        if force_reseed:
            await collection.delete_many({})

        for idx, item in enumerate(items):
            item.setdefault("sortOrder", idx + 1)
            item.setdefault("visible", True)
            item.setdefault("createdAt", now)
            item.setdefault("updatedAt", now)
            if "title" in item and "slug" not in item:
                item["slug"] = slugify(item["title"])
            elif "name" in item and "slug" not in item:
                item["slug"] = slugify(item["name"])

        result = await collection.insert_many(items)
        print(f"[OK] Collection '{coll_name}': Inserted {len(result.inserted_ids)} items.")

    # 2. Content
    content_data = [
        {
            "title": "About Mirabilis Visual Studio",
            "section": "About",
            "body": "We are a premier visual storytelling studio based in Nagpur, specializing in golden-hour and night-light architectural photography, cinematic brand films, and immersive 360° virtual tours for luxury resorts, boutique cafes, and lifestyle brands.",
            "mediaUrl": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80",
            "state": "published",
        },
        {
            "title": "Our Craft & Philosophy",
            "section": "Philosophy",
            "body": "Every room has two personalities: how it feels at 8 AM and how it glows at 9 PM. We plan every shoot across both light windows so your brand has a complete visual library that sells all day long.",
            "mediaUrl": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=80",
            "state": "published",
        }
    ]
    await seed_collection("content", content_data)

    # 3. Services
    services_data = [
        {
            "title": "Architectural & Interior Photography",
            "subtitle": "Capturing spaces in golden hour and warm after-glow",
            "description": "High-end photography for luxury resorts, boutique villas, fine-dining cafes, and premium corporate spaces.",
            "heroMedia": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1600&q=80",
            "cardImage": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
            "slug": "architectural-interior-photography",
            "state": "published",
            "pricingLabel": "Starting at ₹45,000",
            "inclusions": ["HDR Lighting", "25 High-Res Edits", "Drone Aerial Pass", "Commercial Rights"],
        },
        {
            "title": "Cinematic Brand Films",
            "subtitle": "Emotive video storytelling for hospitality and lifestyle",
            "description": "Short form and long form cinematic video production capturing atmosphere, food, ambience, and guest experience.",
            "heroMedia": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=80",
            "cardImage": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
            "slug": "cinematic-brand-films",
            "state": "published",
            "pricingLabel": "Starting at ₹85,000",
            "inclusions": ["4K Master Cinema Cut", "Social Reels (3x)", "Licensed Soundtrack", "Color Grading"],
        },
        {
            "title": "360° Virtual Tours & Walkthroughs",
            "subtitle": "Immersive digital exploration for prospective guests",
            "description": "Matterport and custom 360-degree interactive virtual walk-throughs for real estate, resorts, and event venues.",
            "heroMedia": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80",
            "cardImage": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
            "slug": "360-virtual-tours",
            "state": "published",
            "pricingLabel": "Starting at ₹35,000",
            "inclusions": ["3D Dollhouse View", "Interactive Hotspots", "Google Maps VR Integration", "1 Year Hosting"],
        },
        {
            "title": "Drone Aerial Cinematography",
            "subtitle": "Breathtaking landscape and architectural flyovers",
            "description": "FAA-certified drone pilots delivering 4K aerial visuals highlighting resort acreage, hilltop vistas, and exterior architecture.",
            "heroMedia": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80",
            "cardImage": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
            "slug": "drone-aerial-cinematography",
            "state": "published",
            "pricingLabel": "Starting at ₹25,000",
            "inclusions": ["4K Drone Flight Pass", "Licensed Aerial Pilot", "RAW & Graded Footage"],
        }
    ]
    await seed_collection("services", services_data)

    # 4. Projects (Portfolio)
    projects_data = [
        {
            "title": "Hillside Sanctuary Resort",
            "shortDescription": "Twilight and dawn visual campaign for a luxury hilltop wellness retreat.",
            "body": "Comprehensive photography and brand film capturing 40 private villas, infinity pool deck, and farm-to-table dining.",
            "categories": ["Resorts", "Hospitality"],
            "location": "Nagpur Outskirts",
            "projectDate": "2026-02",
            "featured": True,
            "slug": "hillside-sanctuary-resort",
            "state": "published",
            "coverImage": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
            "cardImage": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
            "gallery": [
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
                "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=80"
            ],
        },
        {
            "title": "Copper & Charcoal Artisan Bistro",
            "shortDescription": "Moody interior aesthetic and culinary cinematography for a gourmet bistro.",
            "body": "Focusing on wood-fire cooking, handcrafted cocktails, and industrial vintage interiors.",
            "categories": ["Cafes & Bistros"],
            "location": "Civil Lines, Nagpur",
            "projectDate": "2026-01",
            "featured": True,
            "slug": "copper-charcoal-artisan-bistro",
            "state": "published",
            "coverImage": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80",
            "cardImage": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
            "gallery": [
                "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80"
            ],
        },
        {
            "title": "Glasshouse Pavilion Villa",
            "shortDescription": "Modernist glass architectural walkthrough and dusk stills.",
            "body": "Minimalist luxury villa production showcasing floor-to-ceiling glass, private infinity deck, and ambient lighting.",
            "categories": ["Villas & Real Estate"],
            "location": "Wayanad, Kerala",
            "projectDate": "2025-12",
            "featured": True,
            "slug": "glasshouse-pavilion-villa",
            "state": "published",
            "coverImage": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
            "cardImage": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
            "gallery": [
                "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80"
            ],
        }
    ]
    await seed_collection("projects", projects_data)

    # 5. Products
    products_data = [
        {
            "name": "Mirabilis Afterglow LUT Preset Pack",
            "description": "Signature color-grading LUTs engineered for architectural and twilight hospitality videos.",
            "price": 2499.0,
            "currency": "INR",
            "images": ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80"],
            "state": "published",
        },
        {
            "name": "Fine Art Architectural Print: Hillside Dawn",
            "description": "Limited edition gallery print on archival museum-grade rag paper.",
            "price": 7999.0,
            "currency": "INR",
            "images": ["https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80"],
            "state": "published",
        }
    ]
    await seed_collection("products", products_data)

    # 6. Industries
    industries_data = [
        {
            "title": "Luxury Hospitality & Resorts",
            "description": "Visual assets built to increase direct booking conversions and elevate luxury perception.",
            "bannerImage": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
            "state": "published",
        },
        {
            "title": "Boutique Cafes & Fine Dining",
            "description": "Atmospheric food, beverage, and interior imagery designed for social engagement.",
            "bannerImage": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80",
            "state": "published",
        },
        {
            "title": "High-End Architectural Real Estate",
            "description": "Immersive 3D virtual walkthroughs and twilight stills for premier estates.",
            "bannerImage": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
            "state": "published",
        }
    ]
    await seed_collection("industries", industries_data)

    # 7. Clients
    clients_data = [
        {
            "name": "Hillside Retreats Ltd.",
            "industry": "Hospitality",
            "logoMedia": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&q=80",
            "website": "https://hillsideretreats.example.com",
        },
        {
            "name": "Copper & Charcoal Group",
            "industry": "Culinary & Dining",
            "logoMedia": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80",
            "website": "https://coppercharcoal.example.com",
        },
        {
            "name": "Zenith Living Estates",
            "industry": "Real Estate",
            "logoMedia": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80",
            "website": "https://zenithliving.example.com",
        }
    ]
    await seed_collection("clients", clients_data)

    # 8. Partners
    partners_data = [
        {
            "name": "Sony Alpha Cinema India",
            "partnerType": "Equipment Partner",
            "logoMedia": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80",
        },
        {
            "name": "Matterport 3D Spatial Systems",
            "partnerType": "Technology Partner",
            "logoMedia": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80",
        }
    ]
    await seed_collection("partners", partners_data)

    # 9. Categories
    categories_data = [
        {"type": "portfolio", "name": "Resorts & Hotels", "slug": "resorts-hotels"},
        {"type": "portfolio", "name": "Cafes & Dining", "slug": "cafes-dining"},
        {"type": "portfolio", "name": "Villas & Estates", "slug": "villas-estates"},
        {"type": "blog", "name": "Hospitality Insights", "slug": "hospitality-insights"},
        {"type": "blog", "name": "Behind The Lens", "slug": "behind-the-lens"},
    ]
    await seed_collection("categories", categories_data)

    # 10. Team Members
    team_data = [
        {
            "name": "Siddharth Sharma",
            "role": "Director & Principal Cinematographer",
            "bio": "Over 8 years directing visual campaigns for top luxury resorts and hospitality brands.",
            "photo": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80",
            "social": {"instagram": "@siddharth_films"},
        },
        {
            "name": "Ananya Roy",
            "role": "Lead Architectural Photographer",
            "bio": "Specializes in natural light balance and twilight exterior architectural frames.",
            "photo": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80",
            "social": {"instagram": "@ananya_frames"},
        },
        {
            "name": "Rohan Varma",
            "role": "360° Spatial & Post Production Lead",
            "bio": "Master colorist and Matterport 3D spatial tour developer.",
            "photo": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
            "social": {"instagram": "@rohan_post"},
        }
    ]
    await seed_collection("team_members", team_data)

    # 11. Testimonials
    testimonials_data = [
        {
            "quote": "Mirabilis captured our villa with such cinematic warmth that our weekend occupancy surged 40% within a month of launching the campaign.",
            "author": "Rohan Deshmukh",
            "company": "Founder, Hillside Retreats",
            "authorPhoto": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80",
            "rating": 5,
        },
        {
            "quote": "The 360° virtual tour and night-light food reels set a new standard for our marketing. Guests constantly compliment the aesthetic.",
            "author": "Meera Kapoor",
            "company": "Marketing Lead, Copper & Charcoal Bistro",
            "authorPhoto": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&q=80",
            "rating": 5,
        }
    ]
    await seed_collection("testimonials", testimonials_data)

    # 12. Pricing Plans
    pricing_data = [
        {
            "planName": "Essential Pass",
            "summary": "Best for boutique cafes, small restaurants, and luxury Airbnb stays.",
            "priceLabel": "₹45,000",
            "priceAmount": 45000.0,
            "currency": "INR",
            "featured": False,
            "bestFor": "Boutique Cafes & Airbnbs",
            "features": ["1 Day Shoot", "20 High-Res Still Photos", "1 Social Reel (1080p)", "Full Commercial License"],
        },
        {
            "planName": "Signature Story",
            "summary": "Our most chosen complete production pass for resorts, hotels, and venues.",
            "priceLabel": "₹95,000",
            "priceAmount": 95000.0,
            "currency": "INR",
            "featured": True,
            "bestFor": "Resorts & Hotels",
            "features": ["2 Days (Golden Hour + Night Pass)", "45 High-Res Stills", "60s Brand Film (4K)", "3 Social Reels", "Drone Aerial Pass"],
        },
        {
            "planName": "Full Studio Production",
            "summary": "End-to-end bespoke visual production & interactive 360° virtual tour.",
            "priceLabel": "₹1,75,000",
            "priceAmount": 175000.0,
            "currency": "INR",
            "featured": False,
            "bestFor": "Grand Venues & Real Estate",
            "features": ["3 Days Complete Access", "All Stills & Raw Files", "3D Virtual Tour", "2m Cinema Brand Film", "Full Team On-Set"],
        }
    ]
    await seed_collection("pricing_plans", pricing_data)

    # 13. Hero Slides (EXCEPT HERO SLIDES HAS NO DEFAULT IMAGE AS REQUESTED)
    hero_data = [
        {
            "eyebrow": "VISUAL PRODUCTION STUDIO",
            "headline": "Golden hour and after dark, in one story.",
            "subhead": "Photography · Videography · 360° Virtual Tours for Hospitality & Lifestyle Spaces.",
            "quote": "We capture the light that sells the room.",
            "ctaLabel": "Start a Project",
            "ctaUrl": "/contact",
            "secondaryCtaLabel": "Explore Work",
            "secondaryCtaUrl": "/work",
            "media": "",
            "imageUrl": "",
            "backgroundMedia": "",
        }
    ]
    await seed_collection("hero_slides", hero_data)

    # 14. Gallery Items
    gallery_data = [
        {
            "title": "Twilight Resort Pool Deck",
            "category": "Resorts",
            "media": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
            "caption": "Shot at 6:45 PM blue hour with subtle warm practical pool lights.",
        },
        {
            "title": "Artisan Coffee Bar Prep",
            "category": "Cafes",
            "media": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80",
            "caption": "Handcrafted espresso pass lit with warm brass practicals.",
        },
        {
            "title": "Modern Glasshouse Pavilion",
            "category": "Architecture",
            "media": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
            "caption": "Floor-to-ceiling glass living suite lit at dusk.",
        }
    ]
    await seed_collection("gallery_items", gallery_data)

    # 15. FAQs
    faqs_data = [
        {
            "question": "What is the typical turnaround time for a project?",
            "answer": "Photography edits are delivered within 5–7 business days. Color-graded 4K video cuts and 360° virtual tours are delivered within 10–12 business days.",
            "group": "General",
            "sortOrder": 1,
            "visible": True,
        },
        {
            "question": "Do you shoot outside Nagpur?",
            "answer": "Yes! We travel across Maharashtra, Goa, MP, and pan-India for resort and villa productions.",
            "group": "Logistics",
            "sortOrder": 2,
            "visible": True,
        },
        {
            "question": "What is your Golden Hour & Night Pass signature method?",
            "answer": "Every space changes personality with light. We shoot your venue during warm natural dusk and late-night architectural lighting to give you marketing assets for both day brunch & evening nightlife.",
            "group": "Production",
            "sortOrder": 3,
            "visible": True,
        }
    ]
    await seed_collection("faqs", faqs_data)

    # 16. Statistics
    statistics_data = [
        {
            "metric": "120+",
            "label": "Projects Completed",
            "description": "Across Maharashtra and central India.",
            "sortOrder": 1,
        },
        {
            "metric": "98%",
            "label": "Client Satisfaction Rate",
            "description": "Repeat business & word of mouth.",
            "sortOrder": 2,
        },
        {
            "metric": "45+",
            "label": "Luxury Venues Filmed",
            "description": "Resorts, boutique villas, and fine dining.",
            "sortOrder": 3,
        }
    ]
    await seed_collection("statistics", statistics_data)

    # 17. Blog Posts
    blog_data = [
        {
            "title": "Why Night Photography Doubles Resort Booking Conversions",
            "excerpt": "Most travel decisions happen in the evening. Here is how dramatic night lighting drives emotional check-in desires.",
            "contentHtml": "<p>When prospective guests browse resorts on mobile devices after work, night-lighting imagery evokes warmth, tranquility, and luxury...</p>",
            "publishDate": "2026-02-15",
            "author": "Mirabilis Studio Team",
            "category": "Hospitality Insights",
            "tags": ["Photography", "Marketing", "Resorts"],
            "slug": "why-night-photography-doubles-resort-bookings",
            "state": "published",
            "coverImages": ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80"],
        },
        {
            "title": "How 360° Virtual Tours Engage Modern Travel Shoppers",
            "excerpt": "Allowing prospective guests to walk through your resort before booking builds unmatched trust.",
            "contentHtml": "<p>Virtual walkthroughs eliminate uncertainty for high-value suite bookings...</p>",
            "publishDate": "2026-02-10",
            "author": "Mirabilis Studio Team",
            "category": "Behind The Lens",
            "tags": ["360 Tours", "Virtual Reality", "Hospitality"],
            "slug": "how-360-virtual-tours-engage-modern-travel-shoppers",
            "state": "published",
            "coverImages": ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80"],
        }
    ]
    await seed_collection("blog_posts", blog_data)

    print("--------------------------------------------------")
    print("[SUCCESS] ALL 15 MONGO COLLECTIONS RE-SEEDED SUCCESSFULLY!")
    print("--------------------------------------------------")

if __name__ == "__main__":
    asyncio.run(main())
