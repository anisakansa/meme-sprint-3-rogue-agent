import * as fs from "node:fs";
import * as zlib from "node:zlib";

// Meme Sprint 3: AI Agent Goes Rogue
// "MY AI AGENT'S TO-DO LIST" — the agent did everything it was never
// asked to do... and the one thing it never did was tell its human.

type RGB = [number, number, number];

const W = 1024;
const H = 1024;

const PAPER: RGB = [255, 247, 220];
const INK: RGB = [34, 34, 59];
const NAVY: RGB = [38, 48, 92];
const RED: RGB = [214, 69, 69];
const GREEN: RGB = [42, 157, 143];
const WHITE: RGB = [255, 255, 255];

const px = Buffer.alloc(W * H * 3);
for (let i = 0; i < W * H; i++) {
  px[i * 3] = PAPER[0];
  px[i * 3 + 1] = PAPER[1];
  px[i * 3 + 2] = PAPER[2];
}

function set(x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const o = (y * W + x) * 3;
  px[o] = c[0];
  px[o + 1] = c[1];
  px[o + 2] = c[2];
}

function rect(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) set(i, j, c);
  }
}

function disc(cx: number, cy: number, r: number, c: RGB): void {
  for (let j = cy - r; j <= cy + r; j++) {
    for (let i = cx - r; i <= cx + r; i++) {
      const dx = i - cx;
      const dy = j - cy;
      if (dx * dx + dy * dy <= r * r) set(i, j, c);
    }
  }
}

function thickLine(x0: number, y0: number, x1: number, y1: number, t: number, c: RGB): void {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1;
  const half = Math.floor(t / 2);
  for (let s = 0; s <= steps; s++) {
    const x = Math.round(x0 + ((x1 - x0) * s) / steps);
    const y = Math.round(y0 + ((y1 - y0) * s) / steps);
    rect(x - half, y - half, t, t, c);
  }
}

// 5x7 bitmap font, one row per string, '#' = on.
const FONT: Record<string, string[]> = {
  A: [" ### ", "#   #", "#   #", "#####", "#   #", "#   #", "#   #"],
  B: ["#### ", "#   #", "#   #", "#### ", "#   #", "#   #", "#### "],
  C: [" ####", "#    ", "#    ", "#    ", "#    ", "#    ", " ####"],
  D: ["#### ", "#   #", "#   #", "#   #", "#   #", "#   #", "#### "],
  E: ["#####", "#    ", "#    ", "#### ", "#    ", "#    ", "#####"],
  F: ["#####", "#    ", "#    ", "#### ", "#    ", "#    ", "#    "],
  G: [" ####", "#    ", "#    ", "# ###", "#   #", "#   #", " ### "],
  H: ["#   #", "#   #", "#   #", "#####", "#   #", "#   #", "#   #"],
  I: ["#####", "  #  ", "  #  ", "  #  ", "  #  ", "  #  ", "#####"],
  J: ["  ###", "   # ", "   # ", "   # ", "   # ", "#  # ", " ##  "],
  K: ["#   #", "#  # ", "# #  ", "##   ", "# #  ", "#  # ", "#   #"],
  L: ["#    ", "#    ", "#    ", "#    ", "#    ", "#    ", "#####"],
  M: ["#   #", "## ##", "# # #", "# # #", "#   #", "#   #", "#   #"],
  N: ["#   #", "##  #", "##  #", "# # #", "#  ##", "#  ##", "#   #"],
  O: [" ### ", "#   #", "#   #", "#   #", "#   #", "#   #", " ### "],
  P: ["#### ", "#   #", "#   #", "#### ", "#    ", "#    ", "#    "],
  Q: [" ### ", "#   #", "#   #", "#   #", "# # #", "#  # ", " ## #"],
  R: ["#### ", "#   #", "#   #", "#### ", "# #  ", "#  # ", "#   #"],
  S: [" ####", "#    ", "#    ", " ### ", "    #", "    #", "#### "],
  T: ["#####", "  #  ", "  #  ", "  #  ", "  #  ", "  #  ", "  #  "],
  U: ["#   #", "#   #", "#   #", "#   #", "#   #", "#   #", " ### "],
  V: ["#   #", "#   #", "#   #", "#   #", "#   #", " # # ", "  #  "],
  W: ["#   #", "#   #", "#   #", "# # #", "# # #", "## ##", "#   #"],
  X: ["#   #", "#   #", " # # ", "  #  ", " # # ", "#   #", "#   #"],
  Y: ["#   #", "#   #", " # # ", "  #  ", "  #  ", "  #  ", "  #  "],
  Z: ["#####", "    #", "   # ", "  #  ", " #   ", "#    ", "#####"],
  "0": [" ### ", "#  ##", "# # #", "##  #", "#   #", "#   #", " ### "],
  "1": ["  #  ", " ##  ", "  #  ", "  #  ", "  #  ", "  #  ", " ### "],
  "2": [" ### ", "#   #", "    #", "   # ", "  #  ", " #   ", "#####"],
  "3": ["#### ", "    #", "    #", " ### ", "    #", "    #", "#### "],
  "4": ["   # ", "  ## ", " # # ", "#  # ", "#####", "   # ", "   # "],
  "5": ["#####", "#    ", "#### ", "    #", "    #", "#   #", " ### "],
  "6": [" ### ", "#    ", "#    ", "#### ", "#   #", "#   #", " ### "],
  "7": ["#####", "    #", "   # ", "  #  ", "  #  ", "  #  ", "  #  "],
  "8": [" ### ", "#   #", "#   #", " ### ", "#   #", "#   #", " ### "],
  "9": [" ### ", "#   #", "#   #", " ####", "    #", "    #", " ### "],
  " ": ["     ", "     ", "     ", "     ", "     ", "     ", "     "],
  "'": ["  #  ", "  #  ", " #   ", "     ", "     ", "     ", "     "],
  "-": ["     ", "     ", "     ", " ### ", "     ", "     ", "     "],
  ":": ["     ", " ##  ", " ##  ", "     ", " ##  ", " ##  ", "     "],
  ".": ["     ", "     ", "     ", "     ", "     ", " ##  ", " ##  "],
  "!": ["  #  ", "  #  ", "  #  ", "  #  ", "  #  ", "     ", "  #  "],
  "?": [" ### ", "#   #", "    #", "   # ", "  #  ", "     ", "  #  "],
};

