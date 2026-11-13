---
name: v2-white-editorial
description: Live v2 is a white, monochrome editorial site inspired by codeofsagar.in, with a 3D laptop that travels through the sections.
type: preference
keywords: v2, white, monochrome, editorial, laptop, codeofsagar
---

- 2026-11-13: the user rejected the block-story film ("not satisfied, change evrything aside from v1"). They asked for a white background "for premium looks", with https://codeofsagar.in/ as inspiration.
- Choices made by the user: a sculptural 3D object as the hero (a glossy aluminium laptop, no assets needed) and no accent colour (pure monochrome white, near-black and greys).
- Type is Space Grotesk (light 300 for huge display text) with small uppercase labels, plus faint six-column grid lines. Scroll reveals use Lenis. The contact section turns the page dark.
- The laptop's pose per section lives in `src/versions/v2/poses.ts`, and its screen content (code, the current project, contact) in `scene/screen.ts`. Keep it a single hero object that travels; don't add random decoration.
- The shared `globals.css` sets `overflow-x: hidden` on html/body, which breaks `position: sticky`. v2 overrides it with `overflow-x: clip` in `site.css`.
- The earlier "no black or white" rule from v2-design-rules is superseded for v2 by this request.
- Motion decisions (section transitions, the work reel): see [[v2-motion]].
