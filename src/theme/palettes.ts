/**
 * theme/palettes.ts
 *
 * BRAND-ONLY. There is no multi-hue rotation (that was wrong and is removed).
 * Every reel uses the VoiceAI Connect emerald. The ONLY per-reel variation is
 * background dark vs light — same emerald brand on either.
 *
 *   dark  → emerald on ink  #050505   (default)
 *   light → emerald on soft #f7f7f5   (the one opt-in variation)
 *
 * Colors match the homepage marketing emerald (tokens.BRAND):
 *   primary #4aeabc (em-400, bright) · secondary #10b981 (em-500) · accent #6ee7b7
 */

import { BrandingOverrides } from './buildTheme';

export interface Palette extends Required<BrandingOverrides> {
  id: string;
  name: string;
  mode: 'dark' | 'light';
}

/** The brand emerald — identical color on both backgrounds. */
const EMERALD = { primary: '#4aeabc', secondary: '#10b981', accent: '#6ee7b7' };

export const PALETTES: Palette[] = [
  { id: 'emerald',       name: 'VoiceAI Emerald (Dark)',  ...EMERALD, mode: 'dark' },
  { id: 'emerald-light', name: 'VoiceAI Emerald (Light)', ...EMERALD, mode: 'light' },
];

export function paletteById(id: string): Palette {
  return PALETTES.find((p) => p.id === id) || PALETTES[0];
}

/**
 * The brand palette is fixed; only mode varies. Returns the emerald palette for
 * the requested mode. (Kept seed-compatible: callers pass the mode they want.)
 */
export function brandPalette(mode: 'dark' | 'light' = 'dark'): Palette {
  return mode === 'light' ? PALETTES[1] : PALETTES[0];
}
