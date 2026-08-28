'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Loader2, ArrowLeft, Save, RotateCcw, Play, Pause, AlertCircle,
  Check, Info, ChevronDown,
  BookOpen, Globe, Briefcase, HelpCircle, FileText, Plus, Trash2
} from 'lucide-react';
import Link from 'next/link';
import { useAgency } from '@/app/agency/context';
import { useTheme } from '@/hooks/useTheme';

interface Voice {
  id: string; name: string; description: string; gender: string;
  accent?: string; style?: string; previewUrl?: string; recommended?: boolean;
}

interface TemplateData {
  id: string | null; isCustom: boolean; isActive: boolean;
  system_prompt: string; first_message: string; voice_id: string; voice: Voice | null;
  model: string; temperature: number; knowledge_base_data: KBData | null; updated_at: string | null;
}

interface KBData {
  services?: string; faqs?: string; businessHours?: string; additionalInfo?: string; websiteUrl?: string;
}

interface IndustryInfo {
  frontendKey: string; backendKey: string; label: string; description: string; icon: string;
}

interface Defaults {
  system_prompt: string; first_message: string; voice_id: string; model: string; temperature: number;
}

interface ServiceRow { id: string; name: string; price: string; description: string; }
interface FaqRow { id: string; question: string; answer: string; }

const MODEL_OPTIONS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', desc: 'Fastest response time, lowest cost — best for real-time voice', tag: 'Default' },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', desc: 'Latest model, better instruction following — same speed tier', tag: 'Latest' },
  { id: 'gpt-4o', name: 'GPT-4o', desc: 'Strongest reasoning but slower — use for complex industries', tag: 'Premium' },
];

function hexToRgba(hex: string, alpha: number): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch { return `rgba(0,0,0,${alpha})`; }
}

function parseServices(text: string): ServiceRow[] {
  const lines = text.split('\n').filter(l => l.trim());
  const parsed: ServiceRow[] = [];
  lines.forEach((line, i) => {
    const clean = line.trim().replace(/^-\s*/, '');
    if (!clean) return;
    const parts = clean.split(/\s+-\s+/);
    let name = '', price = '', desc: string[] = [];
    parts.forEach((p, j) => {
      const t = p.trim();
      if (j === 0) name = t;
      else if (t.startsWith('$')) price = t;
      else if (t) desc.push(t);
    });
    if (name) parsed.push({ id: `${i + 1}`, name, price, description: desc.join(' - ') });
  });
  return parsed.length > 0 ? parsed : [{ id: '1', name: '', price: '', description: '' }];
}

function parseFaqs(text: string): FaqRow[] {
  const parsed: FaqRow[] = [];
  const lines = text.split('\n');
  let q = '', a = '';
  lines.forEach(line => {
    if (line.trim().startsWith('Q:')) {
      if (q && a) parsed.push({ id: `${parsed.length + 1}`, question: q, answer: a });
      q = line.replace(/^Q:\s*/i, '').trim(); a = '';
    } else if (line.trim().startsWith('A:')) {
      a = line.replace(/^A:\s*/i, '').trim();
    }
  });
  if (q && a) parsed.push({ id: `${parsed.length + 1}`, question: q, answer: a });
  return parsed.length > 0 ? parsed : [{ id: '1', question: '', answer: '' }];
}

function formatServicesText(services: ServiceRow[]): string {
  return services.filter(s => s.name.trim()).map(s => {
    const p = [`- ${s.name}`]; if (s.price) p.push(s.price); if (s.description) p.push(s.description); return p.join(' - ');
  }).join('\n');
}

function formatFaqsText(faqs: FaqRow[]): string {
  return faqs.filter(f => f.question.trim() && f.answer.trim()).map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
}

