/**
 * theme/tokens.ts
 *
 * A faithful port of the VoiceAI Connect homepage design language
 * (globals.css — "Geist sans + mono. No italics. Engineered, not decorative.").
 *
 * This file is the single source of brand truth for reels. Templates read
 * type, color, surface, and motion tokens from here so every reel inherits the
 * exact homepage feel — you could not author an off-brand reel if you tried.
 *
 * Key facts ported verbatim from the CSS:
 *   - Display type is Geist weight 500 (NOT 700/800), with TIGHT negative
 *     tracking (h1 -0.045em, stat -0.05em) and sub-1 line-height on headlines.
 *   - Labels/eyebrows/metadata are Geist Mono, uppercase, 0.16em tracking, 500.
 *   - Brand emerald IN MOTION CONTEXTS is #4aeabc (--em-400), with #10b981
 *     (--em-500) as the deeper variant. Ink is #050505 (not #0a0a0a).
 *   - Numbers use tabular figures ("tnum") so count-ups don't jitter.
 *   - Entrance easing is cubic-bezier(0.16, 1, 0.3, 1) over ~0.85s.
 *
 * NOTE on fonts: the actual font *family strings* live here, but the fonts are
 * loaded/registered in theme/fonts.ts (via @remotion/google-fonts) so they are
 * deterministic at render time. Templates should spread FONT.display / FONT.mono.
 */

// ────────────────────────────────────────────────────────────────────────────
// BRAND COLOR (corrected from the CSS @theme block)
// ────────────────────────────────────────────────────────────────────────────

export const BRAND = {
  ink: '#050505',          // --color-ink — true page black
  paper: '#ffffff',        // --color-paper
  paperSoft: '#f7f7f5',    // --color-paper-soft
  em100: '#d1fae5',
  em300: '#6ee7b7',
  em400: '#4aeabc',        // ← emerald IN MOTION/accent contexts (the bright one)
  em500: '#10b981',        // ← deeper emerald (matches dashboard primary)
  em700: '#047857',
  near: '#fafaf9',         // body text on ink
} as const;

// ────────────────────────────────────────────────────────────────────────────
// TYPE SCALE — ported 1:1 from globals.css .t-* classes
// Sizes here are absolute px chosen for the 1080×1920 canvas (the CSS used
// clamp() for responsive web; for a fixed 1080w reel we pin to the clamp MAX
// or just above, then templates can scale down per-spec). Tracking + weight +
// line-height match the CSS exactly — those are the brand signature.
// ────────────────────────────────────────────────────────────────────────────

export const TYPE = {
  /** .t-eyebrow — Geist Mono, uppercase, 0.16em, 500 */
  eyebrow: {
    fontWeight: 500,
    letterSpacing: '0.16em',
    textTransform: 'uppercase' as const,
    // CSS was 0.6875rem (web). On a 1080 reel an eyebrow reads at ~30px.
    fontSize: 30,
  },
  /** .t-h1 — Geist 500, line-height .96, -0.045em. CSS clamp max 6.5rem. */
  h1: {
    fontWeight: 500,
    lineHeight: 0.96,
    letterSpacing: '-0.045em',
    fontSize: 116, // ~ the big hook size on a 1080 canvas
  },
  /** .t-h2 — Geist 500, line-height 1, -0.03em. */
  h2: {
    fontWeight: 500,
    lineHeight: 1,
    letterSpacing: '-0.03em',
    fontSize: 84,
  },
  /** .t-h3 — Geist 500, line-height 1.1, -0.022em. */
  h3: {
    fontWeight: 500,
    lineHeight: 1.1,
    letterSpacing: '-0.022em',
    fontSize: 52,
  },
  /** .t-body — 0.9375rem web; ~36px reel (FONT_MIN.body). lh 1.6, weight 400. */
  body: {
    fontWeight: 400,
    lineHeight: 1.6,
    fontSize: 38,
  },
  /** .t-stat — Geist 500, line-height .92, -0.05em, tabular. CSS clamp max 5rem. */
  stat: {
    fontWeight: 500,
    lineHeight: 0.92,
    letterSpacing: '-0.05em',
    fontVariantNumeric: 'tabular-nums lining-nums' as const,
    fontFeatureSettings: '"tnum", "lnum"',
    fontSize: 132,
  },
  /** .t-numeric — Geist Mono, tabular, zero-slash. For metadata numbers. */
  numeric: {
    fontVariantNumeric: 'tabular-nums' as const,
    fontFeatureSettings: '"tnum", "zero"',
  },
  /** .t-muted — weight 300. */
  muted: {
    fontWeight: 300,
  },
} as const;

