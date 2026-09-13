import { siteConfig } from "./site.config";
import type { Equipment } from "./types";

/**
 * Affiliate link construction.
 *
 * Business rules from the brief:
 *  - we never take payment for equipment, we hand the user off;
 *  - prefer one multi-item Amazon add-to-cart link, fall back to per-item;
 *  - items can come from Amazon, a brand's own program, or a drop-shipper, and
 *    non-Amazon sources must survive the same code path untouched.
 */

export type CartLine = { equipment: Equipment; quantity: number };

/** Amazon's multi-item add-to-cart endpoint caps out well below this in practice. */
const MAX_AMAZON_CART_ITEMS = 10;

export function isAmazonItem(equipment: Equipment): boolean {
  return equipment.sourceType === "amazon" && Boolean(equipment.asin);
}

/** Per-item link, tagged. Non-Amazon sources keep their own URL. */
export function buildItemUrl(equipment: Equipment): string {
  if (equipment.sourceType === "amazon") {
    const base = equipment.asin
      ? `https://${siteConfig.amazonDomain}/dp/${equipment.asin}`
      : equipment.sourceUrl;
    return withParams(base, { tag: siteConfig.amazonTag });
  }
  // Brand programs use their own network params; the placeholder ref keeps the
  // shape right until each program's real tracking id is dropped in.
  return withParams(equipment.sourceUrl, { ref: siteConfig.amazonTag });
}

/**
 * One link that drops every Amazon line into the cart at the right quantity.
 * Returns null when nothing in the plan is an Amazon item.
 */
export function buildAmazonCartUrl(lines: CartLine[]): string | null {
  return buildAmazonCartUrls(lines)[0] ?? null;
}

/**
 * Amazon's add-to-cart endpoint only carries so many products, so a big plan is
 * split into batches. A 14-product plan becomes two clicks — never 14 links.
 */
export function buildAmazonCartUrls(lines: CartLine[]): string[] {
  const amazonLines = lines.filter((line) => isAmazonItem(line.equipment));
  const urls: string[] = [];

  for (let i = 0; i < amazonLines.length; i += MAX_AMAZON_CART_ITEMS) {
    const batch = amazonLines.slice(i, i + MAX_AMAZON_CART_ITEMS);
    const params = new URLSearchParams({ AssociateTag: siteConfig.amazonTag });
    batch.forEach((line, n) => {
      params.set(`ASIN.${n + 1}`, line.equipment.asin!);
      params.set(`Quantity.${n + 1}`, String(line.quantity));
    });
    urls.push(
      `https://${siteConfig.amazonDomain}/gp/aws/cart/add.html?${params.toString()}`,
    );
  }

  return urls;
}

/** How many products each cart batch carries, for labelling the buttons. */
export function amazonBatchSizes(lines: CartLine[]): number[] {
  const count = lines.filter((line) => isAmazonItem(line.equipment)).length;
  const sizes: number[] = [];
  for (let i = 0; i < count; i += MAX_AMAZON_CART_ITEMS) {
    sizes.push(Math.min(MAX_AMAZON_CART_ITEMS, count - i));
  }
  return sizes;
}

/**
 * Lines no cart link can carry, shown as per-item fallbacks. In Phase 1 the
 * catalog is Amazon-only so this is normally empty — it exists to keep the page
 * honest if a row ever loses its ASIN or a brand-direct row comes back.
 */
export function linesNeedingDirectLinks(lines: CartLine[]): CartLine[] {
  return lines.filter((line) => !isAmazonItem(line.equipment));
}

export function sourceLabel(equipment: Equipment): string {
  switch (equipment.sourceType) {
    case "amazon":
      return "Amazon";
    case "brand":
      return equipment.brand;
    case "dropship":
      return "Ships direct";
  }
}

/**
 * "Brand · where it comes from", collapsed when a brand-direct item would
 * otherwise read "REP Fitness · REP Fitness".
 */
export function sourceMetaLine(equipment: Equipment): string {
  const label = sourceLabel(equipment);
  return label === equipment.brand
    ? equipment.brand
    : `${equipment.brand} · ${label}`;
}

/** Text for the buy button — never "Buy at Ships direct". */
export function buyLabel(equipment: Equipment): string {
  switch (equipment.sourceType) {
    case "amazon":
      return "Check price on Amazon";
    case "brand":
      return `Buy at ${equipment.brand}`;
    case "dropship":
      return "Buy direct";
  }
}

function withParams(url: string, params: Record<string, string>): string {
  try {
    const u = new URL(url);
    for (const [key, value] of Object.entries(params)) {
      u.searchParams.set(key, value);
    }
    return u.toString();
  } catch {
    return url;
  }
}
