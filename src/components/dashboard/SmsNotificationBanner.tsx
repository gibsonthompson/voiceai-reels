/**
 * components/dashboard/SmsNotificationBanner.tsx
 *
 * iOS-style lockscreen notification banner. App icon square + app title +
 * "now" timestamp + 2-line body. Drops in from the top with a pop spring.
 *
 * Designed to sit inside a PhoneMockup (status bar above) — the banner is
 * positioned so the phone reads as locked, banner just arrived.
 */

import React from 'react';
import {
  useCurrentFrame, useVideoConfig, interpolate,
} from 'remotion';
import { MessageSquare } from 'lucide-react';
import { Theme } from '../../theme/buildTheme';
import { FONTS } from '../../theme/fonts';
import { springProgress } from '../../engine/motion';

/** Split text on sentence boundaries — each becomes its own line in the banner. */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

interface Props {
  theme: Theme;
  /** App title row, e.g. "MESSAGES". */
  app?: string;
  /** Brand line shown bold under the app, e.g. "Riverside Plumbing". */
  brand: string;
  /** Body of the notification — 2 short lines max. */
  body: string;
  /** Timestamp text, e.g. "now". */
  timestamp?: string;
  /** Frame the banner drops in. */
  enterFrame: number;
  /** Sizing scale (1.0 default). */
  width?: number;
}

export const SmsNotificationBanner: React.FC<Props> = ({
  theme,
  app = 'MESSAGES',
  brand,
  body,
  timestamp = 'now',
  enterFrame,
  width,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // banner drops in from above with pop spring
  const p = springProgress(frame, fps, enterFrame, 'pop');
  const opacity = interpolate(p, [0, 0.5, 1], [0, 1, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const ty = interpolate(p, [0, 1], [-80, 0]);
  const scale = interpolate(p, [0, 1], [0.94, 1]);

  return (
    <div
      style={{
        width: width ?? '100%',
        opacity,
        transform: `translateY(${ty}px) scale(${scale})`,
        transformOrigin: 'center top',
        background: 'rgba(28,28,30,0.92)',
        backdropFilter: 'blur(40px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 28,
        padding: '20px 22px',
        display: 'flex',
        gap: 16,
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.06) inset, 0 20px 50px -20px rgba(0,0,0,0.6)',
        color: '#fafaf9',
        fontFamily: FONTS.body,
      }}
    >
      {/* App icon — green messages bubble */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background:
            'linear-gradient(180deg, #5ee16a 0%, #1ec96b 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 4px 14px -4px rgba(30,201,107,0.55)',
        }}
      >
        <MessageSquare size={32} color="#fff" strokeWidth={2.4} fill="#fff" />
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <span
            style={{
              fontFamily: FONTS.body,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '-0.005em',
              color: '#fafaf9',
            }}
          >
            {brand}
          </span>
          <span
            style={{
              fontFamily: FONTS.body,
              fontSize: 18,
              color: 'rgba(250,250,249,0.55)',
              fontWeight: 400,
              flexShrink: 0,
            }}
          >
            {timestamp}
          </span>
        </div>
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 13,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(250,250,249,0.45)',
          }}
        >
          {app}
        </span>
        <div
          style={{
            marginTop: 6,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {splitSentences(body).map((line, i) => (
            <span
              key={i}
              style={{
                fontFamily: FONTS.body,
                fontSize: 24,
                lineHeight: 1.35,
                color: '#fafaf9',
                letterSpacing: '-0.005em',
              }}
            >
              {line}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
