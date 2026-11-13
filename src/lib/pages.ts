import { portfolio as P } from "@/content/portfolio";
import { LEAF_COUNT } from "./timeline";

export type Block =
  | { t: "chapter"; num: string; title: string; sub: string }
  | { t: "h"; text: string }
  | { t: "p"; text: string; muted?: boolean; center?: boolean }
  | { t: "comment"; text: string }
  | { t: "quote"; text: string; by: string }
  | { t: "code"; file: string; lines: string[] }
  | { t: "terminal"; lines: string[] }
  | { t: "list"; items: string[]; columns?: number }
  | { t: "chips"; items: string[] }
  | { t: "stats"; items: { value: string; label: string }[] }
  | { t: "module"; index: number; title: string; meta: string; text: string; impact?: string; tags: string[] }
  | { t: "gitlog"; items: { title: string; place: string; period: string; text?: string }[] }
  | { t: "entry"; title: string; meta: string }
  | { t: "tree"; root: string; items: { name: string; page: number }[] }
  | { t: "space"; h: number }
  | { t: "titlepage" }
  | { t: "fin" };

export type PageSpec = {
  /** Which side of the gutter this page sits on when the book is open. */
  side: "left" | "right";
  folio?: number;
  runningHead?: string;
  blocks: Block[];
};

export type Spread = { caption: string; left: PageSpec; right: PageSpec };

const chapters = [
  { num: "01", title: "init()", sub: "About me", file: "01-init.md", spread: 1 },
  { num: "02", title: "The Stack", sub: "Skills & tools", file: "02-stack.ts", spread: 2 },
  { num: "03", title: "Projects", sub: "Selected work", file: "03-projects/", spread: 3 },
  { num: "04", title: "git log", sub: "Experience", file: "04-git-log", spread: 5 },
  { num: "05", title: "contact()", sub: "Say hello", file: "05-contact.sh", spread: 6 },
];

const folioOf = (spread: number) => spread * 2;
const slug = P.name.toLowerCase().replace(/\s+/g, "-");

/** Builds a `stack.ts` object literal, wrapping long arrays onto several lines. */
function stackCode() {
  const MAX = 50;
  const out = ["export const stack = {"];
  for (const g of P.skills) {
    const one = `  ${g.group}: [${g.items.map((i) => `"${i}"`).join(", ")}],`;
    if (one.length <= MAX) out.push(one);
    else {
      out.push(`  ${g.group}: [`);
      g.items.forEach((i) => out.push(`    "${i}",`));
      out.push("  ],");
    }
  }
  out.push("} as const;");
  return out;
}

function contactCode() {
  const host = (h: string) => h.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return [
    "const contact = {",
    `  email: "${P.contact.email}",`,
    ...P.contact.links.map((l) => `  ${l.label.toLowerCase()}: "${host(l.href)}",`),
    "};",
    "",
    "// response time: usually < 24h",
    'await contact.send("Let\'s build something");',
  ];
}

const project = (i: number): Block => {
  const pr = P.projects[i];
  return {
    t: "module",
    index: i,
    title: pr.title,
    meta: `${pr.kind} · ${pr.year}`,
    text: pr.description,
    impact: pr.impact,
    tags: pr.stack,
  };
};

const chapterBlock = (i: number): Block => ({ t: "chapter", num: chapters[i].num, title: chapters[i].title, sub: chapters[i].sub });

