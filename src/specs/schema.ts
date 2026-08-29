/**
 * specs/schema.ts
 *
 * The reel-spec contract. A "batch" is just an array of ReelSpec objects.
 * Authoring 90 reels = writing 90 of these (or generating them). The renderer
 * reads a spec and composes the right template + palette + background + motion.
 *
 * IMPORTANT — on-screen plan labels: the dashboards use starter/pro/growth
 * internally, but reels MUST show the marketing names the prospect knows:
 *   Free / Pro / Scale.
 * Use PLAN_LABELS below; never surface starter/pro/growth in a reel.
 */

import { BackgroundVariant } from '../engine/Background';
import type { CallScript } from '../components/dashboard/CallModal';
import type { BeatInput } from '../engine/beatTimeline';

export const PLAN_LABELS = {
  free: 'Free',
  pro: 'Pro',
  scale: 'Scale',
} as const;

/** Marketing pricing (UNCONFIRMED — verify before rendering into a reel). */
export const PLAN_PRICING = {
  free: { monthly: 0, perClient: 29.99, label: 'Free' },
  pro: { monthly: 99, perClient: 9.99, label: 'Pro' },
  scale: { monthly: 499, perClient: 0, label: 'Scale' },
} as const;

/** A row shape for DashboardShowcase — variant field decides how it renders. */
export interface DashboardRow {
  primary: string;
  secondary?: string;
  meta?: string;
  status?: 'booked' | 'lead' | 'info' | 'new' | 'contacted';
  atFrame?: number;
}

export type TemplateId =
  | 'CounterHero'        // hook + 2-5 stat cards (reseller money/proof)
  | 'QuestionHook'       // kinetic question -> answer
  | 'StatPunch'          // ONE enormous number fills the frame
  | 'SplitContrast'      // old-way vs new-way / them vs you
  | 'BeforeAfter'        // missed-call -> captured
  | 'DashboardShowcase'  // animated real dashboard surface
  | 'StatementStack'     // 3 punchy claims land one-by-one
  | 'LogoAssembly'       // infra/vendor logos assemble (blocked on logos)
  | 'ProductDemo'        // CONCEPT A — recreated dashboard surface in device frame
  | 'KineticStatement'   // CONCEPT B — pure kinetic typography, no UI
  | 'CallFlow';          // CONCEPT A — call → summary → SMS (beat-driven)

/** A single on-screen "beat" — a line that animates in. */
export interface Beat {
  text: string;
  emphasis?: boolean;
  prefix?: string;
  suffix?: string;
  countTo?: number;
}

export type IconName =
  | 'DollarSign' | 'Users' | 'TrendingUp' | 'Phone' | 'PhoneCall'
  | 'Building' | 'Gift' | 'Banknote' | 'Sparkles' | 'Zap'
  | 'Calendar' | 'CheckCircle2' | 'ArrowUpRight' | 'Bot' | 'Clock';

export interface StatCardData {
  icon?: IconName;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  highlight?: boolean;
}

export interface MiniChartData {
  bars: number[];
  label?: string;
}

/**
 * Per-template options. All optional; each template reads only what it needs.
 */
export interface ReelOptions {
  // CounterHero / money
  stats?: StatCardData[];
  chart?: MiniChartData;
  payoff?: Beat;
  // SplitContrast / BeforeAfter
  left?: { title: string; lines: string[] };
  right?: { title: string; lines: string[] };
  // ThreeBeatList
  points?: { icon?: IconName; title: string; body?: string }[];
  // generic
  showProgress?: boolean;
  // ProductDemo
  callScript?: CallScript;
  ctaSubline?: string;
  // KineticStatement
  emphasisWords?: string[];
  // CallFlow (product data shown on screen)
  callFlow?: {
    businessName?: string;
    callerName?: string;
    callerPhone?: string;
    callerAddress?: string;
    priority?: 'High' | 'Medium' | 'Normal';
    summary?: string;
    smsApp?: string;
    smsBody?: string;
  };
  // BeforeAfter
  beforeAfter?: {
    businessName?: string;
    callerName?: string;
    callerPhone?: string;
    aftermath?: string;
    beforeWord?: string;
    afterWord?: string;
    missedAt?: string;
  };
  // StatementStack
  statements?: { text: string; emphasis?: string[] }[];
  // DashboardShowcase
  dashboardShowcase?: {
    variant?: 'calls' | 'leads';
    surfaceLabel?: string;
    brandName?: string;
    rows?: DashboardRow[];
    headline?: string;
  };
  // Legacy hand-authored captions (still supported; beat-driven preferred)
  captions?: { text: string; inFrame: number; outFrame: number; emphasis?: string[] }[];

  // ── VOICEOVER + BEAT-DRIVEN TIMING ───────────────────────────────────────
  /** The aligned beats (visual + vo + caption per beat). Drives timing. */
  beats?: BeatInput[];
  /** The full spoken script (for reference / regeneration). Presence → play mp3. */
  voiceover?: string;
  /** Which angle this reel makes (maps to a voice; see scripts/voices.mjs). */
  voiceAngle?: string;
  /** Real per-beat VO durations in frames, written by generate-voiceovers.mjs. */
  voBeatFrames?: number[];
}

export interface ReelSpec {
  id: string;
  seed: number;
  template: TemplateId;
  paletteId?: string;
  background?: BackgroundVariant;
  mode?: 'dark' | 'light';

  hook: string;
  beats: Beat[];
  cta: string;
  kicker?: string;

  options?: ReelOptions;

  durationInFrames?: number;
  notes?: string;
}

export const DEFAULTS = {
  fps: 30,
  width: 1080,
  height: 1920,
  durationSeconds: 20,
};

export const SAFE = {
  top: 150,
  bottom: 170,
  sides: 60,
};

export const FONT_MIN = {
  headline: 56,
  body: 36,
};