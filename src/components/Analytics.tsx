"use client";

import { useEffect } from "react";
import { initAnalytics } from "@/lib/analytics";

/**
 * Boots analytics once on the client. Rendered from the root layout so it
 * covers every page, and inert when no PostHog key is configured.
 */
export function Analytics() {
  useEffect(() => {
    initAnalytics();
  }, []);
  return null;
}
