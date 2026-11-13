---
name: v2-motion
description: v2 motion decisions the user settled: scatter-then-assemble section titles and a scroll-scrubbed explainer reel for Selected Work.
type: preference
keywords: v2, motion, transition, reel, wipe, projects
---

- Typographic transitions (added 2026-11-13, user request): `Morph.tsx` bands sit before experience, work, skills and principles. While pinned, letters arrive already scattered (showing loose glyphs from `MORPH.from`) and assemble into the section title. The user rejected showing a readable phrase first and then scrambling it (2026-11-13). The band is the visible heading, and each section keeps an sr-only h2. Bands use the `morph` pose, and the menu `go()` offsets by −vh so the title is already assembled. Reveal fix: the loop re-observes `[data-reveal]:not(.is-in)` every 20 frames.
- Selected Work redesign (2026-11-13): the user said the laptop pulled attention away from the projects. They then asked for explainer-video motion ("make it feel premium"), so Work is now `Reel.tsx`: a pinned, scroll-scrubbed reel. Each project builds in sequence, a black panel wipes to a held title card for the next project, and a chapter scrubber sits at the bottom. The user said the first wipe was too fast; it now uses WIPE 0.16, HOLD 0.06 and 240vh per project. The laptop's `work` pose parks it off-screen (x 1.8) for the whole section. Don't put the laptop back as the project showcase.
