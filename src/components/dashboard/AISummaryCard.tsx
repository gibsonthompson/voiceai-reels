/**
 * components/dashboard/AISummaryCard.tsx
 *
 * Faithful Remotion port of the AI Summary card from
 * source-dashboards/call-detail-page.tsx (lines 247-260).
 *
 * Structure:
 *   [primary15 square w/ MessageSquare icon] [ "AI Summary" header ]
 *   [ summary paragraph that types in word-by-word                ]
 *
 * Frame-driven typewriter on the summary text. No CSS animations.
 */

import React from 'react';
import { MessageSquare } from 'lucide-react';
import {
  useCurrentFrame, useVideoConfig, interpolate,
} from 'remotion';
import { Theme } from '../../theme/buildTheme';
import { FONTS } from '../../theme/fonts';
import { springProgress } from '../../engine/motion';

interface Props {
  theme: Theme;
  summary: string;
  /** Frame the card enters. */
  enterFrame: number;
  /** Frame the typewriter starts. */
  typeStartFrame: number;
  /** Characters per second for typing. */
  charsPerSecond?: number;
  width?: number;
  /** Tiny header label on the corner — defaults to "AI SUMMARY". */
  label?: string;
}

export const AISummaryCard: React.FC<Props> = ({
  theme,
  summary,
  enterFrame,
  typeStartFrame,
  charsPerSecond = 32,
  width,
  label = 'AI Summary',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // entrance — combined slide + fade + scale
  const p = springProgress(frame, fps, enterFrame, 'elegant');
  const opacity = interpolate(p, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const ty = interpolate(p, [0, 1], [40, 0]);
  const scale = interpolate(p, [0, 1], [0.96, 1]);

  // typewriter
  const t = Math.max(0, (frame - typeStartFrame) / fps);
  const totalChars = summary.length;
  const charCount = Math.min(totalChars, Math.floor(t * charsPerSecond));
  const visible = summary.slice(0, charCount);
  const showCaret = charCount > 0 && charCount < totalChars;

  return (
    <div
      style={{
        width: width ?? '100%',
        opacity,
        transform: `translateY(${ty}px) scale(${scale})`,
        transformOrigin: 'center top',
        background: theme.card,
        border: `1px solid ${theme.border}`,
        borderRadius: 22,
        padding: '36px 42px 44px 42px',
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.04) inset, 0 30px 90px -30px rgba(0,0,0,0.55), 0 0 120px -20px rgba(74,234,188,0.16)',
        fontFamily: FONTS.body,
        color: theme.text,
      }}
    >
      {/* Header row: icon + AI Summary */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: theme.primary15,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `inset 0 1px 0 ${theme.primary15}`,
          }}
        >
          <MessageSquare size={30} color={theme.primary} strokeWidth={2.2} />
        </div>
        <span
          style={{
            fontFamily: FONTS.body,
            fontSize: 36,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: theme.text,
          }}
        >
          {label}
        </span>
      </div>

      {/* Summary body */}
      <p
        style={{
          marginTop: 28,
          marginBottom: 0,
          fontFamily: FONTS.body,
          fontSize: 38,
          lineHeight: 1.45,
          color: theme.text,
          fontWeight: 400,
          letterSpacing: '-0.005em',
          whiteSpace: 'pre-wrap',
        }}
      >
        {visible}
        {showCaret && (
          <span
            style={{
              opacity: 0.7,
              fontWeight: 500,
              color: theme.primary,
              marginLeft: 2,
            }}
          >
            ▍
          </span>
        )}
      </p>
    </div>
  );
};
