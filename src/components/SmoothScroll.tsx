"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { scrollStore } from "@/lib/scroll-store";

/** Buttery inertial scrolling that feeds the global progress value. */
export function SmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = new Lenis({ lerp: reduce ? 1 : 0.075, smoothWheel: !reduce, wheelMultiplier: 0.9 });
    const max = () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

    const update = () => {
      scrollStore.target = Math.min(1, Math.max(0, lenis.scroll / max()));
    };
    lenis.on("scroll", update);
    update();
    scrollStore.progress = scrollStore.target;

    scrollStore.scrollTo = (p: number) => {
      lenis.scrollTo(p * max(), { duration: reduce ? 0 : 2.4 });
    };

    // Hold the scroll until the book is bound (fonts + textures ready).
    if (!scrollStore.ready) lenis.stop();
    const onReady = () => lenis.start();
    scrollStore.readyListeners.add(onReady);

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onPointer = (e: PointerEvent) => {
      scrollStore.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      scrollStore.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      scrollStore.readyListeners.delete(onReady);
      lenis.destroy();
    };
  }, []);

  return null;
}
