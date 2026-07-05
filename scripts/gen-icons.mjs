// Rasterize the penguin mascot's face into the PWA PNG icons.
// Run: node scripts/gen-icons.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");
mkdirSync(pub, { recursive: true });

const INK = "#243244", ORANGE = "#FF9600", ORANGE_D = "#E67F00";

// Penguin head + face, centred with maskable-safe margin, on a teal gradient.
const icon = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="38%" cy="28%" r="90%">
      <stop offset="0%" stop-color="#19C7BD"/><stop offset="60%" stop-color="#00A79E"/><stop offset="100%" stop-color="#00857D"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <!-- body -->
  <path d="M256 150c92 0 138 74 138 150s-58 132-138 132-138-56-138-132 46-150 138-150z" fill="#00B2A9"/>
  <path d="M132 358c22 62 70 92 124 92s102-30 124-92c-34 30-214 30-248 0z" fill="#00938B"/>
  <!-- crest -->
  <path d="M236 150c-14-30-30-36-24-2zM276 150c14-30 30-36 24-2z" fill="#00A69D"/>
  <!-- belly -->
  <ellipse cx="256" cy="322" rx="104" ry="98" fill="#E9F8EE"/>
  <!-- eyes -->
  <circle cx="200" cy="250" r="60" fill="#fff"/><circle cx="312" cy="250" r="60" fill="#fff"/>
  <circle cx="208" cy="256" r="35" fill="${INK}"/><circle cx="320" cy="256" r="35" fill="${INK}"/>
  <circle cx="221" cy="243" r="13" fill="#fff"/><circle cx="333" cy="243" r="13" fill="#fff"/>
  <circle cx="196" cy="270" r="6.5" fill="#fff"/><circle cx="308" cy="270" r="6.5" fill="#fff"/>
  <!-- brows -->
  <path d="M150 205q44-22 92-8" stroke="${INK}" stroke-width="19" stroke-linecap="round" fill="none"/>
  <path d="M362 205q-44-22-92-8" stroke="${INK}" stroke-width="19" stroke-linecap="round" fill="none"/>
  <!-- beak -->
  <path d="M222 300q34 9 68 0-10 30-34 30t-34-30z" fill="${ORANGE}"/>
  <path d="M222 300q34 9 68 0-7 10-34 10t-34-10z" fill="${ORANGE_D}"/>
</svg>`;

for (const [name, size] of [["icon-192.png", 192], ["icon-512.png", 512], ["apple-icon.png", 180], ["favicon.png", 32]]) {
  await sharp(Buffer.from(icon)).resize(size, size).png().toFile(join(pub, name));
  console.log("wrote", name, `${size}x${size}`);
}
