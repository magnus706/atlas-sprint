// Turn the ChatGPT mascot art into transparent, trimmed pose PNGs for the app.
// - flood-fills the solid teal background to transparent (from the edges, so the
//   teal body is untouched)
// - slices the 4x2 pose sheet into individual expressions
// - trims to the character and saves to public/mascot/
// Run: node scripts/process-mascot.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "mascot-src");
const outDir = join(root, "public", "mascot");
mkdirSync(outDir, { recursive: true });

// Erode the alpha mask by `passes` pixels to remove the teal edge fringe.
function erode(data, w, h, passes) {
  const ch = 4;
  for (let n = 0; n < passes; n++) {
    const clear = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = (y * w + x) * ch;
        if (data[p + 3] < 8) continue;
        const t =
          (x > 0 && data[p - ch + 3] < 8) ||
          (x < w - 1 && data[p + ch + 3] < 8) ||
          (y > 0 && data[p - w * ch + 3] < 8) ||
          (y < h - 1 && data[p + w * ch + 3] < 8);
        if (t) clear.push(p + 3);
      }
    }
    for (const a of clear) data[a] = 0;
  }
}

// Flood-fill bg → transparent on a raw RGBA buffer. Returns { data,w,h,bbox }.
function keyOut(data, w, h, tol = 40, erodePasses = 3) {
  const ch = 4;
  const cornerRGB = (x, y) => {
    const i = (y * w + x) * ch;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const corners = [cornerRGB(0, 0), cornerRGB(w - 1, 0), cornerRGB(0, h - 1), cornerRGB(w - 1, h - 1)];
  const bg = [0, 1, 2].map((k) => Math.round(corners.reduce((s, c) => s + c[k], 0) / corners.length));
  const tol2 = tol * tol;
  const match = (i) => {
    const dr = data[i] - bg[0], dg = data[i + 1] - bg[1], db = data[i + 2] - bg[2];
    return dr * dr + dg * dg + db * db <= tol2;
  };
  const visited = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => {
    const p = y * w + x;
    if (!visited[p]) {
      visited[p] = 1;
      stack.push(p);
    }
  };
  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }
  while (stack.length) {
    const p = stack.pop();
    const i = p * ch;
    if (!match(i)) continue;
    data[i + 3] = 0;
    const x = p % w, y = (p / w) | 0;
    if (x > 0) push(x - 1, y);
    if (x < w - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < h - 1) push(x, y + 1);
  }
  // erode the teal fringe left along the character's edge
  erode(data, w, h, erodePasses);
  // bounding box of visible content
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * ch + 3] > 12) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { data, bbox: { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 } };
}

async function processRegion(inPath, region, outName, targetH = 512, tol = 40, erodePasses = 3) {
  let pipe = sharp(inPath).ensureAlpha();
  if (region) pipe = pipe.extract(region);
  const { data, info } = await pipe.raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const { data: keyed, bbox } = keyOut(data, w, h, tol, erodePasses);
  // pad the trim slightly
  const pad = Math.round(bbox.height * 0.03);
  const left = Math.max(0, bbox.left - pad);
  const top = Math.max(0, bbox.top - pad);
  const width = Math.min(w - left, bbox.width + pad * 2);
  const height = Math.min(h - top, bbox.height + pad * 2);
  await sharp(Buffer.from(keyed), { raw: { width: w, height: h, channels: 4 } })
    .extract({ left, top, width, height })
    .resize({ height: targetH, fit: "inside" })
    .png()
    .toFile(join(outDir, outName));
  console.log("wrote", outName, `${width}x${height} -> h${targetH}`);
}

const CW = 384, CH = 512; // pose-sheet cell size (1536x1024, 4x2)
const IN = 12; // inset to avoid catching a sliver of the neighbouring cell
const cell = (col, row) => ({ left: col * CW + IN, top: row * CH + IN, width: CW - IN * 2, height: CH - IN * 2 });

// happy/idle from the clean hero art (high-res → tol 40, erode 3)
await processRegion(join(src, "hero.png"), null, "happy.png", 640, 40, 3);
// pose-sheet cells are lower-res & leak → tighter tol, gentle erode
await processRegion(join(src, "poses.png"), cell(1, 0), "celebrate.png", 512, 26, 1);
await processRegion(join(src, "poses.png"), cell(2, 0), "thinking.png", 512, 26, 1);
await processRegion(join(src, "poses.png"), cell(1, 1), "sad.png", 512, 26, 1);

// ---- app icons: character face on a teal gradient tile ----
const pub = join(root, "public");
const bgSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <defs><radialGradient id="g" cx="38%" cy="28%" r="90%">
    <stop offset="0%" stop-color="#19C7BD"/><stop offset="60%" stop-color="#00A79E"/><stop offset="100%" stop-color="#00857D"/>
  </radialGradient></defs>
  <rect width="512" height="512" fill="url(#g)"/></svg>`);
// crop the hero to head+shoulders for a punchy icon
const heroKeyed = await sharp(join(outDir, "happy.png")).toBuffer();
const hm = await sharp(heroKeyed).metadata();
// head is the top ~46% of the character; crop it, trim, center it big
const cropTop = await sharp(heroKeyed)
  .extract({ left: 0, top: 0, width: hm.width, height: Math.round(hm.height * 0.46) })
  .png()
  .toBuffer();
const faceCrop = await sharp(cropTop).trim().resize({ width: 430, height: 430, fit: "inside" }).png().toBuffer();
const iconBase = await sharp(bgSvg)
  .composite([{ input: faceCrop, gravity: "center" }])
  .png()
  .toBuffer();
for (const [name, size] of [["icon-192.png", 192], ["icon-512.png", 512], ["apple-icon.png", 180], ["favicon.png", 32]]) {
  await sharp(iconBase).resize(size, size).png().toFile(join(pub, name));
}
console.log("wrote icons from hero");
console.log("done");
