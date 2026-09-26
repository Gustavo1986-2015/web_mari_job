import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { CABIN, FLOOR_H, INK, boxSegments, disposeLines, fillMaterial, glowTexture, makeLines, occluderMaterial, seg } from './blueprint';
import type { Rig } from './rig';
import { FLOOR_LABELS } from '../scripts/floors';
import { fontUrl, SHEAVE, ROPES_X } from './Structure';

const { w: W, h: H, d: D } = CABIN;
const OPENING = 1.2;
const DOOR_W = OPENING / 2 + 0.02;
const DOOR_H = 2.2;
const SIDE = (W - OPENING) / 2;
const TOP = FLOOR_H * FLOOR_LABELS.length;

type Box = { p: [number, number, number]; s: [number, number, number] };

// Piezas opacas de la cabina (tapan lo que está detrás).
const solids: Box[] = [
  { p: [0, -0.08, 0], s: [W + 0.12, 0.16, D + 0.12] }, // plataforma
  { p: [0, H + 0.06, 0], s: [W + 0.12, 0.12, D + 0.12] }, // techo
  { p: [0, H / 2, -D / 2 + 0.025], s: [W, H, 0.05] }, // fondo
  { p: [-(OPENING / 2 + SIDE / 2), H / 2, D / 2 + 0.03], s: [SIDE, H, 0.05] },
  { p: [OPENING / 2 + SIDE / 2, H / 2, D / 2 + 0.03], s: [SIDE, H, 0.05] },
  { p: [0, DOOR_H + (H - DOOR_H) / 2, D / 2 + 0.03], s: [OPENING, H - DOOR_H, 0.05] }, // dintel
];

function DoorLeaf({ side, rig }: { side: -1 | 1; rig: Rig }) {
  const ref = useRef<THREE.Group>(null!);
  const lines = useMemo(() => {
    const segs = [
      ...boxSegments([0, 0, 0], [DOOR_W, DOOR_H, 0.04]),
      // Panelado del frente de la hoja.
      ...seg([-DOOR_W / 2 + 0.08, -DOOR_H / 2 + 0.1, 0.021], [-DOOR_W / 2 + 0.08, DOOR_H / 2 - 0.1, 0.021]),
    ];
    return makeLines(segs, { width: 1.25 });
  }, []);
  useEffect(() => () => disposeLines(lines), [lines]);
  useFrame(() => {
    const travel = rig.open * (OPENING / 2 - 0.03);
    ref.current.position.x = side * (DOOR_W / 2 - 0.01 + travel);
  });
  return (
    <group ref={ref} position={[side * DOOR_W / 2, DOOR_H / 2, D / 2 - 0.02]}>
      <primitive object={lines} />
      <mesh material={occluderMaterial}>
        <boxGeometry args={[DOOR_W, DOOR_H, 0.04]} />
      </mesh>
    </group>
  );
}

