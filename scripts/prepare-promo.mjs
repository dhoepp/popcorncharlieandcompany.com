// Turns whatever is in site-content/promo into web-ready JPEGs in
// src/generated/promo (gitignored) before dev/build. This is what lets editors
// drop in iPhone HEIC photos or huge originals: HEIC is decoded here (sharp's
// prebuilt binaries can't read it), everything is auto-rotated and resized to
// at most MAX_WIDTH px wide (2x the 612px display size for sharp retina screens).
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import convert from "heic-convert";

const SRC = "site-content/promo";
const OUT = "src/generated/promo";
const MAX_WIDTH = 1224;
const EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"]);

await fs.rm(OUT, { recursive: true, force: true });
await fs.mkdir(OUT, { recursive: true });

const names = (await fs.readdir(SRC).catch(() => [])).sort();
for (const name of names) {
  const ext = path.extname(name).toLowerCase();
  if (!EXTS.has(ext)) continue; // ignores README.md etc.

  let input = await fs.readFile(path.join(SRC, name));
  if (ext === ".heic" || ext === ".heif") {
    input = Buffer.from(await convert({ buffer: input, format: "JPEG", quality: 1 }));
  }

  // Keep the original extension in the name so photo.jpg and photo.png can't collide.
  const outName = `${name}.jpg`;
  await sharp(input)
    .rotate() // apply EXIF orientation
    .flatten({ background: "#ffffff" }) // JPEG has no transparency
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(OUT, outName));
  console.log(`promo: ${name} -> ${outName}`);
}
