# CLAUDE.md — VoiceAI Connect Reels Engine

A **Remotion project** for producing animated, vertical (9:16) Instagram Reels that
sell **VoiceAI Connect** to **resellers / agency operators**. The reels are of two
kinds (§6): (A) **real product demos** — the actual dashboard / AI-Lab call UI
animating, with bold text overlays — and (B) **pure kinetic typography** — massive
bold statements, no UI. Reusable UI *elements* are built once; each *reel* is a
bespoke composition (§3). Batches of ~90 MP4s. Brand-locked: emerald on dark or light,
a bold display face, no generic stat-card slop.

---

## 0. Who the reels are for (READ THIS FIRST)

The viewer is the **operator who resells the AI receptionist** to local service
businesses and keeps the margin — NOT the local business owner.

- The "$500 missed call" stat is **ammunition the operator closes with**, not the
  thing being sold to the viewer.
- Good hooks: "One $99 platform fee. 50 clients. You keep the margin.",
  "You're not building the AI. You're selling it.", "Start an AI receptionist
  agency by Friday."
- Bad hooks: anything addressed to "your business misses calls" as if the viewer
  is the local business.
- Secondary (do not exclude, but not primary): the make-money-online crowd.

## 1. On-screen plan labels (HARD RULE)

The dashboards use internal plan names `starter / pro / growth`. **Reels must show
the MARKETING names the prospect recognizes: `Free / Pro / Scale`.** Use
`PLAN_LABELS` / `PLAN_PRICING` from `src/specs/schema.ts`. Never surface
starter/pro/growth in a rendered reel.

**PRICING IS UNCONFIRMED — do not put it on screen until Gibson verifies it.**
Agency-tier pricing and team-member limits have been changing. The numbers below are
a working assumption, NOT confirmed fact. Do not render pricing into a reel until
Gibson confirms current figures. When unsure, keep pricing off the reel and drive to
the site.
- (assumed) Free: $0/mo + $29.99/client
- (assumed) Pro: $99/mo + $9.99/client  (most popular)
- (assumed) Scale: $499/mo + $0/client

## 2. Project layout (SYNCED to the real project — Aug 2026)

```
voiceai-reels/
├── CLAUDE.md                 ← you are here
├── package.json              (Remotion 4.0.472, React 18, lucide-react, @remotion/google-fonts)
├── remotion.config.ts        (CRF 18; fps pinned — see §4.7)
├── scripts/                  (render-batch etc.)
├── src/
│   ├── index.ts              (registerRoot)
│   ├── Root.tsx              (imports theme/fonts; one <Composition> per spec, 1080x1920)
│   ├── theme/
│   │   ├── tokens.ts         (★ BRAND SOURCE OF TRUTH — colors, type scale, motion, fonts)
│   │   ├── fonts.ts          (display + Geist Mono via @remotion/google-fonts)
│   │   ├── buildTheme.ts     (dark base #050505 / light #f7f7f5, emerald brand)
│   │   └── palettes.ts        (brand emerald only; dark + light — NOT a multi-hue rotation)
│   ├── engine/               (SeededRandom, motion presets, Background, ReelRenderer)
│   ├── lib/                  (helpers)
│   ├── components/
│   │   ├── dashboard/        ← THE REUSABLE PRODUCT-UI ELEMENTS (built — see §6.4)
│   │   │   ├── DeviceFrame.tsx        (phone/browser chrome, optional 3D perspective)
│   │   │   ├── PhoneMockup.tsx        (phone shell)
│   │   │   ├── CallModal.tsx          (AI-Lab call modal recreation)
│   │   │   ├── IncomingCallScreen.tsx (ringing state)
│   │   │   ├── LiveCallScreen.tsx     (in-call state)
│   │   │   ├── TranscriptBubble.tsx   (one chat bubble, typewriter)
│   │   │   ├── AISummaryCard.tsx      (post-call AI summary)
│   │   │   ├── ContactDetailsCard.tsx (captured-lead card)
│   │   │   └── SmsNotificationBanner.tsx (the "text I got 10s later" moment)
│   │   ├── CaptionTrack.tsx  (sound-off caption overlay)
│   │   ├── SafeFrame.tsx     (9:16 safe-zone wrapper)
│   │   ├── iconMap.ts        (IconName -> lucide component)
│   │   └── StatCard.tsx      (legacy — from the rejected concept; see §6.5)
│   ├── templates/            (COMPOSITIONS — see §3 for what "template" means here)
│   │   ├── ProductDemo.tsx        (Concept A — frames a dashboard element + overlays)
│   │   ├── CallFlow.tsx           (Concept A — the incoming→live→summary call story)
│   │   ├── KineticStatement.tsx   (Concept B — pure bold typography)
│   │   ├── CounterHero.tsx        (LEGACY, rejected — slated for removal, §6.5)
│   │   └── StatPunch.tsx          (LEGACY, rejected — slated for removal, §6.5)
│   └── specs/
│       ├── schema.ts          (ReelSpec, PLAN_LABELS, SAFE zones)
│       └── batch-001.ts       (specs — expand toward 90)
└── source-dashboards/        ← REAL Next.js dashboard source (REFERENCE ONLY, never import)
    └── _MANIFEST.md + 20 dashboard .tsx surfaces (ai-lab, analytics, leads, branding, etc.)
```

