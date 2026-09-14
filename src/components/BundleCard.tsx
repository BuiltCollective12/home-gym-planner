"use client";

import Link from "next/link";
import { siteConfig } from "@/lib/site.config";
import { useMemo } from "react";
import type { Bundle } from "@/lib/bundles";
import { getEquipment } from "@/lib/catalog";
import { computeTotals, toCartLines } from "@/lib/planner/totals";
import { encodePlan } from "@/lib/planner/plan-url";
import { buildAmazonCartUrls, amazonBatchSizes } from "@/lib/affiliate";
import { track } from "@/lib/analytics";
import { formatUsd, formatWeight } from "@/lib/units";
import { EquipmentThumb } from "./EquipmentThumb";
import { AffiliateDisclosure } from "./SiteChrome";

/**
 * A bundle is a saved plan, so both actions reuse machinery that already
 * exists: "Load into planner" hands the plan over in the URL exactly like a
 * shared link, and "Buy all" builds the same batched Amazon cart the cart page
 * uses.
 */
export function BundleCard({ bundle }: { bundle: Bundle }) {
  const { plan } = bundle;

  const totals = useMemo(
    () => computeTotals(plan.items, plan.room, getEquipment),
    [plan],
  );
  const lines = useMemo(() => toCartLines(plan.items, getEquipment), [plan]);
  const cartUrls = useMemo(() => buildAmazonCartUrls(lines), [lines]);
  const batchSizes = useMemo(() => amazonBatchSizes(lines), [lines]);
  const plannerHref = useMemo(() => `/planner#p=${encodePlan(plan)}`, [plan]);

  const units = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <article className="card flex flex-col overflow-hidden">
      <header className="border-b border-line p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-2xl font-black tracking-tight">{bundle.name}</h2>
          <p className="text-right">
            <span className="block text-xs text-ink-500">est.</span>
            <span className="text-xl font-bold tabular-nums">
              {formatUsd(totals.estCostUsd)}
            </span>
          </p>
        </div>
        <p className="mt-1 text-sm text-ink-600">{bundle.tagline}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="chip">{bundle.roomLabel}</span>
          <span className="chip">{units} items</span>
          <span className="chip">
            {formatWeight(totals.totalWeightLbs, "imperial")}
          </span>
        </div>
      </header>

      <div className="flex-1 space-y-4 p-5">
        <p className="text-sm text-ink-600">{bundle.bestFor}</p>

        <ul className="space-y-1.5">
          {bundle.highlights.map((h) => (
            <li key={h} className="flex gap-2 text-sm text-ink-700">
              <span aria-hidden className="text-accent">
                ✓
              </span>
              {h}
            </li>
          ))}
        </ul>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-ink-500">
            What&apos;s in it
          </h3>
          <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
            {lines.map((line) => (
              <li
                key={line.equipment.id}
                className="flex items-center gap-3 px-3 py-2"
              >
                <EquipmentThumb equipment={line.equipment} size={36} />
                <span className="min-w-0 flex-1 truncate text-sm text-ink-800">
                  {line.equipment.name}
                  {line.quantity > 1 && (
                    <span className="text-ink-500"> × {line.quantity}</span>
                  )}
                </span>
                {siteConfig.showItemPrices &&
                  typeof line.equipment.estPriceUsd === "number" && (
                    <span className="shrink-0 text-xs tabular-nums text-ink-500">
                      {formatUsd(line.equipment.estPriceUsd * line.quantity)}
                    </span>
                  )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <footer className="space-y-2 border-t border-line p-5">
        {cartUrls.map((url, i) => (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="nofollow sponsored noopener"
            className={i === 0 ? "btn-accent w-full" : "btn-ghost w-full"}
            onClick={() => {
              track({
                name: "bundle_buy_all",
                bundleId: bundle.id,
                estCostUsd: Math.round(totals.estCostUsd),
              });
              track({
                name: "affiliate_click",
                source: "amazon",
                multiItem: true,
                itemCount: batchSizes[i],
              });
            }}
          >
            {cartUrls.length === 1
              ? `Buy all ${units} on Amazon`
              : i === 0
                ? `Buy the first ${batchSizes[i]} on Amazon`
                : `Then the last ${batchSizes[i]}`}
          </a>
        ))}

        <Link
          href={plannerHref}
          className="btn-ghost w-full"
          onClick={() => track({ name: "bundle_loaded", bundleId: bundle.id })}
        >
          Load into planner
        </Link>

        {cartUrls.length > 1 && (
          <p className="text-xs text-ink-500">
            Amazon&apos;s cart link carries 10 products at a time, so this
            bundle takes two clicks.
          </p>
        )}
        <AffiliateDisclosure variant="inline" />
      </footer>
    </article>
  );
}
