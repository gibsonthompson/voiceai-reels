/**
 * templates/CallFlow.tsx — CONCEPT A, redesigned (the real product flow).
 *
 * Replaces the rejected chat-log CallModal demo. Shows the actual product moment
 * the agency owner (reseller's client) cares about:
 *
 *   1. RINGING            — phone shows the incoming call
 *   2. AI ON CALL         — brief, voice-waveform pulsing, AI handles it
 *   3. SUMMARY MATERIALIZES — the real AI Summary card + Contact Details slide in
 *                              and the AI-written summary types out word-by-word
 *   4. SMS LANDS          — phone returns in lockscreen view; iOS-style
 *                              notification drops in: the owner gets the win as a text
 *   5. CTA                — clean pill, no eyebrow tag-along
 *
 * Three rules (set with Gibson, do not break):
 *   - No eyebrow / mono-uppercase top-of-frame kicker (the AI tell).
 *   - Real product UI ports — every surface comes from `source-dashboards`.
 *   - Asymmetric, ONE dominant element per beat. No symmetric stat grids.
 */

import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Sequence,
} from 'remotion';
import {
  ArrowRight, User, Phone, MapPin, AlertCircle,
} from 'lucide-react';
import { Theme } from '../theme/buildTheme';
import { ReelSpec } from '../specs/schema';
import { Background, BackgroundVariant } from '../engine/Background';
import { FONTS } from '../theme/fonts';
import { springProgress, drift } from '../engine/motion';
import { PhoneMockup } from '../components/dashboard/PhoneMockup';
import { IncomingCallScreen } from '../components/dashboard/IncomingCallScreen';
import { LiveCallScreen } from '../components/dashboard/LiveCallScreen';
import { AISummaryCard } from '../components/dashboard/AISummaryCard';
import { ContactDetailsCard, ContactRow } from '../components/dashboard/ContactDetailsCard';
import { SmsNotificationBanner } from '../components/dashboard/SmsNotificationBanner';
import { CaptionTrack, CaptionLine } from '../components/CaptionTrack';

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

const DEFAULTS: CallFlowOptions = {
  businessName: 'Riverside Plumbing',
  callerName: 'John Carter',
  callerPhone: '(555) 218-4203',
  callerAddress: '4218 Oak Avenue',
  priority: 'High',
  summary:
    'John Carter called about a broken water heater at 4218 Oak Avenue. The AI scheduled a tech visit for tomorrow at 9:00 AM and texted confirmation.',
  smsApp: 'MESSAGES',
  smsBody:
    'New booked appointment — John Carter, water heater repair, tomorrow 9:00 AM. Full summary in your dashboard.',
};

// ─── Beat timings (frames @ 30fps) ────────────────────────────────────────
// 0     90      210                    600        790     900
// │ring │ live  │ summary materializes │ sms lands │ CTA   │
// └── 3s ┴─ 4s ─┴───────── 13s ────────┴──── 6.3s ─┴─ 3.7s ┘
const BEATS = {
  ringingIn: 0,
  ringingOut: 90,
  liveIn: 90,
  liveOut: 210,
  summaryIn: 210,
  summaryTypeStart: 250,
  contactIn: 360,
  summaryOut: 600,
  smsPhoneIn: 600,
  smsBannerIn: 660,
  smsOut: 790,
  ctaIn: 790,
};

