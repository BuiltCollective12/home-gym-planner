"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { renderThumbnail } from "@/lib/thumbnails";
import { productImageOverrides } from "@/lib/product-images";
import { amazonImageUrl, amazonRecord } from "@/lib/amazon-data";
import type { Equipment } from "@/lib/types";

/**
 * Product image for catalog and cart rows.
 *
 * Real photography wins whenever it exists; the generated 3D render is only a
 * placeholder for items we do not have a photo for yet. See
 * `product-images.ts` for where photos may legally come from.
 */

/* ------------------------------------------------------------------ *
 * One shared fetch of the available-photo manifest, for every thumbnail.
 * ------------------------------------------------------------------ */

let manifest: Record<string, string> = {};
let loaded = false;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function loadManifest() {
  if (inflight || loaded) return;
  inflight = fetch("/api/product-images")
    .then((r) => (r.ok ? r.json() : {}))
    .then((data: Record<string, string>) => {
      manifest = data ?? {};
    })
    .catch(() => {
      manifest = {};
    })
    .finally(() => {
      loaded = true;
      inflight = null;
      listeners.forEach((fn) => fn());
    });
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  loadManifest();
  return () => listeners.delete(fn);
}

const getSnapshot = () => loaded;
const getServerSnapshot = () => false;

function usePhotoFor(equipment: Equipment): {
  ready: boolean;
  url: string | null;
} {
  const ready = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const amazonImageId = amazonRecord(equipment.id)?.imageId;
  const url =
    equipment.imageUrl ??
    productImageOverrides[equipment.id] ??
    manifest[equipment.id] ??
    (amazonImageId ? amazonImageUrl(amazonImageId) : null);
  return { ready, url };
}

export function EquipmentThumb({
  equipment,
  size = 44,
}: {
  equipment: Equipment;
  size?: number;
}) {
  const { ready, url } = usePhotoFor(equipment);
  const [failed, setFailed] = useState(false);
  const [rendered, setRendered] = useState<string | null>(null);

  const needsRender = ready && (!url || failed);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  // Only pay for a WebGL render when there is genuinely no photo.
  useEffect(() => {
    if (!needsRender || rendered) return;
    const frame = requestAnimationFrame(() =>
      setRendered(renderThumbnail(equipment)),
    );
    return () => cancelAnimationFrame(frame);
  }, [needsRender, rendered, equipment]);

  const src = url && !failed ? url : rendered;
  const isPhoto = Boolean(url) && !failed;

  return (
    <div
      className="shrink-0 overflow-hidden rounded-md border border-line bg-white"
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={isPhoto ? equipment.name : `${equipment.name} (illustration)`}
          width={size}
          height={size}
          className="h-full w-full object-contain"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-[10px] font-bold uppercase text-ink-400">
          {equipment.category.slice(0, 2)}
        </div>
      )}
    </div>
  );
}
