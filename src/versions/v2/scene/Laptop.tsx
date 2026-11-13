"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { type Pose, store } from "../store";
import { drawScreen, makeScreen } from "./screen";

const W = 3.2; // base width
const D = 2.2; // base depth
const T = 0.12; // base thickness
const LID_T = 0.07;
const FOV = 30;
const CAM_Z = 14;
const HALF_H = CAM_Z * Math.tan(((FOV / 2) * Math.PI) / 180);
export const CAMERA = { fov: FOV, z: CAM_Z };

const aluminium = new THREE.MeshPhysicalMaterial({ color: "#cfd0d2", metalness: 0.85, roughness: 0.3, clearcoat: 0.4, clearcoatRoughness: 0.25 });
const darkAl = new THREE.MeshPhysicalMaterial({ color: "#b9babd", metalness: 0.8, roughness: 0.42 });
const keyMat = new THREE.MeshStandardMaterial({ color: "#1c1c1c", roughness: 0.55 });
const bezelMat = new THREE.MeshPhysicalMaterial({ color: "#0b0b0b", roughness: 0.15, clearcoat: 1 });

/** A soft round shadow under the laptop (the page is white, so no floor is drawn). */
function shadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(0,0,0,0.5)");
  g.addColorStop(0.6, "rgba(0,0,0,0.14)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

/**
 * The hero object: a glossy aluminium laptop built from primitives. It follows the pose the page
 * asks for (position, size, turn, lid angle) with damping, floats gently, and leans toward the
 * pointer. The screen is a canvas that changes with the section.
 */
export function Laptop() {
  const size = useThree((s) => s.size);
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);
  const shadow = useRef<THREE.MeshBasicMaterial>(null);
  const cur = useMemo<Pose>(() => ({ ...store.pose, lid: 0, y: store.pose.y - 0.25 }), []);
  const screen = useMemo(() => makeScreen(), []);
  const drawn = useRef("");
  const born = useRef(0);

  const geo = useMemo(() => {
    const keys: [number, number][] = [];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 14; c++) keys.push([(c - 6.5) * 0.19, -0.62 + r * 0.19]);
    return {
      base: new RoundedBoxGeometry(W, T, D, 3, 0.05),
      lid: new RoundedBoxGeometry(W, LID_T, D - 0.04, 3, 0.03),
      key: new THREE.BoxGeometry(0.16, 0.02, 0.16),
      keys,
      shadow: shadowTexture(),
    };
  }, []);

  // draw once the fonts are ready, and again whenever the section asks for another screen
  useEffect(() => {
    document.fonts.ready.then(() => (drawn.current = ""));
  }, []);

  useFrame((state, dt) => {
    const g = root.current;
    if (!g) return;
    if (!born.current) born.current = state.clock.elapsedTime;
    const age = state.clock.elapsedTime - born.current;
    const key = `${store.screen.mode}:${store.screen.project}`;
    if (key !== drawn.current) {
      drawScreen(screen.canvas, store.screen);
      screen.texture.needsUpdate = true;
      drawn.current = key;
    }
    // follow the requested pose; the lid opens on arrival
    const k = 1 - Math.exp(-Math.min(dt, 0.1) * 4);
    const target = store.pose;
    cur.x += (target.x - cur.x) * k;
    cur.y += (target.y - cur.y) * k;
    cur.s += (target.s - cur.s) * k;
    cur.ry += (target.ry - cur.ry) * k;
    cur.rx += (target.rx - cur.rx) * k;
    const lidTarget = age < 0.5 ? 0 : target.lid;
    cur.lid += (lidTarget - cur.lid) * (1 - Math.exp(-Math.min(dt, 0.1) * 3));

    const aspect = size.width / size.height;
    const t = state.clock.elapsedTime;
    g.position.set(cur.x * HALF_H * aspect, cur.y * HALF_H + Math.sin(t * 0.9) * 0.06, 0);
    g.scale.setScalar(cur.s);
    if (body.current) {
      body.current.rotation.set(cur.rx + store.pointer.y * -0.06, cur.ry + store.pointer.x * 0.12 + Math.sin(t * 0.5) * 0.03, Math.sin(t * 0.7) * 0.015);
    }
    if (lid.current) lid.current.rotation.x = -cur.lid;
    if (shadow.current) shadow.current.opacity += ((store.dark ? 0 : 1) - shadow.current.opacity) * k;
  });

  return (
    <group ref={root}>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.75}>
        <planeGeometry args={[4.8, 3.6]} />
        <meshBasicMaterial ref={shadow} map={geo.shadow} transparent depthWrite={false} opacity={1} />
      </mesh>
      <group ref={body}>
        {/* base */}
        <mesh geometry={geo.base} material={aluminium} />
        <mesh rotation-x={-Math.PI / 2} position={[0, T / 2 + 0.001, -0.25]} material={darkAl}>
          <planeGeometry args={[2.86, 1.08]} />
        </mesh>
        {geo.keys.map(([x, z], i) => (
          <mesh key={i} geometry={geo.key} material={keyMat} position={[x, T / 2 + 0.01, z + 0.12]} />
        ))}
        <mesh rotation-x={-Math.PI / 2} position={[0, T / 2 + 0.001, 0.62]} material={darkAl}>
          <planeGeometry args={[1.15, 0.66]} />
        </mesh>
        {/* lid, hinged at the back edge */}
        <group ref={lid} position={[0, T / 2, -D / 2 + 0.02]}>
          <group position={[0, LID_T / 2 + 0.002, D / 2 - 0.02]}>
            <mesh geometry={geo.lid} material={aluminium} />
            {/* the display faces the keyboard when closed and the viewer when open */}
            <mesh rotation-x={Math.PI / 2} position={[0, -LID_T / 2 - 0.001, 0]} material={bezelMat}>
              <planeGeometry args={[W - 0.1, D - 0.12]} />
            </mesh>
            <mesh rotation-x={Math.PI / 2} position={[0, -LID_T / 2 - 0.002, 0.03]}>
              <planeGeometry args={[2.88, 1.8]} />
              <meshBasicMaterial map={screen.texture} toneMapped={false} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
