import { describe, expect, it } from "vitest";
import type { Equipment, PlacedItem } from "@/lib/types";
import {
  clearanceRect,
  clamp,
  footprintRect,
  normalizeRotation,
  overlapArea,
  rectContains,
  rectsOverlap,
  rotateBy,
  rotatedClearance,
  rotatedFootprint,
  snapPosition,
  snapToGrid,
} from "../geometry";

const rack: Equipment = {
  id: "rack",
  name: "Test Rack",
  brand: "Test",
  category: "racks",
  widthIn: 48,
  depthIn: 30,
  heightIn: 93,
  clearanceIn: { front: 36, back: 6, left: 12, right: 4 },
  ceilingClearanceIn: 100,
  weightLbs: 200,
  estPriceUsd: 700,
  sourceType: "amazon",
  sourceUrl: "https://example.com",
  tags: [],
};

const place = (over: Partial<PlacedItem> = {}): PlacedItem => ({
  uid: "a",
  equipmentId: "rack",
  xIn: 0,
  yIn: 0,
  rotation: 0,
  ...over,
});

describe("normalizeRotation", () => {
  it("snaps to the nearest 90°", () => {
    expect(normalizeRotation(0)).toBe(0);
    expect(normalizeRotation(44)).toBe(0);
    expect(normalizeRotation(46)).toBe(90);
    expect(normalizeRotation(180)).toBe(180);
  });

  it("wraps past a full turn and handles negatives", () => {
    expect(normalizeRotation(360)).toBe(0);
    expect(normalizeRotation(450)).toBe(90);
    expect(normalizeRotation(-90)).toBe(270);
    expect(normalizeRotation(-450)).toBe(270);
  });

  it("rotateBy steps around the circle", () => {
    expect(rotateBy(270, 90)).toBe(0);
    expect(rotateBy(0, -90)).toBe(270);
  });
});

describe("rotatedFootprint", () => {
  it("keeps dimensions at 0° and 180°", () => {
    expect(rotatedFootprint(rack, 0)).toEqual({ widthIn: 48, depthIn: 30 });
    expect(rotatedFootprint(rack, 180)).toEqual({ widthIn: 48, depthIn: 30 });
  });

  it("swaps dimensions at 90° and 270°", () => {
    expect(rotatedFootprint(rack, 90)).toEqual({ widthIn: 30, depthIn: 48 });
    expect(rotatedFootprint(rack, 270)).toEqual({ widthIn: 30, depthIn: 48 });
  });
});

describe("rotatedClearance", () => {
  it("passes through at 0°", () => {
    expect(rotatedClearance(rack.clearanceIn, 0)).toEqual({
      front: 36,
      back: 6,
      left: 12,
      right: 4,
    });
  });

  it("rotates sides clockwise at 90°", () => {
    // Turning the item 90° clockwise points its front toward -x (room "left").
    expect(rotatedClearance(rack.clearanceIn, 90)).toEqual({
      front: 4,
      back: 12,
      left: 36,
      right: 6,
    });
  });

  it("mirrors at 180°", () => {
    expect(rotatedClearance(rack.clearanceIn, 180)).toEqual({
      front: 6,
      back: 36,
      left: 4,
      right: 12,
    });
  });

  it("returns zeros when the item declares no clearance", () => {
    expect(rotatedClearance(undefined, 90)).toEqual({
      front: 0,
      back: 0,
      left: 0,
      right: 0,
    });
  });

  it("conserves the set of clearance values through every rotation", () => {
    const sorted = (c: Record<string, number>) => Object.values(c).sort();
    const original = sorted(rotatedClearance(rack.clearanceIn, 0));
    for (const rot of [90, 180, 270] as const) {
      expect(sorted(rotatedClearance(rack.clearanceIn, rot))).toEqual(original);
    }
  });
});

describe("footprintRect / clearanceRect", () => {
  it("anchors the footprint at the top-left corner", () => {
    expect(footprintRect(place({ xIn: 10, yIn: 20 }), rack)).toEqual({
      x: 10,
      y: 20,
      w: 48,
      h: 30,
    });
  });

  it("expands the clearance zone on each rotated side", () => {
    expect(clearanceRect(place({ xIn: 100, yIn: 100 }), rack)).toEqual({
      x: 88, // left 12
      y: 94, // back 6
      w: 48 + 12 + 4,
      h: 30 + 6 + 36,
    });
  });

  it("clearance zone follows rotation", () => {
    const r = clearanceRect(place({ xIn: 100, yIn: 100, rotation: 90 }), rack);
    // At 90° the footprint is 30x48 and the 36" working space is on the left.
    expect(r).toEqual({ x: 100 - 36, y: 100 - 12, w: 30 + 36 + 6, h: 48 + 12 + 4 });
  });
});

describe("rect helpers", () => {
  const a = { x: 0, y: 0, w: 10, h: 10 };

  it("detects overlap", () => {
    expect(rectsOverlap(a, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
  });

  it("treats touching edges as not overlapping", () => {
    expect(rectsOverlap(a, { x: 10, y: 0, w: 10, h: 10 })).toBe(false);
    expect(rectsOverlap(a, { x: 0, y: 10, w: 10, h: 10 })).toBe(false);
  });

  it("computes intersection area", () => {
    expect(overlapArea(a, { x: 5, y: 5, w: 10, h: 10 })).toBe(25);
    expect(overlapArea(a, { x: 20, y: 20, w: 5, h: 5 })).toBe(0);
  });

  it("checks containment inclusively", () => {
    expect(rectContains(a, { x: 0, y: 0, w: 10, h: 10 })).toBe(true);
    expect(rectContains(a, { x: 1, y: 1, w: 9, h: 9 })).toBe(true);
    expect(rectContains(a, { x: 1, y: 1, w: 10, h: 9 })).toBe(false);
    expect(rectContains(a, { x: -1, y: 0, w: 5, h: 5 })).toBe(false);
  });
});

describe("snapping", () => {
  it("snaps to the nearest grid multiple", () => {
    expect(snapToGrid(13, 6)).toBe(12);
    expect(snapToGrid(15, 6)).toBe(18);
    expect(snapToGrid(-4, 6)).toBe(-6);
  });

  it("passes values through when the grid is off", () => {
    expect(snapToGrid(13.7, 0)).toBe(13.7);
  });

  it("clamps", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(50, 0, 10)).toBe(10);
  });

  it("keeps the footprint inside the room", () => {
    const room = { widthIn: 120, depthIn: 240 };
    const size = { widthIn: 48, depthIn: 30 };
    expect(snapPosition({ xIn: 200, yIn: 500 }, size, room, 6)).toEqual({
      xIn: 72,
      yIn: 210,
    });
    expect(snapPosition({ xIn: -30, yIn: -10 }, size, room, 6)).toEqual({
      xIn: 0,
      yIn: 0,
    });
  });

  it("clamps to 0 when the item is larger than the room", () => {
    const room = { widthIn: 40, depthIn: 20 };
    const size = { widthIn: 48, depthIn: 30 };
    expect(snapPosition({ xIn: 10, yIn: 10 }, size, room, 6)).toEqual({
      xIn: 0,
      yIn: 0,
    });
  });
});
