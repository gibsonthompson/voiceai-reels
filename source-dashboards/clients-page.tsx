'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Users, PhoneCall, Search, Plus, ChevronRight, Loader2, ArrowUpRight, FlaskConical,
  Download, X,
} from 'lucide-react';
import { useAgency } from '../context';
import { useTheme } from '@/hooks/useTheme';
import { DEMO_CLIENTS } from '../demoData';

interface Client {
  id: string;
  business_name: string;
  email: string;
  owner_name: string;
  owner_phone: string;
  plan_type: string;
  subscription_status: string;
  status: string;
  calls_this_month: number;
  created_at: string;
  vapi_phone_number: string;
  is_test_client?: boolean;
}

export default function AgencyClientsPage() {
  const { agency, loading: contextLoading, demoMode } = useAgency();
  const theme = useTheme();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Export state
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportingClients, setExportingClients] = useState(false);
  const [exportingCalls, setExportingCalls] = useState(false);
  const [showCallsDatePicker, setShowCallsDatePicker] = useState(false);
  const [callsExportFrom, setCallsExportFrom] = useState('');
  const [callsExportTo, setCallsExportTo] = useState('');
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!agency) return;
    if (demoMode) {
      setClients(DEMO_CLIENTS as Client[]);
      setLoading(false);
      return;
    }
    fetchClients();
  }, [agency, demoMode]);

  // Close export menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
        setShowCallsDatePicker(false);
      }
    }
    if (showExportMenu || showCallsDatePicker) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showExportMenu, showCallsDatePicker]);

  const fetchClients = async () => {
    if (!agency) return;
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/clients`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportClients = async () => {
    if (!agency) return;
    setExportingClients(true);
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${backendUrl}/api/export/agency/${agency.id}/clients`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      triggerDownload(blob, `clients-export-${new Date().toISOString().split('T')[0]}.csv`);
      setShowExportMenu(false);
    } catch (e) { console.error('Export failed:', e); }
    finally { setExportingClients(false); }
  };

  const handleExportAllCalls = async () => {
    if (!agency) return;
    setExportingCalls(true);
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const params = new URLSearchParams();
      if (callsExportFrom) params.set('from', callsExportFrom);
      if (callsExportTo) params.set('to', callsExportTo);
      const response = await fetch(`${backendUrl}/api/export/agency/${agency.id}/calls?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      triggerDownload(blob, `agency-calls-export-${new Date().toISOString().split('T')[0]}.csv`);
      setShowCallsDatePicker(false);
      setShowExportMenu(false);
    } catch (e) { console.error('Export failed:', e); }
    finally { setExportingCalls(false); }
  };

  const getPlanPrice = (planType: string) => {
    if (!agency) return 0;
    switch (planType) {
      case 'starter': return agency.price_starter || 4900;
      case 'pro': return agency.price_pro || 9900;
      case 'growth': return agency.price_growth || 14900;
      default: return 0;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active': return { bg: theme.primary15, text: theme.primary, border: theme.primary30 };
      case 'trial': return { bg: theme.warningBg, text: theme.warningText, border: theme.warningBorder };
      case 'past_due': return { bg: theme.warningBg, text: theme.warningText, border: theme.warningBorder };
      case 'suspended':
      case 'cancelled': return { bg: theme.errorBg, text: theme.errorText, border: theme.errorBorder };
      default: return { bg: theme.hover, text: theme.textMuted, border: theme.border };
    }
  };

  // Counts
  const billableClients = clients.filter(c => !c.is_test_client);
  const testClients = clients.filter(c => c.is_test_client);

  // Filter clients — test client always shows but at the bottom
  const filteredClients = clients.filter(client => {
    const matchesSearch = !searchQuery || 
      client.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || 
      client.subscription_status === statusFilter || 
      client.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    // Test clients sort to bottom
    if (a.is_test_client && !b.is_test_client) return 1;
    if (!a.is_test_client && b.is_test_client) return -1;
    return 0;
  });

  if (contextLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.primary }} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Clients</h1>
            <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
              {billableClients.length} client{billableClients.length !== 1 ? 's' : ''}
              {testClients.length > 0 && (
                <span> · {testClients.length} test</span>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Export Dropdown */}
            <div className="relative" ref={exportRef}>
              <button
                onClick={() => { setShowExportMenu(!showExportMenu); setShowCallsDatePicker(false); }}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors flex-shrink-0"
                style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.isDark ? 'rgba(250,250,249,0.7)' : '#374151' }}
                title="Export data"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </button>

              {showExportMenu && !showCallsDatePicker && (
                <div
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden z-50 shadow-xl"
                  style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
                >
                  <button
                    onClick={handleExportClients}
                    disabled={exportingClients}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left"
                    style={{ color: theme.isDark ? 'rgba(250,250,249,0.9)' : '#111827' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {exportingClients ? <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" /> : <Users className="h-4 w-4 flex-shrink-0" style={{ color: theme.textMuted }} />}
                    <span>{exportingClients ? 'Exporting...' : 'Export Client Roster'}</span>
                  </button>
                  <div style={{ borderTop: `1px solid ${theme.border}` }} />
                  <button
                    onClick={() => setShowCallsDatePicker(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left"
                    style={{ color: theme.isDark ? 'rgba(250,250,249,0.9)' : '#111827' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <PhoneCall className="h-4 w-4 flex-shrink-0" style={{ color: theme.textMuted }} />
                    <span>Export All Calls</span>
                  </button>
                </div>
              )}

              {showCallsDatePicker && (
                <div
                  className="absolute right-0 top-full mt-2 w-72 rounded-2xl p-4 z-50 shadow-xl"
                  style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold" style={{ color: theme.isDark ? 'rgba(250,250,249,0.9)' : '#111827' }}>Export All Calls</p>
                    <button onClick={() => { setShowCallsDatePicker(false); setShowExportMenu(false); }} className="p-1 rounded-lg hover:opacity-70" style={{ color: theme.textMuted }}>
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: theme.textMuted }}>From</label>
                      <input
                        type="date"
                        value={callsExportFrom}
                        onChange={(e) => setCallsExportFrom(e.target.value)}
                        className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                        style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.isDark ? 'rgba(250,250,249,0.9)' : '#111827' }}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: theme.textMuted }}>To</label>
                      <input
                        type="date"
                        value={callsExportTo}
                        onChange={(e) => setCallsExportTo(e.target.value)}
                        className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                        style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.isDark ? 'rgba(250,250,249,0.9)' : '#111827' }}
                      />
                    </div>
                    <p className="text-[11px]" style={{ color: theme.textMuted }}>Leave blank to export all calls across all clients</p>
                    <button
                      onClick={handleExportAllCalls}
                      disabled={exportingCalls}
                      className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ backgroundColor: theme.primary, color: theme.primaryText }}
                    >
                      {exportingCalls ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      {exportingCalls ? 'Exporting...' : 'Download CSV'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/agency/clients/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors flex-1 sm:flex-initial sm:w-auto"
              style={{ backgroundColor: theme.primary, color: theme.primaryText }}
            >
              <Plus className="h-4 w-4" />
              Add Client
            </Link>
          </div>
        </div>
        
        {/* Search & Filter Row */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textMuted }} />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm transition-colors focus:outline-none"
              style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}
            />
          </div>
          
          <select
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value || null)}
            className="rounded-xl px-4 py-2.5 text-sm transition-colors focus:outline-none w-full sm:w-auto"
            style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.isDark ? 'rgba(250,250,249,0.7)' : '#374151' }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="past_due">Past Due</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Clients List */}
      <div 
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
      >
        {filteredClients.length === 0 ? (
          <div className="py-16 sm:py-20 text-center px-4">
            <div 
              className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: theme.primary15 }}
            >
              <Users className="h-7 w-7 sm:h-8 sm:w-8" style={{ color: theme.primary80 }} />
            </div>
            <p className="mt-4 font-medium" style={{ color: theme.isDark ? 'rgba(250,250,249,0.7)' : '#374151' }}>
              {searchQuery || statusFilter ? 'No clients match your search' : 'No clients yet'}
            </p>
            <p className="text-sm mt-1" style={{ color: theme.textMuted }}>
              {searchQuery || statusFilter ? 'Try adjusting your filters' : 'Share your signup link to get started!'}
            </p>
          </div>
        ) : (
          <div>
            {/* Table Header - Desktop Only */}
            <div 
              className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 text-xs font-medium uppercase tracking-wide"
              style={{ color: theme.textMuted, borderBottom: `1px solid ${theme.border}` }}
            >
              <div className="col-span-4">Business</div>
              <div className="col-span-2">Plan</div>
              <div className="col-span-2">Calls</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Added</div>
            </div>
            
            {/* Client Rows */}
            <div>
              {filteredClients.map((client, idx) => {
                const statusStyle = getStatusStyle(client.subscription_status || client.status);
                const isTest = client.is_test_client;
                return (
                  <Link
                    key={client.id}
                    href={`/agency/clients/${client.id}`}
                    className="block px-4 sm:px-6 py-4 transition-colors"
                    style={{ 
                      borderBottom: idx < filteredClients.length - 1 ? `1px solid ${theme.borderSubtle}` : 'none',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {/* Mobile Layout */}
                    <div className="lg:hidden">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div 
                            className="flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0"
                            style={{ backgroundColor: isTest ? (theme.isDark ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.1)') : theme.primary15 }}
                          >
                            {isTest ? (
                              <FlaskConical className="h-4 w-4" style={{ color: '#8b5cf6' }} />
                            ) : (
                              <span className="text-sm font-medium" style={{ color: theme.primary }}>
                                {client.business_name?.charAt(0) || '?'}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{client.business_name}</p>
                              {isTest && (
                                <span className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: theme.isDark ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>Test</span>
                              )}
                            </div>
                            <p className="text-sm truncate" style={{ color: theme.textMuted }}>{client.email}</p>
                          </div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 flex-shrink-0" style={{ color: theme.textMuted }} />
                      </div>
                      <div className="flex items-center justify-between text-sm pl-[52px]">
                        <span 
                          className="rounded-full px-2.5 py-1 text-xs font-medium capitalize"
                          style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                        >
                          {client.subscription_status || client.status}
                        </span>
                        <div className="flex items-center gap-3" style={{ color: theme.textMuted }}>
                          {!isTest && <span className="capitalize">{client.plan_type || 'starter'}</span>}
                          {!isTest && <span>·</span>}
                          <span>{client.calls_this_month || 0} calls</span>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center">
                      <div className="col-span-4 flex items-center gap-3">
                        <div 
                          className="flex h-10 w-10 items-center justify-center rounded-lg"
                          style={{ backgroundColor: isTest ? (theme.isDark ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.1)') : theme.primary15 }}
                        >
                          {isTest ? (
                            <FlaskConical className="h-4 w-4" style={{ color: '#8b5cf6' }} />
                          ) : (
                            <span className="text-sm font-medium" style={{ color: theme.primary }}>
                              {client.business_name?.charAt(0) || '?'}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{client.business_name}</p>
                            {isTest && (
                              <span className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: theme.isDark ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>Test</span>
                            )}
                          </div>
                          <p className="text-sm truncate" style={{ color: theme.textMuted }}>{client.email}</p>
                        </div>
                      </div>
                      
                      <div className="col-span-2">
                        {isTest ? (
                          <p className="text-sm" style={{ color: '#8b5cf6' }}>Test client</p>
                        ) : (
                          <>
                            <p className="text-sm capitalize">{client.plan_type || 'starter'}</p>
                            <p className="text-xs" style={{ color: theme.textMuted }}>
                              ${(getPlanPrice(client.plan_type) / 100).toFixed(0)}/mo
                            </p>
                          </>
                        )}
                      </div>
                      
                      <div className="col-span-2 flex items-center gap-2">
                        <PhoneCall className="h-4 w-4" style={{ color: theme.textMuted }} />
                        <span className="text-sm">{client.calls_this_month || 0}</span>
                        <span className="text-xs" style={{ color: theme.textMuted }}>this month</span>
                      </div>
                      
                      <div className="col-span-2">
                        <span 
                          className="inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize"
                          style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                        >
                          {client.subscription_status || client.status}
                        </span>
                      </div>
                      
                      <div className="col-span-2 flex items-center justify-end gap-2">
                        <span className="text-sm" style={{ color: theme.textMuted }}>
                          {new Date(client.created_at).toLocaleDateString()}
                        </span>
                        <ChevronRight className="h-4 w-4" style={{ color: theme.textMuted }} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
