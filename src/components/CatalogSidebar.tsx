"use client";

import { useMemo, useState } from "react";
import { siteConfig } from "@/lib/site.config";
import { catalog } from "@/lib/catalog";
import { usePlannerStore } from "@/store/planner-store";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/types";
import { formatLength, formatUsd, formatWeight } from "@/lib/units";
import { sourceMetaLine } from "@/lib/affiliate";
import { EquipmentThumb } from "./EquipmentThumb";

export function CatalogSidebar() {
  const addItem = usePlannerStore((s) => s.addItem);
  const units = usePlannerStore((s) => s.units);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Category | "all">("all");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter((item) => {
      if (active !== "all" && item.category !== active) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.tags.some((t) => t.includes(q))
      );
    });
  }, [query, active]);

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-3 border-b border-line p-3">
        <input
          className="field"
          type="search"
          placeholder={`Search ${catalog.length} items…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search equipment"
        />
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          <CategoryChip
            label="All"
            active={active === "all"}
            onClick={() => setActive("all")}
          />
          {CATEGORIES.map((c) => (
            <CategoryChip
              key={c}
              label={CATEGORY_LABELS[c]}
              active={active === c}
              onClick={() => setActive(c)}
            />
          ))}
        </div>
      </div>

      <ul className="flex-1 divide-y divide-line overflow-y-auto">
        {results.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => addItem(item.id)}
              className="group w-full px-3 py-3 text-left transition-colors hover:bg-paper-200"
            >
              <div className="flex items-start gap-3">
                <EquipmentThumb equipment={item} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">
                    {item.name}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {sourceMetaLine(item)}
                    {item.sponsored && (
                      <span className="ml-1 text-accent">· Sponsored</span>
                    )}
                  </p>
                </div>
                <span className="shrink-0 rounded-md bg-paper-300 px-2 py-1 text-xs font-semibold text-ink-900 group-hover:bg-accent group-hover:text-white">
                  Add
                </span>
              </div>
              <p className="mt-1.5 text-xs text-ink-500">
                {formatLength(item.widthIn, units)} ×{" "}
                {formatLength(item.depthIn, units)} ×{" "}
                {formatLength(item.heightIn, units)} ·{" "}
                {formatWeight(item.weightLbs, units)}
                {siteConfig.showItemPrices &&
                  typeof item.estPriceUsd === "number" && (
                    <> · est. {formatUsd(item.estPriceUsd)}</>
                  )}
              </p>
            </button>
          </li>
        ))}
        {results.length === 0 && (
          <li className="p-6 text-center text-sm text-ink-500">
            Nothing matches “{query}”.
          </li>
        )}
      </ul>
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-accent-600 bg-accent-600 text-white"
          : "border-line-strong text-ink-600 hover:border-line-strong hover:text-ink-900"
      }`}
    >
      {label}
    </button>
  );
}
