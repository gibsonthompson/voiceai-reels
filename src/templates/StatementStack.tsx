/**
 * templates/StatementStack.tsx — CONCEPT B variant (CLAUDE.md §6.3)
 *
 * Three claims that land progressively. The active claim is huge (Anton); as
 * the next claim arrives, the prior claim demotes to a small, numbered slot
 * on the LEFT rail. By the end, all three are on-screen simultaneously with
 * the newest still centered — a visible build.
 *
 * Composition is intentionally asymmetric: a narrow numbered rail on the LEFT
 * (mono "01"/"02"/"03") and the active claim column filling the right. Prior
 * claims collapse into the rail slot as small mono lines. No identical cards.
 *
 * Spec:
 *   spec.options.statements: [{ text, emphasis? }, ...] — usually 3
 *   spec.cta / spec.options.ctaSubline
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

interface StatementItem {
  text: string;
  emphasis?: string[];
}

const DEFAULT_STATEMENTS: StatementItem[] = [
  { text: "You're not building the AI.", emphasis: ['building'] },
  { text: "You're selling it.", emphasis: ['selling'] },
  { text: 'You keep the margin.', emphasis: ['margin'] },
];

// Beat timings (30fps) — claim i starts at 40 + i * 240, exits when i+1 starts.
// The final claim stays through the CTA. CTA at 810 → 30f before end of 900.
const BEAT_LEN = 240;
const FIRST_START = 40;

function renderTextWithEmphasis(
  text: string,
  emphasis: Set<string>,
  baseColor: string,
  emColor: string,
): React.ReactNode {
  const tokens = text.split(/(\s+)/);
  return tokens.map((tok, i) => {
    if (/^\s+$/.test(tok)) return <React.Fragment key={i}>{tok}</React.Fragment>;
    const clean = tok.replace(/[.,!?:;]/g, '').toLowerCase();
    const emph = emphasis.has(clean);
    return (
      <span key={i} style={{ color: emph ? emColor : baseColor }}>
        {tok}
      </span>
    );
  });
}

// ─── The active (huge) claim column ────────────────────────────────────────
const ActiveClaim: React.FC<{
  text: string;
  emphasis: Set<string>;
  enterFrame: number;
  demoteFrame: number | null;
  theme: Theme;
}> = ({ text, emphasis, enterFrame, demoteFrame, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const inP = springProgress(frame, fps, enterFrame, 'pop');
  const inOpacity = interpolate(inP, [0, 0.6], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const inTy = interpolate(inP, [0, 1], [70, 0]);
  const inScale = interpolate(inP, [0, 1], [0.82, 1]);

  // Demote: when demoteFrame is set, fade out (the RailItem takes over visually)
  const demoteOpacity = demoteFrame
    ? interpolate(frame, [demoteFrame - 8, demoteFrame + 6], [1, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      })
    : 1;

  const driftStyle = drift(frame - (enterFrame + 24), 'y', 4, 140);
  const opacity = inOpacity * demoteOpacity;

  // Auto-fit: claim column is ~820px wide (1080 - 200 rail - 60 pad).
  // Anton avg char ≈ 0.42em. For a line of ~28 chars → ~70. For 14 chars → 140.
  const usableWidth = 820;
  const size = Math.min(200, Math.floor(usableWidth / (text.length * 0.42)));

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${inTy}px) scale(${inScale}) ${driftStyle.transform ?? ''}`,
        fontFamily: FONTS.display,
        fontSize: size,
        lineHeight: 0.92,
        letterSpacing: '-0.045em',
        textTransform: 'uppercase',
      }}
    >
      {renderTextWithEmphasis(text, emphasis, theme.text, theme.primary)}
    </div>
  );
};

// ─── A resolved claim, sitting in the numbered rail ────────────────────────
const RailItem: React.FC<{
  index: number;
  text: string;
  emphasis: Set<string>;
  isActive: boolean;
  activeFrame: number;
  enterFrame: number; // frame it appears in the rail (== demote frame of prior)
  theme: Theme;
  top: number;
}> = ({ index, text, emphasis, isActive, activeFrame, enterFrame, theme, top }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // The rail item appears when the claim becomes active (small preview '01')
  // but the resolved text appears only when this claim gets demoted (i.e. the
  // next claim's enterFrame). Two-stage life.
  const numberP = springProgress(frame, fps, activeFrame, 'snappy');
  const numberOpacity = interpolate(numberP, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const textAppearFrame = enterFrame; // when this claim demotes into rail-full
  const showText = frame >= textAppearFrame - 4 && !isActive;
  const textP = springProgress(frame, fps, textAppearFrame, 'smooth');
  const textOpacity = interpolate(textP, [0, 1], [0, 0.62], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const textTx = interpolate(textP, [0, 1], [-14, 0]);

  const active = isActive && frame >= activeFrame;

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 60,
        right: 60,
        display: 'flex',
        alignItems: 'baseline',
        gap: 36,
        opacity: numberOpacity,
      }}
    >
      {/* Number badge (mono, uppercase) */}
      <span
        style={{
          fontFamily: FONTS.mono,
          fontSize: 60,
          letterSpacing: '0.04em',
          color: active ? theme.primary : theme.textMuted,
          fontWeight: 500,
          fontVariantNumeric: 'tabular-nums',
          minWidth: 90,
        }}
      >
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* Resolved-claim text (only when this claim has been demoted) */}
      {showText && (
        <span
          style={{
            fontFamily: FONTS.body,
            fontSize: 40,
            letterSpacing: '-0.01em',
            fontWeight: 400,
            color: theme.text,
            opacity: textOpacity,
            transform: `translateX(${textTx}px)`,
            lineHeight: 1.15,
          }}
        >
          {renderTextWithEmphasis(text, emphasis, theme.textMuted as string, theme.primary)}
        </span>
      )}
    </div>
  );
};

