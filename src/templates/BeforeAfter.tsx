/**
 * templates/BeforeAfter.tsx — CONCEPT A (Concept A variant, CLAUDE.md §6.3)
 *
 * The comparison reel — "what happens without AI" vs "what happens with AI".
 * Not a flow like CallFlow. A hard-cut before/after that flips composition side:
 *
 *   Beat 1 (0..260)   TOP: huge red MISSED.  BELOW: missed-call lockscreen phone
 *   Beat 2 (260..340) flash-cut (full-frame emerald pulse) — the pivot
 *   Beat 3 (340..660) TOP: huge emerald ANSWERED.  BELOW: live-call phone
 *   Beat 4 (660..780) aftermath pill: "Captured. Booked. Text sent."
 *   Beat 5 (780..900) CTA pill
 *
 * Vertical layout so the word can go full-width without fighting the phone,
 * and the top-word COLOR (red vs emerald) does the comparison work.
 * Reuses PhoneMockup + LiveCallScreen. MISSED lockscreen is inline because it
 * exists nowhere else in the product.
 */

import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from 'remotion';
import { ArrowRight, PhoneMissed } from 'lucide-react';
import { Theme } from '../theme/buildTheme';
import { ReelSpec } from '../specs/schema';
import { Background, BackgroundVariant } from '../engine/Background';
import { FONTS } from '../theme/fonts';
import { springProgress, drift } from '../engine/motion';
import { PhoneMockup } from '../components/dashboard/PhoneMockup';
import { LiveCallScreen } from '../components/dashboard/LiveCallScreen';

interface Props {
  spec: ReelSpec;
  theme: Theme;
  background: BackgroundVariant;
}

export interface BeforeAfterOptions {
  businessName: string;
  callerName: string;
  callerPhone: string;
  /** Small line under the "ANSWERED" beat. */
  aftermath?: string;
  /** Override the loud word on the left panel (defaults "MISSED."). */
  beforeWord?: string;
  /** Override the loud word on the right panel (defaults "ANSWERED."). */
  afterWord?: string;
  /** Missed-call time string on the lockscreen (defaults "4:47 PM"). */
  missedAt?: string;
}

const DEFAULTS: BeforeAfterOptions = {
  businessName: 'Riverside Plumbing',
  callerName: 'John Carter',
  callerPhone: '(555) 218-4203',
  aftermath: 'Captured. Booked. Text sent.',
  beforeWord: 'MISSED.',
  afterWord: 'ANSWERED.',
  missedAt: '4:47 PM',
};

const BEATS = {
  beforeIn: 0,
  beforeHold: 40,
  beforeOut: 260,
  flashIn: 260,
  flashPeak: 300,
  afterIn: 340,
  afterHold: 380,
  aftermathIn: 660,
  afterOut: 770,
  ctaIn: 780,
};

// ─── Missed-call lockscreen (inline; used only here) ─────────────────────────
const MissedCallLockscreen: React.FC<{
  theme: Theme;
  businessName: string;
  callerName: string;
  callerPhone: string;
  missedAt: string;
  enterFrame: number;
  phoneWidth: number;
}> = ({ theme, businessName, callerName, callerPhone, missedAt, enterFrame, phoneWidth }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const PX = (f: number) => Math.round(phoneWidth * f);

  const p = springProgress(frame, fps, enterFrame, 'smooth');
  const opacity = interpolate(p, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const cardP = springProgress(frame, fps, enterFrame + 14, 'pop');
  const cardOpacity = interpolate(cardP, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const cardTy = interpolate(cardP, [0, 1], [40, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: PX(0.3),
        color: '#fafaf9',
        fontFamily: FONTS.body,
      }}
    >
      {/* Lockscreen time + date (small — the notification card is the hero) */}
      <span
        style={{
          fontFamily: FONTS.mono,
          fontSize: PX(0.036),
          letterSpacing: '0.02em',
          color: 'rgba(250,250,249,0.55)',
        }}
      >
        Tuesday, June 9
      </span>
      <span
        style={{
          fontFamily: FONTS.display,
          fontSize: PX(0.32),
          lineHeight: 1,
          letterSpacing: '-0.045em',
          marginTop: 8,
          color: '#fafaf9',
        }}
      >
        9:41
      </span>

      {/* MISSED CALL notification card */}
      <div
        style={{
          marginTop: PX(0.14),
          width: PX(0.86),
          opacity: cardOpacity,
          transform: `translateY(${cardTy}px)`,
          background: 'rgba(20,10,10,0.88)',
          border: '1px solid rgba(239,68,68,0.28)',
          borderRadius: PX(0.05),
          padding: `${PX(0.045)}px ${PX(0.055)}px`,
          boxShadow: '0 24px 60px -20px rgba(239,68,68,0.35), 0 0 90px -20px rgba(239,68,68,0.28)',
          fontFamily: FONTS.body,
        }}
      >
        {/* Header row: red pill + timestamp */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: PX(0.03) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: PX(0.02) }}>
            <div
              style={{
                width: PX(0.062),
                height: PX(0.062),
                borderRadius: PX(0.02),
                background: 'rgba(239,68,68,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PhoneMissed size={PX(0.038)} color="#ef4444" strokeWidth={2.4} />
            </div>
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: PX(0.03),
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#ef4444',
                fontWeight: 600,
              }}
            >
              Missed Call
            </span>
          </div>
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: PX(0.028),
              color: 'rgba(250,250,249,0.48)',
              letterSpacing: '0.02em',
            }}
          >
            {missedAt}
          </span>
        </div>

        {/* Caller line */}
        <div
          style={{
            fontFamily: FONTS.body,
            fontSize: PX(0.058),
            fontWeight: 600,
            lineHeight: 1.15,
            color: '#fafaf9',
            letterSpacing: '-0.012em',
          }}
        >
          {callerName}
        </div>
        <div
          style={{
            marginTop: PX(0.012),
            fontFamily: FONTS.mono,
            fontSize: PX(0.038),
            color: 'rgba(250,250,249,0.62)',
            letterSpacing: '0.02em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {callerPhone} · {businessName}
        </div>

        {/* Big struck line — the "not answered" tell */}
        <div
          style={{
            marginTop: PX(0.038),
            paddingTop: PX(0.028),
            borderTop: '1px solid rgba(255,255,255,0.06)',
            fontFamily: FONTS.mono,
            fontSize: PX(0.03),
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(239,68,68,0.72)',
          }}
        >
          No one picked up
        </div>
      </div>
    </div>
  );
};

