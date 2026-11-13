"use client";

import Lenis from "lenis";
import dynamic from "next/dynamic";
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";
import { portfolio as P } from "@/content/portfolio";
import { COPY, MORPH, PRINCIPLE_NOTES } from "./copy";
import { Morph, ticks } from "./Morph";
import { Reel } from "./Reel";
import { POSES, type SectionId, clamp01, mixPose, smooth } from "./poses";
import { store } from "./store";

const Scene = dynamic(() => import("./scene/Scene"), { ssr: false });

/* ─────────────── small building blocks ─────────────── */

const v = (o: Record<string, number | string>) => o as CSSProperties;

/** Words that slide up out of a mask when their block scrolls into view. */
function Words({ text, from = 0, step = 0.06 }: { text: string; from?: number; step?: number }) {
  return (
    <>
      {text.split(" ").map((w, i, all) => (
        <span key={i}>
          <span className="s-w">
            <span style={v({ "--d": `${(from + i * step).toFixed(2)}s` })}>{w}</span>
          </span>
          {i < all.length - 1 ? " " : ""}
        </span>
      ))}
    </>
  );
}

/** Link text that rolls up letter by letter on hover. */
function Roll({ text }: { text: string }) {
  return (
    <span className="s-roll" aria-label={text}>
      {Array.from(text).map((ch, i) => (
        <span key={i} aria-hidden style={v({ "--i": i })}>
          <span>{ch === " " ? " " : ch}</span>
          <span>{ch === " " ? " " : ch}</span>
        </span>
      ))}
    </span>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <p className="s-label">{children}</p>;
}

const Arrow = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const NAV: { id: string; label: string }[] = [
  { id: "top", label: "Home" },
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "work", label: "Work" },
  { id: "skills", label: "Toolkit" },
  { id: "contact", label: "Contact" },
];

const first = P.name.split(" ")[0];
const pad = (n: number) => String(n).padStart(2, "0");

/* ─────────────── the page ─────────────── */

