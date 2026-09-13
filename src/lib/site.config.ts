/**
 * Everything niche- or brand-specific lives here so the planner engine can be
 * white-labelled (brief: "Planner licensing") without touching components.
 */
export const siteConfig = {
  name: "RackSpace",
  tagline: "Plan your home gym. Buy it in one click.",
  domain: "rackspace.fit",
  /** Amazon Associates tag. Replace with the real one before launch. */
  amazonTag: process.env.NEXT_PUBLIC_AMAZON_TAG ?? "homegymplan-20",
  amazonDomain: "www.amazon.com",
  affiliateDisclosure:
    "As an Amazon Associate we earn from qualifying purchases. Links to Amazon and equipment brands on this site are affiliate links — you pay the same price, and we may earn a commission.",
  /** Room defaults, inches. A one-car garage. */
  defaultRoom: {
    widthIn: 12 * 12,
    depthIn: 20 * 12,
    ceilingHeightIn: 8 * 12,
  },
  /** Planner grid, inches. */
  gridIn: 6,
  /** Assembly-referral partner (revenue stream 5). */
  assemblyUrl: "https://www.taskrabbit.com/services/furniture-assembly",
  /** Phase 2 price points, surfaced as upsells today. */
  pricing: {
    proOneTimeUsd: 19,
    workoutsMonthlyUsd: 12,
    workoutsYearlyUsd: 79,
  },
} as const;

export type SiteConfig = typeof siteConfig;
