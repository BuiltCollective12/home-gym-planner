"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getEquipment } from "@/lib/catalog";
import { usePlannerStore } from "@/store/planner-store";
import { decodePlan } from "@/lib/planner/plan-url";
import { computeTotals, toCartLines } from "@/lib/planner/totals";
import {
  buildAmazonCartUrls,
  amazonBatchSizes,
  buildItemUrl,
  isAmazonItem,
  linesNeedingDirectLinks,
  buyLabel,
  sourceMetaLine,
  type CartLine,
} from "@/lib/affiliate";
import { track } from "@/lib/analytics";
import { formatUsd, formatWeight } from "@/lib/units";
import { siteConfig } from "@/lib/site.config";
import { AffiliateDisclosure } from "./SiteChrome";
import { EmailCapture } from "./EmailCapture";
import { EquipmentThumb } from "./EquipmentThumb";

export function CartView() {
  const items = usePlannerStore((s) => s.items);
  const room = usePlannerStore((s) => s.room);
  const units = usePlannerStore((s) => s.units);
  const loadPlan = usePlannerStore((s) => s.loadPlan);
  const duplicateItem = usePlannerStore((s) => s.duplicateItem);
  const removeItem = usePlannerStore((s) => s.removeItem);
  const [hydrated, setHydrated] = useState(false);

  // The store is in-memory, so a shared or refreshed /cart#p=… link rebuilds
  // the plan from the URL exactly like the planner does.
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#p=")) {
      const plan = decodePlan(hash.slice(3));
      if (plan && plan.items.length > 0) loadPlan(plan);
    }
    setHydrated(true);
  }, [loadPlan]);

  const lines = useMemo(() => toCartLines(items, getEquipment), [items]);
  const totals = useMemo(
    () => computeTotals(items, room, getEquipment),
    [items, room],
  );
  const cartUrls = useMemo(() => buildAmazonCartUrls(lines), [lines]);
  const batchSizes = useMemo(() => amazonBatchSizes(lines), [lines]);
  const fallbackLines = useMemo(() => linesNeedingDirectLinks(lines), [lines]);
  // Units, not distinct products — "add 2 items" is what a shopper expects
  // when the plan holds two of the same plate set.
  const amazonCount = lines
    .filter((l) => isAmazonItem(l.equipment))
    .reduce((sum, l) => sum + l.quantity, 0);

  useEffect(() => {
    if (!hydrated || lines.length === 0) return;
    track({
      name: "cart_viewed",
      itemCount: items.length,
      estCostUsd: Math.round(totals.estCostUsd),
    });
    // Fire once per plan, not on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, lines.length]);

  if (!hydrated) {
    return <p className="py-20 text-center text-ink-500">Loading your plan…</p>;
  }

  if (lines.length === 0) {
    return (
      <div className="card p-10 text-center">
        <h2 className="text-xl font-bold">Your gym is empty</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
          Build a layout in the planner — or start from a bundle — and
          everything you place shows up here, ready to buy.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/planner" className="btn-accent">
            Open the planner
          </Link>
          <Link href="/bundles" className="btn-ghost">
            Browse bundles
          </Link>
        </div>
      </div>
    );
  }

  const removeOne = (equipmentId: string) => {
    const last = [...items].reverse().find((i) => i.equipmentId === equipmentId);
    if (last) removeItem(last.uid);
  };

  const addOne = (equipmentId: string) => {
    const existing = items.find((i) => i.equipmentId === equipmentId);
    if (existing) duplicateItem(existing.uid);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
      <section className="space-y-4">
        <ul className="card divide-y divide-line">
          {lines.map((line) => (
            <CartRow
              key={line.equipment.id}
              line={line}
              onAdd={() => addOne(line.equipment.id)}
              onRemove={() => removeOne(line.equipment.id)}
            />
          ))}
        </ul>

        {fallbackLines.length > 0 && (
          <div className="card p-4">
            <h3 className="text-sm font-bold">
              Buy these separately ({fallbackLines.length})
            </h3>
            <p className="mt-1 text-xs text-ink-500">
              {cartUrls.length > 0
                ? "These could not be added to the cart link automatically."
                : "Grab each of these from its own page."}
            </p>
            <ul className="mt-3 space-y-2">
              {fallbackLines.map((line) => (
                <li
                  key={line.equipment.id}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="min-w-0 truncate text-sm text-ink-800">
                    {line.equipment.name}
                    {line.quantity > 1 && (
                      <span className="text-ink-500"> × {line.quantity}</span>
                    )}
                  </span>
                  <BuyLink line={line} className="btn-ghost shrink-0 px-3 py-1.5 text-xs" />
                </li>
              ))}
            </ul>
          </div>
        )}

        <UpsellCards estCostUsd={totals.estCostUsd} itemCount={items.length} />
      </section>

      <aside className="space-y-4 lg:sticky lg:top-20">
        <div className="card p-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink-600">
            Summary
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Items" value={String(items.length)} />
            <Row label="Total weight" value={formatWeight(totals.totalWeightLbs, units)} />
            <Row
              label="Est. total"
              value={formatUsd(totals.estCostUsd)}
              emphasis
            />
          </dl>
          <p className="mt-2 text-xs text-ink-400">
            Estimates we maintain by hand, not live pricing. Check the real
            price on each retailer before you buy.
            {totals.hasUnpricedItems && " Some items have no estimate yet."}
          </p>

          <div className="mt-4 space-y-2">
            {cartUrls.length > 0 ? (
              cartUrls.map((url, i) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="nofollow sponsored noopener"
                  className={i === 0 ? "btn-accent w-full" : "btn-ghost w-full"}
                  onClick={() =>
                    track({
                      name: "affiliate_click",
                      source: "amazon",
                      multiItem: true,
                      itemCount: batchSizes[i],
                    })
                  }
                >
                  {cartUrls.length === 1
                    ? `Add all ${amazonCount} to Amazon cart`
                    : i === 0
                      ? `Add first ${batchSizes[i]} to Amazon cart`
                      : `Then add the last ${batchSizes[i]}`}
                </a>
              ))
            ) : (
              <p className="rounded-lg border border-line bg-paper-200 p-3 text-xs text-ink-600">
                Nothing in this plan is linkable yet — use the per-item links on
                the left.
              </p>
            )}
            {cartUrls.length > 1 && (
              <p className="text-xs text-ink-500">
                Amazon&apos;s cart link carries 10 products at a time, so this
                plan takes two clicks.
              </p>
            )}
            <Link href="/planner" className="btn-ghost w-full">
              Back to the planner
            </Link>
          </div>

          <div className="mt-3 border-t border-line pt-3">
            <AffiliateDisclosure variant="inline" />
          </div>
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-bold">Don&apos;t want to build it?</h3>
          <p className="mt-1 text-xs text-ink-500">
            Rack and machine assembly typically runs $80–200 depending on the
            piece.
          </p>
          <a
            href={siteConfig.assemblyUrl}
            target="_blank"
            rel="nofollow sponsored noopener"
            className="btn-ghost mt-3 w-full text-xs"
            onClick={() =>
              track({
                name: "assembly_click",
                estCostUsd: Math.round(totals.estCostUsd),
              })
            }
          >
            Add assembly
          </a>
        </div>
      </aside>
    </div>
  );
}

