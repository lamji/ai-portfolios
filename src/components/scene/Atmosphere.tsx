"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { BLOCK, PAGE_WIDTH } from "./dims";

/** Cool desk-lamp key light, violet rim, and the glow of a monitor just out of frame. */
export function Lights() {
  const spot = useRef<THREE.SpotLight>(null);
  const candle = useRef<THREE.PointLight>(null);
  const target = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(PAGE_WIDTH * 0.25, BLOCK, 0);
    return o;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (candle.current) {
      candle.current.intensity = 7 + Math.sin(t * 0.9) * 0.6 + (Math.sin(t * 31.0) > 0.97 ? -1.2 : 0);
    }
  });

  return (
    <>
      <primitive object={target} />
      <ambientLight intensity={0.12} color="#cfdcff" />
      <hemisphereLight intensity={0.18} color="#cfe0ff" groundColor="#05070b" />
      <spotLight
        ref={spot}
        position={[-2.6, 5.4, 2.6]}
        target={target}
        angle={0.55}
        penumbra={0.85}
        intensity={72}
        color="#fff1de"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.015}
        shadow-camera-near={2}
        shadow-camera-far={14}
      />
      <directionalLight position={[3.5, 2.2, -4]} intensity={0.7} color="#8b7bff" />
      <pointLight ref={candle} position={[0.6, 1.4, -3.0]} distance={9} decay={2} color="#3f8cff" intensity={7} />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.5} color="#e8eeff" position={[-3, 4, 3]} scale={[4, 2, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#4fe3c1" position={[4, 2, -4]} scale={[3, 2, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#3f8cff" position={[0, 1.5, -4]} scale={[3, 1.6, 1]} />
      </Environment>
    </>
  );
}

export function Desk({ map }: { map: THREE.Texture }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.0355, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial map={map} roughness={0.72} metalness={0.05} color="#c9d3e0" />
    </mesh>
  );
}

function dotTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.45)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Dust motes drifting through the lamp light. */
export function Dust({ count = 420 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const { geom, seeds, map } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      seeds[i * 4] = (Math.random() - 0.5) * 6;
      seeds[i * 4 + 1] = Math.random() * 2.6;
      seeds[i * 4 + 2] = (Math.random() - 0.5) * 4;
      seeds[i * 4 + 3] = Math.random() * 100;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { geom: g, seeds, map: dotTexture() };
  }, [count]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pos = geom.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const s = seeds[i * 4 + 3];
      pos[i * 3] = seeds[i * 4] + Math.sin(t * 0.07 + s) * 0.35;
      pos[i * 3 + 1] = ((seeds[i * 4 + 1] + t * 0.03 + Math.sin(t * 0.11 + s) * 0.1) % 2.6) + 0.02;
      pos[i * 3 + 2] = seeds[i * 4 + 2] + Math.cos(t * 0.05 + s * 1.3) * 0.3;
    }
    geom.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geom} frustumCulled={false}>
      <pointsMaterial
        map={map}
        size={0.018}
        sizeAttenuation
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        color="#8fe9ff"
      />
    </points>
  );
}
