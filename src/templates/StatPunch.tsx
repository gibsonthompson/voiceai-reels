/**
 * templates/StatPunch.tsx — billboard scroll-stopper. ONE number dominates.
 *
 * Anti-slop checklist:
 *  - Anton display face only for the hero — no neutral sans for the focal point.
 *  - Hard scale contrast: the number is ~380px, the editorial caption is 56px,
 *    the labels are 22px. ~17× ratio between hero and label. No mid-sized mush.
 *  - Asymmetric: hero number left-anchored and intentionally bleeds the right
 *    safe edge — designed move per §4.2 ("type that runs off an edge on purpose").
 *  - One focal element (the EMERALD number). Everything else subordinate.
 *  - Brand emerald HARD against ink; light mode swaps to deeper emerald for
 *    legibility.
 *
 * Spec contract:
 *   spec.kicker             → small mono eyebrow
 *   spec.options.stats[0]   → the giant number (value, prefix)
 *   stats[0].label          → small mono breakdown row under the number
 *   spec.hook               → editorial Geist 300 caption under breakdown
 *   spec.cta                → pill text
 */

import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  interpolate,
} from 'remotion';
import { Theme, hexToRgba } from '../theme/buildTheme';
import { ReelSpec } from '../specs/schema';
import { Background, BackgroundVariant } from '../engine/Background';
import { SafeFrame } from '../components/SafeFrame';
import { FONTS } from '../theme/fonts';
import {
  springProgress,
  slideUp,
  popIn,
  countUp,
  drift,
  withLife,
  breathe,
  cubicBezier,
} from '../engine/motion';

interface Props {
  spec: ReelSpec;
  theme: Theme;
  background: BackgroundVariant;
}

function splitBeats(text: string): string[] {
  const trimmed = text.trim();
  const parts = trimmed.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : [trimmed];
}

const Hairline: React.FC<{
  frame: number; fps: number; delay: number; color: string; height?: number; widthPct?: number; durationSec?: number;
}> = ({ frame, fps, delay, color, height = 1, widthPct = 100, durationSec = 0.55 }) => {
  const d = Math.round(fps * durationSec);
  const t = Math.max(0, Math.min(1, (frame - delay) / d));
  const eased = cubicBezier(t);
  return <div style={{ height, width: `${eased * widthPct}%`, backgroundColor: color, borderRadius: height }} />;
};

