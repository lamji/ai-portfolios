---
name: portfolio-owner-theme
description: The portfolio belongs to Jick Lampago, a React/Next.js developer working professionally since 2020, and v1 is a software-engineering-themed 3D book.
type: fact
keywords: owner, name, theme, software engineer, book, content
---

- Owner: Jick Lampago. His resume (pasted 2026-11-13) shows professional work since Nov 2020, so the site uses since 2020 and 6 years, not the earlier 8 years since 2018. Latest company (told 2026-11-13): Digital Future ME, Dubai, as Full Stack Web Developer & Google Practitioner; Serino360 (React Developer, May 2022) is now the previous job. Started there May 2026. Side hustle: Wio Ltd, Feb–Aug 2026 (role not given yet). Based in Cebu.
- Concept (chosen by the user): a 3D book that opens and turns pages on scroll with cinematic camera moves; themed around software engineering (circuit-board cover, code/terminal/git-log pages, monospace type, cyan accent).
- All personal content lives in `src/content/portfolio.ts`, now filled from the resume. Side projects live at *.brainxai.site (AutoGo, OpenDash, BookMe), and the AI agent is at brainxai.site.
- 2026-11-13: the user supplied their resume and asked to "feed it with real data", so the site contact email is now their real address. Phone number, street address and demo admin credentials stay off the site.
- Repo (2026-11-13): git on branch `main`, pushed to github.com:lamji/ai-portfolios over SSH. `.nocturne/index/` is git-ignored; `.nocturne/memory/` is committed.
- Live URL: https://www.jicklampago.online (given 2026-11-13; replaces jick.brainxai.site) (`site` in the content file; override with NEXT_PUBLIC_SITE_URL). SEO/AEO is built from the content file in `src/lib/seo.ts` (metadata, JSON-LD, /llms.txt, robots, sitemap, OG image).
