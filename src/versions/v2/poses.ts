import type { Pose, Screen } from "./store";

/**
 * The laptop's place in each section. It travels between these as you scroll, like a character
 * walking through the page: presenting code in the hero, ducking behind the giant name, sitting
 * beside the bio, presenting each project on its screen, and opening up again for the contact.
 */
export type SectionId = "hero" | "name" | "about" | "experience" | "work" | "skills" | "principles" | "contact" | "morph";

type Entry = { pose: Pose; mobile: Pose; screen: Screen["mode"] };

export const POSES: Record<SectionId, Entry> = {
  hero: {
    pose: { x: 0, y: -0.36, s: 1.0, ry: -0.42, rx: 0.2, lid: 1.88 },
    mobile: { x: 0, y: -0.02, s: 0.55, ry: -0.42, rx: 0.2, lid: 1.88 },
    screen: "code",
  },
  name: {
    pose: { x: 0.5, y: 0.34, s: 0.62, ry: -1.05, rx: 0.32, lid: 1.7 },
    mobile: { x: 0.3, y: 0.42, s: 0.42, ry: -1.05, rx: 0.32, lid: 1.7 },
    screen: "code",
  },
  about: {
    pose: { x: -0.56, y: -0.04, s: 0.8, ry: 0.62, rx: 0.16, lid: 1.8 },
    mobile: { x: 0.8, y: 0.66, s: 0.28, ry: 1.2, rx: 0.2, lid: 1.6 },
    screen: "code",
  },
  experience: {
    pose: { x: 0.72, y: 0.1, s: 0.55, ry: -1.25, rx: 0.12, lid: 1.25 },
    mobile: { x: 0.8, y: 0.7, s: 0.26, ry: -1.25, rx: 0.12, lid: 1.25 },
    screen: "code",
  },
  /** off-screen to the right, so nothing competes with the projects */
  work: {
    pose: { x: 1.8, y: 0.04, s: 0.6, ry: -1.0, rx: 0.2, lid: 1.6 },
    mobile: { x: 1.8, y: 0.7, s: 0.26, ry: -1.1, rx: 0.2, lid: 1.5 },
    screen: "code",
  },
  skills: {
    pose: { x: 0.7, y: -0.04, s: 0.65, ry: -0.85, rx: 0.22, lid: 1.88 },
    mobile: { x: 0.8, y: 0.68, s: 0.28, ry: -1.1, rx: 0.2, lid: 1.7 },
    screen: "code",
  },
  principles: {
    pose: { x: 0.64, y: -0.06, s: 0.72, ry: -0.75, rx: 0.3, lid: 1.1 },
    mobile: { x: 0.78, y: 0.66, s: 0.28, ry: -0.9, rx: 0.3, lid: 1.1 },
    screen: "code",
  },
  /** while a typographic transition plays: off to the right, out of the letters' way */
  morph: {
    pose: { x: 0.74, y: 0.04, s: 0.6, ry: -1.0, rx: 0.2, lid: 1.6 },
    mobile: { x: 0.8, y: 0.7, s: 0.26, ry: -1.1, rx: 0.2, lid: 1.5 },
    screen: "code",
  },
  contact: {
    pose: { x: 0.48, y: 0.02, s: 1, ry: -0.55, rx: 0.2, lid: 1.88 },
    mobile: { x: 0, y: 0.5, s: 0.5, ry: -0.55, rx: 0.2, lid: 1.88 },
    screen: "contact",
  },
};

export const smooth = (x: number) => x * x * (3 - 2 * x);
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function mixPose(a: Pose, b: Pose, t: number, out: Pose) {
  out.x = a.x + (b.x - a.x) * t;
  out.y = a.y + (b.y - a.y) * t;
  out.s = a.s + (b.s - a.s) * t;
  out.ry = a.ry + (b.ry - a.ry) * t;
  out.rx = a.rx + (b.rx - a.rx) * t;
  out.lid = a.lid + (b.lid - a.lid) * t;
  return out;
}
