import { describe, expect, it } from "vitest";
import { bundles } from "@/lib/bundles";
import { getEquipment } from "@/lib/catalog";
import { toCartLines } from "@/lib/planner/totals";
import { amazonBatchSizes, buildAmazonCartUrls } from "@/lib/affiliate";

/**
 * Amazon's multi-item cart endpoint takes at most ten products per link, so a
 * large bundle checks out as several links rather than one. That is fine, but
 * it is a real step in the buying flow, and a bundle that quietly needed five
 * clicks would lose people. This keeps the count honest and visible.
 */

describe("bundle checkout", () => {
  it("keeps every bundle to a small number of cart links", () => {
    for (const bundle of bundles) {
      const lines = toCartLines(bundle.plan.items, getEquipment);
      const urls = buildAmazonCartUrls(lines);
      expect(urls.length, `${bundle.id} needs ${urls.length} cart links`)
        .toBeLessThanOrEqual(2);
    }
  });

  it("never emits a batch over Amazon's ten-product limit", () => {
    for (const bundle of bundles) {
      const lines = toCartLines(bundle.plan.items, getEquipment);
      for (const size of amazonBatchSizes(lines)) {
        expect(size, `${bundle.id} batch`).toBeLessThanOrEqual(10);
      }
    }
  });

  it("carries the associate tag on every cart link", () => {
    for (const bundle of bundles) {
      const lines = toCartLines(bundle.plan.items, getEquipment);
      for (const url of buildAmazonCartUrls(lines)) {
        expect(url, bundle.id).toContain("AssociateTag=");
      }
    }
  });
});
