import type { Plan } from "./types";

/**
 * Pre-built gyms.
 *
 * A bundle is just a saved plan — the same shape the planner and the cart
 * already understand — so "Load into planner" and "Buy all" both fall out of
 * code that exists. Positions are real inches from the room's north-west
 * corner, laid out so nothing collides and nothing blocks a working space; a
 * test asserts that, because a curated layout that trips its own warnings is
 * worse than no layout at all.
 */

export type Bundle = {
  id: string;
  name: string;
  tagline: string;
  /** Who it is for, in one line. */
  bestFor: string;
  /** Rough room the layout assumes, for the card. */
  roomLabel: string;
  highlights: string[];
  plan: Plan;
};

const room = (widthIn: number, depthIn: number, ceilingHeightIn: number) => ({
  widthIn,
  depthIn,
  ceilingHeightIn,
  doors: [],
  windows: [],
});

let seq = 0;
const at = (
  equipmentId: string,
  xIn: number,
  yIn: number,
  rotation: 0 | 90 | 180 | 270 = 0,
) => ({ uid: `b${seq++}`, equipmentId, xIn, yIn, rotation });

export const bundles: Bundle[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Everything you need to train hard, nothing you don't.",
    bestFor: "A spare bedroom or a corner of the basement.",
    roomLabel: "10 × 14 ft",
    highlights: [
      "Squat, bench, press and deadlift from day one",
      "Cheapest full barbell setup that is still safe to fail in",
      "Fits against one wall",
    ],
    plan: {
      room: room(120, 168, 96),
      items: [
        at("balancefrom-foam-tile-24", 24, 0),
        at("balancefrom-foam-tile-24", 24, 72),
        at("fitness-reality-810xlt", 36, 0),
        at("yes4all-bumper-set-160", 94, 100),
        at("flybird-adjustable-bench", 42, 96),
        at("cap-olympic-bar-7ft", 114, 60, 90),
      ],
    },
  },
  {
    id: "garage",
    name: "Garage",
    tagline: "The one-car garage gym most people actually want.",
    bestFor: "A single garage bay you still want to walk through.",
    roomLabel: "12 × 20 ft",
    highlights: [
      "Full-depth power rack with pull-up bar",
      "Bumper plates you can drop",
      "Adjustable dumbbells cover everything the barbell misses",
    ],
    plan: {
      room: room(144, 240, 108),
      items: [
        at("rubber-cal-stall-mat-4x6", 24, 0),
        at("rubber-cal-stall-mat-4x6", 24, 72),
        at("rubber-cal-stall-mat-4x6", 24, 144),
        at("titan-t3-power-rack", 48, 0),
        at("yes4all-plate-tree", 114, 6),
        at("vornado-air-circulator", 6, 6),
        at("signature-bumper-set-260", 6, 40),
        at("bowflex-selecttech-552", 120, 60),
        at("finer-form-fid-bench", 54, 84),
        at("titan-olympic-bar", 29, 228),
      ],
    },
  },
  {
    id: "advanced",
    name: "Advanced",
    tagline: "Barbell, cables and conditioning under one roof.",
    bestFor: "Serious training with no commercial gym membership.",
    roomLabel: "14 × 22 ft",
    highlights: [
      "Flat-foot rack — no bolting into the slab",
      "Lat pulldown and low row for real back volume",
      "Rower for conditioning, full dumbbell set 5–50 lb",
    ],
    plan: {
      room: room(168, 264, 108),
      items: [
        at("rubber-cal-stall-mat-4x6", 48, 0),
        at("rubber-cal-stall-mat-4x6", 48, 72),
        at("rubber-cal-stall-mat-4x6", 48, 144),
        at("rubber-cal-stall-mat-4x6", 96, 72),
        // North wall: pulldown and rack side by side, both facing into the room.
        at("valor-cb-12-lat-pulldown", 0, 0),
        at("titan-x3-flat-foot-rack", 60, 0),
        // East wall: storage stacked front to back, clear of the rower's lane.
        at("yes4all-plate-tree", 140, 6),
        at("synergee-vertical-bar-holder", 140, 62),
        at("signature-bumper-set-260", 6, 100),
        at("titan-change-plate-set", 30, 100),
        at("finer-form-fid-bench", 70, 110),
        at("concept2-rowerg", 134, 120),
        // Dumbbells turned to face the room rather than the wall.
        at("hex-dumbbell-set-5-50-rack", 0, 150, 270),
        at("vornado-air-circulator", 6, 240),
        at("titan-olympic-bar", 40, 256),
      ],
    },
  },
  {
    id: "luxury",
    name: "Luxury",
    tagline: "Nothing you'd need to leave the house for.",
    bestFor: "A dedicated room, built once, properly.",
    roomLabel: "18 × 28 ft",
    highlights: [
      "Rack, Smith machine and a full cable trainer",
      "Rower, air bike and an auto-incline treadmill",
      "Full hex dumbbell set, GHD and a wall mirror",
    ],
    plan: {
      // A luxury build needs the floor for working space, not just for the
      // machines: at 16 x 24 ft this layout could not clear its own lifting
      // zones, so the bundle assumes a properly sized dedicated room.
      room: room(216, 336, 120),
      items: [
        at("rubber-cal-stall-mat-4x6", 48, 96),
        at("rubber-cal-stall-mat-4x6", 48, 168),
        at("rubber-cal-stall-mat-4x6", 96, 96),
        at("rubber-cal-stall-mat-4x6", 96, 168),
        at("rubber-cal-stall-mat-4x6", 48, 240),
        at("rubber-cal-stall-mat-4x6", 96, 240),
        // North wall: the two big cages, with storage in the gap between them.
        at("titan-x3-flat-foot-rack", 0, 0),
        at("marcy-smith-cage-sm4008", 166, 0),
        at("yes4all-plate-tree", 80, 6),
        at("signature-bumper-set-260", 118, 6),
        at("titan-olympic-bar", 61, 70),
        // Mid floor.
        at("valor-bd-62-functional-trainer", 0, 110),
        at("assault-airbike-classic", 100, 110),
        at("hex-dumbbell-set-550-rack", 188, 130, 90),
        // Back half.
        at("finer-form-fid-bench", 86, 210),
        at("sunny-auto-incline-treadmill", 0, 240),
        at("concept2-rowerg", 150, 230),
        at("titan-ghd", 186, 250),
        at("vornado-air-circulator", 40, 320),
        at("gym-mirror-48x72", 60, 334),
      ],
    },
  },
];

export function getBundle(id: string): Bundle | undefined {
  return bundles.find((b) => b.id === id);
}
