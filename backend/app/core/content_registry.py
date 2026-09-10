"""Explicit field allowlists for every CMS content collection.

This is the "safe CRUD abstraction" required by rules.md / techspec.md: a
single generic repository + service + router factory is reused across
collections, but every collection declares exactly which fields it accepts,
which are required, and which have enum/default constraints. Nothing outside
FIELDS is ever read from the request body or returned that wasn't stored —
this is what prevents a generic route from accidentally exposing or
accepting restricted fields.

Field type keys map to Python types used for a lightweight runtime check in
ContentService (str, int, float, bool, list, dict). `enum` restricts allowed
string values. `default` is applied when the field is omitted on create.
"""

from typing import Any, NotRequired, TypedDict


class FieldSpec(TypedDict, total=False):
    type: type
    required: bool
    default: Any
    enum: list[str]


class CollectionSpec(TypedDict):
    fields: dict[str, FieldSpec]
    slug_field: str | None
    public_filter: dict[str, Any]
    media_fields: NotRequired[list[str]]


def _f(**kwargs: Any) -> FieldSpec:
    return kwargs  # type: ignore[return-value]


_SEO_FIELD = _f(type=dict, required=False, default={})
_COMMON = {
    "sortOrder": _f(type=int, required=False, default=0),
    "visible": _f(type=bool, required=False, default=True),
    "seo": _SEO_FIELD,
}