export const spreads: Spread[] = [
  {
    caption: "README.md",
    left: { side: "left", blocks: [{ t: "titlepage" }] },
    right: {
      side: "right",
      folio: 1,
      runningHead: "contents",
      blocks: [
        { t: "space", h: 40 },
        { t: "h", text: "Table of contents" },
        { t: "terminal", lines: ["$ tree ./book --pages"] },
        { t: "tree", root: `${slug}/`, items: chapters.map((c) => ({ name: c.file, page: folioOf(c.spread) })) },
        { t: "space", h: 50 },
        { t: "comment", text: P.tagline },
      ],
    },
  },
  {
    caption: "Chapter 01 — init()",
    left: {
      side: "left",
      folio: 2,
      runningHead: "01 / init()",
      blocks: [
        chapterBlock(0),
        ...P.about.map((text) => ({ t: "p" as const, text })),
        {
          t: "code",
          file: "me.ts",
          lines: [
            "const me = new Engineer({",
            `  name: "${P.name}",`,
            `  experience: ${P.years}, // years`,
            `  since: ${P.since},`,
            "  coffee: Infinity,",
            "});",
            "",
            "me.ship(); // daily",
          ],
        },
      ],
    },
    right: {
      side: "right",
      folio: 3,
      runningHead: "01 / init()",
      blocks: [
        { t: "space", h: 20 },
        {
          t: "terminal",
          lines: ["$ whoami", P.handle, "$ uptime", `${P.years} years in production`, `$ cat location.txt`, P.location],
        },
        { t: "stats", items: P.stats },
        { t: "space", h: 10 },
        { t: "quote", text: P.quote.text, by: P.quote.by },
      ],
    },
  },
  {
    caption: "Chapter 02 — The Stack",
    left: {
      side: "left",
      folio: 4,
      runningHead: "02 / the stack",
      blocks: [
        chapterBlock(1),
        { t: "code", file: "stack.ts", lines: stackCode() },
        { t: "h", text: "Principles" },
        { t: "list", items: P.principles },
      ],
    },
    right: {
      side: "right",
      folio: 5,
      runningHead: "02 / the stack",
      blocks: [
        { t: "space", h: 30 },
        { t: "h", text: "Toolbox" },
        { t: "chips", items: P.tools },
        { t: "space", h: 30 },
        { t: "h", text: "Currently exploring" },
        { t: "list", items: P.exploring },
        { t: "space", h: 40 },
        { t: "comment", text: "tools change; fundamentals don't." },
      ],
    },
  },
  {
    caption: "Chapter 03 — Projects",
    left: { side: "left", folio: 6, runningHead: "03 / projects", blocks: [chapterBlock(2), project(0)] },
    right: { side: "right", folio: 7, runningHead: "03 / projects", blocks: [{ t: "space", h: 40 }, project(1)] },
  },
  {
    caption: "Chapter 03 — Projects (cont.)",
    left: { side: "left", folio: 8, runningHead: "03 / projects", blocks: [{ t: "space", h: 40 }, project(2)] },
    right: { side: "right", folio: 9, runningHead: "03 / projects", blocks: [{ t: "space", h: 40 }, project(3)] },
  },
  {
    caption: "Chapter 04 — git log",
    left: {
      side: "left",
      folio: 10,
      runningHead: "04 / git log",
      blocks: [chapterBlock(3), { t: "terminal", lines: ["$ git log --graph --career"] }, { t: "gitlog", items: P.experience }],
    },
    right: {
      side: "right",
      folio: 11,
      runningHead: "04 / git log",
      blocks: [
        { t: "space", h: 30 },
        { t: "h", text: "Education" },
        ...P.education.map((e) => ({ t: "entry" as const, title: e.title, meta: `${e.place} · ${e.period}` })),
        { t: "space", h: 30 },
        { t: "h", text: "Achievements" },
        { t: "list", items: P.achievements },
        { t: "space", h: 40 },
        { t: "comment", text: `${P.years} years, ${P.since} → today. Still shipping.` },
      ],
    },
  },
  {
    caption: "Chapter 05 — contact()",
    left: {
      side: "left",
      folio: 12,
      runningHead: "05 / contact()",
      blocks: [
        chapterBlock(4),
        { t: "p", text: "Have a hard problem, a product to ship, or a team that needs another pair of hands? My inbox is open." },
        { t: "code", file: "contact.ts", lines: contactCode() },
        { t: "p", text: `— ${P.name}`, center: true, muted: true },
      ],
    },
    right: { side: "right", blocks: [{ t: "fin" }] },
  },
];

if (spreads.length !== LEAF_COUNT + 1) {
  throw new Error(`Expected ${LEAF_COUNT + 1} spreads, got ${spreads.length}`);
}

/** Chapter rail entries. `spread` is the first spread of the entry (-1 = closed book). */
export const chapterNav = [
  { label: "Cover", numeral: "", target: "hero", spread: -1 },
  { label: "README", numeral: "", target: "hold0", spread: 0 },
  ...chapters.map((c) => ({ label: c.title, numeral: c.num, target: `hold${c.spread}`, spread: c.spread })),
];
