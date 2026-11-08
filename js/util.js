// Shared constants and small helpers. Pure JS: runs in the browser AND in Node (tests).

export const CW = 16;            // chunk width/depth in blocks
export const CH = 256;           // world height in blocks
export const SECTION = 16;       // section height (chunk is split into 16 sections)
export const NSECT = CH / SECTION;
export const SEA_LEVEL = 63;     // water fills y <= 62 (surface at y=63) like Minecraft
export const TPS = 20;           // fixed game ticks per second (vanilla)

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const mod = (a, n) => ((a % n) + n) % n;

/** Unique numeric key for chunk coords (|cz| < 2^21). */
export const chunkKey = (cx, cz) => cx * 4194304 + cz;

/** Small fast seeded RNG (mulberry32). */
export class RNG {
  constructor(seed = 1) {
    this.s = (seed >>> 0) || 0x9e3779b9;
  }
  next() {
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(n) { return Math.floor(this.next() * n); }            // [0, n)
  range(a, b) { return a + this.next() * (b - a); }          // [a, b)
  chance(p) { return this.next() < p; }
  pick(arr) { return arr[this.int(arr.length)]; }
}

/** Integer hash of up to 4 ints -> uint32. */
export function hash32(a, b = 0, c = 0, d = 0) {
  let h = (a | 0) ^ Math.imul(b | 0, 0x85ebca6b) ^ Math.imul(c | 0, 0xc2b2ae35) ^ Math.imul(d | 0, 0x27d4eb2f);
  h ^= h >>> 16; h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15; h = Math.imul(h, 0x846ca68b);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Java-style String.hashCode (what Minecraft does for text seeds). */
export function strHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

/** Minecraft-style seed text -> 32-bit int. Empty = random. */
export function seedFromText(text) {
  const t = (text || '').trim();
  if (t === '') return (Math.random() * 4294967296) | 0;
  if (/^-?\d+$/.test(t)) return Number(BigInt.asIntN(32, BigInt(t)));
  return strHash(t);
}
