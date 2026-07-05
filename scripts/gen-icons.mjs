// One-off: rasterize the brand globe SVG into the PNG icons the PWA needs.
// Run with: node scripts/gen-icons.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");
mkdirSync(pub, { recursive: true });

// full-bleed teal tile with Orbi's globe — safe for maskable (content within 80% safe zone)
const svg = (s) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 120 120">
  <rect width="120" height="120" fill="#00B2A9"/>
  <circle cx="60" cy="60" r="40" fill="#C9F4F0"/>
  <circle cx="60" cy="60" r="40" fill="none" stroke="#FFFFFF" stroke-width="5.5"/>
  <ellipse cx="60" cy="60" rx="18" ry="40" fill="none" stroke="#00726C" stroke-width="4.5"/>
  <path d="M22 47h76M22 73h76" stroke="#00726C" stroke-width="4.5"/>
  <path d="M60 20v80" stroke="#00726C" stroke-width="4.5"/>
  <circle cx="94" cy="32" r="8" fill="#FFC800"/>
  <circle cx="94" cy="32" r="3" fill="#FFF5D6"/>
</svg>`;

const targets = [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-icon.png", 180],
];

for (const [name, size] of targets) {
  await sharp(Buffer.from(svg(size))).png().toFile(join(pub, name));
  console.log("wrote", name, `${size}x${size}`);
}

// favicon.ico (32px)
await sharp(Buffer.from(svg(32))).resize(32, 32).png().toFile(join(pub, "favicon.png"));
console.log("wrote favicon.png 32x32");
