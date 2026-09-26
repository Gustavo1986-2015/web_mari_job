import { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas, advance, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, PerformanceMonitor, Sparkles } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Cabin } from './Cabin';
import { Structure } from './Structure';
import { CABIN, FLOOR_H, createMaterials } from './materials';
import { createRig, type Rig } from './rig';
import { floorAt, watchFloors } from '../scripts/floors';

const damp = THREE.MathUtils.damp;
const smoothstep = THREE.MathUtils.smoothstep;

function useDevice() {
  return useMemo(() => {
    const mq = (q: string) => window.matchMedia(q).matches;
    return {
      mobile: mq('(max-width: 767px)') || mq('(pointer: coarse)'),
      reducedMotion: mq('(prefers-reduced-motion: reduce)'),
    };
  }, []);
}

function Director({ rig, mobile, reducedMotion }: { rig: Rig; mobile: boolean; reducedMotion: boolean }) {
  const { camera, size } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);

  // En escritorio la cabina se ubica a la derecha para dejar lugar al texto.
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const wide = size.width >= 1024;
    if (wide) cam.setViewOffset(size.width, size.height, -size.width * 0.2, 0, size.width, size.height);
    else cam.clearViewOffset();
    cam.updateProjectionMatrix();
  }, [camera, size]);

  useFrame((_, dt) => {
    dt = Math.min(dt, 0.05);
    const goal = floorAt(window.scrollY);
    const prev = rig.floor;
    rig.floor = reducedMotion ? goal : damp(rig.floor, goal, 5, dt);
    rig.velocity = damp(rig.velocity, (rig.floor - prev) / Math.max(dt, 1e-4), 8, dt);
    rig.cabinY = rig.floor * FLOOR_H;

    rig.intro = reducedMotion ? 1 : Math.min(1, rig.intro + dt / 2.4);
    const introEase = 1 - Math.pow(1 - rig.intro, 3);

    // Puertas: se abren al detenerse en un piso y se cierran al viajar.
    const dist = Math.abs(rig.floor - Math.round(rig.floor));
    const wantOpen = (1 - smoothstep(dist, 0.02, 0.14)) * smoothstep(rig.intro, 0.35, 0.8);
    rig.open = damp(rig.open, wantOpen, 5, dt);

    const p = rig.pointer;
    const orbit = 0.42 + Math.sin(rig.floor * 1.1) * 0.12 + (reducedMotion ? 0 : p.x * 0.06);
    const radius = (mobile ? 15 : 12.5) + (1 - introEase) * 6;
    const y = rig.cabinY + CABIN.h * 0.5;
    target.set(0, y + (mobile ? 0.5 : 0), 0);
    pos.set(
      Math.sin(orbit) * radius,
      y + 2.4 + (reducedMotion ? 0 : p.y * 0.4) + (1 - introEase) * 2,
      Math.cos(orbit) * radius,
    );
    camera.position.lerp(pos, 1 - Math.exp(-6 * dt));
    camera.lookAt(target);
  });
  return null;
}

function Scene({ rig, mobile, reducedMotion, fx }: { rig: Rig; mobile: boolean; reducedMotion: boolean; fx: boolean }) {
  const m = useMemo(createMaterials, []);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    scene.fog = new THREE.Fog('#07090d', 10, 30);
    scene.background = new THREE.Color('#07090d');
  }, [scene]);

  return (
    <>
      <Director rig={rig} mobile={mobile} reducedMotion={reducedMotion} />
      <ambientLight intensity={0.45} color="#9fb0c8" />
      <directionalLight position={[6, 12, 8]} intensity={1.1} color="#dfe8ff" />
      <directionalLight position={[-6, 4, -6]} intensity={0.7} color="#f2a93b" />

      {/* Entorno de iluminación procedural para los reflejos del acero. */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[0, 6, 4]} scale={[10, 2, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.2} position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[8, 0.6, 1]} color="#cfe0ff" />
        <Lightformer form="rect" intensity={1.6} position={[6, 0, 1]} rotation-y={-Math.PI / 2} scale={[8, 0.5, 1]} color="#ffb347" />
        <Lightformer form="ring" intensity={0.8} position={[0, -3, 6]} scale={3} color="#8fa6c4" />
      </Environment>

      <Structure m={m} rig={rig} />
      <Cabin m={m} rig={rig} />
      {!reducedMotion && <FollowSparkles rig={rig} count={mobile ? 30 : 70} />}

      {fx && (
        <EffectComposer multisampling={4}>
          <Bloom mipmapBlur luminanceThreshold={1} intensity={0.9} radius={0.7} />
          <Vignette eskil={false} offset={0.2} darkness={0.75} />
        </EffectComposer>
      )}
    </>
  );
}

function FollowSparkles({ rig, count }: { rig: Rig; count: number }) {
  const [group, set] = useState<THREE.Group | null>(null);
  useFrame(() => {
    if (group) group.position.y = rig.cabinY + 1.4;
  });
  return (
    <group ref={set}>
      <Sparkles count={count} scale={[6, 7, 5]} size={2.2} speed={0.25} opacity={0.55} color="#f5b95c" />
    </group>
  );
}

export default function ElevatorScene() {
  const { mobile, reducedMotion } = useDevice();
  const rig = useMemo(createRig, []);
  // Solo desarrollo: ?step congela el loop y expone __step(n) para inspeccionar la escena cuadro a cuadro.
  const stepMode = import.meta.env.DEV && new URLSearchParams(location.search).has('step');
  if (import.meta.env.DEV) {
    const w = window as any;
    w.__rig = rig;
    let t = 0;
    w.__step = (n = 1) => {
      for (let i = 0; i < n; i++) advance((t += 1 / 60));
    };
  }
  const [fx, setFx] = useState(!mobile);
  const [dpr, setDpr] = useState(mobile ? 1.25 : 1.75);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    watchFloors();
    const onMove = (e: PointerEvent) => {
      rig.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      rig.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [rig]);

  return (
    <div
      className="h-full w-full transition-opacity duration-[1600ms]"
      style={{ opacity: ready ? 1 : 0 }}
      aria-hidden="true"
    >
      <Canvas
        dpr={dpr}
        frameloop={stepMode ? 'never' : 'always'}
        gl={{ antialias: !fx, powerPreference: 'high-performance', stencil: false, preserveDrawingBuffer: stepMode }}
        camera={{ fov: 30, near: 0.1, far: 60, position: [6, 4, 14] }}
        onCreated={() => setReady(true)}
        fallback={<div className="h-full w-full bg-[radial-gradient(ellipse_at_70%_40%,#1a2433,#07090d_70%)]" />}
      >
        <PerformanceMonitor
          onDecline={() => {
            setFx(false);
            setDpr(1);
          }}
        />
        <Suspense fallback={null}>
          <Scene rig={rig} mobile={mobile} reducedMotion={reducedMotion} fx={fx} />
        </Suspense>
      </Canvas>
    </div>
  );
}
