"use client";

import type { Equipment } from "@/lib/types";

/**
 * Per-machine geometry, built from each item's real dimensions.
 *
 * This is the honest answer to "make it 3D". Photographs cannot be turned into
 * volume — but we already hold accurate width, depth and height for every item,
 * and the listing photos show how each machine is actually put together. So the
 * models are built parametrically from those real measurements and shaped to
 * match the product: four uprights and a pull-up bar for a rack, twin towers
 * with weight stacks for a functional trainer, a flywheel and rail for a rower.
 *
 * Everything below is authored in FEET, in the item's own frame:
 *   x = width (left-right), y = height (up), z = depth (front at -z)
 * and the caller rotates the whole group. Nothing is scaled afterwards, so
 * round parts stay round — scaling a unit cube by (w,h,d) is what turned fan
 * blades into ellipses in the previous version.
 */

const IN = 1 / 12;

/* --------------------------------------------------------------- palette -- */

const BLACK = "#191A1F";
const STEEL = "#33363E";
const CHROME = "#B9BFC9";
const PAD = "#1E2027";
const RUBBER = "#141519";
const ACCENT = "#D8442A";
const STACK = "#242730";

type MatProps = { color: string; metalness?: number; roughness?: number };

const matte = (color: string): MatProps => ({
  color,
  metalness: 0.35,
  roughness: 0.62,
});
const metal = (color: string): MatProps => ({
  color,
  metalness: 0.85,
  roughness: 0.28,
});
const soft = (color: string): MatProps => ({
  color,
  metalness: 0.05,
  roughness: 0.9,
});

/* ------------------------------------------------------------- primitives -- */

function Box({
  size,
  pos,
  mat = matte(STEEL),
  rot,
}: {
  size: [number, number, number];
  pos: [number, number, number];
  mat?: MatProps;
  rot?: [number, number, number];
}) {
  return (
    <mesh position={pos} rotation={rot} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial {...mat} />
    </mesh>
  );
}

function Tube({
  radius,
  length,
  pos,
  axis = "y",
  mat = metal(CHROME),
  segments = 14,
}: {
  radius: number;
  length: number;
  pos: [number, number, number];
  axis?: "x" | "y" | "z";
  mat?: MatProps;
  segments?: number;
}) {
  const rot: [number, number, number] =
    axis === "x"
      ? [0, 0, Math.PI / 2]
      : axis === "z"
        ? [Math.PI / 2, 0, 0]
        : [0, 0, 0];
  return (
    <mesh position={pos} rotation={rot} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, length, segments]} />
      <meshStandardMaterial {...mat} />
    </mesh>
  );
}

function Disc({
  radius,
  thickness,
  pos,
  axis = "z",
  mat = soft(RUBBER),
  segments = 28,
}: {
  radius: number;
  thickness: number;
  pos: [number, number, number];
  axis?: "x" | "y" | "z";
  mat?: MatProps;
  segments?: number;
}) {
  return <Tube radius={radius} length={thickness} pos={pos} axis={axis} mat={mat} segments={segments} />;
}

/* -------------------------------------------------------------- archetype -- */

export type Archetype =
  | "power-rack"
  | "squat-stand"
  | "folding-rack"
  | "bench-press-stand"
  | "bench"
  | "barbell"
  | "plate-set"
  | "dumbbell-pair"
  | "dumbbell-rack-set"
  | "functional-trainer"
  | "smith-machine"
  | "lat-pulldown"
  | "leg-press"
  | "belt-squat"
  | "ghd"
  | "home-gym-stack"
  | "treadmill"
  | "air-bike"
  | "spin-bike"
  | "rower"
  | "plate-tree"
  | "dumbbell-rack"
  | "bar-holder-vertical"
  | "bar-holder-wall"
  | "shelving"
  | "dip-bar"
  | "plyo-box"
  | "kettlebells"
  | "bands"
  | "mirror"
  | "fan"
  | "speaker"
  | "light-bar"
  | "light-strip"
  | "flooring";

const has = (e: Equipment, ...t: string[]) =>
  t.some((tag) => e.tags.includes(tag));

export function archetypeFor(e: Equipment): Archetype {
  switch (e.category) {
    case "racks":
      if (has(e, "bench press")) return "bench-press-stand";
      if (has(e, "folding", "wall mount")) return "folding-rack";
      if (has(e, "squat stand")) return "squat-stand";
      return "power-rack";
    case "barbells":
      return "barbell";
    case "plates":
      return "plate-set";
    case "dumbbells":
      return has(e, "with rack", "full set") ? "dumbbell-rack-set" : "dumbbell-pair";
    case "benches":
      return "bench";
    case "machines":
      if (has(e, "smith machine")) return "smith-machine";
      if (has(e, "functional trainer", "cable", "crossover", "pulley"))
        return "functional-trainer";
      if (has(e, "lat pulldown")) return "lat-pulldown";
      if (has(e, "leg press", "hack squat")) return "leg-press";
      if (has(e, "belt squat")) return "belt-squat";
      if (has(e, "ghd")) return "ghd";
      return "home-gym-stack";
    case "cardio":
      if (has(e, "treadmill")) return "treadmill";
      if (has(e, "air bike")) return "air-bike";
      if (has(e, "rower")) return "rower";
      return "spin-bike";
    case "flooring":
      return "flooring";
    case "audio":
      return "speaker";
    case "lighting":
      return has(e, "strip") ? "light-strip" : "light-bar";
    case "storage":
      if (has(e, "plate storage", "tree")) return "plate-tree";
      if (has(e, "dumbbell rack")) return "dumbbell-rack";
      if (has(e, "wall mount")) return "bar-holder-wall";
      if (has(e, "barbell storage")) return "bar-holder-vertical";
      return "shelving";
    default:
      if (has(e, "dip")) return "dip-bar";
      if (has(e, "plyo box")) return "plyo-box";
      if (has(e, "kettlebell")) return "kettlebells";
      if (has(e, "bands")) return "bands";
      if (has(e, "mirror")) return "mirror";
      if (has(e, "fan")) return "fan";
      return "plyo-box";
  }
}

