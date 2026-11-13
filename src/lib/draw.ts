/**
 * Procedural canvas art: every page, the circuit-board cover, page edges and the
 * desk mat are painted here at runtime — no image assets needed.
 */
import type { Block, PageSpec } from "./pages";
import { FONT } from "./fonts";
import { portfolio as P } from "@/content/portfolio";

export const PAGE_W = 1024;
export const PAGE_H = 1390;

const INK = "#1a2130";
const MUTED = "#5d6779";
const ACCENT = "#0e7490";
const ACCENT_PALE = "rgba(14,116,144,0.12)";
const PANEL = "#ebe9e2";

/** Syntax palette (light theme, printed on paper). */
const SYN = {
  kw: "#a626a4",
  str: "#3f8f3e",
  num: "#b07100",
  fn: "#3266d6",
  type: "#b07100",
  prop: "#c4413a",
  comment: "#9097a3",
  punct: "#4a5262",
  ink: INK,
};

/* ───────────────────────── helpers ───────────────────────── */

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

let noiseTile: HTMLCanvasElement | null = null;
function noise() {
  if (noiseTile) return noiseTile;
  const s = 256;
  const c = makeCanvas(s, s);
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(s, s);
  const r = rng(7);
  for (let i = 0; i < s * s; i++) {
    const v = 110 + r() * 145;
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  noiseTile = c;
  return c;
}

function font(size: number, family: string, weight = 400, italic = false) {
  return `${italic ? "italic " : ""}${weight} ${size}px ${family}`;
}

/** Draws text with manual letter-spacing (portable across browsers). */
function spaced(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
  align: "left" | "center" | "right" = "left",
) {
  const chars = [...text];
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let cx = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
  const prev = ctx.textAlign;
  ctx.textAlign = "left";
  chars.forEach((ch, i) => {
    ctx.fillText(ch, cx, y);
    cx += widths[i] + spacing;
  });
  ctx.textAlign = prev;
  return total;
}

function wrapWords(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[][] = [];
  let cur: string[] = [];
  for (const w of words) {
    const test = [...cur, w].join(" ");
    if (cur.length && ctx.measureText(test).width > width) {
      lines.push(cur);
      cur = [w];
    } else cur.push(w);
  }
  if (cur.length) lines.push(cur);
  return lines;
}

function justifiedLine(ctx: CanvasRenderingContext2D, words: string[], x: number, y: number, width: number, justify: boolean) {
  if (!justify || words.length < 2) {
    ctx.fillText(words.join(" "), x, y);
    return;
  }
  const wordsW = words.reduce((s, w) => s + ctx.measureText(w).width, 0);
  const gap = (width - wordsW) / (words.length - 1);
  let cx = x;
  for (const w of words) {
    ctx.fillText(w, cx, y);
    cx += ctx.measureText(w).width + gap;
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Tiny TypeScript-ish tokenizer for syntax colouring. */
const KW = new Set([
  "const", "let", "var", "function", "return", "export", "import", "from", "as", "await",
  "async", "new", "type", "interface", "if", "else", "true", "false", "null", "default",
]);
function tokenize(line: string) {
  const out: { text: string; color: string; italic?: boolean }[] = [];
  const re = /(\/\/.*$)|("(?:[^"\\]|\\.)*")|(\b\d[\d._]*\b)|([A-Za-z_$][\w$]*)|(\s+)|(.)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m[1]) out.push({ text: m[1], color: SYN.comment, italic: true });
    else if (m[2]) out.push({ text: m[2], color: SYN.str });
    else if (m[3]) out.push({ text: m[3], color: SYN.num });
    else if (m[4]) {
      const w = m[4];
      const rest = line.slice(re.lastIndex);
      let color = SYN.ink;
      if (KW.has(w)) color = SYN.kw;
      else if (/^\s*\(/.test(rest)) color = SYN.fn;
      else if (/^\s*:/.test(rest)) color = SYN.prop;
      else if (/^[A-Z]/.test(w)) color = SYN.type;
      out.push({ text: w, color });
    } else out.push({ text: m[0], color: m[5] ? SYN.ink : SYN.punct });
  }
  return out;
}

function fakeHash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0").slice(0, 7);
}

/* ───────────────────────── paper ───────────────────────── */

function paper(ctx: CanvasRenderingContext2D, w: number, h: number, side: "left" | "right", seed: number) {
  const r = rng(seed);
  ctx.fillStyle = "#f4f2ec";
  ctx.fillRect(0, 0, w, h);

  // engineering-notebook dot grid
  ctx.fillStyle = "rgba(40,60,95,0.16)";
  for (let y = 48; y < h - 20; y += 32) {
    for (let x = 32; x < w - 16; x += 32) {
      ctx.beginPath();
      ctx.arc(x, y, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // faint handling marks
  for (let i = 0; i < 10; i++) {
    const x = r() * w;
    const y = r() * h;
    const rad = 80 + r() * 260;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, `rgba(120,110,90,${0.02 + r() * 0.03})`);
    g.addColorStop(1, "rgba(120,110,90,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }

  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = ctx.createPattern(noise(), "repeat")!;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  const edge = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.8);
  edge.addColorStop(0, "rgba(60,60,70,0)");
  edge.addColorStop(1, "rgba(60,60,70,0.14)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, w, h);

  // gutter shadow toward the spine
  const gw = w * 0.15;
  const gx = side === "right" ? 0 : w;
  const gut = ctx.createLinearGradient(gx, 0, side === "right" ? gx + gw : gx - gw, 0);
  gut.addColorStop(0, "rgba(30,35,50,0.38)");
  gut.addColorStop(0.35, "rgba(30,35,50,0.1)");
  gut.addColorStop(1, "rgba(30,35,50,0)");
  ctx.fillStyle = gut;
  ctx.fillRect(side === "right" ? 0 : w - gw, 0, gw, h);
}

/* ───────────────────────── diagram plates ───────────────────────── */

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string, fill = "#f4f2ec") {
  roundRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.font = font(17, FONT.mono, 500);
  ctx.textAlign = "center";
  ctx.fillText(label, x + w / 2, y + h / 2 + 6);
  ctx.textAlign = "left";
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = INK) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(a - 0.4) * 11, y2 - Math.sin(a - 0.4) * 11);
  ctx.lineTo(x2 - Math.cos(a + 0.4) * 11, y2 - Math.sin(a + 0.4) * 11);
  ctx.closePath();
  ctx.fill();
}

function plate(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, variant: number) {
  const r = rng(100 + variant * 13);
  ctx.save();
  roundRect(ctx, x, y, w, h, 14);
  ctx.fillStyle = "rgba(14,116,144,0.05)";
  ctx.fill();
  ctx.strokeStyle = "rgba(26,33,48,0.35)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 6]);
  ctx.stroke();
  ctx.setLineDash([]);
  roundRect(ctx, x, y, w, h, 14);
  ctx.clip();

  if (variant === 0) {
    // service architecture
    const cy = y + h / 2;
    box(ctx, x + 24, cy - 28, 110, 56, "client");
    box(ctx, x + 180, cy - 28, 120, 56, "gateway", "#e2f1f4");
    arrow(ctx, x + 134, cy, x + 178, cy);
    const svcs = ["billing", "ledger", "notify"];
    svcs.forEach((s, i) => {
      const sy = y + 40 + i * ((h - 80) / 2) - 26;
      box(ctx, x + 360, sy, 130, 52, s);
      arrow(ctx, x + 300, cy, x + 358, sy + 26);
      arrow(ctx, x + 490, sy + 26, x + 556, cy - 6 + (i - 1) * 8, ACCENT);
    });
    // queue
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(x + 560 + i * 18, cy - 24, 16, 48);
    }
    ctx.fillStyle = ACCENT;
    ctx.font = font(15, FONT.mono, 500);
    ctx.fillText("events", x + 566, cy + 46);
    arrow(ctx, x + 652, cy, x + 690, cy);
    // database cylinder
    const dx = x + 694;
    ctx.strokeStyle = INK;
    ctx.fillStyle = "#f4f2ec";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(dx + 40, cy - 30, 40, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(dx, cy - 30);
    ctx.lineTo(dx, cy + 30);
    ctx.ellipse(dx + 40, cy + 30, 40, 12, 0, Math.PI, 0, true);
    ctx.lineTo(dx + 80, cy - 30);
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.font = font(16, FONT.mono, 500);
    ctx.textAlign = "center";
    ctx.fillText("pg", dx + 40, cy + 12);
    ctx.textAlign = "left";
  } else if (variant === 1) {
    // dashboard wireframe
    const px = x + 20;
    const py = y + 20;
    const pw = w - 40;
    const ph = h - 40;
    roundRect(ctx, px, py, pw, ph, 10);
    ctx.fillStyle = "#fbfaf6";
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "rgba(26,33,48,0.08)";
    ctx.fillRect(px, py, 120, ph);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i === 1 ? ACCENT : "rgba(26,33,48,0.25)";
      ctx.fillRect(px + 20, py + 30 + i * 34, 70, 10);
    }
    const cx0 = px + 140;
    const cw = pw - 160;
    for (let i = 0; i < 3; i++) {
      const kx = cx0 + i * (cw / 3);
      roundRect(ctx, kx, py + 18, cw / 3 - 14, 64, 8);
      ctx.strokeStyle = "rgba(26,33,48,0.4)";
      ctx.stroke();
      ctx.fillStyle = i === 0 ? ACCENT : INK;
      ctx.font = font(26, FONT.display, 700);
      ctx.fillText(["3.1k", "99.9%", "42ms"][i], kx + 14, py + 62);
    }
    // bars
    const by = py + ph - 24;
    for (let i = 0; i < 12; i++) {
      const bh = 40 + r() * 130;
      ctx.fillStyle = i === 8 ? ACCENT : "rgba(26,33,48,0.22)";
      ctx.fillRect(cx0 + i * (cw / 12) + 4, by - bh, cw / 12 - 10, bh);
    }
    // line
    ctx.strokeStyle = "#c4413a";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const lx = cx0 + (i / 24) * cw;
      const ly = by - 110 - Math.sin(i * 0.6) * 30 - i * 2.4;
      if (i === 0) ctx.moveTo(lx, ly);
      else ctx.lineTo(lx, ly);
    }
    ctx.stroke();
  } else if (variant === 2) {
    // CLI session
    roundRect(ctx, x + 20, y + 20, w - 40, h - 40, 12);
    ctx.fillStyle = "#11161f";
    ctx.fill();
    ["#ff5f57", "#febc2e", "#28c840"].forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x + 48 + i * 24, y + 46, 7, 0, Math.PI * 2);
      ctx.fill();
    });
    const lines: [string, string][] = [
      ["#4fe3c1", "$ shipyard up --pr 482"],
      ["#9aa7b8", "  ✔ build image          12.4s"],
      ["#9aa7b8", "  ✔ run migrations        1.1s"],
      ["#9aa7b8", "  ✔ provision env         8.9s"],
      ["#e6edf3", "  → https://pr-482.preview.local"],
      ["#4fe3c1", "$ █"],
    ];
    ctx.font = font(22, FONT.mono, 500);
    lines.forEach(([c, t], i) => {
      ctx.fillStyle = c;
      ctx.fillText(t, x + 44, y + 100 + i * 40);
    });
  } else {
    // offline-first device mesh
    const nodes: [number, number][] = [];
    for (let i = 0; i < 14; i++) nodes.push([x + 60 + r() * (w - 120), y + 50 + r() * (h - 100)]);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const d = Math.hypot(nodes[i][0] - nodes[j][0], nodes[i][1] - nodes[j][1]);
        if (d < 230) {
          ctx.strokeStyle = d < 150 ? "rgba(14,116,144,0.7)" : "rgba(26,33,48,0.25)";
          ctx.setLineDash(d < 150 ? [] : [5, 5]);
          ctx.beginPath();
          ctx.moveTo(nodes[i][0], nodes[i][1]);
          ctx.lineTo(nodes[j][0], nodes[j][1]);
          ctx.stroke();
        }
      }
    }
    ctx.setLineDash([]);
    nodes.forEach(([nx, ny], i) => {
      const phone = i % 3 === 0;
      if (phone) {
        roundRect(ctx, nx - 13, ny - 22, 26, 44, 5);
        ctx.fillStyle = "#f4f2ec";
        ctx.fill();
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      } else {
        ctx.fillStyle = i % 3 === 1 ? ACCENT : INK;
        ctx.beginPath();
        ctx.arc(nx, ny, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }
  ctx.restore();
}

/* ───────────────────────── page layout ───────────────────────── */

type Ctx = {
  ctx: CanvasRenderingContext2D;
  x: number; // content left
  w: number; // content width
  y: number; // cursor
  cx: number;
};

function paragraph(L: Ctx, text: string, opts: { muted?: boolean; center?: boolean; size?: number } = {}) {
  const { ctx } = L;
  const size = opts.size ?? 30;
  const lh = size * 1.48;
  ctx.font = font(size, FONT.display, 400);
  ctx.fillStyle = opts.muted ? MUTED : INK;
  ctx.textAlign = opts.center ? "center" : "left";
  const lines = wrapWords(ctx, text, L.w);
  lines.forEach((words, i) => {
    L.y += lh;
    if (opts.center) ctx.fillText(words.join(" "), L.cx, L.y);
    else justifiedLine(ctx, words, L.x, L.y, L.w, i < lines.length - 1);
  });
  ctx.textAlign = "left";
  L.y += lh * 0.45;
}

function chips(L: Ctx, items: string[], size = 21) {
  const { ctx } = L;
  ctx.font = font(size, FONT.mono, 500);
  const padX = 16;
  const hgt = size + 22;
  let x = L.x;
  let y = L.y + 18;
  for (const it of items) {
    const w = ctx.measureText(it).width + padX * 2;
    if (x + w > L.x + L.w) {
      x = L.x;
      y += hgt + 12;
    }
    roundRect(ctx, x, y, w, hgt, hgt / 2);
    ctx.fillStyle = ACCENT_PALE;
    ctx.fill();
    ctx.strokeStyle = "rgba(14,116,144,0.55)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.fillText(it, x + padX, y + hgt / 2 + size * 0.36);
    x += w + 12;
  }
  L.y = y + hgt + 6;
}

function terminal(L: Ctx, lines: string[]) {
  const { ctx } = L;
  const lh = 38;
  const pad = 26;
  const h = pad * 2 + lines.length * lh - 8;
  L.y += 18;
  roundRect(ctx, L.x, L.y, L.w, h, 14);
  ctx.fillStyle = "#11161f";
  ctx.fill();
  ctx.font = font(24, FONT.mono, 500);
  lines.forEach((ln, i) => {
    const y = L.y + pad + 22 + i * lh;
    if (ln.startsWith("$ ")) {
      ctx.fillStyle = "#4fe3c1";
      ctx.fillText("$", L.x + pad, y);
      ctx.fillStyle = "#e6edf3";
      ctx.fillText(ln.slice(2), L.x + pad + 30, y);
    } else {
      ctx.fillStyle = "#9aa7b8";
      ctx.fillText(ln, L.x + pad + 30, y);
    }
    if (i === lines.length - 1 && lines.length > 1) {
      const tw = ctx.measureText(ln.startsWith("$ ") ? ln.slice(2) : ln).width;
      ctx.fillStyle = "#4fe3c1";
      ctx.fillRect(L.x + pad + 38 + tw, y - 20, 13, 24);
    }
  });
  L.y += h + 10;
}

function codeBlock(L: Ctx, file: string, lines: string[]) {
  const { ctx } = L;
  const lh = 35;
  const head = 50;
  const h = head + 22 + lines.length * lh + 14;
  L.y += 22;
  roundRect(ctx, L.x, L.y, L.w, h, 14);
  ctx.fillStyle = PANEL;
  ctx.fill();
  ctx.strokeStyle = "rgba(26,33,48,0.12)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ["#ff5f57", "#febc2e", "#28c840"].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(L.x + 26 + i * 22, L.y + head / 2, 6.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = MUTED;
  ctx.font = font(19, FONT.mono, 500);
  ctx.textAlign = "center";
  ctx.fillText(file, L.cx, L.y + head / 2 + 7);
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(26,33,48,0.1)";
  ctx.fillRect(L.x, L.y + head, L.w, 1.5);

  ctx.save();
  roundRect(ctx, L.x, L.y, L.w, h, 14);
  ctx.clip();
  lines.forEach((ln, i) => {
    const y = L.y + head + 22 + (i + 1) * lh - 10;
    ctx.font = font(18, FONT.mono, 400);
    ctx.fillStyle = "#a9aeb8";
    ctx.textAlign = "right";
    ctx.fillText(String(i + 1), L.x + 46, y);
    ctx.textAlign = "left";
    let x = L.x + 64;
    for (const tok of tokenize(ln)) {
      ctx.font = font(22, FONT.mono, tok.color === SYN.kw ? 700 : 500, tok.italic);
      ctx.fillStyle = tok.color;
      ctx.fillText(tok.text, x, y);
      x += ctx.measureText(tok.text).width;
    }
  });
  ctx.restore();
  L.y += h + 8;
}

function drawBlock(L: Ctx, b: Block, spec: PageSpec, H: number) {
  const { ctx } = L;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  switch (b.t) {
    case "space":
      L.y += b.h;
      break;

    case "chapter": {
      const y0 = L.y + 10;
      ctx.fillStyle = "rgba(14,116,144,0.1)";
      ctx.font = font(190, FONT.display, 700);
      ctx.textAlign = "right";
      ctx.fillText(b.num, L.x + L.w + 6, y0 + 170);
      ctx.textAlign = "left";
      ctx.fillStyle = ACCENT;
      ctx.font = font(21, FONT.mono, 500);
      spaced(ctx, `// CHAPTER ${b.num}`, L.x, y0 + 50, 3);
      ctx.fillStyle = INK;
      ctx.font = font(66, FONT.mono, 700);
      ctx.fillText(b.title, L.x - 3, y0 + 128);
      ctx.fillStyle = MUTED;
      ctx.font = font(32, FONT.display, 500);
      ctx.fillText(b.sub, L.x, y0 + 176);
      ctx.fillStyle = "rgba(26,33,48,0.2)";
      ctx.fillRect(L.x, y0 + 206, L.w, 1.5);
      ctx.fillStyle = ACCENT;
      ctx.fillRect(L.x, y0 + 204, 90, 5);
      L.y = y0 + 220;
      break;
    }

    case "h":
      L.y += 52;
      ctx.fillStyle = ACCENT;
      ctx.font = font(26, FONT.mono, 700);
      ctx.fillText("##", L.x, L.y);
      ctx.fillStyle = INK;
      spaced(ctx, b.text.toUpperCase(), L.x + 46, L.y, 2.5);
      L.y += 8;
      break;

    case "p":
      paragraph(L, b.text, { muted: b.muted, center: b.center });
      break;

    case "comment": {
      ctx.font = font(24, FONT.mono, 400, true);
      ctx.fillStyle = SYN.comment;
      const lines = wrapWords(ctx, b.text, L.w - 50);
      lines.forEach((l) => {
        L.y += 38;
        ctx.fillText(`// ${l.join(" ")}`, L.x, L.y);
      });
      L.y += 10;
      break;
    }

    case "quote": {
      L.y += 34;
      ctx.font = font(32, FONT.display, 500);
      const lines = wrapWords(ctx, `“${b.text}”`, L.w - 50);
      const top = L.y;
      ctx.fillStyle = INK;
      lines.forEach((l) => {
        L.y += 46;
        ctx.fillText(l.join(" "), L.x + 34, L.y);
      });
      L.y += 44;
      ctx.fillStyle = MUTED;
      ctx.font = font(21, FONT.mono, 500);
      ctx.fillText(`— ${b.by}`, L.x + 34, L.y);
      ctx.fillStyle = ACCENT;
      ctx.fillRect(L.x, top + 10, 5, L.y - top);
      L.y += 10;
      break;
    }

    case "code":
      codeBlock(L, b.file, b.lines);
      break;

    case "terminal":
      terminal(L, b.lines);
      break;

    case "list": {
      const cols = b.columns ?? 1;
      const rows = Math.ceil(b.items.length / cols);
      const colW = L.w / cols;
      const rowH = 50;
      b.items.forEach((item, i) => {
        const c = Math.floor(i / rows);
        const x = L.x + c * colW;
        const y = L.y + 46 + (i % rows) * rowH;
        ctx.fillStyle = ACCENT;
        ctx.font = font(26, FONT.mono, 700);
        ctx.fillText("→", x + 4, y);
        ctx.fillStyle = INK;
        ctx.font = font(30, FONT.display, 400);
        ctx.fillText(item, x + 48, y);
      });
      L.y += 46 + rows * rowH - 18;
      break;
    }

    case "chips":
      chips(L, b.items);
      break;

    case "stats": {
      const gap = 18;
      const cw = (L.w - gap) / 2;
      const chH = 150;
      L.y += 26;
      b.items.forEach((s, i) => {
        const x = L.x + (i % 2) * (cw + gap);
        const y = L.y + Math.floor(i / 2) * (chH + gap);
        roundRect(ctx, x, y, cw, chH, 14);
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.fill();
        ctx.strokeStyle = "rgba(26,33,48,0.14)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = ACCENT;
        ctx.font = font(64, FONT.display, 700);
        ctx.fillText(s.value, x + 26, y + 82);
        ctx.fillStyle = MUTED;
        ctx.font = font(19, FONT.mono, 500);
        ctx.fillText(s.label.toUpperCase(), x + 28, y + 122);
      });
      L.y += chH * 2 + gap;
      break;
    }

    case "module": {
      L.y += 30;
      ctx.fillStyle = ACCENT;
      ctx.font = font(21, FONT.mono, 700);
      ctx.fillText(`module_${String(b.index + 1).padStart(2, "0")}`, L.x, L.y);
      ctx.fillStyle = MUTED;
      ctx.font = font(21, FONT.mono, 500);
      ctx.textAlign = "right";
      ctx.fillText(b.meta, L.x + L.w, L.y);
      ctx.textAlign = "left";
      L.y += 22;
      plate(ctx, L.x, L.y, L.w, 360, b.index % 4);
      L.y += 360 + 74;
      ctx.fillStyle = INK;
      ctx.font = font(56, FONT.display, 700);
      ctx.fillText(b.title, L.x, L.y);
      L.y += 6;
      paragraph(L, b.text);
      if (b.impact) {
        ctx.font = font(23, FONT.mono, 700);
        const label = `▲ ${b.impact}`;
        const w = ctx.measureText(label).width + 36;
        L.y += 8;
        roundRect(ctx, L.x, L.y, w, 46, 10);
        ctx.fillStyle = "rgba(63,143,62,0.12)";
        ctx.fill();
        ctx.fillStyle = SYN.str;
        ctx.fillText(label, L.x + 18, L.y + 31);
        L.y += 52;
      }
      chips(L, b.tags, 19);
      break;
    }

    case "gitlog": {
      const lineX = L.x + 16;
      const startY = L.y + 30;
      let y = startY;
      const dots: number[] = [];
      b.items.forEach((e, i) => {
        const top = y;
        dots.push(top + 14);
        // commit dot
        ctx.beginPath();
        ctx.arc(lineX, top + 14, 12, 0, Math.PI * 2);
        if (i === 0) {
          ctx.fillStyle = ACCENT;
          ctx.fill();
        } else {
          ctx.fillStyle = "#f4f2ec";
          ctx.fill();
          ctx.strokeStyle = ACCENT;
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        const tx = L.x + 56;
        ctx.font = font(20, FONT.mono, 700);
        ctx.fillStyle = SYN.num;
        const hash = fakeHash(e.title + e.period);
        ctx.fillText(hash, tx, top + 21);
        let hx = tx + ctx.measureText(hash).width + 14;
        if (i === 0) {
          ctx.fillStyle = SYN.str;
          ctx.fillText("(HEAD -> main)", hx, top + 21);
          hx += ctx.measureText("(HEAD -> main)").width + 14;
        }
        ctx.fillStyle = MUTED;
        ctx.font = font(20, FONT.mono, 500);
        ctx.textAlign = "right";
        ctx.fillText(e.period, L.x + L.w, top + 21);
        ctx.textAlign = "left";
        ctx.fillStyle = INK;
        ctx.font = font(36, FONT.display, 600);
        ctx.fillText(e.title, tx, top + 70);
        ctx.fillStyle = ACCENT;
        ctx.font = font(23, FONT.mono, 500);
        ctx.fillText(`@ ${e.place}`, tx, top + 106);
        let yy = top + 106;
        if (e.text) {
          const sub: Ctx = { ctx, x: tx, w: L.w - 56, y: yy - 4, cx: tx + (L.w - 56) / 2 };
          paragraph(sub, e.text, { muted: true, size: 27 });
          yy = sub.y;
        }
        y = yy + 40;
      });
      // branch line, then re-stamp the commit dots on top of it
      ctx.fillStyle = ACCENT;
      ctx.fillRect(lineX - 2, startY + 14, 4, dots[dots.length - 1] - startY - 14);
      dots.forEach((dy, i) => {
        ctx.beginPath();
        ctx.arc(lineX, dy, 12, 0, Math.PI * 2);
        ctx.fillStyle = i === 0 ? ACCENT : "#f4f2ec";
        ctx.fill();
        if (i > 0) {
          ctx.strokeStyle = ACCENT;
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      });
      L.y = y;
      break;
    }

    case "entry":
      L.y += 56;
      ctx.fillStyle = INK;
      ctx.font = font(34, FONT.display, 600);
      ctx.fillText(b.title, L.x, L.y);
      L.y += 38;
      ctx.fillStyle = MUTED;
      ctx.font = font(22, FONT.mono, 500);
      ctx.fillText(b.meta, L.x, L.y);
      break;

    case "tree": {
      L.y += 60;
      ctx.font = font(28, FONT.mono, 700);
      ctx.fillStyle = ACCENT;
      ctx.fillText(b.root, L.x, L.y);
      b.items.forEach((it, i) => {
        L.y += 64;
        const last = i === b.items.length - 1;
        ctx.font = font(28, FONT.mono, 400);
        ctx.fillStyle = "#a9aeb8";
        ctx.fillText(last ? "└──" : "├──", L.x, L.y);
        ctx.fillStyle = INK;
        ctx.font = font(28, FONT.mono, 500);
        ctx.fillText(it.name, L.x + 72, L.y);
        const nw = ctx.measureText(it.name).width;
        const num = String(it.page).padStart(2, "0");
        ctx.fillStyle = ACCENT;
        ctx.textAlign = "right";
        ctx.fillText(num, L.x + L.w, L.y);
        ctx.textAlign = "left";
        ctx.fillStyle = "rgba(93,103,121,0.55)";
        for (let dx = L.x + 72 + nw + 18; dx < L.x + L.w - 54; dx += 14) {
          ctx.beginPath();
          ctx.arc(dx, L.y - 8, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      L.y += 20;
      break;
    }

    case "titlepage": {
      const x = 110;
      ctx.fillStyle = ACCENT;
      ctx.font = font(24, FONT.mono, 700);
      ctx.fillText("# README.md", x, 190);
      ctx.fillStyle = INK;
      ctx.font = font(124, FONT.display, 700);
      const parts = P.name.split(/\s+/);
      let y = 330;
      for (const part of parts) {
        ctx.fillText(part, x - 6, y);
        y += 124;
      }
      ctx.fillStyle = ACCENT;
      ctx.font = font(36, FONT.mono, 500);
      ctx.fillText(`> ${P.role}`, x, y - 30);

      // shield-style badges
      const badges: [string, string, string][] = [
        ["experience", `${P.years} yrs`, ACCENT],
        ["since", String(P.since), "#3266d6"],
        ["build", "passing", "#3f8f3e"],
      ];
      let bx = x;
      const by = y + 20;
      ctx.font = font(19, FONT.mono, 500);
      for (const [k, v, c] of badges) {
        const kw = ctx.measureText(k).width + 24;
        const vw = ctx.measureText(v).width + 24;
        ctx.save();
        roundRect(ctx, bx, by, kw + vw, 38, 6);
        ctx.clip();
        ctx.fillStyle = "#4a5262";
        ctx.fillRect(bx, by, kw, 38);
        ctx.fillStyle = c;
        ctx.fillRect(bx + kw, by, vw, 38);
        ctx.restore();
        ctx.fillStyle = "#fff";
        ctx.fillText(k, bx + 12, by + 26);
        ctx.fillText(v, bx + kw + 12, by + 26);
        bx += kw + vw + 14;
      }

      // emblem: braces
      ctx.fillStyle = "rgba(14,116,144,0.1)";
      ctx.font = font(420, FONT.mono, 700);
      ctx.fillText("{ }", x - 30, 1080);
      ctx.fillStyle = INK;
      ctx.font = font(28, FONT.display, 400);
      const lede = wrapWords(ctx, P.tagline, 640);
      let ly = 850;
      for (const l of lede) {
        ctx.fillText(l.join(" "), x + 20, ly);
        ly += 42;
      }
      ctx.fillStyle = MUTED;
      ctx.font = font(21, FONT.mono, 500);
      ctx.fillText(`v${P.years}.0.0 · ${P.since} — ${new Date().getFullYear()}`, x, H - 150);
      ctx.fillText(`© ${P.name}`, x, H - 116);
      ctx.fillStyle = "rgba(26,33,48,0.2)";
      ctx.fillRect(x, H - 196, PAGE_W - x * 2 - 20, 1.5);
      break;
    }

    case "fin": {
      const cx = (PAGE_W + 20) / 2;
      ctx.textAlign = "center";
      ctx.fillStyle = INK;
      ctx.font = font(190, FONT.mono, 700);
      ctx.fillText("EOF", cx, 600);
      ctx.fillStyle = ACCENT;
      ctx.fillRect(cx - 60, 650, 120, 6);
      ctx.fillStyle = MUTED;
      ctx.font = font(34, FONT.display, 400);
      ctx.fillText("Thanks for reading.", cx, 740);
      ctx.textAlign = "left";
      const T: Ctx = { ctx, x: 170, w: PAGE_W - 300, y: 800, cx };
      terminal(T, ["$ exit 0", "Process finished with exit code 0"]);
      break;
    }
  }
  ctx.textAlign = "left";
}

export function drawPage(spec: PageSpec, scale: number, seed: number) {
  const W = PAGE_W;
  const H = PAGE_H;
  const c = makeCanvas(Math.round(W * scale), Math.round(H * scale));
  const ctx = c.getContext("2d")!;
  ctx.scale(scale, scale);
  paper(ctx, W, H, spec.side, seed);

  const inner = 128;
  const outer = 100;
  const x = spec.side === "right" ? inner : outer;
  const w = W - inner - outer;
  const L: Ctx = { ctx, x, w, y: 140, cx: x + w / 2 };

  if (spec.runningHead) {
    ctx.fillStyle = MUTED;
    ctx.font = font(18, FONT.mono, 500);
    const head = `// ${spec.runningHead}`;
    if (spec.side === "left") ctx.fillText(head, x, 92);
    else {
      ctx.textAlign = "right";
      ctx.fillText(head, x + w, 92);
      ctx.textAlign = "left";
    }
    ctx.fillStyle = "rgba(26,33,48,0.14)";
    ctx.fillRect(x, 108, w, 1.2);
  }
  if (spec.folio !== undefined) {
    ctx.fillStyle = MUTED;
    ctx.font = font(22, FONT.mono, 500);
    const f = `[ ${String(spec.folio).padStart(2, "0")} ]`;
    ctx.textAlign = spec.side === "left" ? "left" : "right";
    ctx.fillText(f, spec.side === "left" ? x : x + w, H - 66);
    ctx.textAlign = "left";
  }
  for (const b of spec.blocks) drawBlock(L, b, spec, H);
  return c;
}

/* ───────────────────────── cover ───────────────────────── */

/**
 * mode "color": graphite board with circuit traces and lettering.
 * mode "emissive": black with only the glowing parts (traces, chip, version),
 * used as an emissive mask so they bloom.
 */
export function drawCover(mode: "color" | "emissive", scale = 1) {
  const W = PAGE_W;
  const H = PAGE_H;
  const c = makeCanvas(Math.round(W * scale), Math.round(H * scale));
  const ctx = c.getContext("2d")!;
  ctx.scale(scale, scale);
  const r = rng(42);
  const glow = mode === "color" ? "rgba(79,227,193,0.55)" : "#4fe3c1";
  const cx = (W + 30) / 2;

  if (mode === "color") {
    ctx.fillStyle = "#121821";
    ctx.fillRect(0, 0, W, H);
    // brushed texture
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = `rgba(255,255,255,${r() * 0.025})`;
      ctx.fillRect(0, r() * H, W, 1);
    }
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = ctx.createPattern(noise(), "repeat")!;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    const v = ctx.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, H * 0.75);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(0,0,0,0.5)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, 70, 0);
    g.addColorStop(0, "rgba(0,0,0,0.55)");
    g.addColorStop(0.7, "rgba(0,0,0,0.12)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 70, H);
  } else {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
  }

  // circuit traces, kept out of the lettering and the chip
  const keepOut = [
    [140, 150, W - 110, 700],
    [cx - 200, 760, cx + 200, 1160],
    [140, H - 200, W - 110, H - 90],
  ];
  const blocked = (x: number, y: number) =>
    x < 90 || x > W - 50 || y < 60 || y > H - 60 || keepOut.some(([a, b, c2, d]) => x > a && x < c2 && y > b && y < d);
  const dirs = [
    [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1],
  ];
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let i = 0; i < 70; i++) {
    let x = 90 + r() * (W - 140);
    let y = 60 + r() * (H - 120);
    if (blocked(x, y)) continue;
    x = Math.round(x / 16) * 16;
    y = Math.round(y / 16) * 16;
    let d = Math.floor(r() * 4) * 2;
    ctx.strokeStyle = glow;
    ctx.fillStyle = glow;
    ctx.lineWidth = r() > 0.7 ? 3 : 1.8;
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y);
    const segs = 2 + Math.floor(r() * 4);
    for (let s = 0; s < segs; s++) {
      const len = 16 * (2 + Math.floor(r() * 7));
      const [dx, dy] = dirs[d];
      const nx = x + dx * len;
      const ny = y + dy * len;
      if (blocked(nx, ny)) break;
      ctx.lineTo(nx, ny);
      x = nx;
      y = ny;
      d = (d + (r() > 0.5 ? 1 : 7)) % 8;
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // lettering (not emissive)
  if (mode === "color") {
    ctx.fillStyle = "#7f8ea3";
    ctx.font = font(26, FONT.mono, 500);
    spaced(ctx, "// THE SOURCE CODE OF", cx, 250, 4, "center");
    ctx.fillStyle = "#e9eef5";
    ctx.font = font(132, FONT.display, 700);
    ctx.textAlign = "center";
    const parts = P.name.toUpperCase().split(/\s+/);
    let y = 400;
    for (const part of parts) {
      ctx.fillText(part, cx, y);
      y += 130;
    }
    ctx.fillStyle = "#4fe3c1";
    ctx.font = font(40, FONT.mono, 500);
    ctx.fillText(`<${P.role.replace(/\s+/g, "")} />`, cx, y + 10);
    ctx.textAlign = "left";
  }

  // CPU chip emblem
  const cy = 960;
  const s = 220;
  ctx.strokeStyle = glow;
  ctx.fillStyle = glow;
  ctx.lineWidth = 3;
  for (let i = 0; i < 7; i++) {
    const o = -s / 2 + 26 + i * ((s - 52) / 6);
    for (const [x1, y1, x2, y2] of [
      [cx + o, cy - s / 2, cx + o, cy - s / 2 - 34],
      [cx + o, cy + s / 2, cx + o, cy + s / 2 + 34],
      [cx - s / 2, cy + o, cx - s / 2 - 34, cy + o],
      [cx + s / 2, cy + o, cx + s / 2 + 34, cy + o],
    ]) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x2, y2, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  roundRect(ctx, cx - s / 2, cy - s / 2, s, s, 20);
  if (mode === "color") {
    ctx.fillStyle = "#0b0f15";
    ctx.fill();
  }
  ctx.lineWidth = 4;
  ctx.stroke();
  roundRect(ctx, cx - s / 2 + 18, cy - s / 2 + 18, s - 36, s - 36, 12);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = mode === "color" ? "#e9eef5" : "#2a8f7c";
  ctx.font = font(84, FONT.display, 700);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const initials = P.name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  ctx.fillText(initials, cx, cy + 4);
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = glow;
  ctx.font = font(30, FONT.mono, 700);
  ctx.fillText(`v${P.years}.0.0`, cx, H - 170);
  if (mode === "color") {
    ctx.fillStyle = "#7f8ea3";
    ctx.font = font(20, FONT.mono, 500);
    spaced(ctx, `${["ZERO", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN"][P.years] ?? P.years} YEARS IN PRODUCTION`, cx, H - 124, 4, "center");
  }
  ctx.textAlign = "left";
  return c;
}

/* ───────────────────────── page edges & desk ───────────────────────── */

export function drawPageEdges() {
  const c = makeCanvas(64, 256);
  const ctx = c.getContext("2d")!;
  const r = rng(3);
  ctx.fillStyle = "#ebe8df";
  ctx.fillRect(0, 0, 64, 256);
  for (let y = 0; y < 256; y += 2) {
    ctx.fillStyle = `rgba(60,65,80,${0.06 + r() * 0.16})`;
    ctx.fillRect(0, y, 64, 1);
  }
  return c;
}

/** Dark self-healing desk mat with a fine grid. */
export function drawDesk() {
  const S = 1024;
  const c = makeCanvas(S, S);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#0d1219";
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i <= S; i += 32) {
    ctx.fillStyle = i % 128 === 0 ? "rgba(120,160,210,0.1)" : "rgba(120,160,210,0.04)";
    ctx.fillRect(i, 0, 1.5, S);
    ctx.fillRect(0, i, S, 1.5);
  }
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = ctx.createPattern(noise(), "repeat")!;
  ctx.fillRect(0, 0, S, S);
  ctx.restore();
  return c;
}
