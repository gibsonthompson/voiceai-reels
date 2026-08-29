/**
 * engine/useVoiceover.ts
 *
 * Loads a reel's generated voiceover timing (public/vo/<id>/timing.json) at
 * render time using Remotion's delayRender/continueRender so the data is ready
 * before the frame is drawn. Returns the per-beat durations + caption spans +
 * whether an mp3 exists.
 *
 * If no timing file exists yet (reel not generated), returns nulls and the
 * template falls back to reading-speed estimates — so it always renders.
 *
 * Generation is done by scripts/generate-voiceovers.mjs, which writes:
 *   voBeatFrames : number[]  — real per-beat VO durations (frames)
 *   captions     : {text,inFrame,outFrame}[]
 *   words        : {...}
 */

import { useEffect, useState } from 'react';
import { staticFile, delayRender, continueRender } from 'remotion';

export interface VoiceoverTiming {
  reelId: string;
  fps: number;
  voice?: string;
  script: string;
  durationFrames: number;
  voBeatFrames: number[];
  words: { word: string; start: number; end: number; startFrame: number; endFrame: number }[];
  captions: { text: string; inFrame: number; outFrame: number }[];
}

export interface LoadedVoiceover {
  timing: VoiceoverTiming | null;
  ready: boolean;
  hasAudio: boolean;
}

export function useVoiceover(reelId: string): LoadedVoiceover {
  const [timing, setTiming] = useState<VoiceoverTiming | null>(null);
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender(`vo-${reelId}`));

  useEffect(() => {
    let cancelled = false;
    const url = staticFile(`vo/${reelId}/timing.json`);
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        setTiming(data as VoiceoverTiming | null);
        setReady(true);
        continueRender(handle);
      })
      .catch(() => {
        if (cancelled) return;
        setReady(true);
        continueRender(handle);
      });
    return () => { cancelled = true; };
  }, [reelId, handle]);

  return { timing, ready, hasAudio: Boolean(timing) };
}