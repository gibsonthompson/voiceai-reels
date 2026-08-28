/**
 * scripts/render-batch.mjs
 *
 * Renders every spec in the batch to out/<id>.mp4.
 * Usage: node scripts/render-batch.mjs
 *
 * For large batches (90), run on the DigitalOcean render box, not in chat.
 * This shells out to the Remotion CLI per composition so each MP4 is independent
 * and a failure on one doesn't kill the batch.
 */

import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

// Keep this list in sync with src/Root.tsx (or generate it).
const IDS = ['reel-001', 'reel-002', 'reel-003'];

mkdirSync('out', { recursive: true });

for (const id of IDS) {
  console.log(`\n=== Rendering ${id} ===`);
  try {
    execSync(`npx remotion render ${id} out/${id}.mp4`, { stdio: 'inherit' });
  } catch (e) {
    console.error(`!! ${id} failed:`, e.message);
  }
}
console.log('\nBatch complete. MP4s in ./out');
