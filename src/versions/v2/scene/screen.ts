/**
 * What the laptop screen shows, drawn to a canvas: code in the hero, the current project in the
 * work section, and the contact details at the end. Monochrome, like the page.
 */
import * as THREE from "three";
import { portfolio as P } from "@/content/portfolio";
import { FONT } from "@/lib/fonts";
import type { Screen } from "../store";

export const SCREEN_W = 1024;
export const SCREEN_H = 640;

const C = { bg: "#141414", panel: "#1d1d1d", line: "#2a2a2a", dim: "#6f6f6f", mid: "#a8a8a8", hi: "#f2f2f2" };

export function makeScreen() {
  const canvas = document.createElement("canvas");
  canvas.width = SCREEN_W;
  canvas.height = SCREEN_H;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return { canvas, texture };
}

function chrome(x: CanvasRenderingContext2D, title: string) {
  x.fillStyle = C.bg;
  x.fillRect(0, 0, SCREEN_W, SCREEN_H);
  x.fillStyle = C.panel;
  x.fillRect(0, 0, SCREEN_W, 52);
  ["#5a5a5a", "#474747", "#3a3a3a"].forEach((c, i) => {
    x.fillStyle = c;
    x.beginPath();
    x.arc(30 + i * 24, 26, 7, 0, Math.PI * 2);
    x.fill();
  });
  x.fillStyle = C.mid;
  x.font = `500 20px ${FONT.display}`;
  x.textAlign = "center";
  x.fillText(title, SCREEN_W / 2, 33);
  x.textAlign = "left";
}

const CODE: [string, string][][] = [
  [["const ", C.dim], ["engineer", C.hi], [" = {", C.dim]],
  [["  name: ", C.dim], [`"${P.name}"`, C.mid], [",", C.dim]],
  [["  role: ", C.dim], [`"${P.role}"`, C.mid], [",", C.dim]],
  [["  years: ", C.dim], [String(P.years), C.hi], [",", C.dim]],
  [["  stack: ", C.dim], [`[${P.skills.flatMap((g) => g.items).slice(0, 3).map((s) => `"${s}"`).join(", ")}]`, C.mid], [",", C.dim]],
  [["  ships: ", C.dim], ["true", C.hi], [",", C.dim]],
  [["};", C.dim]],
  [],
  [["export default ", C.dim], ["engineer", C.hi], [";", C.dim]],
];

function drawCode(x: CanvasRenderingContext2D) {
  chrome(x, "engineer.ts");
  x.font = `500 30px ${FONT.mono}`;
  CODE.forEach((tokens, i) => {
    const y = 128 + i * 50;
    x.fillStyle = "#4a4a4a";
    x.textAlign = "right";
    x.fillText(String(i + 1), 70, y);
    x.textAlign = "left";
    let cx = 100;
    for (const [text, color] of tokens) {
      x.fillStyle = color;
      x.fillText(text, cx, y);
      cx += x.measureText(text).width;
    }
  });
  // cursor
  x.fillStyle = C.hi;
  x.fillRect(100 + x.measureText("export default engineer;").width + 6, 128 + 8 * 50 - 28, 14, 34);
}

function wrap(x: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (x.measureText(next).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawProject(x: CanvasRenderingContext2D, k: number) {
  const pr = P.projects[k] ?? P.projects[0];
  chrome(x, `${pr.title.toLowerCase().replace(/\s+/g, "-")}.app`);
  x.fillStyle = C.dim;
  x.font = `600 22px ${FONT.display}`;
  x.fillText(`${String(k + 1).padStart(2, "0")} — ${pr.kind.toUpperCase()}`, 64, 128);
  x.fillStyle = C.hi;
  x.font = `300 96px ${FONT.display}`;
  x.fillText(pr.title, 58, 230);
  x.fillStyle = C.mid;
  x.font = `400 28px ${FONT.display}`;
  wrap(x, pr.description, 560).slice(0, 4).forEach((l, i) => x.fillText(l, 64, 300 + i * 40));
  // the impact, as a big readout
  x.fillStyle = C.panel;
  x.fillRect(680, 280, 280, 200);
  x.fillStyle = C.dim;
  x.font = `600 18px ${FONT.display}`;
  x.fillText("IMPACT", 704, 318);
  x.fillStyle = C.hi;
  x.font = `500 40px ${FONT.display}`;
  wrap(x, pr.impact, 236).slice(0, 2).forEach((l, i) => x.fillText(l, 704, 380 + i * 48));
  // stack chips
  x.font = `500 22px ${FONT.display}`;
  let cx = 64;
  for (const s of pr.stack) {
    const w = x.measureText(s).width + 36;
    x.strokeStyle = "#4a4a4a";
    x.lineWidth = 2;
    x.beginPath();
    x.roundRect(cx, 530, w, 46, 23);
    x.stroke();
    x.fillStyle = C.mid;
    x.fillText(s, cx + 18, 561);
    cx += w + 12;
  }
}

function drawContact(x: CanvasRenderingContext2D) {
  chrome(x, "new message");
  x.fillStyle = C.dim;
  x.font = `500 24px ${FONT.display}`;
  x.fillText("To", 64, 140);
  x.fillStyle = C.hi;
  x.fillText(P.contact.email, 120, 140);
  x.fillStyle = C.line;
  x.fillRect(64, 166, SCREEN_W - 128, 2);
  x.fillStyle = C.hi;
  x.font = `300 104px ${FONT.display}`;
  x.fillText("Let’s talk.", 58, 320);
  x.fillStyle = C.mid;
  x.font = `400 30px ${FONT.display}`;
  x.fillText(`Hi ${P.name.split(" ")[0]}, I have a role in mind…`, 64, 400);
  x.fillStyle = C.hi;
  x.beginPath();
  x.roundRect(64, 480, 180, 64, 32);
  x.fill();
  x.fillStyle = C.bg;
  x.font = `600 26px ${FONT.display}`;
  x.fillText("Send", 120, 521);
}

export function drawScreen(canvas: HTMLCanvasElement, s: Screen) {
  const x = canvas.getContext("2d")!;
  x.save();
  if (s.mode === "project") drawProject(x, s.project);
  else if (s.mode === "contact") drawContact(x);
  else drawCode(x);
  x.restore();
}
