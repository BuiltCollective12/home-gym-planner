import { describe, expect, it } from "vitest";
import type { Plan } from "@/lib/types";
import { decodePlan, encodePlan } from "../plan-url";

const plan: Plan = {
  room: { widthIn: 144, depthIn: 240, ceilingHeightIn: 96, doors: [], windows: [] },
  items: [
    { uid: "x1", equipmentId: "rep-pr-4000", xIn: 12, yIn: 24, rotation: 0 },
    { uid: "x2", equipmentId: "rep-ab-3000-fid", xIn: 36.5, yIn: 90, rotation: 90 },
  ],
};

describe("encodePlan / decodePlan", () => {
  it("round-trips the room and every item", () => {
    const decoded = decodePlan(encodePlan(plan));
    expect(decoded).not.toBeNull();
    expect(decoded!.room.widthIn).toBe(144);
    expect(decoded!.room.depthIn).toBe(240);
    expect(decoded!.room.ceilingHeightIn).toBe(96);
    expect(decoded!.items).toHaveLength(2);
    expect(decoded!.items[1]).toMatchObject({
      equipmentId: "rep-ab-3000-fid",
      xIn: 36.5,
      yIn: 90,
      rotation: 90,
    });
  });

  it("produces URL-safe output", () => {
    expect(encodePlan(plan)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("round-trips an empty plan", () => {
    const empty: Plan = { room: plan.room, items: [] };
    expect(decodePlan(encodePlan(empty))!.items).toEqual([]);
  });

  it("assigns fresh uids rather than trusting the link", () => {
    const decoded = decodePlan(encodePlan(plan))!;
    expect(new Set(decoded.items.map((i) => i.uid)).size).toBe(2);
  });

  it("returns null for junk instead of throwing", () => {
    expect(decodePlan("not-base64!!")).toBeNull();
    expect(decodePlan("")).toBeNull();
    expect(decodePlan(btoaUrl("{}"))).toBeNull();
    expect(decodePlan(btoaUrl("[1,0,0,0,[]]"))).toBeNull();
    expect(decodePlan(btoaUrl("[99,144,240,96,[]]"))).toBeNull();
  });

  it("skips malformed items but keeps the good ones", () => {
    const encoded = btoaUrl(
      JSON.stringify([1, 144, 240, 96, [["ok", 0, 0, 0], "junk", [12, 3]]]),
    );
    const decoded = decodePlan(encoded);
    expect(decoded!.items).toHaveLength(1);
    expect(decoded!.items[0].equipmentId).toBe("ok");
  });

  it("normalises an out-of-range rotation from a hand-edited link", () => {
    const encoded = btoaUrl(JSON.stringify([1, 144, 240, 96, [["ok", 0, 0, 450]]]));
    expect(decodePlan(encoded)!.items[0].rotation).toBe(90);
  });
});

function btoaUrl(s: string): string {
  return Buffer.from(s, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
