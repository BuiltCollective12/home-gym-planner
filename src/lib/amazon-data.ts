/**
 * Amazon-sourced product data, kept separate from the hand-maintained catalog.
 *
 * `catalog.ts` holds what we author: names, footprints, clearances, tags. This
 * file holds what came off the listing: image id, observed price, and the title
 * we saw when we checked. Keeping them apart means a re-scrape or the eventual
 * PA-API switch replaces one file and never touches planner data.
 *
 * PRICES: `priceUsd` is what the listing showed on `checkedOn`, and it is used
 * to keep our own estimate honest rather than presented as Amazon's live price.
 * Amazon prices move constantly and the Associates agreement requires any
 * displayed Amazon price to come from PA-API with a timestamp — so the UI keeps
 * saying "est." until PA-API is live. See `product-images.ts` for the same
 * caveat on imagery.
 *
 * `titleSeen` is recorded so a future re-check can tell when an ASIN has been
 * repointed at a different product, which Amazon does more often than you would
 * expect (see `problem-products.md`).
 */

export type AmazonRecord = {
  /** The `I/<id>` segment of the CDN URL; size suffix is applied at render. */
  imageId?: string;
  priceUsd?: number;
  /** ISO date the price and title were observed. */
  checkedOn?: string;
  /** Listing title at check time, truncated. */
  titleSeen?: string;
};

const CHECKED = "2026-09-12";

