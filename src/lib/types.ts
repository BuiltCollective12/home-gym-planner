/**
 * Core domain types.
 *
 * The planner is deliberately catalog-agnostic: nothing below mentions gyms.
 * Swapping `catalog.ts` + `site.config.ts` is enough to repoint the same engine
 * at a home office, nursery, or home bar (see "Planner licensing" in the brief).
 */

export type Category =
  | "racks"
  | "barbells"
  | "plates"
  | "dumbbells"
  | "benches"
  | "machines"
  | "cardio"
  | "flooring"
  | "storage"
  | "accessories";

export const CATEGORIES: Category[] = [
  "racks",
  "barbells",
  "plates",
  "dumbbells",
  "benches",
  "machines",
  "cardio",
  "flooring",
  "storage",
  "accessories",
];

export const CATEGORY_LABELS: Record<Category, string> = {
  racks: "Racks",
  barbells: "Barbells",
  plates: "Plates",
  dumbbells: "Dumbbells",
  benches: "Benches",
  machines: "Machines",
  cardio: "Cardio",
  flooring: "Flooring",
  storage: "Storage",
  accessories: "Accessories",
};

/** Sides are expressed in the item's own un-rotated frame. */
export type ClearanceIn = {
  front?: number;
  back?: number;
  left?: number;
  right?: number;
};

export type SourceType = "amazon" | "brand" | "dropship";

export type Equipment = {
  id: string;
  name: string;
  brand: string;
  category: Category;
  /** Footprint + height, inches. `width` runs left-right at 0° rotation. */
  widthIn: number;
  depthIn: number;
  heightIn: number;
  clearanceIn?: ClearanceIn;
  /** Total vertical space the item needs in use (e.g. rack + pull-up bar headroom). */
  ceilingClearanceIn?: number;
  weightLbs: number;
  estPriceUsd?: number;
  sourceType: SourceType;
  sourceUrl: string;
  asin?: string;
  imageUrl?: string;
  modelUrl?: string;
  tags: string[];
  /** Paid catalog placement — must be labelled in the UI. */
  sponsored?: boolean;
};

/** Rotation is restricted to 90° snaps in Phase 1. */
export type Rotation = 0 | 90 | 180 | 270;

/** An instance of a catalog item placed on the floor plan. */
export type PlacedItem = {
  /** Instance id, unique within a plan. */
  uid: string;
  equipmentId: string;
  /** Inches from the room's top-left corner to the item's top-left corner. */
  xIn: number;
  yIn: number;
  rotation: Rotation;
};

export type Room = {
  widthIn: number;
  depthIn: number;
  ceilingHeightIn: number;
  /** Data URL or object URL of an optional reference photo (never uploaded in Phase 1). */
  photoDataUrl?: string;
  doors: Marker[];
  windows: Marker[];
};

export type WallSide = "north" | "south" | "east" | "west";

export type Marker = {
  id: string;
  wall: WallSide;
  /** Inches from the wall's start (west-to-east on N/S walls, north-to-south on E/W walls). */
  offsetIn: number;
  widthIn: number;
};

export type Plan = {
  room: Room;
  items: PlacedItem[];
};

export type Rect = { x: number; y: number; w: number; h: number };
