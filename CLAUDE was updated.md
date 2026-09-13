# Home Gym Planner — Project Brief

## What we're building
A website where someone enters their room dimensions (optionally uploads a photo), drags gym equipment into a 2D blueprint, previews it in 3D, and buys everything in one click. Phase 1 monetizes through affiliate links (Amazon Associates first; brand-direct programs later). Build the planner as a generic room-layout engine so the same code can power other niches (home office, nursery, home bar) by swapping the catalog.

## Business rules (Phase 1 = affiliate)
- We never take payment for equipment. "Buy this gym" sends the user to Amazon with our Associates tag. Prefer a single multi-item add-to-cart link; fall back to per-item links.
- We DO take payment (Stripe) for digital products only: Pro planner and workout plans. Never gate the buy links behind a paywall.
- Show an affiliate disclosure in the footer and near every buy button.
- Do not hard-code or scrape Amazon prices. Until we have Product Advertising API access, show "Check price on Amazon" or an "est." range we maintain ourselves.
- Every catalog item stores `sourceUrl` and `sourceType` (amazon | brand | dropship) so we can add brand affiliates and drop-shipped products later without a rewrite.

## Stack
- Next.js (App Router) + TypeScript + Tailwind
- 2D planner: react-konva (top-down canvas)
- 3D planner: react-three-fiber + drei (simple box/primitive models first; GLB models later)
- Data: Supabase (Postgres + auth + storage) — Phase 1 can start with a local JSON catalog and add Supabase in Phase 2
- Deploy: Vercel

## Phase 1 scope (build this first)
1. **Landing page** — hero, how-it-works (3 steps), bundle cards, planner CTA, email capture.
2. **Room setup** — width, depth, ceiling height (ft/in and metric), optional photo upload used as a reference thumbnail, optional door/window markers.
3. **2D planner** — drag, drop, rotate (90° snaps), delete, undo/redo, grid snapping, collision warnings, ceiling-clearance warnings (e.g. rack pull-up bar vs ceiling), walkway/clearance zones around items, running total (item count, est. cost, total floor weight).
4. **3D view** — toggle from the same plan; orbit camera; equipment as scaled primitives with labels; floor mats render as a floor texture.
5. **Catalog** — sidebar with search + category filters. Categories: racks, barbells, plates, dumbbells, benches, machines (Smith, functional trainer, lat pulldown, leg press), cardio, flooring, storage, accessories.
6. **Bundles** — Starter, Garage, Advanced, Luxury. Each bundle is a saved plan + item list: "Load into planner" and "Buy all" both work.
7. **Save/share** — plans encoded in the URL for Phase 1 (no login required); Supabase accounts in Phase 2.
8. **Cart page** — item list, quantities, est. total, "Buy on Amazon" (multi-item link), per-item fallback links, affiliate disclosure.

## Equipment data model
```ts
type Equipment = {
  id: string; name: string; brand: string; category: Category;
  widthIn: number; depthIn: number; heightIn: number;   // footprint + height
  clearanceIn?: { front?: number; back?: number; left?: number; right?: number };
  ceilingClearanceIn?: number;                          // e.g. rack + pull-up
  weightLbs: number; estPriceUsd?: number;
  sources: Array<{
    type: "amazon" | "titan" | "rep" | "bellsofsteel" | "brand" | "dropship";
    url: string; asin?: string; priceUsd?: number; commissionPct?: number;
    lastVerified?: string;                              // ISO date; hide if stale
  }>;
  defaultSource?: string;                               // which source to recommend
  imageUrl?: string; modelUrl?: string;
  tags: string[];
};
```
Seed the catalog with ~50 items across all categories using realistic dimensions. Placeholder ASINs/URLs are fine; we will replace them.

## Multi-source buying (build from the start)
- An item can be sold by several stores. Show ONE recommended source per item (the highest-commission source that stocks it) with the alternatives one tap away.
- Cart page groups items by store with one multi-item buy link per store ("Buy 6 items at Titan", "Buy 4 items at Amazon").
- Global "Prefer Amazon" toggle flips every item that exists on Amazon to the Amazon source.
- Never display an Amazon price until we have Product Advertising API access; show "Check price on Amazon". Brand prices can be shown, with a lastVerified date. Hide any source not verified in 14 days.
- Affiliate rates for the margin logic: Amazon ~3%, Titan 5%, REP/Bells of Steel per program. Rogue has no program: link only.

## Design direction
Clean, confident, gym-brand feel: dark charcoal + one bold accent, big type, lots of whitespace. Mobile-first — many users will plan on their phone. No stock-photo clutter.

## Revenue streams (build hooks for every one of these)
Target take rate: 7–10% of equipment spend, i.e. roughly $220–320 per $3,000 build.

1. **Affiliate commissions** (Phase 1) — Amazon Associates (~3% on sports) plus brand-direct programs (REP, Titan, Bells of Steel, Force USA, etc.). Each catalog item carries its own `sourceType`/`sourceUrl`; prefer the higher-paying source when the same item exists on both.
2. **Flooring under our brand** (Phase 2, highest margin) — rubber mats/tiles drop-shipped or private-labeled, 30–40% margin. Planner auto-calculates square footage needed and adds flooring to every plan by default.
3. **Workout plans** (Phase 2) — $12/mo or $79/yr subscription, optional lifetime tier. Plans are generated with the Claude API from the user's exact equipment list + goals + days/week + experience. Free sample plan offered on the cart page. Delivered in a Workouts tab; monthly refresh for subscribers.
4. **Pro planner** (Phase 2) — $15–20 one-time: unlimited saved plans, PDF blueprint export, printable shopping list, photo-backdrop 3D view. Free tier keeps full build + buy.
5. **Assembly referrals** (Phase 1 link, Phase 3 marketplace) — "Add assembly" button linking to TaskRabbit / Amazon assembly; later a request form routed to vetted local pros with a booking fee.
6. **Email list** — capture on plan save and cart; seasonal deal emails (January, Black Friday) with affiliate links.
7. **Featured placement** (later) — brands pay for pinned catalog slots and bundle inclusion. Mark sponsored items clearly.
8. **Planner licensing** (later) — the room-layout engine is niche-agnostic; keep catalog, branding, and pricing in config so it can be white-labeled to retailers or reused for other niches.

Instrument all of it: track plan created, plan completed, cart viewed, affiliate click (by source), assembly click, sample plan requested, subscription started, Pro purchased.

## Non-goals for Phase 1
Photo-to-3D room reconstruction, our own checkout, user accounts, real-time Amazon pricing, drop-ship integrations. Design the code so these can be added without rewriting the planner.

## How to work
Build in this order: catalog data → 2D planner → cart/affiliate links → landing page → 3D view → bundles. Ship something runnable at each step. Keep components small; put planner logic (collision, clearance, snapping) in pure functions with unit tests.
