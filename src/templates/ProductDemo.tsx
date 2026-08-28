/**
 * templates/ProductDemo.tsx — CONCEPT A (CLAUDE.md §6.3)
 *
 * The product demo template. Frames a recreated dashboard surface inside a
 * DeviceFrame with a bold kinetic hook overlay (Anton) at the top, and a CTA
 * pill at the end. This first variant drives the AI Lab CallModal demo.
 *
 * Timeline (30s @ 30fps = 900 frames):
 *   0   – 50  : KINETIC HOOK lands (Anton, huge, word-by-word)
 *   50  – 90  : hook resolves up to a small kicker; device slides up
 *   90  – 120 : CONNECTING badge + animated dots
 *   120 – 140 : flip to LIVE (pop)
 *   140 – 660 : transcript bubbles + event-log entries stream in
 *   660 – 720 : "Booking captured" success banner over modal
 *   720 – 770 : modal transitions to ENDED
 *   770 – 900 : CTA pill ("Start your agency") + supporting subline
 *
 * Anti-slop hooks (§4): Anton display, hard scale contrast, asymmetric layout,
 * combined-property entrances, 6f stagger, springs uncapped, drift on hold,
 * one focal element per beat (hook → modal → CTA).
 */

import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import { ArrowRight } from 'lucide-react';
import { Theme } from '../theme/buildTheme';
import { ReelSpec } from '../specs/schema';
import { Background, BackgroundVariant } from '../engine/Background';
import { SafeFrame } from '../components/SafeFrame';
import { FONTS } from '../theme/fonts';
import { MOTION } from '../theme/tokens';
import { DeviceFrame } from '../components/dashboard/DeviceFrame';
import { CallModal, CallScript } from '../components/dashboard/CallModal';
import {
  springProgress,
  popIn,
  drift,
} from '../engine/motion';

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
    { id: 'e1', type: 'dialing',      message: 'Calling Riverside Plumbing…',        level: 'info',    atFrame: 65  },
    { id: 'e2', type: 'call-start',   message: 'Call connected',                     level: 'success', atFrame: 130 },
    { id: 'e3', type: 'speech-start', message: 'Assistant speaking',                 level: 'info',    atFrame: 170 },
    { id: 'e4', type: 'transcript',   message: 'Final transcript received',          level: 'info',    atFrame: 235 },
    { id: 'e5', type: 'speech-start', message: 'Assistant speaking',                 level: 'info',    atFrame: 400 },
    { id: 'e6', type: 'transcript',   message: 'Final transcript received',          level: 'info',    atFrame: 540 },
    { id: 'e7', type: 'tool-call',    message: 'Tool: book_appointment',             level: 'info',    atFrame: 605 },
    { id: 'e8', type: 'booking',      message: 'Appointment booked · 9 AM',          level: 'success', atFrame: 645 },
    { id: 'e9', type: 'call-end',     message: 'Call ended',                         level: 'info',    atFrame: 745 },
  ],
};

const HOOK_WORDS_FALLBACK = ['ONE RING.', 'AI BOOKS.'];

