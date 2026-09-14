import type { Plan } from "./types";

/**
 * Room-size landing pages.
 *
 * These exist for search: people look up their exact room ("10x10 home gym
 * layout", "garage gym with 8 foot ceilings") far more often than they look up
 * a planner. Each page answers that query with a real, working layout and hands
 * the reader the same plan pre-loaded in the planner.
 *
 * A layout is a `Plan` — the identical shape bundles and the planner already
 * use — so nothing here needs its own rendering, pricing or cart path. The same
 * test that guards bundles guards these: no collisions, nothing out of bounds,
 * nothing blocking a working zone. A layout page that shows an impossible room
 * is worse for us than no page, because it is the first thing a buyer sees.
 *
 * `notes` is the part Google actually rewards. Seven near-identical pages with
 * swapped dimensions is a doorway-page pattern and gets demoted; the honest
 * constraint of each room ("at 84 inches a pull-up bar is out") is both the
 * useful bit and the differentiated bit.
 */

export type Layout = {
  slug: string;
  /** <title> and H1. Written as the search query, because that is the job. */
  title: string;
  h1: string;
  metaDescription: string;
  roomLabel: string;
  sqft: number;
  /** Opening paragraph. Plain answer to the query, before any selling. */
  intro: string;
  /** The honest constraints of this specific room. */
  notes: { heading: string; body: string }[];
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
) => ({ uid: `l${seq++}`, equipmentId, xIn, yIn, rotation });

