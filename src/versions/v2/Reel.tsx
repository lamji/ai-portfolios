"use client";

import { type CSSProperties, useEffect, useRef } from "react";
import { portfolio as P } from "@/content/portfolio";
import { ticks } from "./Morph";
import { clamp01 } from "./poses";

/**
 * Selected work as a scroll-scrubbed explainer reel. The section pins and the scroll position is
 * the playhead: each project builds itself in sequence (label, rule, title letters, impact count,
 * description, stack, link), holds, then a black panel wipes across to cut to the next one.
 * A chapter scrubber at the bottom shows where you are, like a video timeline.
 *
 * Every animated element carries `data-fx` and a window `data-a="start,end"` in the project's
 * local time (0…1). One updater, called from the page's scroll loop, applies them.
 */

type Fx = "rise" | "mask" | "draw" | "pop" | "fade" | "count";

const fx = (kind: Fx, a: number, b: number) => ({ "data-fx": kind, "data-a": `${a.toFixed(3)},${b.toFixed(3)}` });
const pad = (n: number) => String(n).padStart(2, "0");

const outQuart = (t: number) => 1 - Math.pow(1 - t, 4);
const outBack = (t: number) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2);
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** cut timing at the ends of each project's slot: the panel slides for WIPE, then holds for HOLD */
const WIPE = 0.16;
const HOLD = 0.06;

