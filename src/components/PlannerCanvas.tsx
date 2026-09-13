"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Group, Layer, Line, Rect, Stage, Text } from "react-konva";
import type Konva from "konva";
import { getEquipment } from "@/lib/catalog";
import { usePlannerStore } from "@/store/planner-store";
import {
  clearanceRect,
  footprintRect,
  hasClearance,
  rotatedFootprint,
} from "@/lib/planner/geometry";
import { validatePlan, warningsByUid } from "@/lib/planner/warnings";
import type { Marker, PlacedItem, Room } from "@/lib/types";

/**
 * Top-down 2D plan.
 *
 * Konva works in screen pixels, so every draw multiplies inches by `scale`.
 * The store stays in inches; nothing here writes pixel values back to it.
 */

const PADDING = 28;

const CATEGORY_FILL: Record<string, string> = {
  racks: "#4E6191",
  barbells: "#5F5F6E",
  plates: "#6E5C7C",
  dumbbells: "#52766C",
  benches: "#775D48",
  machines: "#43647A",
  cardio: "#784E5D",
  flooring: "#35353E",
  storage: "#55614A",
  accessories: "#63544A",
};

/**
 * Canvas colours, kept in step with the Tailwind `canvas.*` tokens. The planner
 * stays dark inside a light site so equipment and warning colours pop; the floor
 * sits a step above the surrounding `canvas.DEFAULT` so the room reads as a
 * distinct surface rather than a hole.
 */
const CANVAS = {
  floor: "#8E9099",
  gridMajor: "#6E7079",
  gridMinor: "#7E808A",
  wall: "#3A3A44",
  itemStroke: "#2B2B34",
  label: "#FFFFFF",
};

