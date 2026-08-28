'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Loader2, Phone, PhoneOff, PhoneCall, Mic, MicOff,
  Bot, User, AlertCircle, Terminal, Code2, FlaskConical, Save,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Check, Building, Search, CircleDot,
  Radio, AlertTriangle, Undo2, Pencil, Sparkles, Building2, Package,
  Wrench, Stethoscope, Scale, Home, Calculator, Briefcase,
  UtensilsCrossed, Dumbbell, ShoppingBag, Car, X, Copy, Info,
  Play, Pause, ArrowUpRight, Maximize2, Minimize2, PhoneForwarded,
  BookOpen, Plus, Trash2, Globe, HelpCircle, FileText
} from 'lucide-react';
import Link from 'next/link';
import { useAgency } from '@/app/agency/context';
import { useTheme } from '@/hooks/useTheme';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import LockedFeature from '@/components/LockedFeature';
import AISettingsSection from '@/components/client/AISettingsSection';
import DashboardAccessSelector from '@/components/agency/DashboardAccessSelector';
import StaffMembersSection from '@/components/client/StaffMembersSection';
import ClientServicesSection from '@/components/client/ClientServicesSection';

const ICON_MAP: Record<string, React.ElementType> = {
  Wrench, Stethoscope, Scale, Home, Calculator, Briefcase,
  UtensilsCrossed, Sparkles, Dumbbell, ShoppingBag, Car, Building2,
};

const MODEL_OPTIONS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', desc: 'Fastest response time, lowest cost — best for real-time voice conversations', tag: 'Default' },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', desc: 'Latest model, better instruction following — same speed tier as 4o Mini', tag: 'Latest' },
  { id: 'gpt-4o', name: 'GPT-4o', desc: 'Strongest reasoning but slower — use for complex industries like legal or medical', tag: 'Premium' },
];

const COMPLIANCE_GREETING = 'This call may be recorded for quality and training purposes.';

interface ClientItem {
  id: string; business_name: string; industry: string; owner_name: string;
  owner_phone: string; email: string; vapi_assistant_id: string | null;
  vapi_phone_number: string | null; subscription_status: string; status: string;
  plan_type: string; business_city: string; business_state: string; call_mode: string;
}

interface AssistantConfig {
  id: string; model: string; voice: string; voiceProvider: string;
  firstMessage: string; systemPrompt: string; temperature: number;
  tools: string[]; toolIds: string[];
}

interface VoiceOption {
  id: string; name: string; description: string; gender: string;
  accent: string; style: string; previewUrl: string; recommended?: boolean;
}

interface TranscriptEntry {
  id: string; role: 'user' | 'assistant'; text: string; isFinal: boolean; timestamp: number;
}

interface EventLogEntry {
  id: string; type: string; timestamp: number; message: string;
  level: 'info' | 'warn' | 'error' | 'success';
}

interface Industry {
  frontendKey: string; label: string; description: string; icon: string; hasCustomTemplate: boolean;
}

type CallState = 'idle' | 'connecting' | 'connected' | 'ended';

function uid(): string { return Math.random().toString(36).substring(2, 10) + Date.now().toString(36); }

function fmtPhone(phone: string | null): string {
  if (!phone) return '—';
  const d = phone.replace(/\D/g, '');
  const t = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  if (t.length === 10) return `(${t.slice(0, 3)}) ${t.slice(3, 6)}-${t.slice(6)}`;
  return phone;
}

function fmtDuration(s: number): string {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

function hexToRgba(hex: string, alpha: number): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch { return `rgba(0,0,0,${alpha})`; }
}

