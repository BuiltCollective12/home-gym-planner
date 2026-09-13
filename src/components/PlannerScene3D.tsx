"use client";

import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Grid,
  Html,
  OrbitControls,
} from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { getEquipment } from "@/lib/catalog";
import { usePlannerStore } from "@/store/planner-store";
import { rotatedFootprint } from "@/lib/planner/geometry";
import { validatePlan, warningsByUid } from "@/lib/planner/warnings";
import type { PlacedItem, Room } from "@/lib/types";
import { EquipmentModel } from "./three/EquipmentModel";

/**
 * 3D walkthrough of the same plan.
 *
 * Units: 1 three.js unit = 1 foot, so a 12 ft room is 12 units across and the
 * camera distances stay intuitive. The store keeps everything in inches, so
 * every value is divided by 12 on the way in.
 *
 * The scene is centred on the room's middle, not its corner, so orbiting feels
 * like turning around inside the room rather than swinging around a pole.
 */

const IN = 1 / 12;

export default function PlannerScene3D() {
  const room = usePlannerStore((s) => s.room);
  const items = usePlannerStore((s) => s.items);
  const selectedUid = usePlannerStore((s) => s.selectedUid);
  const select = usePlannerStore((s) => s.select);

  const w = room.widthIn * IN;
  const d = room.depthIn * IN;
  const h = room.ceilingHeightIn * IN;

  const severityByUid = useMemo(
    () => warningsByUid(validatePlan(items, room, getEquipment)),
    [items, room],
  );

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [w * 0.62, h * 1.05, d * 0.78], fov: 50 }}
      onPointerMissed={() => select(null)}
    >
      <color attach="background" args={["#0E0E12"]} />
      <fog attach="fog" args={["#0E0E12", Math.max(w, d) * 2.2, Math.max(w, d) * 5]} />

      <hemisphereLight intensity={0.7} groundColor="#5E6068" />
      <directionalLight
        position={[w, h * 2.2, -d * 0.4]}
        intensity={1.25}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-Math.max(w, d)}
        shadow-camera-right={Math.max(w, d)}
        shadow-camera-top={Math.max(w, d)}
        shadow-camera-bottom={-Math.max(w, d)}
      />
      <directionalLight position={[-w, h, d]} intensity={0.4} />

      {/* Image-based lighting. Powder-coated steel and chrome only look like
          metal if there is something in the world for them to reflect. */}
      <Suspense fallback={null}>
        <Environment preset="warehouse" environmentIntensity={0.55} />
      </Suspense>

      {/* Everything is built from the room's north-west corner, then shifted so
          the room's centre sits at the origin. */}
      <group position={[-w / 2, 0, -d / 2]}>
        <RoomShell room={room} />

        {items.map((item) => (
          <PlacedItem3D
            key={item.uid}
            item={item}
            selected={item.uid === selectedUid}
            severity={severityByUid.get(item.uid)}
            onSelect={() => select(item.uid)}
            room={room}
          />
        ))}
      </group>

      <ContactShadows
        position={[0, 0.01, 0]}
        scale={Math.max(w, d) * 1.6}
        blur={2.2}
        opacity={0.5}
        far={h}
      />

      <OrbitControls
        makeDefault
        target={[0, h * 0.28, 0]}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={2}
        maxDistance={Math.max(w, d) * 3}
        enableDamping
      />
    </Canvas>
  );
}

