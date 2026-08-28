/**
 * theme/buildTheme.ts
 *
 * Ported from the real VoiceAI Connect dashboard `useTheme()` / `buildTheme()`.
 * Produces the exact same token object the dashboards consume, so any surface
 * ported from /source-dashboards renders identically inside Remotion.
 *
 * The dashboards style everything two ways:
 *   1. Tailwind utility classes for layout (flex, grid, rounded-xl, p-4, etc.)
 *   2. inline style={{}} for every COLOR, driven by these tokens.
 * In Remotion we keep the inline-style color approach verbatim and replace
 * Tailwind utility classes with inline fl/grid styles in ported surfaces.
 */

export type ThemeMode = 'dark' | 'light';

export interface Theme {
  isDark: boolean;
  // base
  bg: string;
  text: string;
  textMuted: string;
  textMuted4: string;
  border: string;
  borderSubtle: string;
  card: string;
  hover: string;
  active: string;
  input: string;
  inputBorder: string;
  // brand primary + alpha ramps
  primary: string;
  primary10: string;
  primary15: string;
  primary20: string;
  primary30: string;
  primary80: string;
  primaryText: string;
  // secondary + accent (full brand palette)
  secondary: string;
  accent: string;
  // semantic: info
  info: string;
  infoBg: string;
  infoBorder: string;
  infoText: string;
  // semantic: warning
  warning: string;
  warningBg: string;
  warningBorder: string;
  warningText: string;
  // semantic: error
  error: string;
  errorBg: string;
  errorBorder: string;
  errorText: string;
  // semantic: success
  success: string;
  successBg: string;
  // sidebar (white-label branded)
  sidebarBg: string;
  sidebarText: string;
  sidebarBorder: string;
  sidebarActiveItemBg: string;
  sidebarActiveItemColor: string;
}

export function isValidHex(hex: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const c = hex.replace('#', '');
  const full = c.length === 3 ? c.split('').map((x) => x + x).join('') : c;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function isLightColor(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}

export function darken(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const amt = Math.round(2.55 * percent);
  const c = (v: number) => Math.max(0, v - amt);
  return `#${((1 << 24) + (c(r) << 16) + (c(g) << 8) + c(b)).toString(16).slice(1)}`;
}

export function lighten(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const amt = Math.round(2.55 * percent);
  const c = (v: number) => Math.min(255, v + amt);
  return `#${((1 << 24) + (c(r) << 16) + (c(g) << 8) + c(b)).toString(16).slice(1)}`;
}

export interface BrandingOverrides {
  primary?: string;
  secondary?: string;
  accent?: string;
}

/**
 * The confirmed VoiceAI Connect brand palette, corrected to the homepage CSS.
 * In MOTION/marketing contexts the bright emerald #4aeabc (--em-400) is the
 * primary accent; #10b981 (--em-500) is the deeper variant used as secondary;
 * #047857 (--em-700) anchors gradients. (The dashboards used #10b981 as their
 * primary; reels intentionally use the brighter homepage marketing emerald.)
 */
export const DEFAULT_BRAND: Required<BrandingOverrides> = {
  primary: '#4aeabc',
  secondary: '#10b981',
  accent: '#6ee7b7',
};

export function buildTheme(
  mode: ThemeMode = 'dark',
  brand: BrandingOverrides = {},
): Theme {
  const isDark = mode === 'dark';
  const primary = isValidHex(brand.primary || '') ? brand.primary! : DEFAULT_BRAND.primary;
  const secondary = isValidHex(brand.secondary || '') ? brand.secondary! : DEFAULT_BRAND.secondary;
  const accent = isValidHex(brand.accent || '') ? brand.accent! : DEFAULT_BRAND.accent;
  const primaryText = isLightColor(primary) ? '#0a0a0a' : '#ffffff';

  if (isDark) {
    return {
      isDark: true,
      bg: '#050505',
      text: '#fafaf9',
      textMuted: 'rgba(250, 250, 249, 0.6)',
      textMuted4: 'rgba(250, 250, 249, 0.45)',
      border: 'rgba(255, 255, 255, 0.07)',
      borderSubtle: 'rgba(255, 255, 255, 0.06)',
      card: '#0f0f0f',
      hover: 'rgba(255, 255, 255, 0.05)',
      active: 'rgba(255, 255, 255, 0.08)',
      input: 'rgba(255, 255, 255, 0.04)',
      inputBorder: 'rgba(255, 255, 255, 0.08)',
      primary,
      primary10: hexToRgba(primary, 0.1),
      primary15: hexToRgba(primary, 0.15),
      primary20: hexToRgba(primary, 0.2),
      primary30: hexToRgba(primary, 0.3),
      primary80: hexToRgba(primary, 0.8),
      primaryText,
      secondary,
      accent,
      info: '#60a5fa',
      infoBg: 'rgba(96, 165, 250, 0.1)',
      infoBorder: 'rgba(96, 165, 250, 0.2)',
      infoText: '#93c5fd',
      warning: '#f59e0b',
      warningBg: 'rgba(245, 158, 11, 0.1)',
      warningBorder: 'rgba(245, 158, 11, 0.2)',
      warningText: '#fbbf24',
      error: '#ef4444',
      errorBg: 'rgba(239, 68, 68, 0.1)',
      errorBorder: 'rgba(239, 68, 68, 0.2)',
      errorText: '#f87171',
      success: primary,
      successBg: hexToRgba(primary, 0.1),
      sidebarBg: darken(primary, 65),
      sidebarText: '#f5f5f0',
      sidebarBorder: hexToRgba(primary, 0.2),
      sidebarActiveItemBg: hexToRgba(primary, 0.3),
      sidebarActiveItemColor: '#f5f5f0',
    };
  }

  return {
    isDark: false,
    bg: '#f7f7f5',
    text: '#0a0a0a',
    textMuted: 'rgba(0, 0, 0, 0.62)',
    textMuted4: 'rgba(0, 0, 0, 0.42)',
    border: 'rgba(0, 0, 0, 0.10)',
    borderSubtle: 'rgba(0, 0, 0, 0.06)',
    card: '#ffffff',
    hover: 'rgba(0, 0, 0, 0.04)',
    active: 'rgba(0, 0, 0, 0.08)',
    input: '#ffffff',
    inputBorder: 'rgba(0, 0, 0, 0.12)',
    primary,
    primary10: hexToRgba(primary, 0.1),
    primary15: hexToRgba(primary, 0.15),
    primary20: hexToRgba(primary, 0.2),
    primary30: hexToRgba(primary, 0.3),
    primary80: hexToRgba(primary, 0.8),
    primaryText,
    secondary,
    accent,
    info: '#3b82f6',
    infoBg: 'rgba(59, 130, 246, 0.1)',
    infoBorder: 'rgba(59, 130, 246, 0.2)',
    infoText: '#2563eb',
    warning: '#d97706',
    warningBg: 'rgba(217, 119, 6, 0.1)',
    warningBorder: 'rgba(217, 119, 6, 0.2)',
    warningText: '#b45309',
    error: '#dc2626',
    errorBg: '#fef2f2',
    errorBorder: '#fecaca',
    errorText: '#dc2626',
    success: primary,
    successBg: hexToRgba(primary, 0.1),
    sidebarBg: darken(primary, 65),
    sidebarText: '#f5f5f0',
    sidebarBorder: hexToRgba(primary, 0.2),
    sidebarActiveItemBg: hexToRgba(primary, 0.3),
    sidebarActiveItemColor: '#f5f5f0',
  };
}
