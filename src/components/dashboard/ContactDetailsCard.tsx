/**
 * components/dashboard/ContactDetailsCard.tsx
 *
 * Faithful Remotion port of the Contact Details + Call Details sidebar cards
 * from source-dashboards/call-detail-page.tsx (lines 288-365). Each row is
 * an icon chip + label/value pair. Rows reveal staggered as the card enters.
 */

import React from 'react';
import { LucideIcon, User, Phone, MapPin, AlertCircle } from 'lucide-react';
import {
  useCurrentFrame, useVideoConfig, interpolate,
} from 'remotion';
import { Theme } from '../../theme/buildTheme';
import { FONTS } from '../../theme/fonts';
import { springProgress } from '../../engine/motion';

export interface ContactRow {
  icon: LucideIcon;
  label: string;
  value: string;
  /** Optional explicit color override for value (e.g. priority badge color). */
  valueColor?: string;
}

interface Props {
  theme: Theme;
  rows: ContactRow[];
  enterFrame: number;
  /** Per-row stagger in frames. Default 6 (per CLAUDE.md §4.3). */
  stagger?: number;
  width?: number;
  /** Card title shown at top. */
  title?: string;
}

const Row: React.FC<{
  row: ContactRow;
  delay: number;
  theme: Theme;
}> = ({ row, delay, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const Icon = row.icon;
  const p = springProgress(frame, fps, delay, 'snappy');
  const opacity = interpolate(p, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const tx = interpolate(p, [0, 1], [-16, 0]);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        opacity,
        transform: `translateX(${tx}px)`,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: theme.bg,
          border: `1px solid ${theme.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={24} color={theme.textMuted} strokeWidth={1.8} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 16,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: theme.textMuted4,
            fontWeight: 500,
          }}
        >
          {row.label}
        </span>
        <span
          style={{
            fontFamily: FONTS.body,
            fontSize: 28,
            fontWeight: 500,
            color: row.valueColor ?? theme.text,
            letterSpacing: '-0.005em',
          }}
        >
          {row.value}
        </span>
      </div>
    </div>
  );
};

export const ContactDetailsCard: React.FC<Props> = ({
  theme,
  rows,
  enterFrame,
  stagger = 6,
  width,
  title = 'Contact Details',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const p = springProgress(frame, fps, enterFrame, 'smooth');
  const opacity = interpolate(p, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const ty = interpolate(p, [0, 1], [40, 0]);

  return (
    <div
      style={{
        width: width ?? '100%',
        opacity,
        transform: `translateY(${ty}px)`,
        background: theme.card,
        border: `1px solid ${theme.border}`,
        borderRadius: 22,
        padding: '32px 36px 36px 36px',
        boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 30px 90px -30px rgba(0,0,0,0.55)',
        fontFamily: FONTS.body,
        color: theme.text,
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
      }}
    >
      <span
        style={{
          fontFamily: FONTS.body,
          fontSize: 30,
          fontWeight: 600,
          color: theme.text,
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </span>
      {rows.map((row, i) => (
        <Row key={i} row={row} delay={enterFrame + 8 + i * stagger} theme={theme} />
      ))}
    </div>
  );
};

// Re-export common icons for spec convenience.
export const ContactIcons = { User, Phone, MapPin, AlertCircle };
