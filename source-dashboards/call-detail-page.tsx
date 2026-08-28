'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Phone, Settings, ArrowLeft, Clock,
  User, MapPin, AlertCircle, MessageSquare, Loader2, Building2
} from 'lucide-react';
import CallPlayback from '@/components/client/CallPlayback';
import { useAgency } from '../../../../context';
import { DEMO_CLIENTS, getDemoCallDetail } from '../../../../demoData';

interface Call {
  id: string;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
  caller_phone: string | null;
  customer_email: string | null;
  customer_address: string | null;
  service_requested: string | null;
  urgency_level: string | null;
  ai_summary: string | null;
  transcript: string | null;
  recording_url: string | null;
  duration_seconds: number | null;
  call_status: string | null;
}

interface ClientInfo {
  id: string;
  business_name: string;
  email: string;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}

export default function AgencyCallDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const callId = params.callId as string;
  const { agency, branding, loading: contextLoading, demoMode } = useAgency();
  
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [callLoading, setCallLoading] = useState(true);

  // Theme - default to dark unless explicitly light
  const isDark = agency?.website_theme !== 'light';
  const primaryColor = branding.primaryColor || '#10b981';
  const primaryLight = isLightColor(primaryColor);

  const theme = isDark ? {
    bg: '#0a0a0a',
    text: '#fafaf9',
    textMuted: 'rgba(250, 250, 249, 0.7)',
    textMuted4: 'rgba(250, 250, 249, 0.5)',
    border: 'rgba(255, 255, 255, 0.1)',
    cardBg: '#111111',
    hoverBg: 'rgba(255, 255, 255, 0.05)',
  } : {
    bg: '#f9fafb',
    text: '#111827',
    textMuted: '#6b7280',
    textMuted4: '#9ca3af',
    border: '#e5e7eb',
    cardBg: '#ffffff',
    hoverBg: '#f3f4f6',
  };

  useEffect(() => {
    if (!agency || !clientId || !callId) return;

    // Demo mode: use sample data
    if (demoMode) {
      const demoClient = DEMO_CLIENTS.find(c => c.id === clientId) || DEMO_CLIENTS[0];
      setClient({ id: demoClient.id, business_name: demoClient.business_name, email: demoClient.email });
      const demoCall = getDemoCallDetail(callId);
      setCall({
        ...demoCall,
        duration_seconds: demoCall.duration_seconds,
        customer_phone: demoCall.customer_phone || demoCall.caller_phone,
        caller_phone: demoCall.caller_phone,
        customer_email: demoCall.customer_email,
        customer_address: demoCall.customer_address,
        service_requested: demoCall.service_requested,
        urgency_level: demoCall.urgency_level,
        ai_summary: demoCall.ai_summary,
        transcript: demoCall.transcript,
        recording_url: demoCall.recording_url,
        call_status: demoCall.call_status,
      } as Call);
      setCallLoading(false);
      return;
    }

    fetchData();
  }, [agency, clientId, callId, demoMode]);

  const fetchData = async () => {
    if (!agency || !clientId || !callId) return;
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      // Fetch client info
      const clientRes = await fetch(`${backendUrl}/api/agency/${agency.id}/clients/${clientId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (clientRes.ok) {
        const clientData = await clientRes.json();
        setClient(clientData.client);
      }

      // Fetch call detail
      const callRes = await fetch(`${backendUrl}/api/agency/${agency.id}/clients/${clientId}/calls/${callId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (callRes.ok) {
        const callData = await callRes.json();
        setCall(callData.call);
      }
    } catch (error) {
      console.error('Error loading call detail:', error);
    } finally {
      setCallLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  if (callLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
        <span className="ml-2 text-sm" style={{ color: theme.textMuted }}>Loading call details...</span>
      </div>
    );
  }

  if (!call) {
    return (
      <div className="p-4 sm:p-8 text-center">
        <div 
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}
        >
          <Phone className="h-7 w-7" style={{ color: '#f87171', opacity: 0.5 }} />
        </div>
        <p className="mt-4 font-medium" style={{ color: theme.textMuted }}>Call not found</p>
        <Link 
          href={`/agency/clients/${clientId}/calls`}
          className="text-sm mt-2 inline-flex items-center gap-1"
          style={{ color: primaryColor }}
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Calls
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Back Navigation */}
      <Link 
        href={`/agency/clients/${clientId}/calls`}
        className="inline-flex items-center gap-2 text-sm transition-colors mb-4 sm:mb-6 hover:opacity-80"
        style={{ color: theme.textMuted }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {client?.business_name ? `${client.business_name} Calls` : 'Calls'}
      </Link>

      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold truncate" style={{ color: theme.text }}>
              Call with {call.customer_name || 'Unknown Caller'}
            </h1>
            <div className="flex items-center gap-2 mt-0.5 sm:mt-1 flex-wrap">
              {client && (
                <span className="inline-flex items-center gap-1 text-xs sm:text-sm" style={{ color: primaryColor }}>
                  <Building2 className="h-3 w-3" />
                  {client.business_name}
                </span>
              )}
              <span className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>
                {client ? '•' : ''} {new Date(call.created_at).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
                {call.duration_seconds && ` • ${formatDuration(call.duration_seconds)}`}
              </span>
            </div>
          </div>
          
          <span
            className="self-start rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium border whitespace-nowrap"
            style={
              call.urgency_level === 'high' || call.urgency_level === 'emergency'
                ? { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }
                : call.urgency_level === 'medium'
                ? { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }
                : { backgroundColor: hexToRgba(primaryColor, isDark ? 0.2 : 0.1), color: theme.textMuted, borderColor: theme.border }
            }
          >
            {call.urgency_level ? `${call.urgency_level.charAt(0).toUpperCase()}${call.urgency_level.slice(1)}` : 'Normal'} Priority
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* AI Summary */}
          {call.ai_summary && (
            <div className="rounded-xl border p-4 sm:p-6 shadow-sm" style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}>
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div 
                  className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg" 
                  style={{ backgroundColor: hexToRgba(primaryColor, isDark ? 0.2 : 0.1) }}
                >
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: primaryColor }} />
                </div>
                <h2 className="font-semibold text-sm sm:text-base" style={{ color: theme.text }}>AI Summary</h2>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }}>{call.ai_summary}</p>
            </div>
          )}

          {/* Recording */}
          {call.recording_url && (
            <div className="rounded-xl border p-4 sm:p-6 shadow-sm" style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}>
              <h2 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4" style={{ color: theme.text }}>Recording</h2>
              <CallPlayback 
                recordingUrl={call.recording_url}
                callDuration={call.duration_seconds || undefined}
                brandColor={primaryColor}
              />
            </div>
          )}

          {/* Transcript */}
          {call.transcript && (
            <div className="rounded-xl border p-4 sm:p-6 shadow-sm" style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}>
              <h2 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4" style={{ color: theme.text }}>Full Transcript</h2>
              <div 
                className="rounded-lg border p-3 sm:p-4 max-h-64 sm:max-h-96 overflow-y-auto" 
                style={{ borderColor: theme.border, backgroundColor: theme.bg }}
              >
                <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed" style={{ color: theme.textMuted }}>{call.transcript}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Contact Details */}
          <div className="rounded-xl border p-4 sm:p-6 shadow-sm" style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}>
            <h2 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4" style={{ color: theme.text }}>Contact Details</h2>
            <div className="space-y-3 sm:space-y-4">
              {call.customer_name && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div 
                    className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg" 
                    style={{ backgroundColor: theme.bg }}
                  >
                    <User className="h-4 w-4" style={{ color: theme.textMuted }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted4 }}>Name</p>
                    <p className="text-xs sm:text-sm truncate" style={{ color: theme.text }}>{call.customer_name}</p>
                  </div>
                </div>
              )}
              
              {(call.customer_phone || call.caller_phone) && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div 
                    className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg" 
                    style={{ backgroundColor: theme.bg }}
                  >
                    <Phone className="h-4 w-4" style={{ color: theme.textMuted }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted4 }}>Phone</p>
                    <a 
                      href={`tel:${call.customer_phone || call.caller_phone}`}
                      className="text-xs sm:text-sm transition-colors hover:underline"
                      style={{ color: primaryColor }}
                    >
                      {call.customer_phone || call.caller_phone}
                    </a>
                  </div>
                </div>
              )}

              {call.customer_email && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div 
                    className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg" 
                    style={{ backgroundColor: theme.bg }}
                  >
                    <MessageSquare className="h-4 w-4" style={{ color: theme.textMuted }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted4 }}>Email</p>
                    <a 
                      href={`mailto:${call.customer_email}`}
                      className="text-xs sm:text-sm transition-colors hover:underline truncate block"
                      style={{ color: primaryColor }}
                    >
                      {call.customer_email}
                    </a>
                  </div>
                </div>
              )}
              
              {call.customer_address && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div 
                    className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg" 
                    style={{ backgroundColor: theme.bg }}
                  >
                    <MapPin className="h-4 w-4" style={{ color: theme.textMuted }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted4 }}>Address</p>
                    <p className="text-xs sm:text-sm" style={{ color: theme.text }}>{call.customer_address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Call Details */}
          <div className="rounded-xl border p-4 sm:p-6 shadow-sm" style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}>
            <h2 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4" style={{ color: theme.text }}>Call Details</h2>
            <div className="space-y-3 sm:space-y-4">
              {call.service_requested && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div 
                    className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg" 
                    style={{ backgroundColor: theme.bg }}
                  >
                    <Settings className="h-4 w-4" style={{ color: theme.textMuted }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted4 }}>Service</p>
                    <p className="text-xs sm:text-sm" style={{ color: theme.text }}>{call.service_requested}</p>
                  </div>
                </div>
              )}
              
              {call.urgency_level && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div 
                    className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg" 
                    style={{ backgroundColor: theme.bg }}
                  >
                    <AlertCircle className="h-4 w-4" style={{ color: theme.textMuted }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted4 }}>Urgency</p>
                    <p className="text-xs sm:text-sm capitalize" style={{ color: theme.text }}>{call.urgency_level}</p>
                  </div>
                </div>
              )}
              
              {call.duration_seconds && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div 
                    className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg" 
                    style={{ backgroundColor: theme.bg }}
                  >
                    <Clock className="h-4 w-4" style={{ color: theme.textMuted }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted4 }}>Duration</p>
                    <p className="text-xs sm:text-sm" style={{ color: theme.text }}>{formatDuration(call.duration_seconds)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 sm:space-y-3">
            <Link 
              href={`/agency/clients/${clientId}/calls`}
              className="flex items-center justify-center gap-2 w-full rounded-full border px-4 py-2.5 sm:py-3 text-sm font-medium transition-colors"
              style={{ 
                borderColor: theme.border, 
                color: theme.textMuted,
                backgroundColor: 'transparent',
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              All Calls
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
