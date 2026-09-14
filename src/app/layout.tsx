import type { Metadata, Viewport } from "next";
import { siteConfig } from "@/lib/site.config";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { Analytics } from "@/components/Analytics";
import "./globals.css";

const DESCRIPTION =
  "Free home gym layout planner. Enter your room size, drag in racks, benches and cardio at real dimensions, and get warned before you buy something that will not fit.";

export const metadata: Metadata = {
  // Makes every relative URL below resolve absolutely — required for link
  // previews on Reddit, iMessage, Discord and the rest.
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: DESCRIPTION,
  applicationName: siteConfig.name,
  keywords: [
    "home gym planner",
    "garage gym layout",
    "home gym layout tool",
    "will a power rack fit",
    "gym room planner",
    "power rack ceiling height",
  ],
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: DESCRIPTION,
    url: siteConfig.url,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
  /*
   * Search Console ownership. Belt and braces: the HTML file at
   * public/googlee3a263398d8ad029.html verifies on its own, and this meta tag
   * is the same claim by a second route — so verification survives the file
   * being moved or a future host that does not serve public/ at the root.
   * Google accepts either.
   */
  verification: {
    google: "BECwVCHuMqqAqgmHP2upadtnOKg0w0oOHMX1nbBaAt4",
  },
};

export const viewport: Viewport = {
  // Matches the light page background, not the old dark theme.
  themeColor: "#F5F5F7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-paper text-ink-900 antialiased">
        {children}
        {/*
          Two analytics, deliberately. Vercel Analytics gives pageviews and Web
          Vitals in the deploy dashboard with no configuration; PostHog carries
          the funnel events — affiliate clicks, plans started, carts — which are
          the numbers that say whether this earns.
        */}
        <VercelAnalytics />
        <Analytics />
      </body>
    </html>
  );
}
