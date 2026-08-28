/**
 * engine/Background.tsx
 *
 * The background engine. Each reel picks one variant (seeded) so a batch of 90
 * never looks repetitive. All variants are frame-animated via Remotion's
 * useCurrentFrame (no CSS animations). Dark base per the design system:
 * bg #0a0a0a, near-white text. Colors pull from the active theme.
 */

import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, AbsoluteFill } from 'remotion';
import { Theme, hexToRgba } from '../theme/buildTheme';
import { SeededRandom } from './seed';

export type BackgroundVariant =
  | 'solid'
  | 'mesh'
  | 'grid'
  | 'noise'
  | 'sweep'
  | 'particles'
  | 'tron';

export const BACKGROUND_VARIANTS: BackgroundVariant[] = [
  'solid', 'mesh', 'grid', 'noise', 'sweep', 'particles', 'tron',
];

interface BgProps {
  variant: BackgroundVariant;
  theme: Theme;
  seed: number;
}

export const Background: React.FC<BgProps> = ({ variant, theme, seed }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const rng = new SeededRandom(seed + 7);

  const base: React.CSSProperties = { backgroundColor: theme.bg };

  switch (variant) {
    case 'mesh': {
      const drift = interpolate(frame, [0, durationInFrames], [0, 1]);
      const x1 = 30 + Math.sin(drift * Math.PI * 2) * 10;
      const y1 = 20 + Math.cos(drift * Math.PI * 2) * 8;
      const x2 = 70 - Math.sin(drift * Math.PI * 2) * 8;
      const y2 = 80 - Math.cos(drift * Math.PI * 2) * 10;
      return (
        <AbsoluteFill style={base}>
          <AbsoluteFill
            style={{
              background: `radial-gradient(60% 50% at ${x1}% ${y1}%, ${hexToRgba(theme.primary, 0.25)}, transparent 70%), radial-gradient(50% 40% at ${x2}% ${y2}%, ${hexToRgba(theme.accent, 0.18)}, transparent 70%)`,
            }}
          />
          <NoiseOverlay opacity={0.02} />
        </AbsoluteFill>
      );
    }
    case 'grid': {
      const shift = (frame * 0.3) % 60;
      return (
        <AbsoluteFill style={base}>
          <AbsoluteFill
            style={{
              backgroundImage: `linear-gradient(${theme.border} 1px, transparent 1px), linear-gradient(90deg, ${theme.border} 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
              backgroundPosition: `${shift}px ${shift}px`,
              opacity: 0.5,
            }}
          />
          <AbsoluteFill
            style={{
              background: `radial-gradient(70% 60% at 50% 40%, transparent, ${theme.bg} 85%)`,
            }}
          />
        </AbsoluteFill>
      );
    }
    case 'noise':
      return (
        <AbsoluteFill style={base}>
          <AbsoluteFill style={{ background: `radial-gradient(80% 60% at 50% 30%, ${hexToRgba(theme.primary, 0.12)}, transparent 75%)` }} />
          <NoiseOverlay opacity={0.05} />
        </AbsoluteFill>
      );
    case 'sweep': {
      const sweepY = interpolate(frame, [0, durationInFrames], [-height * 0.3, height * 1.3]);
      return (
        <AbsoluteFill style={base}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: sweepY,
              height: height * 0.5,
              background: `linear-gradient(180deg, transparent, ${hexToRgba(theme.primary, 0.18)}, transparent)`,
              filter: 'blur(40px)',
            }}
          />
          <NoiseOverlay opacity={0.02} />
        </AbsoluteFill>
      );
    }
    case 'particles': {
      const dots = Array.from({ length: 28 }).map((_, i) => {
        const px = rng.float(0, width);
        const py = rng.float(0, height);
        const speed = rng.float(0.2, 0.8);
        const size = rng.float(2, 5);
        const y = (py - frame * speed * 4) % height;
        const opacity = rng.float(0.15, 0.5);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: px,
              top: y < 0 ? y + height : y,
              width: size,
              height: size,
              borderRadius: '50%',
              backgroundColor: hexToRgba(theme.accent, opacity),
            }}
          />
        );
      });
      return (
        <AbsoluteFill style={base}>
          <AbsoluteFill style={{ background: `radial-gradient(60% 50% at 50% 50%, ${hexToRgba(theme.primary, 0.1)}, transparent 70%)` }} />
          {dots}
        </AbsoluteFill>
      );
    }
    case 'tron': {
      const shift = (frame * 0.6) % 80;
      return (
        <AbsoluteFill style={{ backgroundColor: '#04060a' }}>
          <AbsoluteFill
            style={{
              backgroundImage: `linear-gradient(${hexToRgba(theme.primary, 0.4)} 1px, transparent 1px), linear-gradient(90deg, ${hexToRgba(theme.primary, 0.4)} 1px, transparent 1px)`,
              backgroundSize: '80px 80px',
              backgroundPosition: `0 ${shift}px`,
              transform: 'perspective(500px) rotateX(60deg) scale(2)',
              transformOrigin: 'center bottom',
              opacity: 0.5,
            }}
          />
          <AbsoluteFill style={{ background: `linear-gradient(180deg, ${hexToRgba(theme.primary, 0.12)}, transparent 40%, transparent 60%, ${hexToRgba(theme.accent, 0.12)})` }} />
        </AbsoluteFill>
      );
    }
    case 'solid':
    default:
      return (
        <AbsoluteFill style={base}>
          <AbsoluteFill style={{ background: `radial-gradient(70% 55% at 50% 35%, ${hexToRgba(theme.primary, 0.08)}, transparent 80%)` }} />
        </AbsoluteFill>
      );
  }
};

const NoiseOverlay: React.FC<{ opacity: number }> = ({ opacity }) => (
  <AbsoluteFill
    style={{
      opacity,
      pointerEvents: 'none',
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
    }}
  />
);