## 3. How the system works — ELEMENTS vs COMPOSITIONS (read carefully)

There are two very different things in this project, and conflating them is what
produced "templatey" reels before:

**ELEMENTS (reusable, build once, reuse everywhere).** These are the product-UI
pieces in `src/components/dashboard/` (CallModal, DeviceFrame, TranscriptBubble,
etc.) plus shared bits (CaptionTrack, CTA). They are locked, consistent building
blocks — the ONLY thing in this project that should feel "template-like." Build them
well once; reuse them across many reels.

**COMPOSITIONS (bespoke, built fresh per reel).** A reel is NOT a data-fill into a
fixed layout. Each reel is composed on purpose against the brand rules (§4, §5):
where the hook sits, how the UI is framed, the pacing, the pattern interrupt. Two
reels may both use the `CallModal` element but should be composed differently (scale,
crop, overlay position, timing) so they don't read as clones. Perfect is the
standard; not every one will be perfect, and that is the accepted trade for NOT
mass-producing 90 identical template fills.

The `templates/` folder is a misnomer to be aware of: `ProductDemo`, `CallFlow`,
`KineticStatement` are **composition families / starting scaffolds**, not molds. It
is fine for a spec to drive them, but variety must come from genuine compositional
choices, not just swapping text into the same frozen positions. When two reels in a
batch would look structurally identical, that is the failure state — vary the
composition.

Flow: a spec in `src/specs/` selects a composition family + the element(s) + the
copy + dark/light, and `Root.tsx` registers one `<Composition>` per spec at
1080x1920. `ReelRenderer` builds the theme and renders. **All animation is
frame-driven** (see §4).

## 4. MOTION QUALITY SYSTEM — the central quality control (READ BEFORE ANY REEL)

### 4.0 REQUIRED TOOLING — the official Remotion Agent Skill

Claude Code should have the official Remotion Agent Skills installed:
```bash
npx skills add remotion-dev/skills
```
They teach correct Remotion patterns so animations don't break during rendering.
This CLAUDE.md governs DESIGN + BRAND + ANTI-SLOP; the skill governs correct Remotion
mechanics (spring, interpolate, Sequence, staticFile, render flags). Use both.

### 4.1 WHAT "AI SLOP" IS — the patterns to detect and DESTROY

Slop is a specific, identifiable visual signature, not vague taste. AI converges on
these defaults; originality requires deliberately moving OFF them. If a reel has any
of these, it is slop:

