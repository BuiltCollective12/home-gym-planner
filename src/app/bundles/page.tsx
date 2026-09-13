import type { Metadata } from "next";
import Link from "next/link";
import { BundleCard } from "@/components/BundleCard";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { bundles } from "@/lib/bundles";

export const metadata: Metadata = {
  title: "Bundles",
  description:
    "Four complete home gyms, from a spare-bedroom starter to a full dedicated room. Load any of them into the planner or buy the whole thing in one click.",
};

export default function BundlesPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Four gyms, already figured out
          </h1>
          <p className="mt-3 text-lg text-ink-600">
            Every bundle is a real layout — measured, checked for clearances and
            ceiling height, and priced. Load one into the planner and change
            anything, or buy it as it stands.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {bundles.map((bundle) => (
            <BundleCard key={bundle.id} bundle={bundle} />
          ))}
        </div>

        <div className="card mt-10 flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h2 className="text-lg font-bold">None of these fit your room?</h2>
            <p className="mt-1 text-sm text-ink-600">
              Start from your own measurements and build it piece by piece.
            </p>
          </div>
          <Link href="/planner" className="btn-accent">
            Open the planner
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
