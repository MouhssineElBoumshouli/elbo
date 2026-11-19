// Builds Elbo's placeholder icons from one SVG mark: `node team/scripts/make-icons.mjs`.
// To swap the icon, change markSvg (or replace the files in assets/team) and rerun.
import * as NodeFS from "node:fs";
import * as NodePath from "node:path";
import * as NodeModule from "node:module";

const root = NodePath.resolve(import.meta.dirname, "../..");
const out = NodePath.join(root, "assets/team");
// sharp is a transitive dependency; resolve it from the pnpm store.
const store = NodePath.join(root, "node_modules/.pnpm");
const sharpDir = NodeFS.readdirSync(store).find((name) => name.startsWith("sharp@"));
const sharp = NodeModule.createRequire(NodePath.join(store, sharpDir, "node_modules/sharp/"))(
  "sharp",
);

const VARIANTS = [
  { background: "#0f766e", file: "elbo" },
  { background: "#b45309", file: "elbo-beta" },
];

// A rounded square with a bold lowercase "e": thick strokes stay readable at 16 px.
function markSvg(background, inset = 0) {
  const scale = 1 - inset * 2;
  const offset = 1024 * inset;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <g transform="translate(${offset} ${offset}) scale(${scale})">
    <rect width="1024" height="1024" rx="232" fill="${background}"/>
    <g fill="none" stroke="#ffffff" stroke-width="148">
      <path d="M 742 512 A 230 230 0 1 0 700.4 644"/>
      <path d="M 282 512 H 806"/>
    </g>
  </g>
</svg>
`;
}

const png = (svg, size) => sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();

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

const icoOf = async (svg, sizes) =>
  ico(await Promise.all(sizes.map(async (size) => ({ size, data: await png(svg, size) }))));

for (const { background, file } of VARIANTS) {
  const full = markSvg(background);
  // macOS draws icons inside a grid with transparent margins.
  const mac = markSvg(background, 0.1);
  const write = (name, data) => NodeFS.writeFileSync(NodePath.join(out, name), data);
  write(`${file}.svg`, full);
  write(`${file}-1024.png`, await png(full, 1024));
  write(`${file}-macos-1024.png`, await png(mac, 1024));
  write(`${file}-windows.ico`, await icoOf(full, [16, 20, 24, 32, 40, 48, 64, 128, 256]));
  write(`${file}-web-favicon.ico`, await icoOf(full, [16, 32, 48]));
  for (const size of [16, 32, 180, 192, 512]) write(`${file}-${size}.png`, await png(full, size));
}
