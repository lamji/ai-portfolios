"use client";

import { useEffect, useRef, useState } from "react";
import { portfolio as P } from "@/content/portfolio";
import { chapterNav, spreads } from "@/lib/pages";
import { scrollStore } from "@/lib/scroll-store";
import { LEAF_COUNT, clamp01, lerp, local, phase, phaseCenter, window01 } from "@/lib/timeline";

/** Which spread is (mostly) showing: -1 closed book, then 0…LEAF_COUNT. */
function spreadAt(p: number) {
  const [, openEnd] = phase("open");
  if (p < (phase("open")[0] + openEnd) / 2) return -1;
  let s = 0;
  for (let i = 0; i < LEAF_COUNT; i++) if (p > phaseCenter(`turn${i}`)) s = i + 1;
  return s;
}


/**
 * DOM layer over the film: letterbox bars, title cards, subtitles and the
 * chapter rail. Updated imperatively every frame to avoid React re-renders.
 */
export function Overlay() {
  const root = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLDivElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLDivElement>(null);
  const captions = useRef<(HTMLParagraphElement | null)[]>([]);
  const counter = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (scrollStore.ready) setReady(true);
    const onReady = () => setReady(true);
    scrollStore.readyListeners.add(onReady);
    return () => {
      scrollStore.readyListeners.delete(onReady);
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    let lastActive = -99;
    const loop = () => {
      const p = scrollStore.progress;
      const el = root.current;
      if (el) {
        // Letterbox: wide for the title shots, slim while reading.
        const cinematic = Math.max(1 - local(p, "open"), local(p, "close"));
        el.style.setProperty("--lb", `${lerp(7, 11, cinematic)}vh`);
      }
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;

      const heroT = clamp01(p / (phase("hero")[1] * 0.85));
      if (hero.current) {
        hero.current.style.opacity = String(1 - heroT);
        hero.current.style.transform = `translate3d(0, ${-heroT * 40}px, 0)`;
        hero.current.style.filter = `blur(${heroT * 6}px)`;
        hero.current.style.pointerEvents = heroT < 0.5 ? "auto" : "none";
      }
      if (hint.current) hint.current.style.opacity = String(1 - clamp01(p / 0.015));

      const endT = clamp01((p - phase("close")[0]) / (phase("end")[1] - phase("close")[0]));
      const endO = clamp01((endT - 0.45) / 0.35);
      if (end.current) {
        end.current.style.opacity = String(endO);
        end.current.style.transform = `translate3d(0, ${(1 - endO) * 30}px, 0)`;
        end.current.style.filter = `blur(${(1 - endO) * 6}px)`;
        end.current.style.pointerEvents = endO > 0.5 ? "auto" : "none";
      }

      captions.current.forEach((c, i) => {
        if (!c) return;
        const [a, b] = phase(`hold${i}`);
        const fade = (b - a) * 0.22;
        const o = window01(p, a - fade * 0.5, b + fade * 0.5, fade);
        c.style.opacity = String(o);
        c.style.transform = `translate3d(-50%, ${(1 - o) * 8}px, 0)`;
      });

      const s = spreadAt(p);
      if (counter.current) {
        counter.current.textContent = s < 0 ? "cover" : `${String(s).padStart(2, "0")} / ${String(LEAF_COUNT).padStart(2, "0")}`;
      }
      let a = 0;
      chapterNav.forEach((n, i) => {
        if (s >= n.spread) a = i;
      });
      if (a !== lastActive) {
        lastActive = a;
        setActive(a);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const go = (target: string) => scrollStore.scrollTo(target === "hero" ? 0 : phaseCenter(target));

  return (
    <div ref={root} className="overlay">
      <div className={`loader ${ready ? "is-done" : ""}`} aria-hidden={ready}>
        <div className="loader__inner">
          <span className="loader__kicker">$ compiling pages<span className="cursor" /></span>
          <span className="loader__line" />
        </div>
      </div>

      <header className="lb lb--top">
        <button className="brand" onClick={() => go("hero")} aria-label="Back to the cover">
          <span className="brand__mark">{P.name.split(/\s+/).map((s) => s[0]).join("").slice(0, 2)}</span>
          <span className="brand__name">{P.name}</span>
        </button>
        <a className="lb__link" href={`mailto:${P.contact.email}`}>
          Get in touch
        </a>
        <div className="lb__progress">
          <div ref={bar} className="lb__bar" />
        </div>
      </header>

      <section ref={hero} className="card card--hero">
        <p className="card__kicker">&gt; hello, world</p>
        <h1 className="card__title">{P.name}</h1>
        <p className="card__role">
          {P.role} <span className="card__dim">· {P.years} years in production</span>
        </p>
        <p className="card__lede">
          {P.tagline}
          <span className="cursor" />
        </p>
      </section>

      <section ref={end} className="card card--end" style={{ opacity: 0 }}>
        <p className="card__kicker">// end of file</p>
        <h2 className="card__title card__title--fin">exit(0)</h2>
        <p className="card__lede">Thanks for reading. Have a hard problem worth solving? Let&rsquo;s build it together.</p>
        <a className="card__email" href={`mailto:${P.contact.email}`}>
          {P.contact.email}
        </a>
        <ul className="card__links">
          {P.contact.links.map((l) => (
            <li key={l.href}>
              <a href={l.href} target="_blank" rel="noreferrer">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <button className="card__again" onClick={() => go("hero")}>
          ↺ git checkout cover
        </button>
      </section>

      <nav className="rail" aria-label="Chapters">
        {chapterNav.map((n, i) => (
          <button
            key={n.label}
            className={`rail__item ${i === active ? "is-active" : ""}`}
            onClick={() => go(n.target)}
            aria-current={i === active ? "true" : undefined}
          >
            <span className="rail__label">
              {n.numeral && <em>{n.numeral}</em>} {n.label}
            </span>
            <span className="rail__dot" />
          </button>
        ))}
      </nav>

      <footer className="lb lb--bottom">
        <div ref={hint} className="hint">
          <span className="hint__line" />
          Scroll to open the book
        </div>
        {spreads.map((s, i) => (
          <p
            key={s.caption + i}
            ref={(el) => {
              captions.current[i] = el;
            }}
            className="caption"
            style={{ opacity: 0 }}
          >
            {s.caption}
          </p>
        ))}
        <span ref={counter} className="counter" aria-hidden>
          cover
        </span>
      </footer>
    </div>
  );
}