**Layout slop**
- Everything centered or center-left in a single vertical column.
- Identical, evenly-spaced, evenly-sized rounded cards stacked in a list.
- Symmetric, "balanced" compositions with even margins all around.
- Equal visual weight everywhere → no focal point, no hierarchy.
- Generic SaaS dashboard card layout lifted from the last 5 years of web apps.

**Type slop**
- Neutral geometric/system sans for everything (Inter, Helvetica, system-ui, AND
  plain Geist used flat — they all read "default" at a glance).
- One font, one weight, similar sizes → no contrast, no point of view.
- Headlines that don't dominate; everything mid-sized and safe.

**Color/surface slop**
- Muted grays, a single accent, soft drop shadows, subtle gradients everywhere.
- Rounded corners on everything (a top AI tell).
- "Tasteful" low-contrast palettes that don't commit.

**Motion slop**
- Single-property fades. Elements that enter, sit perfectly still, then leave.
- Uniform timing — everything animates at the same speed/curve.
- "PowerPoint" feel: slide appears, holds, next slide. No overlap, no flow.
- Motion with no purpose — movement that doesn't direct the eye or carry meaning.

### 4.2 HOW TO NOT BE SLOP — the originality rules (DO THESE)

**Commit to a bold typographic POV (biggest single lever).** Neutral sans = slop.
Use type with a STANCE and extreme weight/size/width contrast:
- A massive, characterful DISPLAY face for hooks — ultra-bold or condensed-impact or
  extended-grotesque, set HUGE, tracking tight (-0.04 to -0.06em). Fill and bleed off
  the frame on purpose.
- Pair with Geist MONO for labels/eyebrows/figures (the sans+mono contrast is a real
  designed signal). Mono for all numbers/metadata.
- Hard size contrast: the hero element is 5–8× the label size. No mid-sized mush.
- See §5 for the exact font decision and the mandatory render-verify.

**Break the grid.** Asymmetry over symmetry. Off-center anchors. Type that runs off
an edge on purpose. Overlapping layers. Diagonal energy. One dominant focal element,
everything else subordinate.

**Commit to high contrast.** Emerald #4aeabc HARD against #050505 (or #f7f7f5). No
timid grays. Big blacks, big brights. Dramatic negative space, not "even."

**Earn every motion (Disney principles applied to type/graphics):**
- Anticipation → follow-through → settle. Arrive with weight, slight overshoot,
  settle. Never linear, never instant-and-static.
- Overlapping action: stagger so the next element starts before the prior settles.
- Fast = energy, slow = weight. Vary speed for meaning.
- Selective technique palette: 2–3 coordinated techniques per reel, repeated with
  discipline. No kitchen-sink.
- Continuous life: settled elements keep a subtle drift/breathe (drift()/breathe()).
- Motion serves the message: movement directs the eye to the next thing to read.

**Anchor to a reference, not an adjective.** "Modern/clean/professional" produces
slop. Build toward concrete references: the homepage's engineered density; editorial/
poster typography; the Linear / Vercel / Stripe school of high-contrast dark product
marketing. Art-direct toward a NAMED look, not a mood word.

### 4.3 The three causes of choppy motion (and the fixes)

1. **Never cap a spring with `durationInFrames`.** Capping fights the physics and
   produces an abrupt stop — reads as "choppy." Let `spring()` run free; tune feel via
   `config` (damping/stiffness/mass).
2. **Use the right spring presets** (in `engine/motion.ts`):
   - `snappy`   `{ damping: 26, stiffness: 200, mass: 0.6 }` — UI elements
   - `smooth`   `{ damping: 30, stiffness: 120, mass: 1 }`  — default entrances
   - `elegant`  `{ damping: 22, stiffness: 70,  mass: 1.4 }` — big hero text
   - `pop`      `{ damping: 14, stiffness: 260, mass: 0.8 }` — CTA / emphasis
   Never exceed ~32 damping (over-damped = lifeless).
3. **Stagger 5–8 frames between elements, NOT ~2.** ~2 frames is the #1 amateur tell.

