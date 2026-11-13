---
name: v2-design-rules
description: v2 must be clean and HR-readable, versioned via a SITE_VERSION const, and free of 3D flicker sources.
type: preference
keywords: v2, design, versioning, flicker, terminal, hr
---

- v2 is for HR/recruiter readability: clean glass cards, Inter/Space Grotesk, no monospace, terminal prompts, hashes, scanlines, glitch or telemetry looks.
- Versioning (corrected 2026-11-13): keep only v1 untouched. When the user says "replace", the old version must be deleted, not kept as history. `SITE_VERSION` + if/else in `src/app/page.tsx` selects between v1 and the current new version. No git.
- The user reported the screen flickering (2026-11-12). Avoid animated film grain/noise passes, sub-pixel stars or hair-thin bright lines under bloom, fine grid lines far away, and `will-change` on `backdrop-filter` cards over the WebGL canvas.
- Palette: superseded on 2026-11-13. The user now wants a white background and pure monochrome (white, near-black #111, greys, no accent); see [[v2-white-editorial]]. The earlier forest/sand palette and "no black and white" rule no longer apply.
