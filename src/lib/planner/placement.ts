import type { Equipment, PlacedItem, Room, Rotation } from "@/lib/types";
import { footprintRect, rectsOverlap, rotatedFootprint } from "./geometry";

type Lookup = (equipmentId: string) => Equipment | undefined;

/**
 * Pick a landing spot for a newly added item: the first grid position, scanning
 * top-left to bottom-right, where its footprint fits without overlapping
 * anything. Falls back to the top-left corner so adding an item never silently
 * does nothing — the overlap then shows up as a collision warning.
 */
export function findFreeSpot(
  equipment: Equipment,
  rotation: Rotation,
  existing: PlacedItem[],
  room: Pick<Room, "widthIn" | "depthIn">,
  lookup: Lookup,
  gridIn: number,
): { xIn: number; yIn: number } {
  const { widthIn, depthIn } = rotatedFootprint(equipment, rotation);
  const step = Math.max(gridIn, 1);

  const occupied = existing
    .map((placed) => {
      const eq = lookup(placed.equipmentId);
      // Flooring is laid under everything, so it never blocks a spot.
      return eq && eq.category !== "flooring"
        ? footprintRect(placed, eq)
        : null;
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const maxX = room.widthIn - widthIn;
  const maxY = room.depthIn - depthIn;

  for (let y = 0; y <= maxY; y += step) {
    for (let x = 0; x <= maxX; x += step) {
      const candidate = { x, y, w: widthIn, h: depthIn };
      if (!occupied.some((r) => rectsOverlap(candidate, r))) {
        return { xIn: x, yIn: y };
      }
    }
  }

  return { xIn: 0, yIn: 0 };
}

let counter = 0;

/** Instance ids only need to be unique within one plan. */
export function newUid(): string {
  counter += 1;
  return `i${Date.now().toString(36)}${counter.toString(36)}`;
}