export function Site() {
  const lenisRef = useRef<Lenis | null>(null);
  const [menu, setMenu] = useState(false);
  const [time, setTime] = useState("--:--");

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = new Lenis({ lerp: reduce ? 1 : 0.1, smoothWheel: !reduce });
    lenisRef.current = lenis;
    const html = document.documentElement;
    html.classList.add("s-js");

    // reveal blocks once, as they enter
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
          e.target.querySelectorAll<HTMLElement>("[data-count]").forEach(countUp);
        }),
      { threshold: 0.18, rootMargin: "0px 0px -6% 0px" },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));

    const scrubbed = Array.from(document.querySelectorAll<HTMLElement>("[data-p]"));
    const posed = Array.from(document.querySelectorAll<HTMLElement>("[data-pose]"));
    const contact = document.getElementById("contact");
    let raf = 0;
    let frame = 0;

    const loop = (now: number) => {
      lenis.raf(now);
      // pick up blocks added after mount (hot reload, late renders) so nothing stays hidden
      if (frame++ % 20 === 0) document.querySelectorAll("[data-reveal]:not(.is-in)").forEach((el) => io.observe(el));
      const vh = window.innerHeight;
      const mobile = window.innerWidth / vh < 0.9;
      // scroll progress for scrubbed sections
      for (const el of scrubbed) {
        const r = el.getBoundingClientRect();
        const p = el.dataset.p === "sticky" ? clamp01(-r.top / Math.max(1, r.height - vh)) : clamp01((vh - r.top) / (vh + r.height));
        el.style.setProperty("--p", p.toFixed(4));
      }
      for (const m of ticks) m(vh);
      // the laptop: hold each section's pose while it fills the screen, blend in between
      const y = vh / 2;
      const spans = posed.map((el) => {
        const r = el.getBoundingClientRect();
        const half = Math.min(r.height, vh) / 2;
        const id = el.dataset.pose as SectionId;
        return { a: r.top + half, b: r.bottom - half, entry: POSES[id] };
      });
      const at = (i: number) => (mobile ? spans[i].entry.mobile : spans[i].entry.pose);
      let i = spans.findIndex((sp) => y <= sp.b);
      if (i < 0) i = spans.length - 1;
      if (i > 0 && y < spans[i].a) {
        // between the end of section i−1 and the start of section i
        // travel briskly around the midpoint of the gap, so it never lingers over text
        const mid = (spans[i - 1].b + spans[i].a) / 2;
        const half = Math.max(1, Math.min((spans[i].a - spans[i - 1].b) / 2, vh * 0.3));
        const t = smooth(clamp01((y - (mid - half)) / (2 * half)));
        mixPose(at(i - 1), at(i), t, store.pose);
        store.screen.mode = (t < 0.5 ? spans[i - 1] : spans[i]).entry.screen;
      } else {
        Object.assign(store.pose, at(i));
        store.screen.mode = spans[i].entry.screen;
      }
      // the page turns dark for the contact
      if (contact) {
        const dark = contact.getBoundingClientRect().top < vh * 0.35;
        if (dark !== store.dark) {
          store.dark = dark;
          html.classList.toggle("s-dark", dark);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onPointer = (e: PointerEvent) => {
      store.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      store.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    // local time where I am
    const clock = () => setTime(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" }).format(new Date()));
    clock();
    const timer = window.setInterval(clock, 10_000);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.clearInterval(timer);
      html.classList.remove("s-js", "s-dark");
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    if (!menu) return;
    lenisRef.current?.stop();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", onKey);
    return () => {
      lenisRef.current?.start();
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  const go = (id: string) => {
    setMenu(false);
    // a section that opens with a typographic transition: land where its title has just assembled
    const morphed = document.getElementById(id)?.previousElementSibling?.classList.contains("s-morph");
    const offset = morphed ? -window.innerHeight : 0;
    requestAnimationFrame(() => lenisRef.current?.scrollTo(id === "top" ? 0 : `#${id}`, { duration: 1.6, offset }));
  };
  const mail = `mailto:${P.contact.email}`;

  return (
    <div className="s-site">
      <div className="s-grid" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} />
        ))}
      </div>
      <div className="s-stage" aria-hidden>
        <Scene />
      </div>

      <header className="s-header">
        <button className="s-mark" onClick={() => go("top")} aria-label="Back to top">
          JL.
        </button>
        <button className="s-header__name" onClick={() => go("top")}>
          <Roll text={P.name} />
        </button>
        <button className="s-menu-btn" onClick={() => setMenu(true)} aria-expanded={menu} aria-controls="s-menu">
          <Roll text="Menu" />
          <span className="s-menu-btn__icon" aria-hidden />
        </button>
      </header>

      {menu && (
        <div id="s-menu" className="s-menu" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="s-menu__top">
            <span className="s-mark">JL.</span>
            <button className="s-menu-btn" onClick={() => setMenu(false)} autoFocus>
              <Roll text="Close" />
            </button>
          </div>
          <nav className="s-menu__nav" aria-label="Sections">
            {NAV.map((n, i) => (
              <button key={n.id} onClick={() => go(n.id)} style={v({ "--i": i })}>
                <span className="s-menu__no">{pad(i + 1)}</span>
                <Roll text={n.label} />
              </button>
            ))}
          </nav>
          <div className="s-menu__foot">
            <a href={mail}>{P.contact.email}</a>
            <span>
              {P.contact.links.map((l) => (
                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer">
                  {l.label}
                </a>
              ))}
            </span>
          </div>
        </div>
      )}

      <main>
        {/* ── hero ── */}
        <section id="top" className="s-hero" data-pose="hero" data-reveal>
          <h1 className="s-hero__title">
            <span className="sr-only">
              {P.name}, {P.role}.{" "}
            </span>
            {COPY.headline.map((line, i) => (
              <span key={line} className="s-line" aria-hidden>
                <Words text={line} from={0.15 + i * 0.18} />
              </span>
            ))}
          </h1>
          <p className="s-hero__callout" aria-hidden>
            <svg viewBox="0 0 60 40" aria-hidden>
              <path d="M58 30 C 40 34, 18 30, 6 6 M6 6 l-1 10 M6 6 l9 3" />
            </svg>
            {COPY.callout[0]}
            <br />
            {COPY.callout[1]}
          </p>
          <div className="s-hero__foot">
            <p className="s-label">
              {P.role} — based in {P.location}
            </p>
            <p className="s-hero__intro">
              I’m {first}, a {P.role.toLowerCase()} with {P.years} years of building production systems. {P.tagline}
            </p>
          </div>
          <div className="s-scroll" aria-hidden>
            <span />
            Scroll
          </div>
        </section>

        {/* ── the name, sliding past ── */}
        <section className="s-name" data-pose="name" data-p="sticky" aria-label="Name">
          <div className="s-name__pin">
            <p className="s-name__text" aria-hidden>
              {P.name}
            </p>
            <div className="s-name__meta">
              <span className="s-label">{P.role}</span>
              <span className="s-label">Since {P.since}</span>
              <span className="s-label">{P.location}</span>
            </div>
          </div>
        </section>

        {/* ── about ── */}
        <section id="about" className="s-about" data-pose="about">
          <div className="s-about__copy" data-reveal>
            <Label>About</Label>
            <h2 className="s-h2">
              <Words text={COPY.aboutTitle} step={0.04} />
            </h2>
            {P.about.slice(0, 2).map((t, i) => (
              <p key={t} className="s-body s-up" style={v({ "--d": `${0.35 + i * 0.1}s` })}>
                {t}
              </p>
            ))}
          </div>
          <dl className="s-stats" data-reveal>
            {P.stats.map((s, i) => (
              <div key={s.label} className="s-up" style={v({ "--d": `${i * 0.08}s` })}>
                <dt className="s-label">{s.label}</dt>
                <dd data-count={s.value}>{s.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── experience ── */}
        <Morph label="02 — Experience" {...MORPH.experience} />
        <section id="experience" className="s-exp s-after-morph" data-pose="experience">
          <h2 className="sr-only">Experience</h2>
          <ol className="s-rows">
            {P.experience.map((e) => (
              <li key={e.title + e.period} className="s-row" data-reveal>
                <span className="s-row__period">{e.period}</span>
                <span className="s-row__main">
                  <strong>{e.title}</strong>
                  <span>{e.place}</span>
                </span>
                <span className="s-row__text">{e.text}</span>
              </li>
            ))}
          </ol>
          <ul className="s-chips" data-reveal aria-label="Achievements">
            {P.achievements.map((a, i) => (
              <li key={a} className="s-up" style={v({ "--d": `${i * 0.06}s` })}>
                {a}
              </li>
            ))}
          </ul>
          <div className="s-edu">
            <h3 className="s-edu__title" data-reveal>
              <span className="s-up">Education.</span>
            </h3>
            <ol className="s-rows">
              {P.education.map((e) => (
                <li key={e.title} className="s-row s-row--edu" data-reveal>
                  <span className="s-row__period">{e.period}</span>
                  <strong className="s-row__edu">{e.title}</strong>
                  <span className="s-row__text">{e.place}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── selected work ── */}
        <Morph label="03 — Selected work" {...MORPH.work} />
        <section id="work" className="s-work s-after-morph" data-pose="work">
          <h2 className="sr-only">Selected work</h2>
          <div data-reveal>
            <p className="s-body s-work__intro s-up">{COPY.workIntro}</p>
          </div>
          <Reel />
        </section>

        {/* ── toolkit ── */}
        <Morph label="04 — Skills & tools" {...MORPH.skills} />
        <section id="skills" className="s-skills s-after-morph" data-pose="skills">
          <h2 className="sr-only">Skills and tools</h2>
          <dl className="s-kit">
            {[...P.skills.map((g) => ({ label: g.group, items: g.items })), { label: "Tools", items: P.tools }, { label: "Now learning", items: P.exploring }].map((g) => (
              <div key={g.label} className="s-kit__row" data-reveal>
                <dt className="s-label">{g.label}</dt>
                <dd>
                  {g.items.map((it, i) => (
                    <span key={it} className="s-up" style={v({ "--d": `${i * 0.05}s` })}>
                      {it}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── principles ── */}
        <Morph label="05 — Process" {...MORPH.principles} />
        <section className="s-principles s-after-morph" data-pose="principles">
          <h2 className="sr-only">How I work</h2>
          <ol className="s-steps" data-reveal>
            {P.principles.map((t, i) => (
              <li key={t} className="s-up" style={v({ "--d": `${i * 0.08}s` })}>
                <span className="s-steps__no">{pad(i + 1)}</span>
                <strong>{t}</strong>
                <p>{PRINCIPLE_NOTES[i]}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── contact ── */}
        <section id="contact" className="s-contact" data-pose="contact">
          <div className="s-contact__copy" data-reveal>
            <Label>{COPY.contactKicker}</Label>
            <h2 className="s-display s-display--xl">
              {COPY.contactTitle.map((l, i) => (
                <span key={l} className="s-line">
                  <Words text={l} from={i * 0.15} />
                </span>
              ))}
            </h2>
            <a className="s-contact__email s-up" href={mail} style={v({ "--d": "0.4s" })}>
              {P.contact.email}
              <Arrow />
            </a>
          </div>
          <footer className="s-footer">
            <div>
              <span className="s-label">Local time</span>
              <span>
                {time} in {P.location}
              </span>
            </div>
            <div>
              <span className="s-label">Elsewhere</span>
              <span className="s-footer__links">
                {P.contact.links.map((l) => (
                  <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer">
                    <Roll text={l.label} />
                  </a>
                ))}
              </span>
            </div>
            <div>
              <span className="s-label">Email</span>
              <a href={mail}>
                <Roll text={P.contact.email} />
              </a>
            </div>
            <div className="s-footer__end">
              <span>
                © {new Date().getFullYear()} {P.name}
              </span>
              <button onClick={() => go("top")}>
                <Roll text="Back to top ↑" />
              </button>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}

/** Count a stat up from zero when it scrolls into view ("40+" counts 0 → 40, keeping the "+"). */
function countUp(el: HTMLElement) {
  const raw = el.dataset.count ?? "";
  const m = raw.match(/^(\D*)(\d+(?:\.\d+)?)(.*)$/);
  if (!m || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const [, pre, num, post] = m;
  const target = parseFloat(num);
  const decimals = num.includes(".") ? num.split(".")[1].length : 0;
  const t0 = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - t0) / 1400);
    const e = 1 - Math.pow(1 - t, 3);
    el.textContent = `${pre}${(target * e).toFixed(decimals)}${post}`;
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
