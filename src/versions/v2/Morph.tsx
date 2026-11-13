"use client";

import { useEffect, useRef } from "react";
import { clamp01 } from "./poses";

/**
 * Typographic section transition: the band arrives with its letters already scattered across the
 * screen, tumbling, showing the letters of `from` as loose glyphs. As you scroll they fly in,
 * change into the letters of `to` on the way, and assemble into the title. Nothing is readable
 * until it lands. Scroll-driven (the band is pinned while it plays), so it reverses with the scrollbar.
 *
 * A hidden "ghost" copy of `to` gives the exact letter positions; one particle per letter.
 *
 * Decorative only (aria-hidden): the section after it carries the real heading.
 */

/** Per-frame updaters (typographic transitions, the work reel), called from the page's scroll loop. */
export const ticks = new Set<(vh: number) => void>();

const letters = (s: string) => Array.from(s).filter((c) => c !== " ");

function Ghost({ text }: { text: string }) {
  return (
    <span className="s-morph__ghost">
      {text.split(" ").map((w, i, all) => (
        <span key={i}>
          <span className="s-morph__word">
            {Array.from(w).map((c, j) => (
              <span key={j} data-l>
                {c}
              </span>
            ))}
          </span>
          {i < all.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}

/** Small deterministic random, so server and client agree and the scatter is the same every visit. */
function seeded(text: string) {
  let s = 2166136261;
  for (const c of text) s = Math.imul(s ^ c.charCodeAt(0), 16777619);
  s = (s >>> 0) % 2147483646 || 1;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

export function Morph({ label, from, to }: { label: string; from: string; to: string }) {
  const root = useRef<HTMLDivElement>(null);
  const b = letters(to);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const a = letters(from);
    const b = letters(to);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ghost = el.querySelector<HTMLElement>(".s-morph__ghost")!;
    const slots = Array.from(ghost.querySelectorAll<HTMLElement>("[data-l]"));
    const parts = Array.from(el.querySelectorAll<HTMLElement>(".s-morph__p"));

    // loose glyph each particle shows while scattered (letters of `from`, shuffled), and how it flies
    const rand = seeded(from + "→" + to);
    const loose = b.map((_, k) => a[Math.floor(rand() * a.length)] ?? b[k]);
    const fly = parts.map(() => ({
      dx: rand() * 2 - 1,
      dy: rand() * 2 - 1,
      rot: (rand() * 2 - 1) * 220,
      delay: rand() * 0.3,
      swap: 0.45 + rand() * 0.25,
    }));

    let pos: { x: number; y: number }[] = [];
    let last = -1;
    const measure = () => {
      pos = slots.map((l) => ({ x: l.offsetLeft, y: l.offsetTop }));
      last = -1;
    };

    const update = (vh: number) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) return;
      const p = clamp01(-r.top / Math.max(1, r.height - vh));
      if (p === last || !pos.length) return;
      last = p;
      // scattered at the start, assembled by 75%, then held until the band unpins
      const play = clamp01(p / 0.75);
      const vw = window.innerWidth;
      for (let k = 0; k < parts.length; k++) {
        const f = fly[k];
        const t = reduce ? 1 : clamp01((play - f.delay) / 0.7);
        const s = Math.pow(1 - t, 2.2); // how scattered: 1 → 0, landing softly
        const x = pos[k].x + f.dx * s * vw * 0.34;
        const y = pos[k].y + f.dy * s * vh * 0.34;
        const part = parts[k];
        part.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${(f.rot * s).toFixed(1)}deg) scale(${(1 - 0.35 * s).toFixed(3)})`;
        part.style.opacity = (1 - 0.65 * s).toFixed(3);
        const ch = t < f.swap ? loose[k] : b[k];
        if (part.textContent !== ch) part.textContent = ch;
      }
    };

    measure();
    el.classList.add("is-ready");
    ticks.add(update);
    const ro = new ResizeObserver(measure);
    ro.observe(ghost);
    document.fonts?.ready.then(measure);
    return () => {
      ticks.delete(update);
      ro.disconnect();
      el.classList.remove("is-ready");
    };
  }, [from, to]);

  return (
    <div ref={root} className="s-morph" data-pose="morph" aria-hidden>
      <div className="s-morph__pin">
        <p className="s-label">{label}</p>
        <div className="s-morph__stage">
          <Ghost text={to} />
          {b.map((c, k) => (
            <span key={k} className="s-morph__p">
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