/* ------------------------------------------------------------------ model -- */

export function EquipmentModel({ equipment }: { equipment: Equipment }) {
  const w = equipment.widthIn * IN;
  const d = equipment.depthIn * IN;
  const h = equipment.heightIn * IN;
  const a = archetypeFor(equipment);

  switch (a) {
    case "power-rack":
      return <PowerRack w={w} d={d} h={h} posts={4} />;
    case "squat-stand":
      return <PowerRack w={w} d={d} h={h} posts={2} />;
    case "folding-rack":
      return <FoldingRack w={w} d={d} h={h} />;
    case "bench-press-stand":
      return <BenchPressStand w={w} d={d} h={h} />;
    case "bench":
      return <Bench w={w} d={d} h={h} />;
    case "barbell":
      return <Barbell w={w} h={h} />;
    case "plate-set":
      return <PlateSet w={w} d={d} h={h} />;
    case "dumbbell-pair":
      return <DumbbellPair w={w} d={d} h={h} />;
    case "dumbbell-rack-set":
      return <DumbbellRack w={w} d={d} h={h} loaded />;
    case "dumbbell-rack":
      return <DumbbellRack w={w} d={d} h={h} />;
    case "functional-trainer":
      return <FunctionalTrainer w={w} d={d} h={h} />;
    case "smith-machine":
      return <SmithMachine w={w} d={d} h={h} />;
    case "lat-pulldown":
      return <LatPulldown w={w} d={d} h={h} />;
    case "leg-press":
      return <LegPress w={w} d={d} h={h} />;
    case "belt-squat":
      return <BeltSquat w={w} d={d} h={h} />;
    case "ghd":
      return <Ghd w={w} d={d} h={h} />;
    case "home-gym-stack":
      return <HomeGymStack w={w} d={d} h={h} />;
    case "treadmill":
      return <Treadmill w={w} d={d} h={h} />;
    case "air-bike":
      return <AirBike w={w} d={d} h={h} />;
    case "spin-bike":
      return <SpinBike w={w} d={d} h={h} />;
    case "rower":
      return <Rower w={w} d={d} h={h} />;
    case "plate-tree":
      return <PlateTree w={w} d={d} h={h} />;
    case "bar-holder-vertical":
      return <BarHolderVertical w={w} d={d} h={h} />;
    case "bar-holder-wall":
      return <BarHolderWall w={w} d={d} h={h} />;
    case "shelving":
      return <Shelving w={w} d={d} h={h} />;
    case "dip-bar":
      return <DipBar w={w} d={d} h={h} />;
    case "plyo-box":
      return <PlyoBox w={w} d={d} h={h} />;
    case "kettlebells":
      return <Kettlebells w={w} d={d} h={h} />;
    case "bands":
      return <Bands w={w} d={d} h={h} />;
    case "mirror":
      return <Mirror w={w} d={d} h={h} />;
    case "fan":
      return <Fan w={w} d={d} h={h} />;
    case "speaker":
      return <Speaker w={w} d={d} h={h} />;
    case "light-bar":
      return <LightBar w={w} d={d} h={h} />;
    case "light-strip":
      return <LightStrip w={w} d={d} h={h} />;
    case "flooring":
      return <Flooring w={w} d={d} h={h} />;
  }
}

type Dim = { w: number; d: number; h: number };

/* ------------------------------------------------------------------ racks -- */

function PowerRack({ w, d, h, posts }: Dim & { posts: 2 | 4 }) {
  const p = 3 * IN; // 3x3 upright
  const x = w / 2 - p / 2;
  const zBack = d / 2 - p / 2;
  const zFront = -(d / 2) + p / 2;
  const legs: [number, number][] =
    posts === 4
      ? [
          [-x, zBack],
          [x, zBack],
          [-x, zFront],
          [x, zFront],
        ]
      : [
          [-x, 0],
          [x, 0],
        ];

  return (
    <group>
      {legs.map(([lx, lz], i) => (
        <Box key={i} size={[p, h, p]} pos={[lx, h / 2, lz]} mat={matte(BLACK)} />
      ))}

      {/* flat-foot base rails */}
      {legs.map(([lx, lz], i) => (
        <Box
          key={`f${i}`}
          size={[p * 1.2, 1.6 * IN, d * 0.9]}
          pos={[lx, 0.8 * IN, posts === 4 ? lz * 0.15 : 0]}
          mat={matte(BLACK)}
        />
      ))}

      {/* top crossmembers */}
      <Box size={[w, p, p]} pos={[0, h - p / 2, zBack]} mat={matte(BLACK)} />
      {posts === 4 && (
        <Box size={[w, p, p]} pos={[0, h - p / 2, zFront]} mat={matte(BLACK)} />
      )}

      {/* pull-up bar spanning the front */}
      <Tube
        radius={0.6 * IN}
        length={w - p}
        pos={[0, h - 5 * IN, posts === 4 ? zFront : 0]}
        axis="x"
      />

      {/* J-hooks at working height */}
      {[-x, x].map((lx, i) => (
        <group key={`j${i}`}>
          <Box
            size={[2.2 * IN, 3 * IN, 2.2 * IN]}
            pos={[lx, h * 0.52, zBack - 1.5 * IN]}
            mat={matte(ACCENT)}
          />
        </group>
      ))}

      {/* safety spotter arms */}
      {posts === 4 &&
        [-x, x].map((lx, i) => (
          <Box
            key={`s${i}`}
            size={[2 * IN, 2 * IN, d - p]}
            pos={[lx, h * 0.35, 0]}
            mat={matte(STEEL)}
          />
        ))}
    </group>
  );
}

