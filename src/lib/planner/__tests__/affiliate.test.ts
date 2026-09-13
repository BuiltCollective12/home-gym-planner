import { describe, expect, it } from "vitest";
import type { Equipment } from "@/lib/types";
import {
  buildAmazonCartUrl,
  buildAmazonCartUrls,
  amazonBatchSizes,
  buildItemUrl,
  isAmazonItem,
  linesNeedingDirectLinks,
  buyLabel,
  sourceMetaLine,
} from "@/lib/affiliate";
import { siteConfig } from "@/lib/site.config";

const make = (over: Partial<Equipment>): Equipment => ({
  id: "x",
  name: "X",
  brand: "Brand",
  category: "racks",
  widthIn: 10,
  depthIn: 10,
  heightIn: 10,
  weightLbs: 10,
  sourceType: "amazon",
  sourceUrl: "https://www.amazon.com/dp/B000000001",
  asin: "B000000001",
  tags: [],
  ...over,
});

describe("buildItemUrl", () => {
  it("tags Amazon links from the ASIN", () => {
    const url = new URL(buildItemUrl(make({ asin: "B0TEST12345" })));
    expect(url.pathname).toBe("/dp/B0TEST12345");
    expect(url.searchParams.get("tag")).toBe(siteConfig.amazonTag);
  });

  it("keeps a brand's own URL and adds a ref", () => {
    const url = new URL(
      buildItemUrl(
        make({
          sourceType: "brand",
          asin: undefined,
          sourceUrl: "https://www.repfitness.com/products/pr-4000",
        }),
      ),
    );
    expect(url.hostname).toBe("www.repfitness.com");
    expect(url.searchParams.get("ref")).toBe(siteConfig.amazonTag);
  });

  it("keeps drop-ship URLs intact", () => {
    const url = buildItemUrl(
      make({ sourceType: "dropship", asin: undefined, sourceUrl: "https://example.com/mat" }),
    );
    expect(url.startsWith("https://example.com/mat")).toBe(true);
  });

  it("falls back to sourceUrl for an Amazon item with no ASIN yet", () => {
    const url = new URL(
      buildItemUrl(make({ asin: undefined, sourceUrl: "https://www.amazon.com/s?k=rack" })),
    );
    expect(url.searchParams.get("tag")).toBe(siteConfig.amazonTag);
  });

  it("does not throw on a malformed URL", () => {
    expect(buildItemUrl(make({ sourceType: "brand", sourceUrl: "not a url" }))).toBe(
      "not a url",
    );
  });
});

describe("buildAmazonCartUrl", () => {
  it("packs every Amazon line with its quantity", () => {
    const url = new URL(
      buildAmazonCartUrl([
        { equipment: make({ id: "a", asin: "B0A" }), quantity: 1 },
        { equipment: make({ id: "b", asin: "B0B" }), quantity: 3 },
      ])!,
    );
    expect(url.searchParams.get("AssociateTag")).toBe(siteConfig.amazonTag);
    expect(url.searchParams.get("ASIN.1")).toBe("B0A");
    expect(url.searchParams.get("Quantity.1")).toBe("1");
    expect(url.searchParams.get("ASIN.2")).toBe("B0B");
    expect(url.searchParams.get("Quantity.2")).toBe("3");
  });

  it("ignores non-Amazon lines", () => {
    const url = new URL(
      buildAmazonCartUrl([
        { equipment: make({ id: "a", asin: "B0A" }), quantity: 1 },
        { equipment: make({ id: "b", sourceType: "brand", asin: undefined }), quantity: 1 },
      ])!,
    );
    expect(url.searchParams.get("ASIN.2")).toBeNull();
  });

  it("returns null when nothing is on Amazon", () => {
    expect(
      buildAmazonCartUrl([
        { equipment: make({ sourceType: "brand", asin: undefined }), quantity: 1 },
      ]),
    ).toBeNull();
    expect(buildAmazonCartUrl([])).toBeNull();
  });

  it("caps a single link at 10 items", () => {
    const lines = Array.from({ length: 14 }, (_, i) => ({
      equipment: make({ id: `i${i}`, asin: `B0${i}` }),
      quantity: 1,
    }));
    const url = new URL(buildAmazonCartUrl(lines)!);
    expect(url.searchParams.get("ASIN.10")).not.toBeNull();
    expect(url.searchParams.get("ASIN.11")).toBeNull();
  });
});

