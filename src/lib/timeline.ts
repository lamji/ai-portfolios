/**
 * The whole film is driven by a single number: scroll progress 0 → 1.
 * Phases are declared with relative weights so pacing is easy to tweak.
 */

export const LEAF_COUNT = 6; // physical leaves that turn → LEAF_COUNT + 1 spreads

type Phase = { id: string; w: number };

const phases: Phase[] = [
  { id: "hero", w: 1.1 },
  { id: "open", w: 1.5 },
  { id: "hold0", w: 1.5 },
];
for (let i = 0; i < LEAF_COUNT; i++) {
  phases.push({ id: `turn${i}`, w: 1.0 });
  phases.push({ id: `hold${i + 1}`, w: 1.7 });
}
phases.push({ id: "close", w: 1.5 });
phases.push({ id: "end", w: 1.0 });

const total = phases.reduce((s, p) => s + p.w, 0);
const ranges: Record<string, [number, number]> = {};
{
  let acc = 0;
  for (const p of phases) {
    ranges[p.id] = [acc / total, (acc + p.w) / total];
    acc += p.w;
  }
}

/** Total scroll length in viewport heights. */
export const SCROLL_VH = Math.round(total * 62);

export const phase = (id: string) => ranges[id];

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Local 0→1 progress of `p` inside phase `id`. */
export const local = (p: number, id: string) => {
  const [a, b] = ranges[id];
  return clamp01((p - a) / (b - a));
};
/** Local progress across a span from the start of phase `a` to the end of phase `b`. */
export const span = (p: number, a: string, b: string) => {
  const s = ranges[a][0];
  const e = ranges[b][1];
  return clamp01((p - s) / (e - s));
};

export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOutQuart = (t: number) =>
  t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;

/** Fades in over `fade` at the start of [a,b] and out over `fade` at the end. */
export const window01 = (p: number, a: number, b: number, fade: number) =>
  clamp01((p - a) / fade) * clamp01((b - p) / fade);

/** Spread index → [start, end] progress during which it is fully open and readable. */
export const spreadRange = (i: number): [number, number] => ranges[`hold${i}`];

/** Progress value at the middle of a phase — used to jump to chapters. */
export const phaseCenter = (id: string) => {
  const [a, b] = ranges[id];
  return (a + b) / 2;
};
