/**
 * components/SafeFrame.tsx
 *
 * Wraps reel content inside the 9:16 safe zones (150 top / 170 bottom / 60 sides).
 * Everything important lives inside this so nothing gets clipped by IG UI.
 */

import React from 'react';
import { AbsoluteFill } from 'remotion';
import { SAFE } from '../specs/schema';

export const SafeFrame: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <AbsoluteFill
    style={{
      paddingTop: SAFE.top,
      paddingBottom: SAFE.bottom,
      paddingLeft: SAFE.sides,
      paddingRight: SAFE.sides,
      display: 'flex',
      flexDirection: 'column',
      ...style,
    }}
  >
    {children}
  </AbsoluteFill>
);
