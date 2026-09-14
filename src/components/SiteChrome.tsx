import Link from "next/link";
import { siteConfig } from "@/lib/site.config";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 font-extrabold tracking-tight ${className}`}
    >
      <span
        aria-hidden
        className="grid h-7 w-7 place-items-center rounded-md bg-accent text-white"
      >
        {/* Derived from the brand name so a rename never leaves a stale mark. */}
        <span className="text-sm font-black">{siteConfig.name.charAt(0)}</span>
      </span>
      <span className="text-lg">{siteConfig.name}</span>
    </Link>
  );
}

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header
      className={`sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur ${
        compact ? "" : ""
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link href="/bundles" className="btn-quiet hidden sm:inline-flex">
            Bundles
          </Link>
          <Link href="/cart" className="btn-quiet">
            Cart
          </Link>
          <Link href="/planner" className="btn-accent">
            Open planner
          </Link>
        </nav>
      </div>
    </header>
  );
}

/** Required near every buy button and in the footer. */
export function AffiliateDisclosure({
  variant = "block",
}: {
  variant?: "block" | "inline";
}) {
  if (variant === "inline") {
    return (
      <p className="text-xs leading-relaxed text-ink-500">
        Affiliate links — we may earn a commission at no extra cost to you.{" "}
        <Link href="/disclosure" className="underline hover:text-ink-700">
          Details
        </Link>
      </p>
    );
  }
  return (
    <p className="text-xs leading-relaxed text-ink-500">
      {siteConfig.affiliateDisclosure}{" "}
      <Link href="/disclosure" className="underline hover:text-ink-700">
        Full disclosure
      </Link>
    </p>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Logo />
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-600">
            <Link href="/planner" className="hover:text-ink-900">
              Planner
            </Link>
            <Link href="/bundles" className="hover:text-ink-900">
              Bundles
            </Link>
            <Link href="/cart" className="hover:text-ink-900">
              Cart
            </Link>
            <Link href="/disclosure" className="hover:text-ink-900">
              Affiliate disclosure
            </Link>
            <Link href="/privacy" className="hover:text-ink-900">
              Privacy
            </Link>
          </nav>
        </div>
        <AffiliateDisclosure />
        <p className="text-xs text-ink-400">
          © {new Date().getFullYear()} {siteConfig.name}. Any figure we show is
          our own planning estimate, not the retailer&apos;s price — always
          check the listing before you buy.
        </p>
      </div>
    </footer>
  );
}
