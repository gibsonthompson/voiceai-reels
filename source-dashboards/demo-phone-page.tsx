'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Phone, Loader2, Trash2, Plus, PhoneCall, MessageSquare,
  Headphones, Sparkles, Lock, Check, AlertCircle, Copy,
  Bot, Users, Clock, Mic, ArrowRight, ChevronRight, X,
  Play, Pause, Building2, MapPin, Zap, ArrowLeft
} from 'lucide-react';
import { useAgency } from '../context';
import { useTheme } from '@/hooks/useTheme';
import { usePlanFeatures } from '../../../hooks/usePlanFeatures';
import LockedFeature from '@/components/LockedFeature';

// ============================================================================
// HELPERS
// ============================================================================
function formatPhoneDisplay(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (ten.length === 10) {
    return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
  }
  return phone;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================================================
// TYPES
// ============================================================================
interface DemoCall {
  id: string;
  caller_phone: string | null;
  caller_name: string | null;
  business_name: string | null;
  business_type: string | null;
  interest_level: string | null;
  service_discussed: string | null;
  asked_questions: boolean;
  summary: string | null;
  transcript: string | null;
  recording_url: string | null;
  duration_seconds: number | null;
  industry_key: string | null;
  caller_location: string | null;
  vapi_call_id: string | null;
  vapi_success_score: string | null;
  created_at: string;
}

// ============================================================================
// INTEREST LEVEL BADGE
// ============================================================================
function InterestBadge({ level, theme }: { level: string | null; theme: any }) {
  const config = {
    high: { emoji: '🔥', label: 'Hot', bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.2)' },
    medium: { emoji: '👀', label: 'Warm', bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.2)' },
    low: { emoji: '❄️', label: 'Cold', bg: 'rgba(107, 114, 128, 0.1)', color: '#6b7280', border: 'rgba(107, 114, 128, 0.2)' },
  }[level || 'medium'] || { emoji: '—', label: level || 'Unknown', bg: theme.hover, color: theme.textMuted, border: theme.border };

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ backgroundColor: config.bg, color: config.color, border: `1px solid ${config.border}` }}
    >
      {config.emoji} {config.label}
    </span>
  );
}

// ============================================================================
// SIMPLE AUDIO PLAYER
// ============================================================================
function AudioPlayer({ url, theme }: { url: string; theme: any }) {
  const [playing, setPlaying] = useState(false);
  const [audio] = useState(() => typeof Audio !== 'undefined' ? new Audio(url) : null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!audio) return;
    const onTime = () => setProgress(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onEnd = () => { setPlaying(false); setProgress(0); };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnd);
      audio.pause();
    };
  }, [audio]);

  const toggle = () => {
    if (!audio) return;
    if (playing) { audio.pause(); } else { audio.play(); }
    setPlaying(!playing);
  };

  const pct = duration > 0 ? (progress / duration) * 100 : 0;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggle}
        className="flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0 transition-colors"
        style={{ backgroundColor: theme.primary, color: theme.primaryText }}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </button>
      <div className="flex-1">
        <div
          className="w-full h-1.5 rounded-full overflow-hidden cursor-pointer"
          style={{ backgroundColor: theme.hover }}
          onClick={(e) => {
            if (!audio || !duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const pctClick = (e.clientX - rect.left) / rect.width;
            audio.currentTime = pctClick * duration;
          }}
        >
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: theme.primary }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px]" style={{ color: theme.textMuted }}>{fmt(progress)}</span>
          <span className="text-[10px]" style={{ color: theme.textMuted }}>{duration > 0 ? fmt(duration) : '—'}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DEMO CALL DETAIL MODAL