describe("buildAmazonCartUrls", () => {
  const many = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      equipment: make({ id: `i${i}`, asin: `B0${i}` }),
      quantity: 1,
    }));

  it("uses one link for a plan that fits", () => {
    expect(buildAmazonCartUrls(many(7))).toHaveLength(1);
  });

  it("splits a big plan into batches instead of dropping items", () => {
    const urls = buildAmazonCartUrls(many(14));
    expect(urls).toHaveLength(2);
    // Every product ends up in exactly one batch.
    const asins = urls.flatMap((u) => {
      const p = new URL(u).searchParams;
      return [...p.keys()]
        .filter((k) => k.startsWith("ASIN."))
        .map((k) => p.get(k)!);
    });
    expect(new Set(asins).size).toBe(14);
  });

  it("restarts the ASIN index in each batch", () => {
    const second = new URL(buildAmazonCartUrls(many(12))[1]);
    expect(second.searchParams.get("ASIN.1")).toBe("B010");
    expect(second.searchParams.get("ASIN.2")).toBe("B011");
    expect(second.searchParams.get("ASIN.3")).toBeNull();
  });

  it("tags every batch", () => {
    for (const url of buildAmazonCartUrls(many(25))) {
      expect(new URL(url).searchParams.get("AssociateTag")).toBe(
        siteConfig.amazonTag,
      );
    }
  });

  it("returns nothing when no line is on Amazon", () => {
    expect(
      buildAmazonCartUrls([
        { equipment: make({ sourceType: "brand", asin: undefined }), quantity: 1 },
      ]),
    ).toEqual([]);
  });

  it("reports batch sizes for button labels", () => {
    expect(amazonBatchSizes(many(14))).toEqual([10, 4]);
    expect(amazonBatchSizes(many(10))).toEqual([10]);
    expect(amazonBatchSizes([])).toEqual([]);
  });
});

describe("linesNeedingDirectLinks", () => {
  it("returns non-Amazon lines", () => {
    const brand = make({ id: "b", sourceType: "brand", asin: undefined });
    const rest = linesNeedingDirectLinks([
      { equipment: make({ id: "a", asin: "B0A" }), quantity: 1 },
      { equipment: brand, quantity: 1 },
    ]);
    expect(rest.map((l) => l.equipment.id)).toEqual(["b"]);
  });

  it("no longer strands Amazon lines past the cap — batching covers them", () => {
    const lines = Array.from({ length: 12 }, (_, i) => ({
      equipment: make({ id: `i${i}`, asin: `B0${i}` }),
      quantity: 1,
    }));
    expect(linesNeedingDirectLinks(lines)).toEqual([]);
  });

  it("is empty for an all-Amazon plan, which Phase 1 always is", () => {
    expect(
      linesNeedingDirectLinks([
        { equipment: make({ id: "a", asin: "B0A" }), quantity: 1 },
        { equipment: make({ id: "b", asin: "B0B" }), quantity: 2 },
      ]),
    ).toEqual([]);
  });
});

describe("sourceMetaLine", () => {
  it("collapses a brand-direct item to a single brand name", () => {
    expect(
      sourceMetaLine(make({ sourceType: "brand", brand: "REP Fitness" })),
    ).toBe("REP Fitness");
  });

  it("shows brand and marketplace for Amazon items", () => {
    expect(sourceMetaLine(make({ brand: "CAP Barbell" }))).toBe(
      "CAP Barbell · Amazon",
    );
  });

  it("shows brand and shipping note for drop-ship items", () => {
    expect(
      sourceMetaLine(make({ sourceType: "dropship", brand: "Tractor Supply" })),
    ).toBe("Tractor Supply · Ships direct");
  });
});

describe("buyLabel", () => {
  it("never renders 'Buy at Ships direct'", () => {
    expect(buyLabel(make({ sourceType: "dropship" }))).toBe("Buy direct");
  });

  it("names the brand for brand-direct items", () => {
    expect(buyLabel(make({ sourceType: "brand", brand: "Rogue Fitness" }))).toBe(
      "Buy at Rogue Fitness",
    );
  });

  it("avoids quoting a price for Amazon", () => {
    expect(buyLabel(make({}))).toBe("Check price on Amazon");
  });
});

describe("isAmazonItem", () => {
  it("requires both an amazon sourceType and an ASIN", () => {
    expect(isAmazonItem(make({}))).toBe(true);
    expect(isAmazonItem(make({ asin: undefined }))).toBe(false);
    expect(isAmazonItem(make({ sourceType: "brand" }))).toBe(false);
  });
});
