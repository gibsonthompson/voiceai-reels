/**
 * components/CaptionTrack.tsx
 *
 * Sound-off captions for a reel. Picks the active line by current frame and
 * animates it in/out with a springed slide + fade. Designed to anchor near
 * the bottom of the safe zone where the CTA will eventually replace it.
 *
 * NOT an eyebrow kicker. Captions are mid-weight body type, sized for legibility
 * on a phone screen, with a soft dark background so they always read.
 */

import React from 'react';
import {
  useCurrentFrame, useVideoConfig, interpolate,
} from 'remotion';
import { Theme } from '../theme/buildTheme';
import { FONTS } from '../theme/fonts';
import { springProgress } from '../engine/motion';

export interface CaptionLine {
  text: string;
  /** Frame the caption animates in. */
  inFrame: number;
  /** Frame the caption animates out. */
  outFrame: number;
  /** Optional emerald-emphasized words (lowercased compare). */
  emphasis?: string[];
}

interface Props {
  lines: CaptionLine[];
  theme: Theme;
  /** Vertical position from top of frame (defaults to bottom safe zone). */
  top?: number;
  /** Max width of caption block. */
  maxWidth?: number;
}

const FADE_FRAMES = 14;

function renderWithEmphasis(text: string, emphSet: Set<string>, emColor: string) {
  if (emphSet.size === 0) return text;
  const tokens = text.split(/(\s+)/);
  return tokens.map((tok, i) => {
    if (/^\s+$/.test(tok)) return <React.Fragment key={i}>{tok}</React.Fragment>;
    const clean = tok.replace(/[.,!?:;]/g, '').toLowerCase();
    if (emphSet.has(clean)) {
      return (
        <span key={i} style={{ color: emColor }}>
          {tok}
        </span>
      );
    }
    return <React.Fragment key={i}>{tok}</React.Fragment>;
  });
}

export const CaptionTrack: React.FC<Props> = ({
  lines,
  theme,
  top = 1700,
  maxWidth = 960,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // pick the active line — the latest one whose [inFrame, outFrame+fade] still
  // contains the current frame
  const active = lines.find(
    (l) => frame >= l.inFrame - 4 && frame <= l.outFrame + FADE_FRAMES + 4,
  );
  if (!active) return null;

  const p = springProgress(frame, fps, active.inFrame, 'smooth');
  const inOpacity = interpolate(p, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const ty = interpolate(p, [0, 1], [22, 0]);
  const outOpacity = interpolate(
    frame,
    [active.outFrame, active.outFrame + FADE_FRAMES],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const opacity = Math.min(inOpacity, outOpacity);

  const emphSet = new Set((active.emphasis ?? []).map((s) => s.toLowerCase()));

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          maxWidth,
          opacity,
          transform: `translateY(${ty}px)`,
          padding: '18px 32px',
          borderRadius: 22,
          background: 'rgba(5,5,5,0.78)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 18px 50px -20px rgba(0,0,0,0.6)',
          fontFamily: FONTS.body,
          fontSize: 44,
          fontWeight: 500,
          lineHeight: 1.25,
          letterSpacing: '-0.012em',
          color: '#fafaf9',
          textAlign: 'center',
        }}
      >
        {renderWithEmphasis(active.text, emphSet, theme.primary)}
      </div>
    </div>
  );
};
