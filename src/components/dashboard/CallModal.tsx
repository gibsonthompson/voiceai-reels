/**
 * components/dashboard/CallModal.tsx
 *
 * A pixel-accurate Remotion recreation of the real AI Lab CallModal from
 * source-dashboards/ai-lab-page.tsx (lines 93-197). Data-free, props-driven,
 * frame-animatable. The reel scripts an incoming call on the timeline:
 *
 *   CONNECTING  →  LIVE (pulsing badge + ticking timer + bubbles + events)
 *               →  ENDED (close button)  →  Booking captured banner
 *
 * The component picks its current display state from `script` based on the
 * current Remotion frame, so a single render at any frame is correct.
 */

import React from 'react';
import {
  Radio, Loader2, Bot, Mic, PhoneOff, X, CheckCircle2,
} from 'lucide-react';
import {
  useCurrentFrame, useVideoConfig, interpolate, spring,
} from 'remotion';
import { Theme } from '../../theme/buildTheme';
import { FONTS } from '../../theme/fonts';
import { MOTION } from '../../theme/tokens';
import { springProgress } from '../../engine/motion';
import { TranscriptBubble, TranscriptLine } from './TranscriptBubble';

export interface CallEventEntry {
  id: string;
  type: string;
  message: string;
  level: 'info' | 'warn' | 'error' | 'success';
  atFrame: number;
}

export interface CallScript {
  clientName: string;
  /** Frame the CONNECTING state appears (everything before is empty). */
  connectingStart: number;
  /** Frame state flips to LIVE; the call timer starts ticking here. */
  liveStart: number;
  /** Frame state flips to ENDED. */
  endedStart: number;
  /** Frame the "Booking captured" success banner shows. */
  bookingStart?: number;
  transcript: TranscriptLine[];
  events: CallEventEntry[];
  bookingMessage?: string;
}

interface Props {
  script: CallScript;
  theme: Theme;
}

function fmtDuration(s: number): string {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

const PulseDot: React.FC<{ color: string; size?: number; phase?: number }> = ({
  color, size = 8, phase = 0,
}) => {
  const frame = useCurrentFrame();
  const v = (Math.sin(((frame + phase) / 26) * Math.PI * 2) * 0.5 + 0.5);
  const scale = 0.85 + v * 0.3;
  const opacity = 0.7 + v * 0.3;
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: size,
        background: color,
        transform: `scale(${scale})`,
        opacity,
        boxShadow: `0 0 ${8 + v * 6}px ${color}`,
      }}
    />
  );
};

const StatusBadge: React.FC<{
  state: 'connecting' | 'live' | 'ended';
  theme: Theme;
}> = ({ state, theme }) => {
  if (state === 'live') {
    return (
      <span
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          fontFamily: FONTS.mono,
          fontSize: 18, fontWeight: 600, letterSpacing: '0.18em',
          textTransform: 'uppercase',
          padding: '8px 16px', borderRadius: 999,
          background: 'rgba(34,197,94,0.15)',
          color: '#22c55e',
        }}
      >
        <PulseDot color="#22c55e" size={9} />
        LIVE
      </span>
    );
  }
  if (state === 'connecting') {
    return (
      <span
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          fontFamily: FONTS.mono,
          fontSize: 18, fontWeight: 600, letterSpacing: '0.18em',
          textTransform: 'uppercase',
          padding: '8px 16px', borderRadius: 999,
          background: theme.primary15,
          color: theme.primary,
        }}
      >
        <PulseDot color={theme.primary} size={9} />
        CONNECTING
      </span>
    );
  }
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center',
        fontFamily: FONTS.mono,
        fontSize: 18, fontWeight: 600, letterSpacing: '0.18em',
        textTransform: 'uppercase',
        padding: '8px 16px', borderRadius: 999,
        background: theme.hover,
        color: theme.textMuted,
      }}
    >
      ENDED
    </span>
  );
};

