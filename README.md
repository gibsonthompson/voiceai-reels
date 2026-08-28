# VoiceAI Connect — Reels Engine

Spec-driven [Remotion](https://remotion.dev) project for mass-producing 9:16
Instagram Reels that sell VoiceAI Connect to **agency operators/resellers**.

One reusable project → batches of ~90 unique animated MP4s. Palette, background,
layout, and motion all vary per reel via seeded specs.

## Quickstart

```bash
npm install
npm run dev          # opens Remotion Studio — preview reel-001, reel-002, reel-003
```

Render one reel:

```bash
npx remotion render reel-001 out/reel-001.mp4
```

Render the whole batch:

```bash
npm run render:all   # -> out/*.mp4
```

## What to read first

**`CLAUDE.md`** — full architecture, the reseller positioning, the hard rules
(9:16 safe zones, frame-driven motion only, Free/Pro/Scale labels), and the
next-task list.

## Layout (short version)

- `src/specs/` — the ReelSpec contract + spec batches (author reels here)
- `src/theme/` — ported dashboard theme engine + palette library
- `src/engine/` — seeded RNG, motion presets, background engine, renderer
- `src/templates/` — reel templates (CounterHero is the proof template)
- `src/components/` — reusable animated pieces (SafeFrame, StatCard)
- `source-dashboards/` — real dashboard source, **reference only** (never imported)

## Status

- Theme engine, palette library, seed engine, motion presets, background engine:
  built.
- Proof template **CounterHero** (reseller-money stat hero): built, 3 example specs.
- Remaining templates + 90-spec batch + more surface ports: see CLAUDE.md §6.
