/**
 * templates/KineticStatement.tsx — CONCEPT B, BEAT-DRIVEN + VOICEOVER.
 *
 * Pure kinetic typography, now voice-driven. Each statement LINE is a beat; the
 * line is on screen exactly while its voiceover line is spoken, and the CTA is
 * the final beat. Timing comes from the audio (spec.options.beats + voiceover),
 * so pacing matches the narration — no arbitrary line timers.
 *
 * Falls back to the old sentence-split + fixed timers if a spec has no beats,
 * so existing KineticStatement specs still render unchanged.
 *
 * Beats for this template use visual: 'statement' (each line) and 'cta' (close).
 */

import React from 'react';
import {
  AbsoluteFill,
  Audio,
  staticFile,
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
import { BeatInput, resolveBeats, ResolvedBeat } from '../engine/beatTimeline';
import { useVoiceover } from '../engine/useVoiceover';

interface Props {
  spec: ReelSpec;
  theme: Theme;
  background: BackgroundVariant;
}

function splitLines(text: string): string[] {
  const trimmed = text.trim();
  const parts = trimmed.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : [trimmed];
}

const KineticLine: React.FC<{
  text: string;
  startFrame: number;
  exitFrame: number;
  size: number;
  baseColor: string;
  emphasisColor: string;
  emphasisWords: Set<string>;
}> = ({ text, startFrame, exitFrame, size, baseColor, emphasisColor, emphasisWords }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const inP = springProgress(frame, fps, startFrame, 'pop');
  const inOpacity = interpolate(inP, [0, 0.4, 1], [0, 1, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const inTy = interpolate(inP, [0, 1], [60, 0]);
  const inScale = interpolate(inP, [0, 1], [0.86, 1]);
  const outOpacity = interpolate(frame, [exitFrame - 8, exitFrame + 8], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const outTy = interpolate(frame, [exitFrame, exitFrame + 14], [0, -30], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity = inOpacity * outOpacity;
  const driftStyle = drift(frame - (startFrame + 18), 'y', 3, 130);

  const words = text.split(/(\s+)/).map((w, i) => {
    if (/^\s+$/.test(w)) return <React.Fragment key={i}>{w}</React.Fragment>;
    const clean = w.replace(/[.,!?:;]/g, '').toLowerCase();
    return <span key={i} style={{ color: emphasisWords.has(clean) ? emphasisColor : baseColor }}>{w}</span>;
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
        textAlign: 'left',
        width: '100%',
      }}
    >
      {words}
    </div>
  );
};

export const KineticStatement: React.FC<Props> = ({ spec, theme, background }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const vo = useVoiceover(spec.id);

  const emphasisWords = new Set((spec.options?.emphasisWords ?? []).map((s) => s.toLowerCase()));
  const hasVO = vo.hasAudio || Boolean(spec.options?.voiceover);

  // ── BEAT-DRIVEN PATH (preferred) ──────────────────────────────────────────
  // Statement beats (visual:'statement') are the lines; a 'cta' beat closes.
  const specBeats = spec.options?.beats;
  let statementLines: string[];
  let lineStarts: number[];
  let lineExits: number[];
  let ctaStart: number;
  let totalFrames: number;

  if (specBeats && specBeats.length) {
    const voBeatFrames = vo.timing?.voBeatFrames?.length ? vo.timing.voBeatFrames : spec.options?.voBeatFrames;
    const { beats, totalFrames: tf } = resolveBeats(specBeats, { fps, beatDurations: voBeatFrames });
    const stmtBeats = beats.filter((b: ResolvedBeat) => b.visual === 'statement');
    const ctaBeat = beats.find((b: ResolvedBeat) => b.visual === 'cta');
    statementLines = stmtBeats.map((b) => b.caption ?? b.vo ?? '');
    lineStarts = stmtBeats.map((b) => b.startFrame + 2);
    // each line exits when the CTA beat begins (they stack, then clear for CTA)
    ctaStart = ctaBeat?.startFrame ?? tf - 60;
    lineExits = stmtBeats.map(() => ctaStart - 20);
    totalFrames = tf;
  } else {
    // ── FALLBACK: old fixed-timer path (existing specs unchanged) ────────────
    statementLines = splitLines(spec.hook);
    totalFrames = spec.durationInFrames ?? 600;
    ctaStart = totalFrames - 90;
    const per = 24;
    lineStarts = statementLines.map((_, i) => 10 + i * per);
    lineExits = statementLines.map(() => ctaStart - 30);
  }

  // Hero size: auto-fit to the longest line so nothing wraps.
  const defaultSize = statementLines.length <= 2 ? 260 : statementLines.length === 3 ? 210 : 180;
  const safeWidthPx = 920;
  const longestLen = statementLines.reduce((m, l) => Math.max(m, l.length), 1);
  const maxFitSize = Math.floor(safeWidthPx / (longestLen * 0.43));
  const heroSize = Math.min(defaultSize, maxFitSize);

  // CTA
  const ctaP = springProgress(frame, fps, ctaStart, 'pop');
  const ctaOpacity = interpolate(ctaP, [0, 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ctaTy = interpolate(ctaP, [0, 1], [30, 0]);
  const ctaScale = interpolate(ctaP, [0, 1], [0.88, 1]);
  const ctaSubP = springProgress(frame, fps, ctaStart + 14, 'smooth');
  const ctaSubOpacity = interpolate(ctaSubP, [0, 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: theme.bg, color: theme.text, fontFamily: FONTS.body }}>
      <Background variant={background} theme={theme} seed={spec.seed} />

      {hasVO && <Audio src={staticFile(`vo/${spec.id}/voice.mp3`)} />}

      <div style={{ position: 'absolute', top: 320, left: 80, right: 80, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {statementLines.map((line, i) => (
          <KineticLine
            key={i}
            text={line}
            startFrame={lineStarts[i]}
            exitFrame={lineExits[i]}
            size={heroSize}
            baseColor={theme.text}
            emphasisColor={theme.primary}
            emphasisWords={emphasisWords}
          />
        ))}
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
        <div
          style={{
            opacity: ctaOpacity,
            transform: `translateY(${ctaTy}px) scale(${ctaScale})`,
            display: 'inline-flex', alignItems: 'center', gap: 18,
            padding: '26px 48px', borderRadius: 999,
            background: theme.primary, color: theme.primaryText,
            boxShadow: '0 30px 80px -20px rgba(74,234,188,0.45)',
          }}
        >
          <span style={{ fontFamily: FONTS.display, fontSize: 72, letterSpacing: '-0.03em', lineHeight: 1, textTransform: 'uppercase' }}>
            {spec.cta}
          </span>
          <ArrowRight size={48} strokeWidth={2.5} />
        </div>
        {spec.options?.ctaSubline && (
          <div style={{ opacity: ctaSubOpacity, fontFamily: FONTS.body, fontSize: 34, color: theme.textMuted, textAlign: 'center', maxWidth: 900, lineHeight: 1.3 }}>
            {spec.options.ctaSubline}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

/** Total frames for a beat-driven KineticStatement — for Root's duration. */
export function kineticDurationInFrames(spec: ReelSpec, fps: number): number {
  const specBeats = spec.options?.beats;
  if (!specBeats || !specBeats.length) {
    return spec.durationInFrames ?? 600;
  }
  const { totalFrames } = resolveBeats(specBeats, { fps, beatDurations: spec.options?.voBeatFrames });
  return totalFrames + Math.round(fps * 0.6);
}