// ============================================================================
function DemoCallDetailModal({ call, theme, onClose }: { call: DemoCall; theme: any; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl my-8"
        style={{ backgroundColor: theme.card, border: `2px solid ${theme.border}` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <div className="min-w-0">
            <h2 className="text-base font-semibold truncate">
              {call.business_name || call.caller_name || 'Demo Call'}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
              {new Date(call.created_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
              {call.duration_seconds ? ` · ${formatDuration(call.duration_seconds)}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <InterestBadge level={call.interest_level} theme={theme} />
            <button
              onClick={onClose}
              className="flex items-center justify-center h-8 w-8 rounded-lg transition-colors"
              style={{ backgroundColor: theme.hover }}
            >
              <X className="h-4 w-4" style={{ color: theme.textMuted }} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Caller Info */}
          <div className="grid grid-cols-2 gap-3">
            {call.caller_phone && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0" style={{ backgroundColor: theme.hover }}>
                  <Phone className="h-3.5 w-3.5" style={{ color: theme.textMuted }} />
                </div>
                <div>
                  <p className="text-[10px]" style={{ color: theme.textMuted }}>Caller</p>
                  <p className="text-sm font-medium">{formatPhoneDisplay(call.caller_phone)}</p>
                </div>
              </div>
            )}
            {call.business_name && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0" style={{ backgroundColor: theme.hover }}>
                  <Building2 className="h-3.5 w-3.5" style={{ color: theme.textMuted }} />
                </div>
                <div>
                  <p className="text-[10px]" style={{ color: theme.textMuted }}>Business</p>
                  <p className="text-sm font-medium">{call.business_name}</p>
                </div>
              </div>
            )}
            {call.business_type && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0" style={{ backgroundColor: theme.hover }}>
                  <Zap className="h-3.5 w-3.5" style={{ color: theme.textMuted }} />
                </div>
                <div>
                  <p className="text-[10px]" style={{ color: theme.textMuted }}>Industry</p>
                  <p className="text-sm font-medium capitalize">{call.business_type.replace(/_/g, ' ')}</p>
                </div>
              </div>
            )}
            {call.caller_location && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0" style={{ backgroundColor: theme.hover }}>
                  <MapPin className="h-3.5 w-3.5" style={{ color: theme.textMuted }} />
                </div>
                <div>
                  <p className="text-[10px]" style={{ color: theme.textMuted }}>Location</p>
                  <p className="text-sm font-medium">{call.caller_location}</p>
                </div>
              </div>
            )}
          </div>

          {/* Tags row */}
          <div className="flex flex-wrap gap-2">
            {call.service_discussed && (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: theme.primary + '12', color: theme.primary, textTransform: 'capitalize' }}>
                ✅ {call.service_discussed}
              </span>
            )}
            {call.asked_questions && (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: theme.primary + '12', color: theme.primary, textTransform: 'capitalize' }}>
                ❓ Asked follow-up questions
              </span>
            )}
            {call.caller_name && call.caller_name !== 'Unknown' && (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: theme.hover, color: theme.textMuted }}>
                👤 {call.caller_name}
              </span>
            )}
          </div>

          {/* Summary */}
          {call.summary && (
            <div className="rounded-xl p-4" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}` }}>
              <div className="flex items-center gap-2 mb-2">
                <Bot className="h-4 w-4" style={{ color: theme.primary }} />
                <h3 className="text-xs font-semibold" style={{ color: theme.text }}>AI Summary</h3>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }}>{call.summary}</p>
            </div>
          )}

          {/* Recording */}
          {call.recording_url && (
            <div className="rounded-xl p-4" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}` }}>
              <h3 className="text-xs font-semibold mb-3" style={{ color: theme.text }}>Call Recording</h3>
              <AudioPlayer url={call.recording_url} theme={theme} />
            </div>
          )}

          {/* Transcript */}
          {call.transcript && (
            <div className="rounded-xl p-4" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}` }}>
              <h3 className="text-xs font-semibold mb-3" style={{ color: theme.text }}>Full Transcript</h3>
              <div
                className="rounded-lg p-3 max-h-64 overflow-y-auto"
                style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}
              >
                <p className="text-xs whitespace-pre-wrap leading-relaxed font-mono" style={{ color: theme.textMuted }}>
                  {call.transcript}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DEMO CALLS LIST
