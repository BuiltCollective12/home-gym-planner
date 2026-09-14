# Product sourcing log

Every catalog row was checked by loading its Amazon listing and comparing the
live title against what our row claims. Last verified **2026-09-13**.

Current state: **57 items, 57 real ASINs, 57 images, 57 observed prices, 0
placeholders.** `npm test` enforces this — see `catalog.test.ts`.

## Resolved

### Dead ASINs, replaced
| Catalog id | Dead ASIN | Replaced with |
|---|---|---|
| `papababe-ez-curl-bar` | `B0FV3K8BVB` | `B0BFBVZ8M7` — CAP 47" Olympic EZ Curl Bar. Brand changed papababe → CAP. |
| `cap-cast-iron-set-300` | `B08XB6TZ43` | `B002OP0DLA` — Cap Barbell 300 lb Olympic Set, Grey. |

### ASIN pointed at a different product, row corrected to match
| Catalog id | What we claimed | What the ASIN actually sells | Action |
|---|---|---|---|
| `synergee-games-bar` | Games Barbell 20 kg men's | Games 15 kg **women's** bar | Relabelled; 79" / 33 lb |
| `signature-bumper-set-260` | Brand Signature Fitness | Brand **Fitvids** | Brand corrected |
| `yes4all-bumper-set-160` | Yes4All 160 lb | **Signature Fitness 210 lb** | Name, brand, weight corrected |
| `bowflex-selecttech-552` | 552 pair, 105 lb | 552 **single** dumbbell | Relabelled single, 52.5 lb |

### Not sold on Amazon, substituted
| Catalog id | Original pick | Now |
|---|---|---|
| `assault-airbike-classic` | Assault AirBike Classic | Titan Fitness Steel Fan Bike (`B093HKN7TW`) |
| `marcy-preacher-curl-bench` | Marcy Preacher Curl Bench | Marcy 6-Position Utility Bench w/ Leg Developer (`B00FJ2PL26`) |

### Removed
| Catalog id | Why |
|---|---|
| `synergee-comp-plates-320` | `B0G6CTM1PF` is a single-plate variant parent priced at $12.99, not a 320 lb set. No reliable set ASIN found. Plates keeps four verified options, so it was dropped rather than shipped wrong. |

## Needs your decision

Nothing blocking. Two things worth a look when you have time:

1. **`bowflex-selecttech-552` is a single dumbbell, not a pair.** Amazon variant
   parents make the pair ASIN ambiguous. Most buyers want the pair — worth
   finding the pair ASIN, or leaving it as a single at $250.
2. **`gym-mirror-48x72` costs $466**, far more than the ~$180 I originally
   estimated. Large glass mirrors are expensive to ship. Might be worth a
   cheaper acrylic alternative.

## Why the title check matters

Three of the six mismatches above loaded a perfectly working Amazon page — the
ASIN resolved, the image appeared, nothing looked broken. Only the title
revealed it was the wrong variant. `amazon-data.ts` records `titleSeen` per item
so a future re-check can spot Amazon repointing an ASIN.

## Prices

Observed on the dates in `amazon-data.ts` and used to calibrate our own
estimate. They are **not** live Amazon prices and the UI still says "est." —
displaying an Amazon price requires PA-API with a timestamp under the Associates
agreement. A test fails the build if any estimate drifts more than 15% from the
last observed price.

---

## Availability sweep — 2026-09-13

Triggered by a real logged-in cart test: five bundle items were sent to Amazon
and three came back **"currently unavailable"**. The multi-item cart link itself
worked (quantities were correct), so the mechanic was fine — the products were
not.

I probed all 86 ASINs for `#add-to-cart-button` on `/dp/<asin>`. **6 were dead.**
Every one of them was in the first 20 rows sourced, and everything sourced later
was clean — the failure was age, not method.

The trap: a dead listing still renders a normal-looking product page with a
photo and a price. Only the missing add-to-cart button gives it away, and a
multi-item cart link **silently drops** the item rather than erroring.

| Dead ASIN | Was | Replaced with | New ASIN |
|---|---|---|---|
| `B09FVQTZZG` | Titan X-3 Flat Foot Rack | Titan X-3 Tall Bolt-Down, 36" | `B09GXCR79J` |
| `B07PVDCMJZ` | Fitness Reality 810XLT | Sunny Health Full Size Power Cage | `B08B8Z6BZK` |
| `B0CHLNLJF3` | Fitvids 260 lb bumper set | CAP 260 lb Economy bumper set | `B0DHYNHYJD` |
| `B0BZWY8Z2D` | Signature 210 lb bumper set | HULKFIT 160 lb bumper set | `B0H5VXVYWB` |
| `B083R4RMTH` | CAP Hex Trap Bar | CAP Trap & Shrug Bar, elevated grip | `B083R4NYC4` |
| `B09D12QXYM` | Titan Safety Squat Bar | Titan TITAN Series SSB, 5" camber | `B0DDM6PTRV` |

Four of the six sat inside bundles, which is why the cart test failed so visibly.
`plates` was down to two live options, below the three-per-category floor the
catalog test enforces.

Every replacement was checked for **variation parents** as well as stock. A
variation parent ("Multiple Colors, 100–370 lbs") has a working add-to-cart
button on the page but needs a child selection, so it can fail a direct cart
add. All six replacements are single-offer listings.

### Prices moved a lot

Two replacements are far cheaper than what they replaced — the trap bar went
$200 → $70 and the 260 lb bumper set $500 → $260. The old estimates were
calibrated against listings that have since died, so these are corrections, not
discounts. The safety squat bar went the other way, $330 → $460.

### Still open

- **`B0B35ZF8XC`** (CAP The Beast barbell) failed the live cart add, but every
  signal I can read says it is healthy: add-to-cart present, "In Stock", no
  variations. Testing the cart endpoint directly needs a signed-in session.
  **Retest this one specifically on the next cart run.**
- No availability field exists in the data yet, so stock churn is invisible
  until someone tries to buy. This sweep should be repeated — monthly is
  probably right, given 6 of 86 died in roughly two days of catalog age.