// ────────────────────────────────────────────────────────────────────────────
// SURFACES — the faint card gradients / borders / glows from the CSS
// (.bento-cell, .arch-tier, .price-card, .calc-shell). Portable straight in.
// ────────────────────────────────────────────────────────────────────────────

export const SURFACE = {
  /** .bento-cell / .arch-tier fill */
  cardFill: 'linear-gradient(180deg, rgba(255,255,255,0.022), rgba(255,255,255,0.006))',
  cardBorder: 'rgba(255,255,255,0.07)',
  cardBorderHover: 'rgba(255,255,255,0.16)',
  /** emerald-emphasized tier (.arch-tier-em / .price-card-em) */
  emFill: 'linear-gradient(180deg, rgba(74,234,188,0.075), rgba(74,234,188,0.02))',
  emBorder: 'rgba(74,234,188,0.4)',
  emGlow: '0 30px 80px -20px rgba(74,234,188,0.28)',
  /** subtle inner top-light used on tower floors */
  innerTopLight: '0 1px 0 0 rgba(255,255,255,0.04) inset',
} as const;

// ────────────────────────────────────────────────────────────────────────────
// CANVAS — the dotted backdrop + hero aurora from the CSS, as data so the
// Background engine can render frame-driven equivalents.
// ────────────────────────────────────────────────────────────────────────────

export const CANVAS = {
  /** .canvas-dot — 32px radial dot grid at 0.045 alpha, masked to upper-center */
  dotColor: 'rgba(255,255,255,0.045)',
  dotSize: 32,
  dotMask: 'radial-gradient(ellipse 75% 65% at 50% 30%, black 30%, transparent 80%)',
  /** .hero-aurora — emerald glow upper-right */
  auroraColor: 'rgba(74,234,188,0.12)',
} as const;

// ────────────────────────────────────────────────────────────────────────────
// MOTION — the homepage easing signature, translated for Remotion.
//
// CSS used: cubic-bezier(0.16, 1, 0.3, 1) over 0.85s for .fade-up, with
// stagger delays of 0.06s steps (.delay-1..4). We expose:
//   - SPRING: a spring config whose feel matches that ease-out-expo curve
//     (high stiffness, damping in the pro 30-40 band → settles ~0.85s, no
//     overshoot, fast out / slow in).
//   - STAGGER_STEP_S: the 0.06s inter-element delay.
//   - BEZIER: the raw control points, for interpolate()-based easing where a
//     spring isn't wanted (e.g. count-ups, sweeps).
// ────────────────────────────────────────────────────────────────────────────

export const MOTION = {
  /** Matches cubic-bezier(0.16,1,0.3,1): fast-out, long settle, no overshoot. */
  SPRING: { damping: 30, mass: 1, stiffness: 120 },
  /**
   * Spring presets (from the resemble-ai motion skill, tuned for our brand).
   * NEVER cap these with durationInFrames — let physics settle. Choose by feel:
   *   snappy  — UI elements, cards (quick, minimal overshoot)
   *   smooth  — default entrances (the homepage feel)
   *   elegant — big hero text (slow, weighty settle)
   *   pop     — CTA / emphasis (deliberate overshoot, arrives with weight)
   */
  SPRINGS: {
    snappy:  { damping: 26, stiffness: 200, mass: 0.6 },
    smooth:  { damping: 30, stiffness: 120, mass: 1 },
    elegant: { damping: 22, stiffness: 70,  mass: 1.4 },
    pop:     { damping: 14, stiffness: 260, mass: 0.8 },
  },
  /** Homepage entrance duration reference (.fade-up was 0.85s). */
  ENTRANCE_S: 0.85,
  /**
   * Stagger between elements in FRAMES (research: 5–8 is pro, ~2 is amateur).
   * Use these, not the old 0.06s (≈2f) step.
   */
  STAGGER: { tight: 5, normal: 6, loose: 8 },
  /** Legacy seconds step (kept for back-compat; prefer STAGGER frames). */
  STAGGER_STEP_S: 0.06,
  /** Raw bezier control points from .fade-up. */
  BEZIER: [0.16, 1, 0.3, 1] as [number, number, number, number],
  /** Hook must land fast (engine rule). */
  HOOK_LAND_S: 1.2,
} as const;

// ────────────────────────────────────────────────────────────────────────────
// FONT FAMILY STRINGS — see theme/fonts.ts (the real source of truth).
// Kept here as a re-export for back-compat. fonts.ts loads + registers the font
// and exports FONTS; we alias it as FONT so existing `import { FONT }` works.
// ────────────────────────────────────────────────────────────────────────────

export { FONTS as FONT } from './fonts';

/** ::selection color from the CSS, for any text-selection-styled mock. */
export const SELECTION = 'rgba(59,130,246,0.25)';
