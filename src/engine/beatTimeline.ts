/**
 * engine/beatTimeline.ts
 *
 * Content-driven reel timing. THE fix for hardcoded frame constants and the
 * "text sits too long" dead zone.
 *
 * A reel is a list of BEATS laid end to end. Each beat bundles the three tracks
 * that must stay in sync:
 *   - visual  (which template stage renders: ringing / live / summary / sms / cta)
 *   - vo      (the spoken line for this beat)
 *   - caption (the on-screen text for this beat — may differ from vo, by design)
 *
 * A beat's DURATION is not hand-typed. It comes from the VO audio length for
 * that beat (from public/vo/<id>/timing.json, produced by generate-voiceovers).
 * If VO isn't generated yet, we fall back to a reading-speed estimate so the
 * reel still previews sanely. Either way: duration follows content, so the
 * summary beat lasts exactly as long as its narration — never 13 dead seconds.
 *
 * The generator (Option B) authors beats; this engine turns beat durations into
 * absolute frame ranges the template consumes. VO, captions, and visuals all
 * read the same ranges, so they cannot drift apart.
 */

export type BeatVisual =
  | 'ringing' | 'live' | 'summary' | 'sms' | 'cta'      // CallFlow stages
  | 'statement' | 'panel' | 'number' | 'split' | 'hold'; // other templates

export interface BeatInput {
  /** Which visual stage this beat shows. */
  visual: BeatVisual;
  /** Spoken line (drives duration via its VO audio). */
  vo?: string;
  /** On-screen caption for this beat. Omit to show none. */
  caption?: string;
  /** Lowercase words to emerald-emphasize in the caption. */
  emphasis?: string[];
  /** Minimum beat length in seconds (visual needs at least this even if VO short). */
  minSeconds?: number;
  /** Extra hold after the VO finishes, seconds (breathing room before next beat). */
  tailSeconds?: number;
}

export interface ResolvedBeat extends BeatInput {
  startFrame: number;
  endFrame: number;
  durationFrames: number;
  /** VO audio start within the reel (for the <Audio> offset), frames. */
  voStartFrame: number;
  voEndFrame: number;
}

export interface BeatTimingSource {
  /** Per-beat VO durations in frames, in beat order (from timing.json). */
  beatDurations?: number[];
  fps: number;
}

/** Reading-speed fallback when no VO audio yet: ~14 chars/sec, min 1.1s. */
function estimateFrames(text: string | undefined, fps: number, minSeconds: number): number {
  const secs = Math.max(minSeconds, (text?.length ?? 0) / 14);
  return Math.round(secs * fps);
}

/**
 * Lay beats end to end into absolute frame ranges. If beatDurations are
 * provided (real VO), they set the spoken length; otherwise we estimate. Each
 * beat = max(voLen, minSeconds) + tailSeconds.
 */
export function resolveBeats(
  beats: BeatInput[],
  src: BeatTimingSource,
): { beats: ResolvedBeat[]; totalFrames: number } {
  const { fps } = src;
  let cursor = 0;
  const out: ResolvedBeat[] = [];

  beats.forEach((b, i) => {
    const minS = b.minSeconds ?? 1.2;
    const tailS = b.tailSeconds ?? 0.35;
    const voLen = src.beatDurations?.[i] ?? estimateFrames(b.vo, fps, minS);
    const spoken = Math.max(voLen, Math.round(minS * fps));
    const tail = Math.round(tailS * fps);
    const duration = spoken + tail;

    out.push({
      ...b,
      startFrame: cursor,
      endFrame: cursor + duration,
      durationFrames: duration,
      voStartFrame: cursor,
      voEndFrame: cursor + voLen,
    });
    cursor += duration;
  });

  return { beats: out, totalFrames: cursor };
}

/** Find the beat active at a given frame. */
export function beatAt(beats: ResolvedBeat[], frame: number): ResolvedBeat | null {
  return beats.find((b) => frame >= b.startFrame && frame < b.endFrame) ?? null;
}

/** Local frame within a beat (0 at beat start). */
export function localFrame(beat: ResolvedBeat, frame: number): number {
  return frame - beat.startFrame;
}

/** Build CaptionLine[] straight from resolved beats (caption per beat). */
export function beatsToCaptions(beats: ResolvedBeat[]): {
  text: string; inFrame: number; outFrame: number; emphasis?: string[];
}[] {
  return beats
    .filter((b) => b.caption)
    .map((b) => ({
      text: b.caption!,
      inFrame: b.startFrame + 4,
      outFrame: b.voEndFrame > b.startFrame ? b.voEndFrame : b.endFrame - 4,
      emphasis: b.emphasis ?? [],
    }));
}