export default function PlannerCanvas() {
  const room = usePlannerStore((s) => s.room);
  const items = usePlannerStore((s) => s.items);
  const selectedUid = usePlannerStore((s) => s.selectedUid);
  const gridIn = usePlannerStore((s) => s.gridIn);
  const showClearance = usePlannerStore((s) => s.showClearance);
  const select = usePlannerStore((s) => s.select);
  const moveItem = usePlannerStore((s) => s.moveItem);
  const commitMove = usePlannerStore((s) => s.commitMove);
  const pushHistory = usePlannerStore((s) => s.pushHistory);

  const containerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setBox({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scale = useMemo(() => {
    if (box.width === 0 || box.height === 0) return 0;
    return Math.min(
      (box.width - PADDING * 2) / room.widthIn,
      (box.height - PADDING * 2) / room.depthIn,
    );
  }, [box, room.widthIn, room.depthIn]);

  const warnings = useMemo(
    () => validatePlan(items, room, getEquipment),
    [items, room],
  );
  const severityByUid = useMemo(() => warningsByUid(warnings), [warnings]);

  const originX = (box.width - room.widthIn * scale) / 2;
  const originY = (box.height - room.depthIn * scale) / 2;

  return (
    <div ref={containerRef} className="h-full w-full">
      {scale > 0 && (
        <Stage
          width={box.width}
          height={box.height}
          onMouseDown={(e) => {
            if (e.target === e.target.getStage()) select(null);
          }}
          onTouchStart={(e) => {
            if (e.target === e.target.getStage()) select(null);
          }}
        >
          <Layer x={originX} y={originY} listening={false}>
            <RoomFloor room={room} scale={scale} gridIn={gridIn} />
          </Layer>

          <Layer x={originX} y={originY}>
            {items.map((item) => (
              <PlacedItemShape
                key={item.uid}
                item={item}
                scale={scale}
                selected={item.uid === selectedUid}
                severity={severityByUid.get(item.uid)}
                showClearance={showClearance}
                onSelect={() => select(item.uid)}
                onDragStart={() => {
                  select(item.uid);
                  pushHistory();
                }}
                onDragMove={(xIn, yIn) => moveItem(item.uid, xIn, yIn)}
                onDragEnd={() => commitMove(item.uid)}
              />
            ))}
          </Layer>

          <Layer x={originX} y={originY} listening={false}>
            <RoomWalls room={room} scale={scale} />
          </Layer>
        </Stage>
      )}
    </div>
  );
}

function RoomFloor({
  room,
  scale,
  gridIn,
}: {
  room: Room;
  scale: number;
  gridIn: number;
}) {
  const w = room.widthIn * scale;
  const h = room.depthIn * scale;

  // Draw the fine grid only while it stays readable; always draw foot lines.
  const showFine = gridIn * scale >= 7;
  const lines: React.ReactNode[] = [];
  const push = (key: string, points: number[], major: boolean) =>
    lines.push(
      <Line
        key={key}
        points={points}
        stroke={major ? CANVAS.gridMajor : CANVAS.gridMinor}
        strokeWidth={major ? 1 : 0.5}
      />,
    );

  for (let x = 0; x <= room.widthIn; x += gridIn) {
    const major = x % 12 === 0;
    if (major || showFine) push(`vx${x}`, [x * scale, 0, x * scale, h], major);
  }
  for (let y = 0; y <= room.depthIn; y += gridIn) {
    const major = y % 12 === 0;
    if (major || showFine) push(`hz${y}`, [0, y * scale, w, y * scale], major);
  }

  return (
    <Group>
      <Rect width={w} height={h} fill={CANVAS.floor} cornerRadius={2} />
      {lines}
    </Group>
  );
}

function RoomWalls({ room, scale }: { room: Room; scale: number }) {
  const w = room.widthIn * scale;
  const h = room.depthIn * scale;
  return (
    <Group>
      <Rect width={w} height={h} stroke={CANVAS.wall} strokeWidth={3} />
      {room.doors.map((d) => (
        <MarkerShape key={d.id} marker={d} room={room} scale={scale} color="#FF4D1C" />
      ))}
      {room.windows.map((m) => (
        <MarkerShape key={m.id} marker={m} room={room} scale={scale} color="#5EC7F5" />
      ))}
    </Group>
  );
}

function MarkerShape({
  marker,
  room,
  scale,
  color,
}: {
  marker: Marker;
  room: Room;
  scale: number;
  color: string;
}) {
  const thickness = 6;
  const along = marker.offsetIn * scale;
  const length = marker.widthIn * scale;
  const w = room.widthIn * scale;
  const h = room.depthIn * scale;

  const props =
    marker.wall === "north"
      ? { x: along, y: -thickness / 2, width: length, height: thickness }
      : marker.wall === "south"
        ? { x: along, y: h - thickness / 2, width: length, height: thickness }
        : marker.wall === "west"
          ? { x: -thickness / 2, y: along, width: thickness, height: length }
          : { x: w - thickness / 2, y: along, width: thickness, height: length };

  return <Rect {...props} fill={color} cornerRadius={2} />;
}

function PlacedItemShape({
  item,
  scale,
  selected,
  severity,
  showClearance,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  item: PlacedItem;
  scale: number;
  selected: boolean;
  severity?: "error" | "warning";
  showClearance: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onDragMove: (xIn: number, yIn: number) => void;
  onDragEnd: () => void;
}) {
  const equipment = getEquipment(item.equipmentId);
  if (!equipment) return null;

  const rect = footprintRect(item, equipment);
  const zone = clearanceRect(item, equipment);
  const { widthIn, depthIn } = rotatedFootprint(equipment, item.rotation);

  const stroke = selected
    ? "#FF4D1C"
    : severity === "error"
      ? "#FF3B3B"
      : severity === "warning"
        ? "#FFB020"
        : CANVAS.itemStroke;

  const isFlooring = equipment.category === "flooring";
  const w = widthIn * scale;
  const h = depthIn * scale;
  const label = equipment.name;
  // Below ~52px there is no room for text without it spilling out of the shape.
  const labelSize = Math.min(12, Math.max(9, h / 5));
  const showLabel = w > 52 && h > 22;

  return (
    <Group
      x={rect.x * scale}
      y={rect.y * scale}
      draggable
      onDragStart={onDragStart}
      onDragMove={(e: Konva.KonvaEventObject<DragEvent>) => {
        const node = e.target;
        onDragMove(node.x() / scale, node.y() / scale);
      }}
      onDragEnd={onDragEnd}
      onMouseDown={onSelect}
      onTouchStart={onSelect}
      onMouseEnter={(e) => {
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = "move";
      }}
      onMouseLeave={(e) => {
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = "default";
      }}
    >
      {showClearance && hasClearance(equipment) && (
        <Rect
          x={(zone.x - rect.x) * scale}
          y={(zone.y - rect.y) * scale}
          width={zone.w * scale}
          height={zone.h * scale}
          fill="rgba(255,77,28,0.06)"
          stroke="rgba(255,77,28,0.35)"
          strokeWidth={1}
          dash={[4, 4]}
          listening={false}
        />
      )}

      <Rect
        width={w}
        height={h}
        fill={CATEGORY_FILL[equipment.category] ?? "#4A4A57"}
        opacity={isFlooring ? 0.55 : 0.95}
        stroke={stroke}
        strokeWidth={selected ? 2.5 : 1.5}
        cornerRadius={isFlooring ? 1 : 3}
      />

      {showLabel && (
        <Text
          text={label}
          x={5}
          y={5}
          width={w - 10}
          // Clip to two lines. Long product names otherwise wrap into a block
          // of text that fills the whole shape and hides the item under it.
          height={Math.min(h - 10, labelSize * 2.5)}
          fontSize={labelSize}
          fontStyle="600"
          fill={CANVAS.label}
          ellipsis
          wrap="word"
          listening={false}
        />
      )}
    </Group>
  );
}
