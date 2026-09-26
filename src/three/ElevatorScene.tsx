import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, advance, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Cabin } from './Cabin';
import { Structure } from './Structure';
import { CABIN, FLOOR_H, INK } from './blueprint';
import { createRig, type Rig } from './rig';
import { floorAt, watchFloors } from '../scripts/floors';

const damp = THREE.MathUtils.damp;
const smoothstep = THREE.MathUtils.smoothstep;

function Director({ rig, compact, reducedMotion }: { rig: Rig; compact: boolean; reducedMotion: boolean }) {
  const camera = useThree((s) => s.camera);
  const target = useMemo(() => new THREE.Vector3(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const arrival = useRef({ departed: false, floor: 0, still: 0 });

  useFrame((_, dt) => {
    dt = Math.min(dt, 0.05);
    // En pantallas chicas la escena vive solo en la portada: la cabina queda en PB.
    const goal = compact ? 0 : floorAt(window.scrollY);
    const prev = rig.floor;
    rig.floor = reducedMotion ? goal : damp(rig.floor, goal, 4.5, dt);
    rig.velocity = damp(rig.velocity, (rig.floor - prev) / Math.max(dt, 1e-4), 8, dt);
    rig.cabinY = rig.floor * FLOOR_H;

    rig.intro = reducedMotion ? 1 : Math.min(1, rig.intro + dt / 2.6);
    const ease = 1 - Math.pow(1 - rig.intro, 3);

    // Puertas: abren al detenerse en un piso y cierran al viajar.
    const dist = Math.abs(rig.floor - Math.round(rig.floor));
    const wantOpen = (1 - smoothstep(dist, 0.02, 0.12)) * smoothstep(rig.intro, 0.45, 0.85);
    rig.open = damp(rig.open, wantOpen, 5, dt);

    // Aviso de llegada (campanilla): la cabina dejó un piso y se detuvo en otro.
    // Se basa en la posición y no en las puertas, que en viajes cortos no llegan a cerrarse.
    // Suena solo si la cabina se detiene (quieta un instante), no al pasar de largo.
    const a = arrival.current;
    if (dist > 0.2) a.departed = true;
    a.still = dist < 0.03 && Math.abs(rig.velocity) < 0.25 ? a.still + dt : 0;
    if (a.departed && a.still > 0.18) {
      a.departed = false;
      const floor = Math.round(rig.floor);
      if (rig.intro >= 1) {
        const direction = floor >= a.floor ? 'up' : 'down';
        window.dispatchEvent(new CustomEvent('elevator:arrive', { detail: { floor, direction } }));
      }
      a.floor = floor;
    }

    const p = reducedMotion ? { x: 0, y: 0 } : rig.pointer;
    const orbit = 0.62 + Math.sin(rig.floor * 1.3) * 0.12 + p.x * 0.08 - (1 - ease) * 0.5;
    const radius = (compact ? 21 : 25) + (1 - ease) * 8;
    const y = rig.cabinY + CABIN.h * 0.5;
    target.set(0, y + (compact ? 0.9 : 0.3), 0);
    pos.set(Math.sin(orbit) * radius, y + 4.2 + p.y * 0.6 + (1 - ease) * 3, Math.cos(orbit) * radius);
    camera.position.lerp(pos, 1 - Math.exp(-5 * dt));
    camera.lookAt(target);
  });
  return null;
}

export default function ElevatorScene() {
  const wrapper = useRef<HTMLDivElement>(null);
  const rig = useMemo(createRig, []);
  const media = useMemo(() => {
    const mq = (q: string) => window.matchMedia(q).matches;
    return { compact: !mq('(min-width: 1024px)'), reducedMotion: mq('(prefers-reduced-motion: reduce)') };
  }, []);
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);

  // Solo desarrollo: ?step congela el loop y expone __step(n) para inspeccionar cuadro a cuadro.
  const stepMode = import.meta.env.DEV && new URLSearchParams(location.search).has('step');
  if (import.meta.env.DEV) {
    const w = window as any;
    w.__rig = rig;
    let t = 0;
    w.__step = (n = 1) => {
      for (let i = 0; i < n; i++) advance((t += 1 / 60));
    };
  }

  useEffect(() => {
    watchFloors();
    const onMove = (e: PointerEvent) => {
      rig.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      rig.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    // No dibujar cuando la escena no está a la vista (ahorra batería en celulares).
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    if (wrapper.current) io.observe(wrapper.current);
    return () => {
      window.removeEventListener('pointermove', onMove);
      io.disconnect();
    };
  }, [rig]);

  return (
    <div
      ref={wrapper}
      className="h-full w-full transition-opacity duration-[1400ms]"
      style={{ opacity: ready ? 1 : 0 }}
      aria-hidden="true"
    >
      <Canvas
        dpr={[1, 2]}
        frameloop={stepMode || !visible ? 'never' : 'always'}
        camera={{ fov: 24, near: 0.1, far: 80, position: [12, 6, 20] }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: stepMode }}
        onCreated={({ scene }) => {
          scene.fog = new THREE.Fog(INK.fog, 22, 44);
          setReady(true);
        }}
      >
        <Suspense fallback={null}>
          <Director rig={rig} compact={media.compact} reducedMotion={media.reducedMotion} />
          <Structure rig={rig} />
          <Cabin rig={rig} />
        </Suspense>
      </Canvas>
    </div>
  );
}