export const layouts: Layout[] = [
  // ------------------------------------------------------------------ 10x10 --
  {
    slug: "10x10-home-gym-layout",
    title: "10x10 Home Gym Layout — What Actually Fits in 100 Sq Ft",
    h1: "10x10 home gym layout",
    metaDescription:
      "A working 10x10 home gym layout: power rack, bench, barbell, bumper plates and flooring, with the walkways kept usable. Load it into a free planner and change it.",
    roomLabel: "10 × 10 ft",
    sqft: 100,
    intro:
      "One hundred square feet is enough for a complete barbell gym — rack, bench, bar and plates — with room to walk around it. What you give up is deadlifting away from the rack and any real cardio footprint. This layout puts the rack flat against one wall and keeps the opposite half of the room empty, so you press and bail into open floor rather than into a corner.",
    notes: [
      {
        heading: "Put the rack against a wall, not in the middle",
        body: "A rack centred in a 10x10 eats the room twice: once for its footprint and again for the walkway you now need on all four sides. Against a wall you only pay for the front.",
      },
      {
        heading: "You need about 3 feet in front of the rack",
        body: "Not for comfort — for bailing. If you fail a squat you step backward out of the rack, and that space has to be empty floor, not a bench you shoved out of the way.",
      },
      {
        heading: "The bench lives outside the rack between sets",
        body: "This layout parks the bench along the far wall. You drag it into the rack to press and drag it back out. In a room this size that is the trade that makes everything else fit.",
      },
      {
        heading: "Skip the treadmill",
        body: "The smallest treadmill in our catalog is about 27 x 55 inches with clearance behind it. In 100 sq ft that is the rack or the treadmill, not both. A rower stores upright and a bike is smaller if you want cardio here.",
      },
    ],
    plan: {
      room: room(120, 120, 96),
      items: [
        at("gorilla-mats-4x6", 0, 0),
        at("rubber-cal-stall-mat-4x6", 48, 0),
        at("titan-t3-power-rack", 0, 0),
        at("titan-flat-bench", 90, 4),
        at("hulkfit-bumper-set-160", 62, 84),
        at("cap-olympic-bar-7ft", 6, 112),
        at("bowflex-selecttech-552", 100, 84),
      ],
    },
  },

  // ------------------------------------------------------------ 12x20 garage --
  {
    slug: "12x20-garage-gym-layout",
    title: "12x20 Garage Gym Layout — Single Car Garage Setup",
    h1: "12x20 garage gym layout",
    metaDescription:
      "A full 12x20 single-car garage gym layout: power rack, bench, bumper plates, rower and flooring, with a clear walkway down one side. Free planner, no signup.",
    roomLabel: "12 × 20 ft",
    sqft: 240,
    intro:
      "A single-car garage is the most common home gym there is, and 12 by 20 is the size most of them are. It is genuinely comfortable: a full rack, a bench, plates, a rower and still a walkway down one side. This layout keeps the long wall clear so you can move.",
    notes: [
      {
        heading: "Work down the long wall",
        body: "Twelve feet of width is the constraint, not the twenty feet of depth. Line the heavy equipment along one long wall and you keep an unbroken walkway on the other, which is what makes the room feel usable instead of packed.",
      },
      {
        heading: "Leave the garage door end alone",
        body: "This layout keeps the last few feet by the door clear. You want somewhere to open the door, drag a sled, or work with a bar without hitting the tracks — and if the room is also a garage sometimes, you want the car to fit.",
      },
      {
        heading: "Garage ceilings are usually fine, until the door opens",
        body: "Most garages run 8 to 9 feet, which clears a rack. The thing that catches people is the door's open track, which hangs below the ceiling across most of the bay. Measure to the track, not to the ceiling.",
      },
      {
        heading: "Rubber over concrete, everywhere you drop",
        body: "Bumper plates will chip a garage slab. This layout runs mats under the rack and the lifting area rather than the whole floor, which is the cheaper and more common approach.",
      },
    ],
    plan: {
      room: room(144, 240, 108),
      items: [
        at("rubber-cal-stall-mat-4x6", 0, 0),
        at("rubber-cal-stall-mat-4x6", 48, 0),
        at("rubber-cal-stall-mat-4x6", 0, 72),
        at("rubber-cal-stall-mat-4x6", 48, 72),
        at("titan-x3-tall-rack", 0, 0),
        at("flybird-adjustable-bench", 108, 8),
        at("cap-bumper-set-260", 100, 90),
        at("cap-olympic-bar-7ft", 56, 132),
        at("sunny-sf-rw5515-rower", 8, 150),
        at("titan-dumbbell-rack-3tier", 60, 210),
        at("led-shop-light-4ft", 0, 120),
        at("wking-bluetooth-speaker", 128, 200),
      ],
    },
  },

  // ------------------------------------------------------------ 2-car garage --
  {
    slug: "2-car-garage-gym-layout",
    title: "2 Car Garage Gym Layout — Full Setup, Keep One Bay",
    h1: "2 car garage gym layout",
    metaDescription:
      "A 20x20 two-car garage gym layout with a rack, functional trainer, bench, dumbbells and cardio — laid out so one bay stays clear. Load it into a free 3D planner.",
    roomLabel: "20 × 20 ft",
    sqft: 400,
    intro:
      "Four hundred square feet is where a home gym stops being a compromise. You can run a full rack, a cable machine, dumbbells and cardio at once and still walk between them. This layout groups everything along two walls so the middle stays open — which is also what lets you park a car in one bay if you need to.",
    notes: [
      {
        heading: "Keep the middle empty",
        body: "The instinct in a big room is to spread out. Resist it. Equipment on the perimeter with an open centre gives you floor for stretching, sled work, KB swings and anything that needs a run-up — and it is the only arrangement that lets a car back in.",
      },
      {
        heading: "This is the smallest room where cardio stops hurting",
        body: "A treadmill needs about six feet of length plus clearance behind it. In a 12-foot-wide garage that eats the walkway. At 20 feet wide it just sits on a wall and stops being a problem.",
      },
      {
        heading: "Spend the extra space on a cable machine, not more free weights",
        body: "Most people fill a big garage with a second bar and more plates. A functional trainer covers rows, flyes, triceps, face pulls and everything else a rack cannot, and it is the single biggest upgrade to what you can actually train.",
      },
      {
        heading: "Two-car garages are cold",
        body: "More air volume, usually an uninsulated door, and often a north wall. Budget for a heater or accept that January sessions start badly. It is not a layout problem but it is the thing people regret.",
      },
    ],
    plan: {
      room: room(240, 240, 108),
      items: [
        at("incstores-rubber-tile-24", 0, 0),
        at("incstores-rubber-tile-24", 96, 0),
        at("incstores-rubber-tile-24", 0, 72),
        at("incstores-rubber-tile-24", 96, 72),
        at("titan-x3-tall-rack", 0, 0),
        at("valor-bd-62-functional-trainer", 180, 0),
        at("finer-form-fid-bench", 76, 6),
        at("cap-bumper-set-260", 128, 8),
        at("hex-dumbbell-set-5-50-rack", 0, 208),
        at("nordictrack-t-series-treadmill", 200, 160),
        at("concept2-rowerg", 150, 130),
        at("cap-olympic-bar-7ft", 76, 100),
        at("yes4all-plate-tree", 0, 120),
        at("hasipu-gym-mirror-72", 100, 236),
        at("led-shop-light-4ft", 0, 84),
        at("freepear-party-speaker", 130, 60),
      ],
    },
  },

  // -------------------------------------------------------------- bedroom ----
  {
    slug: "spare-bedroom-home-gym-layout",
    title: "Spare Bedroom Home Gym Layout — No Garage Needed",
    h1: "Spare bedroom home gym layout",
    metaDescription:
      "Turn a standard spare bedroom into a real gym: rack, bench, adjustable dumbbells and flooring in 11x12 ft. Layout, equipment list and a free 3D planner.",
    roomLabel: "11 × 12 ft",
    sqft: 132,
    intro:
      "A standard spare bedroom holds a complete strength setup. The real constraints upstairs are not space — they are noise, floor loading and getting equipment through the door. This layout works around all three: no dropping, weight spread rather than concentrated, and nothing that cannot be carried up in parts.",
    notes: [
      {
        heading: "Do not buy bumper plates for an upstairs room",
        body: "Bumpers exist to be dropped, and dropping anything on a joisted floor is how you crack ceiling plaster below and end a marriage. Cast iron and adjustable dumbbells are the right call here — this layout uses them.",
      },
      {
        heading: "Floor loading is about concentration, not total weight",
        body: "A wooden floor carries a lot of weight spread out and much less on four small feet. Keep the rack's feet over or near joists where you can, run mats underneath, and do not stack all your plates in one corner.",
      },
      {
        heading: "Measure the doorway and the stairs, not just the room",
        body: "A power rack arrives as long steel uprights. Most assemble inside the room fine, but a pre-welded bench or a treadmill deck may simply not turn the corner at the top of your stairs. Check the tightest point on the route.",
      },
      {
        heading: "Adjustable dumbbells earn their price here",
        body: "A full 5–50 rack is 6 feet long and would take a whole wall of this room. One pair of adjustables does the same job in a footprint the size of a shoebox, and that is the difference between this room working and not.",
      },
    ],
    plan: {
      room: room(132, 144, 96),
      items: [
        at("gorilla-mats-4x6", 0, 0),
        at("gorilla-mats-4x6", 48, 0),
        at("titan-t2-squat-stand", 0, 0),
        at("fitness-reality-1000-bench", 104, 6),
        at("cap-cast-iron-set-300", 60, 60),
        at("nuobell-adjustable-80", 0, 130),
        at("powerblock-elite-exp-50", 24, 130),
        at("papababe-ez-curl-bar", 60, 138),
        at("hasipu-gym-mirror-72", 92, 141),
      ],
    },
  },

  // -------------------------------------------------------------- basement ---
  {
    slug: "basement-home-gym-layout",
    title: "Basement Home Gym Layout — Working Around Low Ceilings",
    h1: "Basement home gym layout",
    metaDescription:
      "A basement gym layout built for a 7-foot ceiling: what fits, what does not, and why a standard power rack is usually the wrong buy down there.",
    roomLabel: "14 × 20 ft",
    sqft: 280,
    intro:
      "Basements have the floor space and none of the headroom. At 84 inches — a very common finished basement ceiling — a standard 82-inch power rack technically fits and is still the wrong purchase, because you cannot stand a barbell up inside it or use the pull-up bar. This layout is built around that constraint rather than ignoring it.",
    notes: [
      {
        heading: "84 inches means no pull-up bar — and no cable machine either",
        body: "A rack's pull-up bar wants your chin above it and your feet off the floor; at 7 feet neither happens. The part people miss is that lat pulldowns and functional trainers need 85 to 90 inches of headroom for the cable to travel, so they do not fit at 84 inches either. Bands anchored low, and a doorway bar somewhere taller in the house, are the realistic substitutes. At 90 inches or more the cable machine comes back on the table.",
      },
      {
        heading: "Check your overhead press standing, before you buy",
        body: "Stand where the rack will go and press an empty bar overhead. If your knuckles hit joists, ductwork or a light, overhead pressing is off the menu in that spot — move the rack rather than give up the lift.",
      },
      {
        heading: "Basements are the best place to drop weight and the worst for noise",
        body: "You are on a slab, so the floor takes it. But sound travels straight up through the joists into the living room. Rubber under the whole lifting area, and drop pads if you deadlift, are not optional here.",
      },
      {
        heading: "Watch for the post in the middle of the room",
        body: "Most basements have a support column somewhere inconvenient. It is load-bearing and it is not moving. Measure to it and lay out around it — in the planner you can drop a placeholder where yours is and build around it.",
      },
      {
        heading: "Damp kills steel",
        body: "A dehumidifier is cheaper than a rusted bar. Anything knurled should live off the concrete on a rack or stand rather than leaning in a corner.",
      },
    ],
    plan: {
      room: room(168, 240, 84),
      items: [
        at("rubber-cal-stall-mat-4x6", 0, 0),
        at("rubber-cal-stall-mat-4x6", 48, 0),
        at("rubber-cal-stall-mat-4x6", 0, 72),
        at("rubber-cal-stall-mat-4x6", 48, 72),
        at("barwing-bench-press-rack", 0, 0),
        at("titan-flat-bench", 108, 8),
        at("serious-steel-band-set", 150, 100),
        at("cap-cast-iron-set-300", 60, 60),
        at("cap-olympic-bar-7ft", 40, 150),
        at("deadlift-drop-pads", 0, 160),
        at("sunny-sf-b1805-bike", 8, 186),
        at("titan-dumbbell-rack-3tier", 90, 212),
        at("led-strip-lights", 160, 180),
      ],
    },
  },

  // ------------------------------------------------------------ 8ft ceiling --
  {
    slug: "home-gym-8-foot-ceiling",
    title: "Home Gym With 8 Foot Ceilings — What Fits and What Doesn't",
    h1: "Home gym with 8 foot ceilings",
    metaDescription:
      "Eight-foot ceilings rule out more equipment than most people expect. Here is a layout that works at 96 inches, plus what to buy instead of a tall rack.",
    roomLabel: "12 × 16 ft",
    sqft: 192,
    intro:
      "Eight feet is the most common ceiling height in a house and the most common thing people forget to measure. A rack fits. Pressing a bar overhead inside it mostly does not, and neither does a pull-up. This layout is what a good gym looks like when 96 inches is the hard limit.",
    notes: [
      {
        heading: "The number that matters is your reach, not the rack height",
        body: "Stand up, press an empty bar overhead, and measure from the floor to the bar. That is usually 84 to 90 inches for an average-height lifter. Whatever headroom you have left over is what you actually get to work with.",
      },
      {
        heading: "A short rack beats a tall rack you cannot use",
        body: "Racks around 71 to 72 inches leave room to stand a bar up inside and to press without ducking. You lose the pull-up bar, which at 8 feet you were not going to use anyway.",
      },
      {
        heading: "Where the pull-ups go instead",
        body: "A lat pulldown or a rack-mounted pulley covers vertical pulling with no headroom cost. This layout includes one. It is not the same movement, but it is trainable and progressive, which a pull-up bar you cannot hang from is not.",
      },
      {
        heading: "Overhead press seated, or step out of the rack",
        body: "Seated on an incline bench you lose maybe six inches of bar travel at the top. Or press standing outside the rack where the ceiling is clear of light fixtures. Both work; both need to be planned for rather than discovered.",
      },
    ],
    plan: {
      room: room(144, 192, 96),
      items: [
        at("rubber-cal-stall-mat-4x6", 0, 0),
        at("rubber-cal-stall-mat-4x6", 48, 0),
        at("rubber-cal-stall-mat-4x6", 0, 72),
        at("titan-t2-squat-stand", 0, 0),
        at("valor-cb-12-lat-pulldown", 92, 4),
        at("flybird-adjustable-bench", 0, 110),
        at("hulkfit-bumper-set-160", 64, 0),
        at("cap-olympic-bar-7ft", 28, 186),
        at("nuobell-adjustable-80", 120, 120),
        at("led-shop-light-4ft", 60, 100),
        at("ancoon-bluetooth-speaker", 130, 180),
      ],
    },
  },

  // ------------------------------------------------------------ tiny / 80sf --
  {
    slug: "small-home-gym-under-100-sq-ft",
    title: "Small Home Gym Under 100 Sq Ft — 8x10 Layout",
    h1: "Small home gym under 100 sq ft",
    metaDescription:
      "Eighty square feet is enough for a real strength setup if you buy the right things. An 8x10 home gym layout with the equipment list that actually fits.",
    roomLabel: "8 × 10 ft",
    sqft: 80,
    intro:
      "Eighty square feet is about the smallest room that still trains everything. It only works if you stop trying to shrink a normal gym and buy for the space instead: a folding rack, one adjustable bench, and adjustable dumbbells rather than a set. That combination trains the whole body in a room the size of a large closet.",
    notes: [
      {
        heading: "A folding wall-mounted rack is the whole trick",
        body: "It sits 22 inches off the wall in use and about 5 inches folded. In a room this size that is the difference between a gym and a storage cupboard, and it is the first thing to buy.",
      },
      {
        heading: "You must bolt it into studs",
        body: "A folding rack transfers everything you lift into your wall. Find the studs, use the right lags, and do not mount it to drywall or to furring strips. If you cannot bolt into the wall, buy a squat stand instead and lose the floor space.",
      },
      {
        heading: "One pair of adjustable dumbbells replaces a whole wall",
        body: "A 5–50 set with a rack is six feet long. A pair of adjustables is a two-foot shelf and covers the same range. In 80 square feet this is not a preference, it is the only version that fits.",
      },
      {
        heading: "The bar lives on the rack, because there is nowhere to put it down",
        body: "An Olympic bar is 86 inches long. Lay it on the floor of an 8x10 and it crosses the working space of everything else in the room — we could not place one here without blocking either the rack or the bench. It stores on the rack's j-hooks or a wall holder, which is where it should live anyway. Worth knowing before you buy a bar longer than your room is wide.",
      },
    ],
    plan: {
      room: room(96, 120, 96),
      items: [
        at("gorilla-mats-4x6", 0, 0),
        at("balancefrom-foam-tile-24", 0, 48),
        at("titan-folding-rack", 20, 0),
        at("titan-flat-bench", 44, 84, 90),
        at("nuobell-adjustable-80", 0, 74),
        at("serious-steel-band-set", 0, 110),
        at("led-cob-strip", 88, 0),
      ],
    },
  },
];

export function getLayout(slug: string): Layout | undefined {
  return layouts.find((l) => l.slug === slug);
}
