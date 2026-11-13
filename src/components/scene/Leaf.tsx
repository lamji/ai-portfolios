"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { scrollStore } from "@/lib/scroll-store";
import { LEAF_COUNT, easeInOutCubic, local } from "@/lib/timeline";
import { BLOCK, LEAF_GAP, PAGE_DEPTH, PAGE_WIDTH } from "./dims";

const SEGMENTS = 48;

/**
 * A single sheet of paper hinged at the spine. Its shape is computed on the CPU
 * every frame: the sheet is treated as a strip whose angle changes linearly
 * along its width, which gives a smooth, physically plausible curl while it turns.
 */
export function Leaf({ index, front, back }: { index: number; front: THREE.Texture; back: THREE.Texture }) {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const cols = SEGMENTS + 1;
    const pos = new Float32Array(cols * 2 * 3);
    const uv = new Float32Array(cols * 2 * 2);
    const idx: number[] = [];
    for (let i = 0; i < cols; i++) {
      const u = i / SEGMENTS;
      // j = 0 → far edge (top of page, v = 1); j = 1 → near edge (v = 0)
      for (let j = 0; j < 2; j++) {
        const k = i * 2 + j;
        uv[k * 2] = u;
        uv[k * 2 + 1] = 1 - j;
        pos[k * 3 + 2] = j === 0 ? -PAGE_DEPTH / 2 : PAGE_DEPTH / 2;
      }
      if (i < SEGMENTS) {
        const a = i * 2;
        const b = i * 2 + 1;
        const c = (i + 1) * 2;
        const d = (i + 1) * 2 + 1;
        idx.push(a, b, c, c, b, d);
      }
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    g.setIndex(idx);
    return g;
  }, []);

  const backTex = useMemo(() => {
    // Seen from behind, the sheet's UVs run right-to-left: mirror the texture.
    const t = back.clone();
    t.repeat.x = -1;
    t.offset.x = 1;
    t.needsUpdate = true;
    return t;
  }, [back]);

  const last = useRef({ a: -1, b: -1, o: -1 });

  const shape = (angle: number, bend: number, offset: number) => {
    const L = last.current;
    if (Math.abs(L.a - angle) < 1e-5 && Math.abs(L.b - bend) < 1e-5 && Math.abs(L.o - offset) < 1e-6) return;
    L.a = angle;
    L.b = bend;
    L.o = offset;
    const pos = geom.attributes.position.array as Float32Array;
    const k = bend / PAGE_WIDTH; // curvature (rad per unit)
    const a0 = angle;
    for (let i = 0; i <= SEGMENTS; i++) {
      const s = (i / SEGMENTS) * PAGE_WIDTH;
      let x: number;
      let y: number;
      if (Math.abs(k) < 1e-4) {
        x = s * Math.cos(a0);
        y = s * Math.sin(a0);
      } else {
        x = (Math.sin(a0 + k * s) - Math.sin(a0)) / k;
        y = (Math.cos(a0) - Math.cos(a0 + k * s)) / k;
      }
      for (let j = 0; j < 2; j++) {
        const v = (i * 2 + j) * 3;
        pos[v] = x;
        pos[v + 1] = y + offset;
      }
    }
    geom.attributes.position.needsUpdate = true;
    geom.computeVertexNormals();
  };

  useLayoutEffect(() => {
    shape(0, 0, (LEAF_COUNT - index) * LEAF_GAP);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(() => {
    const p = scrollStore.progress;
    const t = local(p, `turn${index}`);
    const close = easeInOutCubic(local(p, "close"));
    // The sheet lifts from the spine first and its free edge trails behind,
    // so it stays curled for the whole arc (edge angle never leaves 0…π).
    const LAG = 0.2;
    const spineAngle = Math.PI * easeInOutCubic(Math.min(1, t / (1 - LAG)));
    const edgeAngle = Math.PI * easeInOutCubic(Math.max(0, (t - LAG) / (1 - LAG)));
    let angle = spineAngle;
    let bend = edgeAngle - spineAngle;
    // Closing the book swings every turned leaf back as one rigid stack.
    angle *= 1 - close;
    bend *= 1 - close;
    const turned = angle / Math.PI;
    const offset = THREE.MathUtils.lerp((LEAF_COUNT - index) * LEAF_GAP, (index + 1) * LEAF_GAP, turned);
    shape(angle, bend, offset);
  });

  return (
    <group position={[0, BLOCK, 0]}>
      <mesh geometry={geom} castShadow receiveShadow frustumCulled={false}>
        <meshStandardMaterial map={front} roughness={0.92} side={THREE.FrontSide} shadowSide={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geom} receiveShadow frustumCulled={false}>
        <meshStandardMaterial map={backTex} roughness={0.92} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}
