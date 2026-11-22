// Builds Elbo's app icons from assets/team/elbo-symbol-transparent.png: `node team/scripts/make-icons.mjs`.
// The drawing is only resized, never changed. Beta adds an amber dot in the empty bottom-right corner.
import * as NodeFS from "node:fs";
import * as NodePath from "node:path";
import * as NodeModule from "node:module";

const root = NodePath.resolve(import.meta.dirname, "../..");
const out = NodePath.join(root, "assets/team");
const source = NodePath.join(out, "elbo-symbol-transparent.png");
// sharp is a transitive dependency; resolve it from the pnpm store.
const store = NodePath.join(root, "node_modules/.pnpm");
const sharpDir = NodeFS.readdirSync(store).find((name) => name.startsWith("sharp@"));
const sharp = NodeModule.createRequire(NodePath.join(store, sharpDir, "node_modules/sharp/"))(
  "sharp",
);

// Measured on the 1024 px source: the drawing ends at x 898 and y 838, over 100 px from this dot.
const BETA_BADGE = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
  <circle cx="880" cy="880" r="118" fill="#f59e0b" stroke="#ffffff" stroke-width="24"/>
</svg>`;

const base = await sharp(source).ensureAlpha().png().toBuffer();
const VARIANTS = [
  { file: "elbo", master: base },
  {
    file: "elbo-beta",
    master: await sharp(base)
      .composite([{ input: Buffer.from(BETA_BADGE) }])
      .png()
      .toBuffer(),
  },
];

const png = (master, size) =>
  sharp(master).resize(size, size, { kernel: "lanczos3" }).png().toBuffer();

function ico(images) {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, index) => {
    const entry = 6 + index * 16;
    header.writeUInt8(size >= 256 ? 0 : size, entry);
    header.writeUInt8(size >= 256 ? 0 : size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((image) => image.data)]);
}

const icoOf = async (master, sizes) =>
  ico(await Promise.all(sizes.map(async (size) => ({ size, data: await png(master, size) }))));

for (const { file, master } of VARIANTS) {
  const write = (name, data) => NodeFS.writeFileSync(NodePath.join(out, name), data);
  write(`${file}-1024.png`, await png(master, 1024));
  // The source already has margins like macOS's icon grid, so macOS uses the same picture.
  write(`${file}-macos-1024.png`, await png(master, 1024));
  write(`${file}-windows.ico`, await icoOf(master, [16, 20, 24, 32, 40, 48, 64, 128, 256]));
  write(`${file}-web-favicon.ico`, await icoOf(master, [16, 32, 48]));
  for (const size of [16, 32, 180, 192, 512]) write(`${file}-${size}.png`, await png(master, size));
}
