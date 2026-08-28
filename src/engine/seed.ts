/**
 * engine/seed.ts
 *
 * Deterministic seeded RNG. Every reel spec carries a numeric seed; all
 * "random" choices (background variant, palette, motion preset, layout
 * jitter) derive from it. Same seed -> same reel, always. This is what makes
 * a batch of 90 reproducible AND guarantees each is a unique fingerprint.
 */

export function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export class SeededRandom {
  private state: number;
  constructor(seed: number | string) {
    this.state = typeof seed === 'string' ? hashString(seed) : seed >>> 0;
    if (this.state === 0) this.state = 1;
  }
  /** float in [0,1) */
  next(): number {
    // xorshift32
    let x = this.state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return this.state / 4294967296;
  }
  /** int in [min,max] inclusive */
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  /** pick one element */
  pick<T>(arr: T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }
  /** float in [min,max) */
  float(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
  /** true with probability p */
  chance(p: number): boolean {
    return this.next() < p;
  }
}