export const StatPunch: React.FC<Props> = ({ spec, theme, background }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stat = spec.options?.stats?.[0] ?? { value: 6850, prefix: '$', label: '50 clients × $137 net' };
  const breakdown = stat.label;

  const f = (s: number) => Math.round(fps * s);
  const tTopRule = f(0.10);
  const tEyebrow = f(0.28);
  const tNumber = f(0.55);
  const tNumUnderline = tNumber + f(0.85);
  const tBreakdown = tNumber + f(1.10);
  const tCaption = tBreakdown + f(0.55);
  const tBottomLine = tCaption + f(1.40);
  const tCta = tBottomLine + f(0.30);

  // The number — count + pop scale
  const numP = springProgress(frame, fps, tNumber, 'pop');
  const numScale = interpolate(numP, [0, 1], [0.94, 1]);
  const numOpacity = interpolate(numP, [0, 0.45], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const current = countUp(frame, fps, stat.value, tNumber, 1.4);
  const display = Math.round(current).toLocaleString('en-US');
  const numLife = drift(frame, 'y', 3, 140).transform as string;

  const dim = hexToRgba(theme.text, 0.5);
  const muted = hexToRgba(theme.text, 0.32);
  // Light mode needs the deeper emerald for hero text legibility.
  const heroEmerald = theme.isDark ? theme.primary : theme.secondary;

  return (
    <AbsoluteFill>
      <Background variant={background} theme={theme} seed={spec.seed} />

      <SafeFrame style={{ justifyContent: 'flex-start', overflow: 'hidden' }}>

        {/* TOP RULE */}
        <Hairline frame={frame} fps={fps} delay={tTopRule} color={heroEmerald} height={2} widthPct={28} durationSec={0.55} />

        {/* MONO EYEBROW */}
        <div style={{
          ...slideUp(frame, fps, tEyebrow, 12, 'snappy'),
          marginTop: 22,
          marginBottom: 180,
          fontFamily: FONTS.mono,
          fontSize: 24,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          fontWeight: 500,
          color: heroEmerald,
          maxWidth: 880,
          lineHeight: 1.35,
        }}>
          {spec.kicker ?? 'monthly take-home'}
        </div>

        {/* THE NUMBER — Anton, fills frame width, EMERALD */}
        <div style={{
          transform: `scale(${numScale}) ${numLife}`,
          transformOrigin: 'left center',
          opacity: numOpacity,
          marginLeft: -20, // intentional bleed
        }}>
          <div style={{
            fontFamily: FONTS.display,
            fontWeight: 400,
            letterSpacing: '-0.04em',
            lineHeight: 0.94,
            fontVariantNumeric: 'tabular-nums',
            fontSize: 380,
            color: heroEmerald,
            display: 'inline-flex',
            alignItems: 'baseline',
            whiteSpace: 'nowrap',
          }}>
            {stat.prefix ? (
              <span style={{ fontSize: 240, marginRight: 6 }}>{stat.prefix}</span>
            ) : null}
            <span>{display}</span>
          </div>

          {/* heavy emerald rule under the number */}
          <div style={{ marginTop: 22 }}>
            <Hairline frame={frame} fps={fps} delay={tNumUnderline} color={heroEmerald} height={6} widthPct={62} durationSec={0.5} />
          </div>
        </div>

        {/* BREAKDOWN — small mono row */}
        {breakdown ? (
          <Sequence from={tBreakdown} layout="none">
            <div style={{
              ...slideUp(frame - tBreakdown, fps, 0, 16, 'snappy'),
              marginTop: 28,
              fontFamily: FONTS.mono,
              fontSize: 26,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontWeight: 500,
              color: dim,
            }}>
              {breakdown}
            </div>
          </Sequence>
        ) : null}

        {/* CAPTION — Geist 300 editorial sentence */}
        <Sequence from={tCaption} layout="none">
          <div style={{
            ...slideUp(frame - tCaption, fps, 0, 26, 'smooth'),
            marginTop: 56,
            fontFamily: FONTS.body,
            fontWeight: 300,
            letterSpacing: '-0.025em',
            lineHeight: 1.08,
            fontSize: 56,
            color: hexToRgba(theme.text, 0.92),
            maxWidth: 880,
            textWrap: 'balance' as React.CSSProperties['textWrap'],
          }}>
            {splitBeats(spec.hook).map((line, i) => (
              <div key={i} style={{ display: 'block' }}>{line}</div>
            ))}
          </div>
        </Sequence>

        {/* BOTTOM */}
        <div style={{ marginTop: 'auto' }}>
          <Hairline frame={frame} fps={fps} delay={tBottomLine} color={hexToRgba(theme.text, 0.18)} height={1} widthPct={100} durationSec={0.55} />

          <Sequence from={tCta} layout="none">
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 24,
            }}>
              <div style={{
                fontFamily: FONTS.mono,
                fontSize: 20,
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                fontWeight: 500,
                color: muted,
              }}>
                voiceai connect
              </div>
              <div style={withLife(popIn(frame - tCta, fps, 0, 0.85), `scale(${breathe(frame - tCta)})`)}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 14,
                  backgroundColor: heroEmerald,
                  color: theme.primaryText,
                  fontFamily: FONTS.body,
                  fontWeight: 500,
                  letterSpacing: '-0.015em',
                  fontSize: 36,
                  padding: '20px 36px',
                  borderRadius: 999,
                  boxShadow: `0 20px 60px -16px ${hexToRgba(heroEmerald, 0.55)}`,
                }}>
                  {spec.cta}
                  <span style={{ fontSize: 28 }}>→</span>
                </span>
              </div>
            </div>
          </Sequence>
        </div>

      </SafeFrame>
    </AbsoluteFill>
  );
};
