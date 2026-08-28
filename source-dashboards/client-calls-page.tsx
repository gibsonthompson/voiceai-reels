'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  PhoneCall, Search, Filter, ChevronRight, Loader2, ArrowLeft, Download, X
} from 'lucide-react';
import { useAgency } from '../../../context';
import { DEMO_CLIENTS, DEMO_CLIENT_CALLS } from '../../../demoData';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Language code → display label
const LANGUAGE_LABELS: Record<string, string> = {
  es: 'ES', fr: 'FR', de: 'DE', pt: 'PT', ja: 'JA', ko: 'KO', zh: 'ZH', it: 'IT',
};

interface ClientInfo {
  id: string;
  business_name: string;
  email: string;
}

export default function AgencyClientCallsPage() {
  const params = useParams();
  const clientId = params.id as string;
  const { agency, branding, loading: contextLoading, demoMode } = useAgency();
  
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [calls, setCalls] = useState<any[]>([]);
  const [callsLoading, setCallsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Export state
  const [showExport, setShowExport] = useState(false);
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const isDark = agency?.website_theme !== 'light';
  const primaryColor = branding.primaryColor || '#10b981';

  const theme = isDark ? {
    bg: '#0a0a0a',
    text: '#fafaf9',
    textMuted: 'rgba(250, 250, 249, 0.7)',
    textMuted4: 'rgba(250, 250, 249, 0.5)',
    border: 'rgba(255, 255, 255, 0.1)',
    cardBg: '#111111',
    hoverBg: 'rgba(255, 255, 255, 0.05)',
    inputBg: 'rgba(255, 255, 255, 0.05)',
  } : {
    bg: '#f9fafb',
    text: '#111827',
    textMuted: '#6b7280',
    textMuted4: '#9ca3af',
    border: '#e5e7eb',
    cardBg: '#ffffff',
    hoverBg: '#f3f4f6',
    inputBg: '#ffffff',
  };

  useEffect(() => {
    if (!agency || !clientId) return;
    if (demoMode) {
      const demoClient = DEMO_CLIENTS.find(c => c.id === clientId) || DEMO_CLIENTS[0];
      setClient({ id: demoClient.id, business_name: demoClient.business_name, email: demoClient.email });
      setCalls(DEMO_CLIENT_CALLS);
      setCallsLoading(false);
      return;
    }
    fetchClientAndCalls();
  }, [agency, clientId, demoMode]);

  // Close export panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExport(false);
    }
    if (showExport) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showExport]);

  const fetchClientAndCalls = async () => {
    if (!agency || !clientId) return;
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const clientRes = await fetch(`${backendUrl}/api/agency/${agency.id}/clients/${clientId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (clientRes.ok) {
        const clientData = await clientRes.json();
        setClient(clientData.client);
      }
      const callsRes = await fetch(`${backendUrl}/api/agency/${agency.id}/clients/${clientId}/calls`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (callsRes.ok) {
        const callsData = await callsRes.json();
        setCalls(callsData.calls || []);
      }
    } catch (e) {
      console.error('Failed to fetch client calls:', e);
    } finally {
      setCallsLoading(false);
    }
  };

  const handleExportCalls = async () => {
    if (!agency || !clientId) return;
    setExporting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const params = new URLSearchParams();
      params.set('clientId', clientId);
      if (exportFrom) params.set('from', exportFrom);
      if (exportTo) params.set('to', exportTo);
      const response = await fetch(`${backendUrl}/api/export/agency/${agency.id}/calls?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(client?.business_name || 'client').replace(/[^a-zA-Z0-9]/g, '_')}-calls-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setShowExport(false);
    } catch (e) { console.error('Export failed:', e); }
    finally { setExporting(false); }
  };

  const filteredCalls = calls.filter(call => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      call.customer_name?.toLowerCase().includes(query) ||
      call.customer_phone?.includes(query) ||
      call.caller_phone?.includes(query) ||
      call.service_requested?.toLowerCase().includes(query)
    );
  });

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Back Button */}
      <Link 
        href={`/agency/clients/${clientId}`}
        className="inline-flex items-center gap-2 text-sm transition-colors mb-4 sm:mb-6 hover:opacity-80"
        style={{ color: theme.textMuted }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {client?.business_name || 'Client'}
      </Link>

      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: theme.text }}>
              Call History
            </h1>
            <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
              {client?.business_name ? `${client.business_name} — ` : ''}{calls.length} total calls
            </p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textMuted4 }} />
              <input
                type="text"
                placeholder="Search calls..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-48 lg:w-64 rounded-lg border pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 transition-colors"
                style={{ 
                  borderColor: theme.border, 
                  backgroundColor: theme.inputBg, 
                  color: theme.text,
                }}
              />
            </div>
            
            {/* Export Button */}
            <div className="relative" ref={exportRef}>
              <button 
                onClick={() => setShowExport(!showExport)}
                className="inline-flex items-center gap-2 rounded-lg border px-3 sm:px-4 py-2 text-sm font-medium transition-colors flex-shrink-0"
                style={{ 
                  borderColor: theme.border, 
                  backgroundColor: theme.cardBg, 
                  color: theme.textMuted,
                }}
                title="Export CSV"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </button>

              {showExport && (
                <div
                  className="absolute right-0 top-full mt-2 w-72 rounded-2xl p-4 z-50 shadow-xl"
                  style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold" style={{ color: theme.text }}>Export Calls</p>
                    <button onClick={() => setShowExport(false)} className="p-1 rounded-lg hover:opacity-70" style={{ color: theme.textMuted }}>
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: theme.textMuted }}>From</label>
                      <input
                        type="date"
                        value={exportFrom}
                        onChange={(e) => setExportFrom(e.target.value)}
                        className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                        style={{ backgroundColor: theme.inputBg, border: `1px solid ${theme.border}`, color: theme.text }}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: theme.textMuted }}>To</label>
                      <input
                        type="date"
                        value={exportTo}
                        onChange={(e) => setExportTo(e.target.value)}
                        className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                        style={{ backgroundColor: theme.inputBg, border: `1px solid ${theme.border}`, color: theme.text }}
                      />
                    </div>
                    <p className="text-[11px]" style={{ color: theme.textMuted4 }}>Leave blank to export all calls</p>
                    <button
                      onClick={handleExportCalls}
                      disabled={exporting}
                      className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ backgroundColor: primaryColor, color: '#fff' }}
                    >
                      {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      {exporting ? 'Exporting...' : 'Download CSV'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Calls List */}
      <div className="rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}>
        {callsLoading ? (
          <div className="py-12 sm:py-20 flex items-center justify-center">
            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" style={{ color: theme.textMuted4 }} />
            <span className="ml-2 text-sm" style={{ color: theme.textMuted }}>Loading calls...</span>
          </div>
        ) : filteredCalls.length === 0 ? (
          <div className="py-12 sm:py-20 text-center px-4">
            <div 
              className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: hexToRgba(primaryColor, isDark ? 0.2 : 0.1) }}
            >
              <PhoneCall className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: theme.textMuted4 }} />
            </div>
            <p className="mt-4 font-medium text-sm sm:text-base" style={{ color: theme.textMuted }}>
              {searchQuery ? 'No matching calls found' : 'No calls yet'}
            </p>
            <p className="text-xs sm:text-sm" style={{ color: theme.textMuted4 }}>
              {searchQuery ? 'Try a different search term' : 'Calls will appear here once received'}
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: theme.border }}>
            {filteredCalls.map((call) => {
              const langCode = call.call_language;
              const showLangBadge = langCode && langCode !== 'en';

              return (
              <Link
                key={call.id}
                href={`/agency/clients/${clientId}/calls/${call.id}`}
                className="block transition-colors"
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.hoverBg)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {/* Mobile Layout */}
                <div className="p-3 sm:hidden">
                  <div className="flex items-start gap-3">
                    <div 
                      className="flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: 
                          call.urgency_level === 'high' || call.urgency_level === 'emergency'
                            ? isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'
                            : call.urgency_level === 'medium'
                            ? isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)'
                            : hexToRgba(primaryColor, isDark ? 0.2 : 0.1)
                      }}
                    >
                      <PhoneCall 
                        className="h-5 w-5"
                        style={{
                          color: 
                            call.urgency_level === 'high' || call.urgency_level === 'emergency'
                              ? '#ef4444'
                              : call.urgency_level === 'medium'
                              ? '#f59e0b'
                              : primaryColor
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-medium text-sm truncate" style={{ color: theme.text }}>
                          {call.customer_name || 'Unknown Caller'}
                        </p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {showLangBadge && (
                            <span className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase"
                              style={{ backgroundColor: hexToRgba(primaryColor, isDark ? 0.2 : 0.1), color: primaryColor }}>
                              {LANGUAGE_LABELS[langCode] || langCode.toUpperCase()}
                            </span>
                          )}
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={
                              call.urgency_level === 'high' || call.urgency_level === 'emergency'
                                ? { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }
                                : call.urgency_level === 'medium'
                                ? { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }
                                : { backgroundColor: hexToRgba(primaryColor, isDark ? 0.2 : 0.1), color: theme.textMuted }
                            }
                          >
                            {call.urgency_level || 'normal'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs truncate" style={{ color: theme.textMuted }}>
                        {call.customer_phone || call.caller_phone}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[10px] truncate" style={{ color: theme.textMuted4 }}>
                          {call.service_requested || 'General inquiry'}
                        </p>
                        <p className="text-[10px] flex-shrink-0" style={{ color: theme.textMuted4 }}>
                          {new Date(call.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 flex-shrink-0 self-center" style={{ color: theme.textMuted4 }} />
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden sm:flex items-center justify-between p-4 lg:p-6">
                  <div className="flex items-center gap-3 lg:gap-4">
                    <div 
                      className="flex h-10 w-10 lg:h-12 lg:w-12 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: 
                          call.urgency_level === 'high' || call.urgency_level === 'emergency'
                            ? isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'
                            : call.urgency_level === 'medium'
                            ? isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)'
                            : hexToRgba(primaryColor, isDark ? 0.2 : 0.1)
                      }}
                    >
                      <PhoneCall 
                        className="h-5 w-5 lg:h-6 lg:w-6"
                        style={{
                          color: 
                            call.urgency_level === 'high' || call.urgency_level === 'emergency'
                              ? '#ef4444'
                              : call.urgency_level === 'medium'
                              ? '#f59e0b'
                              : primaryColor
                        }}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-sm lg:text-base" style={{ color: theme.text }}>
                        {call.customer_name || 'Unknown Caller'}
                      </p>
                      <p className="text-xs lg:text-sm" style={{ color: theme.textMuted }}>
                        {call.customer_phone || call.caller_phone}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 lg:gap-6">
                    <div className="text-right hidden lg:block">
                      <p className="text-sm" style={{ color: theme.textMuted }}>
                        {call.service_requested || 'General inquiry'}
                      </p>
                      <p className="text-xs" style={{ color: theme.textMuted4 }}>
                        {call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s` : call.duration ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : '—'}
                      </p>
                    </div>
                    
                    <div className="text-right min-w-[80px] lg:min-w-[100px]">
                      <div className="flex items-center justify-end gap-1.5">
                        {showLangBadge && (
                          <span className="rounded-full px-2 py-0.5 text-[10px] lg:text-xs font-semibold uppercase"
                            style={{ backgroundColor: hexToRgba(primaryColor, isDark ? 0.2 : 0.1), color: primaryColor }}>
                            {LANGUAGE_LABELS[langCode] || langCode.toUpperCase()}
                          </span>
                        )}
                        <span
                          className="rounded-full px-2 lg:px-3 py-0.5 lg:py-1 text-[10px] lg:text-xs font-medium"
                          style={
                            call.urgency_level === 'high' || call.urgency_level === 'emergency'
                              ? { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }
                              : call.urgency_level === 'medium'
                              ? { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }
                              : { backgroundColor: hexToRgba(primaryColor, isDark ? 0.2 : 0.1), color: theme.textMuted }
                          }
                        >
                          {call.urgency_level || 'normal'}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] lg:text-xs" style={{ color: theme.textMuted4 }}>
                        {new Date(call.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <ChevronRight className="h-4 w-4 lg:h-5 lg:w-5" style={{ color: theme.textMuted4 }} />
                  </div>
                </div>
              </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
