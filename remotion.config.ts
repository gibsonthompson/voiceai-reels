import { Config } from '@remotion/cli/config';

// Per the established Remotion content-engine rules:
// - High render quality (CRF 18)
// - 1080x1920 (9:16) is set per-composition in Root.tsx
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setCrf(18);
// 4 suits a typical multi-core Mac/DO box. On a 1-core machine, override per-run
// with `--concurrency=1` or lower this value.
Config.setConcurrency(4);

export {};
