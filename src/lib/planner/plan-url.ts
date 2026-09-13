import type { Plan, PlacedItem, Room } from "@/lib/types";
import { normalizeRotation } from "./geometry";

/**
 * Phase 1 "save/share" is the URL itself — no login, no database.
 *
 * The encoding is a compact positional JSON array, base64url-encoded, so a
 * ten-item plan comfortably fits in a shareable link. Phase 2 swaps this for a
 * Supabase row without changing the planner.
 */

const VERSION = 1;

type EncodedItem = [equipmentId: string, xIn: number, yIn: number, rot: number];
type EncodedPlan = [
  version: number,
  widthIn: number,
  depthIn: number,
  ceilingHeightIn: number,
  items: EncodedItem[],
];

function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  const b64 =
    typeof btoa === "function"
      ? btoa(binary)
      : Buffer.from(input, "utf8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(input: string): string {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  if (typeof atob === "function") {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(padded, "base64").toString("utf8");
}

export function encodePlan(plan: Plan): string {
  const payload: EncodedPlan = [
    VERSION,
    round(plan.room.widthIn),
    round(plan.room.depthIn),
    round(plan.room.ceilingHeightIn),
    plan.items.map((i) => [
      i.equipmentId,
      round(i.xIn),
      round(i.yIn),
      i.rotation,
    ]),
  ];
  return toBase64Url(JSON.stringify(payload));
}

/** Returns null for anything malformed — a bad link must never crash the app. */
export function decodePlan(encoded: string): Plan | null {
  try {
    const parsed = JSON.parse(fromBase64Url(encoded)) as unknown;
    if (!Array.isArray(parsed) || parsed.length < 5) return null;
    const [version, widthIn, depthIn, ceilingHeightIn, rawItems] =
      parsed as EncodedPlan;
    if (version !== VERSION) return null;
    if (![widthIn, depthIn, ceilingHeightIn].every(isPositiveNumber)) return null;
    if (!Array.isArray(rawItems)) return null;

    const items: PlacedItem[] = [];
    rawItems.forEach((raw, index) => {
      if (!Array.isArray(raw) || raw.length < 4) return;
      const [equipmentId, xIn, yIn, rot] = raw;
      if (typeof equipmentId !== "string") return;
      if (typeof xIn !== "number" || typeof yIn !== "number") return;
      if (!Number.isFinite(xIn) || !Number.isFinite(yIn)) return;
      items.push({
        uid: `u${index}`,
        equipmentId,
        xIn,
        yIn,
        rotation: normalizeRotation(typeof rot === "number" ? rot : 0),
      });
    });

    const room: Room = {
      widthIn,
      depthIn,
      ceilingHeightIn,
      doors: [],
      windows: [],
    };
    return { room, items };
  } catch {
    return null;
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function isPositiveNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n > 0;
}