// ============================================================================
function DemoCallsList({ agencyId, theme }: { agencyId: string; theme: any }) {
  const [calls, setCalls] = useState<DemoCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedCall, setSelectedCall] = useState<DemoCall | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.myvoiceaiconnect.com';

  const fetchCalls = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${backendUrl}/api/agency/${agencyId}/demo-calls?limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setCalls(data.calls || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error('Failed to fetch demo calls:', e);
    } finally {
      setLoading(false);
    }
  }, [agencyId, backendUrl]);

  useEffect(() => { fetchCalls(); }, [fetchCalls]);

  const handleSelectCall = async (callId: string) => {
    const existing = calls.find(c => c.id === callId);
    if (existing?.transcript) {
      setSelectedCall(existing);
      return;
    }

    setDetailLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${backendUrl}/api/agency/${agencyId}/demo-calls/${callId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedCall(data.call);
      }
    } catch (e) {
      console.error('Failed to fetch demo call detail:', e);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: theme.primary }} />
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="text-center py-10">
        <PhoneCall className="h-8 w-8 mx-auto mb-2" style={{ color: theme.textMuted, opacity: 0.3 }} />
        <p className="text-sm font-medium" style={{ color: theme.textMuted }}>No demo calls yet</p>
        <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
          When prospects call your demo number, their calls will appear here with full transcripts and AI summaries.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y" style={{ borderColor: theme.border }}>
        {calls.map((call) => (
          <button
            key={call.id}
            onClick={() => handleSelectCall(call.id)}
            className="w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors"
            style={{ borderColor: theme.border }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0"
                style={{ backgroundColor: theme.primary + '12' }}
              >
                <PhoneCall className="h-4 w-4" style={{ color: theme.primary }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">
                    {call.business_name || call.caller_name || (call.caller_phone ? formatPhoneDisplay(call.caller_phone) : 'Unknown Caller')}
                  </p>
                  <InterestBadge level={call.interest_level} theme={theme} />
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {call.service_discussed && (
                    <p className="text-xs truncate" style={{ color: theme.textMuted, textTransform: 'capitalize' }}>{call.service_discussed}</p>
                  )}
                  {!call.service_discussed && call.business_type && (
                    <p className="text-xs truncate capitalize" style={{ color: theme.textMuted }}>{call.business_type.replace(/_/g, ' ')}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0 ml-3">
              <div className="text-right">
                <p className="text-xs" style={{ color: theme.textMuted }}>{formatTimeAgo(call.created_at)}</p>
                {call.duration_seconds && (
                  <p className="text-[10px]" style={{ color: theme.textMuted }}>{formatDuration(call.duration_seconds)}</p>
                )}
              </div>
              {call.recording_url && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: theme.primary + '12' }}>
                  <Play className="h-3 w-3" style={{ color: theme.primary }} />
                </div>
              )}
              <ChevronRight className="h-4 w-4" style={{ color: theme.textMuted }} />
            </div>
          </button>
        ))}
      </div>

      {total > calls.length && (
        <div className="text-center py-3" style={{ borderTop: `1px solid ${theme.border}` }}>
          <p className="text-xs" style={{ color: theme.textMuted }}>
            Showing {calls.length} of {total} demo calls
          </p>
        </div>
      )}

      {selectedCall && (
        <DemoCallDetailModal
          call={selectedCall}
          theme={theme}
          onClose={() => setSelectedCall(null)}
        />
      )}

      {detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#ffffff' }} />
        </div>
      )}
    </>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function DemoPhonePage() {
  const { agency, branding, loading: agencyLoading, refreshAgency, demoMode } = useAgency();
  const theme = useTheme();
  const { planName } = usePlanFeatures();

  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [areaCode, setAreaCode] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.myvoiceaiconnect.com';

  const subscriptionStatus = agency?.subscription_status;
  const isTrialing = subscriptionStatus === 'trialing' || subscriptionStatus === 'trial';
  const isActive = subscriptionStatus === 'active';
  const isPaid = isActive && !isTrialing;
  const hasDemo = !!agency?.demo_phone_number;

  useEffect(() => {
    if (agency?.phone && !areaCode) {
      const digits = agency.phone.replace(/\D/g, '');
      const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
      if (ten.length === 10) {
        setAreaCode(ten.slice(0, 3));
      }
    }
  }, [agency?.phone]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreate = async () => {
    if (demoMode) {
      await refreshAgency();
      return;
    }

    if (!areaCode || !/^\d{3}$/.test(areaCode)) {
      setError('Please enter a valid 3-digit area code');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${backendUrl}/api/agency/${agency?.id}/demo-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ area_code: areaCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || 'Failed to create demo phone');
        return;
      }

      await refreshAgency();
    } catch (err) {
      setError('Failed to connect to server. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (demoMode) {
      setShowDeleteConfirm(false);
      await refreshAgency();
      return;
    }

    setDeleting(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${backendUrl}/api/agency/${agency?.id}/demo-phone`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to delete demo phone');
        return;
      }

      setShowDeleteConfirm(false);
      await refreshAgency();
    } catch (err) {
      setError('Failed to connect to server. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (agencyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  // LOCKED STATE
  if (!isPaid && !isTrialing && !demoMode) {
    return (
      <LockedFeature
        title="Demo Phone Number"
        description="Get a dedicated phone number that showcases your AI receptionist to prospects. Subscribe to unlock this feature."
        requiredPlan="Professional"
        badgeText="Paid Feature"
        ctaText="Subscribe to Unlock"
        currentPlanText={`You're on the ${agency?.plan_type || 'Starter'} plan`}
        features={[
          'Dedicated demo phone number',
          'AI roleplays as prospect\'s receptionist',
          'Auto-sends signup link after call',
          'Choose your own area code',
        ]}
      >
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: theme.text }}>Demo Phone</h1>
            <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
              A dedicated phone number that showcases AI receptionist capabilities to prospects
            </p>
          </div>
          <HowItWorksCard theme={theme} />
        </div>
      </LockedFeature>
    );
  }

  // DEMO MODE — simulated
  if (demoMode && !hasDemo) {
    const fakeDemoNumber = '(678) 555-0199';

    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-semibold">Demo Phone</h1>
          <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
            Your dedicated demo line for showcasing AI receptionist capabilities
          </p>
        </div>

        <div
          className="rounded-xl p-5 sm:p-6 mb-6"
          style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: theme.primary15, color: theme.primary }}>
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base sm:text-lg">Your Demo Number</h3>
                <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#10b981' }}>
                  <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#10b981' }} />
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl p-4 mb-4" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primary}dd)` }}>
            <div className="flex items-center gap-3">
              <PhoneCall className="h-6 w-6" style={{ color: theme.primaryText }} />
              <span className="text-xl sm:text-2xl font-bold tracking-wide" style={{ color: theme.primaryText }}>{fakeDemoNumber}</span>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: theme.primaryText }}>
              <Copy className="h-4 w-4" />Copy
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <div className="flex items-start gap-3 rounded-lg p-3" style={{ backgroundColor: theme.hover }}>
              <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.primary }} />
              <div>
                <p className="text-xs font-medium" style={{ color: theme.text }}>Post-call SMS</p>
                <p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted }}>Callers automatically receive your signup link via text after hanging up</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg p-3" style={{ backgroundColor: theme.hover }}>
              <Headphones className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.primary }} />
              <div>
                <p className="text-xs font-medium" style={{ color: theme.text }}>On your marketing site</p>
                <p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted }}>This number appears automatically in your "Experience It Live" section</p>
              </div>
            </div>
          </div>
        </div>

        <HowItWorksCard theme={theme} />
      </div>
    );
  }

  // ACTIVE STATE — Demo exists
  if (hasDemo) {
    const demoNumber = formatPhoneDisplay(agency!.demo_phone_number!);

    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-semibold">Demo Phone</h1>
          <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
            Your dedicated demo line for showcasing AI receptionist capabilities
          </p>
        </div>

        <div
          className="rounded-xl p-5 sm:p-6 mb-6"
          style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: theme.primary15, color: theme.primary }}>
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base sm:text-lg">Your Demo Number</h3>
                <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#10b981' }}>
                  <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#10b981' }} />
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl p-4 mb-4" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primary}dd)` }}>
            <div className="flex items-center gap-3">
              <PhoneCall className="h-6 w-6" style={{ color: theme.primaryText }} />
              <span className="text-xl sm:text-2xl font-bold tracking-wide" style={{ color: theme.primaryText }}>{demoNumber}</span>
            </div>
            <button
              onClick={() => copyToClipboard(agency!.demo_phone_number!)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: theme.primaryText }}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <div className="flex items-start gap-3 rounded-lg p-3" style={{ backgroundColor: theme.hover }}>
              <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.primary }} />
              <div>
                <p className="text-xs font-medium" style={{ color: theme.text }}>Post-call SMS</p>
                <p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted }}>Callers automatically receive your signup link via text after hanging up</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg p-3" style={{ backgroundColor: theme.hover }}>
              <Headphones className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.primary }} />
              <div>
                <p className="text-xs font-medium" style={{ color: theme.text }}>On your marketing site</p>
                <p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted }}>This number appears automatically in your "Experience It Live" section</p>
              </div>
            </div>
          </div>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 text-xs sm:text-sm transition-colors"
              style={{ color: theme.errorText }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete demo number
            </button>
          ) : (
            <div
              className="flex items-center justify-between rounded-lg p-3"
              style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}
            >
              <p className="text-xs sm:text-sm" style={{ color: theme.errorText }}>
                This will release the phone number permanently. Are you sure?
              </p>
              <div className="flex gap-2 flex-shrink-0 ml-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: theme.hover, color: theme.textMuted }}>Cancel</button>
                <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50" style={{ backgroundColor: '#dc2626' }}>
                  {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>

        <div
          className="rounded-xl overflow-hidden mb-6"
          style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
            <div className="flex items-center gap-2">
              <PhoneCall className="h-4 w-4" style={{ color: theme.primary }} />
              <h3 className="font-semibold text-sm sm:text-base">Demo Call History</h3>
            </div>
          </div>

          {agency?.id && <DemoCallsList agencyId={agency.id} theme={theme} />}
        </div>

        <HowItWorksCard theme={theme} />

        {error && (
          <div
            className="mt-4 rounded-xl p-4 flex items-start gap-3 text-sm"
            style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}`, color: theme.errorText }}
          >
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>
    );
  }

  // CREATE STATE
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold">Demo Phone</h1>
        <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
          Create a dedicated phone number that showcases AI receptionist capabilities to prospects
        </p>
      </div>

      <div
        className="rounded-xl p-5 sm:p-6 mb-6"
        style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: theme.primary15, color: theme.primary }}>
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base sm:text-lg">Create Your Demo Number</h3>
            <p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>
              Get a phone number prospects can call to experience your AI receptionist
            </p>
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: theme.text }}>Area Code</label>
          <p className="text-[10px] sm:text-xs mb-2" style={{ color: theme.textMuted }}>
            Choose an area code that matches your target market. We&apos;ll provision a local number.
          </p>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: theme.textMuted }}>(</span>
              <input
                type="text"
                value={areaCode}
                onChange={(e) => { setAreaCode(e.target.value.replace(/\D/g, '').slice(0, 3)); setError(''); }}
                placeholder="404"
                maxLength={3}
                className="w-24 rounded-lg pl-6 pr-6 py-2.5 text-center text-lg font-mono font-bold tracking-widest transition-colors focus:outline-none"
                style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: theme.textMuted }}>)</span>
            </div>
            <span className="text-sm" style={{ color: theme.textMuted }}>XXX-XXXX</span>
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={creating || !areaCode || areaCode.length < 3}
          className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99]"
          style={{ backgroundColor: theme.primary, color: theme.primaryText }}
        >
          {creating ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Creating demo number...</>
          ) : (
            <><Phone className="h-4 w-4" />Create Demo Number</>
          )}
        </button>

        {creating && (
          <p className="mt-3 text-xs" style={{ color: theme.textMuted }}>
            Setting up your AI assistant and provisioning a phone number. This usually takes 10-15 seconds...
          </p>
        )}

        {error && (
          <div
            className="mt-4 rounded-lg p-3 flex items-start gap-2 text-sm"
            style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}`, color: theme.errorText }}
          >
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      <HowItWorksCard theme={theme} />
    </div>
  );
}

