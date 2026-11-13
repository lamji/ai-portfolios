"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { useEffect } from "react";
import * as THREE from "three";
import { scrollStore, stepProgress } from "@/lib/scroll-store";
import { Book } from "./Book";
import { CameraRig } from "./CameraRig";
import { Desk, Dust, Lights } from "./Atmosphere";
import { useBookTextures } from "./useBookTextures";

function Progress() {
  useFrame((_, dt) => stepProgress(Math.min(dt, 0.1)));
  return null;
}

function World() {
  const tex = useBookTextures();
  useEffect(() => {
    if (tex) requestAnimationFrame(() => scrollStore.setReady());
  }, [tex]);
  if (!tex) return null;
  return (
    <>
      <Book tex={tex} />
      <Desk map={tex.desk} />
    </>
  );
}

export default function Scene() {
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 35, near: 0.05, far: 60, position: [3, 2.5, 4.5] }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.NoToneMapping;
        scene.background = new THREE.Color("#06080c");
        scene.fog = new THREE.Fog("#06080c", 6, 16);
      }}
    >
      <Progress />
      <CameraRig />
      <Lights />
      <World />
      <Dust />
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur intensity={0.7} luminanceThreshold={0.98} luminanceSmoothing={0.15} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette offset={0.22} darkness={0.82} />
        <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.12} />
      </EffectComposer>
    </Canvas>
  );
}
