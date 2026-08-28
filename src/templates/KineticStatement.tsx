/**
 * templates/KineticStatement.tsx — CONCEPT B (CLAUDE.md §6.3)
 *
 * Pure kinetic typography. No UI. Massive Anton statements pop in line-by-line
 * with hard scale contrast and emerald emphasis. The §6.3 punchy-interlude
 * format — the scroll-stopper that breaks up the demo reels.
 *
 * The spec drives content fully:
 *   - spec.hook       → split into LINES by sentence/period
 *   - spec.options.points[] → optional secondary lines below the hook
 *   - spec.options.emphasisWords[] (string[]) → words that render in emerald
 *   - spec.cta + spec.options.ctaSubline → closing CTA pill
 *
 * Anti-slop (§4):
 *  - Anton display, ultra-bold + tight tracking, size 240–360 hero lines
 *  - Asymmetric layout (lines left-anchored, intentional bleed)
 *  - Hard scale contrast (line ≈ 8× the kicker)
 *  - Springs uncapped, 6–8f stagger, pop spring with overshoot
 *  - Continuous post-settle drift (kills PowerPoint hold)
 *  - One focal moment per beat; cta arrives as the only thing on frame
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
import { ReelSpec } from '../specs/schema';
import { Background, BackgroundVariant } from '../engine/Background';
import { FONTS } from '../theme/fonts';
import { springProgress, drift } from '../engine/motion';

interface Props {
  spec: ReelSpec;
  theme: Theme;
  background: BackgroundVariant;
}

/** Split a hook string into kinetic "lines" by sentence boundary. */
function splitLines(text: string): string[] {
  const trimmed = text.trim();
  const parts = trimmed
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : [trimmed];
}

const KineticLine: React.FC<{
  text: string;
  startFrame: number;
  exitFrame?: number;
  size: number;
  baseColor: string;
  emphasisColor: string;
  emphasisWords: Set<string>;
  align: 'left' | 'right' | 'center';
}> = ({
  text,
  startFrame,
  exitFrame,
  size,
  baseColor,
  emphasisColor,
  emphasisWords,
  align,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const inP = springProgress(frame, fps, startFrame, 'pop');
  const inOpacity = interpolate(inP, [0, 0.4, 1], [0, 1, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const inTy = interpolate(inP, [0, 1], [60, 0]);
  const inScale = interpolate(inP, [0, 1], [0.86, 1]);

  const outOpacity = exitFrame
    ? interpolate(frame, [exitFrame - 8, exitFrame + 8], [1, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      })
    : 1;
  const outTy = exitFrame
    ? interpolate(frame, [exitFrame, exitFrame + 14], [0, -30], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      })
    : 0;

  const opacity = inOpacity * outOpacity;
  const driftStyle = drift(frame - (startFrame + 18), 'y', 3, 130);

  // word-by-word emerald emphasis
  const words = text.split(/(\s+)/);
  const renderedWords = words.map((w, i) => {
    if (/^\s+$/.test(w)) return <React.Fragment key={i}>{w}</React.Fragment>;
    const clean = w.replace(/[.,!?:;]/g, '').toLowerCase();
    const emph = emphasisWords.has(clean);
    return (
      <span key={i} style={{ color: emph ? emphasisColor : baseColor }}>
        {w}
      </span>
    );
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${inTy + outTy}px) scale(${inScale}) ${driftStyle.transform ?? ''}`,
        fontFamily: FONTS.display,
        fontSize: size,
        lineHeight: 0.92,
        letterSpacing: '-0.045em',
        textTransform: 'uppercase',
        textAlign: align,
        width: '100%',
      }}
    >
      {renderedWords}
    </div>
  );
};

export const KineticStatement: React.FC<Props> = ({ spec, theme, background }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lines = splitLines(spec.hook);
  const emphasisWords = new Set(
    (spec.options?.emphasisWords ?? []).map((s) => s.toLowerCase()),
  );

  // Timing — every line lands by ~1.2s of its slot, CTA last ~2s
  const totalFrames = spec.durationInFrames ?? 600;
  const ctaStart = totalFrames - 90;
  const exitFrame = ctaStart - 30;

  // Stagger lines: line i starts at staggered intervals; layout drives spacing.
  const linePerFrames = 24; // ~0.8s between line entries
  const lineStarts = lines.map((_, i) => 10 + i * linePerFrames);

  // Hero size: start from line-count-based default, then auto-fit to the
  // longest line so no word ever wraps mid-character. Anton's avg char width
  // is ~0.45em (ultra-condensed); we leave headroom for letter-spacing.
  const defaultSize = lines.length <= 2 ? 260 : lines.length === 3 ? 210 : 180;
  const safeWidthPx = 920; // 1080 - 80*2 padding
  const longestLen = lines.reduce((m, l) => Math.max(m, l.length), 1);
  const maxFitSize = Math.floor(safeWidthPx / (longestLen * 0.43));
  const heroSize = Math.min(defaultSize, maxFitSize);

  // Kicker eyebrow (optional)
  const kickerP = springProgress(frame, fps, 0, 'snappy');
  const kickerOpacity = interpolate(kickerP, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const kickerTy = interpolate(kickerP, [0, 1], [12, 0]);

  // CTA
  const ctaP = springProgress(frame, fps, ctaStart, 'pop');
  const ctaOpacity = interpolate(ctaP, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const ctaTy = interpolate(ctaP, [0, 1], [30, 0]);
  const ctaScale = interpolate(ctaP, [0, 1], [0.88, 1]);

  const ctaSubP = springProgress(frame, fps, ctaStart + 14, 'smooth');
  const ctaSubOpacity = interpolate(ctaSubP, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{ background: theme.bg, color: theme.text, fontFamily: FONTS.body }}
    >
      <Background variant={background} theme={theme} seed={spec.seed} />

      {/* KINETIC LINES — left-anchored, stacked, intentionally asymmetric */}
      <div
        style={{
          position: 'absolute',
          top: 320,
          left: 80,
          right: 80,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {lines.map((line, i) => (
          <KineticLine
            key={i}
            text={line}
            startFrame={lineStarts[i]}
            exitFrame={exitFrame}
            size={heroSize}
            baseColor={theme.text}
            emphasisColor={theme.primary}
            emphasisWords={emphasisWords}
            align="left"
          />
        ))}
      </div>

      {/* CTA — bottom of frame */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 260,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
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
