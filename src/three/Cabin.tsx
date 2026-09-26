import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CABIN, drawLabel, type Materials } from './materials';
import type { Rig } from './rig';
import { FLOOR_LABELS } from '../scripts/floors';

const { w: W, h: H, d: D } = CABIN;
const OPENING = 1.2;
const DOOR_W = OPENING / 2 + 0.02;
const DOOR_H = 2.25;
const SIDE_PANEL = (W - OPENING) / 2;

export function Cabin({ m, rig }: { m: Materials; rig: Rig }) {
  const group = useRef<THREE.Group>(null!);
  const doorL = useRef<THREE.Mesh>(null!);
  const doorR = useRef<THREE.Mesh>(null!);
  const inner = useRef<THREE.PointLight>(null!);
  const spill = useRef<THREE.PointLight>(null!);
  const sill = useRef<THREE.MeshBasicMaterial>(null!);

  // Display de piso sobre la puerta.
  const display = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 96;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return { canvas, tex, last: '' };
  }, []);

  const redraw = (label: string, arrow: 'up' | 'down' | null) => {
    const key = label + arrow;
    if (key === display.last) return;
    display.last = key;
    drawLabel(display.canvas, label, { color: '#ffb547', bg: '#07090c', size: 64, arrow });
    display.tex.needsUpdate = true;
  };

  useEffect(() => {
    redraw('PB', null);
    document.fonts?.ready.then(() => {
      display.last = '';
      redraw(FLOOR_LABELS[Math.round(rig.floor)] ?? 'PB', null);
    });
    return () => display.tex.dispose();
  }, []);

  useFrame(() => {
    group.current.position.y = rig.cabinY;

    const travel = rig.open * (OPENING / 2 - 0.02);
    doorL.current.position.x = -DOOR_W / 2 + 0.01 - travel;
    doorR.current.position.x = DOOR_W / 2 - 0.01 + travel;

    inner.current.intensity = 2 + rig.open * 5;
    spill.current.intensity = rig.open * 5;
    sill.current.color.setRGB(0.4 + rig.open * 2.2, 0.24 + rig.open * 1.3, 0.08 + rig.open * 0.35);

    const label = FLOOR_LABELS[Math.round(rig.floor)] ?? 'PB';
    redraw(label, Math.abs(rig.velocity) > 0.02 ? (rig.velocity > 0 ? 'up' : 'down') : null);
  });

  return (
    <group ref={group}>
      {/* Plataforma, piso interior y techo */}
      <mesh material={m.darkSteel} position={[0, -0.08, 0]} castShadow>
        <boxGeometry args={[W + 0.12, 0.16, D + 0.12]} />
      </mesh>
      <mesh material={m.floorStone} position={[0, 0.005, 0]}>
        <boxGeometry args={[W - 0.06, 0.01, D - 0.06]} />
      </mesh>
      <mesh material={m.darkSteel} position={[0, H + 0.06, 0]}>
        <boxGeometry args={[W + 0.12, 0.12, D + 0.12]} />
      </mesh>
      <mesh material={m.warmLight} position={[0, H - 0.005, -0.1]}>
        <boxGeometry args={[W - 0.7, 0.01, D - 0.8]} />
      </mesh>

      {/* Pared de fondo en acero cepillado y pasamanos */}
      <mesh material={m.steel} position={[0, H / 2, -D / 2 + 0.025]}>
        <boxGeometry args={[W - 0.02, H, 0.05]} />
      </mesh>
      <mesh material={m.rail} position={[0, 0.95, -D / 2 + 0.12]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.022, 0.022, W - 0.5, 16]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={m.rail} position={[s * (W / 2 - 0.4), 0.95, -D / 2 + 0.08]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.014, 0.014, 0.1, 8]} />
        </mesh>
      ))}

      {/* Laterales de vidrio con parantes */}
      {[-1, 1].map((s) => (
        <mesh key={`g${s}`} material={m.glass} position={[s * (W / 2 - 0.02), H / 2, 0]}>
          <boxGeometry args={[0.03, H, D - 0.1]} />
        </mesh>
      ))}
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz]) => (
        <mesh key={`p${sx}${sz}`} material={m.darkSteel} position={[sx * (W / 2 - 0.02), H / 2, sz * (D / 2 - 0.02)]}>
          <boxGeometry args={[0.07, H, 0.07]} />
        </mesh>
      ))}

      {/* Frente: paneles fijos, dintel y puertas corredizas */}
      {[-1, 1].map((s) => (
        <mesh key={`f${s}`} material={m.steel} position={[s * (OPENING / 2 + SIDE_PANEL / 2), H / 2, D / 2 + 0.03]}>
          <boxGeometry args={[SIDE_PANEL, H, 0.05]} />
        </mesh>
      ))}
      <mesh material={m.steel} position={[0, DOOR_H + (H - DOOR_H) / 2, D / 2 + 0.03]}>
        <boxGeometry args={[OPENING + 0.02, H - DOOR_H, 0.05]} />
      </mesh>
      <mesh ref={doorL} material={m.doorSteel} position={[-DOOR_W / 2, DOOR_H / 2, D / 2 - 0.02]}>
        <boxGeometry args={[DOOR_W, DOOR_H, 0.04]} />
      </mesh>
      <mesh ref={doorR} material={m.doorSteel} position={[DOOR_W / 2, DOOR_H / 2, D / 2 - 0.02]}>
        <boxGeometry args={[DOOR_W, DOOR_H, 0.04]} />
      </mesh>
      <mesh position={[0, DOOR_H + (H - DOOR_H) / 2, D / 2 + 0.058]}>
        <planeGeometry args={[0.46, 0.17]} />
        <meshBasicMaterial map={display.tex} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.012, D / 2 + 0.03]}>
        <boxGeometry args={[OPENING, 0.012, 0.06]} />
        <meshBasicMaterial ref={sill} toneMapped={false} />
      </mesh>

      {/* Luces: interior cálida y derrame hacia afuera al abrir */}
      <pointLight ref={inner} position={[0, H - 0.4, 0]} color="#ffd6a0" distance={5} decay={2} />
      <pointLight ref={spill} position={[0, 1.2, D / 2 + 0.7]} color="#ffb24d" distance={6} decay={2} />

      {/* Cabezal, patines y cables de tracción */}
      <mesh material={m.darkSteel} position={[0, H + 0.32, 0]}>
        <boxGeometry args={[W + 0.5, 0.2, 0.22]} />
      </mesh>
      {[-1, 1].map((s) =>
        [0.25, H - 0.25].map((y) => (
          <mesh key={`${s}${y}`} material={m.frame} position={[s * (W / 2 + 0.2), y, 0]}>
            <boxGeometry args={[0.16, 0.18, 0.18]} />
          </mesh>
        )),
      )}
      {[-0.24, -0.08, 0.08, 0.24].map((x) => (
        <mesh key={x} material={m.cable} position={[x, H + 0.42 + 30, 0]}>
          <cylinderGeometry args={[0.013, 0.013, 60, 6]} />
        </mesh>
      ))}
    </group>
  );
}