// ─── BOOKED. callout — the climax punctuation ─────────────────────────────
const BookedCallout: React.FC<{
  bookingFrame: number;
  theme: Theme;
  ctaStart: number;
}> = ({ bookingFrame, theme, ctaStart }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // pop in at booking, hold, fade out before CTA
  const p = springProgress(frame, fps, bookingFrame, 'pop');
  const inOpacity = interpolate(p, [0, 0.4, 1], [0, 1, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const outOpacity = interpolate(
    frame,
    [ctaStart - 60, ctaStart - 30],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const opacity = Math.min(inOpacity, outOpacity);
  const scale = interpolate(p, [0, 1], [0.7, 1]);
  // tiny slow drift while held so it doesn't dead-stop
  const driftY = Math.sin(((frame - bookingFrame) / 110) * Math.PI * 2) * 4;
  if (frame < bookingFrame - 4) return null;

  return (
    <>
      {/* dim wash so the modal recedes and the callout owns the frame */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(5,5,5,0.62)',
          opacity,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          opacity,
          transform: `scale(${scale}) translateY(${driftY}px)`,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.display,
            fontSize: 380,
            lineHeight: 0.85,
            letterSpacing: '-0.055em',
            color: theme.primary,
            textShadow:
              '0 0 140px rgba(74,234,188,0.6), 0 0 50px rgba(74,234,188,0.75)',
            textAlign: 'center',
            padding: '0 30px',
          }}
        >
          BOOKED.
        </div>
      </div>
    </>
  );
};

// ─── A small kinetic word-by-word entrance ─────────────────────────────────
const KineticWord: React.FC<{
  text: string;
  delay: number;
  size: number;
  color: string;
}> = ({ text, delay, size, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = springProgress(frame, fps, delay, 'pop');
  const opacity = interpolate(p, [0, 0.4, 1], [0, 1, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const ty = interpolate(p, [0, 1], [40, 0]);
  const scale = interpolate(p, [0, 1], [0.92, 1]);
  return (
    <span
      style={{
        display: 'inline-block',
        opacity,
        transform: `translateY(${ty}px) scale(${scale})`,
        fontFamily: FONTS.display,
        fontSize: size,
        lineHeight: 0.9,
        letterSpacing: '-0.04em',
        color,
      }}
    >
      {text}
    </span>
  );
};

export const ProductDemo: React.FC<Props> = ({ spec, theme, background }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const script = spec.options?.callScript ?? DEFAULT_SCRIPT;
  const hookText = (spec.hook ?? 'One ring. AI books.').toUpperCase();
  const hookWords = hookText.match(/[^.!?]+[.!?]?/g)?.map(s => s.trim()).filter(Boolean) ?? HOOK_WORDS_FALLBACK;

  // ─── HOOK overlay ─────────────────────────────────────────────────────────
  // Words pop in over 0..30f, then the whole block scales down and slides up to
  // a small kicker position by ~90f.
  const hookResolveStart = 50;
  const hookResolveEnd = 90;
  const hookResolve = interpolate(frame, [hookResolveStart, hookResolveEnd], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  // While 0: big & centered. While 1: small & near top, slightly off-center left.
  const heroOpacity = interpolate(hookResolve, [0, 0.7, 1], [1, 1, 0.85]);
  const heroScale = interpolate(hookResolve, [0, 1], [1, 0.35]);
  const heroTy = interpolate(hookResolve, [0, 1], [0, -560]);

  // ─── Device frame entrance ────────────────────────────────────────────────
  const deviceP = springProgress(frame, fps, 50, 'elegant');
  const deviceOpacity = interpolate(deviceP, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const deviceTy = interpolate(deviceP, [0, 1], [80, 0]);
  // continuous drift after settled
  const driftStyle = drift(frame - 90, 'y', 4, 140);

  // ─── Camera zoom on the modal ─────────────────────────────────────────────
  // Slow zoom-in across the conversation (130 → bookingStart), then snap-out
  // at the booking payoff — tension build → release.
  const bookingFrame = script.bookingStart ?? 660;
  const zoomIn = interpolate(frame, [130, bookingFrame - 20], [1.0, 1.07], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const zoomSnap = interpolate(frame, [bookingFrame - 20, bookingFrame + 12], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const cameraZoom = zoomIn - zoomSnap * 0.08;

  // ─── CTA reveal ───────────────────────────────────────────────────────────
  const ctaStart = 770;
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
  const ctaSubTy = interpolate(ctaSubP, [0, 1], [16, 0]);

  // After CTA shows, the modal can fade slightly so the CTA reads as the focus
  const modalDim = interpolate(frame, [ctaStart + 10, ctaStart + 40], [1, 0.55], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Modal sizing — fills available width, taller to dominate the frame
  const modalW = 980;
  const modalH = 880;
  const modalX = (width - modalW) / 2;
  const modalY = 340;

  // ─── HOOK position ────────────────────────────────────────────────────────
  // Hero rendered centered in the upper portion of the frame; shrinks + flies up.
  const hookSize = 220;

  return (
    <AbsoluteFill style={{ background: theme.bg, color: theme.text, fontFamily: FONTS.body }}>
      <Background variant={background} theme={theme} seed={spec.seed} />

      {/* Device frame containing the recreated CallModal */}
      <div
        style={{
          position: 'absolute',
          left: modalX,
          top: modalY,
          opacity: deviceOpacity * modalDim,
          transform: `translateY(${deviceTy}px) ${driftStyle.transform ?? ''} scale(${cameraZoom})`,
          transformOrigin: 'center center',
        }}
      >
        <DeviceFrame
          width={modalW}
          height={modalH}
          perspective="subtle"
          glowColor="rgba(74, 234, 188, 0.28)"
          cardBg={theme.card}
          borderColor={theme.border}
        >
          <CallModal script={script} theme={theme} />
        </DeviceFrame>
      </div>

      {/* HOOK — kinetic Anton words, big at start, shrinks to top kicker */}
      <div
        style={{
          position: 'absolute',
          top: 200,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          opacity: heroOpacity,
          transform: `translateY(${heroTy}px) scale(${heroScale})`,
          transformOrigin: 'center top',
          pointerEvents: 'none',
        }}
      >
        {hookWords.map((w, i) => (
          <KineticWord
            key={i}
            text={w}
            delay={i * 9}
            size={hookSize}
            color={i === hookWords.length - 1 ? theme.primary : theme.text}
          />
        ))}
      </div>

      {/* Small kicker reveals after hook resolves up — keeps top-of-frame "alive" */}
      {spec.kicker && (
        <div
          style={{
            position: 'absolute',
            top: 170,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: FONTS.mono,
            fontSize: 24,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            fontWeight: 500,
            color: theme.textMuted,
            opacity: interpolate(frame, [80, 110], [0, 1], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
            }),
          }}
        >
          {spec.kicker}
        </div>
      )}

      {/* GIANT BOOKED. CALLOUT — the climax. Massive Anton overlay across the
          whole frame at the booking moment. Pops in, holds, fades before CTA. */}
      <BookedCallout
        bookingFrame={bookingFrame}
        theme={theme}
        ctaStart={ctaStart}
      />

      {/* CTA — bottom of frame, big Anton pill + subline */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 220,
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
        <div
          style={{
            opacity: ctaSubOpacity,
            transform: `translateY(${ctaSubTy}px)`,
            fontFamily: FONTS.body,
            fontSize: 36,
            color: theme.textMuted,
            textAlign: 'center',
            maxWidth: 900,
            lineHeight: 1.3,
          }}
        >
          {spec.options?.ctaSubline ?? 'Your brand. Your client. Your margin.'}
        </div>
      </div>
    </AbsoluteFill>
  );
};
