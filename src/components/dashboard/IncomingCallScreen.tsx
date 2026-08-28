/**
 * components/dashboard/IncomingCallScreen.tsx
 *
 * iOS-style incoming call screen. Caller business name + caller name +
 * phone number, large pulsing avatar, two action buttons (decline / accept).
 * The whole thing sits inside a PhoneMockup.
 */

import React from 'react';
import { Phone, PhoneOff, User } from 'lucide-react';
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
  callerPhone: string;
  /** Frame the screen enters (children mount); animations key off this. */
  enterFrame?: number;
  /** Phone width (used to scale interior content proportionally). */
  phoneWidth: number;
}

export const IncomingCallScreen: React.FC<Props> = ({
  theme,
  businessName,
  callerName,
  callerPhone,
  enterFrame = 0,
  phoneWidth,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // entrance: fade + slide
  const p = springProgress(frame, fps, enterFrame, 'smooth');
  const opacity = interpolate(p, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // ring pulse (avatar): scale 1.0 ↔ 1.05, ~1.2s period
  const local = frame - enterFrame;
  const pulse = 1 + Math.sin((local / 36) * Math.PI * 2) * 0.025;
  const ringAlpha = (Math.sin((local / 36) * Math.PI * 2) + 1) * 0.5;

  // size things relative to phone width
  const PX = (frac: number) => Math.round(phoneWidth * frac);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        background:
          'linear-gradient(180deg, rgba(74,234,188,0.06) 0%, rgba(5,5,5,0) 40%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: `${PX(0.18)}px 0 ${PX(0.1)}px 0`,
        color: '#fafaf9',
        fontFamily: FONTS.body,
      }}
    >
      {/* Business name (small, top) — but NOT a slop eyebrow. Sized to match
          iOS caller-id "incoming call from…" label, mono brand. */}
      <span
        style={{
          fontFamily: FONTS.mono,
          fontSize: PX(0.038),
          letterSpacing: '0.02em',
          color: 'rgba(250,250,249,0.62)',
          textTransform: 'none',
          fontWeight: 500,
        }}
      >
        Incoming call · {businessName}
      </span>

      {/* Caller name (big, hero) */}
      <span
        style={{
          marginTop: PX(0.06),
          fontFamily: FONTS.display,
          fontSize: PX(0.13),
          lineHeight: 1,
          letterSpacing: '-0.03em',
          textTransform: 'uppercase',
        }}
      >
        {callerName}
      </span>

      {/* Caller phone */}
      <span
        style={{
          marginTop: PX(0.022),
          fontFamily: FONTS.mono,
          fontSize: PX(0.048),
          color: 'rgba(250,250,249,0.72)',
          letterSpacing: '0.02em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {callerPhone}
      </span>

      {/* Avatar with ring */}
      <div
        style={{
          marginTop: PX(0.12),
          width: PX(0.5),
          height: PX(0.5),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: `2px solid ${theme.primary}`,
            opacity: ringAlpha * 0.5,
            transform: `scale(${1 + ringAlpha * 0.18})`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: PX(0.04),
            borderRadius: '50%',
            border: `1.5px solid ${theme.primary}`,
            opacity: ringAlpha * 0.7,
            transform: `scale(${1 + ringAlpha * 0.1})`,
          }}
        />
        <div
          style={{
            width: PX(0.34),
            height: PX(0.34),
            borderRadius: '50%',
            background: theme.primary15,
            border: `2.5px solid ${theme.primary}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${pulse})`,
            boxShadow: `0 0 60px -10px ${theme.primary}`,
          }}
        >
          <User size={PX(0.16)} color={theme.primary} strokeWidth={1.8} />
        </div>
      </div>

      {/* Action buttons — decline / accept */}
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
        <div
          style={{
            width: PX(0.18),
            height: PX(0.18),
            borderRadius: '50%',
            background: '#22c55e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 28px -8px rgba(34,197,94,0.55)',
            transform: `scale(${pulse})`,
          }}
        >
          <Phone size={PX(0.075)} color="#fff" strokeWidth={2.4} />
        </div>
      </div>
    </div>
  );
};
