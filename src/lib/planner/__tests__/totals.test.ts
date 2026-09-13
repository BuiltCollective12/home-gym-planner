import { describe, expect, it } from "vitest";
import type { Equipment, PlacedItem } from "@/lib/types";
import { computeTotals, flooringNeededSqft, toCartLines } from "../totals";

const equipment: Record<string, Equipment> = {
  rack: {
    id: "rack",
    name: "Rack",
    brand: "T",
    category: "racks",
    widthIn: 48,
    depthIn: 36,
    heightIn: 93,
    weightLbs: 300,
    estPriceUsd: 900,
    sourceType: "amazon",
    sourceUrl: "https://example.com",
    tags: [],
  },
  bench: {
    id: "bench",
    name: "Bench",
    brand: "T",
    category: "benches",
    widthIn: 24,
    depthIn: 48,
    heightIn: 18,
    weightLbs: 80,
    estPriceUsd: 300,
    sourceType: "amazon",
    sourceUrl: "https://example.com",
    tags: [],
  },
  mat: {
    id: "mat",
    name: "Stall Mat",
    brand: "T",
    category: "flooring",
    widthIn: 48,
    depthIn: 72,
    heightIn: 1,
    weightLbs: 95,
    // deliberately unpriced
    sourceType: "dropship",
    sourceUrl: "https://example.com",
    tags: [],
  },
};

const lookup = (id: string) => equipment[id];
const room = { widthIn: 144, depthIn: 240 }; // 12 x 20 ft = 240 sq ft

const place = (
  uid: string,
  equipmentId: string,
  rotation: PlacedItem["rotation"] = 0,
): PlacedItem => ({ uid, equipmentId, xIn: 0, yIn: 0, rotation });

describe("computeTotals", () => {
  it("sums count, price and weight", () => {
    const t = computeTotals(
      [place("a", "rack"), place("b", "bench"), place("c", "bench")],
      room,
      lookup,
    );
    expect(t.itemCount).toBe(3);
    expect(t.uniqueItemCount).toBe(2);
    expect(t.estCostUsd).toBe(1500);
    expect(t.totalWeightLbs).toBe(460);
    expect(t.hasUnpricedItems).toBe(false);
  });

  it("flags unpriced items instead of counting them as free", () => {
    const t = computeTotals([place("a", "rack"), place("b", "mat")], room, lookup);
    expect(t.estCostUsd).toBe(900);
    expect(t.hasUnpricedItems).toBe(true);
  });

  it("excludes flooring from floor usage", () => {
    const t = computeTotals([place("a", "mat")], room, lookup);
    expect(t.usedAreaSqft).toBe(0);
    expect(t.floorUsage).toBe(0);
  });

  it("computes usage against room area", () => {
    // Rack 48x36 = 1728 sq in = 12 sq ft of a 240 sq ft room.
    const t = computeTotals([place("a", "rack")], room, lookup);
    expect(t.roomAreaSqft).toBe(240);
    expect(t.usedAreaSqft).toBe(12);
    expect(t.floorUsage).toBeCloseTo(0.05, 5);
  });

  it("uses the rotated footprint for area (same area, either way)", () => {
    const straight = computeTotals([place("a", "rack")], room, lookup);
    const turned = computeTotals([place("a", "rack", 90)], room, lookup);
    expect(turned.usedAreaSqft).toBe(straight.usedAreaSqft);
  });

  it("is safe on an empty plan and a zero-area room", () => {
    const t = computeTotals([], { widthIn: 0, depthIn: 0 }, lookup);
    expect(t.itemCount).toBe(0);
    expect(t.estCostUsd).toBe(0);
    expect(t.floorUsage).toBe(0);
  });

  it("skips unknown equipment ids", () => {
    const t = computeTotals([place("a", "ghost")], room, lookup);
    expect(t.estCostUsd).toBe(0);
    expect(t.uniqueItemCount).toBe(0);
  });
});

describe("flooringNeededSqft", () => {
  it("returns the whole room when no flooring is placed", () => {
    expect(flooringNeededSqft([place("a", "rack")], room, lookup)).toBe(240);
  });

  it("subtracts each mat's area", () => {
    // Each 4x6 mat is 24 sq ft.
    expect(
      flooringNeededSqft([place("a", "mat"), place("b", "mat")], room, lookup),
    ).toBe(240 - 48);
  });

  it("never goes negative when the floor is over-covered", () => {
    const mats = Array.from({ length: 20 }, (_, i) => place(`m${i}`, "mat"));
    expect(flooringNeededSqft(mats, room, lookup)).toBe(0);
  });
});

describe("toCartLines", () => {
  it("collapses duplicates into quantities, sorted by name", () => {
    const lines = toCartLines(
      [place("a", "rack"), place("b", "bench"), place("c", "bench")],
      lookup,
    );
    expect(lines.map((l) => [l.equipment.id, l.quantity])).toEqual([
      ["bench", 2],
      ["rack", 1],
    ]);
  });

  it("drops unknown ids", () => {
    expect(toCartLines([place("a", "ghost")], lookup)).toEqual([]);
  });
});
