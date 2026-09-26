import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

// Dimensiones generales (metros).
export const FLOOR_H = 4.2;
export const CABIN = { w: 2.4, h: 2.6, d: 2.0 };
export const SHAFT = { x: 1.95, z: 1.45 };

// Paleta de plano: trazo blanco/celeste sobre azul, ámbar solo para la luz.
export const INK = {
  line: '#f2f8ff',
  line2: '#a8cbf2',
  line3: '#6f9fd6',
  amber: '#ffb547',
  fog: '#1a4f8c',
};

type V3 = [number, number, number];

// 12 aristas de una caja (centro, tamaño) como pares de puntos.
export function boxSegments([cx, cy, cz]: V3, [sx, sy, sz]: V3): number[] {
  const x = sx / 2, y = sy / 2, z = sz / 2;
  const c = [
    [-x, -y, -z], [x, -y, -z], [x, -y, z], [-x, -y, z],
    [-x, y, -z], [x, y, -z], [x, y, z], [-x, y, z],
  ].map(([a, b, d]) => [a + cx, b + cy, d + cz]);
  const e = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  return e.flatMap(([a, b]) => [...c[a], ...c[b]]);
}

export function seg(a: V3, b: V3): number[] {
  return [...a, ...b];
}

// Circunferencia en el plano XY (para poleas).
export function circleSegments([cx, cy, cz]: V3, r: number, n = 40): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
    out.push(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, cz, cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, cz);
  }
  return out;
}

// Arco en el plano YZ (para la polea de tracción, cuyo eje es X). t en radianes.
export function arcYZ(x: number, cy: number, cz: number, r: number, t0 = 0, t1 = Math.PI * 2, n = 40): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const a0 = t0 + ((t1 - t0) * i) / n, a1 = t0 + ((t1 - t0) * (i + 1)) / n;
    out.push(x, cy + Math.sin(a0) * r, cz + Math.cos(a0) * r, x, cy + Math.sin(a1) * r, cz + Math.cos(a1) * r);
  }
  return out;
}

type LineOpts = { color?: string; width?: number; opacity?: number; hiddenOpacity?: number };

// Trazo visible + trazo oculto punteado (lo que queda detrás de un "oclusor").
export function makeLines(positions: number[], opts: LineOpts = {}) {
  const { color = INK.line, width = 1.3, opacity = 0.95, hiddenOpacity = 0.22 } = opts;
  const geometry = new LineSegmentsGeometry();
  geometry.setPositions(positions);

  const visible = new LineSegments2(
    geometry,
    new LineMaterial({ color, linewidth: width, transparent: true, opacity, depthWrite: false, fog: true }),
  );
  visible.renderOrder = 2;

  const group = new THREE.Group();
  group.add(visible);

  if (hiddenOpacity > 0) {
    const hidden = new LineSegments2(
      geometry,
      new LineMaterial({
        color,
        linewidth: width * 0.8,
        transparent: true,
        opacity: hiddenOpacity,
        depthWrite: false,
        depthFunc: THREE.GreaterDepth,
        dashed: true,
        dashSize: 0.09,
        gapSize: 0.07,
        fog: true,
      }),
    );
    hidden.computeLineDistances();
    hidden.renderOrder = 3;
    group.add(hidden);
  }
  return group;
}

export function disposeLines(group: THREE.Object3D) {
  group.traverse((o) => {
    const l = o as LineSegments2;
    if (l.isLineSegments2) {
      l.geometry.dispose();
      (l.material as LineMaterial).dispose();
    }
  });
}

// Oclusor invisible: solo escribe profundidad para que las líneas de atrás se vean punteadas.
export const occluderMaterial = new THREE.MeshBasicMaterial({ colorWrite: false });

export const fillMaterial = (color: string, opacity: number) =>
  new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, fog: true });

// Degradado radial para la luz cálida que sale de la cabina.
export function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,200,120,1)');
  g.addColorStop(0.45, 'rgba(255,170,70,0.45)');
  g.addColorStop(1, 'rgba(255,160,60,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
