/**
 * components/dashboard/DashboardListPanel.tsx
 *
 * A reusable dashboard-list panel (per CLAUDE.md §6.4 — locked reusable element).
 * Renders as a large card with:
 *   - header: mono eyebrow ("Recent Calls" / "Leads Inbox") + a count on the right
 *   - separator
 *   - a vertical stack of ROWS that appear one at a time on their `atFrame`
 *
 * Two variants:
 *   - 'calls': [icon] [caller name / summary] [duration] [status pill]
 *   - 'leads': [icon] [business name / industry] [location] [status pill]
 *
 * All frame-driven — each row uses springProgress against `rowsBaseFrame + row.atFrame`.
 * Data-free (no imports from source-dashboards). Consumers pass row data in props.
 */

import React from 'react';
import {
  useCurrentFrame, useVideoConfig, interpolate,
} from 'remotion';
import { PhoneCall, Users, Building } from 'lucide-react';
import { Theme } from '../../theme/buildTheme';
import { FONTS } from '../../theme/fonts';
import { springProgress } from '../../engine/motion';
import { DashboardRow } from '../../specs/schema';

interface Props {
  theme: Theme;
  variant?: 'calls' | 'leads';
  surfaceLabel?: string;         // "Recent Calls" / "Leads Inbox"
  brandName?: string;            // white-label brand shown small at top
  rows: DashboardRow[];
  /** Base frame — row.atFrame is added to this. */
  rowsBaseFrame: number;
  /** Overall panel enter (card slides in). */
  enterFrame: number;
  width?: number;
}

const STATUS_LABEL: Record<NonNullable<DashboardRow['status']>, string> = {
  booked:    'BOOKED',
  lead:      'LEAD',
  info:      'INFO',
  new:       'NEW',
  contacted: 'CONTACTED',
};

const STATUS_COLOR = (
  s: NonNullable<DashboardRow['status']> | undefined,
  theme: Theme,
) => {
  switch (s) {
    case 'booked': return { bg: theme.primary15, fg: theme.primary };
    case 'lead':   return { bg: theme.infoBg,     fg: theme.infoText };
    case 'new':    return { bg: theme.primary15,  fg: theme.primary };
    case 'contacted': return { bg: theme.warningBg, fg: theme.warningText };
    case 'info':
    default:       return { bg: theme.hover,       fg: theme.textMuted };
  }
};

// ─── One row ─────────────────────────────────────────────────────────────
const PanelRow: React.FC<{
  theme: Theme;
  variant: 'calls' | 'leads';
  row: DashboardRow;
  baseFrame: number;
}> = ({ theme, variant, row, baseFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const startFrame = baseFrame + (row.atFrame ?? 0);

  const p = springProgress(frame, fps, startFrame, 'smooth');
  const opacity = interpolate(p, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const ty = interpolate(p, [0, 1], [24, 0]);
  const scale = interpolate(p, [0, 1], [0.98, 1]);

  const status = row.status;
  const statusStyle = STATUS_COLOR(status, theme);

  const Icon =
    variant === 'calls' ? PhoneCall :
    variant === 'leads' ? Building : Users;

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${ty}px) scale(${scale})`,
        transformOrigin: 'center top',
        display: 'flex',
        alignItems: 'center',
        gap: 22,
        padding: '26px 30px',
        borderRadius: 16,
        background: theme.hover,
        border: `1px solid ${theme.borderSubtle}`,
        fontFamily: FONTS.body,
      }}
    >
      {/* Icon square */}
      <div
        style={{
          width: 62,
          height: 62,
          borderRadius: 14,
          background: theme.primary15,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={30} color={theme.primary} strokeWidth={2.1} />
      </div>

      {/* Text block (grows) */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: FONTS.body,
            fontSize: 34,
            fontWeight: 600,
            letterSpacing: '-0.012em',
            color: theme.text,
            lineHeight: 1.1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {row.primary}
        </div>
        {row.secondary && (
          <div
            style={{
              marginTop: 6,
              fontFamily: FONTS.mono,
              fontSize: 22,
              letterSpacing: '0.02em',
              color: theme.textMuted,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {row.secondary}
          </div>
        )}
      </div>

      {/* Meta (right, before status) */}
      {row.meta && (
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 26,
            letterSpacing: '0.02em',
            color: theme.textMuted,
            fontVariantNumeric: 'tabular-nums',
            flexShrink: 0,
          }}
        >
          {row.meta}
        </div>
      )}

      {/* Status pill */}
      {status && (
        <div
          style={{
            padding: '10px 18px',
            borderRadius: 999,
            background: statusStyle.bg,
            color: statusStyle.fg,
            fontFamily: FONTS.mono,
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}
        >
          {STATUS_LABEL[status]}
        </div>
      )}
    </div>
  );
};

// ─── Panel ──────────────────────────────────────────────────────────────
export const DashboardListPanel: React.FC<Props> = ({
  theme,
  variant = 'calls',
  surfaceLabel,
  brandName,
  rows,
  rowsBaseFrame,
  enterFrame,
  width = 940,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // panel entrance
  const p = springProgress(frame, fps, enterFrame, 'elegant');
  const opacity = interpolate(p, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const ty = interpolate(p, [0, 1], [50, 0]);
  const scale = interpolate(p, [0, 1], [0.96, 1]);

  // count that counts up as rows land
  const arrivedCount = rows.reduce((acc, r) => {
    const at = rowsBaseFrame + (r.atFrame ?? 0);
    return frame >= at + 4 ? acc + 1 : acc;
  }, 0);

  const defaultLabel = variant === 'calls' ? 'Recent Calls' : 'Leads Inbox';

  return (
    <div
      style={{
        width,
        opacity,
        transform: `translateY(${ty}px) scale(${scale})`,
        transformOrigin: 'center top',
        background: theme.card,
        border: `1px solid ${theme.border}`,
        borderRadius: 26,
        padding: '30px 30px 30px 30px',
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.04) inset, 0 30px 90px -30px rgba(0,0,0,0.55), 0 0 140px -20px rgba(74,234,188,0.14)',
        fontFamily: FONTS.body,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 6px 22px 6px',
          borderBottom: `1px solid ${theme.borderSubtle}`,
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 22,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: theme.textMuted,
              fontWeight: 500,
            }}
          >
            {surfaceLabel ?? defaultLabel}
          </span>
          {brandName && (
            <span
              style={{
                fontFamily: FONTS.body,
                fontSize: 32,
                fontWeight: 600,
                letterSpacing: '-0.012em',
                color: theme.text,
              }}
            >
              {brandName}
            </span>
          )}
        </div>

        {/* Count on right — counts up as rows land */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 10,
          }}
        >
          <span
            style={{
              fontFamily: FONTS.display,
              fontSize: 72,
              lineHeight: 1,
              letterSpacing: '-0.04em',
              color: theme.primary,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {arrivedCount}
          </span>
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 22,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: theme.textMuted,
            }}
          >
            this week
          </span>
        </div>
      </div>

      {/* Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {rows.map((row, i) => (
          <PanelRow
            key={i}
            theme={theme}
            variant={variant}
            row={row}
            baseFrame={rowsBaseFrame}
          />
        ))}
      </div>
    </div>
  );
};
