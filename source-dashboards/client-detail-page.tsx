'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Building2, User, Mail, Phone, MapPin, Globe,
  PhoneCall, CreditCard, Calendar, Clock, ChevronRight, Loader2,
  Copy, Check, ExternalLink, Save, RotateCcw, AlertCircle, Bot,
  Brain, Zap, X, BookOpen, Paintbrush, Lock, ChevronDown
} from 'lucide-react';
import { useAgency } from '../../context';
import { useTheme } from '@/hooks/useTheme';
import { getDemoClientDetail } from '../../demoData';

const INDUSTRY_INTELLIGENCE: Record<string, { label: string; services: number; faqs: number; terms: number; features: string[]; }> = {
  home_services: { label: 'Home Services', services: 47, faqs: 10, terms: 9, features: ['Emergency Triage', 'Seasonal Awareness', 'Urgency Detection'] },
  medical: { label: 'Medical & Dental', services: 38, faqs: 11, terms: 8, features: ['HIPAA Compliant', 'Emergency Triage', 'Insurance Terminology'] },
  professional_services: { label: 'Professional Services', services: 32, faqs: 8, terms: 7, features: ['Engagement Flow', 'NDA Awareness', 'Retainer Handling'] },
  restaurants: { label: 'Restaurants', services: 12, faqs: 12, terms: 7, features: ['Allergen Awareness', 'Reservation Logic', 'Peak Hour Handling'] },
  salon_spa: { label: 'Salon & Spa', services: 42, faqs: 11, terms: 6, features: ['Duration Estimates', 'Upsell Suggestions', 'Cancellation Policy'] },
  retail: { label: 'Retail', services: 10, faqs: 11, terms: 5, features: ['Inventory Checks', 'Return Policy', 'Order Status Handling'] },
  fitness: { label: 'Fitness', services: 28, faqs: 12, terms: 9, features: ['Trial Offers', 'Class Schedules', 'Membership Freeze'] },
  legal: { label: 'Legal Services', services: 35, faqs: 8, terms: 10, features: ['Privilege Compliant', 'No Legal Advice', 'Intake Flow'] },
  real_estate: { label: 'Real Estate', services: 24, faqs: 10, terms: 12, features: ['Buyer/Seller Routing', 'Seasonal Market', 'Mortgage Referrals'] },
  financial: { label: 'Financial Services', services: 30, faqs: 10, terms: 10, features: ['Compliance Safe', 'Tax Season Aware', 'No Financial Advice'] },
  automotive: { label: 'Automotive', services: 40, faqs: 12, terms: 10, features: ['Safety Priority', 'Maintenance Schedules', 'OEM/Aftermarket'] },
};

const INDUSTRY_KEY_MAP: Record<string, string> = {
  'Home Services (plumbing, HVAC, contractors)': 'home_services', 'Medical/Dental': 'medical', 'Retail/E-commerce': 'retail', 'Professional Services (legal, accounting)': 'professional_services', 'Restaurants/Food Service': 'restaurants', 'Salon/Spa (hair, nails, skincare)': 'salon_spa', 'home_services': 'home_services', 'medical': 'medical', 'medical_dental': 'medical', 'retail': 'retail', 'professional_services': 'professional_services', 'restaurants': 'restaurants', 'restaurant': 'restaurants', 'salon_spa': 'salon_spa', 'beauty_wellness': 'salon_spa', 'fitness': 'fitness', 'legal': 'legal', 'real_estate': 'real_estate', 'financial_services': 'financial', 'financial': 'financial', 'automotive': 'automotive', 'general': 'professional_services', 'other': 'professional_services',
};

const INDUSTRY_OPTIONS = [
  { value: 'home_services', label: 'Home Services (Plumbing, HVAC, Contractors)' },
  { value: 'medical', label: 'Medical & Dental' },
  { value: 'professional_services', label: 'Professional Services' },
  { value: 'restaurants', label: 'Restaurants & Food Service' },
  { value: 'salon_spa', label: 'Salon & Spa' },
  { value: 'retail', label: 'Retail' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'legal', label: 'Legal Services' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'financial', label: 'Financial Services' },
  { value: 'automotive', label: 'Automotive' },
];

interface Client { id: string; business_name: string; email: string; owner_name: string; owner_phone: string; business_city?: string; business_state?: string; business_website?: string; industry?: string; plan_type: string; subscription_status: string; status: string; calls_this_month: number; monthly_call_limit?: number; created_at: string; vapi_phone_number: string; vapi_assistant_id?: string; trial_ends_at?: string; logo_url?: string | null; primary_color?: string | null; secondary_color?: string | null; accent_color?: string | null; }
interface Call { id: string; customer_name: string; caller_phone: string; customer_phone?: string; created_at: string; urgency_level: string; call_status: string; duration_seconds?: number; duration?: number; service_requested?: string; }