function FoldingRack({ w, d, h }: Dim) {
  const p = 3 * IN;
  const x = w / 2 - p / 2;
  return (
    <group>
      {/* wall-mounted back panel */}
      <Box size={[w, h, 1.5 * IN]} pos={[0, h / 2, d / 2]} mat={matte(STEEL)} />
      {[-x, x].map((lx, i) => (
        <Box key={i} size={[p, h * 0.94, p]} pos={[lx, h * 0.47, -d / 2 + p]} mat={matte(BLACK)} />
      ))}
      <Tube radius={0.6 * IN} length={w - p} pos={[0, h - 4 * IN, -d / 2 + p]} axis="x" />
      {[-x, x].map((lx, i) => (
        <Box key={`j${i}`} size={[2.2 * IN, 3 * IN, 2.2 * IN]} pos={[lx, h * 0.52, -d / 2 + p]} mat={matte(ACCENT)} />
      ))}
    </group>
  );
}

function BenchPressStand({ w, d, h }: Dim) {
  const x = w / 2 - 2 * IN;
  return (
    <group>
      {[-x, x].map((lx, i) => (
        <group key={i}>
          <Box size={[2.5 * IN, h, 2.5 * IN]} pos={[lx, h / 2, 0]} mat={matte(BLACK)} />
          <Box size={[4 * IN, 1.5 * IN, d]} pos={[lx, 0.75 * IN, 0]} mat={matte(BLACK)} />
          <Box size={[3 * IN, 2.5 * IN, 3 * IN]} pos={[lx, h - 3 * IN, 0]} mat={matte(ACCENT)} />
        </group>
      ))}
    </group>
  );
}

/* ---------------------------------------------------------------- benches -- */

function Bench({ w, d, h }: Dim) {
  const padH = 3 * IN;
  const seatY = h - padH / 2;
  return (
    <group>
      {/* back pad, slightly inclined */}
      <Box
        size={[w * 0.8, padH, d * 0.5]}
        pos={[0, seatY + 1.2 * IN, -d * 0.22]}
        rot={[-0.16, 0, 0]}
        mat={soft(PAD)}
      />
      {/* seat pad */}
      <Box size={[w * 0.8, padH, d * 0.4]} pos={[0, seatY, d * 0.24]} mat={soft(PAD)} />
      {/* central spine */}
      <Box size={[2.5 * IN, h - padH, d * 0.55]} pos={[0, (h - padH) / 2, 0]} mat={matte(BLACK)} />
      {/* front and rear feet */}
      {[-d / 2 + 2 * IN, d / 2 - 2 * IN].map((z, i) => (
        <group key={i}>
          <Box size={[w * 0.9, 1.6 * IN, 2.5 * IN]} pos={[0, 0.8 * IN, z]} mat={matte(BLACK)} />
          <Box size={[2.2 * IN, h * 0.55, 2.2 * IN]} pos={[0, h * 0.28, z]} mat={matte(BLACK)} />
        </group>
      ))}
    </group>
  );
}

/* --------------------------------------------------------- bars & plates -- */

function Barbell({ w, h }: { w: number; h: number }) {
  const r = Math.max(h / 2, 0.6 * IN);
  const sleeve = 16 * IN;
  return (
    <group position={[0, r + 1 * IN, 0]}>
      <Tube radius={r * 0.55} length={w - sleeve * 2} pos={[0, 0, 0]} axis="x" />
      {[-1, 1].map((s) => (
        <Tube
          key={s}
          radius={r}
          length={sleeve}
          pos={[s * (w / 2 - sleeve / 2), 0, 0]}
          axis="x"
          mat={metal(STEEL)}
        />
      ))}
    </group>
  );
}

function PlateSet({ w, d, h }: Dim) {
  const r = Math.min(w, d) / 2;
  const count = Math.max(3, Math.round(h / (2.5 * IN)));
  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <Disc
          key={i}
          radius={r * (i < count * 0.6 ? 1 : 0.72)}
          thickness={2.2 * IN}
          pos={[0, r, -d / 2 + 2 * IN + i * ((d - 4 * IN) / Math.max(count - 1, 1))]}
          axis="z"
        />
      ))}
    </group>
  );
}

/* -------------------------------------------------------------- dumbbells -- */

function DumbbellPair({ w, d, h }: Dim) {
  const r = h / 2;
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * w * 0.24, r, 0]}>
          <Tube radius={r * 0.28} length={d * 0.55} pos={[0, 0, 0]} axis="z" mat={metal(CHROME)} />
          {[-1, 1].map((e) => (
            <Disc
              key={e}
              radius={r}
              thickness={d * 0.2}
              pos={[0, 0, e * d * 0.32]}
              axis="z"
              segments={6}
            />
          ))}
        </group>
      ))}
    </group>
  );
}

