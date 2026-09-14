import { describe, expect, it } from "vitest";
import { bundles, getBundle } from "@/lib/bundles";
import { getEquipment } from "@/lib/catalog";
import { computeTotals, toCartLines } from "@/lib/planner/totals";
import { validatePlan } from "@/lib/planner/warnings";
import { buildAmazonCartUrls } from "@/lib/affiliate";

/**
 * A bundle is our own curated layout, so it has to survive the planner's own
 * rules. Shipping one that overlaps itself or hangs through a wall would be
 * worse than shipping no bundles at all.
 */

describe("bundles", () => {
  it("has a unique id and a plan for each", () => {
    const ids = bundles.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(bundles.length).toBeGreaterThanOrEqual(4);
  });

  it("references only real catalog items", () => {
    for (const bundle of bundles) {
      for (const item of bundle.plan.items) {
        expect(
          getEquipment(item.equipmentId),
          `${bundle.id} references unknown ${item.equipmentId}`,
        ).toBeDefined();
      }
    }
  });

  it("lays out with no errors — nothing overlaps or escapes the room", () => {
    for (const bundle of bundles) {
      const errors = validatePlan(
        bundle.plan.items,
        bundle.plan.room,
        getEquipment,
      )
        .filter((w) => w.severity === "error")
        .map((w) => w.message);
      expect(errors, `${bundle.id}`).toEqual([]);
    }
  });

  it("leaves every working space clear", () => {
    // Clearance conflicts are advisory for a user's own plan, but a bundle we
    // curated should not ship with a bench parked in a rack's lifting zone.
    for (const bundle of bundles) {
      const warnings = validatePlan(
        bundle.plan.items,
        bundle.plan.room,
        getEquipment,
      )
        .filter((w) => w.kind === "clearance")
        .map((w) => w.message);
      expect(warnings, `${bundle.id}`).toEqual([]);
    }
  });

  it("fits under its own stated ceiling", () => {
    for (const bundle of bundles) {
      const ceiling = validatePlan(
        bundle.plan.items,
        bundle.plan.room,
        getEquipment,
      ).filter((w) => w.kind === "ceiling");
      expect(ceiling.map((w) => w.message), `${bundle.id}`).toEqual([]);
    }
  });

  it("rises in price from Starter to Luxury", () => {
    // Only the tier ladder is a ladder. Niche bundles are priced by what the
    // training style needs, so a mobility bundle costing less than a
    // powerlifting one is correct, not a regression.
    const tiers = bundles.filter((b) => b.kind === "tier");
    expect(tiers.length).toBeGreaterThanOrEqual(4);
    const totals = tiers.map((b) =>
      computeTotals(b.plan.items, b.plan.room, getEquipment).estCostUsd,
    );
    for (let i = 1; i < totals.length; i++) {
      expect(
        totals[i],
        `${tiers[i].id} is not dearer than ${tiers[i - 1].id}`,
      ).toBeGreaterThan(totals[i - 1]);
    }
  });

  it("offers both a budget ladder and a training style", () => {
    expect(bundles.some((b) => b.kind === "tier")).toBe(true);
    expect(bundles.filter((b) => b.kind === "niche").length).toBeGreaterThanOrEqual(4);
  });

  it("can be bought — every bundle produces an Amazon cart link", () => {
    for (const bundle of bundles) {
      const lines = toCartLines(bundle.plan.items, getEquipment);
      const urls = buildAmazonCartUrls(lines);
      expect(urls.length, `${bundle.id} has no cart link`).toBeGreaterThan(0);
    }
  });

  it("includes flooring in every bundle", () => {
    // Flooring is the highest-margin line and the thing people forget.
    for (const bundle of bundles) {
      const hasFloor = bundle.plan.items.some(
        (i) => getEquipment(i.equipmentId)?.category === "flooring",
      );
      expect(hasFloor, `${bundle.id} has no flooring`).toBe(true);
    }
  });

  it("never ships a barbell without a rack to use it in", () => {
    // The real rule is safety, not completeness: squatting or benching a
    // loaded bar with nowhere to fail is how people get hurt. A cardio or
    // mobility bundle has no barbell and correctly has no rack.
    for (const bundle of bundles) {
      const categories = bundle.plan.items.map(
        (i) => getEquipment(i.equipmentId)?.category,
      );
      if (!categories.includes("barbells")) continue;
      expect(
        categories.includes("racks"),
        `${bundle.id} has a barbell but no rack`,
      ).toBe(true);
    }
  });

  it("gives every bundle enough to actually train with", () => {
    for (const bundle of bundles) {
      const real = bundle.plan.items.filter(
        (i) => getEquipment(i.equipmentId)?.category !== "flooring",
      );
      // Four is the real floor: Starter is deliberately rack, bench, bar and
      // plates and nothing else. This guards against an empty bundle, not
      // against a minimal one.
      expect(real.length, `${bundle.id} is too thin`).toBeGreaterThanOrEqual(4);
      expect(bundle.highlights.length, `${bundle.id}`).toBeGreaterThanOrEqual(3);
    }
  });

  it("looks up by id", () => {
    expect(getBundle("garage")?.name).toBe("Garage");
    expect(getBundle("nope")).toBeUndefined();
  });
});
