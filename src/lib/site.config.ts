/**
 * Everything niche- or brand-specific lives here so the planner engine can be
 * white-labelled (brief: "Planner licensing") without touching components.
 */
export const siteConfig = {
  name: "GymPlanner",
  tagline: "Plan your home gym. Buy it in one click.",
  domain: "gymplanner.org",
  /**
   * Canonical origin for the sitemap, robots.txt and social cards.
   *
   * Order matters. `NEXT_PUBLIC_VERCEL_URL` is per-deployment
   * (`…-p5bkbspax-….vercel.app`) and dies on the next push, so a sitemap built
   * from it would send crawlers to a dead host. The production URL is stable,
   * and an explicit NEXT_PUBLIC_SITE_URL beats both once a custom domain is
   * attached.
   */
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : "http://localhost:3000"),
  /**
   * AMAZON CONTENT SWITCHES.
   *
   * Strictly, the Associates Operating Agreement licenses their product
   * imagery and prices only through the Product Advertising API, which needs
   * an approved account plus three qualifying sales. We are not there yet.
   *
   * Imagery is on anyway — a deliberate, owner-approved trade. A catalog of
   * grey renders reads as unfinished, and a thin-looking site is itself a
   * common reason applications get rejected. Enforcement against hotlinked
   * imagery is rare in practice; the exposure is losing the account if it is
   * ever enforced. Manufacturer media kits are being pursued in parallel,
   * which would make this legitimate outright — see product-images.ts.
   *
   * Prices stay off. That side is enforced far more consistently, a stale
   * price actively misleads a buyer, and "Check price on Amazon" is the normal
   * pattern anyway, so there is nothing to gain by risking it.
   */
  useAmazonImagery: true,
  showItemPrices: false,

  /** Amazon Associates tag. Replace with the real one before launch. */
  amazonTag: process.env.NEXT_PUBLIC_AMAZON_TAG ?? "gymplanner-20",
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