export function Cabin({ rig }: { rig: Rig }) {
  const group = useRef<THREE.Group>(null!);
  const cables = useRef<THREE.Group>(null!);
  const glowDoor = useRef<THREE.MeshBasicMaterial>(null!);
  const glowFloor = useRef<THREE.MeshBasicMaterial>(null!);
  const [label, setLabel] = useState('PB');

  const { lines, glass, cableLines, glowTex } = useMemo(() => {
    const main: number[] = [];
    const light: number[] = [];
    solids.forEach((b) => main.push(...boxSegments(b.p, b.s)));
    // Laterales de vidrio: marco y parantes.
    for (const s of [-1, 1]) {
      const x = s * (W / 2 - 0.02);
      main.push(...seg([x, 0, D / 2], [x, H, D / 2]), ...seg([x, 0, -D / 2], [x, H, -D / 2]));
      light.push(...seg([x, 0.9, -D / 2], [x, 0.9, D / 2]));
    }
    // Pasamanos, luminaria y paneles del fondo.
    light.push(...boxSegments([0, 0.95, -D / 2 + 0.1], [W - 0.5, 0.04, 0.04]));
    light.push(...boxSegments([0, H - 0.02, -0.1], [W - 0.7, 0.02, D - 0.8]));
    for (const x of [-W / 6, W / 6]) light.push(...seg([x, 0.05, -D / 2 + 0.051], [x, H - 0.05, -D / 2 + 0.051]));
    // Cabezal, patines y botonera.
    main.push(...boxSegments([0, H + 0.32, 0], [W + 0.5, 0.2, 0.22]));
    light.push(...boxSegments([0, H + 0.45, 0], [0.4, 0.06, 0.16]));
    for (const s of [-1, 1]) for (const y of [0.25, H - 0.25]) light.push(...boxSegments([s * (W / 2 + 0.2), y, 0], [0.16, 0.18, 0.18]));
    light.push(...boxSegments([W / 2 - 0.16, 1.25, D / 2 + 0.06], [0.12, 0.4, 0.01]));

    const g = new THREE.Group();
    g.add(makeLines(main, { color: INK.line, width: 1.45, opacity: 0.95, hiddenOpacity: 0.25 }));
    g.add(makeLines(light, { color: INK.line2, width: 1.1, opacity: 0.8, hiddenOpacity: 0.15 }));

    const cable = makeLines(
      ROPES_X.flatMap((x) => seg([x, 0, 0], [x, 1, 0])),
      { color: INK.line, width: 1.1, opacity: 0.85, hiddenOpacity: 0.3 },
    );
    return { lines: g, glass: fillMaterial('#cfe4ff', 0.06), cableLines: cable, glowTex: glowTexture() };
  }, []);

  useEffect(
    () => () => {
      disposeLines(lines);
      disposeLines(cableLines);
      glass.dispose();
      glowTex.dispose();
    },
    [lines, cableLines, glass, glowTex],
  );

  useFrame(() => {
    group.current.position.y = rig.cabinY;
    const cableBase = rig.cabinY + H + 0.42;
    cables.current.position.y = cableBase;
    cables.current.scale.y = Math.max(0.01, SHEAVE.y - cableBase);

    glowDoor.current.opacity = rig.open * 0.95;
    glowFloor.current.opacity = rig.open * 0.7;

    const next = FLOOR_LABELS[Math.round(rig.floor)] ?? 'PB';
    if (next !== label) setLabel(next);
  });

  return (
    <>
      <group ref={group}>
        <primitive object={lines} />
        {solids.map((b, i) => (
          <mesh key={i} position={b.p} material={occluderMaterial}>
            <boxGeometry args={b.s} />
          </mesh>
        ))}
        {/* Vidrios laterales con un leve tinte */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * (W / 2 - 0.02), H / 2, 0]} rotation-y={Math.PI / 2} material={glass} renderOrder={1}>
            <planeGeometry args={[D, H]} />
          </mesh>
        ))}
        <mesh position={[0, H - 0.03, -0.1]} rotation-x={Math.PI / 2}>
          <planeGeometry args={[W - 0.7, D - 0.8]} />
          <meshBasicMaterial color={INK.amber} transparent opacity={0.55} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>

        <DoorLeaf side={-1} rig={rig} />
        <DoorLeaf side={1} rig={rig} />

        {/* Luz cálida que sale al abrir las puertas, como en el logo */}
        <mesh position={[0, DOOR_H / 2, D / 2 - 0.3]} renderOrder={4}>
          <planeGeometry args={[OPENING * 1.6, DOOR_H * 1.3]} />
          <meshBasicMaterial ref={glowDoor} map={glowTex} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0.02, D / 2 + 1.1]} rotation-x={-Math.PI / 2} renderOrder={4}>
          <planeGeometry args={[OPENING * 2.4, 2.4]} />
          <meshBasicMaterial ref={glowFloor} map={glowTex} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>

        {/* Display de piso sobre la puerta */}
        <mesh position={[0, DOOR_H + (H - DOOR_H) / 2, D / 2 + 0.058]}>
          <planeGeometry args={[0.5, 0.2]} />
          <meshBasicMaterial color="#071a33" />
        </mesh>
        <Text
          font={fontUrl}
          fontSize={0.13}
          color={INK.amber}
          anchorX="center"
          anchorY="middle"
          position={[0, DOOR_H + (H - DOOR_H) / 2, D / 2 + 0.062]}
        >
          {label}
        </Text>
      </group>
      <group ref={cables}>
        <primitive object={cableLines} />
      </group>
    </>
  );
}