function CallModal({ callState, callDuration, isMuted, transcript, eventLog, theme,
  onEnd, onToggleMute, onClose, clientName, transcriptEndRef, eventLogEndRef,
}: {
  callState: CallState; callDuration: number; isMuted: boolean;
  transcript: TranscriptEntry[]; eventLog: EventLogEntry[]; theme: any;
  onEnd: () => void; onToggleMute: () => void; onClose: () => void;
  clientName: string; transcriptEndRef: React.RefObject<HTMLDivElement | null>;
  eventLogEndRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-5xl rounded-2xl overflow-hidden flex flex-col" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-3">
            {callState === 'connected' ? (
              <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: theme.isDark ? 'rgba(34,197,94,0.15)' : '#f0fdf4', color: '#22c55e' }}>
                <Radio className="h-3 w-3 animate-pulse" /> LIVE
              </span>
            ) : callState === 'connecting' ? (
              <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: theme.primary15, color: theme.primary }}>
                <Loader2 className="h-3 w-3 animate-spin" /> CONNECTING
              </span>
            ) : (
              <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: theme.hover, color: theme.textMuted }}>ENDED</span>
            )}
            <span className="text-sm font-medium" style={{ color: theme.text }}>{clientName}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xl font-mono font-bold tabular-nums" style={{ color: theme.text }}>{fmtDuration(callDuration)}</span>
            {callState === 'ended' && (
              <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: theme.textMuted, backgroundColor: theme.hover }}><X className="h-4 w-4" /></button>
            )}
          </div>
        </div>
        <div className="flex-1 flex min-h-0 overflow-hidden">
          <div className="flex-1 flex flex-col border-r" style={{ borderColor: theme.border }}>
            <div className="px-4 py-2 border-b" style={{ borderColor: theme.border }}>
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>Transcript</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {transcript.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full py-8">
                  <Bot className="h-8 w-8 mb-2" style={{ color: theme.textMuted, opacity: 0.15 }} />
                  <p className="text-xs" style={{ color: theme.textMuted }}>Waiting for speech...</p>
                </div>
              )}
              {transcript.map(e => (
                <div key={e.id} className={`flex gap-2.5 ${e.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {e.role !== 'user' && <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: theme.primary15 }}><Bot className="h-3.5 w-3.5" style={{ color: theme.primary }} /></div>}
                  <div className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                    style={{ backgroundColor: e.role === 'user' ? theme.primary : theme.hover, color: e.role === 'user' ? theme.primaryText : theme.text, opacity: e.isFinal ? 1 : 0.5, borderBottomRightRadius: e.role === 'user' ? '4px' : undefined, borderBottomLeftRadius: e.role !== 'user' ? '4px' : undefined }}>
                    <span style={{ whiteSpace: 'pre-wrap' }}>{e.text}</span>
                  </div>
                  {e.role === 'user' && <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6' }}><User className="h-3.5 w-3.5" style={{ color: theme.textMuted }} /></div>}
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          </div>
          <div className="w-72 flex-shrink-0 flex-col hidden md:flex">
            <div className="px-4 py-2 border-b flex items-center justify-between" style={{ borderColor: theme.border }}>
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>Events</span>
              <span className="text-[10px] font-mono" style={{ color: theme.textMuted }}>{eventLog.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {eventLog.map(e => {
                const c = { info: theme.textMuted, warn: '#f59e0b', error: '#ef4444', success: '#22c55e' }[e.level];
                return (
                  <div key={e.id} className="rounded px-2 py-1 text-[10px] font-mono" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb' }}>
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold truncate" style={{ color: c }}>{e.type}</span>
                      <span className="flex-shrink-0 text-[9px]" style={{ color: theme.textMuted }}>{new Date(e.timestamp).toLocaleTimeString([], { hour12: false })}</span>
                    </div>
                    <p className="truncate" style={{ color: theme.textMuted }}>{e.message}</p>
                  </div>
                );
              })}
              <div ref={eventLogEndRef} />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-4 px-5 py-5 border-t" style={{ borderColor: theme.border }}>
          {callState === 'connected' && (<>
            <button onClick={onToggleMute} className="w-14 h-14 rounded-full flex items-center justify-center transition-all"
              style={{ backgroundColor: isMuted ? (theme.isDark ? 'rgba(239,68,68,0.15)' : '#fef2f2') : theme.hover, border: `2px solid ${isMuted ? 'rgba(239,68,68,0.4)' : theme.border}`, color: isMuted ? '#ef4444' : theme.text }}>
              {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </button>
            <button onClick={onEnd} className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: '#ef4444', color: '#fff', boxShadow: '0 0 20px rgba(239,68,68,0.3)' }}>
              <PhoneOff className="h-7 w-7" />
            </button>
          </>)}
          {callState === 'connecting' && (
            <button onClick={onEnd} className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium"
              style={{ color: '#ef4444', backgroundColor: theme.isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2' }}><X className="h-4 w-4" /> Cancel</button>
          )}
          {callState === 'ended' && (
            <button onClick={onClose} className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium"
              style={{ backgroundColor: theme.primary, color: theme.primaryText }}>Close</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AILabPage() {
  const { agency, loading: ctxLoading, effectivePlan } = useAgency();
  const theme = useTheme();
  const { canUseAiLab } = usePlanFeatures();
  const api = process.env.NEXT_PUBLIC_API_URL || '';
  const vapiKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || '';

  const [clients, setClients] = useState<ClientItem[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<ClientItem | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [config, setConfig] = useState<AssistantConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);
  const [configError, setConfigError] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [editGreeting, setEditGreeting] = useState('');
  const [editVoice, setEditVoice] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editTemp, setEditTemp] = useState(0.7);
  const [editCallMode, setEditCallMode] = useState<'primary' | 'secondary'>('primary');
  const [editTransferPhone, setEditTransferPhone] = useState('');
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [allVoices, setAllVoices] = useState<VoiceOption[]>([]);
  const [voiceFilter, setVoiceFilter] = useState<'all' | 'female' | 'male'>('all');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [callState, setCallState] = useState<CallState>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
  const [notifPhone, setNotifPhone] = useState('');
  const [origPhone, setOrigPhone] = useState('');
  const [phoneSwapping, setPhoneSwapping] = useState(false);
  const [phoneSwapped, setPhoneSwapped] = useState(false);
  const [phoneEditing, setPhoneEditing] = useState(false);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [copiedCompliance, setCopiedCompliance] = useState(false);
  const [kbLoading, setKbLoading] = useState(false);
  const [kbSaving, setKbSaving] = useState(false);
  const [kbExpanded, setKbExpanded] = useState(false);
  const [kbWebsite, setKbWebsite] = useState('');
  const [kbServices, setKbServices] = useState<{id:string;name:string;price:string;description:string}[]>([{id:'1',name:'',price:'',description:''}]);
  const [kbFaqs, setKbFaqs] = useState<{id:string;question:string;answer:string}[]>([{id:'1',question:'',answer:''}]);
  const [kbAdditionalInfo, setKbAdditionalInfo] = useState('');
  const [kbHours, setKbHours] = useState('');
  const [kbLastUpdated, setKbLastUpdated] = useState<string | null>(null);

  const vapiRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const clientScrollRef = useRef<HTMLDivElement>(null);
  const eventLogEndRef = useRef<HTMLDivElement>(null);
  const getToken = () => localStorage.getItem('auth_token') || '';
  const inputStyle = { backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text };

  const addEvent = useCallback((type: string, message: string, level: EventLogEntry['level']) => {
    setEventLog(prev => [...prev, { id: uid(), type, timestamp: Date.now(), message, level }]);
  }, []);

  useEffect(() => {
    if (!vapiKey) return;
    let m = true;
    import('@vapi-ai/web').then(({ default: Vapi }) => {
      if (!m) return;
      const v = new Vapi(vapiKey); vapiRef.current = v;
      v.on('call-start', () => { if (m) { setCallState('connected'); addEvent('call-start', 'Call connected', 'success'); } });
      v.on('call-end', () => { if (m) { setCallState('ended'); stopTimer(); addEvent('call-end', 'Call ended', 'info'); } });
      v.on('speech-start', () => { if (m) addEvent('speech-start', 'Assistant speaking', 'info'); });
      v.on('speech-end', () => { if (m) addEvent('speech-end', 'Assistant stopped', 'info'); });
      v.on('message', (msg: any) => {
        if (!m) return;
        if (msg.type === 'transcript') {
          const entry: TranscriptEntry = { id: uid(), role: msg.role || 'assistant', text: msg.transcript || '', isFinal: msg.transcriptType === 'final', timestamp: Date.now() };
          setTranscript(prev => { const li = [...prev].reverse().findIndex(t => t.role === entry.role && !t.isFinal); if (li !== -1) { const i = prev.length - 1 - li; const u = [...prev]; u[i] = entry; return u; } return [...prev, entry]; });
        }
        if (msg.type === 'function-call') addEvent('tool-call', `Tool: ${msg.functionCall?.name || 'unknown'}`, 'info');
        if (msg.type === 'hang') addEvent('hang', 'Assistant ended call', 'warn');
      });
      v.on('error', (err: any) => { if (m) { addEvent('error', err?.message || 'Unknown error', 'error'); setCallState('idle'); setShowCallModal(false); stopTimer(); } });
    }).catch(() => {});
    return () => { m = false; vapiRef.current?.stop(); stopTimer(); if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } };
  }, [vapiKey, addEvent]);

  useEffect(() => { transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [transcript]);
  useEffect(() => { eventLogEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [eventLog]);
  const startTimer = () => { setCallDuration(0); timerRef.current = setInterval(() => setCallDuration(p => p + 1), 1000); };
  const stopTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };

  useEffect(() => { fetch(`${api}/api/voices`).then(r => r.json()).then(d => { setAllVoices(d.voices || []); }).catch(() => {}); }, [api]);
  useEffect(() => { if (!agency) return; setClientsLoading(true); fetch(`${api}/api/agency/${agency.id}/ai-playground/clients`, { headers: { Authorization: `Bearer ${getToken()}` } }).then(r => r.json()).then(d => setClients(d.clients || [])).catch(() => {}).finally(() => setClientsLoading(false)); }, [agency, api]);
  useEffect(() => { if (!agency || effectivePlan !== 'enterprise') return; fetch(`${api}/api/agency/${agency.id}/ai-templates/industries`, { headers: { Authorization: `Bearer ${getToken()}` } }).then(r => r.ok ? r.json() : null).then(d => { if (d) setIndustries(d.industries || []); }).catch(() => {}); }, [agency, effectivePlan, api]);

  const playPreview = (voice: VoiceOption) => { if (playingVoiceId === voice.id && audioRef.current) { audioRef.current.pause(); setPlayingVoiceId(null); return; } if (audioRef.current) audioRef.current.pause(); const a = new Audio(voice.previewUrl); audioRef.current = a; a.onended = () => setPlayingVoiceId(null); a.onerror = () => setPlayingVoiceId(null); a.play(); setPlayingVoiceId(voice.id); };
  const filteredVoices = (voiceFilter === 'all' ? allVoices : allVoices.filter(v => v.gender === voiceFilter)).sort((a, b) => (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0));

  const selectClient = async (client: ClientItem) => {
    setSelectedClient(client); setConfig(null); setTranscript([]); setEventLog([]); setCallState('idle');
    setConfigSaved(false); setConfigError(''); setPromptExpanded(false);
    setKbExpanded(false); setKbWebsite(''); setKbServices([{id:'1',name:'',price:'',description:''}]); setKbFaqs([{id:'1',question:'',answer:''}]); setKbAdditionalInfo(''); setKbHours(''); setKbLastUpdated(null);
    setNotifPhone(client.owner_phone || ''); setOrigPhone(client.owner_phone || '');
    setPhoneSwapped(false); setPhoneEditing(false);
    setEditCallMode((client.call_mode as 'primary' | 'secondary') || 'primary');
    if (!client.vapi_assistant_id) { addEvent('warn', 'No AI assistant configured', 'warn'); return; }
    setConfigLoading(true);
    try {
      const r = await fetch(`${api}/api/agency/${agency!.id}/ai-playground/clients/${client.id}/ai-details`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (r.ok) {
        const d = await r.json();
        setEditCallMode((d.client?.call_mode as 'primary' | 'secondary') || 'primary');
        setEditTransferPhone(d.client?.owner_phone || '');
        if (d.assistant) {
          const c: AssistantConfig = { id: d.assistant.id, model: d.assistant.model || 'gpt-4o-mini', voice: d.assistant.voice || '', voiceProvider: d.assistant.voiceProvider || '11labs', firstMessage: d.assistant.firstMessage || '', systemPrompt: d.assistant.systemPrompt || '', temperature: d.assistant.temperature ?? 0.7, tools: d.assistant.tools || [], toolIds: d.assistant.toolIds || [] };
          setConfig(c); setEditPrompt(c.systemPrompt); setEditGreeting(c.firstMessage); setEditVoice(c.voice); setEditModel(c.model); setEditTemp(c.temperature);
          addEvent('loaded', 'AI config loaded', 'success');
          fetchKB(client.id);
        }
      }
    } catch { addEvent('error', 'Failed to load AI config', 'error'); }
    finally { setConfigLoading(false); }
  };

  const saveConfig = async () => {
    if (!agency || !selectedClient) return;
    setConfigSaving(true); setConfigSaved(false); setConfigError('');
    try {
      const body: Record<string, any> = {};
      if (config) { body.system_prompt = editPrompt; body.first_message = editGreeting; body.voice_id = editVoice; body.model = editModel; body.temperature = editTemp; }
      body.call_mode = editCallMode;
      if (editTransferPhone.trim()) body.transfer_phone = editTransferPhone.trim();
      const r = await fetch(`${api}/api/agency/${agency.id}/clients/${selectedClient.id}/prompt`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(body) });
      if (r.ok) { setConfigSaved(true); addEvent('saved', 'Config saved to VAPI', 'success'); setTimeout(() => setConfigSaved(false), 3000); if (config) setConfig({ ...config, systemPrompt: editPrompt, firstMessage: editGreeting, voice: editVoice, model: editModel, temperature: editTemp }); }
      else { const d = await r.json(); setConfigError(d.error || 'Save failed'); addEvent('error', d.error || 'Save failed', 'error'); }
    } catch { setConfigError('Network error'); }
    finally { setConfigSaving(false); }
  };

  const hasChanges = config ? (editPrompt !== config.systemPrompt || editGreeting !== config.firstMessage || editVoice !== config.voice || editModel !== config.model || editTemp !== config.temperature || editCallMode !== ((selectedClient?.call_mode as any) || 'primary') || editTransferPhone !== (selectedClient?.owner_phone || '')) : editCallMode !== ((selectedClient?.call_mode as any) || 'primary');

  const startCall = async () => { if (!vapiRef.current || !selectedClient?.vapi_assistant_id) return; setCallState('connecting'); setTranscript([]); setEventLog([]); setCallDuration(0); setShowCallModal(true); addEvent('dialing', `Calling ${selectedClient.business_name}...`, 'info'); try { await vapiRef.current.start(selectedClient.vapi_assistant_id); startTimer(); } catch (e: any) { addEvent('error', e?.message || 'Call failed', 'error'); setCallState('idle'); setShowCallModal(false); } };
  const endCall = () => { vapiRef.current?.stop(); stopTimer(); setCallState('ended'); };
  const toggleMute = () => { if (!vapiRef.current) return; vapiRef.current.setMuted(!isMuted); setIsMuted(!isMuted); };
  const closeModal = () => { setShowCallModal(false); setCallState('idle'); };

  const swapPhone = async () => { if (!agency || !selectedClient || !notifPhone.trim()) return; setPhoneSwapping(true); try { const r = await fetch(`${api}/api/agency/${agency.id}/ai-playground/clients/${selectedClient.id}/notification-phone`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ phone: notifPhone }) }); if (r.ok) { setPhoneSwapped(notifPhone !== origPhone); setPhoneEditing(false); } } catch {} finally { setPhoneSwapping(false); } };
  const revertPhone = async () => { setNotifPhone(origPhone); setPhoneSwapping(true); try { await fetch(`${api}/api/agency/${agency!.id}/ai-playground/clients/${selectedClient!.id}/notification-phone`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ phone: origPhone }) }); setPhoneSwapped(false); setPhoneEditing(false); } catch {} finally { setPhoneSwapping(false); } };
  const copyCompliance = () => { navigator.clipboard.writeText(COMPLIANCE_GREETING); setCopiedCompliance(true); setTimeout(() => setCopiedCompliance(false), 2000); };

  const fetchKB = async (clientId: string) => { setKbLoading(true); try { const r = await fetch(`${api}/api/client/${clientId}/knowledge-base`, { headers: { Authorization: `Bearer ${getToken()}` } }); if (r.ok) { const d = await r.json(); if (d.success) { setKbWebsite(d.websiteUrl || ''); setKbLastUpdated(d.updated_at || null); const data = d.data || {}; if (data.services) parseKbServices(data.services); if (data.faqs) parseKbFaqs(data.faqs); setKbHours(data.businessHours || ''); setKbAdditionalInfo(data.additionalInfo || ''); addEvent('kb-loaded', 'Knowledge base loaded', 'info'); } } } catch { addEvent('kb-error', 'Failed to load KB', 'error'); } finally { setKbLoading(false); } };

  const parseKbServices = (text: string) => { const lines = text.split('\n').filter((l: string) => l.trim()); const parsed: {id:string;name:string;price:string;description:string}[] = []; lines.forEach((line: string, i: number) => { const clean = line.trim().replace(/^-\s*/, ''); if (!clean) return; const parts = clean.split(/\s+-\s+/); let name = '', price = '', desc: string[] = []; parts.forEach((p: string, j: number) => { const t = p.trim(); if (j === 0) name = t; else if (t.startsWith('$')) price = t; else if (t) desc.push(t); }); if (name) parsed.push({ id: `${i + 1}`, name, price, description: desc.join(' - ') }); }); setKbServices(parsed.length > 0 ? parsed : [{ id: '1', name: '', price: '', description: '' }]); };

  const parseKbFaqs = (text: string) => { const parsed: {id:string;question:string;answer:string}[] = []; const lines = text.split('\n'); let q = '', a = ''; lines.forEach((line: string) => { if (line.trim().startsWith('Q:')) { if (q && a) parsed.push({ id: `${parsed.length + 1}`, question: q, answer: a }); q = line.replace(/^Q:\s*/i, '').trim(); a = ''; } else if (line.trim().startsWith('A:')) { a = line.replace(/^A:\s*/i, '').trim(); } }); if (q && a) parsed.push({ id: `${parsed.length + 1}`, question: q, answer: a }); setKbFaqs(parsed.length > 0 ? parsed : [{ id: '1', question: '', answer: '' }]); };

  const formatKbServices = (): string => { return kbServices.filter(s => s.name.trim()).map(s => { const p = [`- ${s.name}`]; if (s.price) p.push(s.price); if (s.description) p.push(s.description); return p.join(' - '); }).join('\n'); };
  const formatKbFaqs = (): string => { return kbFaqs.filter(f => f.question.trim() && f.answer.trim()).map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n'); };

  const saveKB = async () => { if (!agency || !selectedClient) return; setKbSaving(true); try { const r = await fetch(`${api}/api/knowledge-base/update`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ clientId: selectedClient.id, websiteUrl: kbWebsite, businessHours: kbHours, services: formatKbServices(), faqs: formatKbFaqs(), additionalInfo: kbAdditionalInfo }) }); if (r.ok) { setKbLastUpdated(new Date().toISOString()); addEvent('kb-saved', 'Knowledge base updated', 'success'); } else { const d = await r.json(); addEvent('kb-error', d.error || 'KB save failed', 'error'); } } catch { addEvent('kb-error', 'KB save network error', 'error'); } finally { setKbSaving(false); } };

  const addKbService = () => setKbServices(prev => [...prev, { id: Date.now().toString(), name: '', price: '', description: '' }]);
  const removeKbService = (id: string) => { if (kbServices.length > 1) setKbServices(prev => prev.filter(s => s.id !== id)); };
  const updateKbService = (id: string, field: string, value: string) => setKbServices(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  const addKbFaq = () => setKbFaqs(prev => [...prev, { id: Date.now().toString(), question: '', answer: '' }]);
  const removeKbFaq = (id: string) => { if (kbFaqs.length > 1) setKbFaqs(prev => prev.filter(f => f.id !== id)); };
  const updateKbFaq = (id: string, field: string, value: string) => setKbFaqs(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));

  const filtered = clientSearch.trim() ? clients.filter(c => c.business_name.toLowerCase().includes(clientSearch.toLowerCase()) || c.industry.toLowerCase().includes(clientSearch.toLowerCase())) : clients;
  const selectedVoice = allVoices.find(v => v.id === editVoice);
  const selectedModelObj = MODEL_OPTIONS.find(m => m.id === editModel);

  if (ctxLoading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.primary }} /></div>;

  if (!canUseAiLab) {
    const PREVIEW_INDUSTRIES = [
      { key: 'home_services', label: 'Home Services', desc: 'HVAC, plumbing, electrical, roofing', icon: 'Home' },
      { key: 'medical', label: 'Medical & Dental', desc: 'Clinics, dental offices, specialists', icon: 'Stethoscope' },
      { key: 'legal', label: 'Legal', desc: 'Law firms, attorneys, paralegals', icon: 'Scale' },
      { key: 'salon', label: 'Salons & Spas', desc: 'Hair salons, barbershops, day spas', icon: 'Sparkles' },
      { key: 'real_estate', label: 'Real Estate', desc: 'Agents, brokers, property management', icon: 'Building2' },
      { key: 'automotive', label: 'Automotive', desc: 'Auto repair, dealerships, detailing', icon: 'Car' },
      { key: 'restaurant', label: 'Restaurants', desc: 'Restaurants, catering, food service', icon: 'UtensilsCrossed' },
      { key: 'fitness', label: 'Fitness & Wellness', desc: 'Gyms, yoga studios, personal training', icon: 'Dumbbell' },
      { key: 'accounting', label: 'Accounting', desc: 'CPAs, bookkeepers, tax prep', icon: 'Calculator' },
    ];
    return (
      <LockedFeature title="AI Lab" description="Configure, test, and ship AI receptionists with industry templates, voice selection, and live browser calls." requiredPlan="Pro"
        features={['Industry-specific AI templates', 'Voice selection & live test calls', 'Knowledge base editor', 'System prompt customization']}>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-6"><div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: theme.primary15 }}><FlaskConical className="h-5 w-5" style={{ color: theme.primary }} /></div><div><h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>AI Lab</h1><p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>Configure, test, and ship AI receptionists</p></div></div>
          <div className="mb-8"><div className="flex items-center gap-2 mb-2"><Package className="h-4 w-4" style={{ color: theme.primary }} /><span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>Packaged Receptionists</span></div><p className="text-xs mb-4" style={{ color: theme.textMuted }}>Configure the default AI receptionist for each industry. New clients inherit your voice, greeting, prompt, and knowledge base.</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{PREVIEW_INDUSTRIES.map(ind => { const Ic = ICON_MAP[ind.icon] || Building2; return (<div key={ind.key} className="rounded-xl p-4" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}><div className="flex items-start justify-between mb-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: theme.hover }}><Ic className="h-5 w-5" style={{ color: theme.textMuted }} /></div><span className="text-[9px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.hover, color: theme.textMuted }}>Default</span></div><p className="font-medium text-sm" style={{ color: theme.text }}>{ind.label}</p><p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{ind.desc}</p></div>); })}</div></div>
          <div className="flex gap-2 mb-4">{['Acme Plumbing', 'Bright Dental', 'Metro Law'].map(name => (<div key={name} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium" style={{ backgroundColor: theme.card, color: theme.text, border: `1px solid ${theme.border}` }}><div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: theme.primary15 }}><Building className="h-3 w-3" style={{ color: theme.primary }} /></div>{name}</div>))}</div>
        </div>
      </LockedFeature>
    );
  }

  return (
    <>
      <style>{`::selection { background-color: #3b82f640; color: inherit; }`}</style>
      {showCallModal && selectedClient && (
        <CallModal callState={callState} callDuration={callDuration} isMuted={isMuted} transcript={transcript} eventLog={eventLog} theme={theme} onEnd={endCall} onToggleMute={toggleMute} onClose={closeModal} clientName={selectedClient.business_name} transcriptEndRef={transcriptEndRef} eventLogEndRef={eventLogEndRef} />
      )}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: theme.primary15 }}><FlaskConical className="h-5 w-5" style={{ color: theme.primary }} /></div><div><h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>AI Lab</h1><p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>Configure, test, and ship AI receptionists</p></div></div></div>

        {!vapiKey && (<div className="mb-6 rounded-xl p-4 flex items-start gap-3" style={{ backgroundColor: theme.isDark ? 'rgba(251,191,36,0.08)' : '#fffbeb', border: `1px solid ${theme.isDark ? 'rgba(251,191,36,0.2)' : '#fde68a'}` }}><AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} /><div><p className="font-medium text-sm" style={{ color: theme.text }}>Live calling requires VAPI Public Key</p><p className="text-xs mt-1" style={{ color: theme.textMuted }}>Add <code className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: theme.hover }}>NEXT_PUBLIC_VAPI_PUBLIC_KEY</code> to Vercel.</p></div></div>)}

        {!clientsLoading && clients.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3"><div className="relative flex-1 max-w-xs"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: theme.textMuted }} /><input type="text" value={clientSearch} onChange={e => setClientSearch(e.target.value)} placeholder="Search clients..." className="w-full rounded-lg pl-8 pr-3 py-1.5 text-xs" style={inputStyle} /></div><div className="flex gap-1"><button onClick={() => { if (clientScrollRef.current) clientScrollRef.current.scrollBy({ left: -200, behavior: 'smooth' }); }} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.hover, color: theme.textMuted, border: `1px solid ${theme.border}` }}><ChevronLeft className="h-3.5 w-3.5" /></button><button onClick={() => { if (clientScrollRef.current) clientScrollRef.current.scrollBy({ left: 200, behavior: 'smooth' }); }} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.hover, color: theme.textMuted, border: `1px solid ${theme.border}` }}><ChevronRight className="h-3.5 w-3.5" /></button></div></div>
            <div ref={clientScrollRef} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}><style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>{filtered.map(c => { const isActive = selectedClient?.id === c.id; return (<button key={c.id} onClick={() => selectClient(c)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-all flex-shrink-0" style={{ backgroundColor: isActive ? theme.primary : theme.card, color: isActive ? theme.primaryText : theme.text, border: `1px solid ${isActive ? theme.primary : theme.border}` }}><div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : theme.primary15 }}><Building className="h-3 w-3" style={{ color: isActive ? theme.primaryText : theme.primary }} /></div>{c.business_name}{c.vapi_assistant_id && <CircleDot className="h-2 w-2 flex-shrink-0" style={{ color: isActive ? theme.primaryText : '#22c55e' }} />}</button>); })}</div>
            {filtered.length === 0 && clientSearch.trim() && (<p className="text-xs mt-2" style={{ color: theme.textMuted }}>No clients match &quot;{clientSearch}&quot;</p>)}
          </div>
        )}

        {clientsLoading && (<div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.primary }} /></div>)}
        {!clientsLoading && clients.length === 0 && !selectedClient && (<div className="text-center py-16"><Building className="h-8 w-8 mx-auto mb-3" style={{ color: theme.textMuted, opacity: 0.3 }} /><p className="text-sm" style={{ color: theme.textMuted }}>No clients yet.</p></div>)}

        {!selectedClient && !clientsLoading && (
          <div>
            {effectivePlan === 'enterprise' && industries.length > 0 && (
              <div className="mb-8"><div className="flex items-center gap-2 mb-2"><Package className="h-4 w-4" style={{ color: theme.primary }} /><span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>Packaged Receptionists</span><span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.primary15, color: theme.primary }}>Enterprise</span></div><p className="text-xs mb-4" style={{ color: theme.textMuted }}>Configure the default AI receptionist for each industry. When a new client signs up, they inherit your voice, greeting, prompt, model, and knowledge base.</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{industries.map(ind => { const Ic = ICON_MAP[ind.icon] || Building2; return (<Link key={ind.frontendKey} href={`/agency/templates/${ind.frontendKey}`} className="rounded-xl p-4 transition-all group" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }} onMouseEnter={e => (e.currentTarget.style.borderColor = theme.primary + '60')} onMouseLeave={e => (e.currentTarget.style.borderColor = theme.border)}><div className="flex items-start justify-between mb-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: ind.hasCustomTemplate ? theme.primary15 : theme.hover }}><Ic className="h-5 w-5" style={{ color: ind.hasCustomTemplate ? theme.primary : theme.textMuted }} /></div>{ind.hasCustomTemplate ? (<span className="flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.primary15, color: theme.primary }}><Check className="h-2.5 w-2.5" /> Custom</span>) : (<span className="text-[9px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.hover, color: theme.textMuted }}>Default</span>)}</div><p className="font-medium text-sm" style={{ color: theme.text }}>{ind.label}</p><p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{ind.description}</p><p className="text-[10px] mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: theme.primary }}>Configure package <ArrowUpRight className="h-2.5 w-2.5" /></p></Link>); })}</div></div>
            )}
            {!clientsLoading && clients.length > 0 && (<p className="text-xs text-center" style={{ color: theme.textMuted }}>Select a client above to configure their AI receptionist</p>)}
          </div>
        )}

        {selectedClient && (
          <div>
            <div className="rounded-xl p-4 sm:p-5 mb-4" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0"><div className="flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><Building className="h-6 w-6" style={{ color: theme.primary }} /></div><div className="min-w-0"><p className="font-semibold text-base truncate" style={{ color: theme.text }}>{selectedClient.business_name}</p><p className="text-xs" style={{ color: theme.textMuted }}>{selectedClient.industry} · {selectedClient.business_city}, {selectedClient.business_state}</p><p className="text-xs mt-1 flex items-center gap-1.5" style={{ color: theme.textMuted }}><Building2 className="h-3 w-3" /> Agency: <span className="font-medium" style={{ color: theme.text }}>{agency?.name}</span></p></div></div>
                {selectedClient.vapi_phone_number && (<div className="text-right flex-shrink-0"><p className="text-[10px] uppercase tracking-wider" style={{ color: theme.textMuted }}>AI Phone</p><p className="text-base font-mono font-semibold" style={{ color: theme.primary }}>{fmtPhone(selectedClient.vapi_phone_number)}</p></div>)}
              </div>
            </div>

            {configLoading ? (
              <div className="rounded-xl p-10 flex items-center justify-center mb-4" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}><Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.primary }} /><span className="ml-3 text-sm" style={{ color: theme.textMuted }}>Loading AI configuration...</span></div>
            ) : config ? (
              <div className="rounded-xl p-4 sm:p-5 mb-4" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                <div className="flex items-center justify-between mb-5"><div className="flex items-center gap-2"><Pencil className="h-4 w-4" style={{ color: theme.primary }} /><span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>AI Configuration</span></div><div className="flex items-center gap-2">{configSaved && <span className="text-xs font-medium" style={{ color: '#22c55e' }}>Saved!</span>}{configError && <span className="text-xs" style={{ color: '#ef4444' }}>{configError}</span>}<button onClick={saveConfig} disabled={configSaving || !hasChanges} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium disabled:opacity-40" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>{configSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save Changes</button></div></div>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div><label className="block text-[11px] font-medium mb-2" style={{ color: theme.textMuted }}>Call Mode</label><select value={editCallMode} onChange={e => setEditCallMode(e.target.value as any)} className="w-full rounded-lg px-3 py-2.5 text-sm" style={inputStyle}><option value="primary">Primary — AI answers all</option><option value="secondary">Secondary — Overflow only</option></select></div>
                    <div><label className="block text-[11px] font-medium mb-2" style={{ color: theme.textMuted }}>Model</label><select value={editModel} onChange={e => setEditModel(e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm" style={inputStyle}>{MODEL_OPTIONS.map(m => <option key={m.id} value={m.id}>{m.name}{m.tag ? ` (${m.tag})` : ''}</option>)}{!MODEL_OPTIONS.find(m => m.id === editModel) && <option value={editModel}>{editModel}</option>}</select>{selectedModelObj && <p className="text-[10px] mt-1.5" style={{ color: theme.textMuted }}>{selectedModelObj.desc}</p>}</div>
                    <div><label className="block text-[11px] font-medium mb-2" style={{ color: theme.textMuted }}>Temperature: {editTemp}</label><input type="range" min="0" max="1" step="0.1" value={editTemp} onChange={e => setEditTemp(parseFloat(e.target.value))} className="w-full mt-2" style={{ accentColor: theme.primary }} /><div className="flex justify-between text-[9px] mt-1" style={{ color: theme.textMuted }}><span>Precise</span><span>Creative</span></div></div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2"><label className="text-[11px] font-medium" style={{ color: theme.textMuted }}>Voice</label><div className="flex gap-1">{(['all', 'female', 'male'] as const).map(f => (<button key={f} onClick={() => setVoiceFilter(f)} className="px-2.5 py-1 rounded-md text-[10px] font-medium transition" style={{ backgroundColor: voiceFilter === f ? theme.primary : theme.hover, color: voiceFilter === f ? theme.primaryText : theme.textMuted }}>{f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}</button>))}</div></div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">{filteredVoices.map(v => { const isSelected = editVoice === v.id; const isPlaying = playingVoiceId === v.id; return (<div key={v.id} onClick={() => setEditVoice(v.id)} className="relative rounded-xl p-3 cursor-pointer transition-all border-2" style={{ borderColor: isSelected ? theme.primary : theme.border, backgroundColor: isSelected ? hexToRgba(theme.primary, theme.isDark ? 0.08 : 0.03) : theme.card }}>{v.recommended && <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>★</span>}<div className="flex items-center gap-2 mb-1.5"><button onClick={e => { e.stopPropagation(); playPreview(v); }} className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition" style={{ backgroundColor: isPlaying ? theme.primary : (theme.isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6'), color: isPlaying ? theme.primaryText : theme.textMuted }}>{isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 ml-0.5" />}</button><div className="min-w-0"><div className="flex items-center gap-1"><span className="font-semibold text-xs truncate" style={{ color: theme.text }}>{v.name}</span>{isSelected && <Check className="h-3 w-3 flex-shrink-0" style={{ color: theme.primary }} />}</div><p className="text-[9px]" style={{ color: theme.textMuted }}>{v.accent} · {v.style}</p></div></div><p className="text-[10px] leading-relaxed" style={{ color: theme.textMuted }}>{v.description}</p></div>); })}</div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2"><label className="text-[11px] font-medium" style={{ color: theme.textMuted }}>Opening Greeting</label><button onClick={copyCompliance} className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded transition" style={{ color: theme.primary, backgroundColor: hexToRgba(theme.primary, 0.08) }}>{copiedCompliance ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Compliance text</>}</button></div>
                    <input type="text" value={editGreeting} onChange={e => setEditGreeting(e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm" style={inputStyle} />
                    <div className="flex items-start gap-2 mt-2 p-2.5 rounded-lg" style={{ backgroundColor: theme.isDark ? 'rgba(251,191,36,0.05)' : '#fffbeb', border: `1px solid ${theme.isDark ? 'rgba(251,191,36,0.1)' : '#fef3c7'}` }}><Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} /><p className="text-[10px] leading-relaxed" style={{ color: theme.isDark ? '#fbbf24' : '#92400e' }}>For compliance, include: <em>&quot;{COMPLIANCE_GREETING}&quot;</em></p></div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-3"><label className="text-[11px] font-medium" style={{ color: theme.textMuted }}>System Prompt</label><a href="https://myvoiceaiconnect.com/blog/ai-receptionist-prompt-guide" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-medium transition hover:opacity-80" style={{ color: theme.primary }}><ArrowUpRight className="h-2.5 w-2.5" /> Prompting Guide</a></div><div className="flex items-center gap-3"><span className="text-[10px] font-mono" style={{ color: theme.textMuted }}>{editPrompt.length.toLocaleString()} chars</span><button onClick={() => setPromptExpanded(!promptExpanded)} className="flex items-center gap-1 text-[10px] font-medium transition" style={{ color: theme.primary }}>{promptExpanded ? <><Minimize2 className="h-3 w-3" /> Collapse</> : <><Maximize2 className="h-3 w-3" /> Expand</>}</button></div></div>
                    <textarea value={editPrompt} onChange={e => setEditPrompt(e.target.value)} rows={promptExpanded ? 30 : 6} className="w-full rounded-lg px-3 py-2.5 text-xs font-mono leading-relaxed transition-all" style={{ ...inputStyle, resize: 'vertical', minHeight: promptExpanded ? '400px' : '120px', maxHeight: promptExpanded ? 'none' : '200px' }} />
                  </div>

                  {config.tools.includes('transferCall') && (
                    <div className="rounded-lg p-4" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb', border: `1px solid ${theme.border}` }}>
                      <div className="flex items-center gap-2 mb-3"><PhoneForwarded className="h-4 w-4" style={{ color: theme.primary }} /><span className="text-[11px] font-medium" style={{ color: theme.text }}>Call Transfer</span><span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.isDark ? 'rgba(34,197,94,0.1)' : '#f0fdf4', color: '#22c55e' }}>Active</span></div>
                      <p className="text-[10px] mb-2" style={{ color: theme.textMuted }}>When callers request a real person or have urgent issues, the AI will transfer to this number.</p>
                      <div className="flex gap-2"><input type="tel" value={editTransferPhone} onChange={e => setEditTransferPhone(e.target.value)} placeholder="(555) 123-4567" className="flex-1 rounded-lg px-3 py-2 text-sm font-mono" style={inputStyle} /></div>
                      <p className="text-[9px] mt-1.5" style={{ color: theme.textMuted }}>Currently set to the client owner&apos;s phone. Changes save with the main &quot;Save Changes&quot; button.</p>
                    </div>
                  )}
                  {config.tools.filter(t => t !== 'transferCall').length > 0 && (<div className="flex items-center gap-2 flex-wrap"><span className="text-[10px] font-medium" style={{ color: theme.textMuted }}>Other Tools:</span>{config.tools.filter(t => t !== 'transferCall').map(t => <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ backgroundColor: theme.hover, color: theme.text }}>{t}</span>)}</div>)}
                </div>
              </div>
            ) : selectedClient.vapi_assistant_id ? (
              <div className="rounded-xl p-6 text-center mb-4" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}><AlertCircle className="h-6 w-6 mx-auto mb-2" style={{ color: '#f59e0b' }} /><p className="text-sm" style={{ color: theme.textMuted }}>Could not load AI config from VAPI.</p></div>
            ) : (
              <div className="rounded-xl p-6 text-center mb-4" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}><Bot className="h-6 w-6 mx-auto mb-2" style={{ color: theme.textMuted }} /><p className="text-sm" style={{ color: theme.textMuted }}>No AI assistant configured.</p></div>
            )}

            {/* Knowledge Base */}
            {selectedClient?.vapi_assistant_id && (
              <div className="rounded-xl p-4 sm:p-5 mb-4" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><BookOpen className="h-4 w-4" style={{ color: theme.primary }} /><span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>Knowledge Base</span>{kbLastUpdated && (<span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: theme.hover, color: theme.textMuted }}>Updated {new Date(kbLastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>)}</div><button onClick={() => setKbExpanded(!kbExpanded)} className="flex items-center gap-1 text-xs font-medium transition" style={{ color: theme.primary }}>{kbExpanded ? 'Hide' : 'Edit'}<ChevronDown className={`h-3.5 w-3.5 transition-transform ${kbExpanded ? 'rotate-180' : ''}`} /></button></div>
                {kbLoading ? (<div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" style={{ color: theme.primary }} /><span className="ml-2 text-xs" style={{ color: theme.textMuted }}>Loading knowledge base...</span></div>
                ) : !kbExpanded ? (<p className="text-xs" style={{ color: theme.textMuted }}>{kbServices.filter(s => s.name.trim()).length} services · {kbFaqs.filter(f => f.question.trim()).length} FAQs · {kbAdditionalInfo ? 'Has additional info' : 'No additional info'}</p>
                ) : (
                  <div className="space-y-5 mt-3">
                    <div><label className="flex items-center gap-1.5 text-[11px] font-medium mb-1.5" style={{ color: theme.textMuted }}><Globe className="w-3.5 h-3.5" style={{ color: theme.primary }} /> Website</label><input type="url" value={kbWebsite} onChange={e => setKbWebsite(e.target.value)} placeholder="https://yourbusiness.com" className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle} /></div>
                    <div><label className="flex items-center gap-1.5 text-[11px] font-medium mb-1.5" style={{ color: theme.textMuted }}><Briefcase className="w-3.5 h-3.5" style={{ color: theme.primary }} /> Services & Pricing</label><div className="space-y-2">{kbServices.map(service => (<div key={service.id} className="p-2.5 rounded-lg space-y-1.5" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb' }}><div className="flex gap-2"><input type="text" value={service.name} onChange={e => updateKbService(service.id, 'name', e.target.value)} placeholder="Service name" className="flex-1 rounded-lg px-2.5 py-1.5 text-xs min-w-0" style={inputStyle} /><input type="text" value={service.price} onChange={e => updateKbService(service.id, 'price', e.target.value)} placeholder="$100" className="w-20 rounded-lg px-2.5 py-1.5 text-xs" style={inputStyle} /><button onClick={() => removeKbService(service.id)} disabled={kbServices.length === 1} className="p-1.5 transition disabled:opacity-20" style={{ color: theme.textMuted }}><Trash2 className="w-3.5 h-3.5" /></button></div><textarea value={service.description} onChange={e => updateKbService(service.id, 'description', e.target.value)} placeholder="Brief description..." rows={1} className="w-full rounded-lg px-2.5 py-1.5 text-xs resize-none" style={inputStyle} /></div>))}</div><button onClick={addKbService} className="mt-2 flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium rounded-lg transition hover:opacity-80" style={{ color: theme.primary, backgroundColor: hexToRgba(theme.primary, 0.08) }}><Plus className="w-3 h-3" /> Add Service</button></div>
                    <div><label className="flex items-center gap-1.5 text-[11px] font-medium mb-1.5" style={{ color: theme.textMuted }}><HelpCircle className="w-3.5 h-3.5" style={{ color: theme.primary }} /> FAQs</label><div className="space-y-2">{kbFaqs.map(faq => (<div key={faq.id} className="p-2.5 rounded-lg space-y-1.5" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb' }}><div className="flex gap-2"><input type="text" value={faq.question} onChange={e => updateKbFaq(faq.id, 'question', e.target.value)} placeholder="Question..." className="flex-1 rounded-lg px-2.5 py-1.5 text-xs min-w-0" style={inputStyle} /><button onClick={() => removeKbFaq(faq.id)} disabled={kbFaqs.length === 1} className="p-1.5 transition disabled:opacity-20" style={{ color: theme.textMuted }}><Trash2 className="w-3.5 h-3.5" /></button></div><textarea value={faq.answer} onChange={e => updateKbFaq(faq.id, 'answer', e.target.value)} placeholder="Answer..." rows={2} className="w-full rounded-lg px-2.5 py-1.5 text-xs resize-none" style={inputStyle} /></div>))}</div><button onClick={addKbFaq} className="mt-2 flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium rounded-lg transition hover:opacity-80" style={{ color: theme.primary, backgroundColor: hexToRgba(theme.primary, 0.08) }}><Plus className="w-3 h-3" /> Add FAQ</button></div>
                    <div><label className="flex items-center gap-1.5 text-[11px] font-medium mb-1.5" style={{ color: theme.textMuted }}><FileText className="w-3.5 h-3.5" style={{ color: theme.primary }} /> Additional Info</label><textarea value={kbAdditionalInfo} onChange={e => setKbAdditionalInfo(e.target.value)} placeholder="Policies, service areas, payment methods, etc." rows={3} className="w-full rounded-lg px-3 py-2 text-xs resize-none" style={inputStyle} /></div>
                    <button onClick={saveKB} disabled={kbSaving} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition disabled:opacity-50" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>{kbSaving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating...</> : <><Sparkles className="h-3.5 w-3.5" /> Update Knowledge Base</>}</button>
                  </div>
                )}
              </div>
            )}

            {/* ═══ PHASE 1: AI Behavior Settings ═══ */}
            {selectedClient?.vapi_assistant_id && (
              <div className="rounded-xl p-4 sm:p-5 mb-4" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                <div className="flex items-center gap-2 mb-4"><Bot className="h-4 w-4" style={{ color: theme.primary }} /><span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>AI Behavior</span></div>
                <AISettingsSection clientId={selectedClient.id} theme={theme} compact />
              </div>
            )}

            {/* ═══ PHASE 3A: Services ═══ */}
            {selectedClient?.vapi_assistant_id && (
              <div className="rounded-xl p-4 sm:p-5 mb-4" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                <ClientServicesSection clientId={selectedClient.id} theme={theme} compact />
              </div>
            )}

            {/* ═══ PHASE 3A: Staff Members ═══ */}
            {selectedClient?.vapi_assistant_id && (
              <div className="rounded-xl p-4 sm:p-5 mb-4" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                <StaffMembersSection clientId={selectedClient.id} theme={theme} compact />
              </div>
            )}

            {/* ═══ PHASE 1: Dashboard Access ═══ */}
            {selectedClient && (
              <div className="rounded-xl p-4 sm:p-5 mb-4" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                <DashboardAccessSelector clientId={selectedClient.id} theme={theme} />
              </div>
            )}

            {/* Start Test Call */}
            <div className="rounded-xl p-6 text-center mb-4" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
              <button onClick={startCall} disabled={!selectedClient?.vapi_assistant_id || !vapiKey} className="inline-flex items-center justify-center gap-3 rounded-2xl px-10 py-4 text-base font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100" style={{ backgroundColor: theme.primary, color: theme.primaryText, boxShadow: `0 0 40px ${theme.primary}20` }}><PhoneCall className="h-5 w-5" /> Start Test Call</button>
              <p className="text-xs mt-3" style={{ color: theme.textMuted }}>Opens a live browser call to this client&apos;s AI assistant</p>
            </div>

            {/* SMS Notifications */}
            <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
              <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><Phone className="h-4 w-4" style={{ color: theme.primary }} /><span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>SMS Notifications Go To</span></div>{phoneSwapped && <button onClick={revertPhone} disabled={phoneSwapping} className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full disabled:opacity-50" style={{ backgroundColor: theme.isDark ? 'rgba(251,191,36,0.1)' : '#fffbeb', color: '#f59e0b', border: `1px solid ${theme.isDark ? 'rgba(251,191,36,0.2)' : '#fde68a'}` }}><Undo2 className="h-3 w-3" /> Revert</button>}</div>
              <div className="flex gap-2"><input type="tel" value={phoneEditing ? notifPhone : fmtPhone(notifPhone)} onChange={e => setNotifPhone(e.target.value)} onFocus={() => setPhoneEditing(true)} className="flex-1 rounded-lg px-3 py-2 text-sm font-mono" style={inputStyle} /><button onClick={swapPhone} disabled={phoneSwapping || !notifPhone.trim()} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium disabled:opacity-40" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>{phoneSwapping ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Save</button></div>
              <p className="text-[10px] mt-2" style={{ color: theme.textMuted }}>{phoneSwapped ? `Swapped from owner (${fmtPhone(origPhone)}). Revert after testing.` : 'Change to your number to receive test call SMS summaries.'}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
