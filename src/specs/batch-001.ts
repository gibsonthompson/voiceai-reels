/**
 * specs/batch-001.ts
 *
 * Reel specs. Beat-driven templates (CallFlow, KineticStatement, ProductDemo)
 * carry `options.beats` + `options.voiceover`; the voiceover drives their timing
 * and plays as audio. Templates without beats render on their fixed timelines.
 */

import { ReelSpec } from './schema';

export const BATCH_001: ReelSpec[] = [
  {
    id: 'reel-001',
    seed: 1001,
    template: 'CounterHero',
    mode: 'dark',
    background: 'mesh',
    kicker: 'agency reseller math',
    hook: 'One $99 platform fee. 50 clients. You keep the rest.',
    beats: [],
    options: {
      stats: [
        { label: 'paying clients', value: 50 },
        { label: 'net margin / client', value: 137, prefix: '$' },
        { label: 'you keep, monthly', value: 6850, prefix: '$', highlight: true },
      ],
      payoff: { text: 'No per-client costs. No revenue share. Just margin.', emphasis: true },
    },
    cta: 'Start your agency',
    notes: 'Primary proof reel — clean 2-operand × equation = result.',
  },
  {
    id: 'reel-002',
    seed: 2002,
    template: 'CounterHero',
    mode: 'dark',
    background: 'grid',
    kicker: 'white-label AI phone answering',
    hook: "You're not building the AI. You're selling it.",
    beats: [],
    options: {
      stats: [
        { label: 'paying clients', value: 40 },
        { label: 'net margin / client', value: 137, prefix: '$' },
        { label: 'you keep, monthly', value: 5480, prefix: '$', highlight: true },
      ],
      payoff: { text: 'Keep 100% of the margin. Stripe Connect pays you direct.', emphasis: true },
    },
    cta: 'Your brand',
  },
  {
    id: 'reel-003',
    seed: 3003,
    template: 'CounterHero',
    mode: 'light',
    background: 'mesh',
    kicker: 'local businesses lose $500 / missed call',
    hook: 'Sell them 24/7 AI. Keep $137 per client.',
    beats: [],
    options: {
      stats: [
        { label: 'paying clients', value: 75 },
        { label: 'net margin / client', value: 137, prefix: '$' },
        { label: 'you keep, monthly', value: 10275, prefix: '$', highlight: true },
      ],
      payoff: { text: 'Same Pro plan. More clients. More margin.', emphasis: true },
    },
    cta: 'Launch this week',
  },
  {
    id: 'reel-004-statpunch',
    seed: 4004,
    template: 'StatPunch',
    mode: 'dark',
    background: 'sweep',
    kicker: 'monthly take-home',
    hook: 'Kept every month, after the $99 platform fee.',
    beats: [],
    options: {
      stats: [{ value: 6850, prefix: '$', suffix: '/mo', label: '50 clients × $137 net' }],
    },
    cta: 'Start your agency',
    notes: 'StatPunch reference — the scroll-stopper. One giant number.',
  },
  // ────────────────────────────────────────────────────────────────────────
  // reel-005 — ProductDemo (CONCEPT A) — BEAT-DRIVEN + VOICEOVER
  // ────────────────────────────────────────────────────────────────────────
  {
    id: 'reel-005-callmodal',
    seed: 5005,
    template: 'ProductDemo',
    mode: 'dark',
    background: 'mesh',
    kicker: 'live AI call · white-label for your agency',
    hook: 'One ring. AI books.',
    beats: [],
    options: {
      voiceAngle: 'zero-work-margin',
      voiceover:
        "Here's what happens when a call comes into your client's business. <break time=\"0.4s\" /> The A I picks up on the first ring. <break time=\"0.3s\" /> It has a real conversation, answers the questions, <break time=\"0.25s\" /> and books the job. <break time=\"0.5s\" /> You didn't lift a finger. <break time=\"0.4s\" /> Neither did your client. <break time=\"0.6s\" /> Your brand. <break time=\"0.35s\" /> Your client. <break time=\"0.35s\" /> Your margin.",
      beats: [
        { visual: 'hold', vo: "Here's what happens when a call comes into your client's business.", minSeconds: 3.2 },
        { visual: 'panel', vo: 'The A I picks up on the first ring. It has a real conversation, answers the questions, and books the job.', minSeconds: 8, tailSeconds: 0.6 },
        { visual: 'number', vo: "You didn't lift a finger. Neither did your client.", minSeconds: 3.2 },
        { visual: 'cta', vo: 'Your brand. Your client. Your margin.', minSeconds: 3 },
      ],
      ctaSubline: 'Your brand. Your client. Your margin.',
    },
    cta: 'Start your agency',
    notes: 'Concept A ProductDemo — beat-driven + voiceover.',
  },
  // ────────────────────────────────────────────────────────────────────────
  // reel-006 — ProductDemo variation: dental, different script (fixed timeline)
  // ────────────────────────────────────────────────────────────────────────
  {
    id: 'reel-006-callmodal-dental',
    seed: 6006,
    template: 'ProductDemo',
    mode: 'dark',
    background: 'grid',
    durationInFrames: 900,
    kicker: 'live AI call · white-label for your agency',
    hook: 'Calls answered. Appointments booked.',
    beats: [],
    options: {
      ctaSubline: 'One platform. Every industry. Your brand on it.',
      callScript: {
        clientName: 'Bright Smile Dental',
        connectingStart: 60,
        liveStart: 130,
        endedStart: 740,
        bookingStart: 660,
        bookingMessage: 'Thursday · 2:30 PM · Confirmation text sent',
        transcript: [
          { id: 't1', role: 'assistant', text: 'Hi, Bright Smile Dental. How can I help?',           startFrame: 165 },
          { id: 't2', role: 'user',      text: 'I need to schedule a cleaning.',                     startFrame: 270 },
          { id: 't3', role: 'assistant', text: 'I have Thursday at 2:30 PM open. Does that work?',   startFrame: 365 },
          { id: 't4', role: 'user',      text: 'Yeah, perfect.',                                     startFrame: 485 },
          { id: 't5', role: 'assistant', text: 'Booked. You will get a reminder the day before.',    startFrame: 555 },
        ],
        events: [
          { id: 'e1', type: 'dialing',      message: 'Calling Bright Smile Dental…', level: 'info',    atFrame: 65  },
          { id: 'e2', type: 'call-start',   message: 'Call connected',               level: 'success', atFrame: 130 },
          { id: 'e3', type: 'speech-start', message: 'Assistant speaking',           level: 'info',    atFrame: 170 },
          { id: 'e4', type: 'transcript',   message: 'Final transcript received',    level: 'info',    atFrame: 230 },
          { id: 'e5', type: 'speech-start', message: 'Assistant speaking',           level: 'info',    atFrame: 370 },
          { id: 'e6', type: 'transcript',   message: 'Final transcript received',    level: 'info',    atFrame: 515 },
          { id: 'e7', type: 'tool-call',    message: 'Tool: book_appointment',       level: 'info',    atFrame: 600 },
          { id: 'e8', type: 'booking',      message: 'Appointment booked · 2:30 PM', level: 'success', atFrame: 645 },
          { id: 'e9', type: 'call-end',     message: 'Call ended',                   level: 'info',    atFrame: 745 },
        ],
      },
    },
    cta: 'Start your agency',
    notes: 'ProductDemo variation — dental. Fixed-timeline (no voiceover yet).',
  },
  // ────────────────────────────────────────────────────────────────────────
  // reel-007 — KineticStatement (Concept B) — BEAT-DRIVEN + VOICEOVER
  // ────────────────────────────────────────────────────────────────────────
  {
    id: 'reel-007-kinetic-selling',
    seed: 7007,
    template: 'KineticStatement',
    mode: 'dark',
    background: 'mesh',
    kicker: 'the difference',
    hook: "You're not building the AI. You're selling it.",
    beats: [],
    options: {
      voiceAngle: 'agency-fomo',
      voiceover:
        "You're not building the AI. You're selling it. White-label. Your brand. Real margin.",
      beats: [
        { visual: 'statement', vo: "You're not building the AI.", caption: "YOU'RE NOT BUILDING THE AI.", minSeconds: 2 },
        { visual: 'statement', vo: "You're selling it.", caption: "YOU'RE SELLING IT.", emphasis: ['selling'], minSeconds: 1.8 },
        { visual: 'cta', vo: 'White-label. Your brand. Real margin.', minSeconds: 2.4 },
      ],
      emphasisWords: ['selling'],
      ctaSubline: 'White-label. Your brand. Real margin.',
    },
    cta: 'Start your agency',
    notes: 'Concept B — beat-driven + voiceover. Reseller framing.',
  },
  // ────────────────────────────────────────────────────────────────────────
  // reel-008 — KineticStatement — BEAT-DRIVEN + VOICEOVER
  // ────────────────────────────────────────────────────────────────────────
  {
    id: 'reel-008-kinetic-friday',
    seed: 8008,
    template: 'KineticStatement',
    mode: 'dark',
    background: 'sweep',
    kicker: 'no courses · no upsells · no guru nonsense',
    hook: 'Start an AI receptionist agency by Friday.',
    beats: [],
    options: {
      voiceAngle: 'speed-to-revenue',
      voiceover:
        'Start an AI receptionist agency this week. Pick a brand. Pick a plan. Go.',
      beats: [
        { visual: 'statement', vo: 'Start an AI receptionist agency this week.', caption: 'START AN AI AGENCY THIS WEEK.', emphasis: ['week'], minSeconds: 2.6 },
        { visual: 'cta', vo: 'Pick a brand. Pick a plan. Go.', minSeconds: 2.2 },
      ],
      emphasisWords: ['week'],
      ctaSubline: 'Pick a brand. Pick a plan. Go.',
    },
    cta: 'Start your agency',
    notes: 'Concept B — beat-driven + voiceover. Grounded speed angle (no cringe).',
  },
  // ────────────────────────────────────────────────────────────────────────
  // reel-009 — CallFlow (CONCEPT A) — BEAT-DRIVEN + VOICEOVER
  // ────────────────────────────────────────────────────────────────────────
  {
    id: 'reel-009-callflow',
    seed: 9009,
    template: 'CallFlow',
    mode: 'dark',
    background: 'mesh',
    hook: '',
    beats: [],
    options: {
      voiceAngle: 'zero-work-margin',
      voiceover:
        "A call comes into your client's business. The AI picks up on the first ring, and talks like a real person. It answers the questions, books the job, and writes the whole summary itself. Your client just gets the win as a text. They did nothing. You did nothing. You keep the margin while it runs the front desk.",
      beats: [
        { visual: 'ringing', vo: "A call comes into your client's business.", caption: 'Incoming call', minSeconds: 2.2 },
        { visual: 'live', vo: 'The AI picks up on the first ring, and talks like a real person.', caption: 'Sounds human', emphasis: ['human'], minSeconds: 3 },
        { visual: 'summary', vo: 'It answers the questions, books the job, and writes the whole summary itself.', caption: 'It does the work', emphasis: ['work'], minSeconds: 3.5 },
        { visual: 'sms', vo: 'Your client just gets the win as a text. They did nothing. You did nothing.', caption: 'Zero work for you', emphasis: ['zero'], minSeconds: 3 },
        { visual: 'cta', vo: 'You keep the margin while it runs the front desk.', minSeconds: 2.6 },
      ],
      ctaSubline: 'Your brand. Your client. Your margin.',
      callFlow: {
        businessName: 'Riverside Plumbing',
        callerName: 'John Carter',
        callerPhone: '(555) 218-4203',
        callerAddress: '4218 Oak Avenue',
        priority: 'High',
        summary:
          'John Carter called about a broken water heater at 4218 Oak Avenue. The AI scheduled a tech visit for tomorrow at 9:00 AM and texted confirmation.',
        smsApp: 'MESSAGES',
        smsBody:
          'New booked appointment — John Carter, water heater repair, tomorrow 9:00 AM. Full summary in dashboard.',
      },
    },
    cta: 'Start your agency',
    notes: 'Concept A beat-driven + voiceover. Timing derived from VO.',
  },
  // ════════════════════════════════════════════════════════════════════════
  // CallFlow industry variants (fixed-timeline, hardcoded captions — no VO yet)
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'reel-010-callflow-hvac',
    seed: 10010,
    template: 'CallFlow',
    mode: 'dark',
    background: 'grid',
    durationInFrames: 900,
    hook: '',
    beats: [],
    options: {
      ctaSubline: 'Same platform. Every industry.',
      callFlow: {
        businessName: 'AAA Heating & Cooling',
        callerName: 'Sarah Mitchell',
        callerPhone: '(555) 614-0288',
        callerAddress: '812 Linden Drive',
        priority: 'High',
        summary:
          'Sarah Mitchell called: furnace stopped overnight, house is cold. The AI scheduled an emergency tech visit for today at 11:00 AM and texted confirmation.',
        smsApp: 'MESSAGES',
        smsBody:
          'New emergency visit — Sarah Mitchell, no-heat call, today 11:00 AM. Tech dispatched, address sent.',
      },
      captions: [
        { text: "An emergency call hits your client's line.", inFrame: 28,  outFrame: 84,  emphasis: [] },
        { text: 'Your white-label AI answers in one ring.',     inFrame: 110, outFrame: 200, emphasis: ['white-label'] },
        { text: 'It captures the issue. Books the visit.',       inFrame: 235, outFrame: 590, emphasis: ['books'] },
        { text: 'Owner gets the booking as a text.',             inFrame: 660, outFrame: 770, emphasis: ['text'] },
      ],
    },
    cta: 'Start your agency',
    notes: 'CallFlow — HVAC emergency furnace.',
  },
  {
    id: 'reel-011-callflow-auto',
    seed: 11011,
    template: 'CallFlow',
    mode: 'dark',
    background: 'noise',
    durationInFrames: 900,
    hook: '',
    beats: [],
    options: {
      ctaSubline: 'Pick an industry. Pick a brand. Sell it.',
      callFlow: {
        businessName: "Mike's Auto Repair",
        callerName: 'David Park',
        callerPhone: '(555) 703-1149',
        callerAddress: 'Cedar & 4th — roadside',
        priority: 'High',
        summary:
          "David Park's car won't start at Cedar & 4th. The AI dispatched a tow truck, opened a work order for transmission inspection, and texted the ETA.",
        smsApp: 'MESSAGES',
        smsBody:
          'New roadside — David Park, car stalled at Cedar & 4th. Tow dispatched, ETA 35 min, work order opened.',
      },
      captions: [
        { text: 'A stranded driver calls in.',                     inFrame: 28,  outFrame: 84,  emphasis: [] },
        { text: 'Your AI picks up. No missed call. No lost lead.', inFrame: 110, outFrame: 200, emphasis: ['no'] },
        { text: 'It logs the job. Sends a tow.',                   inFrame: 235, outFrame: 590, emphasis: ['tow'] },
        { text: 'Owner sees it land. By text.',                    inFrame: 660, outFrame: 770, emphasis: ['text'] },
      ],
    },
    cta: 'Start your agency',
    notes: 'CallFlow — auto repair roadside dispatch.',
  },
  {
    id: 'reel-012-callflow-roofing',
    seed: 12012,
    template: 'CallFlow',
    mode: 'dark',
    background: 'mesh',
    durationInFrames: 900,
    hook: '',
    beats: [],
    options: {
      ctaSubline: 'Your brand. Your client. Real revenue.',
      callFlow: {
        businessName: 'TopShelf Roofing',
        callerName: 'Lisa Hernandez',
        callerPhone: '(555) 942-6037',
        callerAddress: '2107 Magnolia Court',
        priority: 'Medium',
        summary:
          'Lisa Hernandez called for an estimate after wind damage. The AI booked an on-site inspection for Friday at 1:00 PM and sent prep instructions.',
        smsApp: 'MESSAGES',
        smsBody:
          'New estimate — Lisa Hernandez, wind damage, Friday 1:00 PM. Address sent, prep notes attached.',
      },
      captions: [
        { text: 'A homeowner calls after the storm.', inFrame: 28,  outFrame: 84,  emphasis: [] },
        { text: 'Your AI handles the intake.',        inFrame: 110, outFrame: 200, emphasis: [] },
        { text: 'It scopes the job. Books the visit.', inFrame: 235, outFrame: 590, emphasis: ['books'] },
        { text: 'Owner gets the lead as a text.',      inFrame: 660, outFrame: 770, emphasis: ['lead'] },
      ],
    },
    cta: 'Start your agency',
    notes: 'CallFlow — roofing storm estimate.',
  },
  {
    id: 'reel-013-callflow-medspa',
    seed: 13013,
    template: 'CallFlow',
    mode: 'light',
    background: 'mesh',
    durationInFrames: 900,
    hook: '',
    beats: [],
    options: {
      ctaSubline: 'White-label. Your brand on every screen.',
      callFlow: {
        businessName: 'Glow Aesthetics',
        callerName: 'Jessica Lee',
        callerPhone: '(555) 488-2261',
        callerAddress: 'Walk-in consult',
        priority: 'Normal',
        summary:
          'Jessica Lee called for a first-time botox consultation. The AI booked her into the Thursday 4:30 PM slot and texted the new-patient intake form.',
        smsApp: 'MESSAGES',
        smsBody:
          'New consult — Jessica Lee, first-time botox, Thursday 4:30 PM. Intake form sent.',
      },
      captions: [
        { text: 'A new patient calls about a service.',        inFrame: 28,  outFrame: 84,  emphasis: [] },
        { text: 'Your AI answers in one ring.',                inFrame: 110, outFrame: 200, emphasis: [] },
        { text: 'It books. It sends intake. It logs the lead.', inFrame: 235, outFrame: 590, emphasis: ['books'] },
        { text: 'Owner sees the booking by text.',             inFrame: 660, outFrame: 770, emphasis: ['text'] },
      ],
    },
    cta: 'Start your agency',
    notes: 'CallFlow — med-spa consult, LIGHT mode variant.',
  },
  {
    id: 'reel-014-callflow-vet',
    seed: 14014,
    template: 'CallFlow',
    mode: 'dark',
    background: 'particles',
    durationInFrames: 900,
    hook: '',
    beats: [],
    options: {
      ctaSubline: 'One platform. Every kind of business.',
      callFlow: {
        businessName: 'Pawsitive Pet Hospital',
        callerName: 'Marcus Brown',
        callerPhone: '(555) 226-4081',
        callerAddress: 'Same-day appt requested',
        priority: 'High',
        summary:
          "Marcus Brown's dog stopped eating and is lethargic. The AI booked a same-day urgent slot at 3:15 PM and sent pre-visit instructions.",
        smsApp: 'MESSAGES',
        smsBody:
          'New urgent — Marcus Brown, dog lethargic, today 3:15 PM. Pre-visit instructions sent.',
      },
      captions: [
        { text: 'A worried pet owner calls in.',            inFrame: 28,  outFrame: 84,  emphasis: [] },
        { text: 'Your AI picks up before they can hang up.', inFrame: 110, outFrame: 200, emphasis: [] },
        { text: 'It triages. Books the same-day slot.',       inFrame: 235, outFrame: 590, emphasis: ['same-day'] },
        { text: 'Owner sees the booking as a text.',          inFrame: 660, outFrame: 770, emphasis: ['text'] },
      ],
    },
    cta: 'Start your agency',
    notes: 'CallFlow — vet same-day urgent.',
  },
  {
    id: 'reel-015-callflow-cleaning',
    seed: 15015,
    template: 'CallFlow',
    mode: 'dark',
    background: 'tron',
    durationInFrames: 900,
    hook: '',
    beats: [],
    options: {
      ctaSubline: 'Set up by Sunday. Selling by Monday.',
      callFlow: {
        businessName: 'Sparkle Clean Co.',
        callerName: 'Rachel Davis',
        callerPhone: '(555) 318-9047',
        callerAddress: '5840 Pinewood Lane',
        priority: 'Normal',
        summary:
          'Rachel Davis wants a quote for weekly recurring cleaning. The AI captured the square-footage, scheduled a walk-through for Saturday 10 AM, and texted the quote range.',
        smsApp: 'MESSAGES',
        smsBody:
          'New recurring quote — Rachel Davis, weekly cleaning, Saturday 10 AM walk-through. Quote range sent.',
      },
      captions: [
        { text: 'A recurring-revenue lead calls in.',            inFrame: 28,  outFrame: 84,  emphasis: ['recurring-revenue'] },
        { text: 'Your AI takes it. Without anyone in the office.', inFrame: 110, outFrame: 200, emphasis: [] },
        { text: 'It books a walk-through. Sends the quote.',        inFrame: 235, outFrame: 590, emphasis: ['quote'] },
        { text: 'Owner gets the lead delivered by text.',           inFrame: 660, outFrame: 770, emphasis: ['lead'] },
      ],
    },
    cta: 'Start your agency',
    notes: 'CallFlow — recurring residential cleaning quote.',
  },
  // ────────────────────────────────────────────────────────────────────────
  // KineticStatement variants (fixed-timeline — no VO yet)
  // ────────────────────────────────────────────────────────────────────────
  {
    id: 'reel-016-kinetic-yourbrand',
    seed: 16016,
    template: 'KineticStatement',
    mode: 'dark',
    background: 'sweep',
    durationInFrames: 510,
    hook: 'Their AI. Your brand. Your client.',
    beats: [],
    options: {
      emphasisWords: ['your'],
      ctaSubline: 'White-label everything. Keep the margin.',
    },
    cta: 'Start your agency',
    notes: 'Kinetic statement — the white-label ownership angle.',
  },
  {
    id: 'reel-017-kinetic-noupsell',
    seed: 17017,
    template: 'KineticStatement',
    mode: 'dark',
    background: 'mesh',
    durationInFrames: 480,
    hook: 'No code. No setup. No upsell.',
    beats: [],
    options: {
      emphasisWords: ['no'],
      ctaSubline: 'Just a platform. Just a brand. Just margin.',
    },
    cta: 'Start your agency',
    notes: 'Kinetic statement — anti-guru framing.',
  },
  {
    id: 'reel-018-kinetic-everycall',
    seed: 18018,
    template: 'KineticStatement',
    mode: 'light',
    background: 'grid',
    durationInFrames: 510,
    hook: 'Every missed call. Captured. Booked. Paid.',
    beats: [],
    options: {
      emphasisWords: ['captured', 'booked', 'paid'],
      ctaSubline: 'One ring. The AI does the rest.',
    },
    cta: 'Start your agency',
    notes: 'Kinetic statement — value chain in three words, LIGHT mode.',
  },
  // ────────────────────────────────────────────────────────────────────────
  // Verification specs for the remaining templates (fixed-timeline)
  // ────────────────────────────────────────────────────────────────────────
  {
    id: 'reel-050-beforeafter',
    seed: 50050,
    template: 'BeforeAfter',
    mode: 'dark',
    background: 'mesh',
    durationInFrames: 900,
    hook: '',
    beats: [],
    options: {
      ctaSubline: 'Your client. Your brand. Your margin.',
      beforeAfter: {
        businessName: 'Riverside Plumbing',
        callerName: 'John Carter',
        callerPhone: '(555) 218-4203',
        aftermath: 'Captured. Booked. Text sent.',
        beforeWord: 'MISSED.',
        afterWord: 'ANSWERED.',
        missedAt: '4:47 PM',
      },
    },
    cta: 'Start your agency',
    notes: 'BeforeAfter verification spec.',
  },
  {
    id: 'reel-051-statementstack',
    seed: 51051,
    template: 'StatementStack',
    mode: 'dark',
    background: 'mesh',
    durationInFrames: 900,
    hook: '',
    beats: [],
    options: {
      ctaSubline: 'A platform, not a course. Not a guru.',
      statements: [
        { text: "You're not building the AI.", emphasis: ['building'] },
        { text: "You're selling it.",          emphasis: ['selling'] },
        { text: 'You keep the margin.',        emphasis: ['margin'] },
      ],
    },
    cta: 'Start your agency',
    notes: 'StatementStack verification spec — 3 progressive claims.',
  },
  {
    id: 'reel-052-dashboard',
    seed: 52052,
    template: 'DashboardShowcase',
    mode: 'dark',
    background: 'mesh',
    durationInFrames: 900,
    hook: '',
    beats: [],
    options: {
      ctaSubline: 'Every client. Every call. In one place.',
      dashboardShowcase: {
        variant: 'calls',
        surfaceLabel: 'Recent Calls',
        brandName: 'Rivertown Digital',
        headline: 'YOUR CLIENT. YOUR DASHBOARD.',
      },
    },
    cta: 'Start your agency',
    notes: 'DashboardShowcase verification spec — calls variant.',
  },
];