// Seeded improved-Perlin noise + fractal (octave) helper. Pure JS.
import { RNG } from './util.js';

const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (t, a, b) => a + t * (b - a);
function grad(h, x, y, z) {
  h &= 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

export class Perlin {
  constructor(rng) {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = rng.int(i + 1);
      const t = p[i]; p[i] = p[j]; p[j] = t;
    }
    this.p = new Uint8Array(512);
    for (let i = 0; i < 512; i++) this.p[i] = p[i & 255];
    this.ox = rng.next() * 256;
    this.oy = rng.next() * 256;
    this.oz = rng.next() * 256;
  }

  /** 3D noise, roughly in [-1, 1] (typical +-0.6). */
  noise3(x, y, z) {
    x += this.ox; y += this.oy; z += this.oz;
    let X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
    x -= X; y -= Y; z -= Z;
    X &= 255; Y &= 255; Z &= 255;
    const u = fade(x), v = fade(y), w = fade(z);
    const p = this.p;
    const A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z;
    const B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;
    return lerp(w,
      lerp(v, lerp(u, grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z)),
              lerp(u, grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z))),
      lerp(v, lerp(u, grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1)),
              lerp(u, grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1))));
  }

  /** 2D noise (a fixed slice of the 3D noise). */
  noise2(x, z) { return this.noise3(x, 0, z); }
}

/** Fractal noise: sum of octaves, amplitude halves and frequency doubles. Normalised to ~[-1, 1]. */
export class FBM {
  constructor(seed, octaves = 4, persistence = 0.5, lacunarity = 2) {
    const rng = new RNG(seed);
    this.oct = [];
    this.norm = 0;
    let a = 1;
    for (let i = 0; i < octaves; i++) {
      this.oct.push(new Perlin(rng));
      this.norm += a;
      a *= persistence;
    }
    this.pers = persistence;
    this.lac = lacunarity;
  }
  n3(x, y, z) {
    let a = 1, f = 1, s = 0;
    for (let i = 0; i < this.oct.length; i++) {
      s += a * this.oct[i].noise3(x * f, y * f, z * f);
      a *= this.pers; f *= this.lac;
    }
    return s / this.norm;
  }
  n2(x, z) {
    let a = 1, f = 1, s = 0;
    for (let i = 0; i < this.oct.length; i++) {
      s += a * this.oct[i].noise2(x * f, z * f);
      a *= this.pers; f *= this.lac;
    }
    return s / this.norm;
  }
}
