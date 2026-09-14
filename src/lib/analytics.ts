/**
 * Analytics.
 *
 * Every revenue moment in the brief is instrumented, because the only numbers
 * that matter early are click-through and conversion rate — and you cannot
 * extrapolate from numbers you never collected.
 *
 * PostHog is the sink, wired behind `NEXT_PUBLIC_POSTHOG_KEY`. With no key set
 * (local development, or before signup) everything here is inert apart from a
 * console line, so nothing breaks and no events leak.
 *
 * The library is imported dynamically rather than at module scope: this file is
 * pulled in by most components, and a static import drags ~90 kB into the
 * landing page bundle — the one page where load time actually costs money.
 * Events fired before it finishes loading are queued, not dropped.
 */

export type AnalyticsEvent =
  | { name: "plan_created"; roomSqft: number }
  | { name: "plan_item_added"; equipmentId: string; category: string }
  | { name: "plan_completed"; itemCount: number; estCostUsd: number }
  | { name: "plan_shared"; itemCount: number }
  | { name: "cart_viewed"; itemCount: number; estCostUsd: number }
  | {
      name: "affiliate_click";
      source: "amazon" | "brand" | "dropship";
      equipmentId?: string;
      multiItem?: boolean;
      itemCount?: number;
    }
  | { name: "assembly_click"; estCostUsd: number }
  | { name: "sample_plan_requested"; itemCount: number }
  | { name: "subscription_started"; planId: string }
  | { name: "pro_purchased"; priceUsd: number }
  | { name: "email_captured"; placement: "landing" | "planner" | "cart" }
  | { name: "bundle_loaded"; bundleId: string }
  | { name: "bundle_buy_all"; bundleId: string; estCostUsd: number }
  | { name: "view_toggled"; view: "2d" | "3d" };

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

type Client = { capture: (name: string, props?: object) => void };

let client: Client | null = null;
let loading: Promise<void> | null = null;
/** Events fired before the library finished loading. */
const queue: AnalyticsEvent[] = [];

/** Called once from the app shell. Safe to call repeatedly. */
export function initAnalytics(): void {
  if (loading || client || typeof window === "undefined" || !KEY) return;

  loading = import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(KEY, {
        api_host: HOST,
        capture_pageview: true,
        capture_pageleave: true,
        // No profiles for people who never identify themselves — this site has
        // no accounts, and the privacy policy says we do not build profiles.
        person_profiles: "identified_only",
        autocapture: false,
      });
      client = posthog;
      for (const event of queue.splice(0)) send(event);
    })
    .catch(() => {
      // An ad blocker or a network failure must never break the planner.
    });
}

function send(event: AnalyticsEvent) {
  const { name, ...props } = event;
  client?.capture(name, props);
}

export function track(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return;

  if (!KEY) {
    if (process.env.NODE_ENV !== "production") {
      const { name, ...props } = event;
      console.debug("[analytics]", name, props);
    }
    return;
  }

  if (client) send(event);
  else {
    queue.push(event);
    // A click can happen before the shell effect runs; make sure load started.
    initAnalytics();
  }
}
