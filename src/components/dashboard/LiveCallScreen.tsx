/**
 * components/dashboard/LiveCallScreen.tsx
 *
 * iOS-style live-call screen — AI is on the call. LIVE badge pulses, timer
 * ticks up, voice-waveform bars animate, caller info up top. No transcript
 * (the AI Summary card is what the owner sees later).
 */

import React from 'react';
import { Radio, Mic, PhoneOff } from 'lucide-react';
import {
  useCurrentFrame, useVideoConfig, interpolate,
} from 'remotion';
import { Theme } from '../../theme/buildTheme';
import { FONTS } from '../../theme/fonts';
import { springProgress } from '../../engine/motion';

interface Props {
  theme: Theme;
  businessName: string;
  callerName: string;
  /** Frame this screen starts; timer counts up from 0:00 here. */
  enterFrame: number;
  /** Phone width, used for proportional sizing. */
  phoneWidth: number;
}

function fmtDuration(s: number): string {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

const WAVE_BARS = 17;

export const LiveCallScreen: React.FC<Props> = ({
  theme,
  businessName,
  callerName,
  enterFrame,
  phoneWidth,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const p = springProgress(frame, fps, enterFrame, 'snappy');
  const opacity = interpolate(p, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const local = Math.max(0, frame - enterFrame);
  const seconds = Math.floor(local / fps);

  const PX = (f: number) => Math.round(phoneWidth * f);

  // status pulse for LIVE dot
  const livePulse =
    (Math.sin((local / 26) * Math.PI * 2) + 1) * 0.5;

  // waveform: per-bar amplitude using a phase-offset sin so it looks like
  // someone is actually talking. Center bars taller for shape.
  const baseHeights = Array.from({ length: WAVE_BARS }, (_, i) => {
    const center = (WAVE_BARS - 1) / 2;
    const dist = Math.abs(i - center) / center; // 0 at center, 1 at edges
    return 0.35 + (1 - dist) * 0.55; // 0.35 .. 0.9
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: `${PX(0.18)}px 0 ${PX(0.1)}px 0`,
        color: '#fafaf9',
        fontFamily: FONTS.body,
      }}
    >
      {/* LIVE badge + timer row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: PX(0.028),
          padding: `${PX(0.014)}px ${PX(0.035)}px`,
          borderRadius: 999,
          background: 'rgba(34,197,94,0.16)',
          color: '#22c55e',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: PX(0.016),
            height: PX(0.016),
            borderRadius: '50%',
            background: '#22c55e',
            opacity: 0.55 + livePulse * 0.45,
            boxShadow: `0 0 ${10 + livePulse * 10}px #22c55e`,
          }}
        />
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: PX(0.032),
            letterSpacing: '0.22em',
            fontWeight: 600,
          }}
        >
          LIVE
        </span>
      </div>

      {/* Business name */}
      <span
        style={{
          marginTop: PX(0.04),
          fontFamily: FONTS.mono,
          fontSize: PX(0.036),
          color: 'rgba(250,250,249,0.6)',
          letterSpacing: '0.02em',
        }}
      >
        {businessName}
      </span>

      {/* Caller name */}
      <span
        style={{
          marginTop: PX(0.05),
          fontFamily: FONTS.display,
          fontSize: PX(0.115),
          lineHeight: 1,
          letterSpacing: '-0.03em',
          textTransform: 'uppercase',
        }}
      >
        {callerName}
      </span>

      {/* Timer */}
      <span
        style={{
          marginTop: PX(0.02),
          fontFamily: FONTS.mono,
          fontSize: PX(0.06),
          color: 'rgba(250,250,249,0.85)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {fmtDuration(seconds)}
      </span>

      {/* Waveform */}
      <div
        style={{
          marginTop: PX(0.11),
          display: 'flex',
          alignItems: 'center',
          gap: PX(0.014),
          height: PX(0.28),
        }}
      >
        {baseHeights.map((base, i) => {
          // phase offset per bar so animation looks organic
          const phase = i * 0.5;
          const t = (local + phase * fps * 0.05) / 12;
          const noise =
            (Math.sin(t * Math.PI * 2) + Math.sin(t * Math.PI * 4.2) * 0.5) * 0.5 +
            0.5; // 0..1
          const amplitude = base * (0.55 + noise * 0.45);
          const h = PX(0.28) * amplitude;
          return (
            <div
              key={i}
              style={{
                width: PX(0.022),
                height: h,
                borderRadius: PX(0.022),
                background: theme.primary,
                boxShadow: `0 0 ${PX(0.018)}px ${theme.primary15}`,
              }}
            />
          );
        })}
      </div>

      {/* Footer — minimal mute + end button (read-only visual) */}
      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          gap: PX(0.18),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: PX(0.16),
            height: PX(0.16),
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            border: '1.5px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Mic size={PX(0.06)} color="#fafaf9" />
        </div>
        <div
          style={{
            width: PX(0.18),
            height: PX(0.18),
            borderRadius: '50%',
            background: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 28px -8px rgba(239,68,68,0.5)',
          }}
        >
          <PhoneOff size={PX(0.075)} color="#fff" strokeWidth={2.4} />
        </div>
      </div>
    </div>
  );
};