COLLECTIONS: dict[str, CollectionSpec] = {
    "services": {
        "slug_field": "slug",
        "public_filter": {"state": "published"},
        "fields": {
            "title": _f(type=str, required=True),
            "subtitle": _f(type=str, required=False),
            "description": _f(type=str, required=False),
            "heroMedia": _f(type=str, required=False),
            "cardImage": _f(type=str, required=False),
            "gallery": _f(type=list, required=False, default=[]),
            "tags": _f(type=list, required=False, default=[]),
            "slug": _f(type=str, required=False),
            "state": _f(type=str, required=False, default="draft", enum=["draft", "published"]),
            "pricingLabel": _f(type=str, required=False),
            "pricingRange": _f(type=str, required=False),
            "inclusions": _f(type=list, required=False, default=[]),
            "ctaLabel": _f(type=str, required=False),
            "ctaUrl": _f(type=str, required=False),
            **_COMMON,
        },
    },
    "projects": {
        "slug_field": "slug",
        "public_filter": {"state": "published"},
        "fields": {
            "title": _f(type=str, required=True),
            "shortDescription": _f(type=str, required=False),
            "body": _f(type=str, required=False),
            "description": _f(type=str, required=False),
            "creativeDirection": _f(type=str, required=False),
            "approach": _f(type=str, required=False),
            "outcome": _f(type=str, required=False),
            "coverImage": _f(type=str, required=False),
            "cardImage": _f(type=str, required=False),
            "gallery": _f(type=list, required=False, default=[]),
            "keyFeatures": _f(type=list, required=False, default=[]),
            "services": _f(type=list, required=False, default=[]),
            "projectDetails": _f(type=dict, required=False, default={}),
            "testimonial": _f(type=dict, required=False, default={}),
            "video": _f(type=dict, required=False, default={}),
            "categories": _f(type=list, required=False, default=[]),
            "clientRef": _f(type=str, required=False),
            "projectDate": _f(type=str, required=False),
            "location": _f(type=str, required=False),
            "featured": _f(type=bool, required=False, default=False),
            "slug": _f(type=str, required=False),
            "state": _f(type=str, required=False, default="draft", enum=["draft", "published"]),
            "altCaptions": _f(type=dict, required=False, default={}),
            **_COMMON,
        },
    },
    "products": {
        "slug_field": "slug",
        "public_filter": {"state": "published"},
        "fields": {
            "name": _f(type=str, required=True),
            "description": _f(type=str, required=False),
            "images": _f(type=list, required=False, default=[]),
            "specifications": _f(type=dict, required=False, default={}),
            "categories": _f(type=list, required=False, default=[]),
            "priceTiers": _f(type=list, required=False, default=[]),
            "featured": _f(type=bool, required=False, default=False),
            "slug": _f(type=str, required=False),
            "state": _f(type=str, required=False, default="draft", enum=["draft", "published"]),
            **_COMMON,
        },
    },
    "industries": {
        "slug_field": "slug",
        "public_filter": {"state": "published"},
        "fields": {
            "name": _f(type=str, required=True),
            "title": _f(type=str, required=False),
            "intro": _f(type=str, required=False),
            "body": _f(type=str, required=False),
            "bannerImage": _f(type=str, required=False),
            "supportingImages": _f(type=list, required=False, default=[]),
            "ctaLabel": _f(type=str, required=False),
            "ctaUrl": _f(type=str, required=False),
            "slug": _f(type=str, required=False),
            "state": _f(type=str, required=False, default="draft", enum=["draft", "published"]),
            **_COMMON,
        },
    },
    "clients": {
        "slug_field": None,
        "public_filter": {"visible": True},
        "fields": {
            "name": _f(type=str, required=True),
            "logoMedia": _f(type=str, required=False),
            "url": _f(type=str, required=False),
            "description": _f(type=str, required=False),
            **_COMMON,
        },
    },
    "partners": {
        "slug_field": None,
        "public_filter": {"visible": True},
        "fields": {
            "name": _f(type=str, required=True),
            "logoMedia": _f(type=str, required=False),
            "url": _f(type=str, required=False),
            "description": _f(type=str, required=False),
            **_COMMON,
        },
    },
    "categories": {
        "slug_field": "slug",
        "public_filter": {},
        "fields": {
            "type": _f(
                type=str, required=True, enum=["portfolio", "blog", "product", "gallery"]
            ),
            "name": _f(type=str, required=True),
            "slug": _f(type=str, required=False),
            "description": _f(type=str, required=False),
            "sortOrder": _f(type=int, required=False, default=0),
        },
    },
    "team_members": {
        "slug_field": None,
        "public_filter": {"visible": True},
        "fields": {
            "name": _f(type=str, required=True),
            "role": _f(type=str, required=False),
            "bio": _f(type=str, required=False),
            "photo": _f(type=str, required=False),
            "socialLinks": _f(type=dict, required=False, default={}),
            **_COMMON,
        },
    },
    "testimonials": {
        "slug_field": None,
        "public_filter": {"visible": True},
        "fields": {
            "quote": _f(type=str, required=True),
            "author": _f(type=str, required=True),
            "company": _f(type=str, required=False),
            "authorPhoto": _f(type=str, required=False),
            "rating": _f(type=int, required=False),
            **_COMMON,
        },
    },
    "pricing_plans": {
        "slug_field": None,
        "public_filter": {"visible": True},
        "fields": {
            "planName": _f(type=str, required=True),
            "summary": _f(type=str, required=False),
            "features": _f(type=list, required=False, default=[]),
            "priceLabel": _f(type=str, required=False),
            "priceAmount": _f(type=float, required=False),
            "currency": _f(type=str, required=False, default="INR"),
            "accentToken": _f(type=str, required=False),
            "bestFor": _f(type=str, required=False),
            "featured": _f(type=bool, required=False, default=False),
            "ctaLabel": _f(type=str, required=False),
            "ctaUrl": _f(type=str, required=False),
            **_COMMON,
        },
    },
    "hero_slides": {
        "slug_field": None,
        "public_filter": {"visible": True},
        "fields": {
            "eyebrow": _f(type=str, required=False),
            "headline": _f(type=str, required=True),
            "title": _f(type=str, required=False),
            "subhead": _f(type=str, required=False),
            "quote": _f(type=str, required=False),
            "ctaLabel": _f(type=str, required=False),
            "ctaUrl": _f(type=str, required=False),
            "primaryCtaShow": _f(type=bool, required=False, default=True),
            "primaryCtaNewTab": _f(type=bool, required=False, default=False),
            "secondaryCtaLabel": _f(type=str, required=False),
            "secondaryCtaUrl": _f(type=str, required=False),
            "secondaryCtaShow": _f(type=bool, required=False, default=True),
            "secondaryCtaNewTab": _f(type=bool, required=False, default=False),
            "mediaType": _f(type=str, required=False, default="image", enum=["image", "video"]),
            "imageUrl": _f(type=str, required=False),
            "videoUrl": _f(type=str, required=False),
            "mediaUrl": _f(type=str, required=False),
            "media": _f(type=str, required=False),
            "backgroundImage": _f(type=str, required=False),
            "backgroundVideo": _f(type=str, required=False),
            "backgroundMedia": _f(type=str, required=False),
            "imagePosition": _f(type=str, required=False, default="center"),
            "altText": _f(type=str, required=False),
            "videoSource": _f(type=str, required=False, default="url"),
            "posterUrl": _f(type=str, required=False),
            "posterImage": _f(type=str, required=False),
            "videoAutoplay": _f(type=bool, required=False, default=True),
            "videoMuted": _f(type=bool, required=False, default=True),
            "videoLoop": _f(type=bool, required=False, default=True),
            "videoPlayInline": _f(type=bool, required=False, default=True),
            "overlayEnabled": _f(type=bool, required=False, default=True),
            "overlayType": _f(type=str, required=False, default="solid"),
            "overlayOpacity": _f(type=int, required=False, default=65),
            "horizontalPos": _f(type=str, required=False, default="left"),
            "verticalPos": _f(type=str, required=False, default="bottom"),
            "mobileImageUrl": _f(type=str, required=False),
            "mobileVideoUrl": _f(type=str, required=False),
            "mobileMedia": _f(type=str, required=False),
            "slideDuration": _f(type=int, required=False, default=7),
            "transitionDuration": _f(type=float, required=False, default=1.2),
            "focalPoint": _f(type=dict, required=False, default={"x": 0.5, "y": 0.5}),
            "overlay": _f(type=dict, required=False, default={}),
            "loopSettings": _f(type=dict, required=False, default={}),
            **_COMMON,
        },
    },
    "gallery_items": {
        "slug_field": None,
        "public_filter": {"visible": True},
        "fields": {
            "title": _f(type=str, required=False),
            "media": _f(type=str, required=True),
            "categories": _f(type=list, required=False, default=[]),
            "projectRef": _f(type=str, required=False),
            "altText": _f(type=str, required=False),
            **_COMMON,
        },
    },
    "faqs": {
        "slug_field": None,
        "public_filter": {"visible": True},
        "fields": {
            "question": _f(type=str, required=True),
            "answer": _f(type=str, required=True),
            "group": _f(type=str, required=False),
            "sortOrder": _f(type=int, required=False, default=0),
            "visible": _f(type=bool, required=False, default=True),
        },
    },
    "statistics": {
        "slug_field": None,
        "public_filter": {"visible": True},
        "fields": {
            "label": _f(type=str, required=True),
            "value": _f(type=str, required=True),
            "suffix": _f(type=str, required=False),
            "description": _f(type=str, required=False),
            "icon": _f(type=str, required=False),
            "sortOrder": _f(type=int, required=False, default=0),
            "visible": _f(type=bool, required=False, default=True),
        },
    },
    "blog_posts": {
        "slug_field": "slug",
        "public_filter": {"state": "published"},
        "fields": {
            "title": _f(type=str, required=True),
            "excerpt": _f(type=str, required=False),
            "contentHtml": _f(type=str, required=False),
            "contentJson": _f(type=dict, required=False, default={}),
            "coverImages": _f(type=list, required=False, default=[]),
            "publishDate": _f(type=str, required=False),
            "author": _f(type=str, required=False),
            "tags": _f(type=list, required=False, default=[]),
            "category": _f(type=str, required=False),
            "slug": _f(type=str, required=False),
            "state": _f(
                type=str,
                required=False,
                default="draft",
                enum=["draft", "scheduled", "published"],
            ),
            "externalId": _f(type=str, required=False),
            **_COMMON,
        },
    },
}

