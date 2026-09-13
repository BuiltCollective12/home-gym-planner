import { readdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

/**
 * Lists the real product photos present in `public/products/`.
 *
 * The client asks once and then knows exactly which items have photography, so
 * it never probes URLs that do not exist (58 items x 5 extensions would be 290
 * pointless 404s and a flash of broken images). Drop a file in the folder and
 * it appears on the next load — no build step, no code change.
 */

const EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "avif"]);

export async function GET() {
  const dir = path.join(process.cwd(), "public", "products");
  const map: Record<string, string> = {};

  try {
    for (const name of await readdir(dir)) {
      const ext = name.split(".").pop()?.toLowerCase();
      if (!ext || !EXTENSIONS.has(ext)) continue;
      const id = name.slice(0, -(ext.length + 1));
      // First extension wins, so a stray duplicate cannot flip-flop.
      if (!map[id]) map[id] = `/products/${name}`;
    }
  } catch {
    // No folder yet — every item just uses its generated render.
  }

  return NextResponse.json(map, {
    headers: { "Cache-Control": "public, max-age=60" },
  });
}
