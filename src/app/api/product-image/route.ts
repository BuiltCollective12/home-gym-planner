import { NextResponse } from "next/server";
import { amazonData, amazonImageUrl } from "@/lib/amazon-data";

/**
 * Same-origin proxy for product photography.
 *
 * The 3D view paints product photos onto billboards, and WebGL refuses to
 * sample a cross-origin texture unless the host sends CORS headers. Amazon's
 * image CDN does not (verified: drawing one to a canvas throws SecurityError),
 * so the browser cannot use those URLs as textures directly. Streaming the
 * bytes through our own origin removes the restriction.
 *
 * Only ids that exist in our catalog data are fetchable — the equipment id is
 * the key, never a caller-supplied URL, so this cannot be used as an open proxy.
 */

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const imageId = amazonData[id]?.imageId;
  if (!imageId) {
    return NextResponse.json({ error: "Unknown item" }, { status: 404 });
  }

  try {
    const upstream = await fetch(amazonImageUrl(imageId, 500), {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!upstream.ok) {
      return NextResponse.json({ error: "Upstream failed" }, { status: 502 });
    }

    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  }
}
