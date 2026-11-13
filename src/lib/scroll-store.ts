/**
 * Tiny mutable store shared between the DOM (Lenis) and the WebGL loop.
 * Mutated every frame, so it deliberately avoids React state.
 */
type Listener = () => void;

export const scrollStore = {
  /** Raw progress straight from the scroll position (0 → 1). */
  target: 0,
  /** Damped progress used by every animation. */
  progress: 0,
  /** Normalised pointer position (-1 → 1). */
  pointer: { x: 0, y: 0 },
  /** Set once fonts + textures are ready. */
  ready: false,
  /** Imperative scroll-to, registered by the smooth scroll provider. */
  scrollTo: (_progress: number) => {},
  readyListeners: new Set<Listener>(),
  setReady() {
    if (this.ready) return;
    this.ready = true;
    this.readyListeners.forEach((l) => l());
  },
};

/** Advances the damped progress. Call once per frame. */
export function stepProgress(dt: number) {
  const k = 1 - Math.exp(-dt * 5.5);
  scrollStore.progress += (scrollStore.target - scrollStore.progress) * k;
  if (Math.abs(scrollStore.target - scrollStore.progress) < 1e-5) {
    scrollStore.progress = scrollStore.target;
  }
}
