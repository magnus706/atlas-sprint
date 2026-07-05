// One-off: rasterize Orbi's face into the PNG icons the PWA needs.
// Run with: node scripts/gen-icons.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");
mkdirSync(pub, { recursive: true });

// Orbi's face, centered with a maskable-safe margin (content within ~76% center).
// 512 canvas; gradient background + glossy globe head + goggles + smile.
const icon = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="38%" cy="30%" r="85%">
      <stop offset="0%" stop-color="#19C7BD"/>
      <stop offset="60%" stop-color="#00B2A9"/>
      <stop offset="100%" stop-color="#008179"/>
    </radialGradient>
    <radialGradient id="head" cx="40%" cy="30%" r="82%">
      <stop offset="0%" stop-color="#6BEBE3"/>
      <stop offset="55%" stop-color="#0FBDB4"/>
      <stop offset="100%" stop-color="#00908A"/>
    </radialGradient>
    <radialGradient id="face" cx="46%" cy="38%" r="72%">
      <stop offset="0%" stop-color="#ECFDFA"/>
      <stop offset="100%" stop-color="#C4F1EC"/>
    </radialGradient>
    <linearGradient id="lens" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#DCF3FF"/>
      <stop offset="100%" stop-color="#7FC6EE"/>
    </linearGradient>
    <linearGradient id="strap" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#EDBB72"/>
      <stop offset="100%" stop-color="#C6893C"/>
    </linearGradient>
    <radialGradient id="gold" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#FFDE6B"/>
      <stop offset="100%" stop-color="#FFB800"/>
    </radialGradient>
  </defs>

  <!-- background -->
  <rect width="512" height="512" fill="url(#bg)"/>
  <ellipse cx="185" cy="150" rx="150" ry="95" fill="#FFFFFF" opacity="0.10"/>

  <!-- orbit ring behind head -->
  <g transform="rotate(-16 256 300)">
    <ellipse cx="256" cy="300" rx="205" ry="66" fill="none" stroke="url(#gold)" stroke-width="20"/>
  </g>

  <!-- head sphere -->
  <circle cx="256" cy="286" r="150" fill="url(#head)"/>
  <ellipse cx="212" cy="206" rx="70" ry="46" fill="#FFFFFF" opacity="0.28" transform="rotate(-24 212 206)"/>
  <path d="M150 300c20-10 40 0 37 20-3 16-27 20-40 6-9-10-9-20 3-26z" fill="#43D6CD" opacity="0.5"/>
  <path d="M360 250c16-6 30 3 27 20-3 13-23 16-33 6-8-8-6-20 6-26z" fill="#43D6CD" opacity="0.5"/>

  <!-- face patch -->
  <ellipse cx="256" cy="304" rx="106" ry="96" fill="url(#face)"/>

  <!-- goggles -->
  <path d="M116 176c46-26 234-26 280 0l-8 30c-40-20-224-20-264 0z" fill="url(#strap)"/>
  <circle cx="192" cy="172" r="42" fill="url(#strap)"/>
  <circle cx="320" cy="172" r="42" fill="url(#strap)"/>
  <circle cx="192" cy="172" r="29" fill="url(#lens)"/>
  <circle cx="320" cy="172" r="29" fill="url(#lens)"/>
  <path d="M176 162c7-7 17-7 24 0" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" fill="none" opacity="0.9"/>
  <path d="M304 162c7-7 17-7 24 0" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" fill="none" opacity="0.9"/>

  <!-- eyes -->
  <ellipse cx="200" cy="286" rx="42" ry="52" fill="#FFFFFF"/>
  <ellipse cx="312" cy="286" rx="42" ry="52" fill="#FFFFFF"/>
  <circle cx="205" cy="292" r="23" fill="#2B2B2B"/>
  <circle cx="317" cy="292" r="23" fill="#2B2B2B"/>
  <circle cx="214" cy="282" r="8.5" fill="#FFFFFF"/>
  <circle cx="326" cy="282" r="8.5" fill="#FFFFFF"/>
  <circle cx="196" cy="300" r="4.5" fill="#FFFFFF" opacity="0.85"/>
  <circle cx="308" cy="300" r="4.5" fill="#FFFFFF" opacity="0.85"/>

  <!-- cheeks -->
  <ellipse cx="150" cy="330" rx="21" ry="14" fill="#FF8FA3" opacity="0.75"/>
  <ellipse cx="362" cy="330" rx="21" ry="14" fill="#FF8FA3" opacity="0.75"/>

  <!-- smile -->
  <path d="M206 344c17 24 63 24 80 0" stroke="#00625C" stroke-width="16" stroke-linecap="round" fill="none"/>
  <path d="M234 362c7 6 21 6 28 0-4 11-24 11-28 0z" fill="#FF8FA3"/>

  <!-- satellite on ring -->
  <circle cx="420" cy="360" r="17" fill="url(#gold)"/>
  <circle cx="420" cy="360" r="6" fill="#FFF3C4"/>
</svg>`;

const targets = [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-icon.png", 180],
  ["favicon.png", 32],
];

for (const [name, size] of targets) {
  await sharp(Buffer.from(icon)).resize(size, size).png().toFile(join(pub, name));
  console.log("wrote", name, `${size}x${size}`);
}
