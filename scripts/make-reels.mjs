/**
 * scripts/make-reels.mjs
 * ONE command: specs → finished reels. Loads .env, generates any missing
 * voiceovers, then renders. Output MP4s land in out/<reel-id>.mp4.
 *
 *   npm run make-reels                          # generate + render EVERY spec
 *   npm run make-reels -- reel-009-callflow     # just one reel
 *   npm run make-reels -- reel-009-callflow --render-only   # skip VO gen
 *   npm run make-reels -- --vo-only             # just generate VO, no render
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const only = args.find((a) => !a.startsWith('--')) || null;

const OUT_DIR = path.resolve(process.cwd(), 'out');
fs.mkdirSync(OUT_DIR, { recursive: true });

function run(cmd, cmdArgs, label) {
  console.log(`\n▶ ${label}`);
  const res = spawnSync(cmd, cmdArgs, { stdio: 'inherit', shell: false });
  if (res.status !== 0) {
    console.error(`\n✖ ${label} failed (exit ${res.status}).`);
    process.exit(res.status ?? 1);
  }
}

if (!flags.has('--render-only') && !process.env.ELEVENLABS_API_KEY) {
  console.error(
    '\n✖ ELEVENLABS_API_KEY not found.\n' +
    '  Put it in a .env file at the project root:\n' +
    '    ELEVENLABS_API_KEY=sk_your_key_here\n'
  );
  process.exit(1);
}

if (!flags.has('--render-only')) {
  const voArgs = ['tsx', 'scripts/generate-voiceovers.mjs'];
  if (only) voArgs.push('--only', only);
  run('npx', voArgs, only ? `Generating voiceover for ${only}` : 'Generating voiceovers (all specs)');
}

if (flags.has('--vo-only')) {
  console.log('\n✔ Voiceovers done (--vo-only). Skipping render.');
  process.exit(0);
}

let ids = [];
if (only) {
  ids = [only];
} else {
  const list = spawnSync('npx', ['remotion', 'compositions', '--quiet'], { encoding: 'utf8', shell: false });
  ids = (list.stdout || '').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  if (!ids.length) {
    console.error('✖ Could not list compositions. Render one at a time: npm run make-reels -- <reel-id>');
    process.exit(1);
  }
}

for (const id of ids) {
  const outPath = path.join('out', `${id}.mp4`);
  run('npx', ['remotion', 'render', id, outPath], `Rendering ${id} → ${outPath}`);
}

console.log(`\n✔ Done. ${ids.length} reel(s) in ${OUT_DIR}`);