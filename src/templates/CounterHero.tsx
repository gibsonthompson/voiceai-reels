/**
 * templates/CounterHero.tsx — THE PROOF reel, rebuilt around Anton (display).
 *
 * Anti-slop checklist (CLAUDE.md §4.1–4.2):
 *  - Display face is Anton (ultra-condensed grotesque) — NOT neutral sans.
 *  - Hard scale contrast: result number (~260px) is ~10× the eyebrow (24px).
 *  - Layout is asymmetric — hook caps left-anchored, equation flows right, result
 *    intentionally bleeds the right safe edge as a designed move.
 *  - Brand emerald hard against ink; no muted grays where it counts.
 *  - One focal element: the EMERALD result. Everything else subordinate.
 *  - Motion: snappy spring entrances, 6f stagger, drift/breathe continuous life.
 *
 * Type system in one place:
 *  - Anton (display)  → hooks, operands, result, eyebrow ONLY when bold caps
 *  - Geist Mono       → small labels / eyebrows / annotations
 *  - Geist (body)     → the payoff sentence, the CTA pill
 *
 * Spec contract (unchanged):
 *  - spec.options.stats[]: non-highlight entries become operands; the
 *    highlight:true entry is the result.
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
import { ReelSpec, StatCardData } from '../specs/schema';
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

const DEFAULT_STATS: StatCardData[] = [
  { label: 'paying clients', value: 50 },
  { label: 'net / client', value: 137, prefix: '$' },
  { label: 'you keep / mo', value: 6850, prefix: '$', highlight: true },
];

export const CounterHero: React.FC<Props> = ({ spec, theme, background }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stats = (spec.options?.stats?.length ? spec.options.stats : DEFAULT_STATS).slice(0, 5);
  const result = stats.find((s) => s.highlight) ?? stats[stats.length - 1];
  const operands = stats.filter((s) => s !== result);
  const payoff = spec.options?.payoff;

  const f = (s: number) => Math.round(fps * s);
  const tTopRule = f(0.10);
  const tEyebrow = f(0.30);
  const tHook = f(0.55);
  const tOperands = f(1.80);
  const OP_STAGGER = f(0.30);
  const tResult = tOperands + OP_STAGGER * operands.length + f(0.30);
  const tResultBar = tResult + f(0.75);
  const tPayoff = tResult + f(1.25);
  const tBottomBar = tPayoff + f(1.20);
  const tCta = tBottomBar + f(0.30);

  // Display number for the result (count up).
  const resCount = countUp(frame, fps, result.value, tResult, 1.2);
  const resDisplay = Math.round(resCount).toLocaleString('en-US');
  const resP = springProgress(frame, fps, tResult, 'pop');
  const resScale = interpolate(resP, [0, 1], [0.94, 1]);
  const resOpacity = interpolate(resP, [0, 0.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const resLife = drift(frame, 'y', 3, 130).transform as string;

  const dim = hexToRgba(theme.text, 0.5);
  const muted = hexToRgba(theme.text, 0.30);
  // Light mode: bright emerald #4aeabc washes out on cream; use deeper #10b981
  // for hero numbers / heavy rules so the contrast still hits.
  const heroEmerald = theme.isDark ? theme.primary : theme.secondary;

  return (
    <AbsoluteFill>
      <Background variant={background} theme={theme} seed={spec.seed} />

      <SafeFrame style={{ justifyContent: 'flex-start', overflow: 'hidden' }}>

        {/* TOP RULE — short emerald hairline */}
        <Hairline frame={frame} fps={fps} delay={tTopRule} color={theme.primary} height={2} widthPct={28} durationSec={0.55} />

        {/* MONO EYEBROW */}
        <div style={{
          ...slideUp(frame, fps, tEyebrow, 12, 'snappy'),
          marginTop: 22,
          marginBottom: 24,
          fontFamily: FONTS.mono,
          fontSize: 24,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          fontWeight: 500,
          color: theme.primary,
          maxWidth: 880,
          lineHeight: 1.35,
        }}>
          {spec.kicker ?? 'agency reseller math'}
        </div>

        {/* HOOK — Anton uppercase, sentence-stacked. Auto-sizes per longest line */}
        <div style={{ marginBottom: 44 }}>
          {(() => {
            const lines = splitBeats(spec.hook);
            // Anton at 1.0× fits ~13 caps chars per 1000px wide. 940px usable inside SafeFrame.
            const longest = Math.max(...lines.map((l) => l.replace(/\.$/, '').length));
            // Pick the largest size where the longest line still fits 940px.
            // Approx width-per-char at 100px Anton ~ 38px. So size = 940 / (longest * 0.38).
            const sized = Math.min(150, Math.max(80, Math.floor(940 / (longest * 0.39))));
            return lines.map((line, i) => (
              <div
                key={i}
                style={{
                  ...slideUp(frame, fps, tHook + i * 5, 32, 'elegant'),
                  fontFamily: FONTS.display,
                  fontWeight: 400,
                  letterSpacing: '-0.025em',
                  lineHeight: 0.94,
                  fontSize: sized,
                  color: theme.text,
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {line.replace(/\.$/, '').toUpperCase()}
                <span style={{ color: theme.primary }}>.</span>
              </div>
            ));
          })()}
        </div>

        {/* EQUATION — operands inline, then a big rule, then the RESULT bleeds right */}
        <div>
          {/* operands row — small Anton + Geist Mono labels under each operand */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 36,
            flexWrap: 'wrap',
          }}>
            {operands.map((op, i) => {
              const delay = tOperands + i * OP_STAGGER;
              const p = springProgress(frame, fps, delay, 'snappy');
              const y = interpolate(p, [0, 1], [22, 0]);
              const opacity = interpolate(p, [0, 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
              const c = countUp(frame, fps, op.value, delay + 3, 0.8);
              const disp = Math.round(c).toLocaleString('en-US');
              return (
                <React.Fragment key={i}>
                  {i > 0 ? (
                    <div style={{
                      opacity,
                      transform: `translateY(${y}px)`,
                      fontFamily: FONTS.display,
                      fontWeight: 400,
                      fontSize: 96,
                      color: dim,
                      lineHeight: 1,
                      letterSpacing: '-0.02em',
                      marginBottom: 28,
                    }}>×</div>
                  ) : null}
                  <div style={{ opacity, transform: `translateY(${y}px)` }}>
                    <div style={{
                      fontFamily: FONTS.display,
                      fontWeight: 400,
                      fontSize: 132,
                      lineHeight: 1,
                      letterSpacing: '-0.025em',
                      color: theme.text,
                      display: 'inline-flex',
                      alignItems: 'baseline',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {op.prefix ? (
                        <span style={{ fontSize: 88, color: theme.text, marginRight: 4 }}>{op.prefix}</span>
                      ) : null}
                      <span>{disp}</span>
                    </div>
                    <div style={{
                      marginTop: 6,
                      fontFamily: FONTS.mono,
                      fontSize: 18,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      fontWeight: 500,
                      color: dim,
                    }}>
                      {op.label}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {/* Heavy emerald rule before the result */}
          <div style={{ marginTop: 26, marginBottom: 14 }}>
            <Hairline frame={frame} fps={fps} delay={tResultBar} color={heroEmerald} height={4} widthPct={100} durationSec={0.5} />
          </div>

          {/* RESULT — Anton, EMERALD */}
          <div style={{
            position: 'relative',
            transform: `scale(${resScale}) ${resLife}`,
            transformOrigin: 'left center',
            opacity: resOpacity,
          }}>
            <div style={{
              fontFamily: FONTS.display,
              fontWeight: 400,
              fontSize: 240,
              lineHeight: 1.0,
              letterSpacing: '-0.035em',
              color: heroEmerald,
              fontVariantNumeric: 'tabular-nums',
              display: 'inline-flex',
              alignItems: 'baseline',
              whiteSpace: 'nowrap',
            }}>
              {result.prefix ? (
                <span style={{ fontSize: 160, marginRight: 4 }}>{result.prefix}</span>
              ) : null}
              <span>{resDisplay}</span>
            </div>
            <div style={{
              marginTop: 12,
              fontFamily: FONTS.mono,
              fontSize: 20,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              fontWeight: 500,
              color: heroEmerald,
            }}>
              = {result.label}
            </div>
          </div>
        </div>

        {/* PAYOFF — Geist 300, thin and editorial */}
        {payoff ? (
          <Sequence from={tPayoff} layout="none">
            <div style={{ marginTop: 38 }}>
              <div style={{
                ...slideUp(frame - tPayoff, fps, 0, 22, 'smooth'),
                fontFamily: FONTS.body,
                fontWeight: 300,
                letterSpacing: '-0.02em',
                lineHeight: 1.08,
                fontSize: 44,
                color: hexToRgba(theme.text, 0.86),
                maxWidth: 880,
                textWrap: 'balance' as React.CSSProperties['textWrap'],
              }}>
                {payoff.text}
              </div>
            </div>
          </Sequence>
        ) : null}

        {/* BOTTOM bar + CTA */}
        <div style={{ marginTop: 'auto' }}>
          <Hairline frame={frame} fps={fps} delay={tBottomBar} color={hexToRgba(theme.text, 0.18)} height={1} widthPct={100} durationSec={0.55} />

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
                  backgroundColor: theme.primary,
                  color: theme.primaryText,
                  fontFamily: FONTS.body,
                  fontWeight: 500,
                  letterSpacing: '-0.015em',
                  fontSize: 36,
                  padding: '20px 36px',
                  borderRadius: 999,
                  boxShadow: `0 20px 60px -16px ${hexToRgba(theme.primary, 0.55)}`,
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
