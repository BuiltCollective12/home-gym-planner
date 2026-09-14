import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site.config";

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
    page("/cart", 0.3, "monthly"),
    page("/disclosure", 0.2, "monthly"),
    page("/privacy", 0.2, "monthly"),
  ];
}
