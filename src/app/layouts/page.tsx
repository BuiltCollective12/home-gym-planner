import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { getEquipment } from "@/lib/catalog";
import { layouts } from "@/lib/layouts";
import { computeTotals } from "@/lib/planner/totals";
import { encodePlan } from "@/lib/planner/plan-url";
import { siteConfig } from "@/lib/site.config";

export const metadata: Metadata = {
  title: "Home Gym Layouts by Room Size",
  description:
    "Worked home gym layouts for the rooms people actually have — 10x10, single and double garages, spare bedrooms, basements and low ceilings. Free, no signup.",
  alternates: { canonical: `${siteConfig.url}/layouts` },
};

const money = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

export default function LayoutsIndexPage() {
  const rows = layouts
    .map((layout) => ({
      layout,
      totals: computeTotals(
        layout.plan.items,
        layout.plan.room,
        getEquipment,
      ),
      href: `/planner#p=${encodePlan(layout.plan)}`,
    }))
    .sort((a, b) => a.layout.sqft - b.layout.sqft);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Home gym layouts by room size
          </h1>
          <p className="mt-3 text-lg text-ink-600">
            Every layout below is a real plan — checked for overlaps, walkways
            and ceiling clearance by the same engine that runs the planner. Find
            the room closest to yours, then change anything you like.
          </p>
        </div>

        <ul className="mt-10 space-y-4">
          {rows.map(({ layout, totals }) => (
            <li key={layout.slug}>
              <Link
                href={`/layouts/${layout.slug}`}
                className="card block p-6 hover:border-ink-300"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h2 className="text-xl font-bold">{layout.h1}</h2>
                  <span className="text-sm font-semibold text-ink-500">
                    {layout.roomLabel} · {layout.sqft} sq ft
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-ink-600">{layout.intro}</p>
                <p className="mt-3 text-sm text-ink-500">
                  {totals.itemCount} pieces · about {money(totals.estCostUsd)} ·{" "}
                  {Math.round(layout.plan.room.ceilingHeightIn / 12)} ft ceiling
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <div className="card mt-10 flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h2 className="text-lg font-bold">Your room is a different size?</h2>
            <p className="mt-1 text-sm text-ink-600">
              Enter your own measurements and build it from scratch. Takes a
              couple of minutes.
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
