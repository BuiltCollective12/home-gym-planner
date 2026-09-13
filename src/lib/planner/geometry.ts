import type {
  ClearanceIn,
  Equipment,
  PlacedItem,
  Rect,
  Rotation,
} from "@/lib/types";

/**
 * Pure geometry helpers for the planner.
 *
 * Coordinate system: inches, origin at the room's top-left (north-west) corner,
 * +x east, +y south. An item's (xIn, yIn) is the top-left corner of its
 * axis-aligned footprint *after* rotation.
 *
 * "Front" is the side an item is used from. At 0° rotation the item's back is
 * against the north wall, so its front faces south (+y).
 */

export const ROTATIONS: Rotation[] = [0, 90, 180, 270];

export function normalizeRotation(deg: number): Rotation {
  const r = ((Math.round(deg / 90) * 90) % 360 + 360) % 360;
  return r as Rotation;
}

export function rotateBy(rotation: Rotation, delta: number): Rotation {
  return normalizeRotation(rotation + delta);
}

/** Footprint after rotation: 90° and 270° swap width and depth. */
export function rotatedFootprint(
  item: Pick<Equipment, "widthIn" | "depthIn">,
  rotation: Rotation,
): { widthIn: number; depthIn: number } {
  return rotation === 90 || rotation === 270
    ? { widthIn: item.depthIn, depthIn: item.widthIn }
    : { widthIn: item.widthIn, depthIn: item.depthIn };
}

/**
 * Clearance sides rotated into room space.
 * Room-space `front` means "toward +y", `right` means "toward +x".
 */
export function rotatedClearance(
  clearance: ClearanceIn | undefined,
  rotation: Rotation,
): Required<ClearanceIn> {
  const c = {
    front: clearance?.front ?? 0,
    back: clearance?.back ?? 0,
    left: clearance?.left ?? 0,
    right: clearance?.right ?? 0,
  };
  switch (rotation) {
    case 0:
      return c;
    case 90:
      // Item turned clockwise: its front now points west (-x).
      return { front: c.right, back: c.left, left: c.front, right: c.back };
    case 180:
      return { front: c.back, back: c.front, left: c.right, right: c.left };
    case 270:
      return { front: c.left, back: c.right, left: c.back, right: c.front };
  }
}

/** The item's own footprint rectangle, in inches. */
export function footprintRect(placed: PlacedItem, equipment: Equipment): Rect {
  const { widthIn, depthIn } = rotatedFootprint(equipment, placed.rotation);
  return { x: placed.xIn, y: placed.yIn, w: widthIn, h: depthIn };
}

/** Footprint expanded by the item's walkway/clearance zone. */
export function clearanceRect(placed: PlacedItem, equipment: Equipment): Rect {
  const base = footprintRect(placed, equipment);
  const c = rotatedClearance(equipment.clearanceIn, placed.rotation);
  return {
    x: base.x - c.left,
    y: base.y - c.back,
    w: base.w + c.left + c.right,
    h: base.h + c.back + c.front,
  };
}

export function hasClearance(equipment: Equipment): boolean {
  const c = equipment.clearanceIn;
  return Boolean(c && (c.front || c.back || c.left || c.right));
}

/** Strict overlap: rectangles that merely touch edges do not overlap. */
export function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
  );
}

/** Area of the intersection, in square inches (0 when they do not overlap). */
export function overlapArea(a: Rect, b: Rect): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

export function rectContains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.w <= outer.x + outer.w &&
    inner.y + inner.h <= outer.y + outer.h
  );
}

export function snapToGrid(value: number, gridIn: number): number {
  if (gridIn <= 0) return value;
  return Math.round(value / gridIn) * gridIn;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Snap a proposed top-left position to the grid and keep the whole footprint
 * inside the room. Rooms smaller than the item clamp to 0 rather than going
 * negative.
 */
export function snapPosition(
  pos: { xIn: number; yIn: number },
  size: { widthIn: number; depthIn: number },
  room: { widthIn: number; depthIn: number },
  gridIn: number,
): { xIn: number; yIn: number } {
  const maxX = Math.max(0, room.widthIn - size.widthIn);
  const maxY = Math.max(0, room.depthIn - size.depthIn);
  return {
    xIn: clamp(snapToGrid(pos.xIn, gridIn), 0, maxX),
    yIn: clamp(snapToGrid(pos.yIn, gridIn), 0, maxY),
  };
}
