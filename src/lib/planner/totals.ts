import type { Equipment, PlacedItem, Room } from "@/lib/types";
import { footprintRect, rotatedFootprint } from "./geometry";

export type PlanTotals = {
  itemCount: number;
  /** Distinct catalog items (an item placed twice counts once). */
  uniqueItemCount: number;
  estCostUsd: number;
  /** True when at least one placed item has no price estimate. */
  hasUnpricedItems: boolean;
  totalWeightLbs: number;
  roomAreaSqft: number;
  usedAreaSqft: number;
  /** Fraction of the floor covered by non-flooring footprints, 0–1. */
  floorUsage: number;
  /** Square feet of flooring the room needs — drives the flooring upsell. */
  flooringNeededSqft: number;
};

const SQIN_PER_SQFT = 144;

type Lookup = (equipmentId: string) => Equipment | undefined;

export function computeTotals(
  items: PlacedItem[],
  room: Pick<Room, "widthIn" | "depthIn">,
  lookup: Lookup,
): PlanTotals {
  let estCostUsd = 0;
  let hasUnpricedItems = false;
  let totalWeightLbs = 0;
  let usedAreaSqin = 0;
  const unique = new Set<string>();

  for (const placed of items) {
    const equipment = lookup(placed.equipmentId);
    if (!equipment) continue;
    unique.add(equipment.id);
    if (typeof equipment.estPriceUsd === "number") {
      estCostUsd += equipment.estPriceUsd;
    } else {
      hasUnpricedItems = true;
    }
    totalWeightLbs += equipment.weightLbs;
    if (equipment.category !== "flooring") {
      const { widthIn, depthIn } = rotatedFootprint(equipment, placed.rotation);
      usedAreaSqin += widthIn * depthIn;
    }
  }

  const roomAreaSqin = room.widthIn * room.depthIn;
  const roomAreaSqft = roomAreaSqin / SQIN_PER_SQFT;

  return {
    itemCount: items.length,
    uniqueItemCount: unique.size,
    estCostUsd,
    hasUnpricedItems,
    totalWeightLbs,
    roomAreaSqft,
    usedAreaSqft: usedAreaSqin / SQIN_PER_SQFT,
    floorUsage: roomAreaSqin > 0 ? usedAreaSqin / roomAreaSqin : 0,
    flooringNeededSqft: flooringNeededSqft(items, room, lookup),
  };
}

/**
 * Flooring still to buy: room area minus the area already covered by flooring
 * items in the plan. Revenue stream 2 — every plan should end up with flooring.
 */
export function flooringNeededSqft(
  items: PlacedItem[],
  room: Pick<Room, "widthIn" | "depthIn">,
  lookup: Lookup,
): number {
  const roomAreaSqin = room.widthIn * room.depthIn;
  let coveredSqin = 0;
  for (const placed of items) {
    const equipment = lookup(placed.equipmentId);
    if (!equipment || equipment.category !== "flooring") continue;
    const r = footprintRect(placed, equipment);
    coveredSqin += r.w * r.h;
  }
  return Math.max(0, roomAreaSqin - coveredSqin) / SQIN_PER_SQFT;
}

/** Collapse a plan into cart lines: one row per catalog item with a quantity. */
export function toCartLines(
  items: PlacedItem[],
  lookup: Lookup,
): { equipment: Equipment; quantity: number }[] {
  const counts = new Map<string, number>();
  for (const placed of items) {
    counts.set(placed.equipmentId, (counts.get(placed.equipmentId) ?? 0) + 1);
  }
  const lines: { equipment: Equipment; quantity: number }[] = [];
  for (const [equipmentId, quantity] of counts) {
    const equipment = lookup(equipmentId);
    if (equipment) lines.push({ equipment, quantity });
  }
  return lines.sort((a, b) => a.equipment.name.localeCompare(b.equipment.name));
}