### 4.4 Eliminate the "PowerPoint slideshow" feel

- **Nothing just sits there.** After entering, give elements subtle continuous life
  (slow drift ±4px, breathing scale 1.0→1.008, or parallax).
- **Entrances combine 2+ properties.** Never fade-only (fade+slide, scale+fade).
- **Overlap, don't queue.** Next element starts before the previous settles.
- **Follow-through.** `pop` overshoot on emphasis elements.

### 4.5 Motion blur (optional pro upgrade)

- `<CameraMotionBlur>` from `@remotion/motion-blur` on FAST travel moves only
  (slide-ins crossing >15% of screen), never on static text. Keep `samples` low
  (8–12). Inspect the output — it's destructive to color.

### 4.6 Type quality — the font is the #1 recurring failure

Treat the display font as **UNVERIFIED until a render proves it.** Past reels showed a
system-bold fallback (not the intended face), which is the main reason they looked
cheap. Do NOT assume the font is loading because the code imports it.

- **VERIFY BY RENDER:** after wiring/choosing a font, run
  `npx remotion still <reel-id> /tmp/font-check.png --frame=60` and LOOK at the PNG.
  Confirm the display face is the chosen face, not a fallback. If it falls back: check
  the @remotion/google-fonts import name matches the font exactly, that loadFont() ran
  before the first frame, and that the family string components use is the one
  loadFont() returned.
- **Hierarchy via contrast:** eyebrow (mono, small, muted) → hook (huge, bright) →
  body (medium, ~60% alpha). Flat sizing = amateur.
