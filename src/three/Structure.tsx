import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import {
  CABIN,
  FLOOR_H,
  INK,
  SHAFT,
  boxSegments,
  arcYZ,
  disposeLines,
  fillMaterial,
  makeLines,
  occluderMaterial,
  seg,
} from './blueprint';
import type { Rig } from './rig';
import { FLOOR_LABELS } from '../scripts/floors';
import fontUrl from '@fontsource/space-grotesk/files/space-grotesk-latin-500-normal.woff?url';

export { fontUrl };

const FLOORS = FLOOR_LABELS.length; // PB..4
const TOP = FLOOR_H * FLOORS; // losa de sala de máquinas
const PIT = -1.6; // fondo del foso
const SLAB_T = 0.3;
const RAIL_X = CABIN.w / 2 + 0.32;
const CW_Z = -1.2; // contrapeso detrás de la cabina

// Polea de tracción: eje en X, entre la cabina (z = 0) y el contrapeso (z = CW_Z).
export const SHEAVE = { y: TOP + 1.0, z: CW_Z / 2, r: -CW_Z / 2 };
export const ROPES_X = [-0.1, 0, 0.1];

type Box = { p: [number, number, number]; s: [number, number, number] };

// Losa con el hueco del pasadizo: cuatro piezas alrededor.
function slabPieces(y: number): Box[] {
  const cy = y - SLAB_T / 2;
  const X = 5.8, BACK = -5, FRONT = 3.2, gx = SHAFT.x + 0.2, gz = SHAFT.z + 0.2;
  return [
    { p: [0, cy, (BACK - gz) / 2], s: [X * 2, SLAB_T, -BACK - gz] },
    { p: [-(X + gx) / 2, cy, (FRONT - gz) / 2], s: [X - gx, SLAB_T, FRONT + gz] },
    { p: [(X + gx) / 2, cy, (FRONT - gz) / 2], s: [X - gx, SLAB_T, FRONT + gz] },
    { p: [0, cy, (FRONT + gz) / 2], s: [gx * 2, SLAB_T, FRONT - gz] },
  ];
}

const levelText = (i: number) => (i === 0 ? 'N.P.T. ±0.00' : `N.P.T. +${(i * FLOOR_H).toFixed(2)}`);
const floorName = (i: number) => (i === 0 ? 'PLANTA BAJA' : `PISO ${i}`);