function DumbbellRack({ w, d, h, loaded }: Dim & { loaded?: boolean }) {
  const tiers = 3;
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s}>
          <Box size={[2.5 * IN, h, 2.5 * IN]} pos={[s * (w / 2 - 2 * IN), h / 2, d / 2 - 2 * IN]} mat={matte(BLACK)} />
          <Box size={[2.5 * IN, h * 0.55, 2.5 * IN]} pos={[s * (w / 2 - 2 * IN), h * 0.28, -d / 2 + 2 * IN]} mat={matte(BLACK)} />
        </group>
      ))}
      {Array.from({ length: tiers }, (_, t) => {
        const y = h * (0.22 + t * 0.3);
        const z = -d / 2 + 3 * IN + t * ((d - 6 * IN) / tiers);
        return (
          <group key={t}>
            <Box size={[w - 3 * IN, 1.4 * IN, 4 * IN]} pos={[0, y, z]} mat={matte(STEEL)} />
            {loaded &&
              Array.from({ length: 5 }, (_, i) => {
                const r = (2.6 - t * 0.35) * IN;
                const x = -w / 2 + 5 * IN + i * ((w - 10 * IN) / 4);
                return (
                  <group key={i} position={[x, y + r + 0.7 * IN, z]}>
                    <Tube radius={r * 0.3} length={4.5 * IN} pos={[0, 0, 0]} axis="x" mat={metal(CHROME)} />
                    {[-1, 1].map((e) => (
                      <Disc key={e} radius={r} thickness={1.6 * IN} pos={[e * 2.2 * IN, 0, 0]} axis="x" segments={6} />
                    ))}
                  </group>
                );
              })}
          </group>
        );
      })}
    </group>
  );
}

/* --------------------------------------------------------------- machines -- */

function Tower({
  x,
  h,
  d,
  width = 8 * IN,
}: {
  x: number;
  h: number;
  d: number;
  width?: number;
}) {
  return (
    <group position={[x, 0, d / 2 - width / 2]}>
      <Box size={[width, h, width]} pos={[0, h / 2, 0]} mat={matte(BLACK)} />
      {/* weight stack visible through the frame */}
      <Box size={[width * 0.62, h * 0.48, width * 0.7]} pos={[0, h * 0.26, 0]} mat={matte(STACK)} />
      {Array.from({ length: 8 }, (_, i) => (
        <Box
          key={i}
          size={[width * 0.66, 1.1 * IN, width * 0.74]}
          pos={[0, h * 0.06 + i * (h * 0.42) / 8, 0]}
          mat={matte(i % 2 ? STEEL : STACK)}
        />
      ))}
    </group>
  );
}

function FunctionalTrainer({ w, d, h }: Dim) {
  const tw = 9 * IN;
  const x = w / 2 - tw / 2;
  return (
    <group>
      <Tower x={-x} h={h} d={d} width={tw} />
      <Tower x={x} h={h} d={d} width={tw} />
      <Box size={[w, 5 * IN, tw * 0.8]} pos={[0, h - 2.5 * IN, d / 2 - tw / 2]} mat={matte(BLACK)} />
      <Box size={[w, 2 * IN, d]} pos={[0, 1 * IN, 0]} mat={matte(BLACK)} />
      {/* adjustable pulley carriages */}
      {[-x, x].map((px, i) => (
        <group key={i}>
          <Box size={[tw * 0.7, 5 * IN, 6 * IN]} pos={[px, h * 0.62, d / 2 - tw - 2 * IN]} mat={matte(STEEL)} />
          <Tube radius={1.6 * IN} length={1.4 * IN} pos={[px, h * 0.62, d / 2 - tw - 4 * IN]} axis="x" mat={metal(CHROME)} />
        </group>
      ))}
    </group>
  );
}

function SmithMachine({ w, d, h }: Dim) {
  const p = 3 * IN;
  const x = w / 2 - p / 2;
  return (
    <group>
      {[-x, x].map((lx, i) => (
        <group key={i}>
          {/* rails rake back slightly, as Smith machines do */}
          <Box size={[p, h, p]} pos={[lx, h / 2, d / 2 - p]} rot={[0.06, 0, 0]} mat={matte(BLACK)} />
          <Tube radius={0.9 * IN} length={h * 0.9} pos={[lx * 0.86, h * 0.5, d / 2 - p - 4 * IN]} mat={metal(CHROME)} />
        </group>
      ))}
      <Box size={[w, p, d]} pos={[0, p / 2, 0]} mat={matte(BLACK)} />
      <Box size={[w, p, p]} pos={[0, h - p / 2, d / 2 - p]} mat={matte(BLACK)} />
      {/* the bar itself */}
      <Tube radius={0.7 * IN} length={w * 1.05} pos={[0, h * 0.46, d / 2 - p - 4 * IN]} axis="x" />
    </group>
  );
}

