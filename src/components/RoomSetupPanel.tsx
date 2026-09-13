"use client";

import { useEffect, useRef, useState } from "react";
import { usePlannerStore } from "@/store/planner-store";
import {
  formatFeetInches,
  inToCm,
  parseLengthToInches,
  type UnitSystem,
} from "@/lib/units";
import type { WallSide } from "@/lib/types";

const WALLS: WallSide[] = ["north", "east", "south", "west"];

export function RoomSetupPanel() {
  const room = usePlannerStore((s) => s.room);
  const units = usePlannerStore((s) => s.units);
  const setUnits = usePlannerStore((s) => s.setUnits);
  const setRoomSize = usePlannerStore((s) => s.setRoomSize);
  const setPhoto = usePlannerStore((s) => s.setPhoto);
  const addMarker = usePlannerStore((s) => s.addMarker);
  const updateMarker = usePlannerStore((s) => s.updateMarker);
  const removeMarker = usePlannerStore((s) => s.removeMarker);

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-600">
          Your room
        </h2>
        <div className="flex rounded-lg border border-line-strong p-0.5">
          {(["imperial", "metric"] as UnitSystem[]).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUnits(u)}
              className={`rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                units === u ? "bg-accent-600 text-white" : "text-ink-600"
              }`}
            >
              {u === "imperial" ? "ft/in" : "cm"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <LengthField
          label="Width"
          valueIn={room.widthIn}
          units={units}
          onCommit={(widthIn) => setRoomSize({ widthIn })}
        />
        <LengthField
          label="Depth"
          valueIn={room.depthIn}
          units={units}
          onCommit={(depthIn) => setRoomSize({ depthIn })}
        />
        <LengthField
          label="Ceiling"
          valueIn={room.ceilingHeightIn}
          units={units}
          onCommit={(ceilingHeightIn) => setRoomSize({ ceilingHeightIn })}
        />
      </div>
      <p className="-mt-3 text-xs text-ink-400">
        Type <code className="text-ink-600">12</code>,{" "}
        <code className="text-ink-600">12&apos;6&quot;</code> or{" "}
        <code className="text-ink-600">380cm</code> — all understood.
      </p>

      <PhotoField photoDataUrl={room.photoDataUrl} onChange={setPhoto} />

      <div className="space-y-3">
        {(["doors", "windows"] as const).map((kind) => (
          <div key={kind}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wide text-ink-500">
                {kind}
              </h3>
              <button
                type="button"
                className="text-xs font-semibold text-accent hover:text-accent-400"
                onClick={() => addMarker(kind, "north")}
              >
                + Add
              </button>
            </div>
            <ul className="mt-2 space-y-2">
              {room[kind].map((marker) => (
                <li key={marker.id} className="flex items-center gap-2">
                  <select
                    className="field py-1.5 text-xs"
                    value={marker.wall}
                    onChange={(e) =>
                      updateMarker(kind, marker.id, {
                        wall: e.target.value as WallSide,
                      })
                    }
                    aria-label={`${kind} wall`}
                  >
                    {WALLS.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                  <input
                    className="field w-20 py-1.5 text-xs"
                    type="number"
                    min={0}
                    value={Math.round(marker.offsetIn)}
                    onChange={(e) =>
                      updateMarker(kind, marker.id, {
                        offsetIn: Number(e.target.value) || 0,
                      })
                    }
                    aria-label="offset in inches"
                  />
                  <input
                    className="field w-20 py-1.5 text-xs"
                    type="number"
                    min={1}
                    value={Math.round(marker.widthIn)}
                    onChange={(e) =>
                      updateMarker(kind, marker.id, {
                        widthIn: Number(e.target.value) || 1,
                      })
                    }
                    aria-label="width in inches"
                  />
                  <button
                    type="button"
                    className="px-1 text-ink-500 hover:text-danger"
                    onClick={() => removeMarker(kind, marker.id)}
                    aria-label={`Remove ${kind}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
              {room[kind].length === 0 && (
                <li className="text-xs text-ink-400">
                  None marked — optional, but they keep you from planning a rack
                  in front of the door.
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function LengthField({
  label,
  valueIn,
  units,
  onCommit,
}: {
  label: string;
  valueIn: number;
  units: UnitSystem;
  onCommit: (inches: number) => void;
}) {
  const display = () =>
    units === "metric"
      ? String(Math.round(inToCm(valueIn)))
      : formatFeetInches(valueIn);

  const [text, setText] = useState(display);
  const [invalid, setInvalid] = useState(false);

  // Re-sync when the value changes elsewhere (undo, loading a bundle, unit switch).
  useEffect(() => {
    setText(display());
    setInvalid(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueIn, units]);

  const commit = () => {
    const inches = parseLengthToInches(text, units);
    if (inches === null || inches <= 0) {
      setInvalid(true);
      setText(display());
      return;
    }
    setInvalid(false);
    onCommit(Math.round(inches * 10) / 10);
  };

  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-500">{label}</span>
      <input
        className={`field ${invalid ? "border-danger" : ""}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        inputMode="decimal"
      />
    </label>
  );
}

function PhotoField({
  photoDataUrl,
  onChange,
}: {
  photoDataUrl?: string;
  onChange: (dataUrl: string | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wide text-ink-500">
        Reference photo
      </h3>
      <p className="mt-1 text-xs text-ink-400">
        Optional. Stays on your device — nothing is uploaded.
      </p>
      <div className="mt-2 flex items-center gap-3">
        {photoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoDataUrl}
            alt="Your room"
            className="h-16 w-24 rounded-md border border-line-strong object-cover"
          />
        ) : (
          <div className="grid h-16 w-24 place-items-center rounded-md border border-dashed border-line-strong text-xs text-ink-400">
            No photo
          </div>
        )}
        <div className="space-y-1">
          <button
            type="button"
            className="btn-ghost px-3 py-1.5 text-xs"
            onClick={() => inputRef.current?.click()}
          >
            {photoDataUrl ? "Replace" : "Upload"}
          </button>
          {photoDataUrl && (
            <button
              type="button"
              className="block text-xs text-ink-500 hover:text-danger"
              onClick={() => onChange(undefined)}
            >
              Remove
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => onChange(String(reader.result));
          reader.readAsDataURL(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
