/**
 * Mutable state shared by the page (scroll) and the 3D laptop, read every frame.
 * Deliberately not React state.
 */

/** Where the laptop sits and how it looks, in viewport terms. */
export type Pose = {
  /** −1 … 1 across the viewport (left → right) */
  x: number;
  /** −1 … 1 down → up */
  y: number;
  /** size relative to the base size */
  s: number;
  /** turn (radians, around the vertical axis) */
  ry: number;
  /** tilt toward the viewer */
  rx: number;
  /** lid angle in radians: 0 closed, ~1.9 open */
  lid: number;
};

export type Screen = { mode: "code" | "project" | "contact"; project: number };

export const store = {
  pose: { x: 0, y: -0.36, s: 1, ry: -0.42, rx: 0.2, lid: 1.88 } as Pose,
  screen: { mode: "code", project: 0 } as Screen,
  /** pointer in −1 … 1, y up */
  pointer: { x: 0, y: 0 },
  /** set once the page is dark (contact section) */
  dark: false,
};
