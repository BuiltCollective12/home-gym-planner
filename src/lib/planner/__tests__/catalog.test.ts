import { describe, expect, it } from "vitest";
import { catalog, getEquipment } from "@/lib/catalog";
import { amazonData, amazonImageUrl } from "@/lib/amazon-data";
import { CATEGORIES } from "@/lib/types";
import { buildItemUrl, isAmazonItem } from "@/lib/affiliate";

/**
 * Catalog integrity.
 *
 * These guard the two failure modes that cost real money: an item that cannot
 * be bought (bad or missing ASIN) and an item whose footprint is nonsense (the
 * planner draws it wrong, and the buyer's room does not fit what they ordered).
 */

describe("catalog integrity", () => {
  it("has a unique id for every item", () => {
    const ids = catalog.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers every category", () => {
    const present = new Set(catalog.map((i) => i.category));
    for (const category of CATEGORIES) {
      expect(present.has(category), `no items in ${category}`).toBe(true);
    }
  });

  it("keeps at least three options in every category", () => {
    // A thin category means one dead listing leaves users with no real choice.
    for (const category of CATEGORIES) {
      const count = catalog.filter((i) => i.category === category).length;
      expect(count, `${category} has only ${count}`).toBeGreaterThanOrEqual(3);
    }
  });

  it("has no leftover placeholder ASINs", () => {
    const placeholders = catalog.filter((i) => i.asin?.includes("PLACE"));
    expect(placeholders.map((i) => i.id)).toEqual([]);
  });

  it("gives every item a well-formed ASIN", () => {
    for (const item of catalog) {
      expect(item.asin, `${item.id} has no ASIN`).toBeTruthy();
      expect(item.asin, `${item.id} ASIN looks wrong: ${item.asin}`).toMatch(
        /^[A-Z0-9]{10}$/,
      );
    }
  });

  it("never uses a known variation-parent ASIN", () => {
    /*
     * A variation parent renders a perfectly normal product page — in stock,
     * price, add-to-cart button — but has no size or colour selected, so the
     * multi-item cart endpoint drops it without erroring. That is what sent a
     * real buyer to a half-empty cart.
     *
     * These six were found the hard way. Re-adding one would look completely
     * fine in every other check, so it is worth naming them.
     */
    const knownParents: Record<string, string> = {
      B0B35ZF8XC: "CAP barbell family — use B09Z1BXM53",
      B0CM9VR4CL: "Nuobell colours — use B0BB8D5VTW",
      B0CQPCXJ3M: "Titan T-3 family — use B0964RMBNY",
      B0CZF39S2S: "Sportsroyals cage — use B0CPP4L531",
      B0CTRNZ9XC: "Synergee Games bar — use B07NZ6PK8F",
      B0G6Z84TQM: "BowFlex 552 — use B0G1V685WC",
      B07R82448W: "HulkFit power cage — use B07FBCX53N",
      B00NAHQP90: "Titan T-2 family — use B09CBXCJ83 (the 71in Short)",
    };
    for (const item of catalog) {
      const why = item.asin ? knownParents[item.asin] : undefined;
      expect(why, `${item.id} uses parent ASIN ${item.asin}: ${why}`).toBeUndefined();
    }
  });

  it("points every item at a distinct product", () => {
    const asins = catalog.map((i) => i.asin);
    const dupes = asins.filter((a, i) => asins.indexOf(a) !== i);
    expect(dupes).toEqual([]);
  });

  it("builds a tagged Amazon URL for every item", () => {
    for (const item of catalog) {
      expect(isAmazonItem(item), `${item.id} is not buyable`).toBe(true);
      const url = new URL(buildItemUrl(item));
      expect(url.hostname).toBe("www.amazon.com");
      expect(url.searchParams.get("tag")).toBeTruthy();
    }
  });

  it("uses plausible real-world dimensions and weights", () => {
    for (const item of catalog) {
      for (const dim of ["widthIn", "depthIn", "heightIn"] as const) {
        expect(item[dim], `${item.id}.${dim}`).toBeGreaterThan(0);
        // 35 ft. No machine approaches this, but flooring is sold by the roll
        // and a 33 ft turf run is a real product you cut down on site.
        expect(item[dim], `${item.id}.${dim} too big`).toBeLessThanOrEqual(420);
      }
      expect(item.weightLbs, `${item.id} weight`).toBeGreaterThan(0);
      expect(item.weightLbs, `${item.id} weight`).toBeLessThan(1500);
    }
  });

  it("prices everything, and sanely", () => {
    for (const item of catalog) {
      expect(typeof item.estPriceUsd, `${item.id} unpriced`).toBe("number");
      expect(item.estPriceUsd!).toBeGreaterThan(0);
      expect(item.estPriceUsd!, `${item.id} suspiciously dear`).toBeLessThan(
        6000,
      );
    }
  });

  it("declares ceiling clearance no shorter than the item itself", () => {
    for (const item of catalog) {
      if (item.ceilingClearanceIn === undefined) continue;
      expect(
        item.ceilingClearanceIn,
        `${item.id} clearance below its own height`,
      ).toBeGreaterThanOrEqual(item.heightIn);
    }
  });

  it("tags every item for search", () => {
    for (const item of catalog) {
      expect(item.tags.length, `${item.id} has no tags`).toBeGreaterThan(0);
    }
  });
});

describe("amazon data", () => {
  it("only holds records for real catalog items", () => {
    for (const id of Object.keys(amazonData)) {
      expect(getEquipment(id), `orphan record: ${id}`).toBeDefined();
    }
  });

  it("has an image and a checked price for every item", () => {
    const missing = catalog.filter((i) => !amazonData[i.id]?.imageId);
    expect(missing.map((i) => i.id)).toEqual([]);
  });

  it("records when each price was observed", () => {
    for (const [id, record] of Object.entries(amazonData)) {
      if (record.priceUsd === undefined) continue;
      expect(record.checkedOn, `${id} price has no date`).toMatch(
        /^\d{4}-\d{2}-\d{2}$/,
      );
    }
  });

  it("keeps our estimate within 15% of the observed price", () => {
    // Estimates drifting far from reality means the planner's budget total lies.
    const drifted: string[] = [];
    for (const item of catalog) {
      const observed = amazonData[item.id]?.priceUsd;
      if (observed === undefined || item.estPriceUsd === undefined) continue;
      const delta = Math.abs(item.estPriceUsd - observed) / observed;
      if (delta > 0.15) drifted.push(`${item.id} est ${item.estPriceUsd} vs ${observed}`);
    }
    expect(drifted).toEqual([]);
  });

  it("builds a valid CDN url from every image id", () => {
    for (const [id, record] of Object.entries(amazonData)) {
      if (!record.imageId) continue;
      const url = amazonImageUrl(record.imageId);
      expect(url, id).toMatch(
        /^https:\/\/m\.media-amazon\.com\/images\/I\/.+\._AC_SL\d+_\.jpg$/,
      );
    }
  });
});
