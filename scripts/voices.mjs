/**
 * scripts/voices.mjs
 * Voice roster + TUNED settings for natural (non-robotic) delivery.
 * Swap the voiceId values for voices you picked in the ElevenLabs Voice Library.
 * Keep the settings — they're tuned. Swap only the IDs.
 */

export const MODEL_ID = 'eleven_multilingual_v2';

export const VOICES = {
  authority: {
    voiceId: 'ErXwobaYiN019PkySvjV',
    label: 'authority',
    settings: {
      stability: 0.38,
      similarity_boost: 0.80,
      style: 0.22,
      use_speaker_boost: true,
      speed: 0.93,
    },
  },
  peer: {
    voiceId: 'TxGEqnHWrfWFTfGW9XjX',
    label: 'peer',
    settings: {
      stability: 0.42,
      similarity_boost: 0.78,
      style: 0.18,
      use_speaker_boost: true,
      speed: 0.94,
    },
  },
  clear: {
    voiceId: '21m00Tcm4TlvDq8ikWAM',
    label: 'clear',
    settings: {
      stability: 0.40,
      similarity_boost: 0.82,
      style: 0.15,
      use_speaker_boost: true,
      speed: 0.93,
    },
  },
};

export const ANGLE_VOICE = {
  'zero-work-margin': 'peer',
  'agency-fomo': 'authority',
  'white-label': 'clear',
  'speed-to-revenue': 'authority',
  'missed-call-leak': 'peer',
  'sounds-human': 'clear',
  'never-misses': 'authority',
};

const ROTATION = ['peer', 'authority', 'clear'];

export function pickVoice(spec) {
  const angle = spec.options?.voiceAngle;
  const vibe = (angle && ANGLE_VOICE[angle]) || ROTATION[hashId(spec.id) % ROTATION.length];
  return VOICES[vibe] || VOICES.peer;
}

function hashId(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffffff;
  return Math.abs(h);
}