// ─── The huge banner word (Anton) sitting above the phone ──────────────────
const BannerWord: React.FC<{
  text: string;
  enterFrame: number;
  exitFrame?: number;
  color: string;
}> = ({ text, enterFrame, exitFrame, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = springProgress(frame, fps, enterFrame, 'pop');
  const inOpacity = interpolate(p, [0, 0.6], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const inTy = interpolate(p, [0, 1], [60, 0]);
  const inScale = interpolate(p, [0, 1], [0.78, 1]);

  const outOpacity = exitFrame
    ? interpolate(frame, [exitFrame - 10, exitFrame + 10], [1, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      })
    : 1;
  const outTy = exitFrame
    ? interpolate(frame, [exitFrame, exitFrame + 20], [0, -20], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      })
    : 0;

  const driftStyle = drift(frame - (enterFrame + 20), 'y', 3, 130);
  const opacity = inOpacity * outOpacity;

  // 960px of usable width (1080 - 60*2). Anton avg char ≈ 0.42em with tight
  // kerning. Auto-fit so short words go huge and long words still fit.
  const usableWidth = 960;
  const size = Math.min(320, Math.floor(usableWidth / (text.length * 0.42)));

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${inTy + outTy}px) scale(${inScale}) ${driftStyle.transform ?? ''}`,
        fontFamily: FONTS.display,
        fontSize: size,
        lineHeight: 0.9,
        letterSpacing: '-0.05em',
        color,
        textAlign: 'center',
        textTransform: 'uppercase',
        width: '100%',
      }}
    >
      {text}
    </div>
  );
};

export const BeforeAfter: React.FC<Props> = ({ spec, theme, background }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const cfg = { ...DEFAULTS, ...(spec.options?.beforeAfter ?? {}) };

  const phoneWidth = 460;
  const phoneTop = 570; // banner (220..520) → 50px gap → phone (570..1567)

  // ─── Beat 1: BEFORE — banner up top, phone below ─────────────────────────
  const beforePhoneP = springProgress(frame, fps, BEATS.beforeIn, 'elegant');
  const beforePhoneOpacity = interpolate(beforePhoneP, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const beforePhoneTy = interpolate(beforePhoneP, [0, 1], [60, 0]);
  const beforePhoneOutP = springProgress(frame, fps, BEATS.beforeOut, 'smooth');
  const beforePhoneOutOpacity = interpolate(beforePhoneOutP, [0, 1], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const beforePhoneDrift = drift(frame - BEATS.beforeIn, 'y', 5, 160);

  // ─── Beat 2: FLASH ────────────────────────────────────────────────────────
  // Emerald wash sweeps from 0 → peak at BEATS.flashPeak → 0 by BEATS.afterIn.
  const flashOpacity = interpolate(
    frame,
    [BEATS.flashIn, BEATS.flashPeak, BEATS.afterIn],
    [0, 0.85, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // ─── Beat 3: AFTER — phone RIGHT, word LEFT ──────────────────────────────
  const afterPhoneP = springProgress(frame, fps, BEATS.afterIn, 'elegant');
  const afterPhoneOpacity = interpolate(afterPhoneP, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const afterPhoneTy = interpolate(afterPhoneP, [0, 1], [60, 0]);
  const afterPhoneOutP = springProgress(frame, fps, BEATS.afterOut, 'smooth');
  const afterPhoneOutOpacity = interpolate(afterPhoneOutP, [0, 1], [1, 0.35], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const afterPhoneDrift = drift(frame - BEATS.afterIn, 'y', 5, 160);

  // ─── Beat 4: aftermath caption ──────────────────────────────────────────
  const aftermathP = springProgress(frame, fps, BEATS.aftermathIn, 'smooth');
  const aftermathOpacity = interpolate(aftermathP, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const aftermathTy = interpolate(aftermathP, [0, 1], [22, 0]);
  const aftermathOut = interpolate(
    frame,
    [BEATS.afterOut, BEATS.afterOut + 20],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // ─── Beat 5: CTA ─────────────────────────────────────────────────────────
  const ctaP = springProgress(frame, fps, BEATS.ctaIn, 'pop');
  const ctaOpacity = interpolate(ctaP, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const ctaTy = interpolate(ctaP, [0, 1], [30, 0]);
  const ctaScale = interpolate(ctaP, [0, 1], [0.9, 1]);
  const ctaSubP = springProgress(frame, fps, BEATS.ctaIn + 14, 'smooth');
  const ctaSubOpacity = interpolate(ctaSubP, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: theme.bg, color: theme.text, fontFamily: FONTS.body }}>
      <Background variant={background} theme={theme} seed={spec.seed} />

      {/* ─── BEAT 1: BEFORE — banner top, phone below ───────────────────── */}
      {frame < BEATS.afterIn && (
        <>
          {/* Word banner top */}
          <div
            style={{
              position: 'absolute',
              left: 60,
              right: 60,
              top: 220,
              opacity: beforePhoneOutOpacity,
            }}
          >
            <BannerWord
              text={cfg.beforeWord ?? 'MISSED.'}
              enterFrame={BEATS.beforeHold}
              exitFrame={BEATS.beforeOut}
              color="#ef4444"
            />
          </div>

          {/* Phone center-lower */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: phoneTop,
              transform: `translateX(-50%) translateY(${beforePhoneTy}px) ${beforePhoneDrift.transform ?? ''}`,
              opacity: beforePhoneOpacity * beforePhoneOutOpacity,
            }}
          >
            <PhoneMockup width={phoneWidth} perspective="subtle" glow="rgba(239, 68, 68, 0.24)">
              <MissedCallLockscreen
                theme={theme}
                businessName={cfg.businessName}
                callerName={cfg.callerName}
                callerPhone={cfg.callerPhone}
                missedAt={cfg.missedAt ?? '4:47 PM'}
                enterFrame={BEATS.beforeIn}
                phoneWidth={phoneWidth}
              />
            </PhoneMockup>
          </div>
        </>
      )}

      {/* ─── BEAT 2: FLASH (emerald wash) ──────────────────────────────── */}
      {frame >= BEATS.flashIn - 6 && frame <= BEATS.afterIn + 6 && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(80% 70% at 50% 50%, ${theme.primary}, transparent 75%)`,
            opacity: flashOpacity,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* ─── BEAT 3: AFTER — banner top, phone below ────────────────────── */}
      {frame >= BEATS.afterIn - 10 && (
        <>
          <div
            style={{
              position: 'absolute',
              left: 60,
              right: 60,
              top: 220,
              opacity: afterPhoneOutOpacity,
            }}
          >
            <BannerWord
              text={cfg.afterWord ?? 'ANSWERED.'}
              enterFrame={BEATS.afterHold}
              exitFrame={BEATS.afterOut}
              color={theme.primary}
            />
          </div>

          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: phoneTop,
              transform: `translateX(-50%) translateY(${afterPhoneTy}px) ${afterPhoneDrift.transform ?? ''}`,
              opacity: afterPhoneOpacity * afterPhoneOutOpacity,
            }}
          >
            <PhoneMockup width={phoneWidth} perspective="subtle" glow="rgba(74, 234, 188, 0.34)">
              <LiveCallScreen
                theme={theme}
                businessName={cfg.businessName}
                callerName={cfg.callerName}
                enterFrame={BEATS.afterIn}
                phoneWidth={phoneWidth}
              />
            </PhoneMockup>
          </div>
        </>
      )}

      {/* ─── BEAT 4: aftermath caption ───────────────────────────────── */}
      {frame >= BEATS.aftermathIn - 6 && (
        <div
          style={{
            position: 'absolute',
            left: 60,
            right: 60,
            top: 1620,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
            opacity: aftermathOpacity * aftermathOut,
            transform: `translateY(${aftermathTy}px)`,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 40,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: theme.text,
              padding: '20px 36px',
              borderRadius: 999,
              background: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
            }}
          >
            {cfg.aftermath}
          </div>
        </div>
      )}

      {/* ─── BEAT 5: CTA ───────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 220,
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
              opacity: ctaSubOpacity,
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
