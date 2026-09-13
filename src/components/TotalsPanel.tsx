"use client";

import Link from "next/link";
import { useMemo } from "react";
import { getEquipment } from "@/lib/catalog";
import { usePlannerStore } from "@/store/planner-store";
import { computeTotals, toCartLines } from "@/lib/planner/totals";
import { encodePlan } from "@/lib/planner/plan-url";
import { validatePlan } from "@/lib/planner/warnings";
import { formatArea, formatUsd, formatWeight } from "@/lib/units";
import { AffiliateDisclosure } from "./SiteChrome";

export function TotalsPanel() {
  const items = usePlannerStore((s) => s.items);
  const room = usePlannerStore((s) => s.room);
  const units = usePlannerStore((s) => s.units);
  const select = usePlannerStore((s) => s.select);
  const removeItem = usePlannerStore((s) => s.removeItem);
  const selectedUid = usePlannerStore((s) => s.selectedUid);

  const totals = useMemo(
    () => computeTotals(items, room, getEquipment),
    [items, room],
  );
  const warnings = useMemo(
    () => validatePlan(items, room, getEquipment),
    [items, room],
  );
  const lines = useMemo(() => toCartLines(items, getEquipment), [items]);
  // Carry the plan in the link so /cart survives a refresh or a shared URL.
  const cartHref = useMemo(
    () => (items.length === 0 ? "/cart" : `/cart#p=${encodePlan({ room, items })}`),
    [items, room],
  );

  const errors = warnings.filter((w) => w.severity === "error");
  const advisories = warnings.filter((w) => w.severity === "warning");

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-2 gap-px border-b border-line bg-paper-200">
        <Stat label="Items" value={String(totals.itemCount)} />
        <Stat
          label="Est. cost"
          value={formatUsd(totals.estCostUsd)}
          hint={totals.hasUnpricedItems ? "some items unpriced" : undefined}
        />
        <Stat label="Total weight" value={formatWeight(totals.totalWeightLbs, units)} />
        <Stat
          label="Floor used"
          value={`${Math.round(totals.floorUsage * 100)}%`}
          hint={`${formatArea(totals.usedAreaSqft, units)} of ${formatArea(
            totals.roomAreaSqft,
            units,
          )}`}
        />
      </div>

      {(errors.length > 0 || advisories.length > 0) && (
        <div className="space-y-2 border-b border-line p-3">
          {errors.map((w, i) => (
            <WarningRow key={`e${i}`} severity="error" message={w.message} />
          ))}
          {advisories.map((w, i) => (
            <WarningRow key={`w${i}`} severity="warning" message={w.message} />
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {lines.length === 0 ? (
          <p className="p-4 text-sm text-ink-500">
            Nothing placed yet. Add equipment from the catalog and drag it into
            position.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((item) => {
              const equipment = getEquipment(item.equipmentId);
              if (!equipment) return null;
              return (
                <li key={item.uid}>
                  <div
                    className={`flex items-center gap-2 px-3 py-2 ${
                      selectedUid === item.uid ? "bg-paper-200" : ""
                    }`}
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => select(item.uid)}
                    >
                      <p className="truncate text-sm text-ink-900">
                        {equipment.name}
                      </p>
                      <p className="text-xs text-ink-500">
                        {equipment.brand}
                        {typeof equipment.estPriceUsd === "number"
                          ? ` · est. ${formatUsd(equipment.estPriceUsd)}`
                          : " · price on site"}
                        {item.rotation !== 0 && ` · ${item.rotation}°`}
                      </p>
                    </button>
                    <button
                      type="button"
                      className="px-1 text-ink-400 hover:text-danger"
                      onClick={() => removeItem(item.uid)}
                      aria-label={`Remove ${equipment.name}`}
                    >
                      ✕
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="space-y-3 border-t border-line p-3">
        {totals.flooringNeededSqft > 0 && (
          <p className="rounded-lg border border-line bg-paper-200 p-2.5 text-xs text-ink-600">
            <span className="font-semibold text-ink-900">
              {formatArea(totals.flooringNeededSqft, units)} of flooring
            </span>{" "}
            still uncovered. Add mats or tiles from the Flooring category.
          </p>
        )}
        {items.length === 0 ? (
          <span className="btn-accent w-full cursor-not-allowed opacity-40">
            Review &amp; buy this gym
          </span>
        ) : (
          <Link href={cartHref} className="btn-accent w-full">
            Review &amp; buy this gym
          </Link>
        )}
        <AffiliateDisclosure variant="inline" />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="bg-paper-50 p-3">
      <p className="text-xs text-ink-500">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums text-ink-900">{value}</p>
      {hint && <p className="text-[11px] text-ink-400">{hint}</p>}
    </div>
  );
}

function WarningRow({
  severity,
  message,
}: {
  severity: "error" | "warning";
  message: string;
}) {
  return (
    <p
      className={`flex gap-2 rounded-md border p-2 text-xs ${
        severity === "error"
          ? "border-danger/30 bg-dangerBg text-danger"
          : "border-warn/30 bg-warnBg text-warn"
      }`}
    >
      <span aria-hidden>{severity === "error" ? "⛔" : "⚠"}</span>
      <span>{message}</span>
    </p>
  );
}