function ClientBrandingCard({ client, agencyId, theme, backendUrl, onUpdate }: { client: Client; agencyId?: string; theme: any; backendUrl: string; onUpdate: () => void; }) {
  const [brandingOpen, setBrandingOpen] = useState(false);
  const [savingBranding, setSavingBranding] = useState(false);
  const [brandingSaved, setBrandingSaved] = useState(false);
  const [brandingError, setBrandingError] = useState<string | null>(null);
  const [clientLogo, setClientLogo] = useState<string | null>(client.logo_url || null);
  const [clientPrimary, setClientPrimary] = useState(client.primary_color || '');
  const [clientSecondary, setClientSecondary] = useState(client.secondary_color || '');
  const [clientAccent, setClientAccent] = useState(client.accent_color || '');
  const [clientName, setClientName] = useState(client.business_name || '');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 2 * 1024 * 1024) { setBrandingError('Logo must be under 2MB'); return; } const reader = new FileReader(); reader.onload = () => { setClientLogo(reader.result as string); setBrandingSaved(false); }; reader.readAsDataURL(file); };
  const handleSaveBranding = async () => { setSavingBranding(true); setBrandingError(null); setBrandingSaved(false); try { const token = localStorage.getItem('auth_token'); const res = await fetch(`${backendUrl}/api/client/${client.id}/branding`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ logo_url: clientLogo, primary_color: clientPrimary || null, secondary_color: clientSecondary || null, accent_color: clientAccent || null, business_name: clientName }) }); if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to save'); } setBrandingSaved(true); setTimeout(() => setBrandingSaved(false), 3000); onUpdate(); } catch (err: any) { setBrandingError(err.message || 'Failed to save branding'); } finally { setSavingBranding(false); } };
  const handleClearBranding = async () => { if (!confirm('Clear client branding? They will fall back to your agency\'s branding.')) return; setSavingBranding(true); try { const token = localStorage.getItem('auth_token'); await fetch(`${backendUrl}/api/client/${client.id}/branding`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ logo_url: null, primary_color: null, secondary_color: null, accent_color: null }) }); setClientLogo(null); setClientPrimary(''); setClientSecondary(''); setClientAccent(''); onUpdate(); } catch {} finally { setSavingBranding(false); } };
  const hasCustomBranding = client.logo_url || client.primary_color || client.secondary_color || client.accent_color;

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-1"><div className="flex items-center gap-2"><Paintbrush className="h-4 w-4" style={{ color: theme.primary }} /><h2 className="font-semibold text-sm sm:text-base">Client Branding</h2></div>{hasCustomBranding && (<span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.primary15, color: theme.primary }}>Custom</span>)}</div>
        <p className="text-xs mb-3" style={{ color: theme.textMuted }}>Override your agency branding for this client&apos;s dashboard</p>
        <button onClick={() => setBrandingOpen(!brandingOpen)} className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors" style={{ backgroundColor: theme.hover, color: theme.text, border: `1px solid ${theme.border}` }}><Paintbrush className="h-4 w-4" />{brandingOpen ? 'Hide' : 'Configure'} Branding</button>
        {brandingOpen && (
          <div className="mt-4 space-y-4">
            {brandingError && (<div className="rounded-lg p-3 flex items-center gap-2" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}><AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: theme.error }} /><p className="text-xs" style={{ color: theme.errorText }}>{brandingError}</p></div>)}
            {brandingSaved && (<div className="rounded-lg p-3 flex items-center gap-2" style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.primary30}` }}><Check className="h-4 w-4" style={{ color: theme.primary }} /><p className="text-xs" style={{ color: theme.primary }}>Branding saved!</p></div>)}
            <div><label className="text-xs font-medium mb-1 block" style={{ color: theme.textMuted }}>Business Name</label><input type="text" value={clientName} onChange={e => setClientName(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }} /></div>
            <div><label className="text-xs font-medium mb-1 block" style={{ color: theme.textMuted }}>Logo</label><div className="flex items-center gap-3">{clientLogo ? (<img src={clientLogo} alt="Logo" className="h-10 w-10 rounded-lg object-contain" style={{ backgroundColor: theme.hover }} />) : (<div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.hover }}><Building2 className="h-5 w-5" style={{ color: theme.textMuted }} /></div>)}<label className="flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium cursor-pointer transition" style={{ backgroundColor: theme.hover, color: theme.textMuted, border: `1px solid ${theme.border}` }}>Upload Logo<input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" /></label>{clientLogo && (<button onClick={() => { setClientLogo(null); setBrandingSaved(false); }} className="p-2 rounded-lg" style={{ color: theme.textMuted }}><X className="h-4 w-4" /></button>)}</div></div>
            <div className="grid grid-cols-3 gap-2">{[{ label: 'Primary', value: clientPrimary, set: setClientPrimary }, { label: 'Secondary', value: clientSecondary, set: setClientSecondary }, { label: 'Accent', value: clientAccent, set: setClientAccent }].map(({ label, value, set }) => (<div key={label}><label className="text-[10px] font-medium mb-1 block" style={{ color: theme.textMuted }}>{label}</label><div className="flex items-center gap-1.5"><div className="relative"><div className="w-8 h-8 rounded-lg border cursor-pointer" style={{ backgroundColor: value || theme.primary, borderColor: theme.border }} /><input type="color" value={value || theme.primary} onChange={e => { set(e.target.value); setBrandingSaved(false); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /></div><input type="text" value={value} onChange={e => { set(e.target.value); setBrandingSaved(false); }} placeholder="#hex" className="flex-1 px-2 py-1.5 text-[10px] font-mono rounded-lg focus:outline-none min-w-0" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }} maxLength={7} /></div></div>))}</div>
            <div className="flex gap-2">{hasCustomBranding && (<button onClick={handleClearBranding} disabled={savingBranding} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-medium transition disabled:opacity-50" style={{ backgroundColor: theme.hover, color: theme.textMuted, border: `1px solid ${theme.border}` }}><RotateCcw className="h-3.5 w-3.5" /> Clear</button>)}<button onClick={handleSaveBranding} disabled={savingBranding} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-medium transition disabled:opacity-50" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>{savingBranding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}{savingBranding ? 'Saving...' : 'Save Branding'}</button></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgencyClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const { agency, loading: contextLoading, demoMode } = useAgency();
  const theme = useTheme();

  // ── FIX: Derive dark mode for colorScheme on native <select> popups ──
  const isDark = agency?.website_theme !== 'light';

  const [client, setClient] = useState<Client | null>(null);
  const [recentCalls, setRecentCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [promptLoading, setPromptLoading] = useState(true);
  const [promptSaving, setPromptSaving] = useState(false);
  const [promptResetting, setPromptResetting] = useState(false);
  const [promptSaved, setPromptSaved] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [kbModalOpen, setKbModalOpen] = useState(false);
  const [kbContent, setKbContent] = useState('');
  const [kbOriginalContent, setKbOriginalContent] = useState('');
  const [kbLoading, setKbLoading] = useState(false);
  const [kbSaving, setKbSaving] = useState(false);
  const [kbResetting, setKbResetting] = useState(false);
  const [kbEditing, setKbEditing] = useState(false);
  const [kbSaved, setKbSaved] = useState(false);
  const [kbError, setKbError] = useState<string | null>(null);
  const [industryValue, setIndustryValue] = useState('');
  const [industrySaving, setIndustrySaving] = useState(false);
  const [industrySaved, setIndustrySaved] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const isFreePlan = agency?.plan_type === 'free' || agency?.plan_type === 'starter';

  useEffect(() => { if (client?.industry) setIndustryValue(client.industry); }, [client?.industry]);

  const handleSaveIndustry = async (newIndustry: string) => { if (!agency || !clientId || !newIndustry) return; setIndustrySaving(true); setIndustrySaved(false); try { const token = localStorage.getItem('auth_token'); const res = await fetch(`${backendUrl}/api/agency/${agency.id}/clients/${clientId}/industry`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ industry: newIndustry }) }); if (!res.ok) throw new Error('Failed to update industry'); setIndustryValue(newIndustry); setIndustrySaved(true); setTimeout(() => setIndustrySaved(false), 3000); fetchClientData(); } catch (err) { console.error('Failed to save industry:', err); } finally { setIndustrySaving(false); } };

  useEffect(() => { if (!agency || !clientId) return; if (demoMode) { const demoData = getDemoClientDetail(clientId); setClient(demoData.client as Client); setRecentCalls(demoData.calls as Call[]); setLoading(false); setPromptLoading(false); setSystemPrompt('You are the phone assistant for Demo Business...'); setOriginalPrompt('You are the phone assistant for Demo Business...'); return; } fetchClientData(); }, [agency, clientId, demoMode]);
  useEffect(() => { if (client?.vapi_assistant_id && agency && !demoMode) { fetchPrompt(); } }, [client?.id, client?.vapi_assistant_id]);

  const fetchClientData = async () => { if (!agency || !clientId) return; try { const token = localStorage.getItem('auth_token'); const clientRes = await fetch(`${backendUrl}/api/agency/${agency.id}/clients/${clientId}`, { headers: { 'Authorization': `Bearer ${token}` } }); if (!clientRes.ok) { setError('Client not found'); return; } const clientData = await clientRes.json(); setClient(clientData.client); const callsRes = await fetch(`${backendUrl}/api/agency/${agency.id}/clients/${clientId}/calls`, { headers: { 'Authorization': `Bearer ${token}` } }); if (callsRes.ok) { const callsData = await callsRes.json(); setRecentCalls((callsData.calls || []).slice(0, 5)); } } catch (e) { console.error('Failed to fetch client:', e); setError('Failed to load client'); } finally { setLoading(false); } };
  const fetchPrompt = async () => { if (!agency || !clientId) return; setPromptLoading(true); setPromptError(null); try { const token = localStorage.getItem('auth_token'); const res = await fetch(`${backendUrl}/api/agency/${agency.id}/clients/${clientId}/prompt`, { headers: { 'Authorization': `Bearer ${token}` } }); if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to load prompt'); } const data = await res.json(); setSystemPrompt(data.system_prompt || ''); setOriginalPrompt(data.system_prompt || ''); } catch (err) { console.error('Failed to fetch prompt:', err); setPromptError(err instanceof Error ? err.message : 'Failed to load prompt'); } finally { setPromptLoading(false); } };
  const handleSavePrompt = async () => { if (!agency || !clientId) return; setPromptSaving(true); setPromptError(null); setPromptSaved(false); try { const token = localStorage.getItem('auth_token'); const res = await fetch(`${backendUrl}/api/agency/${agency.id}/clients/${clientId}/prompt`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ system_prompt: systemPrompt }) }); if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to save prompt'); } const data = await res.json(); setOriginalPrompt(data.system_prompt); setSystemPrompt(data.system_prompt); setPromptSaved(true); setTimeout(() => setPromptSaved(false), 3000); } catch (err) { setPromptError(err instanceof Error ? err.message : 'Failed to save'); } finally { setPromptSaving(false); } };
  const handleResetPrompt = async () => { if (!agency || !clientId) return; if (!confirm('Reset to the default industry prompt? Your custom changes will be lost.')) return; setPromptResetting(true); setPromptError(null); setPromptSaved(false); try { const token = localStorage.getItem('auth_token'); const res = await fetch(`${backendUrl}/api/agency/${agency.id}/clients/${clientId}/prompt/reset`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }); if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to reset prompt'); } const data = await res.json(); setSystemPrompt(data.system_prompt); setOriginalPrompt(data.system_prompt); setPromptSaved(true); setTimeout(() => setPromptSaved(false), 3000); } catch (err) { setPromptError(err instanceof Error ? err.message : 'Failed to reset'); } finally { setPromptResetting(false); } };
  const promptHasChanges = systemPrompt !== originalPrompt;
  const fetchKnowledgeBase = async () => { if (!agency || !clientId) return; setKbLoading(true); setKbError(null); try { const token = localStorage.getItem('auth_token'); const res = await fetch(`${backendUrl}/api/agency/${agency.id}/clients/${clientId}/knowledge-base`, { headers: { 'Authorization': `Bearer ${token}` } }); if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to load knowledge base'); } const data = await res.json(); setKbContent(data.content || ''); setKbOriginalContent(data.content || ''); } catch (err) { setKbError(err instanceof Error ? err.message : 'Failed to load knowledge base'); } finally { setKbLoading(false); } };
  const handleOpenKbModal = () => { setKbModalOpen(true); setKbEditing(false); setKbSaved(false); setKbError(null); fetchKnowledgeBase(); };
  const handleSaveKb = async () => { if (!agency || !clientId) return; setKbSaving(true); setKbError(null); setKbSaved(false); try { const token = localStorage.getItem('auth_token'); const res = await fetch(`${backendUrl}/api/agency/${agency.id}/clients/${clientId}/knowledge-base`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ content: kbContent }) }); if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to save'); } const data = await res.json(); setKbOriginalContent(data.content); setKbContent(data.content); setKbEditing(false); setKbSaved(true); setTimeout(() => setKbSaved(false), 3000); } catch (err) { setKbError(err instanceof Error ? err.message : 'Failed to save'); } finally { setKbSaving(false); } };
  const handleResetKb = async () => { if (!agency || !clientId) return; if (!confirm('Reset to the default industry knowledge base? Your custom changes will be lost.')) return; setKbResetting(true); setKbError(null); setKbSaved(false); try { const token = localStorage.getItem('auth_token'); const res = await fetch(`${backendUrl}/api/agency/${agency.id}/clients/${clientId}/knowledge-base/reset`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }); if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to reset'); } const data = await res.json(); setKbContent(data.content); setKbOriginalContent(data.content); setKbEditing(false); setKbSaved(true); setTimeout(() => setKbSaved(false), 3000); } catch (err) { setKbError(err instanceof Error ? err.message : 'Failed to reset'); } finally { setKbResetting(false); } };
  const kbHasChanges = kbContent !== kbOriginalContent;
  const copyPhoneNumber = () => { if (!client?.vapi_phone_number) return; navigator.clipboard.writeText(client.vapi_phone_number); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const handlePreviewAsClient = async () => {
    if (!agency || !clientId) return;
    setPreviewLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${backendUrl}/api/agency/${agency.id}/clients/${clientId}/preview-token`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to generate preview token');
        return;
      }
      const data = await res.json();
      if (data.token) {
        window.open(`/client/preview?token=${data.token}`, '_blank');
      }
    } catch (e) {
      console.error('Preview failed:', e);
      alert('Failed to open client preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const formatPhone = (phone: string) => { if (!phone) return '—'; const digits = phone.replace(/\D/g, ''); if (digits.length === 11 && digits.startsWith('1')) return `(${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`; if (digits.length === 10) return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`; return phone; };
  const getPlanLabel = (plan: string) => { switch (plan) { case 'starter': return 'Starter'; case 'pro': return 'Professional'; case 'growth': return 'Growth'; default: return plan || 'Starter'; } };
  const getPlanPrice = (planType: string) => { if (!agency) return 0; switch (planType) { case 'starter': return agency.price_starter || 9900; case 'pro': return agency.price_pro || 14900; case 'growth': return agency.price_growth || 29900; default: return 0; } };
  const getStatusStyle = (status: string) => { switch (status) { case 'active': return { bg: theme.primary15, text: theme.primary, border: theme.primary30 }; case 'trial': case 'trialing': return { bg: theme.warningBg, text: theme.warningText, border: theme.warningBorder }; case 'past_due': return { bg: theme.warningBg, text: theme.warningText, border: theme.warningBorder }; case 'suspended': case 'cancelled': return { bg: theme.errorBg, text: theme.errorText, border: theme.errorBorder }; default: return { bg: theme.hover, text: theme.textMuted, border: theme.border }; } };

  const industryKey = client?.industry ? (INDUSTRY_KEY_MAP[client.industry] || 'professional_services') : null;
  const intelligence = industryKey ? INDUSTRY_INTELLIGENCE[industryKey] : null;

  if (contextLoading || loading) { return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.primary }} /></div>; }
  if (error || !client) { return (<div className="p-4 sm:p-6 lg:p-8"><Link href="/agency/clients" className="inline-flex items-center gap-2 text-sm transition-colors mb-6 hover:opacity-80" style={{ color: theme.textMuted }}><ArrowLeft className="h-4 w-4" /> Back to Clients</Link><div className="text-center py-20"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: theme.errorBg }}><Building2 className="h-8 w-8" style={{ color: theme.errorText, opacity: 0.5 }} /></div><p className="mt-4 font-medium" style={{ color: theme.textMuted }}>{error || 'Client not found'}</p><Link href="/agency/clients" className="mt-4 inline-flex items-center gap-2 text-sm hover:opacity-80" style={{ color: theme.primary }}><ArrowLeft className="h-4 w-4" /> Return to clients</Link></div></div>); }

  const statusStyle = getStatusStyle(client.subscription_status || client.status);
  const callsUsed = client.calls_this_month || 0;
  const callLimit = client.monthly_call_limit;
  const callPercent = callLimit ? Math.min(100, (callsUsed / callLimit) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Link href="/agency/clients" className="inline-flex items-center gap-2 text-sm transition-colors mb-4 sm:mb-6 hover:opacity-80" style={{ color: theme.textMuted }}><ArrowLeft className="h-4 w-4" /> Back to Clients</Link>

      <div className="mb-6 sm:mb-8"><div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"><div className="flex items-center gap-4"><div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}>{client.logo_url ? (<img src={client.logo_url} alt={client.business_name} className="h-10 w-10 sm:h-12 sm:w-12 object-contain rounded-lg" />) : (<span className="text-xl sm:text-2xl font-medium" style={{ color: theme.primary }}>{client.business_name?.charAt(0) || '?'}</span>)}</div><div className="min-w-0"><h1 className="text-xl sm:text-2xl font-semibold tracking-tight truncate">{client.business_name}</h1><div className="flex items-center gap-2 mt-1 flex-wrap"><span className="inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize" style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}>{client.subscription_status || client.status}</span><span className="text-sm" style={{ color: theme.textMuted }}>{getPlanLabel(client.plan_type)} — ${(getPlanPrice(client.plan_type) / 100).toFixed(0)}/mo</span></div></div></div></div></div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* AI Phone Number */}
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}><div className="p-4 sm:p-6"><div className="flex items-center gap-2 mb-4"><Phone className="h-4 w-4" style={{ color: theme.primary }} /><h2 className="font-semibold text-sm sm:text-base">AI Phone Number</h2></div><div className="flex items-center justify-between gap-3"><div><p className="text-xl sm:text-2xl font-bold" style={{ color: theme.primary }}>{client.vapi_phone_number ? formatPhone(client.vapi_phone_number) : 'Not provisioned'}</p>{client.vapi_assistant_id && <p className="text-xs mt-1" style={{ color: theme.textMuted }}>Assistant: {client.vapi_assistant_id.slice(0, 12)}...</p>}</div>{client.vapi_phone_number && (<button onClick={copyPhoneNumber} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors" style={{ backgroundColor: theme.hover, color: theme.textMuted }}>{copied ? <Check className="h-4 w-4" style={{ color: theme.primary }} /> : <Copy className="h-4 w-4" />}{copied ? 'Copied!' : 'Copy'}</button>)}</div></div></div>

          {/* Business Details */}
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}><div className="p-4 sm:p-6"><div className="flex items-center gap-2 mb-4"><Building2 className="h-4 w-4" style={{ color: theme.primary }} /><h2 className="font-semibold text-sm sm:text-base">Business Details</h2></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{[{ icon: User, label: 'Owner', value: client.owner_name || '—' }, { icon: Mail, label: 'Email', value: client.email }, { icon: Phone, label: 'Phone', value: client.owner_phone ? formatPhone(client.owner_phone) : '—' }, { icon: MapPin, label: 'Location', value: client.business_city && client.business_state ? `${client.business_city}, ${client.business_state}` : '—' }].map(({ icon: Icon, label, value }) => (<div key={label} className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0" style={{ backgroundColor: theme.hover }}><Icon className="h-4 w-4" style={{ color: theme.textMuted }} /></div><div className="min-w-0"><p className="text-xs" style={{ color: theme.textMuted }}>{label}</p><p className="text-sm truncate">{value}</p></div></div>))}<div className="flex items-center gap-3 sm:col-span-2"><div className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0" style={{ backgroundColor: theme.hover }}><Building2 className="h-4 w-4" style={{ color: theme.textMuted }} /></div><div className="flex-1 min-w-0"><p className="text-xs mb-1" style={{ color: theme.textMuted }}>Industry</p><div className="flex items-center gap-2"><div className="relative flex-1"><select value={industryValue || client.industry || ''} onChange={(e) => { setIndustryValue(e.target.value); handleSaveIndustry(e.target.value); }} disabled={industrySaving} className="w-full appearance-none rounded-lg px-3 py-2 pr-8 text-sm transition-colors focus:outline-none disabled:opacity-50" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text, colorScheme: isDark ? 'dark' : 'light' }}><option value="">Select industry...</option>{INDUSTRY_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}</select><ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: theme.textMuted }} /></div>{industrySaving && <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" style={{ color: theme.primary }} />}{industrySaved && <Check className="h-4 w-4 flex-shrink-0" style={{ color: theme.primary }} />}</div></div></div>{client.business_website && (<div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0" style={{ backgroundColor: theme.hover }}><Globe className="h-4 w-4" style={{ color: theme.textMuted }} /></div><div className="min-w-0"><p className="text-xs" style={{ color: theme.textMuted }}>Website</p><a href={client.business_website} target="_blank" rel="noopener noreferrer" className="text-sm truncate block hover:underline" style={{ color: theme.primary }}>{client.business_website.replace(/^https?:\/\//, '')}</a></div></div>)}</div></div></div>

          {/* AI Prompt */}
          {client.vapi_assistant_id && (<div className="rounded-xl overflow-hidden" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}><div className="p-4 sm:p-6"><div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><Bot className="h-4 w-4" style={{ color: theme.primary }} /><h2 className="font-semibold text-sm sm:text-base">AI Receptionist Prompt</h2></div>{promptHasChanges && <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: theme.warningBg, color: theme.warningText }}>Unsaved changes</span>}</div><p className="text-xs mb-4" style={{ color: theme.textMuted }}>This is the system prompt that controls how this client&apos;s AI receptionist behaves on calls. Changes take effect immediately on the next call.</p>{promptError && <div className="mb-4 rounded-lg p-3 flex items-center gap-2" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}><AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: theme.errorText }} /><p className="text-xs" style={{ color: theme.errorText }}>{promptError}</p></div>}{promptSaved && <div className="mb-4 rounded-lg p-3 flex items-center gap-2" style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.primary30}` }}><Check className="h-4 w-4" style={{ color: theme.primary }} /><p className="text-xs" style={{ color: theme.primary }}>Prompt updated — changes are live on the next call.</p></div>}{promptLoading ? (<div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.primary }} /></div>) : (<><textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={14} className="w-full rounded-xl px-4 py-3 text-sm font-mono transition-colors resize-y focus:outline-none" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text, minHeight: '200px' }} placeholder="Enter system prompt..." /><div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"><button onClick={handleResetPrompt} disabled={promptResetting || promptSaving} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.textMuted }}>{promptResetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} Reset to Default</button><button onClick={handleSavePrompt} disabled={promptSaving || promptResetting || !promptHasChanges} className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-50" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>{promptSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save Prompt</>}</button></div></>)}</div></div>)}

          {/* Recent Calls */}
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}><div className="p-4 sm:p-6 flex items-center justify-between"><div className="flex items-center gap-2"><PhoneCall className="h-4 w-4" style={{ color: theme.primary }} /><h2 className="font-semibold text-sm sm:text-base">Recent Calls</h2></div><Link href={`/agency/clients/${clientId}/calls`} className="inline-flex items-center gap-1 text-sm font-medium hover:opacity-80 transition-colors" style={{ color: theme.primary }}>View All<ChevronRight className="h-4 w-4" /></Link></div>{recentCalls.length === 0 ? (<div className="px-4 sm:px-6 pb-6 text-center py-8"><PhoneCall className="h-8 w-8 mx-auto mb-2" style={{ color: theme.textMuted, opacity: 0.4 }} /><p className="text-sm" style={{ color: theme.textMuted }}>No calls yet</p></div>) : (<div>{recentCalls.map((call) => (<Link key={call.id} href={`/agency/clients/${clientId}/calls/${call.id}`} className="flex items-center justify-between px-4 sm:px-6 py-3 transition-colors" style={{ borderTop: `1px solid ${theme.borderSubtle}` }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hover} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><div className="flex items-center gap-3 min-w-0"><PhoneCall className="h-4 w-4 flex-shrink-0" style={{ color: theme.textMuted }} /><div className="min-w-0"><p className="text-sm font-medium truncate">{call.customer_name || 'Unknown Caller'}</p><p className="text-xs" style={{ color: theme.textMuted }}>{call.service_requested || 'General inquiry'}</p></div></div><div className="flex items-center gap-3 flex-shrink-0"><span className="text-xs" style={{ color: theme.textMuted }}>{new Date(call.created_at).toLocaleDateString()}</span><ChevronRight className="h-4 w-4" style={{ color: theme.textMuted }} /></div></Link>))}</div>)}</div>
        </div>

        {/* Right Column */}
        <div className="space-y-4 sm:space-y-6">
          {/* Knowledge Base */}
          {client.vapi_assistant_id && (<div className="rounded-xl overflow-hidden" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}><div className="p-4 sm:p-6"><div className="flex items-center gap-2 mb-1"><BookOpen className="h-4 w-4" style={{ color: theme.primary }} /><h2 className="font-semibold text-sm sm:text-base">Knowledge Base</h2></div><p className="text-xs mb-4" style={{ color: theme.textMuted }}>{intelligence ? `Pre-loaded ${intelligence.label} knowledge` : 'AI receptionist knowledge base'}</p>{intelligence && (<div className="flex flex-wrap gap-1.5 mb-4">{intelligence.features.map((feature) => (<span key={feature} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: theme.primary + '12', color: theme.primary }}><Zap className="h-3 w-3" />{feature}</span>))}{client.business_website && <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: theme.primary + '12', color: theme.primary }}><Globe className="h-3 w-3" />Website Integrated</span>}</div>)}<button onClick={handleOpenKbModal} className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors" style={{ backgroundColor: theme.hover, color: theme.text, border: `1px solid ${theme.border}` }}><BookOpen className="h-4 w-4" /> View / Edit Knowledge Base</button></div></div>)}

          {/* Client Branding */}
          <div>
            {isFreePlan && (<div className="rounded-xl p-4 mb-4 flex items-center gap-3" style={{ backgroundColor: theme.infoBg, border: `1px solid ${theme.infoBorder}` }}><Lock className="h-4 w-4 flex-shrink-0" style={{ color: theme.infoText }} /><div><p className="text-sm font-medium" style={{ color: theme.infoText }}>Upgrade to Pro</p><p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>Client branding requires Pro or Scale.</p></div></div>)}
            <div style={isFreePlan ? { opacity: 0.4, pointerEvents: 'none' as const } : {}}><ClientBrandingCard client={client} agencyId={agency?.id} theme={theme} backendUrl={backendUrl} onUpdate={fetchClientData} /></div>
          </div>

          {/* Subscription */}
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}><div className="p-4 sm:p-6"><div className="flex items-center gap-2 mb-4"><CreditCard className="h-4 w-4" style={{ color: theme.primary }} /><h2 className="font-semibold text-sm sm:text-base">Subscription</h2></div><div className="space-y-3"><div className="flex items-center justify-between"><span className="text-sm" style={{ color: theme.textMuted }}>Plan</span><span className="text-sm font-medium">{getPlanLabel(client.plan_type)}</span></div><div className="flex items-center justify-between"><span className="text-sm" style={{ color: theme.textMuted }}>Price</span><span className="text-sm font-medium">${(getPlanPrice(client.plan_type) / 100).toFixed(0)}/mo</span></div><div className="flex items-center justify-between"><span className="text-sm" style={{ color: theme.textMuted }}>Status</span><span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize" style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}>{client.subscription_status || client.status}</span></div>{client.trial_ends_at && <div className="flex items-center justify-between"><span className="text-sm" style={{ color: theme.textMuted }}>Trial Ends</span><span className="text-sm">{new Date(client.trial_ends_at).toLocaleDateString()}</span></div>}</div></div></div>

          {/* Call Usage */}
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}><div className="p-4 sm:p-6"><div className="flex items-center gap-2 mb-4"><PhoneCall className="h-4 w-4" style={{ color: theme.primary }} /><h2 className="font-semibold text-sm sm:text-base">Call Usage</h2></div><div className="text-center mb-4"><p className="text-3xl font-bold" style={{ color: theme.primary }}>{callsUsed}</p><p className="text-sm" style={{ color: theme.textMuted }}>calls this month{callLimit ? ` of ${callLimit}` : ''}</p></div>{callLimit && (<div><div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: theme.hover }}><div className="h-full rounded-full transition-all" style={{ width: `${callPercent}%`, backgroundColor: callPercent > 90 ? '#ef4444' : callPercent > 70 ? '#f59e0b' : theme.primary }} /></div><p className="text-xs mt-2 text-right" style={{ color: theme.textMuted }}>{Math.max(0, callLimit - callsUsed)} remaining</p></div>)}</div></div>

          {/* Quick Info */}
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}><div className="p-4 sm:p-6"><div className="flex items-center gap-2 mb-4"><Calendar className="h-4 w-4" style={{ color: theme.primary }} /><h2 className="font-semibold text-sm sm:text-base">Quick Info</h2></div><div className="space-y-3"><div className="flex items-center justify-between"><span className="text-sm" style={{ color: theme.textMuted }}>Client Since</span><span className="text-sm">{new Date(client.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></div></div></div></div>

          {/* Actions */}
          <div className="space-y-2">
            <Link href={`/agency/clients/${clientId}/calls`} className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-2.5 text-sm font-medium transition-colors" style={{ backgroundColor: theme.primary, color: theme.primaryText }}><PhoneCall className="h-4 w-4" /> View Call History</Link>
            <button
              onClick={handlePreviewAsClient}
              disabled={previewLoading}
              className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: theme.hover, color: theme.text, border: `1px solid ${theme.border}` }}
            >
              {previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
              {previewLoading ? 'Opening...' : 'Login as Client'}
            </button>
          </div>
        </div>
      </div>

      {/* Knowledge Base Modal */}
      {kbModalOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }} onClick={(e) => { if (e.target === e.currentTarget && !kbHasChanges) setKbModalOpen(false); }}><div className="w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl" style={{ backgroundColor: theme.card, border: `2px solid ${theme.border}` }}><div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: `1px solid ${theme.border}` }}><div><div className="flex items-center gap-2"><BookOpen className="h-5 w-5" style={{ color: theme.primary }} /><h2 className="text-lg font-semibold">Knowledge Base</h2></div><p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{client.business_name} — {intelligence?.label || 'Custom'}</p></div><div className="flex items-center gap-2">{!kbEditing && !kbLoading && <button onClick={() => setKbEditing(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors" style={{ backgroundColor: theme.hover, color: theme.text }}><Brain className="h-4 w-4" />Edit</button>}<button onClick={() => { if (kbHasChanges) { if (confirm('You have unsaved changes. Close anyway?')) { setKbModalOpen(false); setKbEditing(false); } } else { setKbModalOpen(false); setKbEditing(false); } }} className="flex items-center justify-center h-9 w-9 rounded-lg transition-colors" style={{ backgroundColor: theme.hover }}><X className="h-5 w-5" style={{ color: theme.textMuted }} /></button></div></div><div className="flex-1 overflow-y-auto p-6">{kbError && <div className="mb-4 rounded-lg p-3 flex items-center gap-2" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}><AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: theme.errorText }} /><p className="text-xs" style={{ color: theme.errorText }}>{kbError}</p></div>}{kbSaved && <div className="mb-4 rounded-lg p-3 flex items-center gap-2" style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.primary30}` }}><Check className="h-4 w-4" style={{ color: theme.primary }} /><p className="text-xs" style={{ color: theme.primary }}>Knowledge base updated — changes are live on the next call.</p></div>}{kbLoading ? (<div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.primary }} /></div>) : kbEditing ? (<textarea value={kbContent} onChange={(e) => setKbContent(e.target.value)} className="w-full h-full min-h-[50vh] rounded-xl px-4 py-3 text-sm font-mono transition-colors resize-y focus:outline-none" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }} />) : (<div className="rounded-xl px-5 py-4 text-sm font-mono whitespace-pre-wrap leading-relaxed overflow-auto" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text, minHeight: '50vh' }}>{kbContent || 'No knowledge base content found.'}</div>)}</div>{kbEditing && !kbLoading && (<div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderTop: `1px solid ${theme.border}` }}><button onClick={handleResetKb} disabled={kbResetting || kbSaving} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.textMuted }}>{kbResetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} Reset to Default</button><div className="flex items-center gap-2"><button onClick={() => { setKbContent(kbOriginalContent); setKbEditing(false); }} disabled={kbSaving} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.textMuted }}>Cancel</button><button onClick={handleSaveKb} disabled={kbSaving || kbResetting || !kbHasChanges} className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-50" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>{kbSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save Changes</>}</button></div></div>)}</div></div>)}
    </div>
  );
}
