import { Experience } from "@/components/Experience";
import { Overlay } from "@/components/Overlay";
import { SmoothScroll } from "@/components/SmoothScroll";
import { SrContent } from "@/components/SrContent";
import { SCROLL_VH } from "@/lib/timeline";

/** v1 — the cinematic 3D book: opens, turns curling pages, closes. */
export function V1() {
  return (
    <>
      <SmoothScroll />
      <Experience />
      <Overlay />
      <SrContent />
      {/* The scroll track: its height is the length of the film. */}
      <div className="track" style={{ height: `${SCROLL_VH}vh` }} aria-hidden />
    </>
  );
}
