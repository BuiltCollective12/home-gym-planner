import type { Metadata } from "next";
import Link from "next/link";
import { BundleCard } from "@/components/BundleCard";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { bundles } from "@/lib/bundles";

export const metadata: Metadata = {
  title: "Bundles",
  description:
    "Complete home gyms by budget and by training style — powerlifting, bodybuilding, cardio, beginner, mobility and apartment-friendly. Load any into the planner or buy it in one click.",
};

export default function BundlesPage() {
  // Two different questions, so two different sections: how much do I want to
  // spend, and what do I actually train. A single grid of ten answers neither.
  const tiers = bundles.filter((b) => b.kind === "tier");
  const niches = bundles.filter((b) => b.kind === "niche");

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Gyms, already figured out
          </h1>
          <p className="mt-3 text-lg text-ink-600">
            Every bundle is a real layout — measured, checked for clearances and
            ceiling height, and priced. Load one into the planner and change
            anything, or buy it as it stands.
          </p>
        </div>

        {/* ------------------------------------------------------- by budget */}
        <section className="mt-12">
          <h2 className="text-2xl font-black tracking-tight">By budget</h2>
          <p className="mt-1 text-ink-600">
            The same gym, four sizes. Each one is a complete build on its own.
          </p>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {tiers.map((bundle) => (
              <BundleCard key={bundle.id} bundle={bundle} />
            ))}
          </div>
        </section>

        {/* -------------------------------------------------------- by style */}
        <section className="mt-16">
          <h2 className="text-2xl font-black tracking-tight">
            By what you train
          </h2>
          <p className="mt-1 text-ink-600">
            Built around a training style instead of a price. Some have no
            barbell at all — that is deliberate.
          </p>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {niches.map((bundle) => (
              <BundleCard key={bundle.id} bundle={bundle} />
            ))}
          </div>
        </section>

        <div className="card mt-16 flex flex-wrap items-center justify-between gap-4 p-6">
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
