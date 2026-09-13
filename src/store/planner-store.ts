"use client";

import { create } from "zustand";
import { getEquipment } from "@/lib/catalog";
import { siteConfig } from "@/lib/site.config";
import { track } from "@/lib/analytics";
import type { Marker, PlacedItem, Plan, Room, Rotation, WallSide } from "@/lib/types";
import { normalizeRotation, rotatedFootprint, snapPosition } from "@/lib/planner/geometry";
import { findFreeSpot, newUid } from "@/lib/planner/placement";
import type { UnitSystem } from "@/lib/units";

/**
 * Planner state.
 *
 * All geometry decisions live in `@/lib/planner/*` pure functions; this store
 * only sequences them and keeps the undo/redo stacks.
 */

type Snapshot = { room: Room; items: PlacedItem[] };

const HISTORY_LIMIT = 50;

const defaultRoom = (): Room => ({
  ...siteConfig.defaultRoom,
  doors: [],
  windows: [],
});

type PlannerState = {
  room: Room;
  items: PlacedItem[];
  selectedUid: string | null;
  units: UnitSystem;
  gridIn: number;
  snapEnabled: boolean;
  showClearance: boolean;
  view: "2d" | "3d";
  past: Snapshot[];
  future: Snapshot[];

  // history
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // room
  setRoomSize: (patch: Partial<Pick<Room, "widthIn" | "depthIn" | "ceilingHeightIn">>) => void;
  setPhoto: (dataUrl: string | undefined) => void;
  addMarker: (kind: "doors" | "windows", wall: WallSide) => void;
  updateMarker: (kind: "doors" | "windows", id: string, patch: Partial<Marker>) => void;
  removeMarker: (kind: "doors" | "windows", id: string) => void;

  // items
  addItem: (equipmentId: string) => void;
  moveItem: (uid: string, xIn: number, yIn: number) => void;
  commitMove: (uid: string) => void;
  rotateItem: (uid: string, delta?: number) => void;
  removeItem: (uid: string) => void;
  duplicateItem: (uid: string) => void;
  select: (uid: string | null) => void;
  clearPlan: () => void;

  // plan
  loadPlan: (plan: Plan, options?: { source?: string }) => void;
  toPlan: () => Plan;

  // view prefs
  setUnits: (units: UnitSystem) => void;
  setGrid: (gridIn: number) => void;
  setSnapEnabled: (enabled: boolean) => void;
  setShowClearance: (show: boolean) => void;
  setView: (view: "2d" | "3d") => void;
};

