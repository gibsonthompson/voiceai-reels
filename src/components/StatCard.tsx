/**
 * components/StatCard.tsx
 *
 * Frame-animatable analytics stat card in the homepage design language.
 * Motion (per CLAUDE.md §4): snappy spring slide-in from left + fade (combined),
 * a velocity-proportional blur during the fast part of the travel to tie frames
 * together (lightweight motion-blur that needs no absolute positioning), tabular
 * count-up, and a subtle breathe on the highlight (payoff) card so it stays alive.
 * Data-free — everything is props.
 */

import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { LucideIcon } from 'lucide-react';
import { Theme, hexToRgba } from '../theme/buildTheme';
import { TYPE, SURFACE, FONT } from '../theme/tokens';
import { springProgress, countUp, breathe } from '../engine/motion';

interface StatCardProps {
  theme: Theme;
  icon: LucideIcon;
  label: string;
  value: number;          // numeric; counts up
  prefix?: string;        // "$"
  suffix?: string;        // "/mo"
  decimals?: number;
  delay?: number;         // frames
  highlight?: boolean;    // emerald-emphasized payoff card
  countDuration?: number; // seconds
}

export const StatCard: React.FC<StatCardProps> = ({
  theme, icon: Icon, label, value, prefix = '', suffix = '',
  decimals = 0, delay = 0, highlight = false, countDuration = 1.4,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance: snappy spring, slide from left + fade (combined properties).
  const p = springProgress(frame, fps, delay, 'snappy');
  const x = interpolate(p, [0, 1], [-70, 0]);
  const opacity = interpolate(p, [0, 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Velocity-proportional blur (lightweight motion blur): blur tracks |dx/frame|.
  const pPrev = springProgress(frame - 1, fps, delay, 'snappy');
  const xPrev = interpolate(pPrev, [0, 1], [-70, 0]);
  const velocity = Math.abs(x - xPrev);
  const blur = Math.min(velocity * 0.35, 6); // cap at 6px; 0 when settled

  // Continuous life: the payoff card breathes subtly once present.
  const lifeScale = highlight ? breathe(frame - delay, 0.01, 120) : 1;

  const current = countUp(frame, fps, value, delay, countDuration);
  const display = current.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const accent = theme.primary;

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${x}px) scale(${lifeScale})`,
        filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
        background: highlight ? SURFACE.emFill : SURFACE.cardFill,
        backgroundColor: highlight ? undefined : theme.card,
        border: `1px solid ${highlight ? SURFACE.emBorder : SURFACE.cardBorder}`,
        boxShadow: highlight ? SURFACE.emGlow : SURFACE.innerTopLight,
        borderRadius: 24,
        padding: 36,
        display: 'flex',
        alignItems: 'center',
        gap: 28,
      }}
    >
      {/* icon chip */}
      <div
        style={{
          width: 84,
          height: 84,
          borderRadius: 20,
          backgroundColor: hexToRgba(accent, highlight ? 0.18 : 0.12),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={40} color={accent} strokeWidth={2} />
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        {/* label — Geist Mono eyebrow */}
        <div
          style={{
            fontFamily: FONT.mono,
            ...TYPE.eyebrow,
            fontSize: 24,
            color: theme.textMuted,
            marginBottom: 12,
          }}
        >
          {label}
        </div>
        {/* value — Geist tabular */}
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 560,
            letterSpacing: TYPE.stat.letterSpacing,
            fontVariantNumeric: TYPE.stat.fontVariantNumeric,
            fontFeatureSettings: TYPE.stat.fontFeatureSettings,
            lineHeight: 1,
            fontSize: 78,
            color: highlight ? accent : theme.text,
          }}
        >
          {prefix}
          {display}
          {suffix ? (
            <span style={{ fontSize: 40, color: theme.textMuted, fontWeight: 500 }}>{suffix}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
};