const EventRow: React.FC<{
  entry: CallEventEntry;
  theme: Theme;
}> = ({ entry, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = springProgress(frame, fps, entry.atFrame, 'snappy');
  const opacity = interpolate(p, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const ty = interpolate(p, [0, 1], [8, 0]);

  const levelColor: Record<CallEventEntry['level'], string> = {
    info: theme.textMuted,
    warn: '#f59e0b',
    error: '#ef4444',
    success: '#22c55e',
  };
  const c = levelColor[entry.level];

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${ty}px)`,
        background: 'rgba(255,255,255,0.025)',
        borderRadius: 8,
        padding: '8px 10px',
        fontFamily: FONTS.mono,
        fontSize: 14,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={{ color: c, fontWeight: 600 }}>{entry.type}</span>
      </div>
      <div style={{ color: theme.textMuted, marginTop: 2 }}>{entry.message}</div>
    </div>
  );
};

export const CallModal: React.FC<Props> = ({ script, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Resolve state for current frame
  let state: 'connecting' | 'live' | 'ended' = 'connecting';
  if (frame >= script.endedStart) state = 'ended';
  else if (frame >= script.liveStart) state = 'live';

  // Timer math — counts up during LIVE; frozen at the moment ENDED begins.
  const liveFrames =
    state === 'ended'
      ? script.endedStart - script.liveStart
      : Math.max(0, frame - script.liveStart);
  const seconds = Math.max(0, Math.floor(liveFrames / fps));

  // Subtle pop when state flips to LIVE
  const liveBadgePop = spring({
    frame: frame - script.liveStart,
    fps,
    config: MOTION.SPRINGS.pop,
  });
  const livePopScale = state === 'live'
    ? interpolate(liveBadgePop, [0, 1], [0.85, 1], { extrapolateRight: 'clamp' })
    : 1;

  // Visible transcript + events (filter to those whose startFrame has been reached)
  const visibleBubbles = script.transcript.filter(b => b.startFrame <= frame + 10);
  const visibleEvents = script.events.filter(e => e.atFrame <= frame + 10);

  // Booking confirmation overlay (slides up over transcript)
  const bookingStart = script.bookingStart;
  const bookingActive = bookingStart != null && frame >= bookingStart;
  const bookingP = bookingActive
    ? springProgress(frame, fps, bookingStart!, 'pop')
    : 0;
  const bookingOpacity = interpolate(bookingP, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const bookingTy = interpolate(bookingP, [0, 1], [40, 0]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: theme.card,
        display: 'flex',
        flexDirection: 'column',
        color: theme.text,
        fontFamily: FONTS.body,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 32px',
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ transform: `scale(${livePopScale})`, transformOrigin: 'left center' }}>
            <StatusBadge state={state} theme={theme} />
          </div>
          <span
            style={{
              fontFamily: FONTS.body,
              fontSize: 24,
              fontWeight: 500,
              color: theme.text,
            }}
          >
            {script.clientName}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 32,
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
              color: theme.text,
            }}
          >
            {fmtDuration(seconds)}
          </span>
        </div>
      </div>

      {/* Body — transcript pane + event rail */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
        {/* Transcript */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            borderRight: `1px solid ${theme.border}`,
          }}
        >
          <div
            style={{
              padding: '12px 24px',
              borderBottom: `1px solid ${theme.border}`,
            }}
          >
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: theme.textMuted,
              }}
            >
              Transcript
            </span>
          </div>
          <div
            style={{
              flex: 1,
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              gap: 16,
              overflow: 'hidden',
              opacity: interpolate(
                bookingP,
                [0, 1],
                [1, 0.18],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
              ),
            }}
          >
            {visibleBubbles.length === 0 && (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  opacity: state === 'connecting' ? 1 : 0,
                }}
              >
                <Bot size={36} color={theme.textMuted} style={{ opacity: 0.25 }} />
                <span style={{ fontSize: 18, color: theme.textMuted }}>
                  Waiting for speech…
                </span>
              </div>
            )}
            {visibleBubbles.map((b) => (
              <TranscriptBubble key={b.id} line={b} theme={theme} />
            ))}
          </div>
        </div>

        {/* Event log rail */}
        <div
          style={{
            width: 280,
            display: 'flex',
            flexDirection: 'column',
            opacity: interpolate(
              bookingP,
              [0, 1],
              [1, 0.18],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
            ),
          }}
        >
          <div
            style={{
              padding: '12px 18px',
              borderBottom: `1px solid ${theme.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: theme.textMuted,
              }}
            >
              Events
            </span>
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: 13,
                color: theme.textMuted,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {visibleEvents.length}
            </span>
          </div>
          <div
            style={{
              flex: 1,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              gap: 6,
              overflow: 'hidden',
            }}
          >
            {visibleEvents.map((e) => (
              <EventRow key={e.id} entry={e} theme={theme} />
            ))}
          </div>
        </div>

        {/* Booking captured overlay — centered focal moment over the body */}
        {bookingActive && (
          <div
            style={{
              position: 'absolute',
              left: 40,
              right: 40,
              top: '50%',
              opacity: bookingOpacity,
              transform: `translateY(calc(-50% + ${bookingTy}px))`,
              background:
                'linear-gradient(180deg, rgba(34,197,94,0.22), rgba(34,197,94,0.08))',
              border: '1.5px solid rgba(34,197,94,0.55)',
              borderRadius: 22,
              padding: '32px 36px',
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              boxShadow: '0 40px 120px -30px rgba(34,197,94,0.55)',
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 18,
                background: 'rgba(34,197,94,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CheckCircle2 size={40} color="#22c55e" strokeWidth={2.5} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 18,
                  fontWeight: 600,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: '#22c55e',
                }}
              >
                Booking captured
              </span>
              <span
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 28,
                  fontWeight: 500,
                  lineHeight: 1.25,
                  color: theme.text,
                }}
              >
                {script.bookingMessage ?? 'Tomorrow · 9:00 AM · Confirmation text sent'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer — call controls vary by state */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          padding: '24px 32px',
          borderTop: `1px solid ${theme.border}`,
        }}
      >
        {state === 'live' && (
          <>
            <button
              style={{
                width: 72,
                height: 72,
                borderRadius: 999,
                background: theme.hover,
                border: `2px solid ${theme.border}`,
                color: theme.text,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Mic size={28} />
            </button>
            <button
              style={{
                width: 84,
                height: 84,
                borderRadius: 999,
                background: '#ef4444',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 28px rgba(239,68,68,0.4)',
                border: 'none',
              }}
            >
              <PhoneOff size={32} />
            </button>
          </>
        )}
        {state === 'connecting' && (
          <button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '14px 28px',
              borderRadius: 999,
              background: 'rgba(239,68,68,0.12)',
              color: '#ef4444',
              fontFamily: FONTS.body,
              fontSize: 22,
              fontWeight: 500,
              border: 'none',
            }}
          >
            <X size={20} /> Cancel
          </button>
        )}
        {state === 'ended' && (
          <button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '14px 32px',
              borderRadius: 999,
              background: theme.primary,
              color: theme.primaryText,
              fontFamily: FONTS.body,
              fontSize: 22,
              fontWeight: 600,
              border: 'none',
            }}
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
};
