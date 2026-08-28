/**
 * engine/motion.ts
 *
 * The motion system. Governed by CLAUDE.md §4 (the motion quality system).
 * Key rules baked in here:
 *   - NO CSS animations/transitions — only spring()/interpolate() driven by frame.
 *   - NEVER cap a spring with durationInFrames (it fights physics → choppy stop).
 *     Springs run free; feel is tuned via config (damping/stiffness/mass).
 *   - Spring presets from tokens.MOTION.SPRINGS (snappy/smooth/elegant/pop).
 *   - Entrances combine 2+ properties (fade + move/scale), never fade-only.
 *   - Stagger 5–8 frames between elements (tokens.MOTION.STAGGER), never ~2.
 *   - Continuous post-entrance life via drift()/breathe() so nothing "just sits."
 *   - extrapolateRight:'clamp' on every interpolate.
 */

import { interpolate, spring } from 'remotion';
import { CSSProperties } from 'react';
import { MOTION } from '../theme/tokens';

export type SpringPreset = keyof typeof MOTION.SPRINGS;

/** Stagger in FRAMES for index i (research: 5–8 pro). Default 'normal' (6f). */
export function staggerFrames(i: number, step: keyof typeof MOTION.STAGGER = 'normal', base = 0): number {
  return base + MOTION.STAGGER[step] * i;
}

/** Legacy seconds-based stagger (kept for back-compat). Prefer staggerFrames. */
export function staggerDelay(fps: number, i: number, baseDelay = 0): number {
  return baseDelay + Math.round(fps * MOTION.STAGGER_STEP_S * i);
}

/**
 * Core spring progress 0→1 (may overshoot >1 for 'pop'). UNCAPPED — physics runs
 * to natural settle. delay shifts the start frame.
 */
export function springProgress(
  frame: number,
  fps: number,
  delay = 0,
  preset: SpringPreset = 'smooth',
): number {
  return spring({
    frame: frame - delay,
    fps,
    config: MOTION.SPRINGS[preset],
    // NO durationInFrames — intentional. See §4.1.
  });
}

/** Back-compat alias used by older code. */
export function springIn(frame: number, fps: number, delay = 0): number {
  return springProgress(frame, fps, delay, 'smooth');
}

/**
 * Cubic-bezier easing eval (homepage .fade-up curve by default).
 * For interpolate-based easing where a spring isn't wanted (sweeps, counts).
 */
export function cubicBezier(
  t: number,
  p1x = MOTION.BEZIER[0],
  p1y = MOTION.BEZIER[1],
  p2x = MOTION.BEZIER[2],
  p2y = MOTION.BEZIER[3],
): number {
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;
  const sampleX = (u: number) => ((ax * u + bx) * u + cx) * u;
  const sampleY = (u: number) => ((ay * u + by) * u + cy) * u;
  let lo = 0, hi = 1, u = t;
  for (let i = 0; i < 20; i++) {
    const x = sampleX(u) - t;
    if (Math.abs(x) < 1e-4) break;
    if (x > 0) hi = u; else lo = u;
    u = (lo + hi) / 2;
  }
  return sampleY(u);
}

// ─── ENTRANCES (always combine 2+ properties) ──────────────────────────────

/** Slide up + fade. distance px from below. */
export function slideUp(
  frame: number, fps: number, delay = 0, distance = 48, preset: SpringPreset = 'smooth',
): CSSProperties {
  const p = springProgress(frame, fps, delay, preset);
  return {
    opacity: interpolate(p, [0, 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    transform: `translateY(${interpolate(p, [0, 1], [distance, 0])}px)`,
  };
}

/** Scale reveal + fade. Slightly stronger start than before for presence. */
export function scaleReveal(
  frame: number, fps: number, delay = 0, from = 0.88, preset: SpringPreset = 'snappy',
): CSSProperties {
  const p = springProgress(frame, fps, delay, preset);
  return {
    opacity: interpolate(p, [0, 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    transform: `scale(${interpolate(p, [0, 1], [from, 1])})`,
  };
}

/** Pop entrance for CTA/emphasis — scale + fade with overshoot (preset 'pop'). */
export function popIn(frame: number, fps: number, delay = 0, from = 0.8): CSSProperties {
  const p = springProgress(frame, fps, delay, 'pop');
  return {
    opacity: interpolate(p, [0, 0.6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    transform: `scale(${interpolate(p, [0, 1], [from, 1])})`,
  };
}

/** Slide in from a side + fade. */
export function slideFrom(
  frame: number, fps: number, delay = 0,
  dir: 'left' | 'right' | 'top' | 'bottom' = 'left', distance = 80, preset: SpringPreset = 'smooth',
): CSSProperties {
  const p = springProgress(frame, fps, delay, preset);
  const axis = dir === 'left' || dir === 'right' ? 'X' : 'Y';
  const sign = dir === 'left' || dir === 'top' ? -1 : 1;
  return {
    opacity: interpolate(p, [0, 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    transform: `translate${axis}(${interpolate(p, [0, 1], [sign * distance, 0])}px)`,
  };
}

/** Simple fade (use sparingly — prefer combined entrances). */
export function fadeIn(frame: number, fps: number, delay = 0, durationFrames?: number): CSSProperties {
  const d = durationFrames ?? Math.round(fps * 0.4);
  return {
    opacity: interpolate(frame - delay, [0, d], [0, 1], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    }),
  };
}

// ─── CONTINUOUS LIFE (kills the "PowerPoint static hold" feel, §4.2) ────────

/**
 * Slow sinusoidal drift, px. Apply to settled elements so they keep subtle life.
 * amount=4px over ~90f period reads as "alive" without being distracting.
 */
export function drift(frame: number, axis: 'x' | 'y' = 'y', amount = 4, periodFrames = 90, phase = 0): CSSProperties {
  const v = Math.sin(((frame + phase) / periodFrames) * Math.PI * 2) * amount;
  return { transform: axis === 'y' ? `translateY(${v}px)` : `translateX(${v}px)` };
}

/** Breathing scale for emphasis cards (1.0 → 1.0+amount). Subtle. */
export function breathe(frame: number, amount = 0.008, periodFrames = 110, phase = 0): number {
  return 1 + (Math.sin(((frame + phase) / periodFrames) * Math.PI * 2) * 0.5 + 0.5) * amount;
}

/**
 * Compose an entrance transform with a continuous-life transform safely
 * (combines two transform strings). Pass the settled drift/breathe in.
 */
export function withLife(entrance: CSSProperties, lifeTransform?: string): CSSProperties {
  if (!lifeTransform) return entrance;
  const base = (entrance.transform as string) || '';
  return { ...entrance, transform: `${base} ${lifeTransform}`.trim() };
}

// ─── COUNT-UP / TYPE ────────────────────────────────────────────────────────

/** Count-up number. Returns the current numeric value to render. */
export function countUp(
  frame: number, fps: number, target: number, delay = 0, durationSeconds = 1.4,
): number {
  const d = Math.round(fps * durationSeconds);
  const p = interpolate(frame - delay, [0, d], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
  return target * eased;
}

/** Typewriter — returns the visible slice of text. */
export function typeOn(
  frame: number, fps: number, text: string, delay = 0, charsPerSecond = 30,
): string {
  const chars = Math.floor(((frame - delay) / fps) * charsPerSecond);
  return text.slice(0, Math.max(0, chars));
}
