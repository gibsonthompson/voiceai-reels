/**
 * Root.tsx
 *
 * Registers one Remotion composition per ReelSpec. Each is 1080x1920 (9:16).
 *
 * Duration resolution (per spec):
 *   1. spec.durationInFrames if explicitly set, else
 *   2. a content-driven duration for beat-driven templates (CallFlow,
 *      KineticStatement, ProductDemo) so the reel is exactly as long as its
 *      voiceover/beats need, else
 *   3. the default durationSeconds * fps.
 */

import React from 'react';
import { Composition } from 'remotion';
import './theme/fonts'; // registers fonts deterministically
import { ReelRenderer } from './engine/ReelRenderer';
import { ReelSpec, DEFAULTS } from './specs/schema';
import { BATCH_001 } from './specs/batch-001';
import { BATCH_002 } from './specs/batch-002';
import { callFlowDurationInFrames } from './templates/CallFlow';
import { kineticDurationInFrames } from './templates/KineticStatement';
import { productDemoDurationInFrames } from './templates/ProductDemo';

const ALL_SPECS: ReelSpec[] = [...BATCH_001, ...BATCH_002];

/** Resolve a spec's frame count: explicit → template-derived → default. */
function resolveDuration(spec: ReelSpec): number {
  if (spec.durationInFrames && spec.durationInFrames > 0) {
    return spec.durationInFrames;
  }
  if (spec.template === 'CallFlow') {
    return callFlowDurationInFrames(spec, DEFAULTS.fps);
  }
  if (spec.template === 'KineticStatement') {
    return kineticDurationInFrames(spec, DEFAULTS.fps);
  }
  if (spec.template === 'ProductDemo') {
    return productDemoDurationInFrames(spec, DEFAULTS.fps);
  }
  return DEFAULTS.durationSeconds * DEFAULTS.fps;
}

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {ALL_SPECS.map((spec) => (
        <Composition
          key={spec.id}
          id={spec.id}
          component={ReelRenderer as React.FC<Record<string, unknown>>}
          durationInFrames={resolveDuration(spec)}
          fps={DEFAULTS.fps}
          width={DEFAULTS.width}
          height={DEFAULTS.height}
          defaultProps={{ spec } as unknown as Record<string, unknown>}
        />
      ))}
    </>
  );
};