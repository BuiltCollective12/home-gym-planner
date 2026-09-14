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

/**
 * "tier" bundles answer "how much do I want to spend"; "niche" bundles answer
 * "what do I actually train". They are the same shape and both buy the same
 * way — the split only drives how the page groups them, and which tests apply
 * (a tier ladder must rise in price; a cardio bundle has no business owning a
 * squat rack).
 */
export type BundleKind = "tier" | "niche";

export type Bundle = {
  id: string;
  kind: BundleKind;
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
    kind: "tier",
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
        at("sunny-power-cage", 36, 0),
        at("hulkfit-bumper-set-160", 94, 100),
        at("flybird-adjustable-bench", 42, 96),
        at("cap-olympic-bar-7ft", 114, 60, 90),
      ],
    },
  },
  {
    id: "garage",
    kind: "tier",
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
        at("cap-bumper-set-260", 6, 40),
        at("bowflex-selecttech-552", 120, 60),
        at("finer-form-fid-bench", 54, 84),
        at("titan-olympic-bar", 29, 228),
      ],
    },
  },
  {
    id: "advanced",
    kind: "tier",
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
        at("titan-x3-tall-rack", 60, 0),
        // East wall: storage stacked front to back, clear of the rower's lane.
        at("yes4all-plate-tree", 140, 6),
        at("synergee-vertical-bar-holder", 140, 62),
        at("cap-bumper-set-260", 6, 100),
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
    kind: "tier",
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
        at("titan-x3-tall-rack", 0, 0),
        at("marcy-smith-cage-sm4008", 166, 0),
        at("yes4all-plate-tree", 80, 6),
        at("cap-bumper-set-260", 118, 6),
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

  /* ---------------------------------------------------------------- niche --
   * Built around a training style rather than a budget. Positions follow the
   * same rule as the tiers: nothing overlaps, nothing blocks a working zone,
   * and a test enforces it.
   */
  {
    id: "powerlifting",
    kind: "niche",
    name: "Powerlifting",
    tagline: "Squat, bench, deadlift. Nothing that does not serve the total.",
    bestFor: "Training the big three seriously, with room to fail a rep.",
    roomLabel: "14 × 20 ft",
    highlights: [
      "Tall rack with the 36in of bail-out space in front kept clear",
      "Three bars: power bar, 7ft Olympic, and a safety squat bar",
      "460 lb of plates, chalk, belt and wraps — the whole kit",
    ],
    plan: {
      room: room(168, 240, 108),
      items: [
        at("rubber-cal-stall-mat-4x6", 0, 0),
        at("rubber-cal-stall-mat-4x6", 48, 0),
        at("rubber-cal-stall-mat-4x6", 0, 72),
        at("rubber-cal-stall-mat-4x6", 48, 72),
        at("rubber-cal-stall-mat-4x6", 0, 144),
        at("rubber-cal-stall-mat-4x6", 48, 144),
        at("titan-x3-tall-rack", 0, 0),
        at("titan-flat-bench", 100, 0),
        at("yes4all-plate-tree", 144, 90),
        at("synergee-vertical-bar-holder", 144, 140),
        at("cap-bumper-set-260", 0, 100),
        at("cap-cast-iron-set-300", 24, 100),
        at("cap-trap-bar", 0, 150),
        at("deadlift-drop-pads", 70, 150),
        at("titan-olympic-bar", 40, 200),
        at("cap-olympic-bar-7ft", 40, 210),
        at("titan-safety-squat-bar", 40, 220),
        at("gym-chalk-blocks", 160, 200),
        at("gymreapers-wrist-wraps", 160, 210),
        at("lifting-belt", 150, 222),
      ],
    },
  },
  {
    id: "bodybuilding",
    kind: "niche",
    name: "Bodybuilding",
    tagline: "Every angle, every rep range, no queue for the cable stack.",
    bestFor: "Hypertrophy training where variety matters more than max load.",
    roomLabel: "14 × 22 ft",
    highlights: [
      "Cable crossover and lat pulldown for the pulls a rack cannot do",
      "Full 5–50 lb hex dumbbell set on a rack, not adjustables",
      "Rack and FID bench for pressing, mirror for form checks",
    ],
    plan: {
      room: room(168, 264, 108),
      items: [
        at("rubber-cal-stall-mat-4x6", 0, 0),
        at("rubber-cal-stall-mat-4x6", 48, 0),
        at("rubber-cal-stall-mat-4x6", 0, 72),
        at("rubber-cal-stall-mat-4x6", 48, 72),
        at("valor-bd-62-functional-trainer", 0, 0),
        at("titan-t3-power-rack", 100, 0),
        at("valor-cb-12-lat-pulldown", 0, 140),
        at("hex-dumbbell-set-5-50-rack", 90, 100),
        at("finer-form-fid-bench", 80, 190),
        at("papababe-ez-curl-bar", 0, 250),
        at("hasipu-gym-mirror-72", 130, 262),
        at("gym-timer-clock", 150, 90),
        at("wking-bluetooth-speaker", 152, 80),
      ],
    },
  },
  {
    id: "cardio",
    kind: "niche",
    name: "Cardio & Conditioning",
    tagline: "Three machines, three energy systems, and the floor to work.",
    bestFor: "Engine work, fat loss and conditioning rather than max strength.",
    roomLabel: "12 × 20 ft",
    highlights: [
      "Treadmill, bike and rower — steady state, intervals and full body",
      "Kettlebells, wall ball, jump rope and a battle rope for circuits",
      "No barbell, so no rack and no dropped weight",
    ],
    plan: {
      room: room(144, 240, 108),
      items: [
        at("rubber-cal-stall-mat-4x6", 48, 0),
        at("rubber-cal-stall-mat-4x6", 48, 72),
        at("gorilla-mats-4x6", 0, 120),
        at("nordictrack-t-series-treadmill", 0, 0),
        at("schwinn-ic4-bike", 60, 0),
        at("concept2-rowerg", 110, 0),
        at("yes4all-kettlebell-set", 0, 150),
        at("jfit-wall-ball-25", 40, 150),
        at("speed-jump-rope", 60, 150),
        at("battle-rope-40ft", 0, 200),
        at("vornado-air-circulator", 120, 220),
        at("gym-timer-clock", 100, 238),
        at("wking-bluetooth-speaker", 130, 150),
      ],
    },
  },
  {
    id: "beginner",
    kind: "niche",
    name: "New to Lifting",
    tagline: "The five lifts that matter, and nothing you have to grow into.",
    bestFor: "A first home gym, bought once, that still works in two years.",
    roomLabel: "10 × 14 ft",
    highlights: [
      "A full cage, so you can fail a squat alone and be fine",
      "Adjustable dumbbells instead of a set you cannot afford yet",
      "160 lb of bumpers — enough to progress on for a long time",
    ],
    plan: {
      room: room(120, 168, 96),
      items: [
        at("balancefrom-foam-tile-24", 0, 0),
        at("balancefrom-foam-tile-24", 48, 0),
        at("balancefrom-foam-tile-24", 0, 72),
        at("hulkfit-power-cage", 0, 0),
        at("flybird-adjustable-bench", 90, 0),
        at("hulkfit-bumper-set-160", 0, 100),
        at("powerblock-elite-exp-50", 100, 100),
        at("foam-roller-36", 60, 120),
        at("gymreapers-wrist-wraps", 0, 140),
        at("cap-olympic-bar-7ft", 16, 160),
        at("hasipu-gym-mirror-72", 60, 166),
      ],
    },
  },
  {
    id: "mobility",
    kind: "niche",
    name: "Yoga, Pilates & Mobility",
    tagline: "Floor space, good light, and everything within arm's reach.",
    bestFor: "Flow, stretching and recovery — on its own or beside a lifting gym.",
    roomLabel: "10 × 12 ft",
    highlights: [
      "Two full-size mats, so a second person can join",
      "Blocks, strap, bands and a 36in roller for the whole mobility kit",
      "One adjustable pair that starts at 5 lb — light enough for Pilates",
    ],
    plan: {
      room: room(120, 144, 96),
      items: [
        at("gorilla-mats-4x6", 0, 0),
        at("retrospec-yoga-mat", 12, 12),
        at("retrospec-yoga-mat", 60, 12),
        at("foam-roller-36", 0, 100),
        at("yoga-block-strap-set", 44, 100),
        at("serious-steel-band-set", 70, 100),
        at("powerblock-elite-exp-50", 90, 100),
        at("hasipu-gym-mirror-72", 40, 142),
        at("led-strip-lights", 110, 0),
        at("wking-bluetooth-speaker", 105, 20),
      ],
    },
  },
  {
    id: "apartment",
    kind: "niche",
    name: "Apartment Friendly",
    tagline: "A real gym you can use at 6am without a note from downstairs.",
    bestFor: "An upstairs room or a flat, where dropping weight is not an option.",
    roomLabel: "10 × 11 ft",
    highlights: [
      "No barbell and no bumpers, so nothing ever hits the floor",
      "One pair of 80 lb adjustables replaces a whole dumbbell wall",
      "Folds down to a mat and a bench when you need the room back",
    ],
    plan: {
      room: room(120, 132, 96),
      items: [
        at("balancefrom-foam-tile-24", 0, 0),
        at("balancefrom-foam-tile-24", 48, 0),
        at("retrospec-yoga-mat", 0, 60),
        at("flybird-adjustable-bench", 60, 0),
        at("nuobell-adjustable-80", 0, 90),
        at("serious-steel-band-set", 100, 90),
        at("foam-roller-36", 30, 110),
        at("wall-accessory-rack", 96, 80),
        at("led-strip-lights", 110, 0),
        at("hasipu-gym-mirror-72", 40, 130),
      ],
    },
  },
];

export function getBundle(id: string): Bundle | undefined {
  return bundles.find((b) => b.id === id);
}