# Fields whose value (a media document id, or a list of them) needs
# reference-count tracking — see MediaService.reference/dereference and
# ContentService's create/update/delete hooks. Declared separately from
# COLLECTIONS above so every collection's field allowlist stays readable.
MEDIA_FIELDS: dict[str, list[str]] = {
    "services": ["heroMedia", "cardImage", "gallery"],
    "projects": ["coverImage", "cardImage", "gallery"],
    "hero_slides": [
        "media",
        "mobileMedia",
        "posterImage",
        "imageUrl",
        "mobileImageUrl",
        "posterUrl",
        "videoUrl",
        "mobileVideoUrl",
        "backgroundMedia",
        "backgroundImage",
        "backgroundVideo",
        "mediaUrl",
    ],
    "products": ["images"],
    "industries": ["bannerImage", "supportingImages"],
    "clients": ["logoMedia"],
    "partners": ["logoMedia"],
    "categories": [],
    "team_members": ["photo"],
    "testimonials": ["authorPhoto"],
    "pricing_plans": [],
    "gallery_items": ["media"],
    "faqs": [],
    "statistics": [],
    "blog_posts": ["coverImages"],
}

for _name, _spec in COLLECTIONS.items():
    _spec["media_fields"] = MEDIA_FIELDS.get(_name, [])


def slugify(value: str) -> str:
    import re

    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "item"
