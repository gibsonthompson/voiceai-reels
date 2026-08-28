/**
 * components/dashboard/DeviceFrame.tsx
 *
 * Frames a recreated dashboard surface as a "floating window" sitting in space.
 * Default: flat with multi-layer shadow + emerald glow + glass shine. Optional
 * subtle 3D tilt (`perspective` prop). Wraps any inner surface (e.g. CallModal).
 *
 * Per CLAUDE.md §6.3: "frame inside a phone/device frame or a floating browser
 * window… OR flat-and-large for clarity. The UI is the hero."
 * Going flat-and-large by default — the modal IS the demo.
 */

import React from 'react';

interface Props {
  width: number;
  height: number;
  children: React.ReactNode;
  perspective?: 'none' | 'subtle' | 'strong';
  glowColor?: string;   // emerald by default at the call site
  cardBg?: string;      // matches inner surface bg
  borderColor?: string;
  /** Extra style overrides for outer wrapper. */
  style?: React.CSSProperties;
}

const PERSPECTIVE_TRANSFORMS: Record<NonNullable<Props['perspective']>, string> = {
  none: 'none',
  subtle: 'perspective(1400px) rotateY(-3deg) rotateX(2deg)',
  strong: 'perspective(900px) rotateY(-8deg) rotateX(4deg)',
};

export const DeviceFrame: React.FC<Props> = ({
  width,
  height,
  children,
  perspective = 'none',
  glowColor = 'rgba(74, 234, 188, 0.18)',
  cardBg = '#0f0f0f',
  borderColor = 'rgba(255,255,255,0.08)',
  style,
}) => {
  const transform = PERSPECTIVE_TRANSFORMS[perspective];

  // Multi-layer shadow: tight rim + mid drop + ambient + emerald glow.
  const boxShadow = [
    '0 1px 0 rgba(255,255,255,0.06) inset',
    '0 0 0 1px rgba(0,0,0,0.6)',
    '0 10px 30px -10px rgba(0,0,0,0.6)',
    '0 50px 120px -30px rgba(0,0,0,0.7)',
    `0 0 140px -20px ${glowColor}`,
  ].join(', ');

  return (
    <div
      style={{
        width,
        height,
        transform,
        transformStyle: 'preserve-3d',
        ...style,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          background: cardBg,
          border: `1px solid ${borderColor}`,
          borderRadius: 28,
          overflow: 'hidden',
          position: 'relative',
          boxShadow,
        }}
      >
        {/* Glass shine — subtle highlight along the top edge */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 18%, rgba(255,255,255,0) 100%)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
        <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%' }}>
          {children}
        </div>
      </div>
    </div>
  );
};
