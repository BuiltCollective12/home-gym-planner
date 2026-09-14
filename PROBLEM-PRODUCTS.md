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

## The audit is now a command

```
npm run check:availability
```

Fetches every catalog ASIN, reports `ok` / `DEAD` / `unchecked`, warns when a
category would drop below three live options, flags titles that have drifted
far enough to suggest a repointed ASIN, writes `availability-report.json`, and
exits non-zero if anything is dead.

Two things it deliberately does not do:

- **It never calls a blocked fetch a delisting.** Amazon serves captcha and
  throttle pages with no cart button on them. Treating those as dead products
  would have us tearing working items out of the catalog. Anything that is not
  recognisably a product page is reported as `unchecked` and left alone.
- **It does not match on the bare string `add-to-cart-button`.** That appears
  in inline scripts on every page, dead ones included. The discriminator is
  `id="add-to-cart-button"`.

Title drift is compared by token overlap rather than literally, because Amazon
rewrites titles constantly — dropping the brand prefix, appending a paragraph
of keywords, swapping "and" for "&" — and the served HTML is entity-encoded. A
literal comparison flagged ten of eighty-six on the first run, all noise.

**Run it monthly.** Six of the first 86 died within days of being sourced.

### Full sweep, 2026-09-13

All 86 live, which independently confirms the manual browser audit above and
the six replacements. One title had been rewritten (`titan-t3-power-rack`) —
same rack, new listing copy — and the recorded title was updated to match.

---

## Variation parents — the real cause of the half-empty cart

The cart test that started all this had one item that made no sense: the CAP
Beast barbell (`B0B35ZF8XC`) showed **In Stock**, had an add-to-cart button, and
still failed to reach the cart. Availability was never the problem.

`B0B35ZF8XC` is a **variation parent**.

When a product comes in sizes or colours, Amazon creates one ASIN per variant —
the *children* — plus a *parent* ASIN whose page exists only to render the
picker. The parent looks completely normal: title, photo, price, add-to-cart
button. But no variant is selected, so the multi-item cart endpoint has nothing
concrete to add and **drops it silently**.

Two rows in the catalog were parents:

| Row | Was (parent) | Now (child) | Family |
|---|---|---|---|
| `cap-olympic-bar-7ft` | `B0B35ZF8XC` | `B09Z1BXM53` | The Boss / The Rebel / Black-Chrome |
| `nuobell-adjustable-80` | `B0CM9VR4CL` | `B0BB8D5VTW` | Tactical Green / Total Black / Black-Silver |

### How to tell, reliably

Checking the page for a twister element does **not** work. Amazon has several
markups for the picker (`#twister`, `#variation_*`, `inline-twister-*`) and a
check written against one silently passes the others — that is how these two
got through the screen when the six replacements were sourced.

The reliable test is in the page's own data:

```
"currentAsin":"B09Z1BXM53"    <- what the page actually resolved to
"parentAsin":"B0B35ZF8XC"
```

**If `currentAsin` differs from the ASIN you requested, you are on a parent** —
or on something Amazon redirected, which is just as bad. If it matches, that
exact ASIN is what a cart link adds, and it does not matter whether the product
also has variants.

`parentAsin === your ASIN` is *not* a usable signal on its own: Amazon sets it
to the item's own ASIN on plenty of standalone products, and it flagged a box of
chalk with no variations at all.

`npm run check:availability` now reports redirects for the whole catalog.

### Reading the variation family

When a row does turn out to be a parent, the children and their labels are in
the page as `dimensionValuesDisplayData`, which is how the correct child was
picked in both cases above:

```json
{"B009SGRAMS":["25-Pound","Red/Black"], "B08XRVBF8F":["25-Pound","Blue/Black"], ...}
```

### Throttling

Running the audit twice in quick succession got 59 of 93 requests throttled.
They were reported as **unchecked**, not dead — which is the whole point of that
distinction. The script now runs 2 workers at 1.4s intervals. If a run comes
back with a large unchecked count, wait and re-run rather than acting on it.

### Four more parents found by the catalog-wide sweep

Adding redirect detection to the audit immediately turned up four more, two of
them sitting inside bundles:

| Row | Was (parent) | Now (child) |
|---|---|---|
| `titan-t3-power-rack` | `B0CQPCXJ3M` | `B0964RMBNY` |
| `sportsroyals-cage-lat` | `B0CZF39S2S` | `B0CPP4L531` |
| `synergee-games-bar` | `B0CTRNZ9XC` | `B07NZ6PK8F` |
| `bowflex-selecttech-552` | `B0G6Z84TQM` | `B0G1V685WC` |

Every one resolved to exactly the product the row describes — same title, same
image id — so these are pure parent-to-child swaps with no change to what the
buyer gets. **Six parent ASINs total across the catalog**, all of which passed
every availability check because availability was never the problem.

A test in `catalog.test.ts` now names all six so re-adding one fails the build
rather than quietly costing a sale.

`bowflex-selecttech-552` also had its estimate corrected from $250 to $200: the
child listing is $199.99 and the old figure had drifted 25% above it. It remains
a **single** dumbbell, not a pair — still worth revisiting.

### Sweep status

The full run finished with **42 checked clean, 0 dead, 51 unchecked** — Amazon
throttled the rest after a heavy day of requests. Nothing in the unchecked set
is known to be wrong; it simply has not been looked at. **Re-run
`npm run check:availability` on a quiet day** to clear the remainder, especially
for redirects, since only the 42 that responded were tested for that.

---

## Full product audit — 2026-09-14

Two passes, one offline and one against the live listings.

### Offline: does each row agree with itself?

Most product names state their own facts — `Olympic Bumper Plate Set — 260 lb`,
`Extra-Thick Yoga Mat (72" × 24" × 1")`. That makes the name a second,
independent source for the same numbers, so a disagreement is a bug in one of
them. `catalog-consistency.test.ts` now enforces this, plus density and
per-category weight bands.

Found: **`titan-change-plate-set` was named "25 lb" and weighed 37.5.** The
listing title confirms it is a 37.5 lb set, so the name was wrong. Fixed.

Documented exceptions live in the test rather than being silently skipped —
multi-tile packs whose name gives one tile, rope and strip lengths that are not
footprints, and racks whose name gives internal depth while the row gives the
external one. Each has to be justified in writing to be allowed through.

### Online: does each row still match its listing?

`npm run verify:products` — checks title, price, weight, dimensions and
redirects for all 93. **92 checked, 1 throttled, 3 flagged:**

| Row | Problem | Fix |
|---|---|---|
| `cap-cast-iron-set-300` | variation parent | `B002OP0DLA` → `B002OP1Z44` |
| `titan-change-plate-set` | est $130 vs $161.99 | est → $162 |
| `freepear-party-speaker` | est $150 vs $199.99 | est → $200 |

**Nine variation parents found in total.**

The speaker is not an error — it was $149.99 on 2026-09-13 and $199.99 the next
day. Amazon prices move that fast, which is the whole reason the UI says "est."
and never quotes a live figure.

All three had **no recorded `priceUsd`**, which is exactly why the 15% drift
test could not catch them and a network sweep had to. They have one now.

### What this audit cannot tell you

Amazon's "Product Dimensions" is usually the **shipping carton**, not the
assembled item — a power rack ships as a box of tubes. So the dimension check is
weak evidence, and a clean run does **not** mean every footprint is verified.
Our numbers are assembled sizes and are frequently right where Amazon's are
useless. Treat a dimension flag as a prompt to go and look, never as proof.

Assembled dimensions still ultimately need a human against the manufacturer's
spec sheet. The offline name-vs-fields check is the better guard, because it
compares two things we control.
