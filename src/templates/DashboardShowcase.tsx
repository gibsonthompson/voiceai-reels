/**
 * templates/DashboardShowcase.tsx — CONCEPT A variant (CLAUDE.md §6.3)
 *
 * Shows the AGENCY OWNER'S dashboard populating in real time. Not a phone —
 * the browser-side view. Rows arrive one-by-one, the "N this week" count
 * counts up as they land, a bold Anton hook sits above and a CTA below.
 *
 * Different visual grammar from CallFlow / BeforeAfter / ProductDemo:
 *   - Wide horizontal card (not a phone)
 *   - Rows on a timeline (not a call story)
 *   - Header count materializes as data arrives (payoff = the pile is real)
 *
 * Timeline (30s @ 30fps):
 *   0..40    hook Anton lands
 *   40..90   panel slides in (empty card)
 *   90..690  rows arrive on their atFrame offsets
 *   700..790 hold with all rows visible
 *   790..900 CTA pill
 */

import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from 'remotion';
import { ArrowRight } from 'lucide-react';
import { Theme } from '../theme/buildTheme';
import { ReelSpec, DashboardRow } from '../specs/schema';
import { Background, BackgroundVariant } from '../engine/Background';
import { FONTS } from '../theme/fonts';
import { springProgress, drift } from '../engine/motion';
import { DashboardListPanel } from '../components/dashboard/DashboardListPanel';

interface Props {
  spec: ReelSpec;
  theme: Theme;
  background: BackgroundVariant;
}

const DEFAULT_ROWS: DashboardRow[] = [
  { primary: 'John Carter',    secondary: 'Water heater · booked tomorrow 9 AM',   meta: '2:14', status: 'booked', atFrame: 20  },
  { primary: 'Sarah Mitchell', secondary: 'No-heat call · dispatched today',        meta: '1:48', status: 'booked', atFrame: 120 },
  { primary: 'David Park',     secondary: 'Roadside · tow ETA 35 min',              meta: '2:32', status: 'lead',   atFrame: 220 },
  { primary: 'Lisa Hernandez', secondary: 'Estimate · Friday 1 PM',                 meta: '1:12', status: 'booked', atFrame: 340 },
  { primary: 'Marcus Brown',   secondary: 'Same-day urgent · 3:15 PM',              meta: '2:04', status: 'booked', atFrame: 460 },
  { primary: 'Rachel Davis',   secondary: 'Recurring cleaning quote · Sat 10 AM',   meta: '0:58', status: 'lead',   atFrame: 580 },
];

const BEATS = {
  hookIn: 0,
  panelIn: 40,
  rowsBase: 90,
  ctaIn: 800,
};

export const DashboardShowcase: React.FC<Props> = ({ spec, theme, background }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cfg = spec.options?.dashboardShowcase ?? {};
  const variant = cfg.variant ?? 'calls';
  const rows = cfg.rows ?? DEFAULT_ROWS;
  const headline = cfg.headline ?? 'YOUR CLIENT. YOUR DASHBOARD.';
  const brandName = cfg.brandName;
  const surfaceLabel = cfg.surfaceLabel;

  // ─── HOOK ──────────────────────────────────────────────────────────────
  const hookP = springProgress(frame, fps, BEATS.hookIn, 'pop');
  const hookOpacity = interpolate(hookP, [0, 0.6], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const hookTy = interpolate(hookP, [0, 1], [50, 0]);
  const hookScale = interpolate(hookP, [0, 1], [0.82, 1]);
  const hookDrift = drift(frame - (BEATS.hookIn + 30), 'y', 3, 130);
  const hookExitOpacity = interpolate(
    frame,
    [BEATS.ctaIn - 20, BEATS.ctaIn + 10],
    [1, 0.55],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // Auto-fit hook to the frame — split by sentence for line-safe wrap.
  const hookLines = headline.split(/\s*\.\s*/).filter(Boolean);
  const longestLine = hookLines.reduce((m, l) => Math.max(m, l.length), 1);
  const hookSize = Math.min(180, Math.floor(960 / (longestLine * 0.44)));

  // ─── CTA ───────────────────────────────────────────────────────────────
  const ctaP = springProgress(frame, fps, BEATS.ctaIn, 'pop');
  const ctaOpacity = interpolate(ctaP, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const ctaTy = interpolate(ctaP, [0, 1], [30, 0]);
  const ctaScale = interpolate(ctaP, [0, 1], [0.9, 1]);
  const ctaSubP = springProgress(frame, fps, BEATS.ctaIn + 14, 'smooth');
  const ctaSubOpacity = interpolate(ctaSubP, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Panel dim slightly when CTA lands so the CTA reads as focus
  const panelDim = interpolate(
    frame,
    [BEATS.ctaIn + 10, BEATS.ctaIn + 40],
    [1, 0.55],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <AbsoluteFill style={{ background: theme.bg, color: theme.text, fontFamily: FONTS.body }}>
      <Background variant={background} theme={theme} seed={spec.seed} />

      {/* HOOK — Anton lines at the top */}
      <div
        style={{
          position: 'absolute',
          left: 60,
          right: 60,
          top: 200,
          opacity: hookOpacity * hookExitOpacity,
          transform: `translateY(${hookTy}px) scale(${hookScale}) ${hookDrift.transform ?? ''}`,
          transformOrigin: 'center top',
        }}
      >
        {hookLines.map((line, i) => (
          <div
            key={i}
            style={{
              fontFamily: FONTS.display,
              fontSize: hookSize,
              lineHeight: 0.92,
              letterSpacing: '-0.045em',
              color: i === hookLines.length - 1 ? theme.primary : theme.text,
              textTransform: 'uppercase',
              textAlign: 'center',
            }}
          >
            {line}.
          </div>
        ))}
      </div>

      {/* PANEL — centered horizontally, below hook */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 560,
          transform: 'translateX(-50%)',
          opacity: panelDim,
        }}
      >
        <DashboardListPanel
          theme={theme}
          variant={variant}
          surfaceLabel={surfaceLabel}
          brandName={brandName}
          rows={rows}
          rowsBaseFrame={BEATS.rowsBase}
          enterFrame={BEATS.panelIn}
          width={960}
        />
      </div>

      {/* CTA */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 220,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <div
          style={{
            opacity: ctaOpacity,
            transform: `translateY(${ctaTy}px) scale(${ctaScale})`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 18,
            padding: '26px 48px',
            borderRadius: 999,
            background: theme.primary,
            color: theme.primaryText,
            boxShadow: '0 30px 80px -20px rgba(74,234,188,0.45)',
          }}
        >
          <span
            style={{
              fontFamily: FONTS.display,
              fontSize: 72,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              textTransform: 'uppercase',
            }}
          >
            {spec.cta}
          </span>
          <ArrowRight size={48} strokeWidth={2.5} />
        </div>
        {spec.options?.ctaSubline && (
          <div
            style={{
              opacity: ctaSubOpacity,
              fontFamily: FONTS.body,
              fontSize: 34,
              color: theme.textMuted,
              textAlign: 'center',
              maxWidth: 900,
              lineHeight: 1.3,
            }}
          >
            {spec.options.ctaSubline}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
