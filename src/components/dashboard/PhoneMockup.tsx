/**
 * components/dashboard/PhoneMockup.tsx
 *
 * iOS-style phone chrome with rounded bezel, Dynamic Island, status bar.
 * Wraps any inner screen content (incoming-call UI, live-call UI, lockscreen
 * notification, etc.). Subtle 3D tilt for product-shot feel, multi-layer
 * shadow + emerald rim glow.
 *
 * Aspect tuned to a modern iPhone (~9:19.5). Set `width` — height derives.
 */

import React from 'react';
import { Wifi, BatteryFull, Signal } from 'lucide-react';
import { FONTS } from '../../theme/fonts';

interface Props {
  width: number;
  children: React.ReactNode;
  /** Time string shown in the status bar (e.g. "9:41"). */
  time?: string;
  /** Show the status bar overlay (signal/wifi/battery). Default true. */
  statusBar?: boolean;
  /** Slight 3D tilt. */
  perspective?: 'none' | 'subtle';
  /** Override interior background (defaults to brand ink). */
  screenBg?: string;
  /** Border / bezel color. */
  bezelColor?: string;
  /** Emerald rim glow color (CSS rgba). */
  glow?: string;
  style?: React.CSSProperties;
}

const PERSPECTIVE: Record<NonNullable<Props['perspective']>, string> = {
  none: 'none',
  subtle: 'perspective(1600px) rotateY(-2.5deg) rotateX(1.5deg)',
};

export const PhoneMockup: React.FC<Props> = ({
  width,
  children,
  time = '9:41',
  statusBar = true,
  perspective = 'subtle',
  screenBg = '#050505',
  bezelColor = '#0a0a0a',
  glow = 'rgba(74, 234, 188, 0.22)',
  style,
}) => {
  // iPhone proportions — 9:19.5
  const height = Math.round(width * (19.5 / 9));
  const bezel = Math.round(width * 0.022); // ~12px on a 540 phone
  const radius = Math.round(width * 0.13);
  const innerRadius = radius - bezel;
  const innerW = width - bezel * 2;
  const innerH = height - bezel * 2;

  const islandW = Math.round(width * 0.32);
  const islandH = Math.round(width * 0.075);
  const islandTop = Math.round(width * 0.026);

  // multi-layer shadow + emerald rim glow
  const boxShadow = [
    '0 1px 0 rgba(255,255,255,0.05) inset',
    '0 0 0 1.5px rgba(255,255,255,0.04)',
    '0 14px 40px -16px rgba(0,0,0,0.65)',
    '0 60px 140px -40px rgba(0,0,0,0.75)',
    `0 0 160px -10px ${glow}`,
  ].join(', ');

  return (
    <div
      style={{
        width,
        height,
        transform: PERSPECTIVE[perspective],
        transformStyle: 'preserve-3d',
        ...style,
      }}
    >
      {/* Outer bezel */}
      <div
        style={{
          width: '100%',
          height: '100%',
          background: bezelColor,
          borderRadius: radius,
          padding: bezel,
          boxShadow,
          position: 'relative',
        }}
      >
        {/* Inner screen */}
        <div
          style={{
            width: innerW,
            height: innerH,
            background: screenBg,
            borderRadius: innerRadius,
            overflow: 'hidden',
            position: 'relative',
            // edge highlight
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {/* Status bar */}
          {statusBar && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: Math.round(width * 0.11),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `0 ${Math.round(width * 0.08)}px`,
                zIndex: 10,
                pointerEvents: 'none',
                color: '#fafaf9',
                fontFamily: FONTS.body,
                fontSize: Math.round(width * 0.038),
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <span>{time}</span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: Math.round(width * 0.012),
                }}
              >
                <Signal size={Math.round(width * 0.038)} color="#fafaf9" />
                <Wifi size={Math.round(width * 0.04)} color="#fafaf9" />
                <BatteryFull size={Math.round(width * 0.05)} color="#fafaf9" />
              </div>
            </div>
          )}

          {/* Dynamic Island */}
          <div
            style={{
              position: 'absolute',
              top: islandTop,
              left: '50%',
              transform: 'translateX(-50%)',
              width: islandW,
              height: islandH,
              borderRadius: islandH,
              background: '#000',
              zIndex: 11,
              pointerEvents: 'none',
            }}
          />

          {/* Screen content */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
