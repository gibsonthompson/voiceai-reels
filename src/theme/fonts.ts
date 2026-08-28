/**
 * theme/fonts.ts — Vercel-published Geist + Geist Mono as PER-WEIGHT statics.
 *
 * History of bugs we've fixed in this file:
 *   1. @remotion/google-fonts → silently fell back at some weights.
 *   2. Self-hosted variable .woff2 from Google Fonts → 29KB sliced subset; the
 *      variable wght axis didn't engage from CSS font-weight, so every weight
 *      rendered at the same default. Proven by side-by-side render: all
 *      font-weight values 100-900 looked identical.
 *
 * This version: use the official Vercel `geist` npm package's per-weight static
 * .woff2 files. Each weight is registered as its own @font-face. font-weight: N
 * picks the exact file — no variable interpolation, no axis mystery.
 *
 * Available weights: Geist 300/400/500/600/700, Geist Mono 400/500.
 * Asking for an unregistered weight (e.g. 460) rounds to the nearest declared
 * face — so prefer the registered values directly.
 */

import { staticFile, delayRender, continueRender } from 'remotion';

const GEIST_WEIGHTS = [300, 400, 500, 600, 700];
const MONO_WEIGHTS = [400, 500];

const LATIN_RANGE =
  'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
const LATIN_EXT_RANGE =
  'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF';

const faceRule = (family: string, fileFamily: string, weight: number) => `
@font-face {
  font-family: '${family}';
  src: url('${staticFile(`/fonts/${fileFamily}-${weight}.woff2`)}') format('woff2');
  font-weight: ${weight};
  font-style: normal;
  font-display: block;
}`;

// Anton — the DISPLAY face. Ultra-condensed grotesque, weight 400 only.
const ANTON_CSS = `
@font-face {
  font-family: 'Anton';
  src: url('${staticFile('/fonts/Anton-400.woff2')}') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: block;
  unicode-range: ${LATIN_RANGE};
}
@font-face {
  font-family: 'Anton';
  src: url('${staticFile('/fonts/Anton-400-ext.woff2')}') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: block;
  unicode-range: ${LATIN_EXT_RANGE};
}`;

const FONT_CSS = [
  ANTON_CSS,
  ...GEIST_WEIGHTS.map((w) => faceRule('Geist', 'Geist', w)),
  ...MONO_WEIGHTS.map((w) => faceRule('Geist Mono', 'GeistMono', w)),
].join('\n');

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.setAttribute('data-fonts', 'geist');
  style.textContent = FONT_CSS;
  document.head.appendChild(style);
}

const handle = delayRender('Loading Geist static weights', {
  timeoutInMilliseconds: 120000,
});

const loadAll = (): Promise<unknown> => {
  if (typeof document === 'undefined') return Promise.resolve();
  return Promise.all([
    document.fonts.load('400 100px Anton'),
    ...GEIST_WEIGHTS.map((w) => document.fonts.load(`${w} 100px Geist`)),
    ...MONO_WEIGHTS.map((w) => document.fonts.load(`${w} 100px "Geist Mono"`)),
  ]);
};

loadAll()
  .then(() => continueRender(handle))
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[fonts] load failed:', err);
    continueRender(handle);
  });

export const FONTS = {
  /** DISPLAY face — Anton. Ultra-condensed grotesque for hooks + numbers. */
  display: `Anton, 'Arial Narrow', sans-serif-condensed, system-ui, sans-serif`,
  /** BODY — Geist (sans). Support role only, never as the hero. */
  body: `Geist, system-ui, -apple-system, sans-serif`,
  /** Labels / eyebrows / metadata. */
  mono: `"Geist Mono", ui-monospace, 'SF Mono', Menlo, monospace`,
};

export const fontsReady = loadAll();