- **Weight:** hero display wants real presence (the face's bold/black weight), not a
  timid 400/500 at large sizes.
- **Tabular figures** (`fontVariantNumeric: 'tabular-nums'`) on every count-up.

### 4.7 Hard constraints

- **9:16 safe zones**: 150px top, 170px bottom, 60px sides. Use `SafeFrame`.
- **Minimum fonts**: headline ≥ 56px, body ≥ 36px, small labels ≥ 28px.
- **NO CSS animations/transitions.** Only `spring()` + `interpolate()` driven by
  `useCurrentFrame()`. CSS transitions do not exist during frame-by-frame render.
- **`extrapolateRight: 'clamp'`** on every `interpolate()`; `extrapolateLeft: 'clamp'`
  when delayed.
- **Hook lands fast** (< 1.5s). First thing on screen is the hook.
- **fps: pin it in ONE place** (`remotion.config.ts` / Root) and every spec inherits
  it. All frame-based timings assume that single fps. Do not mix fps across
  compositions or the stagger/timing math drifts. Render quality **CRF 18**.
- Design for **sound-off**: everything important is on-screen text (use CaptionTrack).

### 4.8 Workflow rule

- Test at half-res for speed: `npx remotion render <id> out.mp4 --scale=0.5`.
- Limit concurrent springs; memoize expensive per-frame calcs with `useMemo`.

## 5. Design system (`theme/tokens.ts` + `theme/fonts.ts`)

Scope note to avoid contradiction: **Concept A (product demos) = FAITHFUL** to the
real dashboard UI (recreate it accurately; the credibility IS the accuracy).
**Concept B (typography) = BOLDER than the website** (a scroll-stopping reel can push
harder than a calm marketing page). Apply the right rule to the right concept.

- **TYPOGRAPHY — the #1 quality lever and the #1 past failure.**
  - **Display / hero**: a HIGH-IMPACT face with character (Anton = ultra-condensed
    impact, Archivo/Archivo Black = extended grotesque, Bebas Neue = tall condensed,
    or a heavy grotesque). Set MASSIVE, tracking tight. Pick ONE and commit. This is
    Claude Code's call — try one, RENDER it, judge it, change it if weak (§4.6).
  - **Labels / eyebrows / numbers**: Geist Mono (uppercase, ~0.16em, 500).
  - **Body / supporting**: Geist sans is fine as support, never as the hero.
  - Inside a faithful product-UI recreation (Concept A), match the real dashboard's
    own type so it reads as the real product; the bold display face lives in the
    OVERLAY (hook/CTA), not inside the recreated UI.

- **Dark base**: bg `#050505`, card `#0f0f0f`, text `#fafaf9`.
- **Brand emerald is the ONLY color.** primary `#4aeabc`, secondary `#10b981`, accent
  `#6ee7b7`. The ONLY per-reel variation is dark (`#050505`) vs light (`#f7f7f5`,
  near-black text). No other hues.
- **High contrast; break the grid; use surfaces sparingly** (avoid the identical-
  stacked-rounded-card look).
- **Motion**: presets in `MOTION.SPRINGS`, 6–8f stagger, drift()/breathe() (§4).
- Styling: layout via inline fl/grid; **all colors via theme tokens**; type via the
  families from `theme/fonts.ts`. Icons via `lucide-react` (`components/iconMap.ts`).

## 6. WHAT THE REELS ARE (the two concepts)

Two concepts only: real PRODUCT DEMOS (A) and PURE TYPOGRAPHY (B).

### 6.1 The non-negotiable content framework (every reel)

**Hook → Problem → Solution → CTA.**
- **Hook lands < 1.5s** (early retention decides reach).
- **Under 30s** for cold audiences (15–30s sweet spot).
- **On-screen text always** (sound-off); the hook must work as text alone.
- **One pattern interrupt** mid-reel (a visual change) to hold retention.
- **CTA in the last ~2s**, never buried early.

### 6.2 Hook categories (from short-form research)

Top 3 = ~88% of hooks: Direct Address/Question (49%), Shock/Surprise (32%), Story
(7%). Both concepts can open with any; rotate 3–4 hook styles across a batch to avoid
fatigue. The PRODUCT DEMO (A) carries the most authority (real UI) and should be the
majority; typography (B) covers fast question/shock hooks and interludes.

### 6.3 The two concepts

#### CONCEPT A — PRODUCT DEMO / SHOWCASE (the main event, ~70%)

Show the REAL VoiceAI Connect product UI animating, with bold text overlays. Original
by definition — Gibson's actual screens, no competitor or template has them. "Watch
the AI answer a call" IS the product in one shot.

- The elements are already built in `src/components/dashboard/` (§6.4). Compose them
  into a reel: frame the UI in `DeviceFrame`/`PhoneMockup` (optional slight 3D
  perspective, layered shadows), play a SCRIPTED sequence on the timeline, overlay a
  bold hook + CTA (§5: overlay is bold display; recreated UI stays faithful).
- The flagship story (CallFlow): incoming call → CONNECTING → LIVE (pulse + timer) →
  transcript bubbles type in → captured lead / AISummaryCard → SmsNotificationBanner
  ("the text I got 10s later"). This single flow is the strongest demo.
- Other surfaces to dramatize later: analytics loading/counting, lead finder
  populating, white-label branding shuffle (the "your brand, not ours" reseller
  angle).
- Optional `AnimatedCursor` clicking buttons for an "operated" feel — sparing, real.
- The UI must DO something on a timeline — never a static screenshot.

#### CONCEPT B — PURE TYPOGRAPHY (interludes, ~30%)

No UI. Massive bold kinetic statements on emerald/dark (or light). Fast, scroll-
stopping, for hooks and one-liners. The bold display face does all the work (§5).
Word/line kinetic reveals, hard scale contrast, one idea per reel.

Both concepts obey §4 (anti-slop + motion) and §6.1 (framework).

### 6.4 Elements (built — reuse; do not rebuild per reel)

In `src/components/dashboard/`: `DeviceFrame`, `PhoneMockup`, `CallModal`,
`IncomingCallScreen`, `LiveCallScreen`, `TranscriptBubble`, `AISummaryCard`,
`ContactDetailsCard`, `SmsNotificationBanner`. Shared: `CaptionTrack`, `SafeFrame`,
`iconMap`. These are the locked reusable elements (§3). Improve them centrally; every
reel benefits. Add new surfaces (AnalyticsPanel, LeadFinderPanel, BrandingPanel) here
as data-free, props-driven recreations — never import from `source-dashboards/`.

### 6.5 Legacy / cleanup

- `templates/CounterHero.tsx`, `templates/StatPunch.tsx`, `components/StatCard.tsx`
  are from the REJECTED generic stat-card concept. Remove or ignore them; do not build
  new reels on them. (Left in the tree only until cleaned up.)

### 6.6 Anti-patterns (never do these — full list §4.1)

- The identical-stacked-rounded-card layout (rejected). 
- An element floating alone mid-frame with dead space (rejected StatPunch).
- Static screenshots pretending to be demos — the UI must move on a timeline.
- Single-property fades, uniform timing, PowerPoint holds (§4.4).
- Neutral system/Geist-flat font as the hero (§5). Bold display face only.
- Hook addressed to the local business instead of the RESELLER (§0).
- Two reels in a batch that are structurally identical (§3) — vary the composition.

## 7. Current state & next tasks (SYNCED — Aug 2026)

**Where this actually stands:** the engine works and the project is well past the old
rejected state. The reusable product-UI element library EXISTS in
`src/components/dashboard/` (CallModal, DeviceFrame, TranscriptBubble, LiveCallScreen,
IncomingCallScreen, AISummaryCard, ContactDetailsCard, SmsNotificationBanner,
PhoneMockup). Concept-aligned compositions exist (`ProductDemo`, `CallFlow`,
`KineticStatement`). Legacy rejected files (`CounterHero`, `StatPunch`, `StatCard`)
still sit in the tree and should be removed. Gibson's read on current output: "some
are decent, can be better" — so this is TUNING, not a rebuild.

**Priority order (verify every step by rendering — never judge from code):**
1. **Verify the font renders** (§4.6). Render a still, look at it, confirm the display
   face is real, not a fallback. This is the highest-leverage fix for "looks cheap."
2. **Tune the decent-but-not-great reels.** Against a rendered frame, fix: type
   weight/size hierarchy, spacing rhythm, and whether the composition breaks the grid
   or falls back to a centered column (§4.1/4.2). Small fixes, big payoff.
3. **Delete the legacy rejected files** (§6.5) so nobody builds on them.
4. **Lock CallFlow as the flagship Concept-A reel** — incoming→live→transcript→
   summary→SMS. Render, iterate, get it genuinely good. This is the make-or-break.
5. **Vary compositions across the batch** (§3) — ensure no two reels read as identical
   template fills. Rotate hook styles (§6.2), dark/light, framing, pacing.
6. **Confirm pricing (§1) before any reel shows numbers.**
7. **Scale specs toward 90** — mix Concept A (surface + script + overlay) and B
   (statement).

**Working method:** edit in place → render a still/clip → LOOK at the frame → fix →
repeat. Never declare done from code or tsc alone. Show rendered frames, not code,
when asking Gibson for a reaction.

## 8. Still owed / open items

- Confirm current agency pricing (§1) before it hits a rendered reel.
- Optional logos (SVG) if Gibson wants an "infrastructure assembles → VoiceAI Connect"
  Concept-B reel. Not a blocker.
- `source-dashboards/` is reference only — never `import` from it into `src/`.
- Render needs Chrome Headless Shell; auto-downloads on first `remotion` run.

## 9. Conventions Gibson expects

- Direct, technically precise, NO waffling or padding. He catches slop instantly.
- In Claude Code: edit files in place; do NOT hand him files to download/cp.
- Complete file outputs, not diffs, when files are shown.
- Git as one copy-paste block: `git add . && git commit -m "..." && git push`.
- macOS (MacBook Air): `sed -i ''` needs the empty-string arg.
- No em-dash (U+2014) in any on-screen copy, caption, or script (house style).
- Verify with real renders before declaring done. Show rendered frames, not code.