'use client';

import { useState, useEffect } from 'react';
import { 
  Users, DollarSign, PhoneCall, Copy, Check,
  ChevronRight, ArrowUpRight, Loader2, MessageSquare, Send, X,
  Phone, Headphones, Sparkles, Mail, MessageCircle, FlaskConical
} from 'lucide-react';
import { useAgency } from '../context';
import { useTheme } from '../../../hooks/useTheme';
import { DEMO_DASHBOARD } from '../demoData';
import SetupChecklist from '@/components/agency/SetupChecklist';

interface RecentClient {
  id: string;
  business_name: string;
  status: string;
  created_at: string;
  plan_type: string;
  subscription_status: string;
  is_test_client?: boolean;
}

interface DashboardStats {
  clientCount: number;
  mrr: number;
  totalCalls: number;
  recentClients: RecentClient[];
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(cents / 100);
}

function formatDemoPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (ten.length === 10) return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
  return phone;
}

export default function AgencyDashboardPage() {
  const { agency, user, loading: contextLoading, demoMode } = useAgency();
  const theme = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [demoCopied, setDemoCopied] = useState(false);
  const [smsCopied, setSmsCopied] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [testClient, setTestClient] = useState<any>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (!agency) return;
    if (demoMode) { setStats(DEMO_DASHBOARD as DashboardStats); setLoading(false); return; }
    fetchDashboardData();
    fetchTestClient();
  }, [agency, demoMode]);

  const fetchDashboardData = async () => {
    if (!agency) return;
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setStats({ clientCount: data.clientCount || 0, mrr: data.mrr || 0, totalCalls: data.totalCalls || 0, recentClients: data.recentClients || [] });
      }
    } catch (error) { console.error('Failed to fetch dashboard data:', error); }
    finally { setLoading(false); }
  };

  const fetchTestClient = async () => {
    if (!agency) return;
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/test-client`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) { const data = await response.json(); setTestClient(data.client); }
    } catch (err) { console.error('Failed to fetch test client:', err); }
  };

  const handleSendFeedback = async () => {
    if (!agency || !feedbackMessage.trim()) return;
    setSendingFeedback(true); setFeedbackError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ message: feedbackMessage.trim() }) });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Failed to send feedback'); }
      setFeedbackSent(true); setFeedbackMessage('');
      setTimeout(() => { setShowFeedbackModal(false); setFeedbackSent(false); }, 2000);
    } catch (err) { setFeedbackError(err instanceof Error ? err.message : 'Failed to send feedback'); }
    finally { setSendingFeedback(false); }
  };

  const handlePreviewClient = async (clientId: string) => {
    if (!agency) return;
    setPreviewLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/clients/${clientId}/preview-token`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to generate preview token');
      const data = await response.json();
      window.open(`/client/preview?token=${data.token}`, '_blank');
    } catch (err) {
      console.error('Preview failed:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';
  const signupLink = agency?.marketing_domain && agency?.domain_verified ? `https://${agency.marketing_domain}/signup` : `https://${agency?.slug}.${platformDomain}/signup`;
  const copySignupLink = () => { navigator.clipboard.writeText(signupLink); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const copyDemoNumber = () => { navigator.clipboard.writeText(agency?.demo_phone_number || ''); setDemoCopied(true); setTimeout(() => setDemoCopied(false), 2000); };
  const hasDemo = !!agency?.demo_phone_number;
  const demoPhoneDisplay = hasDemo ? formatDemoPhone(agency!.demo_phone_number!) : '';

  const smsTemplate = `Hey — call this number real quick and tell it what your business does:\n\n${demoPhoneDisplay}\n\nIt's an AI that answers phones for businesses. It'll actually roleplay as your receptionist live on the call. Took me 2 min. Curious what you think.`;
  const emailTemplate = `Subject: Try this — call this number and see what picks up\n\nHey,\n\nI've been using an AI that answers phone calls for businesses — real conversations, not a phone tree.\n\nCall this number and tell it what your business does:\n${demoPhoneDisplay}\n\nIt'll answer like your receptionist — booking appointments, handling questions, everything. After the call you get a text summary of what was discussed.\n\nTakes 2 minutes, no signup. Let me know what you think — if you're interested I can set one up for you.\n\n${agency?.name || ''}`;
  const copySmsTemplate = () => { navigator.clipboard.writeText(smsTemplate); setSmsCopied(true); setTimeout(() => setSmsCopied(false), 2000); };
  const copyEmailTemplate = () => { navigator.clipboard.writeText(emailTemplate); setEmailCopied(true); setTimeout(() => setEmailCopied(false), 2000); };

  // Exclude test client from billable count
  const billableClientCount = Math.max(0, (stats?.clientCount || 0) - (testClient ? 1 : 0));

  if (contextLoading || loading) {
    return (<div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.primary }} /></div>);
  }

  const statCards = [
    { label: 'Clients', value: billableClientCount, icon: Users, color: theme.primary },
    { label: 'Monthly Revenue', value: formatCurrency(stats?.mrr || 0), icon: DollarSign, color: theme.warning },
    { label: 'Calls This Month', value: stats?.totalCalls || 0, icon: PhoneCall, color: theme.info },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !sendingFeedback && setShowFeedbackModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: theme.isDark ? '#0a0a0a' : '#ffffff', border: `1px solid ${theme.border}` }}>
            <button onClick={() => setShowFeedbackModal(false)} className="absolute top-4 right-4 p-1 rounded-lg transition-colors" style={{ color: theme.textMuted }}><X className="h-5 w-5" /></button>
            {feedbackSent ? (
              <div className="text-center py-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full mb-3" style={{ backgroundColor: theme.primary15 }}><Check className="h-6 w-6" style={{ color: theme.primary }} /></div>
                <h3 className="text-lg font-semibold" style={{ color: theme.text }}>Feedback Sent</h3>
                <p className="text-sm mt-1" style={{ color: theme.textMuted }}>Thanks for sharing your thoughts.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><MessageSquare className="h-5 w-5" style={{ color: theme.primary }} /></div>
                  <div><h3 className="text-lg font-semibold" style={{ color: theme.text }}>Send Feedback</h3><p className="text-sm" style={{ color: theme.textMuted }}>Questions, issues, or feature requests</p></div>
                </div>
                {feedbackError && (<div className="mb-4 rounded-xl p-3 text-sm" style={{ backgroundColor: theme.errorBg, color: theme.errorText, border: `1px solid ${theme.errorBorder}` }}>{feedbackError}</div>)}
                <textarea value={feedbackMessage} onChange={(e) => setFeedbackMessage(e.target.value)} placeholder="What's on your mind?" rows={4} maxLength={2000} className="w-full rounded-xl px-4 py-3 text-sm resize-none transition-colors" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }} autoFocus />
                <div className="flex items-center justify-between mt-1 mb-4"><span className="text-xs" style={{ color: theme.textMuted }}>{feedbackMessage.length}/2000</span></div>
                <button onClick={handleSendFeedback} disabled={sendingFeedback || !feedbackMessage.trim()} className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
                  {sendingFeedback ? (<><Loader2 className="h-4 w-4 animate-spin" />Sending...</>) : (<><Send className="h-4 w-4" />Send Feedback</>)}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 sm:mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Welcome back{user?.first_name ? `, ${user.first_name}` : ''}!</h1>
          <p className="mt-1 text-sm sm:text-base" style={{ color: theme.textMuted }}>Here&apos;s how your agency is performing.</p>
        </div>
        <button onClick={() => setShowFeedbackModal(true)} className={`inline-flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors flex-shrink-0 ${theme.isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.02]'}`} style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, color: theme.textMuted }}>
          <MessageSquare className="h-4 w-4" /><span className="hidden sm:inline">Feedback</span>
        </button>
      </div>

      {/* Setup Checklist — uses billable count so test client doesn't satisfy "add first client" */}
      <SetupChecklist agency={agency} clientCount={billableClientCount} theme={theme} userRole={user?.role} demoMode={demoMode} />

      {/* YOUR TEST AI */}
      {testClient?.vapi_phone_number && (
        <div className="mb-6 sm:mb-8 rounded-xl p-4 sm:p-5" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: theme.infoBg }}><Phone className="h-4 w-4" style={{ color: theme.info }} /></div>
                <h3 className="font-semibold text-sm" style={{ color: theme.text }}>Your Test AI</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.primary15, color: theme.primary }}>Test Client</span>
              </div>
              <p className="text-xs mb-3" style={{ color: theme.textMuted }}>Call this number to experience what your clients get. This is a fully working AI receptionist.</p>
              <div className="flex items-center gap-2 flex-wrap">
                <a href={`tel:${testClient.vapi_phone_number}`} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all hover:opacity-90" style={{ backgroundColor: theme.primary, color: theme.primaryText }}><Phone className="h-3.5 w-3.5" />Call {formatDemoPhone(testClient.vapi_phone_number)}</a>
                <button onClick={() => handlePreviewClient(testClient.id)} disabled={previewLoading} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}`, color: theme.textMuted }}>{previewLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Loading...</> : 'Preview Client Dashboard'}</button>
              </div>
            </div>
            <div className="text-right flex-shrink-0 hidden sm:block">
              <p className="text-xs" style={{ color: theme.textMuted }}>Usage</p>
              <p className="text-lg font-bold" style={{ color: theme.text }}>{testClient.calls_this_month || 0}<span className="text-sm font-normal" style={{ color: theme.textMuted }}>/{testClient.monthly_call_limit || 30} calls</span></p>
            </div>
          </div>
        </div>
      )}

      {/* TRY YOUR AI */}
      {hasDemo && (
        <div className="mb-6 sm:mb-8 rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.primary}30` }}>
          <div className="p-5 sm:p-6" style={{ background: theme.isDark ? `linear-gradient(135deg, ${theme.primary}15 0%, ${theme.primary}05 100%)` : `linear-gradient(135deg, ${theme.primary}10 0%, ${theme.primary}03 100%)` }}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: theme.primary15 }}><Headphones className="h-4 w-4" style={{ color: theme.primary }} /></div>
                  <h3 className="font-semibold text-sm sm:text-base" style={{ color: theme.text }}>Try Your AI Receptionist</h3>
                </div>
                <p className="text-xs sm:text-sm mb-3" style={{ color: theme.textMuted }}>Call your demo number to hear it in action. Tell it what kind of business you run and watch it roleplay as your receptionist.</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <a href={`tel:${agency?.demo_phone_number}`} className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]" style={{ backgroundColor: theme.primary, color: theme.primaryText }}><Phone className="h-4 w-4" />Call {demoPhoneDisplay}</a>
                  <button onClick={copyDemoNumber} className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}`, color: theme.textMuted }}>{demoCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{demoCopied ? 'Copied' : 'Copy Number'}</button>
                </div>
              </div>
              <div className="hidden sm:flex flex-col items-center justify-center rounded-xl px-5 py-4 flex-shrink-0" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${theme.border}` }}>
                <p className="text-[10px] uppercase tracking-wider font-medium mb-1" style={{ color: theme.textMuted }}>Demo Line</p>
                <p className="text-lg font-bold font-mono tracking-wide" style={{ color: theme.primary }}>{demoPhoneDisplay}</p>
                <div className="flex items-center gap-1 mt-1"><span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#22c55e' }} /><span className="text-[10px] font-medium" style={{ color: '#22c55e' }}>Active</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signup Link Card */}
      <div className="mb-6 sm:mb-8 rounded-xl p-4 sm:p-5" style={{ background: theme.isDark ? `linear-gradient(to right, ${theme.primary}12, transparent)` : `linear-gradient(to right, ${theme.primary}08, transparent)`, border: `1px solid ${theme.primary30}` }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0"><p className="text-xs sm:text-sm mb-1" style={{ color: theme.textMuted }}>Your Client Signup Link</p><p className="text-sm sm:text-lg font-medium truncate" style={{ color: theme.primary }}>{signupLink}</p></div>
          <button onClick={copySignupLink} className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors flex-shrink-0" style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.primary}40`, color: theme.primary }}>{copied ? (<><Check className="h-4 w-4" />Copied!</>) : (<><Copy className="h-4 w-4" />Copy Link</>)}</button>
        </div>
      </div>

      {/* SHARE YOUR DEMO */}
      {hasDemo && (
        <div className="mb-6 sm:mb-8 rounded-xl p-4 sm:p-5" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
          <div className="flex items-center gap-2 mb-1"><Sparkles className="h-4 w-4" style={{ color: theme.primary }} /><h3 className="font-semibold text-sm sm:text-base" style={{ color: theme.text }}>Share Your Demo</h3></div>
          <p className="text-xs sm:text-sm mb-4" style={{ color: theme.textMuted }}>Send prospects your demo number with a ready-to-go message. They call, experience the AI, and get a signup link automatically.</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="rounded-xl p-4" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2"><MessageCircle className="h-3.5 w-3.5" style={{ color: theme.primary }} /><span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>SMS</span></div>
                <button onClick={copySmsTemplate} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors" style={{ backgroundColor: smsCopied ? `${theme.primary}15` : theme.card, border: `1px solid ${smsCopied ? theme.primary + '40' : theme.border}`, color: smsCopied ? theme.primary : theme.textMuted }}>{smsCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}{smsCopied ? 'Copied' : 'Copy'}</button>
              </div>
              <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: theme.text, opacity: 0.8 }}>{smsTemplate}</p>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" style={{ color: theme.primary }} /><span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>Email</span></div>
                <button onClick={copyEmailTemplate} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors" style={{ backgroundColor: emailCopied ? `${theme.primary}15` : theme.card, border: `1px solid ${emailCopied ? theme.primary + '40' : theme.border}`, color: emailCopied ? theme.primary : theme.textMuted }}>{emailCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}{emailCopied ? 'Copied' : 'Copy'}</button>
              </div>
              <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: theme.text, opacity: 0.8, display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{emailTemplate}</p>
            </div>
          </div>
          <p className="text-[10px] sm:text-xs mt-3" style={{ color: theme.textMuted }}>After prospects call your demo, they automatically receive a follow-up text with your signup link.</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-6 grid-cols-1 sm:grid-cols-3 mb-6 sm:mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-xl p-4 sm:p-6" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, boxShadow: theme.isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="flex items-center justify-between sm:justify-start sm:gap-4">
              <div className="order-2 sm:order-1"><p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>{stat.label}</p><p className="mt-0.5 sm:mt-1 text-2xl sm:text-3xl font-semibold" style={{ color: theme.text }}>{stat.value}</p></div>
              <div className="order-1 sm:order-2 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl" style={{ backgroundColor: `${stat.color}15` }}><stat.icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: stat.color }} /></div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Clients */}
      <div className="rounded-xl" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, boxShadow: theme.isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="flex items-center justify-between p-4 sm:p-5" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <h2 className="font-medium text-sm sm:text-base" style={{ color: theme.text }}>Recent Clients</h2>
          <a href="/agency/clients" className="flex items-center gap-1 text-xs sm:text-sm transition-colors" style={{ color: theme.primary }}>View all<ChevronRight className="h-4 w-4" /></a>
        </div>
        <div className="p-4 sm:p-5">
          {!stats?.recentClients || stats.recentClients.length === 0 ? (
            <div className="py-8 sm:py-12 text-center">
              <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full" style={{ backgroundColor: theme.primary15 }}><Users className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: theme.textMuted }} /></div>
              <p className="mt-4 font-medium text-sm sm:text-base" style={{ color: theme.text, opacity: 0.7 }}>No clients yet</p>
              <p className="text-xs sm:text-sm mb-4" style={{ color: theme.textMuted }}>Share your signup link to start acquiring clients.</p>
              <button onClick={copySignupLink} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors" style={{ backgroundColor: theme.primary, color: theme.primaryText }}><Copy className="h-4 w-4" />Copy Signup Link</button>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {stats.recentClients.map((client) => {
                const isTest = client.is_test_client;
                return (
                  <a key={client.id} href={`/agency/clients/${client.id}`} className="flex items-center justify-between rounded-xl p-3 sm:p-4 transition-colors" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hover} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.card}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full flex-shrink-0" style={{ backgroundColor: isTest ? (theme.isDark ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.1)') : theme.primary15 }}>
                        {isTest ? (<FlaskConical className="h-4 w-4" style={{ color: '#8b5cf6' }} />) : (<span className="text-xs sm:text-sm font-medium" style={{ color: theme.primary }}>{client.business_name?.charAt(0) || '?'}</span>)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm sm:text-base truncate" style={{ color: theme.text }}>{client.business_name}</p>
                          {isTest && (<span className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: theme.isDark ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>Test</span>)}
                        </div>
                        <p className="text-xs sm:text-sm capitalize" style={{ color: theme.textMuted }}>{isTest ? 'Test client' : `${client.plan_type || 'starter'} plan`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <span className="rounded-full px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-medium" style={client.subscription_status === 'active' ? { backgroundColor: theme.successBg, color: theme.success } : client.subscription_status === 'trial' || client.subscription_status === 'trialing' ? { backgroundColor: theme.infoBg, color: theme.info } : { backgroundColor: theme.hover, color: theme.textMuted }}>{client.subscription_status === 'trialing' ? 'trial' : (client.subscription_status || 'pending')}</span>
                      <ArrowUpRight className="h-4 w-4 hidden sm:block" style={{ color: theme.textMuted }} />
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
