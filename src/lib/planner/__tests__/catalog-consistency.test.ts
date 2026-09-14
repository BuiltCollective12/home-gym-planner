import { describe, expect, it } from "vitest";
import { catalog } from "@/lib/catalog";
import type { Equipment } from "@/lib/types";

/**
 * Does each row agree with itself?
 *
 * Most of our product names state their own facts — "Olympic Bumper Plate Set
 * — 260 lb", "Extra-Thick Yoga Mat (72" × 24" × 1")", "T-2 Series Short Power
 * Rack (71")". That makes the name a second, independent source for the same
 * numbers, and any disagreement between the name and the fields is a bug in
 * one of them.
 *
 * This matters more than it looks. The planner's whole promise is that the
 * layout it draws is the gym that will arrive. A rack listed 13 inches shorter
 * than reality (which happened) breaks that promise silently, and the buyer
 * only finds out after paying for it.
 *
 * Runs offline. `npm run verify:products` does the network half — comparing
 * rows against the live Amazon listing.
 */

const byId = (id: string) => catalog.find((i) => i.id === id)!;

/** Every measurement a row claims, as an unordered set of inches. */
function footprint(item: Equipment): number[] {
  return [item.widthIn, item.depthIn, item.heightIn].sort((a, b) => a - b);
}

function close(a: number, b: number, tolerance = 0.1) {
  return Math.abs(a - b) <= Math.max(tolerance * Math.max(a, b), 0.6);
}