export const amazonData: Record<string, AmazonRecord> = {
  "titan-t3-power-rack": {
    imageId: "51GPtq+x9nL",
    priceUsd: 559.99,
    checkedOn: CHECKED,
    titleSeen: "Titan Fitness T-3 Series Black Short Power Rack, 24in Depth",
  },
  "titan-x3-flat-foot-rack": {
    imageId: "51SUnuYW5DL",
    priceUsd: 719.99,
    checkedOn: CHECKED,
    titleSeen: "Titan Fitness X-3 Series Flat Foot Power Rack, 91\" H x 30\" D",
  },
  "hulkfit-power-cage": {
    imageId: "81GZrbvElTL",
    priceUsd: 415.74,
    checkedOn: CHECKED,
    titleSeen: "HulkFit 1000-Pound Capacity Multi-Function Adjustable Power Cage",
  },
  "fitness-reality-810xlt": {
    imageId: "71hfBVFqKNL",
    priceUsd: 359.99,
    checkedOn: CHECKED,
    titleSeen: "Fitness Reality 800 lbs. Capacity Squat Rack Combo with Lat Pull-Down",
  },
  "sportsroyals-cage-lat": {
    imageId: "81lbf+JbCNL",
    checkedOn: CHECKED,
    titleSeen: "Sportsroyals Squat Rack, LAT Power Cage, Multi-Function",
  },
  "titan-folding-rack": {
    imageId: "41OzYA8--iL",
    checkedOn: CHECKED,
    titleSeen: "Titan Fitness T-3 Wall Mounted Folding Power Rack, 91\" x 21\"",
  },
  "titan-t2-squat-stand": {
    imageId: "51CusjWGyDL",
    checkedOn: CHECKED,
    titleSeen: "Titan Fitness T-2 Series Short 71\" Black Power Rack, 850 LB",
  },
  "cap-olympic-bar-7ft": {
    imageId: "61tYbWQSFdL",
    checkedOn: CHECKED,
    titleSeen: "CAP The Beast 7ft Olympic Barbell, Pro Series, 1,200lb Capacity",
  },
  "titan-olympic-bar": {
    imageId: "31spAbRtJ3L",
    checkedOn: CHECKED,
    titleSeen: "Titan Fitness Performance Series 20 KG Power Bar, 1500 LB",
  },
  "cap-trap-bar": {
    imageId: "71V2uqneYBL",
    checkedOn: CHECKED,
    titleSeen: "Cap Barbell Olympic Hex Bar, Trap Bar, Shrug Bar, Combo Grips",
  },
  "titan-safety-squat-bar": {
    imageId: "41OOSosvdDL",
    checkedOn: CHECKED,
    titleSeen: "Titan Fitness Rackable Safety Squat Bar, Olympic Sleeves, 1,500lb",
  },
  "signature-bumper-set-260": {
    imageId: "71B+6603XKL",
    checkedOn: CHECKED,
    titleSeen: "Fitvids 2\" Olympic Bumper Plate Set, 260LB (2x 10/15/25/35/45LB)",
  },
  "yes4all-bumper-set-160": {
    imageId: "71bnLFms9yL",
    checkedOn: CHECKED,
    titleSeen: "Signature Fitness 2\" Olympic Bumper Plate Set, 210LB (2x 25/35/45LB)",
  },
  "cap-cast-iron-set-300": {
    imageId: "71BmLCpUSvL",
    checkedOn: CHECKED,
    titleSeen: "Cap Barbell 300 Pound Olympic Set, Grey",
  },
  "titan-change-plate-set": {
    imageId: "61hLFZj7EJL",
    checkedOn: CHECKED,
    titleSeen: "Titan Fitness 37.5 LB Set Black Change Fractional Weight Plates",
  },
  "bowflex-selecttech-552": {
    imageId: "71bdxVC7-0L",
    checkedOn: CHECKED,
    titleSeen: "BowFlex Results Series 552 SelectTech Single Dumbbell",
  },
  "powerblock-elite-exp-50": {
    imageId: "81yF5CpdlLL",
    checkedOn: CHECKED,
    titleSeen: "PowerBlock Elite EXP Adjustable Dumbbells, Pairs, Stage 1, 5-50 lb",
  },
  "nuobell-adjustable-80": {
    imageId: "71kLcOZsGnL",
    checkedOn: CHECKED,
    titleSeen: "Nuobell 580 Adjustable Dumbbells, 5-80 lb, Set of 2",
  },
  "flybird-adjustable-bench": {
    imageId: "71ijsNeaN-L",
    priceUsd: 149.98,
    checkedOn: CHECKED,
    titleSeen: "FLYBIRD Adjustable Weight Bench",
  },
  "finer-form-fid-bench": {
    imageId: "71mrIjf7-1L",
    priceUsd: 249.99,
    checkedOn: CHECKED,
    titleSeen: "Finer Form Multi-Functional Adjustable FID Weight Bench and Roman Chair",
  },
  "titan-flat-bench": {
    imageId: "41rux21iDTL",
    priceUsd: 275.97,
    checkedOn: CHECKED,
    titleSeen: "Titan Fitness TITAN Series Single Post Flat Bench, Rated 1,200 LB",
  },
  "marcy-preacher-curl-bench": {
    imageId: "71UXW-HWneL",
    priceUsd: 169.99,
    checkedOn: CHECKED,
    titleSeen: "Marcy Adjustable 6 Position Utility Bench with Leg Developer",
  },
  "concept2-rowerg": {
    imageId: "41kmOFvpQoS",
    priceUsd: 990,
    checkedOn: CHECKED,
    titleSeen: "Concept2 RowErg Indoor Rowing Machine - PM5 Monitor",
  },
  "assault-airbike-classic": {
    imageId: "61Pc9f9zVlL",
    priceUsd: 749.99,
    checkedOn: CHECKED,
    titleSeen: "Titan Fitness Steel Fan Bike, Exercise and Cardio Workout Equipment",
  },
  "schwinn-ic4-bike": {
    imageId: "71Y2gX8qNLL",
    priceUsd: 795,
    checkedOn: CHECKED,
    titleSeen: "Schwinn Fitness IC Indoor Cycling Bike Series",
  },
  "nordictrack-t-series-treadmill": {
    imageId: "71fNpFNO5IL",
    priceUsd: 999,
    checkedOn: CHECKED,
    titleSeen: "NordicTrack T Series Treadmills",
  },
  "sunny-sf-rw5515-rower": {
    imageId: "71st4J+uDVL",
    priceUsd: 329.99,
    checkedOn: CHECKED,
    titleSeen: "Sunny Health & Fitness Smart Magnetic Rowing Machine, Extra Long Rail",
  },
  "sunny-sf-b1805-bike": {
    imageId: "81yiTzqRmHL",
    priceUsd: 699.99,
    checkedOn: CHECKED,
    titleSeen: "Sunny Health & Fitness Magnetic Exercise Bike, 44LB Flywheel",
  },
  "marcy-smith-cage-sm4008": {
    imageId: "71qI1Uukb+L",
    priceUsd: 1999.99,
    checkedOn: CHECKED,
    titleSeen: "Marcy Smith Machine Cage System Home Gym Multifunction Rack",
  },
  "valor-bd-62-functional-trainer": {
    imageId: "71Yv3U6IYoL",
    priceUsd: 878.98,
    checkedOn: CHECKED,
    titleSeen: "Valor Fitness Cable Crossover Machine - 17 Adjustable Positions",
  },
  "valor-cb-12-lat-pulldown": {
    imageId: "61EKPYZr5bL",
    priceUsd: 388.98,
    checkedOn: CHECKED,
    titleSeen: "Valor Fitness LAT Pulldown and Low Row Cable Machine",
  },
  "titan-belt-squat": {
    imageId: "515m5S3WoKL",
    priceUsd: 1149.99,
    checkedOn: CHECKED,
    titleSeen: "Titan Fitness Belt Squat Machine, Rated 1,000 LB, Plate-Loaded",
  },
  "titan-ghd": {
    imageId: "51q+0-Q8ddL",
    priceUsd: 626.99,
    checkedOn: CHECKED,
    titleSeen: "Titan Fitness Glute and Ham Developer, Adjustable GHD Machine",
  },
  "marcy-mwm-988-home-gym": {
    imageId: "711U6Yv2UwL",
    priceUsd: 499.99,
    checkedOn: CHECKED,
    titleSeen: "Marcy Home Gym System with 150 lb Weight Stack",
  },
  "rubber-cal-stall-mat-4x6": {
    imageId: "51WPOxLFf0L",
    priceUsd: 165.99,
    checkedOn: CHECKED,
    titleSeen: "DWC Rubber Mat Flooring 4ft x 6ft x 3/4in for Gym or Equine Stall",
  },
  "incstores-rubber-tile-24": {
    imageId: "71AbAjpVGmL",
    priceUsd: 99.99,
    checkedOn: CHECKED,
    titleSeen: "AIRHOP 0.56in Thick 48 Sq Ft Exercise Equipment Mats, 12 Tiles",
  },
  "prosourcefit-rolled-rubber": {
    imageId: "81mKg8HFe8L",
    priceUsd: 134.99,
    checkedOn: CHECKED,
    titleSeen: "Flooring Inc 1/4in Thick Tough Rubber Flooring Roll",
  },
  "gorilla-mats-4x6": {
    imageId: "61bchsIR0UL",
    priceUsd: 159.95,
    checkedOn: CHECKED,
    titleSeen: "Gorilla Mats Large Exercise Mat 6ft x 4ft",
  },
  "balancefrom-foam-tile-24": {
    imageId: "81JAwr9MIvL",
    priceUsd: 49.99,
    checkedOn: CHECKED,
    titleSeen: "ProsourceFit Exercise Puzzle Mat 1/2in EVA Interlocking Foam",
  },
  "yes4all-plate-tree": {
    imageId: "71Nj2i+AaQL",
    priceUsd: 109.14,
    checkedOn: CHECKED,
    titleSeen: "Yes4All 6 Pegs and 4 Barbell Storage Rack, up to 1190 LB",
  },
  "titan-dumbbell-rack-3tier": {
    imageId: "71pcFYgEpcL",
    priceUsd: 139.99,
    checkedOn: CHECKED,
    titleSeen: "CAP 2-Tier and 3-Tier Dumbbell Rack for Home Gym",
  },
  "synergee-vertical-bar-holder": {
    imageId: "713eAXCqacL",
    priceUsd: 149.99,
    checkedOn: CHECKED,
    titleSeen: "Rep Fitness 9 Barbell Rack, Vertical Storage Olympic Bar",
  },
  "titan-wall-bar-holder": {
    imageId: "61p1lGijgcL",
    priceUsd: 39.99,
    checkedOn: CHECKED,
    titleSeen: "Luwint Wall Mounted Horizontal Barbell Holder",
  },
  "amazon-basics-shelving": {
    imageId: "81P3QShndWL",
    priceUsd: 228.17,
    checkedOn: CHECKED,
    titleSeen: "Amazon Basics Heavy Duty 5 Shelf Storage Shelving Unit",
  },
  "yes4all-dip-attachment": {
    imageId: "51h+Zj7TgmL",
    priceUsd: 54.95,
    checkedOn: CHECKED,
    titleSeen: "A2ZCARE Dip Bar Attachment for Squat Rack",
  },
  "titan-plyo-box-3in1": {
    imageId: "71eMWJCKwwL",
    priceUsd: 113.31,
    checkedOn: CHECKED,
    titleSeen: "BalanceFrom 3-in-1 Foam Plyometric Jump Box",
  },
  "yes4all-kettlebell-set": {
    imageId: "71S7fyYDiSL",
    priceUsd: 559.68,
    checkedOn: CHECKED,
    titleSeen: "Ader Sporting Goods Premier Kettlebell Set with Rack",
  },
  "serious-steel-band-set": {
    imageId: "71y-kWwvdhL",
    priceUsd: 19.99,
    checkedOn: CHECKED,
    titleSeen: "LEEKEY Resistance Bands Set for Pull Up Assistance",
  },
  "gym-mirror-48x72": {
    imageId: "41Ax8kpggZL",
    priceUsd: 466.4,
    checkedOn: CHECKED,
    titleSeen: "Fab Glass and Mirror Large Gym Mirror 48x72",
  },
  "vornado-air-circulator": {
    imageId: "816GuNen-fL",
    priceUsd: 79.99,
    checkedOn: CHECKED,
    titleSeen: "Vornado Model 80 High Velocity Box Fan, 20 Inch",
  },
  "cap-hex-pair-40": {
    imageId: "81gnxptnqWL",
    priceUsd: 38.99,
    checkedOn: CHECKED,
    titleSeen: "CAP Rubber Coated Dumbbell Weights",
  },
  "yes4all-adjustable-105": {
    imageId: "61wJEOV3tGL",
    priceUsd: 120.48,
    checkedOn: CHECKED,
    titleSeen: "Yes4All Adjustable Weights Dumbbells Set",
  },
  "fitness-reality-1000-bench": {
    imageId: "71Qqb65dhAL",
    priceUsd: 200.18,
    checkedOn: CHECKED,
    titleSeen: "Fitness Reality 2000 Super Max XL High Capacity Bench",
  },
  "powerline-leg-press": {
    imageId: "71pJZdfXYnL",
    priceUsd: 1735,
    checkedOn: CHECKED,
    titleSeen: "Body-Solid GLPH1100 Leg Press and Hack Squat",
  },
  "titan-cable-tower": {
    imageId: "51JTH9SZ83L",
    priceUsd: 324.99,
    checkedOn: CHECKED,
    titleSeen: "Titan Fitness T-2 Series 71in LAT Pulldown and Low Row",
  },
  "synergee-games-bar": {
    imageId: "61k0omOx8ML",
    priceUsd: 149.95,
    checkedOn: CHECKED,
    titleSeen: "Synergee Games 15kg Colored Womens Black Ceramic Coated Barbell",
  },
  "papababe-ez-curl-bar": {
    imageId: "71ZxUiVIfYL",
    priceUsd: 38,
    checkedOn: CHECKED,
    titleSeen: "CAP 47in Olympic EZ Curl Bar, Heavy Duty Solid Steel, 200 LB",
  },
  "hex-dumbbell-set-5-50-rack": {
    imageId: "71Acc0SFYDL",
    priceUsd: 729.99,
    checkedOn: "2026-09-13",
    titleSeen: "5-50 lbs Hex Dumbbell Weight Set With Rack",
  },
  "hex-dumbbell-set-550-rack": {
    imageId: "71rZvoJK6fL",
    priceUsd: 529,
    checkedOn: "2026-09-13",
    titleSeen: "350/450/550 lbs Hex Weight Dumbbell Set with Rack",
  },
  "signature-hex-pair-50": {
    imageId: "81714LFIRIL",
    priceUsd: 119.99,
    checkedOn: "2026-09-13",
    titleSeen: "Signature Fitness Rubber Coated Hex Dumbbells Hand Weights",
  },
  "hulkfit-hex-pair-heavy": {
    imageId: "81Z9tVEfJbL",
    priceUsd: 112.99,
    checkedOn: "2026-09-13",
    titleSeen: "HulkFit Rubber Coated Hex Dumbbells, Anti-Roll Hand Weights",
  },
  "handbode-hex-pair-100": {
    imageId: "71PaGobLYcL",
    priceUsd: 94.99,
    checkedOn: "2026-09-13",
    titleSeen: "HANDBODE Hex Dumbbell Set of 2, Rubber Encased Fixed Dumbbell",
  },
  "merach-t12-treadmill": {
    imageId: "71Ql9CNyJPL",
    priceUsd: 359.99,
    checkedOn: "2026-09-13",
    titleSeen: "MERACH T12 Foldable Treadmill for Home, 300 LBS Capacity",
  },
  "sunny-auto-incline-treadmill": {
    imageId: "71bTn9MyaYL",
    priceUsd: 1099.99,
    checkedOn: "2026-09-13",
    titleSeen: "Sunny Health & Fitness Smart Wi-Fi Treadmill with Auto Incline",
  },
  "evitrend-incline-treadmill": {
    imageId: "71s3WCdmmFL",
    priceUsd: 139.99,
    checkedOn: "2026-09-13",
    titleSeen: "EviTrend 18% Incline Folding Treadmill for Home, 350 LBS",
  },
  "barwing-bench-press-rack": {
    imageId: "61Nt7k4+VgL",
    priceUsd: 129.99,
    checkedOn: "2026-09-13",
    titleSeen: "BARWING Adjustable Squat Rack, 1250 LB Barbell Stand",
  },
  "yaheetech-bench-press-stand": {
    imageId: "510vGXlcR7S",
    priceUsd: 74.99,
    checkedOn: "2026-09-13",
    titleSeen: "Yaheetech Adjustable Squat Rack Pair, Barbell Bench Press Stand",
  },
};

/** Rendered size for catalog thumbnails; Amazon serves any of these suffixes. */
export function amazonImageUrl(imageId: string, px = 400): string {
  return `https://m.media-amazon.com/images/I/${imageId}._AC_SL${px}_.jpg`;
}

export function amazonRecord(equipmentId: string): AmazonRecord | undefined {
  return amazonData[equipmentId];
}
