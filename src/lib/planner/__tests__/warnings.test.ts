import { describe, expect, it } from "vitest";
import type { Equipment, PlacedItem, Room } from "@/lib/types";
import {
  findCeilingConflicts,
  findClearanceConflicts,
  findCollisions,
  findOutOfBounds,
  validatePlan,
  warningsByUid,
} from "../warnings";

const base: Omit<Equipment, "id" | "name" | "category"> = {
  brand: "Test",
  widthIn: 48,
  depthIn: 30,
  heightIn: 40,
  weightLbs: 100,
  estPriceUsd: 100,
  sourceType: "amazon",
  sourceUrl: "https://example.com",
  tags: [],
};

const equipment: Record<string, Equipment> = {
  rack: {
    ...base,
    id: "rack",
    name: "Rack",
    category: "racks",
    heightIn: 93,
    ceilingClearanceIn: 100,
    clearanceIn: { front: 36 },
  },
  bench: { ...base, id: "bench", name: "Bench", category: "benches", widthIn: 24, depthIn: 48, heightIn: 18 },
  mat: { ...base, id: "mat", name: "Mat", category: "flooring", widthIn: 48, depthIn: 72, heightIn: 1 },
  tallCabinet: { ...base, id: "tallCabinet", name: "Tall Cabinet", category: "storage", heightIn: 120 },
};

const lookup = (id: string) => equipment[id];

const room: Room = {
  widthIn: 144,
  depthIn: 240,
  ceilingHeightIn: 96,
  doors: [],
  windows: [],
};

const place = (
  uid: string,
  equipmentId: string,
  xIn: number,
  yIn: number,
  rotation: PlacedItem["rotation"] = 0,
): PlacedItem => ({ uid, equipmentId, xIn, yIn, rotation });

describe("findCollisions", () => {
  it("reports overlapping footprints once per pair", () => {
    const warnings = findCollisions(
      [place("a", "rack", 0, 0), place("b", "bench", 10, 10)],
      lookup,
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0].uids.sort()).toEqual(["a", "b"]);
    expect(warnings[0].severity).toBe("error");
  });

  it("allows items placed edge to edge", () => {
    expect(
      findCollisions(
        [place("a", "rack", 0, 0), place("b", "bench", 48, 0)],
        lookup,
      ),
    ).toHaveLength(0);
  });

  it("accounts for rotation", () => {
    // Rotated 90°, the rack occupies 30x48 instead of 48x30.
    expect(
      findCollisions(
        [place("a", "rack", 0, 0, 90), place("b", "bench", 36, 0)],
        lookup,
      ),
    ).toHaveLength(0);
    expect(
      findCollisions(
        [place("a", "rack", 0, 0), place("b", "bench", 36, 0)],
        lookup,
      ),
    ).toHaveLength(1);
  });

  it("lets equipment sit on top of flooring", () => {
    expect(
      findCollisions(
        [place("a", "mat", 0, 0), place("b", "rack", 0, 0)],
        lookup,
      ),
    ).toHaveLength(0);
  });

  it("ignores unknown equipment ids", () => {
    expect(
      findCollisions([place("a", "ghost", 0, 0), place("b", "rack", 0, 0)], lookup),
    ).toHaveLength(0);
  });
});

describe("findOutOfBounds", () => {
  it("flags an item hanging past a wall", () => {
    const warnings = findOutOfBounds([place("a", "rack", 120, 0)], room, lookup);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].uids).toEqual(["a"]);
  });

  it("allows an item flush against the far wall", () => {
    expect(
      findOutOfBounds([place("a", "rack", 96, 210)], room, lookup),
    ).toHaveLength(0);
  });

  it("uses the rotated footprint", () => {
    // 30" wide when rotated, so x=120 fits in a 144" room; 48" wide does not.
    expect(
      findOutOfBounds([place("a", "rack", 114, 0, 90)], room, lookup),
    ).toHaveLength(0);
    expect(
      findOutOfBounds([place("a", "rack", 114, 0)], room, lookup),
    ).toHaveLength(1);
  });
});

describe("findCeilingConflicts", () => {
  it("errors when the item is physically taller than the ceiling", () => {
    const warnings = findCeilingConflicts(
      [place("a", "tallCabinet", 0, 0)],
      room,
      lookup,
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0].severity).toBe("error");
  });

  it("warns when headroom to use it is short but the item fits", () => {
    // Rack is 93" in a 96" room but wants 100" for pull-ups.
    const warnings = findCeilingConflicts([place("a", "rack", 0, 0)], room, lookup);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].severity).toBe("warning");
    expect(warnings[0].message).toContain("headroom");
  });

  it("is silent with enough ceiling", () => {
    expect(
      findCeilingConflicts([place("a", "rack", 0, 0)], { ceilingHeightIn: 120 }, lookup),
    ).toHaveLength(0);
  });
});

describe("findClearanceConflicts", () => {
  it("warns when an item blocks another's working space", () => {
    // Rack occupies y 0-30 with 36" of front clearance to y=66.
    const warnings = findClearanceConflicts(
      [place("a", "rack", 0, 0), place("b", "bench", 0, 40)],
      lookup,
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0].severity).toBe("warning");
    expect(warnings[0].uids).toEqual(["a", "b"]);
  });

  it("stays quiet once the item is clear of the zone", () => {
    expect(
      findClearanceConflicts(
        [place("a", "rack", 0, 0), place("b", "bench", 0, 66)],
        lookup,
      ),
    ).toHaveLength(0);
  });

  it("does not double-report a straight collision as a clearance issue", () => {
    expect(
      findClearanceConflicts(
        [place("a", "rack", 0, 0), place("b", "bench", 0, 0)],
        lookup,
      ),
    ).toHaveLength(0);
  });

  it("ignores flooring inside a clearance zone", () => {
    expect(
      findClearanceConflicts(
        [place("a", "rack", 0, 0), place("b", "mat", 0, 40)],
        lookup,
      ),
    ).toHaveLength(0);
  });
});

describe("validatePlan / warningsByUid", () => {
  it("collects every category of warning", () => {
    const warnings = validatePlan(
      [place("a", "rack", 0, 0), place("b", "bench", 10, 10), place("c", "tallCabinet", 200, 0)],
      room,
      lookup,
    );
    const kinds = new Set(warnings.map((w) => w.kind));
    expect(kinds.has("collision")).toBe(true);
    expect(kinds.has("out-of-bounds")).toBe(true);
    expect(kinds.has("ceiling")).toBe(true);
  });

  it("returns nothing for a clean plan", () => {
    expect(
      validatePlan(
        [place("a", "rack", 0, 0), place("b", "bench", 0, 70)],
        { ...room, ceilingHeightIn: 120 },
        lookup,
      ),
    ).toHaveLength(0);
  });

  it("lets errors win over warnings per uid", () => {
    const map = warningsByUid([
      { kind: "clearance", severity: "warning", uids: ["a"], message: "" },
      { kind: "collision", severity: "error", uids: ["a"], message: "" },
    ]);
    expect(map.get("a")).toBe("error");
  });
});
