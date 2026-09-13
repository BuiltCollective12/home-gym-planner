"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getEquipment } from "@/lib/catalog";
import { usePlannerStore } from "@/store/planner-store";
import { decodePlan, encodePlan } from "@/lib/planner/plan-url";
import { computeTotals } from "@/lib/planner/totals";
import { formatUsd } from "@/lib/units";
import { track } from "@/lib/analytics";
import { CatalogSidebar } from "./CatalogSidebar";
import { RoomSetupPanel } from "./RoomSetupPanel";
import { TotalsPanel } from "./TotalsPanel";

// Konva touches `window` at import time, so it can never render on the server.
const PlannerScene3D = dynamic(() => import("./PlannerScene3D"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center text-sm text-ink-300">
      Loading 3D view…
    </div>
  ),
});

const PlannerCanvas = dynamic(() => import("./PlannerCanvas"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center text-sm text-ink-500">
      Loading planner…
    </div>
  ),
});

type MobileTab = "catalog" | "plan" | "room";

/** Same plan, two renderers. */
function PlannerViewport() {
  const view = usePlannerStore((s) => s.view);
  return view === "3d" ? <PlannerScene3D /> : <PlannerCanvas />;
}

export function PlannerShell() {
  const [mobileTab, setMobileTab] = useState<MobileTab>("catalog");
  const loadPlan = usePlannerStore((s) => s.loadPlan);

  // Phase 1 save/share: the plan lives in the URL hash, no account needed.
  useEffect(() => {
    const encoded = window.location.hash.replace(/^#p=/, "");
    if (!encoded || !window.location.hash.startsWith("#p=")) return;
    const plan = decodePlan(encoded);
    if (plan) loadPlan(plan);
  }, [loadPlan]);

  return (
    <div className="flex h-[calc(100dvh-57px)] flex-col">
      <PlannerToolbar />

      {/* Desktop: catalog | canvas | plan */}
      <div className="hidden min-h-0 flex-1 lg:grid lg:grid-cols-[300px_1fr_340px]">
        <aside className="min-h-0 border-r border-line bg-paper-50">
          <CatalogSidebar />
        </aside>
        <main className="min-h-0 bg-canvas">
          <PlannerViewport />
        </main>
        <aside className="flex min-h-0 flex-col border-l border-line bg-paper-50">
          <div className="max-h-[45%] overflow-y-auto border-b border-line">
            <RoomSetupPanel />
          </div>
          <div className="min-h-0 flex-1">
            <TotalsPanel />
          </div>
        </aside>
      </div>

      {/* Mobile: canvas on top, one panel at a time below */}
      <div className="flex min-h-0 flex-1 flex-col lg:hidden">
        <div className="h-[38dvh] shrink-0 border-b border-line bg-canvas">
          <PlannerViewport />
        </div>
        <div className="flex shrink-0 border-b border-line bg-paper-50">
          {(["catalog", "plan", "room"] as MobileTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setMobileTab(tab)}
              className={`flex-1 py-2.5 text-sm font-semibold capitalize transition-colors ${
                mobileTab === tab
                  ? "border-b-2 border-accent text-ink-900"
                  : "text-ink-500"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto bg-paper-50">
          {mobileTab === "catalog" && <CatalogSidebar />}
          {mobileTab === "plan" && <TotalsPanel />}
          {mobileTab === "room" && <RoomSetupPanel />}
        </div>
        {/* The buy CTA must never hide behind a tab. */}
        <MobileBuyBar />
      </div>
    </div>
  );
}

function MobileBuyBar() {
  const items = usePlannerStore((s) => s.items);
  const room = usePlannerStore((s) => s.room);

  const totals = useMemo(
    () => computeTotals(items, room, getEquipment),
    [items, room],
  );
  const href = useMemo(
    () => (items.length === 0 ? "/cart" : `/cart#p=${encodePlan({ room, items })}`),
    [items, room],
  );

  if (items.length === 0) return null;

  return (
    <div className="flex shrink-0 items-center gap-3 border-t border-line bg-paper-200 px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-xs text-ink-500">
          {items.length} item{items.length === 1 ? "" : "s"}
        </p>
        <p className="text-sm font-bold tabular-nums">
          est. {formatUsd(totals.estCostUsd)}
        </p>
      </div>
      <Link href={href} className="btn-accent ml-auto shrink-0">
        Review &amp; buy
      </Link>
    </div>
  );
}

/** 2D is the editing view; 3D is the one that sells the room. */
function ViewToggle() {
  const view = usePlannerStore((s) => s.view);
  const setView = usePlannerStore((s) => s.setView);

  return (
    <div className="flex rounded-lg border border-line-strong bg-paper-50 p-0.5">
      {(["2d", "3d"] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => setView(v)}
          aria-pressed={view === v}
          className={`rounded-md px-2.5 py-1 text-xs font-bold uppercase transition-colors ${
            view === v
              ? "bg-accent-600 text-white"
              : "text-ink-500 hover:text-ink-900"
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

function PlannerToolbar() {
  const items = usePlannerStore((s) => s.items);
  const room = usePlannerStore((s) => s.room);
  const selectedUid = usePlannerStore((s) => s.selectedUid);
  const snapEnabled = usePlannerStore((s) => s.snapEnabled);
  const showClearance = usePlannerStore((s) => s.showClearance);
  const gridIn = usePlannerStore((s) => s.gridIn);
  const past = usePlannerStore((s) => s.past);
  const future = usePlannerStore((s) => s.future);

  const undo = usePlannerStore((s) => s.undo);
  const redo = usePlannerStore((s) => s.redo);
  const rotateItem = usePlannerStore((s) => s.rotateItem);
  const removeItem = usePlannerStore((s) => s.removeItem);
  const duplicateItem = usePlannerStore((s) => s.duplicateItem);
  const clearPlan = usePlannerStore((s) => s.clearPlan);
  const setSnapEnabled = usePlannerStore((s) => s.setSnapEnabled);
  const setShowClearance = usePlannerStore((s) => s.setShowClearance);
  const setGrid = usePlannerStore((s) => s.setGrid);

  const [copied, setCopied] = useState(false);

  const totals = useMemo(
    () => computeTotals(items, room, getEquipment),
    [items, room],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }

      const uid = usePlannerStore.getState().selectedUid;
      if (!uid) return;

      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        rotateItem(uid, e.shiftKey ? -90 : 90);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        removeItem(uid);
      } else if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateItem(uid);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, rotateItem, removeItem, duplicateItem]);

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#p=${encodePlan(
      { room, items },
    )}`;
    window.history.replaceState(null, "", url);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the URL bar now holds the link either way.
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    track({ name: "plan_shared", itemCount: items.length });
    track({
      name: "plan_completed",
      itemCount: items.length,
      estCostUsd: Math.round(totals.estCostUsd),
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-line bg-paper-50 px-3 py-2">
      <ViewToggle />

      <span className="mx-1 h-5 w-px bg-line" />

      <ToolButton onClick={undo} disabled={past.length === 0} title="Undo (Ctrl+Z)">
        ↺ Undo
      </ToolButton>
      <ToolButton
        onClick={redo}
        disabled={future.length === 0}
        title="Redo (Ctrl+Shift+Z)"
      >
        ↻ Redo
      </ToolButton>

      <span className="mx-1 h-5 w-px bg-paper-300" />

      <ToolButton
        onClick={() => selectedUid && rotateItem(selectedUid)}
        disabled={!selectedUid}
        title="Rotate 90° (R)"
      >
        ⟳ Rotate
      </ToolButton>
      <ToolButton
        onClick={() => selectedUid && duplicateItem(selectedUid)}
        disabled={!selectedUid}
        title="Duplicate (Ctrl+D)"
      >
        ⧉ Duplicate
      </ToolButton>
      <ToolButton
        onClick={() => selectedUid && removeItem(selectedUid)}
        disabled={!selectedUid}
        title="Delete (Del)"
      >
        ✕ Delete
      </ToolButton>

      <span className="mx-1 hidden h-5 w-px bg-paper-300 sm:block" />

      <label className="hidden items-center gap-1.5 text-xs text-ink-600 sm:flex">
        <input
          type="checkbox"
          checked={snapEnabled}
          onChange={(e) => setSnapEnabled(e.target.checked)}
          className="accent-accent"
        />
        Snap
      </label>
      <select
        className="hidden rounded-md border border-line-strong bg-paper-200 px-2 py-1 text-xs text-ink-800 sm:block"
        value={gridIn}
        onChange={(e) => setGrid(Number(e.target.value))}
        aria-label="Grid size"
      >
        <option value={3}>3&quot;</option>
        <option value={6}>6&quot;</option>
        <option value={12}>12&quot;</option>
      </select>
      <label className="hidden items-center gap-1.5 text-xs text-ink-600 sm:flex">
        <input
          type="checkbox"
          checked={showClearance}
          onChange={(e) => setShowClearance(e.target.checked)}
          className="accent-accent"
        />
        Clearances
      </label>

      <div className="ml-auto flex items-center gap-1.5">
        <ToolButton onClick={clearPlan} disabled={items.length === 0}>
          Clear
        </ToolButton>
        <button
          type="button"
          onClick={share}
          className="btn-ghost px-3 py-1.5 text-xs"
          disabled={items.length === 0}
        >
          {copied ? "Link copied ✓" : "Save / share"}
        </button>
      </div>
    </div>
  );
}

function ToolButton({
  children,
  onClick,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-ink-800 transition-colors hover:bg-paper-200 disabled:cursor-not-allowed disabled:text-ink-300 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
