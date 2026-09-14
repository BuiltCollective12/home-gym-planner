import { describe, expect, it } from "vitest";
import { layouts, getLayout } from "@/lib/layouts";
import { getEquipment } from "@/lib/catalog";
import {
  findCeilingConflicts,
  findClearanceConflicts,
  findCollisions,
  findOutOfBounds,
} from "@/lib/planner/warnings";
import { computeTotals } from "@/lib/planner/totals";
import { decodePlan, encodePlan } from "@/lib/planner/plan-url";

/**
 * Layout landing pages.
 *
 * These are the first thing a search visitor sees, so a layout that trips the
 * planner's own warnings is worse than no page at all — it tells the reader the
 * tool cannot be trusted at the exact moment they are deciding whether to use
 * it. Same bar as bundles: no overlaps, nothing outside the walls, nothing
 * standing in a working zone.
 */

describe("layout integrity", () => {
  it("has a unique slug for every layout", () => {
    const slugs = layouts.map((l) => l.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("uses url-safe slugs", () => {
    for (const layout of layouts) {
      expect(layout.slug, layout.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("references only real catalog items", () => {
    for (const layout of layouts) {
      for (const item of layout.plan.items) {
        expect(
          getEquipment(item.equipmentId),
          `${layout.slug}: unknown item ${item.equipmentId}`,
        ).toBeDefined();
      }
    }
  });

  it("places nothing outside the room", () => {
    for (const layout of layouts) {
      const out = findOutOfBounds(
        layout.plan.items,
        layout.plan.room,
        getEquipment,
      );
      expect(out.map((w) => w.message), layout.slug).toEqual([]);
    }
  });

  it("places nothing on top of anything else", () => {
    for (const layout of layouts) {
      const hits = findCollisions(layout.plan.items, getEquipment);
      expect(hits.map((w) => w.message), layout.slug).toEqual([]);
    }
  });

  it("leaves every working zone clear", () => {
    for (const layout of layouts) {
      const hits = findClearanceConflicts(layout.plan.items, getEquipment);
      expect(hits.map((w) => w.message), layout.slug).toEqual([]);
    }
  });

  it("fits under its own stated ceiling", () => {
    // The low-ceiling pages are the whole point of this feature — a basement
    // layout that does not clear 84 inches would be actively misleading.
    for (const layout of layouts) {
      const hits = findCeilingConflicts(
        layout.plan.items,
        layout.plan.room,
        getEquipment,
      );
      expect(hits.map((w) => w.message), layout.slug).toEqual([]);
    }
  });

  it("states a square footage that matches the room", () => {
    for (const layout of layouts) {
      const actual =
        (layout.plan.room.widthIn * layout.plan.room.depthIn) / 144;
      expect(Math.round(actual), layout.slug).toBe(layout.sqft);
    }
  });

  it("gives every layout something to buy", () => {
    for (const layout of layouts) {
      const totals = computeTotals(
        layout.plan.items,
        layout.plan.room,
        getEquipment,
      );
      expect(totals.itemCount, layout.slug).toBeGreaterThanOrEqual(6);
      expect(totals.estCostUsd, layout.slug).toBeGreaterThan(0);
    }
  });

  it("round-trips through a shareable plan url", () => {
    for (const layout of layouts) {
      const decoded = decodePlan(encodePlan(layout.plan));
      expect(decoded, layout.slug).not.toBeNull();
      expect(decoded!.items.length, layout.slug).toBe(layout.plan.items.length);
      expect(decoded!.room.widthIn, layout.slug).toBe(layout.plan.room.widthIn);
    }
  });

  it("writes metadata search engines will accept", () => {
    for (const layout of layouts) {
      // Google truncates titles past ~60 chars and descriptions past ~160.
      expect(layout.title.length, `${layout.slug} title`).toBeLessThanOrEqual(65);
      expect(
        layout.metaDescription.length,
        `${layout.slug} description`,
      ).toBeLessThanOrEqual(165);
      expect(layout.metaDescription.length).toBeGreaterThan(70);
    }
  });

  it("writes real page content, not a thin doorway page", () => {
    // Seven pages differing only by dimensions is a pattern Google demotes.
    for (const layout of layouts) {
      expect(layout.intro.length, `${layout.slug} intro`).toBeGreaterThan(180);
      expect(layout.notes.length, `${layout.slug} notes`).toBeGreaterThanOrEqual(4);
      for (const note of layout.notes) {
        expect(note.body.length, `${layout.slug}: "${note.heading}"`).toBeGreaterThan(
          80,
        );
      }
    }
  });

  it("does not reuse the same advice on two pages", () => {
    const headings = layouts.flatMap((l) => l.notes.map((n) => n.heading));
    expect(new Set(headings).size).toBe(headings.length);
  });

  it("looks layouts up by slug", () => {
    expect(getLayout("10x10-home-gym-layout")?.sqft).toBe(100);
    expect(getLayout("nope")).toBeUndefined();
  });
});