export default function TemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const industry = params.industry as string;
  const { agency, loading: contextLoading } = useAgency();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const [industryInfo, setIndustryInfo] = useState<IndustryInfo | null>(null);
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [defaults, setDefaults] = useState<Defaults | null>(null);

  const [systemPrompt, setSystemPrompt] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [voiceId, setVoiceId] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [temperature, setTemperature] = useState(0.7);

  const [kbWebsite, setKbWebsite] = useState('');
  const [kbServices, setKbServices] = useState<ServiceRow[]>([{ id: '1', name: '', price: '', description: '' }]);
  const [kbFaqs, setKbFaqs] = useState<FaqRow[]>([{ id: '1', question: '', answer: '' }]);
  const [kbAdditionalInfo, setKbAdditionalInfo] = useState('');
  const [kbExpanded, setKbExpanded] = useState(false);

  const [voices, setVoices] = useState<Voice[]>([]);
  const [voiceFilter, setVoiceFilter] = useState<'all' | 'female' | 'male'>('all');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const api = process.env.NEXT_PUBLIC_API_URL || '';
  const getToken = () => localStorage.getItem('auth_token') || '';
  const inputStyle = { backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text };

  useEffect(() => { if (agency && industry) { fetchTemplateData(); fetchVoices(); } }, [agency, industry]);
  useEffect(() => { return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } }; }, []);

  const fetchTemplateData = async () => {
    if (!agency) return;
    try {
      const r = await fetch(`${api}/api/agency/${agency.id}/ai-templates/${industry}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!r.ok) { if (r.status === 403) { router.push('/agency/templates'); return; } throw new Error('Failed'); }
      const data = await r.json();
      setIndustryInfo(data.industry); setTemplate(data.template); setDefaults(data.defaults);
      setSystemPrompt(data.template.system_prompt); setFirstMessage(data.template.first_message);
      setVoiceId(data.template.voice_id); setModel(data.template.model || 'gpt-4o-mini'); setTemperature(data.template.temperature);
      const kb = data.template.knowledge_base_data;
      if (kb) {
        setKbWebsite(kb.websiteUrl || '');
        if (kb.services) setKbServices(parseServices(kb.services));
        if (kb.faqs) setKbFaqs(parseFaqs(kb.faqs));
        setKbAdditionalInfo(kb.additionalInfo || '');
      }
    } catch { setError('Failed to load template'); }
    finally { setLoading(false); }
  };

  const fetchVoices = async () => {
    try { const r = await fetch(`${api}/api/voices`); if (r.ok) { const d = await r.json(); setVoices(d.voices || []); } } catch {}
  };

  const playPreview = (voice: Voice) => {
    if (!voice.previewUrl) return;
    if (playingVoiceId === voice.id && audioRef.current) { audioRef.current.pause(); setPlayingVoiceId(null); return; }
    if (audioRef.current) audioRef.current.pause();
    const a = new Audio(voice.previewUrl); audioRef.current = a;
    a.onended = () => setPlayingVoiceId(null); a.onerror = () => setPlayingVoiceId(null);
    a.play(); setPlayingVoiceId(voice.id);
  };

  const filteredVoices = (voiceFilter === 'all' ? voices : voices.filter(v => v.gender === voiceFilter))
    .sort((a, b) => (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0));

  const handleSave = async () => {
    if (!agency) return;
    setSaving(true); setError(null); setSaved(false);
    try {
      const kbData: KBData = { websiteUrl: kbWebsite, services: formatServicesText(kbServices), faqs: formatFaqsText(kbFaqs), additionalInfo: kbAdditionalInfo };
      const hasKb = kbData.services || kbData.faqs || kbData.additionalInfo || kbData.websiteUrl;
      const r = await fetch(`${api}/api/agency/${agency.id}/ai-templates/${industry}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ system_prompt: systemPrompt, first_message: firstMessage, voice_id: voiceId, model, temperature, is_active: true, knowledge_base_data: hasKb ? kbData : null }),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || 'Failed'); }
      setSaved(true); setTimeout(() => setSaved(false), 3000); await fetchTemplateData();
    } catch (e: any) { setError(e.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleReset = async () => {
    if (!agency || !confirm('Reset to default template? Your custom changes will be lost.')) return;
    setResetting(true); setError(null);
    try {
      const r = await fetch(`${api}/api/agency/${agency.id}/ai-templates/${industry}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
      if (!r.ok) throw new Error('Failed');
      if (defaults) { setSystemPrompt(defaults.system_prompt); setFirstMessage(defaults.first_message); setVoiceId(defaults.voice_id); setTemperature(defaults.temperature); setModel(defaults.model || 'gpt-4o-mini'); }
      setKbWebsite(''); setKbServices([{ id: '1', name: '', price: '', description: '' }]);
      setKbFaqs([{ id: '1', question: '', answer: '' }]); setKbAdditionalInfo('');
      await fetchTemplateData();
    } catch (e: any) { setError(e.message || 'Failed'); }
    finally { setResetting(false); }
  };

  const addService = () => setKbServices(p => [...p, { id: Date.now().toString(), name: '', price: '', description: '' }]);
  const removeService = (id: string) => { if (kbServices.length > 1) setKbServices(p => p.filter(s => s.id !== id)); };
  const updateService = (id: string, field: string, value: string) => setKbServices(p => p.map(s => s.id === id ? { ...s, [field]: value } : s));
  const addFaq = () => setKbFaqs(p => [...p, { id: Date.now().toString(), question: '', answer: '' }]);
  const removeFaq = (id: string) => { if (kbFaqs.length > 1) setKbFaqs(p => p.filter(f => f.id !== id)); };
  const updateFaq = (id: string, field: string, value: string) => setKbFaqs(p => p.map(f => f.id === id ? { ...f, [field]: value } : f));

  const hasChanges = template && (
    systemPrompt !== template.system_prompt || firstMessage !== template.first_message ||
    voiceId !== template.voice_id || model !== (template.model || 'gpt-4o-mini') || temperature !== template.temperature ||
    kbWebsite !== (template.knowledge_base_data?.websiteUrl || '') || kbAdditionalInfo !== (template.knowledge_base_data?.additionalInfo || '') ||
    formatServicesText(kbServices) !== (template.knowledge_base_data?.services || '') || formatFaqsText(kbFaqs) !== (template.knowledge_base_data?.faqs || '')
  );

  const selectedModelObj = MODEL_OPTIONS.find(m => m.id === model);

  if (contextLoading || loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.primary }} /></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Link href="/agency/templates" className="inline-flex items-center gap-2 text-sm mb-4 transition-colors" style={{ color: theme.textMuted }}>
          <ArrowLeft className="h-4 w-4" /> Back to AI Lab
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>{industryInfo?.label || 'Edit Template'}</h1>
            <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>{industryInfo?.description}</p>
            <p className="mt-1 text-xs" style={{ color: theme.textMuted }}>New clients in this industry will inherit this configuration.</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {template?.isCustom && (
              <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: theme.primary15, color: theme.primary }}>
                <Check className="h-3 w-3" /> Custom
              </span>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}>
          <AlertCircle className="h-5 w-5 flex-shrink-0" style={{ color: theme.error }} />
          <p className="text-sm" style={{ color: theme.errorText }}>{error}</p>
        </div>
      )}
      {saved && (
        <div className="mb-6 rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.primary30}` }}>
          <Check className="h-5 w-5" style={{ color: theme.primary }} />
          <p className="text-sm" style={{ color: theme.primary }}>Template saved! New clients will use this configuration.</p>
        </div>
      )}

      <div className="mb-6 rounded-xl p-3 flex items-start gap-3" style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.06 : 0.04), border: `1px solid ${hexToRgba(theme.primary, 0.15)}` }}>
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: theme.primary }} />
        <p className="text-xs" style={{ color: theme.textMuted }}>
          Use <code className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: theme.hover }}>{'{businessName}'}</code> in prompts — it&apos;s replaced with the client&apos;s actual business name at signup.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 space-y-4 min-w-0">
          <div className="rounded-xl p-4" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: theme.textMuted }}>Model</label>
                <select value={model} onChange={e => setModel(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle}>
                  {MODEL_OPTIONS.map(m => <option key={m.id} value={m.id}>{m.name}{m.tag ? ` (${m.tag})` : ''}</option>)}
                </select>
                {selectedModelObj && <p className="text-[10px] mt-1" style={{ color: theme.textMuted }}>{selectedModelObj.desc}</p>}
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: theme.textMuted }}>Temperature: {temperature}</label>
                <input type="range" min="0" max="1" step="0.1" value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))} className="w-full mt-1" style={{ accentColor: theme.primary }} />
                <div className="flex justify-between text-[9px] mt-0.5" style={{ color: theme.textMuted }}><span>Precise</span><span>Creative</span></div>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: theme.textMuted }}>Opening Greeting</label>
              <textarea value={firstMessage} onChange={e => setFirstMessage(e.target.value)} rows={2}
                className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={inputStyle} placeholder="Hi, you've reached {businessName}..." />
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-medium" style={{ color: theme.textMuted }}>Voice</label>
              <div className="flex gap-1">
                {(['all', 'female', 'male'] as const).map(f => (
                  <button key={f} onClick={() => setVoiceFilter(f)} className="px-2 py-0.5 rounded-md text-[10px] font-medium transition"
                    style={{ backgroundColor: voiceFilter === f ? theme.primary : theme.hover, color: voiceFilter === f ? theme.primaryText : theme.textMuted }}>
                    {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {filteredVoices.map(v => {
                const isSelected = voiceId === v.id;
                const isPlaying = playingVoiceId === v.id;
                return (
                  <div key={v.id} onClick={() => setVoiceId(v.id)}
                    className="relative rounded-lg p-2 cursor-pointer transition-all border"
                    style={{ borderColor: isSelected ? theme.primary : theme.border, backgroundColor: isSelected ? hexToRgba(theme.primary, theme.isDark ? 0.08 : 0.03) : 'transparent' }}>
                    {v.recommended && <span className="absolute -top-1 -right-1 text-[7px] font-bold px-1 py-0.5 rounded-full" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>★</span>}
                    <div className="flex items-center gap-1.5">
                      <button onClick={e => { e.stopPropagation(); playPreview(v); }}
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition"
                        style={{ backgroundColor: isPlaying ? theme.primary : (theme.isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6'), color: isPlaying ? theme.primaryText : theme.textMuted }}>
                        {isPlaying ? <Pause className="h-2.5 w-2.5" /> : <Play className="h-2.5 w-2.5 ml-0.5" />}
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-[11px] truncate" style={{ color: theme.text }}>{v.name}</span>
                          {isSelected && <Check className="h-2.5 w-2.5 flex-shrink-0" style={{ color: theme.primary }} />}
                        </div>
                        <p className="text-[8px]" style={{ color: theme.textMuted }}>{v.accent || v.gender} · {v.style || ''}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5" style={{ color: theme.primary }} />
                <span className="text-[11px] font-medium" style={{ color: theme.textMuted }}>Knowledge Base</span>
              </div>
              <button onClick={() => setKbExpanded(!kbExpanded)} className="flex items-center gap-1 text-[10px] font-medium transition" style={{ color: theme.primary }}>
                {kbExpanded ? 'Hide' : 'Edit'}
                <ChevronDown className={`h-3 w-3 transition-transform ${kbExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
            {!kbExpanded ? (
              <p className="text-[10px]" style={{ color: theme.textMuted }}>
                {kbServices.filter(s => s.name.trim()).length} services · {kbFaqs.filter(f => f.question.trim()).length} FAQs{kbAdditionalInfo ? ' · Has additional info' : ''}
                {!kbServices.some(s => s.name.trim()) && !kbFaqs.some(f => f.question.trim()) && !kbAdditionalInfo ? 'No KB data — clients inherit industry default.' : ''}
              </p>
            ) : (
              <div className="space-y-3 mt-2">
                <div className="flex items-start gap-2 p-2 rounded-lg" style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.06 : 0.04) }}>
                  <Info className="h-3 w-3 flex-shrink-0 mt-0.5" style={{ color: theme.primary }} />
                  <p className="text-[9px] leading-relaxed" style={{ color: theme.textMuted }}>Inherited by new clients. They can customize from their dashboard.</p>
                </div>
                <div>
                  <label className="flex items-center gap-1 text-[10px] font-medium mb-1" style={{ color: theme.textMuted }}><Globe className="w-3 h-3" style={{ color: theme.primary }} /> Website</label>
                  <input type="url" value={kbWebsite} onChange={e => setKbWebsite(e.target.value)} placeholder="https://yourbusiness.com" className="w-full rounded-lg px-2.5 py-1.5 text-xs" style={inputStyle} />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-[10px] font-medium mb-1" style={{ color: theme.textMuted }}><Briefcase className="w-3 h-3" style={{ color: theme.primary }} /> Services</label>
                  {kbServices.map(s => (
                    <div key={s.id} className="flex gap-1.5 mb-1.5">
                      <input type="text" value={s.name} onChange={e => updateService(s.id, 'name', e.target.value)} placeholder="Service" className="flex-1 rounded-lg px-2 py-1 text-[11px] min-w-0" style={inputStyle} />
                      <input type="text" value={s.price} onChange={e => updateService(s.id, 'price', e.target.value)} placeholder="$" className="w-16 rounded-lg px-2 py-1 text-[11px]" style={inputStyle} />
                      <button onClick={() => removeService(s.id)} disabled={kbServices.length === 1} className="p-1 disabled:opacity-20" style={{ color: theme.textMuted }}><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                  <button onClick={addService} className="flex items-center gap-1 text-[9px] font-medium mt-1 px-2 py-1 rounded transition hover:opacity-80" style={{ color: theme.primary, backgroundColor: hexToRgba(theme.primary, 0.08) }}><Plus className="w-2.5 h-2.5" /> Add</button>
                </div>
                <div>
                  <label className="flex items-center gap-1 text-[10px] font-medium mb-1" style={{ color: theme.textMuted }}><HelpCircle className="w-3 h-3" style={{ color: theme.primary }} /> FAQs</label>
                  {kbFaqs.map(f => (
                    <div key={f.id} className="mb-1.5 space-y-1">
                      <div className="flex gap-1.5">
                        <input type="text" value={f.question} onChange={e => updateFaq(f.id, 'question', e.target.value)} placeholder="Q:" className="flex-1 rounded-lg px-2 py-1 text-[11px] min-w-0" style={inputStyle} />
                        <button onClick={() => removeFaq(f.id)} disabled={kbFaqs.length === 1} className="p-1 disabled:opacity-20" style={{ color: theme.textMuted }}><Trash2 className="w-3 h-3" /></button>
                      </div>
                      <textarea value={f.answer} onChange={e => updateFaq(f.id, 'answer', e.target.value)} placeholder="A:" rows={1} className="w-full rounded-lg px-2 py-1 text-[11px] resize-none" style={inputStyle} />
                    </div>
                  ))}
                  <button onClick={addFaq} className="flex items-center gap-1 text-[9px] font-medium mt-1 px-2 py-1 rounded transition hover:opacity-80" style={{ color: theme.primary, backgroundColor: hexToRgba(theme.primary, 0.08) }}><Plus className="w-2.5 h-2.5" /> Add</button>
                </div>
                <div>
                  <label className="flex items-center gap-1 text-[10px] font-medium mb-1" style={{ color: theme.textMuted }}><FileText className="w-3 h-3" style={{ color: theme.primary }} /> Additional Info</label>
                  <textarea value={kbAdditionalInfo} onChange={e => setKbAdditionalInfo(e.target.value)} placeholder="Policies, service areas..." rows={2} className="w-full rounded-lg px-2.5 py-1.5 text-[11px] resize-none" style={inputStyle} />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <button onClick={handleReset} disabled={resetting || !template?.isCustom}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition disabled:opacity-40"
              style={{ backgroundColor: theme.hover, color: theme.textMuted, border: `1px solid ${theme.border}` }}>
              {resetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />} Reset
            </button>
            <button onClick={handleSave} disabled={saving || !hasChanges}
              className="inline-flex items-center gap-1.5 rounded-lg px-5 py-2 text-xs font-medium transition disabled:opacity-40"
              style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
              {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</> : <><Save className="h-3.5 w-3.5" /> Save Template</>}
            </button>
          </div>
        </div>

        <div className="lg:w-[45%] xl:w-[50%] flex-shrink-0">
          <div className="rounded-xl p-4 lg:sticky lg:top-4" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-medium" style={{ color: theme.textMuted }}>System Prompt</label>
              <span className="text-[10px] font-mono" style={{ color: theme.textMuted }}>{systemPrompt.length.toLocaleString()} chars</span>
            </div>
            <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-xs font-mono leading-relaxed"
              style={{ ...inputStyle, resize: 'vertical', minHeight: '500px', height: '70vh', maxHeight: '80vh' }}
              placeholder="Enter the system prompt..." />
            <p className="text-[9px] mt-1.5" style={{ color: theme.textMuted }}>
              Use <code className="px-1 py-0.5 rounded text-[9px]" style={{ backgroundColor: theme.hover }}>{'{businessName}'}</code> — auto-replaced at signup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
