/**
 * components/dashboard/TranscriptBubble.tsx
 *
 * Single transcript bubble for the recreated CallModal.
 *  - role: 'assistant' = AI, left-aligned, Bot avatar, theme.hover bg
 *  - role: 'user'      = caller, right-aligned, User avatar, theme.primary bg
 *
 * Two animations driven by frame:
 *  - Bubble entrance: snappy spring (slide-in + fade) at startFrame
 *  - Text typewriter: chars reveal over typeDurationFrames after a small delay
 *
 * No CSS animations — only spring()/interpolate() (CLAUDE.md §4 / Remotion skill).
 */

import React from 'react';
import { Bot, User } from 'lucide-react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { Theme } from '../../theme/buildTheme';
import { FONTS } from '../../theme/fonts';
import { springProgress } from '../../engine/motion';

export interface TranscriptLine {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  startFrame: number;
  typeDurationFrames?: number;
}

interface Props {
  line: TranscriptLine;
  theme: Theme;
}

export const TranscriptBubble: React.FC<Props> = ({ line, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isUser = line.role === 'user';

  // entrance
  const p = springProgress(frame, fps, line.startFrame, 'snappy');
  const opacity = interpolate(p, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const tx = interpolate(p, [0, 1], [isUser ? 24 : -24, 0]);
  const ty = interpolate(p, [0, 1], [10, 0]);

  // typewriter — chars/second tuned for readability
  const charsPerSecond = 38;
  const defaultDur = Math.max(20, Math.ceil((line.text.length / charsPerSecond) * fps));
  const typeDur = line.typeDurationFrames ?? defaultDur;
  const typeStart = line.startFrame + 4;
  const t = Math.max(0, Math.min(1, (frame - typeStart) / typeDur));
  const charCount = Math.floor(t * line.text.length);
  const visible = line.text.slice(0, charCount);
  const showCaret = charCount > 0 && charCount < line.text.length;

  return (
    <div
      style={{
        display: 'flex',
        gap: 14,
        alignItems: 'flex-end',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        opacity,
        transform: `translate(${tx}px, ${ty}px)`,
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 11,
            background: theme.primary15,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Bot size={22} color={theme.primary} />
        </div>
      )}
      <div
        style={{
          maxWidth: '78%',
          background: isUser ? theme.primary : theme.hover,
          color: isUser ? theme.primaryText : theme.text,
          borderRadius: 24,
          borderBottomRightRadius: isUser ? 6 : 24,
          borderBottomLeftRadius: !isUser ? 6 : 24,
          padding: '16px 22px',
          fontFamily: FONTS.body,
          fontSize: 30,
          lineHeight: 1.35,
          fontWeight: 400,
          whiteSpace: 'pre-wrap',
        }}
      >
        {visible}
        {showCaret && (
          <span
            style={{
              opacity: 0.55,
              fontWeight: 500,
              marginLeft: 2,
            }}
          >
            ▍
          </span>
        )}
      </div>
      {isUser && (
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 11,
            background: 'rgba(255,255,255,0.07)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <User size={22} color={theme.textMuted} />
        </div>
      )}
    </div>
  );
};
