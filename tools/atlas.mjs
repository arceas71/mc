// Dumps every generated texture into one PNG sheet so humans/AIs can eyeball the art.
// Usage: node tools/atlas.mjs [out.png] [cols] [scale] [filterPrefix]
// Tinted textures (grass top, leaves, grass side overlay, tall grass, water) are shown with a typical biome tint.
import { generateTextures, TS } from '../js/textures.js';
import { writePNG } from './png.mjs';

const out = process.argv[2] || 'atlas.png';
const cols = +process.argv[3] || 16;
const scale = +process.argv[4] || 4;
const filter = process.argv[5] || '';

const { names, pixels } = generateTextures();
const list = names.map((n, i) => i).filter((i) => !filter || names[i].startsWith(filter));
const rows = Math.ceil(list.length / cols);
const cell = TS * scale + 2;
const W = cols * cell, H = rows * cell;
const img = new Uint8Array(W * H * 4);
for (let i = 0; i < W * H; i++) { const c = ((i % W >> 3) + ((i / W | 0) >> 3)) & 1 ? 52 : 70; img[i * 4] = img[i * 4 + 1] = img[i * 4 + 2] = c; img[i * 4 + 3] = 255; }

const TINT_GRASS = [0x91, 0xbd, 0x59], TINT_FOLIAGE = [0x77, 0xab, 0x2f], TINT_WATER = [0x3f, 0x76, 0xe4];
const tinted = (n) => (n === 'grass_top' || n === 'tallgrass' ? TINT_GRASS : n === 'leaves_oak' || n === 'leaves_birch' || n === 'leaves_spruce' ? TINT_FOLIAGE : n.startsWith('water_') ? TINT_WATER : null);

list.forEach((idx, k) => {
  const name = names[idx];
  const ox = (k % cols) * cell + 1, oy = ((k / cols) | 0) * cell + 1;
  const tint = tinted(name);
  for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
    const s = idx * TS * TS * 4 + (y * TS + x) * 4;
    let r = pixels[s], g = pixels[s + 1], b = pixels[s + 2], a = pixels[s + 3];
    if (name === 'grass_side' && a === 0) { // alpha 0 = tinted overlay
      r = (r * TINT_GRASS[0]) / 255; g = (g * TINT_GRASS[1]) / 255; b = (b * TINT_GRASS[2]) / 255; a = 255;
    } else if (tint) { r = (r * tint[0]) / 255; g = (g * tint[1]) / 255; b = (b * tint[2]) / 255; }
    if (a === 0) continue;
    for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
      const d = ((oy + y * scale + dy) * W + ox + x * scale + dx) * 4;
      const al = a / 255;
      img[d] = img[d] * (1 - al) + r * al; img[d + 1] = img[d + 1] * (1 - al) + g * al; img[d + 2] = img[d + 2] * (1 - al) + b * al;
    }
  }
});
writePNG(out, W, H, img);
console.log(`wrote ${out}: ${names.length} textures (${list.length} shown), ${W}x${H}`);
