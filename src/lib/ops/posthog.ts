import { failed, getJson, ok, unconfigured, type Panel } from "./types";

/**
 * Traffic and the affiliate funnel.
 *
 * This is the money panel. Amazon will not tell us how many people clicked
 * through — only whether an order eventually happened — so click counts have to
 * come from our own instrumentation. Conversion rate is inferred by pairing
 * these numbers with the Associates dashboard by hand.
 *
 * Queried through PostHog's HogQL endpoint rather than pulling raw events, so
 * the aggregation happens their side.
 */

export type Traffic = {
  days: number;
  pageviews: number;
  visitors: number;
  affiliateClicks: number;
  plansStarted: number;
  cartsViewed: number;
  emailsCaptured: number;
  topPages: Array<{ path: string; views: number }>;
  topProducts: Array<{ id: string; clicks: number }>;
  referrers: Array<{ source: string; visits: number }>;
};

type QueryResult = { results: unknown[][] };

const DAYS = 7;

async function hogql(query: string): Promise<unknown[][]> {
  const key = process.env.POSTHOG_API_KEY!;
  const project = process.env.POSTHOG_PROJECT_ID!;
  const host = process.env.POSTHOG_HOST ?? "https://us.posthog.com";

  const json = await getJson<QueryResult>(
    `${host}/api/projects/${project}/query/`,
    {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    {
      method: "POST",
      body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
    },
  );
  return json.results ?? [];
}

const countOf = (event: string) => `
  SELECT count()
  FROM events
  WHERE event = '${event}' AND timestamp > now() - INTERVAL ${DAYS} DAY
`;

export async function fetchTraffic(): Promise<Panel<Traffic>> {
  const missing: string[] = [];
  if (!process.env.POSTHOG_API_KEY) missing.push("POSTHOG_API_KEY");
  if (!process.env.POSTHOG_PROJECT_ID) missing.push("POSTHOG_PROJECT_ID");
  if (missing.length) return unconfigured<Traffic>(...missing);

  try {
    const [
      pageviews,
      visitors,
      affiliate,
      plans,
      carts,
      emails,
      pages,
      products,
      referrers,
    ] = await Promise.all([
      hogql(countOf("$pageview")),
      hogql(`
        SELECT count(DISTINCT person_id)
        FROM events
        WHERE timestamp > now() - INTERVAL ${DAYS} DAY
      `),
      hogql(countOf("affiliate_click")),
      hogql(countOf("plan_created")),
      hogql(countOf("cart_viewed")),
      hogql(countOf("email_captured")),
      hogql(`
        SELECT properties.$pathname AS path, count() AS views
        FROM events
        WHERE event = '$pageview' AND timestamp > now() - INTERVAL ${DAYS} DAY
        GROUP BY path ORDER BY views DESC LIMIT 8
      `),
      hogql(`
        SELECT properties.equipmentId AS id, count() AS clicks
        FROM events
        WHERE event = 'affiliate_click'
          AND timestamp > now() - INTERVAL ${DAYS} DAY
          AND properties.equipmentId IS NOT NULL
        GROUP BY id ORDER BY clicks DESC LIMIT 8
      `),
      hogql(`
        SELECT properties.$referring_domain AS source, count() AS visits
        FROM events
        WHERE event = '$pageview' AND timestamp > now() - INTERVAL ${DAYS} DAY
        GROUP BY source ORDER BY visits DESC LIMIT 8
      `),
    ]);

    const num = (rows: unknown[][]) => Number(rows[0]?.[0] ?? 0);

    return ok({
      days: DAYS,
      pageviews: num(pageviews),
      visitors: num(visitors),
      affiliateClicks: num(affiliate),
      plansStarted: num(plans),
      cartsViewed: num(carts),
      emailsCaptured: num(emails),
      topPages: pages.map((r) => ({
        path: String(r[0] ?? "/"),
        views: Number(r[1] ?? 0),
      })),
      topProducts: products.map((r) => ({
        id: String(r[0] ?? ""),
        clicks: Number(r[1] ?? 0),
      })),
      referrers: referrers.map((r) => ({
        source: String(r[0] || "direct"),
        visits: Number(r[1] ?? 0),
      })),
    });
  } catch (e) {
    return failed<Traffic>(e);
  }
}
