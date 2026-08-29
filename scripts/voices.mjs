/**
 * scripts/voices.mjs
 *
 * The voiceover voice roster. Rotates a small set of ElevenLabs voices so 90
 * reels don't sound like one narrator reading a list. Each reel's angle maps to
 * a voice vibe; the generator picks the voice by the reel's `voiceAngle`
 * (falls back to a deterministic rotation by reel id).
 *
 * Voice IDs below are real ElevenLabs default voice IDs (verified across two
 * references). ADAM IS EXCLUDED (too generic). These are starting picks —
 * audition and swap any voiceId for a better one from the Voice Library.
 *
 * NOTE: ElevenLabs Default voices are scheduled to expire Dec 31 2026. Before
 * then, adopt a Voice Library voice you like and paste its ID here so the roster
 * doesn't break. Community/Professional-clone voices are unaffected.
 *
 * Marketing setting from 2026 research: stability 0.5–0.65 (lower = more natural
 * variation, "delivered not read").
 */

export const VOICES = {
  authority: {
    // Antoni — well-rounded professional male, best for B2B/commercial.
    // FOMO / "you're falling behind" reels.
    voiceId: 'ErXwobaYiN019PkySvjV',
    label: 'Antoni (authority)',
    settings: { stability: 0.55, similarity_boost: 0.75, style: 0.25, use_speaker_boost: true },
  },
  peer: {
    // Josh — deep, clear "knowledgeable peer" male. Margin / opportunity reels.
    voiceId: 'TxGEqnHWrfWFTfGW9XjX',
    label: 'Josh (peer)',
    settings: { stability: 0.6, similarity_boost: 0.75, style: 0.2, use_speaker_boost: true },
  },
  clear: {
    // Rachel — clear, warm American female. Product-explainer / white-label.
    voiceId: '21m00Tcm4TlvDq8ikWAM',
    label: 'Rachel (clear)',
    settings: { stability: 0.55, similarity_boost: 0.75, style: 0.2, use_speaker_boost: true },
  },
};

/** Map a reel's angle → voice vibe. */
export const ANGLE_VOICE = {
  'zero-work-margin': 'peer',
  'agency-fomo': 'authority',
  'white-label': 'clear',
  'speed-to-revenue': 'authority',
  'missed-call-leak': 'peer',
  'sounds-human': 'clear',
  'never-misses': 'authority',
};

/** Deterministic fallback rotation if a reel has no angle. */
const ROTATION = ['peer', 'authority', 'clear'];

export function pickVoice(spec) {
  const angle = spec.options?.voiceAngle;
  const vibe = (angle && ANGLE_VOICE[angle])
    || ROTATION[hashId(spec.id) % ROTATION.length];
  return VOICES[vibe] || VOICES.peer;
}

function hashId(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffffff;
  return Math.abs(h);
}