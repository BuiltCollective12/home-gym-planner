import { describe, expect, it } from "vitest";
import type { Equipment, PlacedItem } from "@/lib/types";
import { findFreeSpot, newUid } from "../placement";

const equipment: Record<string, Equipment> = {
  rack: {
    id: "rack",
    name: "Rack",
    brand: "T",
    category: "racks",
    widthIn: 48,
    depthIn: 36,
    heightIn: 90,
    weightLbs: 200,
    sourceType: "amazon",
    sourceUrl: "https://example.com",
    tags: [],
  },
  mat: {
    id: "mat",
    name: "Mat",
    brand: "T",
    category: "flooring",
    widthIn: 48,
    depthIn: 72,
    heightIn: 1,
    weightLbs: 95,
    sourceType: "dropship",
    sourceUrl: "https://example.com",
    tags: [],
  },
};

const lookup = (id: string) => equipment[id];
const room = { widthIn: 144, depthIn: 240 };

const place = (uid: string, equipmentId: string, xIn = 0, yIn = 0): PlacedItem => ({
  uid,
  equipmentId,
  xIn,
  yIn,
  rotation: 0,
});

describe("findFreeSpot", () => {
  it("uses the top-left corner of an empty room", () => {
    expect(findFreeSpot(equipment.rack, 0, [], room, lookup, 6)).toEqual({
      xIn: 0,
      yIn: 0,
    });
  });

  it("slides along the grid past an existing item", () => {
    const spot = findFreeSpot(
      equipment.rack,
      0,
      [place("a", "rack", 0, 0)],
      room,
      lookup,
      6,
    );
    expect(spot).toEqual({ xIn: 48, yIn: 0 });
  });

  it("wraps to the next row when the first is full", () => {
    const spot = findFreeSpot(
      equipment.rack,
      0,
      [place("a", "rack", 0, 0), place("b", "rack", 48, 0), place("c", "rack", 96, 0)],
      room,
      lookup,
      6,
    );
    expect(spot.yIn).toBe(36);
    expect(spot.xIn).toBe(0);
  });

  it("respects the rotated footprint", () => {
    // Rotated the rack is 36 wide, so it fits beside an unrotated one sooner.
    const spot = findFreeSpot(
      equipment.rack,
      90,
      [place("a", "rack", 0, 0)],
      room,
      lookup,
      6,
    );
    expect(spot).toEqual({ xIn: 48, yIn: 0 });
  });

  it("ignores flooring when looking for space", () => {
    expect(
      findFreeSpot(equipment.rack, 0, [place("a", "mat", 0, 0)], room, lookup, 6),
    ).toEqual({ xIn: 0, yIn: 0 });
  });

  it("falls back to the corner when the room is full", () => {
    const packed: PlacedItem[] = [];
    for (let y = 0; y < 240; y += 36) {
      for (let x = 0; x < 144; x += 48) {
        packed.push(place(`p${x}-${y}`, "rack", x, y));
      }
    }
    expect(findFreeSpot(equipment.rack, 0, packed, room, lookup, 6)).toEqual({
      xIn: 0,
      yIn: 0,
    });
  });

  it("falls back to the corner when the item is bigger than the room", () => {
    expect(
      findFreeSpot(equipment.rack, 0, [], { widthIn: 24, depthIn: 24 }, lookup, 6),
    ).toEqual({ xIn: 0, yIn: 0 });
  });
});

describe("newUid", () => {
  it("returns distinct ids", () => {
    const ids = new Set(Array.from({ length: 100 }, newUid));
    expect(ids.size).toBe(100);
  });
});
