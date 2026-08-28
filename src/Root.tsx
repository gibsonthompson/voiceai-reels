/**
 * Root.tsx
 *
 * Registers one Remotion composition per ReelSpec. Each is 1080x1920 (9:16).
 * Duration = spec.durationInFrames or DEFAULTS.durationSeconds * fps.
 *
 * In Remotion Studio you'll see one entry per reel id. Render one with:
 *   npx remotion render reel-001 out/reel-001.mp4
 * Or render the whole batch with scripts/render-batch.mjs.
 */

import React from 'react';
import { Composition } from 'remotion';
import './theme/fonts'; // registers Geist + Geist Mono deterministically
import { ReelRenderer } from './engine/ReelRenderer';
import { ReelSpec, DEFAULTS } from './specs/schema';
import { BATCH_001 } from './specs/batch-001';
import { BATCH_002 } from './specs/batch-002';

const ALL_SPECS: ReelSpec[] = [...BATCH_001, ...BATCH_002];

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {ALL_SPECS.map((spec) => (
        <Composition
          key={spec.id}
          id={spec.id}
          component={ReelRenderer as React.FC<Record<string, unknown>>}
          durationInFrames={spec.durationInFrames ?? DEFAULTS.durationSeconds * DEFAULTS.fps}
          fps={DEFAULTS.fps}
          width={DEFAULTS.width}
          height={DEFAULTS.height}
          defaultProps={{ spec } as unknown as Record<string, unknown>}
        />
      ))}
    </>
  );
};
