# VoiceAI Connect — Dashboard Source Files (reference for Remotion port)

Captured from the live agency app. These are the real Next.js client components.
**Reference only — never `import` these into `src/`.** Port surfaces into
`src/components/` as data-free, frame-animatable pieces (strip useAgency/useEffect/
fetch/localStorage/next Link/Image/font; replace data with props). StatCard.tsx is
the worked example.

| File | Surface | Key reel-usable elements |
|------|---------|--------------------------|
| analytics-page.tsx | Agency money dashboard | MRR / Total Earned / Pending Payout / Paying Clients stat cards, Revenue Over Time bar chart, Revenue by Plan, Recent Transactions — **source of truth for CounterHero** |
| dashboard-home-page.tsx | Agency home | Welcome, 3 stat cards, demo line card, signup link, recent clients |
| clients-page.tsx | Client roster | Client rows (logo initial, plan, calls, status badge), search/filter, Add Client CTA |
| client-detail-page.tsx | Client overview | AI Phone Number, Business Details, AI Prompt editor, Knowledge Base, Client Branding, Subscription, Call Usage |
| client-calls-page.tsx | Call history | Call rows w/ urgency color, language badge, duration |
| call-detail-page.tsx | Single call | AI Summary, Recording, Transcript, Contact/Call detail sidebar |
| client-facing-dashboard.tsx | White-label client view | Branded sidebar from brand color, stat cards, signup card |
| add-client-page.tsx | Onboarding form | Multi-section form + success state ("AI Phone Number provisioned", "7-Day Trial", "Welcome SMS Sent ✓") — **ideal for a 60s onboarding reel** |
| demo-phone-page.tsx | Demo line | Active demo card, demo call history, AudioPlayer, how-it-works |
| leads-page.tsx | Leads pipeline | Pipeline stat cards, CRM table, follow-up queue |
| lead-detail-page.tsx | Lead detail | Outreach Progress (email/sms/call counts), status buttons, sequence follow-up |
| lead-finder-page.tsx | Prospecting | Google Maps + Indeed search, fit-score badges, lead cards |
| new-lead-page.tsx | New lead form | Business/contact/deal form |
| branding-page.tsx | White-label branding config | Color pickers, Shuffle palette generator, live preview — mirrors theme/buildTheme |
| marketing-website-page.tsx | Agency marketing-site config | "Live" pulse badge + site-URL card, 3 marketing templates (Classic/Beside/Editorial) with mini wireframe previews, color-picker trio, embeddable Start-Free-Trial signup button, DNS config — **good for a "you get a whole website too" reseller reel** |
| outreach-page.tsx | Outreach template library | 3 type accents (email purple #a78bfa, sms cyan #22d3ee, call green #4ade80), locked-state "13 conversion-tested templates" 3-column grid (6 email / 3 SMS / 4 call), icon-chip rows w/ Default + Step badges — **the "done-for-you sales kit" proof** |
| template-editor-page.tsx | Template create/edit | Type selector, subject (email-only), body textarea (rows by type), variable groups (lead #34d399 / agency #60a5fa / dynamic #a78bfa) click-to-copy, context-aware tips |
| referrals-page.tsx | Referral program | 40% recurring commission hero, editable referral code/link, StatCard grid (Total Referrals / This Month / Lifetime / Available Balance — highlight at ≥$1k), payout via Stripe Connect, referrals + commission lists, 3-step How It Works — **second money-stat surface alongside analytics, great for a CounterHero variant** |
| ai-lab-page.tsx | AI Lab (live test playground) | Live browser test-call modal (LIVE/CONNECTING/ENDED states, mic/end buttons, timer), real-time transcript bubbles (AI vs caller), event log feed, voice selector grid w/ play buttons + ★recommended, model/temperature controls, system-prompt editor, knowledge-base editor (services/FAQs), packaged-receptionist industry grid — **the "build & ship an AI receptionist live" hero; the call modal + transcript is the single most demo-able surface** |
| industry-template-editor-page.tsx | Packaged-receptionist config | Per-industry default config (model/temp/greeting/voice/system-prompt/KB) new clients inherit at signup; sticky system-prompt editor, voice grid, Custom badge, `{businessName}` token — **"set it once, every client inherits it" leverage angle** |

## Theme system (ported to src/theme/buildTheme.ts)
- Hook `useTheme()` returns the token object; `buildTheme(mode, brand)` builds it.
- Default brand (GREEN): primary `#10b981`, secondary `#059669`, accent `#34d399`.
- Dark base: bg `#0a0a0a`, card `#111111`, text `#fafaf9`.
  Light base: bg `#f9fafb`, card `#ffffff`, text `#111827`.
- Tokens: bg, text, textMuted, textMuted4, border, borderSubtle, card, hover, active,
  input, inputBorder, primary, primary10/15/20/30/80, primaryText, secondary, accent,
  info*, warning*, error*, success*, sidebar*, isDark.
- Styling = layout utilities + inline `style={{}}` for every color.
- Icons = lucide-react.
- Internal plan names: starter/pro/growth. **Reels use marketing names: Free/Pro/Scale.**