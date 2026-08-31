/**
 * templates/ProductDemo.tsx — CONCEPT A, BEAT-DRIVEN + VOICEOVER.
 *
 * Frames the recreated CallModal in a DeviceFrame with a voiceover narrating
 * the demo. The VOICEOVER drives the reel's overall timing; the CallModal's
 * internal scripted timing (transcript bubbles, events) is SCALED to fit the
 * voice-driven total so the call plays out across the narration instead of on
 * fixed absolute frames.
 *
 * Beats (visual types): 'hold' (hook over the connecting/live modal),
 * 'panel' (the call playing), 'number' (the BOOKED payoff), 'cta'.
 * The beats carry the vo; their durations come from the audio.
 *
 * Falls back to the original fixed 900-frame timeline if a spec has no beats,
 * so existing ProductDemo specs render unchanged.
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
import { DeviceFrame } from '../components/dashboard/DeviceFrame';
import { CallModal, CallScript } from '../components/dashboard/CallModal';
import { springProgress, drift } from '../engine/motion';
import { BeatInput, resolveBeats, ResolvedBeat } from '../engine/beatTimeline';
import { useVoiceover } from '../engine/useVoiceover';

interface Props {
  spec: ReelSpec;
  theme: Theme;
  background: BackgroundVariant;
}

const DEFAULT_SCRIPT: CallScript = {
  clientName: 'Riverside Plumbing',
  connectingStart: 60,
  liveStart: 130,
  endedStart: 740,
  bookingStart: 660,
  bookingMessage: 'Tomorrow · 9:00 AM · Confirmation text sent',
  transcript: [
    { id: 't1', role: 'assistant', text: 'Hi, this is Riverside Plumbing. How can I help you today?', startFrame: 165 },
    { id: 't2', role: 'user',      text: 'Yeah, my water heater stopped working this morning.',         startFrame: 290 },
    { id: 't3', role: 'assistant', text: 'I can get a tech to you tomorrow at 9 AM. Want me to book it?', startFrame: 395 },
    { id: 't4', role: 'user',      text: 'Yeah, that works.',                                            startFrame: 510 },
    { id: 't5', role: 'assistant', text: 'Booked. Confirmation text on its way.',                        startFrame: 575 },
  ],
  events: [
    { id: 'e1', type: 'dialing',      message: 'Calling Riverside Plumbing…',   level: 'info',    atFrame: 65  },
    { id: 'e2', type: 'call-start',   message: 'Call connected',                level: 'success', atFrame: 130 },
    { id: 'e3', type: 'speech-start', message: 'Assistant speaking',            level: 'info',    atFrame: 170 },
    { id: 'e4', type: 'transcript',   message: 'Final transcript received',     level: 'info',    atFrame: 235 },
    { id: 'e5', type: 'speech-start', message: 'Assistant speaking',            level: 'info',    atFrame: 400 },
    { id: 'e6', type: 'transcript',   message: 'Final transcript received',     level: 'info',    atFrame: 540 },
    { id: 'e7', type: 'tool-call',    message: 'Tool: book_appointment',        level: 'info',    atFrame: 605 },
    { id: 'e8', type: 'booking',      message: 'Appointment booked · 9 AM',     level: 'success', atFrame: 645 },
    { id: 'e9', type: 'call-end',     message: 'Call ended',                    level: 'info',    atFrame: 745 },
  ],
};

/** Scale a CallScript's absolute frames so the call fits a new total length. */
function scaleScript(script: CallScript, factor: number): CallScript {
  const s = (n: number | undefined) => (n == null ? n : Math.round(n * factor));
  return {
    ...script,
    connectingStart: s(script.connectingStart),
    liveStart: s(script.liveStart),
    endedStart: s(script.endedStart),
    bookingStart: s(script.bookingStart),
    transcript: script.transcript.map((t) => ({ ...t, startFrame: Math.round(t.startFrame * factor) })),
    events: script.events.map((e) => ({ ...e, atFrame: Math.round(e.atFrame * factor) })),
  };
}

