import type { Metadata, Viewport } from "next";
import { siteConfig } from "@/lib/site.config";
import { Analytics } from "@/components/Analytics";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.name}`,
  },
  description:
    "Enter your room size, drag in racks, benches and cardio, check clearances, then buy the whole gym in one click.",
};

export const viewport: Viewport = {
  themeColor: "#0A0A0C",
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
        <Analytics />
      </body>
    </html>
  );
}
