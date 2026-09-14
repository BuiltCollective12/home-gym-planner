import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site.config";
import { layouts } from "@/lib/layouts";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (
    path: string,
    priority: number,
    changeFrequency: "daily" | "weekly" | "monthly",
  ) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });

  return [
    page("", 1, "weekly"),
    page("/planner", 0.9, "weekly"),
    page("/bundles", 0.8, "weekly"),
    page("/layouts", 0.8, "weekly"),
    // The room-size pages are the ones built to be found by search, so they
    // rank above the utility routes here.
    ...layouts.map((l) => page(`/layouts/${l.slug}`, 0.7, "monthly")),
    page("/cart", 0.3, "monthly"),
    page("/disclosure", 0.2, "monthly"),
    page("/privacy", 0.2, "monthly"),
  ];
}
