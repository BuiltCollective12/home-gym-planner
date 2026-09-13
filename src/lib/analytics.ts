/**
 * Analytics shim.
 *
 * The brief asks for every revenue moment to be instrumented from day one. This
 * pushes typed events to `window.dataLayer` (and logs them in dev); swapping in
 * PostHog/GA4/Plausible later means changing only `track`.
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

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function track(event: AnalyticsEvent): void {
  const { name, ...props } = event;
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event: name, ...props });
  if (process.env.NODE_ENV !== "production") {
    console.debug("[analytics]", name, props);
  }
}