function LatPulldown({ w, d, h }: Dim) {
  return (
    <group>
      <Box size={[6 * IN, h, 6 * IN]} pos={[0, h / 2, d / 2 - 4 * IN]} mat={matte(BLACK)} />
      <Box size={[w * 0.5, h * 0.45, 8 * IN]} pos={[0, h * 0.24, d / 2 - 4 * IN]} mat={matte(STACK)} />
      <Box size={[w, 2.5 * IN, d]} pos={[0, 1.2 * IN, 0]} mat={matte(BLACK)} />
      <Box size={[8 * IN, 4 * IN, d * 0.45]} pos={[0, h - 3 * IN, d * 0.1]} mat={matte(BLACK)} />
      {/* seat and thigh pad */}
      <Box size={[w * 0.45, 3 * IN, 12 * IN]} pos={[0, h * 0.28, -d * 0.1]} mat={soft(PAD)} />
      <Tube radius={2.2 * IN} length={w * 0.5} pos={[0, h * 0.42, -d * 0.22]} axis="x" mat={soft(PAD)} />
      {/* lat bar hanging from the boom */}
      <Tube radius={0.6 * IN} length={w * 0.55} pos={[0, h * 0.74, -d * 0.1]} axis="x" />
    </group>
  );
}

function LegPress({ w, d, h }: Dim) {
  return (
    <group>
      {/* long angled sled rails */}
      {[-1, 1].map((s) => (
        <Box
          key={s}
          size={[2.5 * IN, 3 * IN, d * 0.95]}
          pos={[s * (w / 2 - 3 * IN), h * 0.42, 0]}
          rot={[0.42, 0, 0]}
          mat={matte(BLACK)}
        />
      ))}
      <Box size={[w, 2.5 * IN, d]} pos={[0, 1.2 * IN, 0]} mat={matte(BLACK)} />
      {/* foot platform up the incline */}
      <Box size={[w * 0.8, 1.6 * IN, 16 * IN]} pos={[0, h * 0.72, d * 0.3]} rot={[0.42, 0, 0]} mat={matte(STEEL)} />
      {/* back pad down the incline */}
      <Box size={[w * 0.55, 3 * IN, 20 * IN]} pos={[0, h * 0.3, -d * 0.26]} rot={[0.42, 0, 0]} mat={soft(PAD)} />
      {/* plate horns */}
      {[-1, 1].map((s) => (
        <Tube key={s} radius={1.2 * IN} length={9 * IN} pos={[s * (w / 2 - 2 * IN), h * 0.5, -d * 0.05]} axis="x" mat={metal(STEEL)} />
      ))}
    </group>
  );
}

function BeltSquat({ w, d, h }: Dim) {
  return (
    <group>
      <Box size={[w, 2.5 * IN, d]} pos={[0, 1.2 * IN, 0]} mat={matte(BLACK)} />
      {[-1, 1].map((s) => (
        <Box key={s} size={[3 * IN, h, 3 * IN]} pos={[s * (w / 2 - 2 * IN), h / 2, d / 2 - 3 * IN]} mat={matte(BLACK)} />
      ))}
      {/* platform to stand on */}
      <Box size={[w * 0.6, 4 * IN, d * 0.4]} pos={[0, 3 * IN, -d * 0.1]} mat={matte(STEEL)} />
      {/* lever arm and plate horn */}
      <Box size={[w * 0.9, 3 * IN, 3 * IN]} pos={[0, h * 0.62, d * 0.1]} mat={matte(ACCENT)} />
      <Tube radius={1.2 * IN} length={10 * IN} pos={[w * 0.42, h * 0.62, d * 0.28]} axis="z" mat={metal(STEEL)} />
    </group>
  );
}

function Ghd({ w, d, h }: Dim) {
  return (
    <group>
      <Box size={[w * 0.35, 2.5 * IN, d]} pos={[0, 1.2 * IN, 0]} mat={matte(BLACK)} />
      <Box size={[w * 0.3, h * 0.7, 4 * IN]} pos={[0, h * 0.35, d * 0.3]} mat={matte(BLACK)} />
      {/* hip pad */}
      <Box size={[w * 0.5, 4 * IN, 10 * IN]} pos={[0, h * 0.66, d * 0.12]} mat={soft(PAD)} />
      {/* foot rollers */}
      {[-1, 1].map((s) => (
        <Tube key={s} radius={2.4 * IN} length={4 * IN} pos={[s * w * 0.18, h * 0.3, -d * 0.32]} axis="x" mat={soft(PAD)} />
      ))}
      <Box size={[w * 0.7, 2.5 * IN, 3 * IN]} pos={[0, h * 0.14, -d * 0.34]} mat={matte(STEEL)} />
    </group>
  );
}

function HomeGymStack({ w, d, h }: Dim) {
  return (
    <group>
      <Box size={[w, 2.5 * IN, d]} pos={[0, 1.2 * IN, 0]} mat={matte(BLACK)} />
      <Box size={[10 * IN, h, 10 * IN]} pos={[w * 0.3, h / 2, d / 2 - 6 * IN]} mat={matte(BLACK)} />
      <Box size={[7 * IN, h * 0.5, 8 * IN]} pos={[w * 0.3, h * 0.27, d / 2 - 6 * IN]} mat={matte(STACK)} />
      {/* seat + back */}
      <Box size={[16 * IN, 3 * IN, 14 * IN]} pos={[-w * 0.12, h * 0.32, 0]} mat={soft(PAD)} />
      <Box size={[16 * IN, 3 * IN, 18 * IN]} pos={[-w * 0.12, h * 0.5, d * 0.16]} rot={[-0.25, 0, 0]} mat={soft(PAD)} />
      {/* press arms */}
      {[-1, 1].map((s) => (
        <Tube key={s} radius={1 * IN} length={16 * IN} pos={[-w * 0.12 + s * 9 * IN, h * 0.56, -d * 0.1]} axis="z" mat={matte(STEEL)} />
      ))}
      {/* leg developer */}
      <Tube radius={2.2 * IN} length={12 * IN} pos={[-w * 0.12, h * 0.26, -d * 0.3]} axis="x" mat={soft(PAD)} />
    </group>
  );
}

