"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { scrollStore } from "@/lib/scroll-store";
import {
  LEAF_COUNT,
  easeInOutCubic,
  easeInOutQuart,
  easeInOutSine,
  local,
  phase,
} from "@/lib/timeline";
import { BLOCK, PAGE_WIDTH } from "./dims";

type Pose = { pos: THREE.Vector3; tgt: THREE.Vector3 };

const mkPose = (): Pose => ({ pos: new THREE.Vector3(), tgt: new THREE.Vector3() });

function lerpPose(out: Pose, a: Pose, b: Pose, t: number) {
  out.pos.lerpVectors(a.pos, b.pos, t);
  out.tgt.lerpVectors(a.tgt, b.tgt, t);
  return out;
}

/**
 * Directs the camera like a film crew: a slow push-in on the closed book, a
 * crane move over it as the cover opens, a reading dolly across each spread,
 * a lift that follows every turning page, and a pull-back as the book closes.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const tmp = useMemo(
    () => ({ a: mkPose(), b: mkPose(), out: mkPose(), parallax: new THREE.Vector2(), sph: new THREE.Spherical() }),
    [],
  );

  useFrame((state) => {
    const p = scrollStore.progress;
    const time = state.clock.elapsedTime;
    const aspect = size.width / size.height;
    const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const portrait = aspect < 0.85;

    // Distance that frames a spread (landscape) or a single page (portrait).
    const readDist = portrait
      ? (PAGE_WIDTH * 0.56) / (tanH * aspect)
      : Math.max(1.02 / tanH, 1.6 / (tanH * aspect));
    const pan = portrait ? PAGE_WIDTH / 2 : 0.3;
    const tilt = 0.4;

    const heroRadius = Math.max(4.9, 1.15 / (tanH * aspect));

    const orbit = (out: Pose, radius: number, polar: number, azimuth: number, shiftX: number, shiftZ: number) => {
      out.tgt.set(PAGE_WIDTH / 2 + shiftX, BLOCK, shiftZ);
      tmp.sph.set(radius, polar, azimuth);
      out.pos.setFromSpherical(tmp.sph).add(out.tgt);
      return out;
    };
    const hero = (out: Pose, t: number) => {
      const e = easeInOutSine(t);
      return orbit(
        out,
        heroRadius - 0.6 * e,
        0.98 - 0.12 * e + Math.sin(time * 0.25) * 0.015,
        0.5 - 0.3 * e + Math.sin(time * 0.18) * 0.03,
        portrait ? 0 : -0.75 * (1 - e),
        portrait ? -0.55 * (1 - e) : 0,
      );
    };
    const read = (out: Pose, x: number, lift = 1) => {
      const d = readDist * lift;
      out.tgt.set(x, BLOCK, 0.04);
      out.pos.set(x, BLOCK + d * Math.cos(tilt), 0.04 + d * Math.sin(tilt));
      return out;
    };
    const end = (out: Pose) =>
      orbit(
        out,
        heroRadius * 1.04,
        0.9 + Math.sin(time * 0.2) * 0.015,
        -0.38 + Math.sin(time * 0.15) * 0.03,
        portrait ? 0 : -0.7,
        portrait ? -0.55 : 0,
      );

    const { a, b, out } = tmp;
    const [, heroEnd] = phase("hero");
    const [, openEnd] = phase("open");
    const [closeStart] = phase("close");

    if (p <= heroEnd) {
      hero(out, local(p, "hero"));
    } else if (p <= openEnd) {
      // Crane up and over as the cover swings open.
      const t = easeInOutCubic(local(p, "open"));
      hero(a, 1);
      read(b, -pan, 1.08);
      lerpPose(out, a, b, t);
      out.pos.y += Math.sin(Math.PI * t) * 0.7;
    } else if (p < closeStart) {
      // Reading: dolly left page → right page, then follow the turning page back.
      let handled = false;
      for (let i = 0; i <= LEAF_COUNT; i++) {
        if (p <= phase(`hold${i}`)[1]) {
          const h = local(p, `hold${i}`);
          // Portrait screens show one page at a time: dwell on each, then glide across.
          const t = portrait ? THREE.MathUtils.smootherstep(h, 0.38, 0.62) : easeInOutSine(h);
          read(out, THREE.MathUtils.lerp(-pan, pan, t), i === 0 ? 1.08 - 0.08 * t : 1);
          handled = true;
          break;
        }
        if (i < LEAF_COUNT && p <= phase(`turn${i}`)[1]) {
          const t = local(p, `turn${i}`);
          read(out, THREE.MathUtils.lerp(pan, -pan, easeInOutQuart(t)), 1 + 0.16 * Math.sin(Math.PI * t));
          handled = true;
          break;
        }
      }
      if (!handled) read(out, pan);
    } else {
      // Pull back to a hero shot as the book closes.
      const t = easeInOutCubic(local(p, "close"));
      read(a, pan, 1);
      end(b);
      lerpPose(out, a, b, t);
      out.pos.y += Math.sin(Math.PI * t) * 0.5;
    }

    // Hand-held feel: subtle breathing + pointer parallax.
    tmp.parallax.lerp(scrollStore.pointer, 0.04);
    out.pos.x += tmp.parallax.x * 0.12 + Math.sin(time * 0.6) * 0.008;
    out.pos.y += tmp.parallax.y * 0.08 + Math.sin(time * 0.43) * 0.006;

    camera.position.copy(out.pos);
    camera.lookAt(out.tgt);
  });

  return null;
}