export const StatementStack: React.FC<Props> = ({ spec, theme, background }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const statements: StatementItem[] = (spec.options?.statements ?? DEFAULT_STATEMENTS).slice(0, 3);
  const count = statements.length;

  // Frame plan
  const beatStarts = statements.map((_, i) => FIRST_START + i * BEAT_LEN);
  // Rail top positions — first item near top, subsequent below.
  const railTop = 230;
  const railGap = 130;

  // Active claim center Y
  const activeCenterY = 1080;

  // CTA
  const totalFrames = spec.durationInFrames ?? 900;
  const ctaStart = totalFrames - 90;
  const ctaP = springProgress(frame, fps, ctaStart, 'pop');
  const ctaOpacity = interpolate(ctaP, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const ctaTy = interpolate(ctaP, [0, 1], [30, 0]);
  const ctaScale = interpolate(ctaP, [0, 1], [0.9, 1]);
  const ctaSubP = springProgress(frame, fps, ctaStart + 14, 'smooth');
  const ctaSubOpacity = interpolate(ctaSubP, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // The active claim index at the current frame
  let activeIdx = 0;
  for (let i = 0; i < count; i++) {
    if (frame >= beatStarts[i] - 4) activeIdx = i;
  }

  return (
    <AbsoluteFill style={{ background: theme.bg, color: theme.text, fontFamily: FONTS.body }}>
      <Background variant={background} theme={theme} seed={spec.seed} />

      {/* Rail — numbered indicators + resolved claims. Renders all indexes
          that have started (0-based number appears when claim goes active). */}
      {statements.map((s, i) => (
        <RailItem
          key={`rail-${i}`}
          index={i}
          text={s.text}
          emphasis={new Set((s.emphasis ?? []).map((w) => w.toLowerCase()))}
          isActive={i === activeIdx && frame < ctaStart - 20}
          activeFrame={beatStarts[i]}
          enterFrame={i + 1 < count ? beatStarts[i + 1] : ctaStart - 30}
          theme={theme}
          top={railTop + i * railGap}
        />
      ))}

      {/* Active claim, centered */}
      <div
        style={{
          position: 'absolute',
          left: 60,
          right: 60,
          top: activeCenterY,
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {statements.map((s, i) => {
          const nextStart = i + 1 < count ? beatStarts[i + 1] : null;
          return (
            <div
              key={`active-${i}`}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
              }}
            >
              <ActiveClaim
                text={s.text}
                emphasis={new Set((s.emphasis ?? []).map((w) => w.toLowerCase()))}
                enterFrame={beatStarts[i]}
                demoteFrame={nextStart ?? ctaStart - 30}
                theme={theme}
              />
            </div>
          );
        })}
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
