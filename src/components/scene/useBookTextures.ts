"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import * as THREE from "three";
import { drawCover, drawDesk, drawPage, drawPageEdges } from "@/lib/draw";
import { FONT } from "@/lib/fonts";
import { spreads } from "@/lib/pages";

export type BookTextures = {
  /** Reading order: [title page, p1, p2, …, final page]. */
  pages: THREE.CanvasTexture[];
  cover: THREE.CanvasTexture;
  coverGlow: THREE.CanvasTexture;
  edges: THREE.CanvasTexture;
  desk: THREE.CanvasTexture;
};

const nextFrame = () => new Promise((r) => setTimeout(r, 0));

async function loadFonts() {
  const faces = [
    `400 32px ${FONT.display}`,
    `500 32px ${FONT.display}`,
    `600 32px ${FONT.display}`,
    `700 32px ${FONT.display}`,
    `400 32px ${FONT.mono}`,
    `500 32px ${FONT.mono}`,
    `700 32px ${FONT.mono}`,
    `italic 400 32px ${FONT.mono}`,
  ];
  await Promise.all(faces.map((f) => document.fonts.load(f).catch(() => null)));
  await document.fonts.ready;
}

export function useBookTextures() {
  const gl = useThree((s) => s.gl);
  const [tex, setTex] = useState<BookTextures | null>(null);

  useEffect(() => {
    let cancelled = false;
    const created: THREE.Texture[] = [];
    const aniso = gl.capabilities.getMaxAnisotropy();
    const small = Math.min(window.innerWidth, window.innerHeight) < 700;
    const scale = small ? 1 : 1.3;

    const wrap = (c: HTMLCanvasElement, srgb = true) => {
      const t = new THREE.CanvasTexture(c);
      t.anisotropy = aniso;
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      created.push(t);
      return t;
    };

    (async () => {
      await loadFonts();
      const order = [spreads[0].left];
      spreads.forEach((s, i) => {
        order.push(s.right);
        if (i + 1 < spreads.length) order.push(spreads[i + 1].left);
      });
      const pages: THREE.CanvasTexture[] = [];
      for (let i = 0; i < order.length; i++) {
        if (cancelled) return;
        pages.push(wrap(drawPage(order[i], scale, 17 + i * 31)));
        await nextFrame();
      }
      const cover = wrap(drawCover("color", scale));
      const coverGlow = wrap(drawCover("emissive", scale));
      const edges = wrap(drawPageEdges());
      edges.wrapS = edges.wrapT = THREE.RepeatWrapping;
      const desk = wrap(drawDesk());
      desk.wrapS = desk.wrapT = THREE.RepeatWrapping;
      desk.repeat.set(5, 5);
      if (!cancelled) setTex({ pages, cover, coverGlow, edges, desk });
    })();

    return () => {
      cancelled = true;
      created.forEach((t) => t.dispose());
    };
  }, [gl]);

  return tex;
}
