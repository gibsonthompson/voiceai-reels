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

export const PLAN_LABELS = {
  free: 'Free',
  pro: 'Pro',
  scale: 'Scale',
} as const;

/** Marketing pricing (from the live homepage). */
export const PLAN_PRICING = {
  free: { monthly: 0, perClient: 29.99, label: 'Free' },
  pro: { monthly: 99, perClient: 9.99, label: 'Pro' },
  scale: { monthly: 499, perClient: 0, label: 'Scale' },
} as const;

/** A row shape for DashboardShowcase — variant field decides how it renders. */
export interface DashboardRow {
  /** For 'calls': caller name. For 'leads': lead / business name. */
  primary: string;
  /** For 'calls': short summary. For 'leads': industry / label. */
  secondary?: string;
  /** For 'calls': duration string "1:24". For 'leads': location / phone. */
  meta?: string;
  /** For 'calls': 'booked' | 'lead' | 'info'. For 'leads': 'new' | 'contacted'. */
  status?: 'booked' | 'lead' | 'info' | 'new' | 'contacted';
  /** Frame offset when this row lands (relative to template's rowsInFrame). */
  atFrame?: number;
}

export type TemplateId =
  | 'CounterHero'        // hook + 2-5 stat cards (reseller money/proof)
  | 'QuestionHook'       // kinetic question -> answer (the #1 hook type)
  | 'StatPunch'          // ONE enormous number fills the frame (scroll-stopper)
  | 'SplitContrast'      // old-way vs new-way / them vs you
  | 'BeforeAfter'        // missed-call -> captured
  | 'DashboardShowcase'  // animated real dashboard surface
  | 'StatementStack'     // 3 punchy claims land one-by-one
  | 'LogoAssembly'       // infra/vendor logos assemble (blocked on logos)
  | 'ProductDemo'        // CONCEPT A — recreated dashboard surface in device frame
  | 'KineticStatement'   // CONCEPT B — pure kinetic typography, no UI
  | 'CallFlow'           // CONCEPT A redesigned — call → summary → SMS
  | 'BeforeAfter'        // CONCEPT A variant — MISSED vs ANSWERED, hard cut
  | 'StatementStack'     // CONCEPT B variant — 3 progressive claims
  | 'DashboardShowcase'; // CONCEPT A variant — animated calls/leads list panel

/** A single on-screen "beat" — a line that animates in. */
export interface Beat {
  text: string;
  emphasis?: boolean;      // highlight in primary color
  prefix?: string;         // e.g. "$" rendered smaller
  suffix?: string;         // e.g. "/mo"
  countTo?: number;        // if set, number counts up to this
}

/**
 * Lucide icon names usable in specs (string → resolved in templates via a map,
 * so specs stay pure data and can be generated). Extend components/iconMap.ts.
 */
export type IconName =
  | 'DollarSign' | 'Users' | 'TrendingUp' | 'Phone' | 'PhoneCall'
  | 'Building' | 'Gift' | 'Banknote' | 'Sparkles' | 'Zap'
  | 'Calendar' | 'CheckCircle2' | 'ArrowUpRight' | 'Bot' | 'Clock';

/** One stat card. `icon` optional (StatPunch uses no icon; CounterHero does). */
export interface StatCardData {
  icon?: IconName;
  label: string;
  value: number;          // counts up
  prefix?: string;        // "$"
  suffix?: string;        // "/mo"
  decimals?: number;
  highlight?: boolean;    // emerald-emphasized (the payoff card)
}

/** Optional mini bar chart (mirrors homepage .minichart / analytics). */
export interface MiniChartData {
  bars: number[];         // relative heights 0..1
  label?: string;
}

/**
 * Per-template options. All optional; each template reads only what it needs.
 * This is how one template flexes across many reels without new template files.
 */
export interface ReelOptions {
  // CounterHero / money
  stats?: StatCardData[];        // 2–5 cards; overrides beat-derived defaults
  chart?: MiniChartData;         // optional mini bar chart
  payoff?: Beat;                 // the "you keep…" closing emphasis line
  // SplitContrast / BeforeAfter
  left?: { title: string; lines: string[] };
  right?: { title: string; lines: string[] };
  // ThreeBeatList
  points?: { icon?: IconName; title: string; body?: string }[];
  // generic
  showProgress?: boolean;        // show a thin progress/scrub line
  // ProductDemo (Concept A — recreated dashboard surface on a timeline)
  callScript?: CallScript;       // for ProductDemo / CallModal — scripted call
  ctaSubline?: string;           // small line below CTA pill
  // KineticStatement (Concept B — pure typography)
  emphasisWords?: string[];      // lowercase words to render in emerald
  // CallFlow (Concept A redesigned)
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
  // BeforeAfter (new — comparison composition)
  beforeAfter?: {
    businessName?: string;
    callerName?: string;
    callerPhone?: string;
    aftermath?: string;
    beforeWord?: string;
    afterWord?: string;
    missedAt?: string;
  };
  // StatementStack (new — 3 progressive claims)
  statements?: {
    text: string;
    /** Lowercase words to render in emerald. */
    emphasis?: string[];
  }[];
  // DashboardShowcase (new — animated calls/leads list panel)
  dashboardShowcase?: {
    variant?: 'calls' | 'leads';
    /** Small mono eyebrow above the panel — the "surface" label. */
    surfaceLabel?: string;
    /** Business/brand shown in the panel header — the white-label agency's client. */
    brandName?: string;
    /** Rows that populate. Field shape is variant-driven; see the template. */
    rows?: DashboardRow[];
    /** Big hook line above the panel (Anton, single line). */
    headline?: string;
  };
  /** Sound-off captions for reels that want narration (CallFlow, etc.). */
  captions?: {
    text: string;
    inFrame: number;
    outFrame: number;
    emphasis?: string[];
  }[];
}

export interface ReelSpec {
  id: string;                      // unique, e.g. "reel-001"
  seed: number;                    // drives all deterministic variation
  template: TemplateId;
  paletteId?: string;              // explicit palette, else derived from seed
  background?: BackgroundVariant;  // explicit bg, else derived from seed
  mode?: 'dark' | 'light';         // override palette's default mode

  hook: string;                    // frame-1 hook line (must land < 1.5s)
  beats: Beat[];                   // body beats
  cta: string;                     // closing call-to-action
  kicker?: string;                 // small eyebrow text above hook

  options?: ReelOptions;           // per-template flex (cards, chart, points…)

  durationInFrames?: number;       // default 20s * fps handled by Root
  notes?: string;                  // author note, not rendered
}

export const DEFAULTS = {
  fps: 30,
  width: 1080,
  height: 1920,
  durationSeconds: 20, // cold TOF sweet spot 15-30s
};

/** 9:16 safe zones (px) from the Remotion content-engine rules. */
export const SAFE = {
  top: 150,
  bottom: 170,
  sides: 60,
};

/** Minimum font sizes (px) from the rules. */
export const FONT_MIN = {
  headline: 56,
  body: 36,
};