describe("names agree with the numbers", () => {
  /*
   * Weight stated in the name, e.g. "… — 260 lb".
   *
   * "Pair — 50 lb" means 50 lb per dumbbell, so the row should carry 100. That
   * is how the trade writes it and how buyers read it, so the name stays and
   * the test does the doubling.
   */
  it("matches a weight stated in the name", () => {
    const wrong: string[] = [];
    for (const item of catalog) {
      const stated = /—\s*([\d.]+)\s*lb/i.exec(item.name);
      if (!stated) continue;
      const claimed = Number(stated[1]);
      const isPair = /\bpair\b/i.test(item.name);
      const expected = isPair ? claimed * 2 : claimed;
      if (!close(item.weightLbs, expected, 0.02)) {
        wrong.push(
          `${item.id}: name says ${claimed} lb${isPair ? " per bell (=" + expected + ")" : ""}, row says ${item.weightLbs}`,
        );
      }
    }
    expect(wrong).toEqual([]);
  });

  /*
   * Dimensions stated in the name, e.g. `72" × 24" × 1"` or `4 ft × 6 ft`.
   *
   * Compared as an unordered set, because which axis we call width depends on
   * how the item is meant to sit in the room and the name rarely says.
   */
  it("matches dimensions stated in the name", () => {
    /*
     * Documented exceptions. Each of these is a real reason the name and the
     * footprint legitimately differ — not a number we could not be bothered to
     * fix. Anything not listed here must agree.
     */
    const exceptions: Record<string, string> = {
      "incstores-rubber-tile-24":
        'name is one 24" tile; the footprint is the pack you actually buy',
      "balancefrom-foam-tile-24":
        'name is one 24" tile; the footprint is the pack you actually buy',
      "battle-rope-40ft":
        "40 ft is rope length; the footprint is the coil it sits in",
      "gymreapers-wrist-wraps":
        '18" is the wrap length; the footprint is the folded pair',
      "titan-t3-power-rack":
        '24" is the internal depth between uprights; 36 is the external footprint with feet',
      "titan-x3-tall-rack":
        '36" is the internal depth between uprights; 40 is the external footprint with feet',
      "titan-safety-squat-bar":
        '5" is the camber offset, not a footprint dimension',
      "gym-chalk-blocks": "8 × 2 oz is the count and block weight, not a size",
      "titan-plyo-box-3in1":
        "20/24/30 are the three usable heights of one box",
      "led-strip-lights": "200 ft is strip length; it coils to nothing",
      "led-cob-strip": "16.4 ft is strip length; it coils to nothing",
    };

    const wrong: string[] = [];
    for (const item of catalog) {
      if (exceptions[item.id]) continue;

      // A thickness written as a fraction — (3/4"), (1/4") — is a real
      // measurement but not one of the three footprint axes, and parsing it
      // naively yields the denominator. Drop those before matching.
      const name = item.name.replace(/\b\d+\s*\/\s*\d+\s*(?:"|″)/g, "");

      // Mirrors ship as several panels and the name gives the size of one:
      // `Gym Mirror 50" × 30" (2 panels)` covers 100" of wall.
      const panels = Number(/\((\d+)\s*panels?\)/i.exec(item.name)?.[1] ?? 1);

      const inches: number[] = [];
      // 72" × 24" × 1"  /  50" x 30"
      for (const m of name.matchAll(/([\d.]+)\s*(?:"|″|in\b)/g)) {
        inches.push(Number(m[1]));
      }
      // 4 ft × 6 ft
      for (const m of name.matchAll(/([\d.]+)\s*ft\b/g)) {
        inches.push(Number(m[1]) * 12);
      }
      if (inches.length === 0) continue;

      const dims = footprint(item);
      const unmatched = inches.filter(
        (n) => !dims.some((d) => close(d, n, 0.12) || close(d, n * panels, 0.12)),
      );
      if (unmatched.length) {
        wrong.push(
          `${item.id}: name mentions ${unmatched.join('", ')}" — row is ${dims.join(" × ")}`,
        );
      }
    }
    expect(wrong).toEqual([]);
  });
});

describe("numbers are physically plausible", () => {
  it("gives every item a sane density", () => {
    /*
     * Catches both directions of typo: a 300 lb plate set with a shoebox
     * footprint, and a power rack recorded as weighing 3 lb. The band is very
     * wide on purpose — a stack of iron plates really is dense, and a foam
     * roller really is nearly weightless — so anything outside it is a
     * genuine oddity rather than a borderline call.
     */
    const odd: string[] = [];
    for (const item of catalog) {
      if (item.category === "flooring") continue; // sold by area, near-zero height
      const cuft = (item.widthIn * item.depthIn * item.heightIn) / 1728;
      if (cuft < 0.05) continue; // too small for the ratio to mean anything
      const density = item.weightLbs / cuft; // lb per cubic foot
      if (density > 400) {
        odd.push(`${item.id}: ${item.weightLbs} lb in ${cuft.toFixed(1)} cuft — denser than solid steel?`);
      }
      if (density < 0.4) {
        odd.push(`${item.id}: only ${item.weightLbs} lb across ${cuft.toFixed(1)} cuft — weight looks missing`);
      }
    }
    expect(odd).toEqual([]);
  });

  it("keeps weights inside a believable band per category", () => {
    // Guards against a decimal slip — 30 lb for a rack, 900 lb for a band set.
    const bands: Partial<Record<Equipment["category"], [number, number]>> = {
      // Bench-press stands are genuinely lighter than a full cage.
      racks: [35, 700],
      barbells: [10, 120],
      plates: [20, 700],
      dumbbells: [20, 700],
      benches: [20, 200],
      machines: [80, 1200],
      cardio: [40, 400],
      accessories: [0.2, 300],
      audio: [0.2, 40],
      lighting: [0.2, 40],
    };
    const odd: string[] = [];
    for (const item of catalog) {
      const band = bands[item.category];
      if (!band) continue;
      const [lo, hi] = band;
      if (item.weightLbs < lo || item.weightLbs > hi) {
        odd.push(`${item.id}: ${item.weightLbs} lb is outside ${lo}–${hi} for ${item.category}`);
      }
    }
    expect(odd).toEqual([]);
  });

  it("keeps a rack tall and a mat flat", () => {
    const odd: string[] = [];
    for (const item of catalog) {
      if (item.category === "racks" && item.heightIn < 60) {
        odd.push(`${item.id}: a rack only ${item.heightIn}" tall?`);
      }
      if (item.category === "flooring" && item.heightIn > 6) {
        odd.push(`${item.id}: flooring ${item.heightIn}" thick?`);
      }
      if (item.category === "barbells" && item.widthIn < 40) {
        odd.push(`${item.id}: a barbell only ${item.widthIn}" long?`);
      }
    }
    expect(odd).toEqual([]);
  });
});

describe("spot checks on rows that have been wrong before", () => {
  // Each of these was a real bug. Naming them stops a silent regression.
  it("keeps the T-2 a 71-inch rack", () => {
    const t2 = byId("titan-t2-squat-stand");
    expect(t2.heightIn).toBe(71);
    expect(t2.ceilingClearanceIn).toBeGreaterThanOrEqual(71);
  });

  it("keeps the BowFlex 552 marked as a single dumbbell", () => {
    expect(byId("bowflex-selecttech-552").name).toMatch(/single/i);
  });

  it("keeps turf long enough to be a track", () => {
    expect(byId("gym-turf-track").depthIn).toBe(396);
  });
});