const KineticWord: React.FC<{ text: string; delay: number; size: number; color: string }> = ({ text, delay, size, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = springProgress(frame, fps, delay, 'pop');
  const opacity = interpolate(p, [0, 0.4, 1], [0, 1, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ty = interpolate(p, [0, 1], [40, 0]);
  const scale = interpolate(p, [0, 1], [0.92, 1]);
  return (
    <span style={{ display: 'inline-block', opacity, transform: `translateY(${ty}px) scale(${scale})`, fontFamily: FONTS.display, fontSize: size, lineHeight: 0.9, letterSpacing: '-0.04em', color }}>
      {text}
    </span>
  );
};

const BookedCallout: React.FC<{ bookingFrame: number; theme: Theme; ctaStart: number }> = ({ bookingFrame, theme, ctaStart }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = springProgress(frame, fps, bookingFrame, 'pop');
  const inOpacity = interpolate(p, [0, 0.4, 1], [0, 1, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const outOpacity = interpolate(frame, [ctaStart - 60, ctaStart - 30], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity = Math.min(inOpacity, outOpacity);
  const scale = interpolate(p, [0, 1], [0.7, 1]);
  const driftY = Math.sin(((frame - bookingFrame) / 110) * Math.PI * 2) * 4;
  if (frame < bookingFrame - 4) return null;
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,5,5,0.62)', opacity, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', opacity, transform: `scale(${scale}) translateY(${driftY}px)` }}>
        <div style={{ fontFamily: FONTS.display, fontSize: 380, lineHeight: 0.85, letterSpacing: '-0.055em', color: theme.primary, textShadow: '0 0 140px rgba(74,234,188,0.6), 0 0 50px rgba(74,234,188,0.75)', textAlign: 'center', padding: '0 30px' }}>
          BOOKED.
        </div>
      </div>
    </>
  );
};

export const ProductDemo: React.FC<Props> = ({ spec, theme, background }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const vo = useVoiceover(spec.id);
  const hasVO = vo.hasAudio || Boolean(spec.options?.voiceover);

  const rawScript = spec.options?.callScript ?? DEFAULT_SCRIPT;
  const hookText = (spec.hook ?? 'One ring. AI books.').toUpperCase();
  const hookWords = hookText.match(/[^.!?]+[.!?]?/g)?.map((s) => s.trim()).filter(Boolean) ?? ['ONE RING.', 'AI BOOKS.'];

  // ── Resolve timeline: beat-driven if beats present, else fixed 900 ──────────
  const specBeats = spec.options?.beats;
  let ctaStart: number;
  let bookingFrame: number;
  let script: CallScript;
  let totalFrames: number;

  if (specBeats && specBeats.length) {
    const voBeatFrames = vo.timing?.voBeatFrames?.length ? vo.timing.voBeatFrames : spec.options?.voBeatFrames;
    const { beats, totalFrames: tf } = resolveBeats(specBeats, { fps, beatDurations: voBeatFrames });
    const ctaBeat = beats.find((b: ResolvedBeat) => b.visual === 'cta');
    const bookBeat = beats.find((b: ResolvedBeat) => b.visual === 'number');
    ctaStart = ctaBeat?.startFrame ?? tf - 120;
    bookingFrame = bookBeat?.startFrame ?? ctaStart - 90;
    totalFrames = tf;
    // Scale the modal's scripted call so its booking lands at bookingFrame.
    const origBooking = rawScript.bookingStart ?? 660;
    script = scaleScript(rawScript, bookingFrame / origBooking);
  } else {
    // fallback: original fixed timeline
    ctaStart = 770;
    bookingFrame = rawScript.bookingStart ?? 660;
    script = rawScript;
    totalFrames = spec.durationInFrames ?? 900;
  }

  // ── Hook overlay (resolves up as the call gets going) ──────────────────────
  const hookResolve = interpolate(frame, [50, 90], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const heroOpacity = interpolate(hookResolve, [0, 0.7, 1], [1, 1, 0.85]);
  const heroScale = interpolate(hookResolve, [0, 1], [1, 0.35]);
  const heroTy = interpolate(hookResolve, [0, 1], [0, -560]);

  const deviceP = springProgress(frame, fps, 50, 'elegant');
  const deviceOpacity = interpolate(deviceP, [0, 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const deviceTy = interpolate(deviceP, [0, 1], [80, 0]);
  const driftStyle = drift(frame - 90, 'y', 4, 140);

  const zoomIn = interpolate(frame, [130, bookingFrame - 20], [1.0, 1.07], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const zoomSnap = interpolate(frame, [bookingFrame - 20, bookingFrame + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const cameraZoom = zoomIn - zoomSnap * 0.08;

  const ctaP = springProgress(frame, fps, ctaStart, 'pop');
  const ctaOpacity = interpolate(ctaP, [0, 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ctaTy = interpolate(ctaP, [0, 1], [30, 0]);
  const ctaScale = interpolate(ctaP, [0, 1], [0.9, 1]);
  const ctaSubP = springProgress(frame, fps, ctaStart + 14, 'smooth');
  const ctaSubOpacity = interpolate(ctaSubP, [0, 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ctaSubTy = interpolate(ctaSubP, [0, 1], [16, 0]);
  const modalDim = interpolate(frame, [ctaStart + 10, ctaStart + 40], [1, 0.55], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const modalW = 980, modalH = 880;
  const modalX = (width - modalW) / 2, modalY = 340;
  const hookSize = 220;

  return (
    <AbsoluteFill style={{ background: theme.bg, color: theme.text, fontFamily: FONTS.body }}>
      <Background variant={background} theme={theme} seed={spec.seed} />

      {hasVO && <Audio src={staticFile(`vo/${spec.id}/voice.mp3`)} />}

      <div
        style={{
          position: 'absolute', left: modalX, top: modalY,
          opacity: deviceOpacity * modalDim,
          transform: `translateY(${deviceTy}px) ${driftStyle.transform ?? ''} scale(${cameraZoom})`,
          transformOrigin: 'center center',
        }}
      >
        <DeviceFrame width={modalW} height={modalH} perspective="subtle" glowColor="rgba(74, 234, 188, 0.28)" cardBg={theme.card} borderColor={theme.border}>
          <CallModal script={script} theme={theme} />
        </DeviceFrame>
      </div>

      <div
        style={{
          position: 'absolute', top: 200, left: 0, right: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          opacity: heroOpacity, transform: `translateY(${heroTy}px) scale(${heroScale})`,
          transformOrigin: 'center top', pointerEvents: 'none',
        }}
      >
        {hookWords.map((w, i) => (
          <KineticWord key={i} text={w} delay={i * 9} size={hookSize} color={i === hookWords.length - 1 ? theme.primary : theme.text} />
        ))}
      </div>

      {spec.kicker && (
        <div
          style={{
            position: 'absolute', top: 170, left: 0, right: 0, textAlign: 'center',
            fontFamily: FONTS.mono, fontSize: 24, letterSpacing: '0.22em', textTransform: 'uppercase',
            fontWeight: 500, color: theme.textMuted,
            opacity: interpolate(frame, [80, 110], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          }}
        >
          {spec.kicker}
        </div>
      )}

      <BookedCallout bookingFrame={bookingFrame} theme={theme} ctaStart={ctaStart} />

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
        <div
          style={{
            opacity: ctaOpacity, transform: `translateY(${ctaTy}px) scale(${ctaScale})`,
            display: 'inline-flex', alignItems: 'center', gap: 18, padding: '26px 48px', borderRadius: 999,
            background: theme.primary, color: theme.primaryText, boxShadow: '0 30px 80px -20px rgba(74,234,188,0.45)',
          }}
        >
          <span style={{ fontFamily: FONTS.display, fontSize: 72, letterSpacing: '-0.03em', lineHeight: 1, textTransform: 'uppercase' }}>
            {spec.cta}
          </span>
          <ArrowRight size={48} strokeWidth={2.5} />
        </div>
        <div style={{ opacity: ctaSubOpacity, transform: `translateY(${ctaSubTy}px)`, fontFamily: FONTS.body, fontSize: 36, color: theme.textMuted, textAlign: 'center', maxWidth: 900, lineHeight: 1.3 }}>
          {spec.options?.ctaSubline ?? 'Your brand. Your client. Your margin.'}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Total frames for a beat-driven ProductDemo — for Root's duration. */
export function productDemoDurationInFrames(spec: ReelSpec, fps: number): number {
  const specBeats = spec.options?.beats;
  if (!specBeats || !specBeats.length) return spec.durationInFrames ?? 900;
  const { totalFrames } = resolveBeats(specBeats, { fps, beatDurations: spec.options?.voBeatFrames });
  return totalFrames + Math.round(fps * 0.6);
}