/* ----------------------------------------------------------------- cardio -- */

function Treadmill({ w, d, h }: Dim) {
  const deckH = 7 * IN;
  return (
    <group>
      {/* deck and belt */}
      <Box size={[w, deckH, d * 0.78]} pos={[0, deckH / 2, -d * 0.08]} mat={matte(BLACK)} />
      <Box size={[w * 0.62, 1.4 * IN, d * 0.7]} pos={[0, deckH + 0.4 * IN, -d * 0.08]} mat={soft(RUBBER)} />
      {/* side rails */}
      {[-1, 1].map((s) => (
        <Box key={s} size={[w * 0.16, 2 * IN, d * 0.74]} pos={[s * w * 0.4, deckH + 0.8 * IN, -d * 0.08]} mat={matte(STEEL)} />
      ))}
      {/* uprights and console */}
      {[-1, 1].map((s) => (
        <Box key={s} size={[2.4 * IN, h - deckH, 2.4 * IN]} pos={[s * w * 0.38, deckH + (h - deckH) / 2, d * 0.34]} rot={[-0.1, 0, 0]} mat={matte(BLACK)} />
      ))}
      <Box size={[w * 0.92, 9 * IN, 2.5 * IN]} pos={[0, h - 5 * IN, d * 0.38]} rot={[-0.22, 0, 0]} mat={matte(STEEL)} />
      <Box size={[w * 0.5, 6 * IN, 0.8 * IN]} pos={[0, h - 5 * IN, d * 0.36]} rot={[-0.22, 0, 0]} mat={metal("#0C0E14")} />
      {/* handles */}
      {[-1, 1].map((s) => (
        <Tube key={s} radius={0.9 * IN} length={d * 0.3} pos={[s * w * 0.38, h - 12 * IN, d * 0.22]} axis="z" mat={soft(RUBBER)} />
      ))}
    </group>
  );
}

function AirBike({ w, d, h }: Dim) {
  const fanR = Math.min(w, h * 0.45) / 2;
  return (
    <group>
      {/* fan cage at the front */}
      <group position={[0, h - fanR - 4 * IN, -d / 2 + fanR * 0.4]}>
        <Disc radius={fanR} thickness={4 * IN} axis="z" pos={[0, 0, 0]} mat={matte(STEEL)} segments={30} />
        <Disc radius={fanR * 0.9} thickness={4.6 * IN} axis="z" pos={[0, 0, 0]} mat={matte("#101218")} segments={30} />
        {Array.from({ length: 8 }, (_, i) => (
          <Box
            key={i}
            size={[fanR * 0.22, fanR * 1.55, 1 * IN]}
            pos={[0, 0, 0]}
            rot={[0, 0, (i * Math.PI) / 8]}
            mat={matte(STEEL)}
          />
        ))}
      </group>
      {/* frame */}
      <Box size={[w * 0.5, 2.5 * IN, d]} pos={[0, 1.2 * IN, 0]} mat={matte(BLACK)} />
      <Box size={[3 * IN, h * 0.5, 3 * IN]} pos={[0, h * 0.3, d * 0.18]} rot={[0.2, 0, 0]} mat={matte(BLACK)} />
      {/* seat */}
      <Box size={[7 * IN, 3 * IN, 12 * IN]} pos={[0, h * 0.55, d * 0.3]} mat={soft(PAD)} />
      {/* moving handles */}
      {[-1, 1].map((s) => (
        <Tube key={s} radius={1 * IN} length={h * 0.42} pos={[s * w * 0.3, h * 0.7, -d * 0.12]} mat={matte(STEEL)} />
      ))}
      {/* pedals */}
      {[-1, 1].map((s) => (
        <Box key={s} size={[4 * IN, 1 * IN, 6 * IN]} pos={[s * w * 0.26, 5 * IN, -d * 0.05]} mat={matte(STEEL)} />
      ))}
    </group>
  );
}

function SpinBike({ w, d, h }: Dim) {
  const flyR = Math.min(w, 14 * IN) / 2;
  return (
    <group>
      <Box size={[w, 2.5 * IN, 4 * IN]} pos={[0, 1.2 * IN, -d / 2 + 3 * IN]} mat={matte(BLACK)} />
      <Box size={[w, 2.5 * IN, 4 * IN]} pos={[0, 1.2 * IN, d / 2 - 3 * IN]} mat={matte(BLACK)} />
      <Disc radius={flyR} thickness={2 * IN} axis="x" pos={[0, flyR + 6 * IN, -d * 0.28]} mat={metal(STEEL)} segments={26} />
      <Box size={[3 * IN, h * 0.55, 3 * IN]} pos={[0, h * 0.3, -d * 0.05]} rot={[0.26, 0, 0]} mat={matte(BLACK)} />
      <Box size={[3 * IN, h * 0.62, 3 * IN]} pos={[0, h * 0.34, d * 0.2]} rot={[-0.12, 0, 0]} mat={matte(BLACK)} />
      <Box size={[7 * IN, 3 * IN, 11 * IN]} pos={[0, h * 0.74, d * 0.24]} mat={soft(PAD)} />
      <Tube radius={0.9 * IN} length={w * 0.7} pos={[0, h * 0.92, -d * 0.06]} axis="x" mat={soft(RUBBER)} />
    </group>
  );
}