export function Structure({ rig }: { rig: Rig }) {
  const counterweight = useRef<THREE.Group>(null!);
  const cwCables = useRef<THREE.Group>(null!);

  const { lines, occluders, slabs } = useMemo(() => {
    const main: number[] = [];
    const light: number[] = [];
    const faint: number[] = [];
    const ropes: number[] = [];
    const occ: Box[] = [];
    const slabBoxes: Box[] = [];

    // Columnas, anillos y cruces de San Andrés del pasadizo.
    for (const sx of [-1, 1])
      for (const sz of [-1, 1])
        main.push(...seg([sx * SHAFT.x, PIT, sz * SHAFT.z], [sx * SHAFT.x, TOP, sz * SHAFT.z]));
    for (let y = 0; y <= TOP; y += FLOOR_H / 2) {
      const r: [number, number, number][] = [
        [-SHAFT.x, y, -SHAFT.z],
        [SHAFT.x, y, -SHAFT.z],
        [SHAFT.x, y, SHAFT.z],
        [-SHAFT.x, y, SHAFT.z],
      ];
      for (let k = 0; k < 4; k++) light.push(...seg(r[k], r[(k + 1) % 4]));
      if (y < TOP) {
        const y2 = y + FLOOR_H / 2;
        faint.push(...seg([-SHAFT.x, y, -SHAFT.z], [SHAFT.x, y2, -SHAFT.z]));
        faint.push(...seg([SHAFT.x, y, -SHAFT.z], [-SHAFT.x, y2, -SHAFT.z]));
        for (const sx of [-1, 1]) faint.push(...seg([sx * SHAFT.x, y, -SHAFT.z], [sx * SHAFT.x, y2, SHAFT.z]));
      }
    }

    // Guías de cabina (perfil T) y de contrapeso.
    for (const s of [-1, 1]) {
      for (const dz of [-0.07, 0.07]) light.push(...seg([s * RAIL_X, PIT, dz], [s * RAIL_X, TOP, dz]));
      light.push(...seg([s * (RAIL_X + 0.08), PIT, 0], [s * (RAIL_X + 0.08), TOP, 0]));
      faint.push(...seg([s * 0.62, PIT, CW_Z], [s * 0.62, TOP, CW_Z]));
    }

    // Losas por piso (incluida la de sala de máquinas) y columnas del edificio.
    for (let i = 0; i <= FLOORS; i++) {
      for (const b of slabPieces(i * FLOOR_H)) {
        main.push(...boxSegments(b.p, b.s));
        occ.push(b);
        slabBoxes.push(b);
      }
      if (i < FLOORS)
        for (const x of [-5.2, 5.2])
          for (const z of [-4.4, 2.6])
            faint.push(...boxSegments([x, i * FLOOR_H + (FLOOR_H - SLAB_T) / 2, z], [0.4, FLOOR_H - SLAB_T, 0.4]));
    }

    // Foso con paragolpes.
    const pit: Box = { p: [0, PIT - 0.15, 0], s: [SHAFT.x * 2 + 0.4, 0.3, SHAFT.z * 2 + 0.4] };
    main.push(...boxSegments(pit.p, pit.s));
    occ.push(pit);
    for (const x of [-0.6, 0.6]) light.push(...boxSegments([x, PIT + 0.35, 0.2], [0.22, 0.7, 0.22]));
    light.push(...boxSegments([0, PIT + 0.25, CW_Z], [0.3, 0.5, 0.22]));

    // Sala de máquinas: losa sobre el pasadizo, motor, cojinetes y polea de tracción.
    const cover: Box = { p: [0, TOP - SLAB_T / 2, 0], s: [(SHAFT.x + 0.2) * 2, SLAB_T, (SHAFT.z + 0.2) * 2] };
    main.push(...boxSegments(cover.p, cover.s));
    occ.push(cover);
    slabBoxes.push(cover);
    const motor: Box = { p: [-1.05, TOP + 0.62, SHEAVE.z], s: [0.8, 1.24, 0.84] };
    main.push(...boxSegments(motor.p, motor.s));
    occ.push(motor);
    light.push(...arcYZ(-1.46, TOP + 0.62, SHEAVE.z, 0.3, 0, Math.PI * 2, 24)); // tapa del motor
    for (const x of [-0.42, 0.42]) light.push(...boxSegments([x, TOP + 0.5, SHEAVE.z], [0.14, 1.0, 0.44])); // cojinetes
    light.push(...seg([-0.65, SHEAVE.y, SHEAVE.z], [0.55, SHEAVE.y, SHEAVE.z])); // eje
    for (const x of [-0.2, 0.2]) {
      main.push(...arcYZ(x, SHEAVE.y, SHEAVE.z, SHEAVE.r + 0.06));
      light.push(...arcYZ(x, SHEAVE.y, SHEAVE.z, 0.16, 0, Math.PI * 2, 18));
    }
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      const [sn, cs] = [Math.sin(a), Math.cos(a)];
      light.push(...seg([0.2, SHEAVE.y + sn * 0.16, SHEAVE.z + cs * 0.16], [0.2, SHEAVE.y + sn * SHEAVE.r, SHEAVE.z + cs * SHEAVE.r]));
    }
    // Cables abrazando la polea: suben de la cabina (z = 0), pasan por arriba y bajan al contrapeso.
    for (const x of ROPES_X) ropes.push(...arcYZ(x, SHEAVE.y, SHEAVE.z, SHEAVE.r, 0, Math.PI, 24));

    // Cotas de altura entre pisos (frente derecho).
    const dx = 4.5, dz = 3.25;
    for (let i = 0; i < FLOORS; i++) {
      const y0 = i * FLOOR_H, y1 = y0 + FLOOR_H;
      light.push(...seg([dx, y0, dz], [dx, y1, dz]));
      for (const y of [y0, y1]) {
        light.push(...seg([dx - 0.12, y - 0.12, dz], [dx + 0.12, y + 0.12, dz]));
        light.push(...seg([dx - 0.3, y, dz], [dx + 0.2, y, dz]));
      }
    }

    // Cota de ancho de cabina (bajo PB, al frente).
    const wy = -0.55, wz = 3.3;
    light.push(...seg([-CABIN.w / 2, wy, wz], [CABIN.w / 2, wy, wz]));
    for (const x of [-CABIN.w / 2, CABIN.w / 2]) {
      light.push(...seg([x - 0.1, wy - 0.1, wz], [x + 0.1, wy + 0.1, wz]));
      light.push(...seg([x, wy - 0.18, wz], [x, wy + 0.2, wz]));
    }

    const group = new THREE.Group();
    group.add(makeLines(main, { color: INK.line, width: 1.35, opacity: 0.9 }));
    group.add(makeLines(light, { color: INK.line2, width: 1.1, opacity: 0.75, hiddenOpacity: 0.18 }));
    group.add(makeLines(faint, { color: INK.line3, width: 1, opacity: 0.45, hiddenOpacity: 0 }));
    group.add(makeLines(ropes, { color: INK.line, width: 1.1, opacity: 0.85, hiddenOpacity: 0.3 }));
    return { lines: group, occluders: occ, slabs: slabBoxes };
  }, []);

  const cw = useMemo(() => {
    const g = new THREE.Group();
    g.add(makeLines(boxSegments([0, 0, 0], [1.1, 1.5, 0.22]), { width: 1.2 }));
    g.add(
      makeLines([...seg([-0.35, -0.75, 0.11], [0.35, 0.75, 0.11]), ...seg([0.35, -0.75, 0.11], [-0.35, 0.75, 0.11])], {
        color: INK.line2,
        width: 1,
        hiddenOpacity: 0,
      }),
    );
    return g;
  }, []);
  const cables = useMemo(
    () => makeLines(ROPES_X.flatMap((x) => seg([x, 0, 0], [x, 1, 0])), { color: INK.line, width: 1.1, opacity: 0.85, hiddenOpacity: 0.3 }),
    [],
  );
  const slabFill = useMemo(() => fillMaterial('#0b2f5a', 0.35), []);

  useEffect(
    () => () => {
      disposeLines(lines);
      disposeLines(cw);
      disposeLines(cables);
      slabFill.dispose();
    },
    [lines, cw, cables, slabFill],
  );

  useFrame(() => {
    // El contrapeso baja cuando la cabina sube; sus cables llegan hasta la polea.
    const y = TOP - 1.6 - rig.cabinY;
    counterweight.current.position.y = y;
    cwCables.current.position.y = y + 0.75;
    cwCables.current.scale.y = Math.max(0.01, SHEAVE.y - (y + 0.75));
  });

  const label = { font: fontUrl, color: INK.line, anchorY: 'middle' as const };

  return (
    <group>
      <primitive object={lines} />
      {occluders.map((b, i) => (
        <mesh key={i} position={b.p} material={occluderMaterial}>
          <boxGeometry args={b.s} />
        </mesh>
      ))}
      {slabs.map((b, i) => (
        <mesh key={`f${i}`} position={b.p} material={slabFill} renderOrder={1}>
          <boxGeometry args={b.s} />
        </mesh>
      ))}

      <group ref={counterweight} position={[0, 0, CW_Z]}>
        <primitive object={cw} />
        <mesh material={occluderMaterial}>
          <boxGeometry args={[1.1, 1.5, 0.22]} />
        </mesh>
      </group>
      <group ref={cwCables} position={[0, 0, CW_Z]}>
        <primitive object={cables} />
      </group>

      {/* Anotaciones de nivel en el canto frontal de cada losa */}
      {Array.from({ length: FLOORS + 1 }, (_, i) => (
        <group key={i} position={[2.35, i * FLOOR_H - SLAB_T / 2, 3.21]}>
          <Text {...label} fontSize={0.17} anchorX="left" letterSpacing={0.08} fillOpacity={0.9}>
            {i === FLOORS ? 'SALA DE MÁQUINAS' : floorName(i)}
          </Text>
          <Text {...label} fontSize={0.15} anchorX="left" position={[0, 0.34, 0]} fillOpacity={0.65} letterSpacing={0.06}>
            {levelText(i)}
          </Text>
        </group>
      ))}
      {Array.from({ length: FLOORS }, (_, i) => (
        <Text
          key={`d${i}`}
          {...label}
          fontSize={0.18}
          anchorX="center"
          position={[4.72, i * FLOOR_H + FLOOR_H / 2, 3.25]}
          rotation={[0, 0, Math.PI / 2]}
          fillOpacity={0.7}
        >
          {FLOOR_H.toFixed(2)}
        </Text>
      ))}
      <Text {...label} fontSize={0.16} anchorX="center" position={[0, -0.74, 3.3]} fillOpacity={0.7}>
        {CABIN.w.toFixed(2)}
      </Text>
      <Text {...label} fontSize={0.16} anchorX="left" position={[SHAFT.x + 0.3, PIT + 0.3, 1.9]} fillOpacity={0.6} letterSpacing={0.08}>
        FOSO
      </Text>
    </group>
  );
}
