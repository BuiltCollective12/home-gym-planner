/**
 * Everything niche- or brand-specific lives here so the planner engine can be
 * white-labelled (brief: "Planner licensing") without touching components.
 */
export const siteConfig = {
  name: "RackSpace",
  tagline: "Plan your home gym. Buy it in one click.",
  domain: "rackspace.fit",
  /**
   * Canonical origin, used for sitemap/robots and social cards. Vercel sets
   * NEXT_PUBLIC_SITE_URL for us; set it to the custom domain once one is
   * pointed at the deployment.
   */
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : "http://localhost:3000"),
  /**
   * COMPLIANCE SWITCHES — both flip to true only once Amazon Product
   * Advertising API access is granted (an approved Associates account plus
   * three qualifying sales). Until then the Associates Operating Agreement
   * does not license us to display Amazon's product imagery or quote their
   * prices, so the site uses our own renders and sends people to the listing
   * to see the price.
   */
  useAmazonImagery: false,
  showItemPrices: false,

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