export const usePlannerStore = create<PlannerState>((set, get) => ({
  room: defaultRoom(),
  items: [],
  selectedUid: null,
  units: "imperial",
  gridIn: siteConfig.gridIn,
  snapEnabled: true,
  showClearance: true,
  view: "2d",
  past: [],
  future: [],

  pushHistory: () =>
    set((s) => ({
      past: [...s.past, { room: s.room, items: s.items }].slice(-HISTORY_LIMIT),
      future: [],
    })),

  undo: () =>
    set((s) => {
      const previous = s.past[s.past.length - 1];
      if (!previous) return s;
      return {
        past: s.past.slice(0, -1),
        future: [{ room: s.room, items: s.items }, ...s.future].slice(0, HISTORY_LIMIT),
        room: previous.room,
        items: previous.items,
        selectedUid: previous.items.some((i) => i.uid === s.selectedUid)
          ? s.selectedUid
          : null,
      };
    }),

  redo: () =>
    set((s) => {
      const next = s.future[0];
      if (!next) return s;
      return {
        past: [...s.past, { room: s.room, items: s.items }].slice(-HISTORY_LIMIT),
        future: s.future.slice(1),
        room: next.room,
        items: next.items,
        selectedUid: next.items.some((i) => i.uid === s.selectedUid)
          ? s.selectedUid
          : null,
      };
    }),

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  setRoomSize: (patch) => {
    get().pushHistory();
    set((s) => {
      const room = { ...s.room, ...patch };
      // Shrinking the room must not leave items floating outside it.
      const items = s.items.map((item) => {
        const equipment = getEquipment(item.equipmentId);
        if (!equipment) return item;
        const size = rotatedFootprint(equipment, item.rotation);
        const { xIn, yIn } = snapPosition(item, size, room, 0);
        return xIn === item.xIn && yIn === item.yIn ? item : { ...item, xIn, yIn };
      });
      return { room, items };
    });
  },

  setPhoto: (dataUrl) => set((s) => ({ room: { ...s.room, photoDataUrl: dataUrl } })),

  addMarker: (kind, wall) => {
    get().pushHistory();
    set((s) => ({
      room: {
        ...s.room,
        [kind]: [
          ...s.room[kind],
          { id: newUid(), wall, offsetIn: 12, widthIn: kind === "doors" ? 36 : 48 },
        ],
      },
    }));
  },

  updateMarker: (kind, id, patch) =>
    set((s) => ({
      room: {
        ...s.room,
        [kind]: s.room[kind].map((m) => (m.id === id ? { ...m, ...patch } : m)),
      },
    })),

  removeMarker: (kind, id) => {
    get().pushHistory();
    set((s) => ({
      room: { ...s.room, [kind]: s.room[kind].filter((m) => m.id !== id) },
    }));
  },

  addItem: (equipmentId) => {
    const equipment = getEquipment(equipmentId);
    if (!equipment) return;
    const { items, room, gridIn, snapEnabled } = get();
    const spot = findFreeSpot(
      equipment,
      0,
      items,
      room,
      getEquipment,
      snapEnabled ? gridIn : 6,
    );
    const item: PlacedItem = { uid: newUid(), equipmentId, ...spot, rotation: 0 };
    get().pushHistory();
    set((s) => ({ items: [...s.items, item], selectedUid: item.uid }));
    track({
      name: "plan_item_added",
      equipmentId,
      category: equipment.category,
    });
    if (items.length === 0) {
      track({
        name: "plan_created",
        roomSqft: Math.round((room.widthIn * room.depthIn) / 144),
      });
    }
  },

  /** Live drag update — deliberately does not touch history. */
  moveItem: (uid, xIn, yIn) =>
    set((s) => ({
      items: s.items.map((i) => (i.uid === uid ? { ...i, xIn, yIn } : i)),
    })),

  /** Called on drag end: snap to the grid and clamp inside the room. */
  commitMove: (uid) =>
    set((s) => ({
      items: s.items.map((item) => {
        if (item.uid !== uid) return item;
        const equipment = getEquipment(item.equipmentId);
        if (!equipment) return item;
        const size = rotatedFootprint(equipment, item.rotation);
        const snapped = snapPosition(
          item,
          size,
          s.room,
          s.snapEnabled ? s.gridIn : 0,
        );
        return { ...item, ...snapped };
      }),
    })),

  rotateItem: (uid, delta = 90) => {
    get().pushHistory();
    set((s) => ({
      items: s.items.map((item) => {
        if (item.uid !== uid) return item;
        const rotation = normalizeRotation(item.rotation + delta) as Rotation;
        const equipment = getEquipment(item.equipmentId);
        if (!equipment) return { ...item, rotation };
        const size = rotatedFootprint(equipment, rotation);
        const snapped = snapPosition(
          item,
          size,
          s.room,
          s.snapEnabled ? s.gridIn : 0,
        );
        return { ...item, rotation, ...snapped };
      }),
    }));
  },

  removeItem: (uid) => {
    get().pushHistory();
    set((s) => ({
      items: s.items.filter((i) => i.uid !== uid),
      selectedUid: s.selectedUid === uid ? null : s.selectedUid,
    }));
  },

  duplicateItem: (uid) => {
    const source = get().items.find((i) => i.uid === uid);
    if (!source) return;
    const equipment = getEquipment(source.equipmentId);
    if (!equipment) return;
    const { items, room, gridIn, snapEnabled } = get();
    const spot = findFreeSpot(
      equipment,
      source.rotation,
      items,
      room,
      getEquipment,
      snapEnabled ? gridIn : 6,
    );
    const copy: PlacedItem = { ...source, uid: newUid(), ...spot };
    get().pushHistory();
    set((s) => ({ items: [...s.items, copy], selectedUid: copy.uid }));
  },

  select: (uid) => set({ selectedUid: uid }),

  clearPlan: () => {
    get().pushHistory();
    set({ items: [], selectedUid: null });
  },

  loadPlan: (plan) => {
    get().pushHistory();
    set((s) => ({
      room: { ...plan.room, photoDataUrl: s.room.photoDataUrl },
      items: plan.items.map((i) => ({ ...i, uid: newUid() })),
      selectedUid: null,
    }));
  },

  toPlan: () => ({ room: get().room, items: get().items }),

  setUnits: (units) => set({ units }),
  setGrid: (gridIn) => set({ gridIn }),
  setSnapEnabled: (snapEnabled) => set({ snapEnabled }),
  setShowClearance: (showClearance) => set({ showClearance }),
  setView: (view) => {
    set({ view });
    track({ name: "view_toggled", view });
  },
}));
