/**
 * scripts/generate-voiceovers.mjs
 * For every spec with a voiceover/beats, calls ElevenLabs /with-timestamps and
 * writes public/vo/<id>/voice.mp3 + timing.json. Voice + tuned settings from voices.mjs.
 *
 *   npm run make-reels -- <reel-id>
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pickVoice, MODEL_ID } from './voices.mjs';

const API_KEY = process.env.ELEVENLABS_API_KEY;
const FPS = 30;
const OUT_ROOT = path.resolve(process.cwd(), 'public', 'vo');

const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const force = args.includes('--force');

if (!API_KEY) {
  console.error('Missing ELEVENLABS_API_KEY env var.');
  process.exit(1);
}

const { BATCH_001 } = await import('../src/specs/batch-001.ts');
let specs = BATCH_001;
try {
  const b2 = await import('../src/specs/batch-002.ts');
  if (b2.BATCH_002) specs = specs.concat(b2.BATCH_002);
} catch { /* optional */ }

if (only) specs = specs.filter((s) => s.id === only);

function charTimesToWords(alignment, fps) {
  const chars = alignment.characters;
  const starts = alignment.character_start_times_seconds;
  const ends = alignment.character_end_times_seconds;
  const words = [];
  let cur = null;
  for (let i = 0; i < chars.length; i++) {
    if (/\s/.test(chars[i])) { if (cur) { words.push(cur); cur = null; } continue; }
    if (!cur) cur = { word: '', start: starts[i], end: ends[i] };
    cur.word += chars[i];
    cur.end = ends[i];
  }
  if (cur) words.push(cur);
  // Drop break-tag fragments so they don't become fake words in captions/timing.
  const clean = words.filter((w) => !/[<>]/.test(w.word) && !/^(break|time=|\/)$/i.test(w.word));
  return clean.map((w) => ({
    ...w,
    startFrame: Math.round(w.start * fps),
    endFrame: Math.round(w.end * fps),
  }));
}

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

/** Strip SSML break tags + collapse whitespace, for word counting only. */
function plainWords(text) {
  return text
    .replace(/<break[^>]*\/>/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function beatFrameDurations(beats, words, fps) {
  const durations = [];
  let wi = 0;
  for (const b of beats) {
    if (!b.vo) { durations.push(Math.round((b.minSeconds ?? 1.2) * fps)); continue; }
    const target = plainWords(b.vo).split(' ').filter(Boolean).length;
    const startFrame = words[wi]?.startFrame ?? 0;
    let consumed = 0, endFrame = startFrame;
    while (wi < words.length && consumed < target) { endFrame = words[wi].endFrame; wi++; consumed++; }
    durations.push(Math.max(1, endFrame - startFrame));
  }
  return durations;
}

async function synthesize(text, voice) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice.voiceId}/with-timestamps`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: {
        stability: voice.settings.stability,
        similarity_boost: voice.settings.similarity_boost,
        style: voice.settings.style,
        use_speaker_boost: voice.settings.use_speaker_boost,
        speed: voice.settings.speed,
      },
    }),
  });
  if (!resp.ok) throw new Error(`ElevenLabs ${resp.status}: ${await resp.text()}`);
  return resp.json();
}

function scriptFor(spec) {
  if (spec.options?.voiceover) return spec.options.voiceover;
  const beats = spec.options?.beats;
  if (beats?.length) return beats.map((b) => b.vo).filter(Boolean).join(' ');
  return null;
}

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
    process.stdout.write(`Generating VO for ${spec.id} [${voice.label} · stab ${voice.settings.stability} · speed ${voice.settings.speed}]… `);
    const data = await synthesize(script.trim(), voice);

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(mp3Path, Buffer.from(data.audio_base64, 'base64'));

    const words = charTimesToWords(data.alignment, FPS);
    const captions = wordsToCaptions(words);
    const beats = spec.options?.beats ?? [];
    const voBeatFrames = beats.length ? beatFrameDurations(beats, words, FPS) : [];
    const durationFrames = words.length ? words[words.length - 1].endFrame + Math.round(0.4 * FPS) : 0;

    fs.writeFileSync(jsonPath, JSON.stringify({
      reelId: spec.id, fps: FPS, voice: voice.label,
      settings: voice.settings, script: script.trim(),
      durationFrames, voBeatFrames, words, captions,
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