function Rower({ w, d, h }: Dim) {
  // Rowers are photographed and used along their long axis, which is depth.
  const railZ = d * 0.62;
  return (
    <group>
      {/* flywheel housing at the front */}
      <group position={[0, h * 0.55, -d / 2 + 8 * IN]}>
        <Disc radius={h * 0.5} thickness={7 * IN} axis="z" pos={[0, 0, 0]} mat={matte("#111319")} segments={26} />
        <Disc radius={h * 0.34} thickness={7.6 * IN} axis="z" pos={[0, 0, 0]} mat={matte(STEEL)} segments={22} />
      </group>
      {/* front legs */}
      {[-1, 1].map((s) => (
        <Box key={s} size={[2 * IN, h * 0.55, 2 * IN]} pos={[s * w * 0.32, h * 0.28, -d / 2 + 8 * IN]} rot={[0, 0, s * 0.22]} mat={matte(BLACK)} />
      ))}
      {/* monorail */}
      <Box size={[3.5 * IN, 2.5 * IN, railZ]} pos={[0, h * 0.42, d * 0.16]} mat={metal(STEEL)} />
      {/* rear foot */}
      <Box size={[w * 0.7, 2 * IN, 3 * IN]} pos={[0, 1 * IN, d / 2 - 2 * IN]} mat={matte(BLACK)} />
      <Box size={[2.5 * IN, h * 0.4, 2.5 * IN]} pos={[0, h * 0.2, d / 2 - 2 * IN]} mat={matte(BLACK)} />
      {/* seat on the rail */}
      <Box size={[9 * IN, 2.5 * IN, 9 * IN]} pos={[0, h * 0.52, d * 0.06]} mat={soft(PAD)} />
      {/* footplates */}
      {[-1, 1].map((s) => (
        <Box key={s} size={[5 * IN, 9 * IN, 2 * IN]} pos={[s * 3.5 * IN, h * 0.4, -d * 0.28]} rot={[0.5, 0, 0]} mat={matte(STEEL)} />
      ))}
      {/* monitor arm */}
      <Box size={[1.6 * IN, h * 0.5, 1.6 * IN]} pos={[0, h * 0.9, -d / 2 + 10 * IN]} mat={matte(BLACK)} />
      <Box size={[7 * IN, 5 * IN, 1 * IN]} pos={[0, h * 1.12, -d / 2 + 11 * IN]} rot={[-0.3, 0, 0]} mat={metal("#0C0E14")} />
    </group>
  );
}

/* ---------------------------------------------------------------- storage -- */

function PlateTree({ w, d, h }: Dim) {
  return (
    <group>
      <Box size={[w * 0.8, 2 * IN, d * 0.8]} pos={[0, 1 * IN, 0]} mat={matte(BLACK)} />
      <Box size={[4 * IN, h, 4 * IN]} pos={[0, h / 2, d * 0.2]} mat={matte(BLACK)} />
      {[0.28, 0.52, 0.76].map((f, i) =>
        [-1, 1].map((s) => (
          <group key={`${i}${s}`}>
            <Tube radius={1.2 * IN} length={7 * IN} pos={[s * 5 * IN, h * f, d * 0.2]} axis="x" mat={metal(STEEL)} />
            <Disc radius={(8 - i * 1.2) * IN} thickness={3 * IN} pos={[s * 7 * IN, h * f, d * 0.2]} axis="x" />
          </group>
        )),
      )}
    </group>
  );
}

function BarHolderVertical({ w, d, h }: Dim) {
  return (
    <group>
      <Box size={[w, 2 * IN, d]} pos={[0, 1 * IN, 0]} mat={matte(BLACK)} />
      <Box size={[w * 0.8, 2.5 * IN, d * 0.8]} pos={[0, h, 0]} mat={matte(BLACK)} />
      {Array.from({ length: 3 }, (_, i) =>
        Array.from({ length: 3 }, (_, j) => (
          <Tube
            key={`${i}${j}`}
            radius={0.55 * IN}
            length={h}
            pos={[-w * 0.28 + i * w * 0.28, h / 2, -d * 0.28 + j * d * 0.28]}
            mat={metal(CHROME)}
            segments={8}
          />
        )),
      )}
    </group>
  );
}

function BarHolderWall({ w, d, h }: Dim) {
  return (
    <group>
      <Box size={[w, h, 1.2 * IN]} pos={[0, h / 2, d / 2]} mat={matte(BLACK)} />
      {[-1, 1].map((s) => (
        <Box key={s} size={[2 * IN, 3 * IN, d]} pos={[s * w * 0.35, h * 0.6, 0]} mat={matte(STEEL)} />
      ))}
    </group>
  );
}

function Shelving({ w, d, h }: Dim) {
  const shelves = 5;
  return (
    <group>
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <Box
            key={`${sx}${sz}`}
            size={[2 * IN, h, 2 * IN]}
            pos={[sx * (w / 2 - 1 * IN), h / 2, sz * (d / 2 - 1 * IN)]}
            mat={matte(STEEL)}
          />
        )),
      )}
      {Array.from({ length: shelves }, (_, i) => (
        <Box
          key={i}
          size={[w, 1.2 * IN, d]}
          pos={[0, 2 * IN + i * ((h - 4 * IN) / (shelves - 1)), 0]}
          mat={matte("#3D4149")}
        />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------ accessories -- */

function DipBar({ w, d, h }: Dim) {
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s}>
          <Box size={[2 * IN, h * 0.6, 3 * IN]} pos={[s * w * 0.3, h * 0.3, d / 2 - 2 * IN]} mat={matte(BLACK)} />
          <Tube radius={0.9 * IN} length={d * 0.9} pos={[s * w * 0.3, h * 0.62, 0]} axis="z" mat={matte(STEEL)} />
        </group>
      ))}
    </group>
  );
}