function CartRow({
  line,
  onAdd,
  onRemove,
}: {
  line: CartLine;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const { equipment, quantity } = line;
  const lineTotal =
    typeof equipment.estPriceUsd === "number"
      ? equipment.estPriceUsd * quantity
      : null;

  return (
    <li className="flex flex-wrap items-center gap-3 p-4">
      <EquipmentThumb equipment={equipment} size={56} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink-900">{equipment.name}</p>
        <p className="mt-0.5 text-xs text-ink-500">
          {sourceMetaLine(equipment)} ·{" "}
          {equipment.widthIn}&quot; × {equipment.depthIn}&quot; ×{" "}
          {equipment.heightIn}&quot;
          {equipment.sponsored && (
            <span className="ml-1 text-accent">· Sponsored</span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-line-strong">
        <button
          type="button"
          className="px-2.5 py-1 text-sm text-ink-600 hover:text-ink-900"
          onClick={onRemove}
          aria-label={`Remove one ${equipment.name}`}
        >
          −
        </button>
        <span className="min-w-6 text-center text-sm tabular-nums">{quantity}</span>
        <button
          type="button"
          className="px-2.5 py-1 text-sm text-ink-600 hover:text-ink-900"
          onClick={onAdd}
          aria-label={`Add one ${equipment.name}`}
        >
          +
        </button>
      </div>

      <div className="w-20 text-right text-sm tabular-nums">
        {lineTotal === null ? (
          <span className="text-xs text-ink-500">see site</span>
        ) : (
          <>
            <span className="text-ink-500">est.</span> {formatUsd(lineTotal)}
          </>
        )}
      </div>

      <BuyLink line={line} className="btn-ghost px-3 py-1.5 text-xs" />
    </li>
  );
}

function BuyLink({ line, className }: { line: CartLine; className?: string }) {
  const { equipment } = line;
  return (
    <a
      href={buildItemUrl(equipment)}
      target="_blank"
      rel="nofollow sponsored noopener"
      className={className}
      onClick={() =>
        track({
          name: "affiliate_click",
          source: equipment.sourceType,
          equipmentId: equipment.id,
          multiItem: false,
        })
      }
    >
      {buyLabel(equipment)}
    </a>
  );
}

function UpsellCards({
  estCostUsd,
  itemCount,
}: {
  estCostUsd: number;
  itemCount: number;
}) {
  const [requested, setRequested] = useState(false);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="card p-4">
        <span className="chip">Free</span>
        <h3 className="mt-2 font-bold">A workout plan for this exact gym</h3>
        <p className="mt-1 text-xs text-ink-500">
          Built around the {itemCount} piece{itemCount === 1 ? "" : "s"} you just
          planned — not a generic template. Sample plan free; full programming is{" "}
          {formatUsd(siteConfig.pricing.workoutsMonthlyUsd)}/mo.
        </p>
        <div className="mt-3">
          {requested ? (
            <p className="text-xs font-medium text-ok">
              Sample plan on the way — check your inbox.
            </p>
          ) : (
            <button
              type="button"
              className="btn-accent w-full text-xs"
              onClick={() => {
                setRequested(true);
                track({ name: "sample_plan_requested", itemCount });
              }}
            >
              Get my free sample plan
            </button>
          )}
        </div>
      </div>

      <div className="card p-4">
        <span className="chip">
          {formatUsd(siteConfig.pricing.proOneTimeUsd)} one-time
        </span>
        <h3 className="mt-2 font-bold">Pro planner</h3>
        <p className="mt-1 text-xs text-ink-500">
          Unlimited saved plans, PDF blueprint export, printable shopping list,
          and your room photo as the 3D backdrop. Buy links always stay free.
        </p>
        <button
          type="button"
          className="btn-ghost mt-3 w-full text-xs"
          onClick={() =>
            track({
              name: "pro_purchased",
              priceUsd: siteConfig.pricing.proOneTimeUsd,
            })
          }
        >
          Coming soon
        </button>
      </div>

      <div className="card p-4 sm:col-span-2">
        <h3 className="font-bold">Deals on what&apos;s in your cart</h3>
        <p className="mb-3 mt-1 text-xs text-ink-500">
          Equipment goes on sale hard in January and on Black Friday. We&apos;ll
          tell you when the items in this plan drop.
        </p>
        <EmailCapture placement="cart" label="Alert me" hint="" />
        <p className="mt-2 text-[11px] text-ink-400">
          Est. build value {formatUsd(estCostUsd)}.
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink-500">{label}</dt>
      <dd
        className={
          emphasis
            ? "text-xl font-bold tabular-nums text-ink-900"
            : "tabular-nums text-ink-800"
        }
      >
        {value}
      </dd>
    </div>
  );
}
