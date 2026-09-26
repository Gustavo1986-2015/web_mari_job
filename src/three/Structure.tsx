import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CABIN, FLOOR_H, type Materials } from './materials';
import type { Rig } from './rig';
import { FLOOR_LABELS } from '../scripts/floors';

const RAIL_X = CABIN.w / 2 + 0.32;
const COL_X = 1.95;
const COL_Z = 1.45;
const Y_MIN = -FLOOR_H * 2;
const Y_MAX = FLOOR_H * 7;
const SPAN = Y_MAX - Y_MIN;
const MID = (Y_MAX + Y_MIN) / 2;

type Box = { p: [number, number, number]; s: [number, number, number] };

// Un único InstancedMesh por material: pocas llamadas de dibujo aunque haya cientos de piezas.
function Boxes({ items, material }: { items: Box[]; material: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    items.forEach((b, i) => {
      o.position.set(...b.p);
      o.scale.set(...b.s);
      o.updateMatrix();
      ref.current.setMatrixAt(i, o.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [items]);
  return (
    <instancedMesh ref={ref} args={[undefined, material, items.length]} frustumCulled={false}>
      <boxGeometry />
    </instancedMesh>
  );
}

export function Structure({ m, rig }: { m: Materials; rig: Rig }) {
  const counterweight = useRef<THREE.Group>(null!);

  const parts = useMemo(() => {
    const frame: Box[] = [];
    const concrete: Box[] = [];
    const strips: Box[] = [];
    const rails: Box[] = [];

    // Guías de la cabina (perfil T) y del contrapeso.
    for (const s of [-1, 1]) {
      rails.push({ p: [s * RAIL_X, MID, 0], s: [0.05, SPAN, 0.14] });
      rails.push({ p: [s * (RAIL_X + 0.06), MID, 0], s: [0.07, SPAN, 0.03] });
      rails.push({ p: [s * 0.62, MID, -1.22], s: [0.04, SPAN, 0.08] });
    }

    // Estructura metálica del pasadizo.
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) frame.push({ p: [sx * COL_X, MID, sz * COL_Z], s: [0.12, SPAN, 0.12] });
    for (let y = Y_MIN; y <= Y_MAX; y += FLOOR_H / 2) {
      frame.push({ p: [0, y, -COL_Z], s: [COL_X * 2, 0.07, 0.07] });
      for (const s of [-1, 1]) frame.push({ p: [s * COL_X, y, 0], s: [0.07, 0.07, COL_Z * 2] });
    }

    // Losas del edificio (detrás y a los costados del pasadizo), columnas y líneas de luz.
    for (let i = -2; i <= 7; i++) {
      const y = i * FLOOR_H;
      concrete.push({ p: [0, y - 0.2, -COL_Z - 0.2 - 5], s: [22, 0.4, 10] });
      for (const s of [-1, 1]) {
        concrete.push({ p: [s * (COL_X + 0.25 + 4.5), y - 0.2, 0], s: [9, 0.4, 3.3] });
        strips.push({ p: [s * (COL_X + 0.25 + 4.5), y + 0.01, 1.66], s: [9, 0.025, 0.025] });
      }
      strips.push({ p: [0, y + 0.01, -COL_Z - 0.21], s: [22, 0.025, 0.025] });
      for (const x of [-9, -5, 5, 9])
        for (const z of [-4.5, -9]) concrete.push({ p: [x, y + FLOOR_H / 2, z], s: [0.5, FLOOR_H - 0.4, 0.5] });
      concrete.push({ p: [0, y + FLOOR_H / 2, -11], s: [22, FLOOR_H, 0.3] });
    }
    return { frame, concrete, strips, rails };
  }, []);

  const top = FLOOR_H * (FLOOR_LABELS.length - 1) + CABIN.h;
  useFrame(() => {
    // El contrapeso baja cuando la cabina sube.
    counterweight.current.position.y = top - rig.cabinY;
  });

  return (
    <group>
      <Boxes items={parts.frame} material={m.frame} />
      <Boxes items={parts.concrete} material={m.concrete} />
      <Boxes items={parts.strips} material={m.amberDim} />
      <Boxes items={parts.rails} material={m.rail} />

      <group ref={counterweight}>
        <mesh material={m.darkSteel} position={[0, 0, -1.2]}>
          <boxGeometry args={[1.1, 1.5, 0.22]} />
        </mesh>
        {[-0.2, 0.2].map((x) => (
          <mesh key={x} material={m.cable} position={[x, 30.75, -1.2]}>
            <cylinderGeometry args={[0.012, 0.012, 60, 6]} />
          </mesh>
        ))}
      </group>

    </group>
  );
}
