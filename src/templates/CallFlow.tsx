/**
 * templates/CallFlow.tsx — CONCEPT A, BEAT-DRIVEN (content sets the timing).
 *
 * This replaces the hardcoded-BEATS version. The reel's timeline now comes from
 * its beats (each beat's length = its voiceover audio length, or a reading-speed
 * estimate when VO isn't generated yet). The summary beat lasts exactly as long
 * as its narration — the ~13s dead hold is gone by construction.
 *
 * Three synced tracks per beat:
 *   - visual  : which product stage renders (ringing/live/summary/sms/cta)
 *   - vo      : spoken line (drives the beat's length; played via <Audio>)
 *   - caption : one on-screen phrase (from the beats, never echoing the vo)
 *
 * Beats + call content come from the spec:
 *   spec.options.beats      : BeatInput[]        (the aligned script)
 *   spec.options.callFlow   : CallFlowOptions    (the product data shown)
 *   spec.options.voBeatFrames?: number[]         (real per-beat VO durations,
 *                              written by scripts/generate-voiceovers.mjs)
 *   spec.options.voiceover? : string             (presence → play the mp3)
 *
 * Falls back to sensible defaults if a spec omits beats, so it always renders.
 */

import React from 'react';
import {
  AbsoluteFill,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from 'remotion';
import {
  ArrowRight, User, Phone, MapPin, AlertCircle,
} from 'lucide-react';
import { Theme } from '../theme/buildTheme';
import { ReelSpec } from '../specs/schema';
import { Background, BackgroundVariant } from '../engine/Background';
import { FONTS } from '../theme/fonts';
import { springProgress, drift } from '../engine/motion';
import {
  BeatInput, resolveBeats, beatsToCaptions,
} from '../engine/beatTimeline';
import { PhoneMockup } from '../components/dashboard/PhoneMockup';
import { IncomingCallScreen } from '../components/dashboard/IncomingCallScreen';
import { LiveCallScreen } from '../components/dashboard/LiveCallScreen';
import { AISummaryCard } from '../components/dashboard/AISummaryCard';
import { ContactDetailsCard, ContactRow } from '../components/dashboard/ContactDetailsCard';
import { SmsNotificationBanner } from '../components/dashboard/SmsNotificationBanner';
import { CaptionTrack } from '../components/CaptionTrack';

interface Props {
  spec: ReelSpec;
  theme: Theme;
  background: BackgroundVariant;
}

export interface CallFlowOptions {
  businessName: string;
  callerName: string;
  callerPhone: string;
  callerAddress: string;
  priority?: 'High' | 'Medium' | 'Normal';
  summary: string;
  smsApp?: string;
  smsBody: string;
}

const DEFAULT_CALL: CallFlowOptions = {
  businessName: 'Riverside Plumbing',
  callerName: 'John Carter',
  callerPhone: '(555) 218-4203',
  callerAddress: '4218 Oak Avenue',
  priority: 'High',
  summary:
    'John Carter called about a broken water heater at 4218 Oak Avenue. The AI booked a tech visit for tomorrow at 9 AM and texted confirmation.',
  smsApp: 'MESSAGES',
  smsBody:
    'New booked appointment. John Carter, water heater repair, tomorrow 9:00 AM. Full summary in your dashboard.',
};

/** Default aligned beats (used if a spec doesn't supply its own). */
const DEFAULT_BEATS: BeatInput[] = [
  { visual: 'ringing', vo: "A call comes into your client's business.", caption: 'Incoming call', minSeconds: 2.2 },
  { visual: 'live', vo: 'The AI picks up on the first ring, and talks like a real person.', caption: 'Sounds human', emphasis: ['human'], minSeconds: 3 },
  { visual: 'summary', vo: 'It answers the questions, books the job, and writes the whole summary itself.', caption: 'It does the work', emphasis: ['work'], minSeconds: 3.5 },
  { visual: 'sms', vo: 'Your client just gets the win as a text. They did nothing. You did nothing.', caption: 'Zero work for you', emphasis: ['zero'], minSeconds: 3 },
  { visual: 'cta', vo: "You keep the margin while it runs the front desk.", minSeconds: 2.4 },
];

/** How long the summary type-out should take, tied to summary length. */
function typeSecondsFor(summary: string, cps = 32): number {
  return summary.length / cps;
}

export const CallFlow: React.FC<Props> = ({ spec, theme, background }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cfg: CallFlowOptions = { ...DEFAULT_CALL, ...(spec.options?.callFlow ?? {}) };
  const beatInput: BeatInput[] = spec.options?.beats ?? DEFAULT_BEATS;
  const voBeatFrames: number[] | undefined = spec.options?.voBeatFrames;

  // Content-driven timeline. If real VO durations are present they set each
  // beat's length; else reading-speed estimate. Summary beat also honors the
  // type-out length so the animation always finishes inside its beat.
  const beatInputTimed = beatInput.map((b) =>
    b.visual === 'summary'
      ? { ...b, minSeconds: Math.max(b.minSeconds ?? 0, typeSecondsFor(cfg.summary) + 0.8) }
      : b,
  );
  const { beats } = resolveBeats(beatInputTimed, { fps, beatDurations: voBeatFrames });

  const beatOf = (v: BeatInput['visual']) => beats.find((b) => b.visual === v);
  const ring = beatOf('ringing');
  const live = beatOf('live');
  const summary = beatOf('summary');
  const sms = beatOf('sms');
  const cta = beatOf('cta');

  const captions = beatsToCaptions(beats);
  const hasVO = Boolean(spec.options?.voiceover);

  // ── Phone (beats ringing+live): visible until summary starts ──────────────
  const phoneWidth = 600;
  const ringStart = ring?.startFrame ?? 0;
  const liveStart = live?.startFrame ?? 90;
  const phoneEnd = summary?.startFrame ?? 210;

  const phoneInP = springProgress(frame, fps, ringStart, 'elegant');
  const phoneInOpacity = interpolate(phoneInP, [0, 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const phoneInTy = interpolate(phoneInP, [0, 1], [60, 0]);
  const phoneOutP = springProgress(frame, fps, phoneEnd, 'smooth');
  const phoneOutOpacity = interpolate(phoneOutP, [0, 1], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const phoneOutTx = interpolate(phoneOutP, [0, 1], [0, -260]);
  const phoneOutScale = interpolate(phoneOutP, [0, 1], [1, 0.9]);
  const driftXY = drift(frame - 30, 'y', 5, 160);
  const liveFade = interpolate(frame, [liveStart - 6, liveStart + 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // ── Summary beat ──────────────────────────────────────────────────────────
  const summaryStart = summary?.startFrame ?? 210;
  const summaryEnd = summary?.endFrame ?? 500;
  const contactStart = summaryStart + Math.round(fps * 1.2);
  const summaryExitP = springProgress(frame, fps, summaryEnd, 'smooth');
  const summaryExitOpacity = interpolate(summaryExitP, [0, 1], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const summaryExitTy = interpolate(summaryExitP, [0, 1], [0, -40]);

  const contactRows: ContactRow[] = [
    { icon: User, label: 'Caller', value: cfg.callerName },
    { icon: Phone, label: 'Phone', value: cfg.callerPhone, valueColor: theme.primary },
    { icon: MapPin, label: 'Address', value: cfg.callerAddress },
    {
      icon: AlertCircle, label: 'Priority', value: cfg.priority ?? 'Normal',
      valueColor: cfg.priority === 'High' ? '#ef4444' : cfg.priority === 'Medium' ? '#f59e0b' : theme.text,
    },
  ];

  // ── SMS beat ────────────────────────────────────────────────────────────
  const smsStart = sms?.startFrame ?? summaryEnd;
  const smsBannerStart = smsStart + Math.round(fps * 1.6);
  const smsPhoneP = springProgress(frame, fps, smsStart, 'elegant');
  const smsPhoneOpacity = interpolate(smsPhoneP, [0, 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const smsPhoneTy = interpolate(smsPhoneP, [0, 1], [60, 0]);
  const smsDriftStyle = drift(frame - smsStart, 'y', 4, 150);

  // ── CTA beat ──────────────────────────────────────────────────────────────
  const ctaStart = cta?.startFrame ?? smsStart + 180;
  const ctaP = springProgress(frame, fps, ctaStart, 'pop');
  const ctaOpacity = interpolate(ctaP, [0, 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ctaTy = interpolate(ctaP, [0, 1], [30, 0]);
  const ctaScale = interpolate(ctaP, [0, 1], [0.9, 1]);
  // SMS phone recedes when CTA lands
  const smsCtaDim = interpolate(frame, [ctaStart - 10, ctaStart + 20], [1, 0.32], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const smsCtaShiftY = interpolate(frame, [ctaStart, ctaStart + 40], [0, -80], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: theme.bg, color: theme.text, fontFamily: FONTS.body }}>
      <Background variant={background} theme={theme} seed={spec.seed} />

      {hasVO && <Audio src={staticFile(`vo/${spec.id}/voice.mp3`)} />}

      {/* BEATS ringing + live: the phone */}
      {frame < summaryStart && (
        <div
          style={{
            position: 'absolute', left: '50%', top: '50%',
            transform: `translate(-50%, -50%) translate(${phoneOutTx}px, ${phoneInTy}px) scale(${phoneOutScale})`,
            opacity: phoneInOpacity * phoneOutOpacity,
          }}
        >
          <PhoneMockup width={phoneWidth} perspective="subtle">
            <div style={{ position: 'absolute', inset: 0, opacity: 1 - liveFade }}>
              <IncomingCallScreen theme={theme} businessName={cfg.businessName} callerName={cfg.callerName} callerPhone={cfg.callerPhone} enterFrame={ringStart} phoneWidth={phoneWidth} />
            </div>
            <div style={{ position: 'absolute', inset: 0, opacity: liveFade }}>
              <LiveCallScreen theme={theme} businessName={cfg.businessName} callerName={cfg.callerName} enterFrame={liveStart} phoneWidth={phoneWidth} />
            </div>
          </PhoneMockup>
        </div>
      )}

      {/* BEAT summary */}
      {frame >= summaryStart - 10 && frame < summaryEnd + 30 && (
        <div
          style={{
            position: 'absolute', left: 60, right: 60, top: 280,
            opacity: summaryExitOpacity, transform: `translateY(${summaryExitTy}px)`,
            display: 'flex', flexDirection: 'column', gap: 36,
          }}
        >
          <AISummaryCard theme={theme} summary={cfg.summary} enterFrame={summaryStart} typeStartFrame={summaryStart + Math.round(fps * 0.9)} />
          <ContactDetailsCard theme={theme} rows={contactRows} enterFrame={contactStart} />
        </div>
      )}

      {/* BEAT sms (stays through CTA, dimmed) */}
      {frame >= smsStart - 10 && (
        <div
          style={{
            position: 'absolute', left: '50%', top: '50%',
            transform: `translate(-50%, -50%) translateY(${smsPhoneTy + smsCtaShiftY}px) ${smsDriftStyle.transform ?? ''}`,
            opacity: smsPhoneOpacity * smsCtaDim,
          }}
        >
          <PhoneMockup width={620} perspective="subtle">
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 150, color: '#fafaf9', fontFamily: FONTS.body }}>
              <span style={{ fontFamily: FONTS.mono, fontSize: 22, letterSpacing: '0.02em', color: 'rgba(250,250,249,0.62)' }}>Tuesday, June 9</span>
              <span style={{ fontFamily: FONTS.display, fontSize: 200, lineHeight: 1, letterSpacing: '-0.045em', marginTop: 8, color: '#fafaf9' }}>9:41</span>
              <div style={{ marginTop: 70, width: 540 }}>
                <SmsNotificationBanner theme={theme} app={cfg.smsApp ?? 'MESSAGES'} brand={cfg.businessName} body={cfg.smsBody} enterFrame={smsBannerStart} />
              </div>
            </div>
          </PhoneMockup>
        </div>
      )}

      {/* CAPTIONS — one phrase per beat, derived from the beats */}
      <CaptionTrack lines={captions} theme={theme} top={1660} />

      {/* BEAT cta */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        <div
          style={{
            opacity: ctaOpacity, transform: `translateY(${ctaTy}px) scale(${ctaScale})`,
            display: 'inline-flex', alignItems: 'center', gap: 18, padding: '26px 48px',
            borderRadius: 999, background: theme.primary, color: theme.primaryText,
            boxShadow: '0 30px 80px -20px rgba(74,234,188,0.45)',
          }}
        >
          <span style={{ fontFamily: FONTS.display, fontSize: 72, letterSpacing: '-0.03em', lineHeight: 1, textTransform: 'uppercase' }}>{spec.cta}</span>
          <ArrowRight size={48} strokeWidth={2.5} />
        </div>
        {spec.options?.ctaSubline && (
          <div style={{ opacity: ctaOpacity, transform: `translateY(${ctaTy}px)`, fontFamily: FONTS.body, fontSize: 34, color: theme.textMuted, textAlign: 'center', maxWidth: 900, lineHeight: 1.3 }}>
            {spec.options.ctaSubline}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

/** Total frames this reel needs — call from Root's calculateMetadata. */
export function callFlowDurationInFrames(spec: ReelSpec, fps: number): number {
  const cfg: CallFlowOptions = { ...DEFAULT_CALL, ...(spec.options?.callFlow ?? {}) };
  const beatInput: BeatInput[] = spec.options?.beats ?? DEFAULT_BEATS;
  const timed = beatInput.map((b) =>
    b.visual === 'summary'
      ? { ...b, minSeconds: Math.max(b.minSeconds ?? 0, cfg.summary.length / 32 + 0.8) }
      : b,
  );
  const { totalFrames } = resolveBeats(timed, { fps, beatDurations: spec.options?.voBeatFrames });
  return totalFrames + Math.round(fps * 0.6); // small tail
}