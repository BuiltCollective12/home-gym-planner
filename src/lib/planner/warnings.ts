import type { Equipment, PlacedItem, Room } from "@/lib/types";
import {
  clearanceRect,
  footprintRect,
  hasClearance,
  rectContains,
  rectsOverlap,
} from "./geometry";

/**
 * Plan validation — pure functions over (items, room, catalog lookup).
 *
 * Severity: "error" blocks a sane build (things physically overlap or do not
 * fit); "warning" is advisory (tight walkways, low ceiling clearance).
 */

export type WarningKind =
  | "collision"
  | "out-of-bounds"
  | "clearance"
  | "ceiling";

export type PlanWarning = {
  kind: WarningKind;
  severity: "error" | "warning";
  /** Instance uids the warning applies to. */
  uids: string[];
  message: string;
};

type Lookup = (equipmentId: string) => Equipment | undefined;

type Resolved = { placed: PlacedItem; equipment: Equipment };

function resolve(items: PlacedItem[], lookup: Lookup): Resolved[] {
  const out: Resolved[] = [];
  for (const placed of items) {
    const equipment = lookup(placed.equipmentId);
    if (equipment) out.push({ placed, equipment });
  }
  return out;
}

/** Footprints that physically overlap another item's footprint. */
export function findCollisions(
  items: PlacedItem[],
  lookup: Lookup,
): PlanWarning[] {
  const resolved = resolve(items, lookup);
  const warnings: PlanWarning[] = [];
  for (let i = 0; i < resolved.length; i++) {
    for (let j = i + 1; j < resolved.length; j++) {
      const a = resolved[i];
      const b = resolved[j];
      // Flooring is laid under everything else, so it never collides.
      if (a.equipment.category === "flooring" || b.equipment.category === "flooring") {
        continue;
      }
      const ra = footprintRect(a.placed, a.equipment);
      const rb = footprintRect(b.placed, b.equipment);
      if (rectsOverlap(ra, rb)) {
        warnings.push({
          kind: "collision",
          severity: "error",
          uids: [a.placed.uid, b.placed.uid],
          message: `${a.equipment.name} overlaps ${b.equipment.name}`,
        });
      }
    }
  }
  return warnings;
}

/** Items sticking out past a wall. */
export function findOutOfBounds(
  items: PlacedItem[],
  room: Pick<Room, "widthIn" | "depthIn">,
  lookup: Lookup,
): PlanWarning[] {
  const roomRect = { x: 0, y: 0, w: room.widthIn, h: room.depthIn };
  return resolve(items, lookup)
    .filter(({ placed, equipment }) =>
      !rectContains(roomRect, footprintRect(placed, equipment)),
    )
    .map(({ placed, equipment }) => ({
      kind: "out-of-bounds" as const,
      severity: "error" as const,
      uids: [placed.uid],
      message: `${equipment.name} extends outside the room`,
    }));
}

/**
 * Walkway conflicts: another item's footprint sits inside this item's
 * clearance zone, so you could not actually use it. Advisory, not an error.
 */
export function findClearanceConflicts(
  items: PlacedItem[],
  lookup: Lookup,
): PlanWarning[] {
  const resolved = resolve(items, lookup);
  const warnings: PlanWarning[] = [];
  for (const a of resolved) {
    if (!hasClearance(a.equipment)) continue;
    const zone = clearanceRect(a.placed, a.equipment);
    for (const b of resolved) {
      if (b.placed.uid === a.placed.uid) continue;
      if (b.equipment.category === "flooring") continue;
      const rb = footprintRect(b.placed, b.equipment);
      // A straight overlap is already reported as a collision.
      if (rectsOverlap(footprintRect(a.placed, a.equipment), rb)) continue;
      if (rectsOverlap(zone, rb)) {
        warnings.push({
          kind: "clearance",
          severity: "warning",
          uids: [a.placed.uid, b.placed.uid],
          message: `${b.equipment.name} sits in the working space around ${a.equipment.name}`,
        });
      }
    }
  }
  return warnings;
}

/** Items taller than the ceiling, or needing more headroom than the room has. */
export function findCeilingConflicts(
  items: PlacedItem[],
  room: Pick<Room, "ceilingHeightIn">,
  lookup: Lookup,
): PlanWarning[] {
  const warnings: PlanWarning[] = [];
  for (const { placed, equipment } of resolve(items, lookup)) {
    if (equipment.heightIn > room.ceilingHeightIn) {
      warnings.push({
        kind: "ceiling",
        severity: "error",
        uids: [placed.uid],
        message: `${equipment.name} is ${equipment.heightIn}" tall — taller than your ${room.ceilingHeightIn}" ceiling`,
      });
      continue;
    }
    const needed = equipment.ceilingClearanceIn;
    if (needed && needed > room.ceilingHeightIn) {
      warnings.push({
        kind: "ceiling",
        severity: "warning",
        uids: [placed.uid],
        message: `${equipment.name} needs ${needed}" of headroom to use (pull-ups, cable travel) — you have ${room.ceilingHeightIn}"`,
      });
    }
  }
  return warnings;
}

export function validatePlan(
  items: PlacedItem[],
  room: Room,
  lookup: Lookup,
): PlanWarning[] {
  return [
    ...findCollisions(items, lookup),
    ...findOutOfBounds(items, room, lookup),
    ...findCeilingConflicts(items, room, lookup),
    ...findClearanceConflicts(items, lookup),
  ];
}

/** uid -> worst severity affecting it, for colouring the canvas. */
export function warningsByUid(
  warnings: PlanWarning[],
): Map<string, "error" | "warning"> {
  const map = new Map<string, "error" | "warning">();
  for (const w of warnings) {
    for (const uid of w.uids) {
      if (w.severity === "error" || !map.has(uid)) map.set(uid, w.severity);
    }
  }
  return map;
}