function RoomShell({ room }: { room: Room }) {
  const w = room.widthIn * IN;
  const d = room.depthIn * IN;
  const h = room.ceilingHeightIn * IN;

  return (
    <group>
      {/* floor */}
      <mesh
        position={[w / 2, 0, d / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#7E8189" roughness={0.93} metalness={0} />
      </mesh>

      {/* one-foot grid, so scale stays readable */}
      <Grid
        position={[w / 2, 0.004, d / 2]}
        args={[w, d]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#8C8F97"
        sectionSize={5}
        sectionThickness={1.1}
        sectionColor="#A2A5AD"
        fadeDistance={Math.max(w, d) * 3}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={false}
      />

      {/* north and west walls only — leaving two sides open keeps the camera
          from ever being blocked while orbiting */}
      <mesh position={[w / 2, h / 2, 0]} receiveShadow>
        <boxGeometry args={[w, h, 0.08]} />
        <meshStandardMaterial color="#94969E" roughness={0.96} />
      </mesh>
      <mesh position={[0, h / 2, d / 2]} receiveShadow>
        <boxGeometry args={[0.08, h, d]} />
        <meshStandardMaterial color="#8A8C94" roughness={0.96} />
      </mesh>

      {room.doors.map((door) => (
        <MarkerPanel
          key={door.id}
          room={room}
          wall={door.wall}
          offsetIn={door.offsetIn}
          widthIn={door.widthIn}
          heightIn={80}
          color="#FF4D1C"
        />
      ))}
      {room.windows.map((win) => (
        <MarkerPanel
          key={win.id}
          room={room}
          wall={win.wall}
          offsetIn={win.offsetIn}
          widthIn={win.widthIn}
          heightIn={40}
          color="#5EC7F5"
          y={36 * IN}
        />
      ))}
    </group>
  );
}

function MarkerPanel({
  room,
  wall,
  offsetIn,
  widthIn,
  heightIn,
  color,
  y = 0,
}: {
  room: Room;
  wall: string;
  offsetIn: number;
  widthIn: number;
  heightIn: number;
  color: string;
  y?: number;
}) {
  const w = room.widthIn * IN;
  const d = room.depthIn * IN;
  const len = widthIn * IN;
  const tall = heightIn * IN;
  const along = offsetIn * IN;

  const props: { position: [number, number, number]; args: [number, number, number] } =
    wall === "north"
      ? { position: [along + len / 2, y + tall / 2, 0.06], args: [len, tall, 0.05] }
      : wall === "south"
        ? { position: [along + len / 2, y + tall / 2, d - 0.06], args: [len, tall, 0.05] }
        : wall === "west"
          ? { position: [0.06, y + tall / 2, along + len / 2], args: [0.05, tall, len] }
          : { position: [w - 0.06, y + tall / 2, along + len / 2], args: [0.05, tall, len] };

  return (
    <mesh position={props.position}>
      <boxGeometry args={props.args} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.25}
        roughness={0.7}
      />
    </mesh>
  );
}

/** Floor plane the drag raycast lands on. */
const FLOOR_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

function PlacedItem3D({
  item,
  selected,
  severity,
  onSelect,
  room,
}: {
  item: PlacedItem;
  selected: boolean;
  severity?: "error" | "warning";
  onSelect: () => void;
  room: Room;
}) {
  const equipment = getEquipment(item.equipmentId);
  // r3f types `controls` as a bare EventDispatcher; OrbitControls is what is
  // actually installed here via `makeDefault`, and it has `.enabled`.
  const controls = useThree((s) => s.controls) as unknown as
    | { enabled: boolean }
    | null;
  const moveItem = usePlannerStore((s) => s.moveItem);
  const commitMove = usePlannerStore((s) => s.commitMove);
  const pushHistory = usePlannerStore((s) => s.pushHistory);

  // Where inside the item the grab started, so it does not snap its centre to
  // the cursor the instant you press.
  const grabOffset = useRef(new THREE.Vector3());
  const hit = useRef(new THREE.Vector3());
  const dragging = useRef(false);

  if (!equipment) return null;

  const { widthIn, depthIn } = rotatedFootprint(equipment, item.rotation);
  const w = widthIn * IN;
  const d = depthIn * IN;
  const h = equipment.heightIn * IN;

  // Position is the footprint's top-left corner, so shift to its centre.
  const cx = (item.xIn + widthIn / 2) * IN;
  const cz = (item.yIn + depthIn / 2) * IN;

  // The whole plan is shifted so the room's centre sits at the origin; undo
  // that to turn a world-space hit back into room coordinates.
  const shiftX = (room.widthIn * IN) / 2;
  const shiftZ = (room.depthIn * IN) / 2;

  const highlight =
    severity === "error" ? "#FF3B3B" : severity === "warning" ? "#FFB020" : null;

  const endDrag = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging.current) return;
    dragging.current = false;
    if (controls) controls.enabled = true;
    (e.target as Element)?.releasePointerCapture?.(e.pointerId);
    commitMove(item.uid);
    document.body.style.cursor = "grab";
  };

  return (
    <group
      position={[cx, 0, cz]}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect();
        if (!e.ray.intersectPlane(FLOOR_PLANE, hit.current)) return;

        // Orbit and drag both use the left button, so the controls have to
        // stand down for the duration or the camera swings while you drag.
        if (controls) controls.enabled = false;
        pushHistory();
        grabOffset.current.set(
          hit.current.x - (cx - shiftX),
          0,
          hit.current.z - (cz - shiftZ),
        );
        dragging.current = true;
        (e.target as Element)?.setPointerCapture?.(e.pointerId);
        document.body.style.cursor = "grabbing";
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        e.stopPropagation();
        if (!e.ray.intersectPlane(FLOOR_PLANE, hit.current)) return;

        const centreX = hit.current.x - grabOffset.current.x + shiftX;
        const centreZ = hit.current.z - grabOffset.current.z + shiftZ;
        // Store keeps the top-left corner, in inches.
        moveItem(
          item.uid,
          centreX / IN - widthIn / 2,
          centreZ / IN - depthIn / 2,
        );
      }}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = dragging.current ? "grabbing" : "grab";
      }}
      onPointerOut={() => {
        if (!dragging.current) document.body.style.cursor = "default";
      }}
    >
      {/* Real geometry, built from this item's true dimensions in its own
          frame, then turned to face the way it is placed. Nothing is scaled
          afterwards — scaling a unit cube by (w, h, d) is what used to squash
          fan blades and flywheels into ellipses.

          Equipment keeps its own colour even when flagged: tinting the whole
          model red turns the room into a wall of error markers, so the warning
          reads on the floor ring instead. */}
      <group rotation={[0, (-item.rotation * Math.PI) / 180, 0]}>
        <EquipmentModel equipment={equipment} />
      </group>

      {/* Grounding shadow — the strongest cue that a thing is standing in the
          room rather than hovering over it. */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w * 1.15, d * 1.15]} />
        <meshBasicMaterial
          color="#101018"
          transparent
          opacity={0.32}
          depthWrite={false}
        />
      </mesh>

      {(selected || highlight) && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.max(w, d) * 0.52, Math.max(w, d) * 0.6, 32]} />
          <meshBasicMaterial
            color={highlight ?? "#FF4D1C"}
            transparent
            opacity={0.85}
          />
        </mesh>
      )}

      {selected && (
        <Html
          position={[0, h + 0.35, 0]}
          center
          distanceFactor={12}
          occlude={false}
        >
          <div className="whitespace-nowrap rounded-md bg-ink-900/95 px-2 py-1 text-[11px] font-semibold text-white shadow-lg">
            {equipment.name}
          </div>
        </Html>
      )}
    </group>
  );
}