function Scene({ i }: { i: number }) {
  const p = P.projects[i];
  const n = P.projects.length;
  const title = `${p.title}.`.split(" ");
  const desc = p.description.split(" ");
  let letter = 0;
  return (
    <article className="s-scene">
      <span className="s-scene__giant" aria-hidden>
        {pad(i + 1)}
      </span>
      <div className="s-project__top">
        <span className="s-label" {...fx("fade", 0.08, 0.2)}>
          {pad(i + 1)} / {pad(n)}
        </span>
        <span className="s-label" {...fx("mask", 0.1, 0.24)}>
          {p.kind} · {p.year}
        </span>
      </div>
      <span className="s-scene__rule" aria-hidden {...fx("draw", 0.1, 0.32)} />
      <h3 className="s-project__title" aria-label={p.title}>
        {title.map((w, wi) => (
          <span key={wi} aria-hidden>
            <span className="s-scene__mask">
              {Array.from(w).map((ch, ci) => {
                const a = 0.12 + letter++ * 0.01;
                return (
                  <span key={ci} {...fx("rise", a, a + 0.14)}>
                    {ch}
                  </span>
                );
              })}
            </span>
            {wi < title.length - 1 ? " " : ""}
          </span>
        ))}
      </h3>
      <div className="s-project__body">
        <div className="s-project__impact">
          <span className="s-label" {...fx("fade", 0.26, 0.34)}>
            Impact
          </span>
          <span className="s-scene__mask">
            <span {...fx("rise", 0.28, 0.42)}>
              <span {...fx("count", 0.3, 0.52)} data-count={p.impact}>
                {p.impact}
              </span>
            </span>
          </span>
          <span className="s-scene__bar" aria-hidden {...fx("draw", 0.32, 0.52)} />
        </div>
        <div className="s-project__info">
          <p className="s-project__desc">
            {desc.map((w, j) => {
              const a = 0.36 + (j / desc.length) * 0.18;
              return (
                <span key={j}>
                  <span className="s-scene__mask">
                    <span {...fx("rise", a, a + 0.12)}>{w}</span>
                  </span>
                  {j < desc.length - 1 ? " " : ""}
                </span>
              );
            })}
          </p>
          <ul className="s-tags" aria-label="Stack">
            {p.stack.map((s, j) => (
              <li key={s} {...fx("pop", 0.5 + j * 0.03, 0.62 + j * 0.03)}>
                {s}
              </li>
            ))}
          </ul>
          {p.link && (
            <a className="s-link" href={p.link} target="_blank" rel="noopener noreferrer" {...fx("fade", 0.62, 0.72)}>
              View project
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export function Reel() {
  const root = useRef<HTMLDivElement>(null);
  const n = P.projects.length;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scenes = Array.from(el.querySelectorAll<HTMLElement>(".s-scene")).map((s) => ({
      el: s,
      giant: s.querySelector<HTMLElement>(".s-scene__giant")!,
      items: Array.from(s.querySelectorAll<HTMLElement>("[data-fx]")).map((e) => {
        const [a, b] = (e.dataset.a ?? "0,1").split(",").map(Number);
        const kind = e.dataset.fx as Fx;
        // count the last number in the impact line: "p95 latency −72%" counts 0 → 72
        const m = kind === "count" ? (e.dataset.count ?? "").match(/^(.*?)(\d+(?:\.\d+)?)(\D*)$/) : null;
        return { e, kind, a, b, m, last: -1 };
      }),
    }));
    const wipe = el.querySelector<HTMLElement>(".s-reel__wipe")!;
    const card = el.querySelector<HTMLElement>(".s-reel__card")!;
    const wipeNo = el.querySelector<HTMLElement>(".s-reel__wipe-no")!;
    const wipeTitle = el.querySelector<HTMLElement>(".s-reel__wipe-title")!;
    const segs = Array.from(el.querySelectorAll<HTMLElement>(".s-reel__seg"));
    const fills = segs.map((s) => s.querySelector<HTMLElement>("i")!);
    let lastG = -1;
    let current = -1;

    const apply = (it: (typeof scenes)[number]["items"][number], t: number) => {
      const s = it.e.style;
      switch (it.kind) {
        case "rise": {
          const e = outQuart(t);
          s.transform = t >= 1 ? "" : `translate3d(0,${((1 - e) * 110).toFixed(1)}%,0) rotate(${((1 - e) * 6).toFixed(2)}deg)`;
          break;
        }
        case "mask":
          s.clipPath = t >= 1 ? "" : `inset(0 ${((1 - outQuart(t)) * 100).toFixed(1)}% 0 0)`;
          break;
        case "draw":
          s.transform = `scaleX(${inOut(t).toFixed(4)})`;
          break;
        case "pop":
          s.opacity = t.toFixed(3);
          s.transform = t >= 1 ? "" : `scale(${(0.6 + 0.4 * outBack(t)).toFixed(3)})`;
          break;
        case "fade":
          s.opacity = t.toFixed(3);
          s.transform = t >= 1 ? "" : `translate3d(0,${((1 - outQuart(t)) * 14).toFixed(1)}px,0)`;
          break;
        case "count":
          if (it.m) {
            const [, pre, num, post] = it.m;
            const dec = num.includes(".") ? num.split(".")[1].length : 0;
            it.e.textContent = `${pre}${(parseFloat(num) * outQuart(t)).toFixed(dec)}${post}`;
          }
          break;
      }
    };

    const update = (vh: number) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) return;
      const p = clamp01(-r.top / Math.max(1, r.height - vh));
      const g = Math.min(n - 1e-4, p * n);
      if (g === lastG) return;
      lastG = g;
      const k = Math.floor(g);
      const u = g - k;

      if (k !== current) {
        scenes.forEach((s, i) => s.el.classList.toggle("is-current", i === k));
        segs.forEach((s, i) => s.classList.toggle("is-current", i === k));
        current = k;
      }
      fills.forEach((f, i) => (f.style.transform = `scaleX(${i < k ? 1 : i === k ? u.toFixed(4) : 0})`));

      // the cut: the panel rises over the end of one project and lifts off the start of the next
      let w = 1;
      let next = k;
      if (k > 0 && u < HOLD + WIPE) w = -inOut(clamp01((u - HOLD) / WIPE));
      else if (k < n - 1 && u > 1 - HOLD - WIPE) {
        w = 1 - inOut(clamp01((u - (1 - HOLD - WIPE)) / WIPE));
        next = k + 1;
      }
      wipe.style.transform = `translate3d(0,${(w * 100).toFixed(2)}%,0)`;
      // the title card stays put while the panel slides over it, so the panel edge reveals it
      card.style.transform = `translate3d(0,${(-w * 100).toFixed(2)}%,0)`;
      const label = pad(next + 1);
      if (wipeNo.textContent !== label) {
        wipeNo.textContent = label;
        wipeTitle.textContent = P.projects[next].title;
      }

      // build the current project
      const s = scenes[k];
      // the build plays once the panel is lifting, leaving a hold before the next cut
      const t0 = reduce ? 1 : clamp01((u - 0.1) / 0.74);
      s.giant.style.transform = `translate3d(${((0.5 - u) * 8).toFixed(2)}vw,0,0)`;
      for (const it of s.items) {
        const t = clamp01((t0 - it.a) / (it.b - it.a));
        if (t === it.last) continue;
        it.last = t;
        apply(it, t);
      }
    };

    ticks.add(update);
    return () => {
      ticks.delete(update);
    };
  }, [n]);

  return (
    <div ref={root} className="s-reel" style={{ "--n": n } as CSSProperties}>
      <div className="s-reel__pin">
        {P.projects.map((p, i) => (
          <Scene key={p.title} i={i} />
        ))}
        <div className="s-reel__chapters" aria-hidden>
          {P.projects.map((p) => (
            <div key={p.title} className="s-reel__seg">
              <span className="s-label">{p.title}</span>
              <b>
                <i />
              </b>
            </div>
          ))}
        </div>
        <div className="s-reel__wipe" aria-hidden>
          <div className="s-reel__card">
            <span className="s-reel__wipe-no">01</span>
            <span className="s-label s-reel__wipe-title">{P.projects[0].title}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
