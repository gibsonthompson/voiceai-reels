/**
 * scripts/generate-voiceovers.mjs
 *
 * Build-time voiceover generation for reels. For every spec that has a
 * `voiceover` script, this calls ElevenLabs' text-to-speech WITH TIMESTAMPS
 * endpoint and writes two files into public/vo/<reel-id>/:
 *
 *   voice.mp3        — the narration audio (muxed into the MP4 at render)
 *   timing.json      — word-level timings derived from ElevenLabs' char
 *                      alignment, used to drive caption in/out frames so a
 *                      caption is on screen exactly while it is spoken.
 *
 * WHY THIS FIXES THE TIMING BUG: today captions use hardcoded inFrame/outFrame
 * (e.g. a summary line pinned on screen ~12s). Here, timing comes from the
 * actual spoken audio, so a line shows for exactly as long as it is narrated.
 *
 * Run (with tsx so it can import the .ts spec files):
 *   ELEVENLABS_API_KEY=... npx tsx scripts/generate-voiceovers.mjs
 * Options:
 *   --only reel-009-callflow   regenerate a single reel
 *   --force                    regenerate even if files already exist
 *
 * The ElevenLabs endpoint used:
 *   POST /v1/text-to-speech/{voice_id}/with-timestamps
 * It returns JSON: { audio_base64, alignment: { characters,
 *   character_start_times_seconds, character_end_times_seconds } }.
 * We save the audio and fold per-character times up into per-word/-sentence times.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { VOICES, pickVoice } from './voices.mjs';

// ── Config ───────────────────────────────────────────────────────────────
const API_KEY = process.env.ELEVENLABS_API_KEY;
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';
const FPS = 30;

const OUT_ROOT = path.resolve(process.cwd(), 'public', 'vo');

// ── Args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const force = args.includes('--force');

if (!API_KEY) {
  console.error('Missing ELEVENLABS_API_KEY env var.');
  process.exit(1);
}

// ── Load specs ───────────────────────────────────────────────────────────
// Run this via tsx so these .ts imports resolve:  npx tsx scripts/generate-voiceovers.mjs
const { BATCH_001 } = await import('../src/specs/batch-001.ts');
let specs = BATCH_001;
try {
  const b2 = await import('../src/specs/batch-002.ts');
  if (b2.BATCH_002) specs = specs.concat(b2.BATCH_002);
} catch { /* batch-002 optional */ }

if (only) specs = specs.filter((s) => s.id === only);

// ── Timing folding ───────────────────────────────────────────────────────
/** ElevenLabs per-char times → per-word times. */
function charTimesToWords(alignment, fps) {
  const chars = alignment.characters;
  const starts = alignment.character_start_times_seconds;
  const ends = alignment.character_end_times_seconds;

  const words = [];
  let cur = null;

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (/\s/.test(ch)) {
      if (cur) { words.push(cur); cur = null; }
      continue;
    }
    if (!cur) cur = { word: '', start: starts[i], end: ends[i] };
    cur.word += ch;
    cur.end = ends[i];
  }
  if (cur) words.push(cur);

  return words.map((w) => ({
    ...w,
    startFrame: Math.round(w.start * fps),
    endFrame: Math.round(w.end * fps),
  }));
}

/** Group words into caption lines by sentence boundaries. */
function wordsToCaptions(words) {
  const lines = [];
  let cur = null;
  for (const w of words) {
    if (!cur) cur = { text: '', inFrame: w.startFrame, outFrame: w.endFrame };
    cur.text += (cur.text ? ' ' : '') + w.word;
    cur.outFrame = w.endFrame;
    if (/[.!?]$/.test(w.word)) { lines.push(cur); cur = null; }
  }
  if (cur) lines.push(cur);
  return lines;
}

/**
 * Map per-BEAT durations by matching each beat's vo text to the spoken words.
 * We walk the words and split whenever we've consumed a beat's full vo text.
 * Returns an array of frame durations, one per beat (in beat order).
 */
function beatFrameDurations(beats, words, fps) {
  const durations = [];
  let wi = 0;
  for (const b of beats) {
    if (!b.vo) { durations.push(Math.round((b.minSeconds ?? 1.2) * fps)); continue; }
    const target = b.vo.replace(/\s+/g, ' ').trim().split(' ').length;
    const startFrame = words[wi]?.startFrame ?? 0;
    let consumed = 0;
    let endFrame = startFrame;
    while (wi < words.length && consumed < target) {
      endFrame = words[wi].endFrame;
      wi++; consumed++;
    }
    durations.push(Math.max(1, endFrame - startFrame));
  }
  return durations;
}

// ── ElevenLabs call ──────────────────────────────────────────────────────
async function synthesize(text, voice) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice.voiceId}/with-timestamps`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: voice.settings,
    }),
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`ElevenLabs ${resp.status}: ${errText}`);
  }
  return resp.json();
}

/** Build the full spoken script from a reel's beats (or options.voiceover). */
function scriptFor(spec) {
  if (spec.options?.voiceover) return spec.options.voiceover;
  const beats = spec.options?.beats;
  if (beats?.length) return beats.map((b) => b.vo).filter(Boolean).join(' ');
  return null;
}

// ── Main ─────────────────────────────────────────────────────────────────
let made = 0, skipped = 0, failed = 0;

for (const spec of specs) {
  const script = scriptFor(spec);
  if (!script || !script.trim()) continue;

  const dir = path.join(OUT_ROOT, spec.id);
  const mp3Path = path.join(dir, 'voice.mp3');
  const jsonPath = path.join(dir, 'timing.json');

  if (!force && fs.existsSync(mp3Path) && fs.existsSync(jsonPath)) { skipped++; continue; }

  try {
    const voice = pickVoice(spec);
    process.stdout.write(`Generating VO for ${spec.id} [${voice.label}]… `);
    const data = await synthesize(script.trim(), voice);

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(mp3Path, Buffer.from(data.audio_base64, 'base64'));

    const words = charTimesToWords(data.alignment, FPS);
    const captions = wordsToCaptions(words);
    const beats = spec.options?.beats ?? [];
    const beatFrames = beats.length ? beatFrameDurations(beats, words, FPS) : [];
    const durationFrames = words.length
      ? words[words.length - 1].endFrame + Math.round(0.4 * FPS)
      : 0;

    fs.writeFileSync(jsonPath, JSON.stringify({
      reelId: spec.id,
      fps: FPS,
      voice: voice.label,
      script: script.trim(),
      durationFrames,
      voBeatFrames: beatFrames,
      words,
      captions,
    }, null, 2));

    console.log(`ok (${captions.length} lines, ${durationFrames}f)`);
    made++;
  } catch (e) {
    console.log(`FAILED: ${e.message}`);
    failed++;
  }
}

console.log(`\nDone. ${made} generated, ${skipped} skipped (exist), ${failed} failed.`);
if (failed > 0) process.exit(1);