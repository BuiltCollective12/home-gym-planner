"use client";

import * as THREE from "three";
import type { Equipment } from "./types";

/**
 * Catalog thumbnails, rendered from our own 3D models.
 *
 * Why not Amazon's product photos? Their listing images are licensed only
 * through the Product Advertising API, which is gated behind an approved
 * Associates account plus three qualifying sales. Hotlinking or copying them
 * breaks both Amazon's terms and the brands' copyright. So until PA-API is
 * live, every thumbnail is geometry we own — and `Equipment.imageUrl` takes
 * precedence the moment real images are available.
 *
 * One shared WebGL context renders every item (browsers cap contexts at ~16, so
 * a canvas per row is not an option), and each result is cached as a PNG data
 * URL keyed by equipment id.
 */

const SIZE = 160;
const cache = new Map<string, string>();

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;

function init(): boolean {
  if (renderer) return true;
  if (typeof window === "undefined") return false;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(SIZE, SIZE);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(1.9, 1.5, 2.2);
    camera.lookAt(0, 0.45, 0);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x333844, 1.5));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(2, 3, 2);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x88aaff, 0.8);
    rim.position.set(-2, 1.5, -1.5);
    scene.add(rim);

    return true;
  } catch {
    // No WebGL (some browsers, some headless contexts) — callers fall back.
    renderer = null;
    return false;
  }
}

/**
 * Build a rough silhouette for an item and render it. This mirrors the shapes
 * in `EquipmentModel` rather than importing them, because those are React
 * components and this runs outside the React tree.
 */
function buildMesh(equipment: Equipment): THREE.Object3D {
  const group = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({
    color: categoryColor(equipment),
    metalness: 0.55,
    roughness: 0.45,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x252a33,
    metalness: 0.4,
    roughness: 0.7,
  });
  const chrome = new THREE.MeshStandardMaterial({
    color: 0x9aa3b2,
    metalness: 0.9,
    roughness: 0.22,
  });

  const box = (
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    mat: THREE.Material,
  ) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    group.add(m);
  };

  switch (equipment.category) {
    case "racks": {
      const p = 0.07;
      for (const [x, z] of [
        [-0.45, -0.45],
        [0.45, -0.45],
        [-0.45, 0.45],
        [0.45, 0.45],
      ]) {
        box(p, 1, p, x, 0.5, z, steel);
      }
      box(1, p, p, 0, 0.05, -0.45, dark);
      box(1, p, p, 0, 0.05, 0.45, dark);
      box(0.96, 0.04, 0.04, 0, 0.45, -0.45, new THREE.MeshStandardMaterial({ color: 0xff4d1c }));
      const bar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 1, 12),
        chrome,
      );
      bar.rotation.z = Math.PI / 2;
      bar.position.y = 0.97;
      group.add(bar);
      break;
    }
    case "benches": {
      box(0.72, 0.2, 0.94, 0, 0.82, 0, dark);
      box(0.14, 0.66, 0.5, 0, 0.4, 0, steel);
      box(0.8, 0.1, 0.12, 0, 0.05, -0.42, dark);
      box(0.8, 0.1, 0.12, 0, 0.05, 0.42, dark);
      break;
    }
    case "barbells": {
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 1.4, 14),
        chrome,
      );
      shaft.rotation.z = Math.PI / 2;
      shaft.position.y = 0.4;
      group.add(shaft);
      for (const x of [-0.6, 0.6]) {
        const plate = new THREE.Mesh(
          new THREE.CylinderGeometry(0.34, 0.34, 0.09, 24),
          dark,
        );
        plate.rotation.z = Math.PI / 2;
        plate.position.set(x, 0.4, 0);
        group.add(plate);
      }
      break;
    }
    case "plates": {
      for (let i = 0; i < 4; i++) {
        const plate = new THREE.Mesh(
          new THREE.CylinderGeometry(0.45, 0.45, 0.1, 28),
          dark,
        );
        plate.rotation.x = Math.PI / 2 - 0.1;
        plate.position.set(0, 0.46, -0.24 + i * 0.16);
        group.add(plate);
      }
      break;
    }
    case "dumbbells": {
      for (const x of [-0.26, 0.26]) {
        box(0.38, 0.62, 0.8, x, 0.32, 0, dark);
        const h = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, 0.86, 12),
          chrome,
        );
        h.rotation.x = Math.PI / 2;
        h.position.set(x, 0.56, 0);
        group.add(h);
      }
      break;
    }
    case "machines": {
      box(0.9, 1, 0.18, 0, 0.5, 0.4, steel);
      box(0.45, 0.55, 0.14, 0, 0.28, 0.32, dark);
      box(0.95, 0.06, 0.95, 0, 0.03, 0, dark);
      box(0.7, 0.08, 0.7, 0, 0.86, -0.05, steel);
      break;
    }
    case "cardio": {
      if (equipment.tags.includes("rower")) {
        box(0.9, 0.7, 0.4, 0, 0.5, 0.4, steel);
        box(0.2, 0.12, 1.2, 0, 0.26, -0.15, dark);
        box(0.34, 0.14, 0.3, 0, 0.4, -0.2, dark);
      } else if (equipment.tags.some((t) => t.includes("bike"))) {
        box(0.18, 0.85, 0.16, 0, 0.45, 0.2, steel);
        box(0.3, 0.14, 0.4, 0, 0.75, -0.2, dark);
        const fly = new THREE.Mesh(
          new THREE.CylinderGeometry(0.34, 0.34, 0.08, 24),
          dark,
        );
        fly.rotation.x = Math.PI / 2;
        fly.position.set(0, 0.6, 0.34);
        group.add(fly);
        box(0.7, 0.1, 0.95, 0, 0.05, 0, dark);
      } else {
        box(0.85, 0.26, 0.95, 0, 0.15, 0.05, dark);
        box(0.82, 0.8, 0.09, 0, 0.6, 0.42, steel);
      }
      break;
    }
    case "flooring": {
      box(1.1, 0.07, 1.1, 0, 0.035, 0, dark);
      break;
    }
    case "storage": {
      box(0.08, 1, 0.9, -0.45, 0.5, 0, steel);
      box(0.08, 1, 0.9, 0.45, 0.5, 0, steel);
      for (const y of [0.18, 0.52, 0.86]) box(0.95, 0.05, 0.85, 0, y, 0, dark);
      break;
    }
    default: {
      box(0.85, 0.8, 0.85, 0, 0.4, 0, steel);
    }
  }

  return group;
}

function categoryColor(equipment: Equipment): number {
  switch (equipment.category) {
    case "racks":
      return 0x44506b;
    case "machines":
      return 0x3d5666;
    case "cardio":
      return 0x66404e;
    case "benches":
      return 0x6a5340;
    case "storage":
      return 0x4c5842;
    default:
      return 0x3f4654;
  }
}

/** Returns a PNG data URL, or null when WebGL is unavailable. */
export function renderThumbnail(equipment: Equipment): string | null {
  const cached = cache.get(equipment.id);
  if (cached) return cached;
  if (!init() || !renderer || !scene || !camera) return null;

  const mesh = buildMesh(equipment);
  scene.add(mesh);
  renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL("image/png");
  scene.remove(mesh);

  mesh.traverse((child) => {
    if (child instanceof THREE.Mesh) child.geometry.dispose();
  });

  cache.set(equipment.id, url);
  return url;
}