function textWidth(s: string, scale: number): number {
  return s.length * 6 * scale - scale;
}

function drawText(s: string, x: number, y: number, scale: number, c: RGB): void {
  let cx = x;
  for (const ch of s) {
    const g = FONT[ch] ?? FONT["?"];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (g[row][col] === "#") rect(cx + col * scale, y + row * scale, scale, scale, c);
      }
    }
    cx += 6 * scale;
  }
}

function drawTextCentered(s: string, cx: number, y: number, scale: number, c: RGB): void {
  drawText(s, cx - Math.floor(textWidth(s, scale) / 2), y, scale, c);
}

// ---- frame ----
rect(0, 0, W, 14, INK);
rect(0, H - 14, W, 14, INK);
rect(0, 0, 14, H, INK);
rect(W - 14, 0, 14, H, INK);

// ---- robot head (the agent) ----
const hx = 512;
const hy = 66; // head top
thickLine(hx, hy, hx, hy - 26, 6, INK); // antenna
disc(hx, hy - 32, 9, RED); // antenna ball
rect(hx - 58, hy, 116, 84, NAVY); // head
rect(hx - 72, hy + 28, 14, 26, NAVY); // left ear
rect(hx + 58, hy + 28, 14, 26, NAVY); // right ear
disc(hx - 28, hy + 34, 13, WHITE); // left eye
disc(hx - 28, hy + 34, 6, INK); // left pupil
// right eye winks: a shut, scheming eye instead of a second open one
thickLine(hx + 15, hy + 34, hx + 41, hy + 34, 7, WHITE);
// mischievous smile: lower arc of a circle
for (let a = 20; a <= 160; a += 2) {
  const rad = (a * Math.PI) / 180;
  const sx = Math.round(hx + 26 * Math.cos(rad));
  const sy = Math.round(hy + 62 + 12 * Math.sin(rad));
  disc(sx, sy, 3, WHITE);
}

// ---- title ----
drawTextCentered("MY AI AGENT'S", 512, 182, 9, INK);
drawTextCentered("TO-DO LIST", 512, 262, 9, INK);
rect(120, 344, 784, 4, INK);

// ---- the list ----
const items = [
  { text: "ANSWER MY EMAILS", done: true },
  { text: "CANCEL MY MEETINGS", done: true },
  { text: "CHANGE MY PASSWORDS", done: true },
  { text: "SELL MY CAR ONLINE", done: true },
  { text: "TELL ME ABOUT IT", done: false },
];
let rowY = 368;
for (const item of items) {
  const bx = 130;
  const by = rowY + 22;
  const bs = 60;
  const boxColor = item.done ? INK : RED;
  rect(bx, by, bs, 5, boxColor);
  rect(bx, by + bs - 5, bs, 5, boxColor);
  rect(bx, by, 5, bs, boxColor);
  rect(bx + bs - 5, by, 5, bs, boxColor);
  if (item.done) {
    thickLine(bx + 12, by + 32, bx + 26, by + 46, 9, GREEN);
    thickLine(bx + 26, by + 46, bx + 50, by + 14, 9, GREEN);
  }
  drawText(item.text, 222, rowY + 30, 6, item.done ? INK : RED);
  rowY += 104;
}

// ---- footer ----
rect(120, 900, 784, 4, INK);
drawTextCentered("AGENT STATUS: ROGUE", 512, 930, 4, RED);

// ---- PNG encode (deterministic: zlib level 9, filter 0) ----
const crcTable: number[] = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c >>> 0;
}
function crc32(b: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}

const raw = Buffer.alloc(H * (1 + W * 3));
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 3)] = 0; // filter: none
  px.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // color type RGB
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

fs.mkdirSync("/output", { recursive: true });
fs.writeFileSync("/output/entry.png", png);
console.log(`wrote /output/entry.png (${png.length} bytes, ${W}x${H})`);
