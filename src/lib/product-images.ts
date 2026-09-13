/**
 * Real product photography.
 *
 * WHERE IMAGES MAY LEGALLY COME FROM
 *
 * 1. Amazon Product Advertising API (PA-API 5.0) — the only compliant route to
 *    Amazon's own listing images. Requires an approved Associates account plus
 *    three qualifying sales. Amazon removed image-link generation from
 *    SiteStripe in 2024, so there is no longer a manual alternative.
 *    Once we have PA-API, images arrive automatically and this file is only
 *    needed for overrides.
 *
 * 2. Manufacturer media / press kits — available TODAY, no PA-API needed.
 *    Titan, CAP, Bowflex, Concept2, Sunny, Valor and most others publish
 *    product photography for retail and affiliate partners, usually behind a
 *    "media kit", "dealer resources" or "affiliate assets" page, or on request
 *    by email. This is the fastest way to real photos before approval.
 *
 * 3. Photos we take or commission ourselves.
 *
 * NOT ALLOWED: scraping or hotlinking `m.media-amazon.com` image URLs outside
 * PA-API. It breaches the Associates Operating Agreement and the brands' own
 * copyright, and the penalty is termination of the Associates account — which
 * is the entire business. Don't.
 *
 * HOW TO ADD AN IMAGE
 *
 * Either drop a file into `public/products/` named after the equipment id
 * (e.g. `public/products/titan-t3-power-rack.jpg`) and it is picked up with no
 * code change, or add an absolute URL to the map below. Remote hosts must also
 * be added to `images.remotePatterns` in next.config.mjs if you switch to
 * next/image.
 */

/** equipment id -> absolute image URL. Overrides the drop-in folder. */
export const productImageOverrides: Record<string, string> = {
  // "titan-t3-power-rack": "https://cdn.example-brand.com/media/t3-rack.jpg",
};

/**
 * Extensions the `/api/product-images` route picks up from `public/products/`.
 * Files are matched by equipment id — `public/products/titan-t3-power-rack.jpg`
 * attaches to the item whose id is `titan-t3-power-rack`.
 */
export const PRODUCT_IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "avif",
] as const;
