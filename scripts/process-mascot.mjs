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

// Component cleanup on the alpha mask.
// mode "largest": keep only the biggest opaque region (hero: kills bg speckles).
// mode "border":  keep the biggest region plus interior islands (a raised fist),
//                 but drop side-edge-touching fragments (neighbour-cell bleed)
//                 and dust smaller than 0.2% of the image.
function cleanComponents(data, w, h, mode) {
  const ch = 4;
  const label = new Int32Array(w * h).fill(-1);
  const sizes = [];
  const touchesSide = [];
  const stack = [];
  for (let start = 0; start < w * h; start++) {
    if (label[start] !== -1 || data[start * ch + 3] < 8) continue;
    const id = sizes.length;
    let size = 0;
    let side = false;
    stack.push(start);
    label[start] = id;
    while (stack.length) {
      const p = stack.pop();
      size++;
      const x = p % w, y = (p / w) | 0;
      if (x === 0 || x === w - 1) side = true;
      for (const np of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
        if (np >= 0 && label[np] === -1 && data[np * ch + 3] >= 8) {
          label[np] = id;
          stack.push(np);
        }
      }
    }
    sizes.push(size);
    touchesSide.push(side);
  }
  if (!sizes.length) return;
  const largest = sizes.indexOf(Math.max(...sizes));
  const minSize = Math.round(w * h * 0.002);
  const keep = sizes.map(
    (s, id) =>
      id === largest ||
      (mode === "border" ? s >= minSize && !touchesSide[id] : false)
  );
  for (let p = 0; p < w * h; p++) {
    if (data[p * ch + 3] >= 8 && !keep[label[p]]) data[p * ch + 3] = 0;
  }
}

// Flood-fill bg → transparent on a raw RGBA buffer. Returns { data,w,h,bbox }.
// Gradient-following: a pixel joins the background if it's near the color of the
// ADJACENT background pixel (stepTol) — this tracks the bg's soft vignette but
// stops at sharp edges like the character outline, so same-hue arms survive.
function keyOut(data, w, h, stepTol = 8, erodePasses = 1, despeckle = true) {
  const ch = 4;
  const cornerRGB = (x, y) => {
    const i = (y * w + x) * ch;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const corners = [cornerRGB(0, 0), cornerRGB(w - 1, 0), cornerRGB(0, h - 1), cornerRGB(w - 1, h - 1)];
  const bg = [0, 1, 2].map((k) => Math.round(corners.reduce((s, c) => s + c[k], 0) / corners.length));
  const seedTol2 = 16 * 16; // to start, a border pixel must roughly match the corner color
  const stepTol2 = stepTol * stepTol;
  const distToBg = (i) => {
    const dr = data[i] - bg[0], dg = data[i + 1] - bg[1], db = data[i + 2] - bg[2];
    return dr * dr + dg * dg + db * db;
  };
  const distPix = (i, j) => {
    const dr = data[i] - data[j], dg = data[i + 1] - data[j + 1], db = data[i + 2] - data[j + 2];
    return dr * dr + dg * dg + db * db;
  };
  const isBg = new Uint8Array(w * h);
  const visited = new Uint8Array(w * h);
  const stack = [];
  // seed from all borders where the pixel matches the corner color
  for (let x = 0; x < w; x++) for (const y of [0, h - 1]) {
    const p = y * w + x;
    if (!visited[p] && distToBg(p * ch) <= seedTol2) { visited[p] = 1; stack.push(p); }
  }
  for (let y = 0; y < h; y++) for (const x of [0, w - 1]) {
    const p = y * w + x;
    if (!visited[p] && distToBg(p * ch) <= seedTol2) { visited[p] = 1; stack.push(p); }
  }
  // measured on this art: bg (incl. vignette) stays within ~15 of the corner
  // color; the closest character pixels (tail loop) start at ~38. A global
  // tolerance between the two, plus border connectivity, splits them cleanly.
  const globalTol2 = stepTol * stepTol; // caller passes the tolerance (e.g. 24)
  while (stack.length) {
    const p = stack.pop();
    const i = p * ch;
    isBg[p] = 1;
    data[i + 3] = 0;
    const x = p % w, y = (p / w) | 0;
    const neighbors = [];
    if (x > 0) neighbors.push(p - 1);
    if (x < w - 1) neighbors.push(p + 1);
    if (y > 0) neighbors.push(p - w);
    if (y < h - 1) neighbors.push(p + w);
    for (const np of neighbors) {
      if (visited[np]) continue;
      if (distToBg(np * ch) <= globalTol2) {
        visited[np] = 1;
        stack.push(np);
      }
    }
  }
  // erode the teal fringe left along the character's edge
  erode(data, w, h, erodePasses);
  // component cleanup: hero → keep largest only; cells → also keep interior
  // islands (raised fist) but drop neighbour-cell bleed touching the sides
  cleanComponents(data, w, h, despeckle ? "largest" : "border");
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

async function processRegion(inPath, region, outName, targetH = 512, tol = 40, erodePasses = 3, despeckle = true) {
  let pipe = sharp(inPath).ensureAlpha();
  if (region) pipe = pipe.extract(region);
  const { data, info } = await pipe.raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const { data: keyed, bbox } = keyOut(data, w, h, tol, erodePasses, despeckle);
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
// tiny inset only — despeckle removes any neighbour-cell slivers, and a big
// inset amputates poses that reach the cell edge (the cheering arm)
const IN = 2;
const cell = (col, row) => ({ left: col * CW + IN, top: row * CH + IN, width: CW - IN * 2, height: CH - IN * 2 });

// tol 24: measured — bg+vignette stays within ~15 of the corner color, the
// closest character teal (tail loop) starts at ~38.
await processRegion(join(src, "hero.png"), null, "happy.png", 640, 24, 1, true);
await processRegion(join(src, "poses.png"), cell(3, 1), "celebrate.png", 512, 24, 1, false); // big laugh
await processRegion(join(src, "poses.png"), cell(3, 0), "thinking.png", 512, 24, 1, false); // wink / confident
await processRegion(join(src, "poses.png"), cell(2, 0), "sad.png", 512, 24, 1, false); // worried, hand on chin

// ---- app icons: FULL character centered on a teal gradient tile ----
// (no head-crop guessing — the whole mascot reads clearly and can't be cut)
const pub = join(root, "public");
const bgSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <defs><radialGradient id="g" cx="38%" cy="28%" r="90%">
    <stop offset="0%" stop-color="#19C7BD"/><stop offset="60%" stop-color="#00A79E"/><stop offset="100%" stop-color="#00857D"/>
  </radialGradient></defs>
  <rect width="512" height="512" fill="url(#g)"/></svg>`);
const character = await sharp(join(outDir, "happy.png"))
  .resize({ width: 420, height: 420, fit: "inside" })
  .png()
  .toBuffer();
const iconBase = await sharp(bgSvg)
  .composite([{ input: character, gravity: "center" }])
  .png()
  .toBuffer();
for (const [name, size] of [["icon-192.png", 192], ["icon-512.png", 512], ["apple-icon.png", 180], ["favicon.png", 32]]) {
  await sharp(iconBase).resize(size, size).png().toFile(join(pub, name));
}
console.log("wrote icons from hero");
console.log("done");