function PlyoBox({ w, d, h }: Dim) {
  return (
    <group>
      <Box size={[w, h, d]} pos={[0, h / 2, 0]} mat={soft("#2A2E38")} />
      <Box size={[w * 0.98, 1 * IN, d * 0.98]} pos={[0, h - 0.6 * IN, 0]} mat={soft("#343945")} />
    </group>
  );
}

function Kettlebells({ w, d, h }: Dim) {
  return (
    <group>
      <Box size={[w, 2 * IN, d]} pos={[0, 1 * IN, 0]} mat={matte(BLACK)} />
      {[0, 1, 2].map((i) => {
        const r = (5.5 - i * 0.7) * IN;
        const x = -w * 0.3 + i * w * 0.3;
        return (
          <group key={i} position={[x, 2 * IN, 0]}>
            <mesh position={[0, r, 0]} castShadow>
              <sphereGeometry args={[r, 16, 12]} />
              <meshStandardMaterial {...matte("#1D1F26")} />
            </mesh>
            <mesh position={[0, r * 2.1, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <torusGeometry args={[r * 0.62, r * 0.16, 8, 18, Math.PI]} />
              <meshStandardMaterial {...matte("#1D1F26")} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Bands({ w, d, h }: Dim) {
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-w * 0.25 + i * w * 0.25, h * 0.4, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[h * 0.36, 0.5 * IN, 8, 20]} />
          <meshStandardMaterial {...soft(i === 0 ? "#3E5B8A" : i === 1 ? "#2F6B4F" : "#7A3B3B")} />
        </mesh>
      ))}
    </group>
  );
}

function Mirror({ w, d, h }: Dim) {
  return (
    <group>
      <Box size={[w, h, d]} pos={[0, h / 2, 0]} mat={matte("#2A2D34")} />
      <mesh position={[0, h / 2, -d / 2 - 0.01]} castShadow>
        <planeGeometry args={[w * 0.94, h * 0.94]} />
        <meshStandardMaterial color="#AEB8C6" metalness={1} roughness={0.05} />
      </mesh>
    </group>
  );
}

function Fan({ w, d, h }: Dim) {
  const r = Math.min(w, h * 0.8) / 2;
  return (
    <group>
      <Box size={[w * 0.7, 2.5 * IN, d]} pos={[0, 1.2 * IN, 0]} mat={matte(BLACK)} />
      <group position={[0, h - r - 1 * IN, 0]}>
        <Disc radius={r} thickness={d * 0.7} axis="z" pos={[0, 0, 0]} mat={matte("#22252C")} segments={26} />
        {Array.from({ length: 5 }, (_, i) => (
          <Box key={i} size={[r * 0.3, r * 1.5, 0.6 * IN]} pos={[0, 0, -d * 0.3]} rot={[0, 0, (i * Math.PI) / 5]} mat={matte("#454B57")} />
        ))}
      </group>
    </group>
  );
}

/** Cabinet with a driver and a tweeter — reads as a speaker at a glance. */
function Speaker({ w, d, h }: Dim) {
  const r = Math.min(w, h) * 0.3;
  return (
    <group>
      <Box size={[w, h, d]} pos={[0, h / 2, 0]} mat={matte("#1B1D22")} />
      <Disc
        radius={r}
        thickness={0.8 * IN}
        pos={[0, h * 0.38, -d / 2 - 0.3 * IN]}
        axis="z"
        mat={matte("#0E1014")}
        segments={20}
      />
      <Disc
        radius={r * 0.42}
        thickness={0.8 * IN}
        pos={[0, h * 0.76, -d / 2 - 0.3 * IN]}
        axis="z"
        mat={metal("#6E7178")}
        segments={16}
      />
    </group>
  );
}

/**
 * Overhead light. Sits at ceiling height rather than on the floor, which is
 * where these actually hang — the caller places it in plan, we lift it in Y.
 */
function LightBar({ w, d, h }: Dim) {
  return (
    <group position={[0, 7.6 - h, 0]}>
      <Box size={[w, h, d]} pos={[0, h / 2, 0]} mat={matte("#D8DBE2")} />
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[w * 0.94, 0.4 * IN, d * 0.8]} />
        <meshStandardMaterial
          color="#FFFFFF"
          emissive="#FFF6E0"
          emissiveIntensity={2.2}
        />
      </mesh>
    </group>
  );
}

/** A reel of strip light, boxed, plus a lit line to say what it is. */
function LightStrip({ w, d, h }: Dim) {
  return (
    <group>
      <Box size={[w, h, d]} pos={[0, h / 2, 0]} mat={matte("#2A2E38")} />
      <mesh position={[0, h + 0.3 * IN, 0]}>
        <boxGeometry args={[w * 0.9, 0.5 * IN, 0.5 * IN]} />
        <meshStandardMaterial
          color="#FFFFFF"
          emissive="#7FC7FF"
          emissiveIntensity={2.5}
        />
      </mesh>
    </group>
  );
}

function Flooring({ w, d, h }: Dim) {
  return (
    <mesh position={[0, h / 2, 0]} receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color="#191B20" roughness={1} metalness={0} />
    </mesh>
  );
}
