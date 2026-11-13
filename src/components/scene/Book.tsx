"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { scrollStore } from "@/lib/scroll-store";
import { LEAF_COUNT, easeInOutCubic, local } from "@/lib/timeline";
import type { BookTextures } from "./useBookTextures";
import { Leaf } from "./Leaf";
import { BLOCK, COVER, COVER_DEPTH, COVER_WIDTH, PAGE_DEPTH, PAGE_WIDTH } from "./dims";

const SPINE_LEN = BLOCK * 2 + COVER * 2;

export function Book({ tex }: { tex: BookTextures }) {
  const front = useRef<THREE.Group>(null);
  const spine = useRef<THREE.Group>(null);
  const coverMat = useRef<THREE.MeshStandardMaterial>(null);

  const leather = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#151b25", roughness: 0.5, metalness: 0.25 }),
    [],
  );
  const gold = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0c1a1a",
        roughness: 0.4,
        metalness: 0.2,
        emissive: "#4fe3c1",
        emissiveIntensity: 1.6,
      }),
    [],
  );
  const edges = useMemo(
    () => new THREE.MeshStandardMaterial({ map: tex.edges, roughness: 0.95, color: "#ffffff" }),
    [tex.edges],
  );

  useFrame((state) => {
    const p = scrollStore.progress;
    const open = easeInOutCubic(local(p, "open"));
    const close = easeInOutCubic(local(p, "close"));
    const o = open * (1 - close);
    if (front.current) front.current.rotation.z = -Math.PI * (1 - o);
    if (spine.current) spine.current.rotation.z = -(Math.PI / 2) * (1 - o);
    if (coverMat.current) {
      // The circuit traces pulse while the book is closed.
      const closed = 1 - o;
      coverMat.current.emissiveIntensity = 0.15 + closed * (1.0 + 0.5 * Math.sin(state.clock.elapsedTime * 1.6));
    }
  });

  const leaves = [];
  for (let i = 0; i < LEAF_COUNT; i++) {
    leaves.push(<Leaf key={i} index={i} front={tex.pages[i * 2 + 1]} back={tex.pages[i * 2 + 2]} />);
  }

  return (
    <group>
      {/* back cover */}
      <mesh position={[COVER_WIDTH / 2, -COVER / 2, 0]} material={leather} castShadow receiveShadow>
        <boxGeometry args={[COVER_WIDTH, COVER, COVER_DEPTH]} />
      </mesh>

      {/* right half of the text block + final page */}
      <mesh position={[PAGE_WIDTH / 2, BLOCK / 2, 0]} material={edges} castShadow receiveShadow>
        <boxGeometry args={[PAGE_WIDTH - 0.01, BLOCK, PAGE_DEPTH - 0.01]} />
      </mesh>
      <mesh position={[PAGE_WIDTH / 2, BLOCK + 0.0005, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[PAGE_WIDTH, PAGE_DEPTH]} />
        <meshStandardMaterial map={tex.pages[tex.pages.length - 1]} roughness={0.92} />
      </mesh>

      {/* front cover + left half of the text block, hinged at the spine */}
      <group ref={front} position={[0, BLOCK, 0]} rotation-z={-Math.PI}>
        <mesh position={[-PAGE_WIDTH / 2, -BLOCK / 2, 0]} material={edges} castShadow receiveShadow>
          <boxGeometry args={[PAGE_WIDTH - 0.01, BLOCK, PAGE_DEPTH - 0.01]} />
        </mesh>
        <mesh position={[-PAGE_WIDTH / 2, 0.0005, 0]} rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[PAGE_WIDTH, PAGE_DEPTH]} />
          <meshStandardMaterial map={tex.pages[0]} roughness={0.92} />
        </mesh>
        <mesh position={[-COVER_WIDTH / 2, -BLOCK - COVER / 2, 0]} material={leather} castShadow receiveShadow>
          <boxGeometry args={[COVER_WIDTH, COVER, COVER_DEPTH]} />
        </mesh>
        <group rotation-z={Math.PI}>
          <mesh position={[COVER_WIDTH / 2, BLOCK + COVER + 0.0008, 0]} rotation-x={-Math.PI / 2} receiveShadow>
            <planeGeometry args={[COVER_WIDTH, COVER_DEPTH]} />
            <meshStandardMaterial
              ref={coverMat}
              map={tex.cover}
              emissiveMap={tex.coverGlow}
              emissive="#ffffff"
              emissiveIntensity={0.6}
              roughness={0.45}
              metalness={0.3}
            />
          </mesh>
        </group>
      </group>

      {/* spine: rotates half as far as the cover so it stays wrapped around the block */}
      <group ref={spine} position={[0, -COVER, 0]} rotation-z={-Math.PI / 2}>
        <mesh position={[-SPINE_LEN / 2, -COVER / 2, 0]} material={leather} castShadow receiveShadow>
          <boxGeometry args={[SPINE_LEN, COVER, COVER_DEPTH]} />
        </mesh>
        {[-0.78, -0.7, 0.7, 0.78].map((z) => (
          <mesh key={z} position={[-SPINE_LEN / 2, -COVER - 0.0012, z]} material={gold}>
            <boxGeometry args={[SPINE_LEN, 0.002, 0.012]} />
          </mesh>
        ))}
      </group>

      {leaves}
    </group>
  );
}