export const CallFlow: React.FC<Props> = ({ spec, theme, background }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const cfg = { ...DEFAULTS, ...(spec.options?.callFlow ?? {}) };

  // ─── Captions (sound-off narration, beat-synced) ─────────────────────────
  const captions: CaptionLine[] = spec.options?.captions ?? [
    { text: "A call comes into your client's business.", inFrame: 28, outFrame: 84,  emphasis: [] },
    { text: 'Your white-label AI answers in one ring.',   inFrame: 110, outFrame: 200, emphasis: ['white-label'] },
    { text: 'It captures everything. Writes the summary.', inFrame: 235, outFrame: 590, emphasis: ['summary'] },
    { text: 'Your client gets the win as a text.',         inFrame: 660, outFrame: 770, emphasis: ['text'] },
  ];

  // ─── BEAT 1+2: phone holds the incoming + live call ──────────────────────
  // Single phone position used for beats 1 + 2. Slides out left during 3.
  const phoneWidth = 600;
  const phoneOutP = springProgress(frame, fps, BEATS.liveOut, 'smooth');
  const phoneOutOpacity = interpolate(phoneOutP, [0, 1], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const phoneOutTx = interpolate(phoneOutP, [0, 1], [0, -260]);
  const phoneOutScale = interpolate(phoneOutP, [0, 1], [1, 0.9]);
  const phoneInP = springProgress(frame, fps, BEATS.ringingIn, 'elegant');
  const phoneInOpacity = interpolate(phoneInP, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const phoneInTy = interpolate(phoneInP, [0, 1], [60, 0]);
  const driftXY = drift(frame - 30, 'y', 5, 160);

  // Resolve incoming → live transition: cross-fade at frame 90.
  const liveFade = interpolate(frame, [BEATS.liveIn - 6, BEATS.liveIn + 14], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // ─── BEAT 3: summary + contact details ──────────────────────────────────
  const summaryExitP = springProgress(frame, fps, BEATS.summaryOut, 'smooth');
  const summaryExitOpacity = interpolate(summaryExitP, [0, 1], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const summaryExitTy = interpolate(summaryExitP, [0, 1], [0, -40]);

  const contactRows: ContactRow[] = [
    { icon: User,        label: 'Caller',   value: cfg.callerName },
    { icon: Phone,       label: 'Phone',    value: cfg.callerPhone, valueColor: theme.primary },
    { icon: MapPin,      label: 'Address',  value: cfg.callerAddress },
    {
      icon: AlertCircle,
      label: 'Priority',
      value: cfg.priority ?? 'Normal',
      valueColor:
        cfg.priority === 'High' ? '#ef4444' :
        cfg.priority === 'Medium' ? '#f59e0b' :
        theme.text,
    },
  ];

  // ─── BEAT 4: phone w/ SMS banner ────────────────────────────────────────
  const smsPhoneP = springProgress(frame, fps, BEATS.smsPhoneIn, 'elegant');
  const smsPhoneOpacity = interpolate(smsPhoneP, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const smsPhoneTy = interpolate(smsPhoneP, [0, 1], [60, 0]);
  // Phone dims (but stays visible) when CTA pops, recedes upward to make room.
  const smsCtaDim = interpolate(
    frame,
    [BEATS.ctaIn - 10, BEATS.ctaIn + 20],
    [1, 0.32],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const smsCtaShiftY = interpolate(
    frame,
    [BEATS.ctaIn, BEATS.ctaIn + 40],
    [0, -80],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const smsDriftStyle = drift(frame - BEATS.smsPhoneIn, 'y', 4, 150);

  // ─── BEAT 5: CTA ────────────────────────────────────────────────────────
  const ctaP = springProgress(frame, fps, BEATS.ctaIn, 'pop');
  const ctaOpacity = interpolate(ctaP, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const ctaTy = interpolate(ctaP, [0, 1], [30, 0]);
  const ctaScale = interpolate(ctaP, [0, 1], [0.9, 1]);

  return (
    <AbsoluteFill style={{ background: theme.bg, color: theme.text, fontFamily: FONTS.body }}>
      <Background variant={background} theme={theme} seed={spec.seed} />

      {/* ─── BEATS 1 + 2: Phone with incoming → live call ────────────────────── */}
      {frame < BEATS.summaryIn && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) translate(${phoneOutTx}px, ${phoneInTy + (driftXY.transform?.includes('translateY') ? 0 : 0)}px) scale(${phoneOutScale})`,
            opacity: phoneInOpacity * phoneOutOpacity,
          }}
        >
          <PhoneMockup width={phoneWidth} perspective="subtle">
            {/* incoming under live */}
            <div style={{ position: 'absolute', inset: 0, opacity: 1 - liveFade }}>
              <IncomingCallScreen
                theme={theme}
                businessName={cfg.businessName}
                callerName={cfg.callerName}
                callerPhone={cfg.callerPhone}
                enterFrame={BEATS.ringingIn}
                phoneWidth={phoneWidth}
              />
            </div>
            <div style={{ position: 'absolute', inset: 0, opacity: liveFade }}>
              <LiveCallScreen
                theme={theme}
                businessName={cfg.businessName}
                callerName={cfg.callerName}
                enterFrame={BEATS.liveIn}
                phoneWidth={phoneWidth}
              />
            </div>
          </PhoneMockup>
        </div>
      )}

      {/* ─── BEAT 3: Summary + Contact details ─────────────────────────────── */}
      {frame >= BEATS.summaryIn - 10 && frame < BEATS.summaryOut + 30 && (
        <div
          style={{
            position: 'absolute',
            left: 60,
            right: 60,
            top: 280,
            opacity: summaryExitOpacity,
            transform: `translateY(${summaryExitTy}px)`,
            display: 'flex',
            flexDirection: 'column',
            gap: 36,
          }}
        >
          <AISummaryCard
            theme={theme}
            summary={cfg.summary}
            enterFrame={BEATS.summaryIn}
            typeStartFrame={BEATS.summaryTypeStart}
          />
          <ContactDetailsCard
            theme={theme}
            rows={contactRows}
            enterFrame={BEATS.contactIn}
          />
        </div>
      )}

      {/* ─── BEAT 4 + 5 BG: SMS notification on a lockscreen phone (stays through CTA) ─── */}
      {frame >= BEATS.smsPhoneIn - 10 && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) translateY(${smsPhoneTy + smsCtaShiftY}px) ${smsDriftStyle.transform ?? ''}`,
            opacity: smsPhoneOpacity * smsCtaDim,
          }}
        >
          <PhoneMockup width={620} perspective="subtle">
            {/* Lockscreen — large time + date, banner drops over */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingTop: 150,
                color: '#fafaf9',
                fontFamily: FONTS.body,
              }}
            >
              <span
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 22,
                  letterSpacing: '0.02em',
                  color: 'rgba(250,250,249,0.62)',
                }}
              >
                Tuesday, June 9
              </span>
              <span
                style={{
                  fontFamily: FONTS.display,
                  fontSize: 200,
                  lineHeight: 1,
                  letterSpacing: '-0.045em',
                  marginTop: 8,
                  color: '#fafaf9',
                }}
              >
                9:41
              </span>

              {/* Notification banner */}
              <div style={{ marginTop: 70, width: 540 }}>
                <SmsNotificationBanner
                  theme={theme}
                  app={cfg.smsApp ?? 'MESSAGES'}
                  brand={cfg.businessName}
                  body={cfg.smsBody}
                  enterFrame={BEATS.smsBannerIn}
                />
              </div>
            </div>
          </PhoneMockup>
        </div>
      )}

      {/* ─── CAPTIONS — sound-off narration across beats 1–4 ─────────────── */}
      <CaptionTrack lines={captions} theme={theme} top={1660} />

      {/* ─── BEAT 5: CTA ───────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 200,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <div
          style={{
            opacity: ctaOpacity,
            transform: `translateY(${ctaTy}px) scale(${ctaScale})`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 18,
            padding: '26px 48px',
            borderRadius: 999,
            background: theme.primary,
            color: theme.primaryText,
            boxShadow: '0 30px 80px -20px rgba(74,234,188,0.45)',
          }}
        >
          <span
            style={{
              fontFamily: FONTS.display,
              fontSize: 72,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              textTransform: 'uppercase',
            }}
          >
            {spec.cta}
          </span>
          <ArrowRight size={48} strokeWidth={2.5} />
        </div>
        {spec.options?.ctaSubline && (
          <div
            style={{
              opacity: ctaOpacity,
              transform: `translateY(${ctaTy}px)`,
              fontFamily: FONTS.body,
              fontSize: 34,
              color: theme.textMuted,
              textAlign: 'center',
              maxWidth: 900,
              lineHeight: 1.3,
            }}
          >
            {spec.options.ctaSubline}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