// ============================================================================
// HOW IT WORKS CARD
// ============================================================================
function HowItWorksCard({ theme }: { theme: any }) {
  return (
    <div className="rounded-xl p-5 sm:p-6" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
      <h3 className="font-semibold text-sm sm:text-base mb-1">How the Demo Works</h3>
      <p className="text-xs sm:text-sm mb-5" style={{ color: theme.textMuted }}>
        When a prospect calls your demo number, the AI walks them through an interactive experience
      </p>

      <div className="space-y-4 mb-6">
        {[
          { step: '1', icon: Mic, title: 'AI greets the caller', desc: 'A warm, professional voice answers and explains this is a live demo of your AI receptionist service.' },
          { step: '2', icon: Users, title: 'Gathers business context', desc: 'The AI asks "What type of business do you run?" — plumber, dentist, lawyer, restaurant, anything.' },
          { step: '3', icon: Bot, title: 'Roleplays as their receptionist', desc: 'Based on their answer, the AI acts out a realistic call scenario for their industry — taking a service request, scheduling an appointment, handling an intake call, etc.' },
          { step: '4', icon: Sparkles, title: 'Showcases key features', desc: 'The AI naturally mentions instant text summaries, 24/7 availability, and how setup takes just minutes — all within the conversation.' },
          { step: '5', icon: MessageSquare, title: 'Follow-up SMS with signup link', desc: 'After the call ends, the caller automatically receives a text with your signup link so they can start their free trial.' },
        ].map((item) => (
          <div key={item.step} className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 mt-0.5" style={{ backgroundColor: theme.primary + '12', color: theme.primary }}>
              <item.icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium" style={{ color: theme.text }}>
                <span className="inline-flex items-center justify-center h-4 w-4 rounded-full text-[10px] font-bold mr-1.5" style={{ backgroundColor: theme.primary20, color: theme.primary }}>{item.step}</span>
                {item.title}
              </p>
              <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: theme.textMuted }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg p-4" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}` }}>
        <p className="text-xs font-medium mb-2" style={{ color: theme.text }}>💡 Why this converts</p>
        <p className="text-[10px] sm:text-xs leading-relaxed" style={{ color: theme.textMuted }}>
          Instead of explaining what an AI receptionist does, prospects <strong style={{ color: theme.text }}>experience it firsthand</strong>.
          They hear the voice quality, feel the natural conversation flow, and see how it handles their specific industry —
          all in a 60-second phone call. The follow-up text makes it effortless to convert from &quot;that was cool&quot; to &quot;I want this for my business.&quot;
        </p>
      </div>
    </div>
  );
}
