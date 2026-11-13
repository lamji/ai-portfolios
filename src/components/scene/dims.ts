/** Book dimensions in world units. The spine/hinge sits on the z axis at x = 0. */
export const PAGE_WIDTH = 1.4;
export const PAGE_DEPTH = 1.9;
/** Thickness of each page block (left and right half of the text block). */
export const BLOCK = 0.09;
/** Cover board thickness. */
export const COVER = 0.035;
export const COVER_WIDTH = PAGE_WIDTH + 0.05;
export const COVER_DEPTH = PAGE_DEPTH + 0.08;
/** Vertical gap between stacked leaves (avoids z-fighting). */
export const LEAF_GAP = 0.0025;
