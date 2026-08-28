'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Loader2, Mail, MessageSquare, PhoneCall, Save, Info,
  Copy, Check
} from 'lucide-react';
import { useAgency } from '../../../context';
import { useTheme } from '../../../../../hooks/useTheme';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';

interface TemplateVariable {
  key: string;
  label: string;
  description: string;
}

interface VariableGroup {
  lead: TemplateVariable[];
  agency: TemplateVariable[];
  dynamic: TemplateVariable[];
}

export default function TemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = params.id as string;
  const isNew = templateId === 'new';
  
  const { agency, loading: contextLoading } = useAgency();
  const theme = useTheme();
  const { canUseLeadFinder } = usePlanFeatures();

  if (canUseLeadFinder === false) {
    if (typeof window !== "undefined") window.location.href = "/agency/outreach";
    return null;
  }
  
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [variables, setVariables] = useState<VariableGroup | null>(null);
  const [showVariables, setShowVariables] = useState(false);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: searchParams.get('type') || 'email',
    subject: '',
    body: '',
    is_follow_up: false,
    sequence_name: '',
    delay_days: '',
  });

  const isCallScript = formData.type === 'call_script';
  const isSms = formData.type === 'sms';

  const inputStyle = {
    backgroundColor: theme.input,
    border: `1px solid ${theme.inputBorder}`,
    color: theme.text,
  };

  useEffect(() => {
    if (agency) {
      fetchVariables();
      if (!isNew) {
        fetchTemplate();
      }
    }
  }, [agency, templateId]);

  const fetchVariables = async () => {
    if (!agency) return;

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/outreach/variables`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setVariables(data.variables);
      }
    } catch (error) {
      console.error('Failed to fetch variables:', error);
    }
  };

  const fetchTemplate = async () => {
    if (!agency || isNew) return;

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/templates/${templateId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        setError('Template not found');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setFormData({
        name: data.template.name || '',
        description: data.template.description || '',
        type: data.template.type || 'email',
        subject: data.template.subject || '',
        body: data.template.body || '',
        is_follow_up: data.template.is_follow_up || false,
        sequence_name: data.template.sequence_name || '',
        delay_days: data.template.delay_days?.toString() || '',
      });
    } catch (error) {
      console.error('Failed to fetch template:', error);
      setError('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!agency) return;
    
    if (!formData.name.trim()) {
      setError('Template name is required');
      return;
    }
    if (!formData.body.trim()) {
      setError('Template body is required');
      return;
    }
    if (formData.type === 'email' && !formData.subject.trim()) {
      setError('Email subject is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const payload = {
        ...formData,
        delay_days: formData.delay_days ? parseInt(formData.delay_days) : null,
      };

      const url = isNew
        ? `${backendUrl}/api/agency/${agency.id}/templates`
        : `${backendUrl}/api/agency/${agency.id}/templates/${templateId}`;

      const response = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save template');
      }

      router.push('/agency/outreach');
    } catch (err: any) {
      setError(err.message || 'Failed to save template');
      setSaving(false);
    }
  };

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable);
    setCopiedVar(variable);
    setTimeout(() => setCopiedVar(null), 1500);
  };

  const renderVariableButton = (v: TemplateVariable, accentColor: string) => (
    <button
      key={v.key}
      onClick={() => copyVariable(v.key)}
      className="px-2 py-1 rounded text-[10px] font-mono transition-colors"
      style={{
        backgroundColor: copiedVar === v.key ? theme.primary15 : theme.hover,
        color: copiedVar === v.key ? theme.primary : accentColor,
      }}
    >
      {copiedVar === v.key ? '✓' : v.key}
    </button>
  );

  const renderVariableRow = (v: TemplateVariable, accentColor: string) => (
    <button
      key={v.key}
      onClick={() => copyVariable(v.key)}
      className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left group"
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hover}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <div className="min-w-0">
        <p className="text-sm font-mono truncate" style={{ color: accentColor }}>{v.key}</p>
        <p className="text-xs truncate" style={{ color: theme.textMuted }}>{v.description}</p>
      </div>
      {copiedVar === v.key ? (
        <Check className="h-3.5 w-3.5 shrink-0" style={{ color: theme.primary }} />
      ) : (
        <Copy className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100" style={{ color: theme.textMuted }} />
      )}
    </button>
  );

  const getTypeLabel = () => {
    switch (formData.type) {
      case 'email': return 'Email template';
      case 'sms': return 'SMS template';
      case 'call_script': return 'Call script';
      default: return 'Template';
    }
  };

  const getTypeIcon = () => {
    switch (formData.type) {
      case 'email': return <Mail className="h-4 w-4" style={{ color: theme.isDark ? '#a78bfa' : '#7c3aed' }} />;
      case 'sms': return <MessageSquare className="h-4 w-4" style={{ color: theme.isDark ? '#22d3ee' : '#0891b2' }} />;
      case 'call_script': return <PhoneCall className="h-4 w-4" style={{ color: theme.isDark ? '#4ade80' : '#16a34a' }} />;
      default: return null;
    }
  };

  const getBodyPlaceholder = () => {
    if (isCallScript) {
      return 'Write your cold call script here. Use {variables} for personalization.\n\nWrap stage directions in [BRACKETS] — e.g.:\n[PAUSE — let them respond]\n[IF YES] → Great! Let\'s schedule a time...\n[IF NOT INTERESTED] → I totally understand...';
    }
    if (isSms) {
      return 'Write your message here. Use {variables} to personalize.';
    }
    return 'Write your message here. Use {variables} to personalize.';
  };

  const getBodyRows = () => {
    if (isCallScript) return 18;
    if (formData.type === 'email') return 10;
    return 5;
  };

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
        <Link 
          href="/agency/outreach"
          className="inline-flex items-center gap-2 text-sm transition-colors mb-4"
          style={{ color: theme.textMuted }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Outreach
        </Link>
        
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>
              {isNew ? 'Create Template' : 'Edit Template'}
            </h1>
            <p className="mt-1 text-sm flex items-center gap-1.5" style={{ color: theme.textMuted }}>
              {getTypeIcon()}
              {getTypeLabel()}
            </p>
          </div>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 w-full sm:w-auto"
            style={{ backgroundColor: theme.primary, color: theme.primaryText }}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Template
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div 
          className="mb-4 sm:mb-6 rounded-xl p-3 sm:p-4 text-sm"
          style={{
            backgroundColor: theme.errorBg,
            border: `1px solid ${theme.errorBorder}`,
            color: theme.errorText,
          }}
        >
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Basic Info */}
          <div 
            className="rounded-xl p-4 sm:p-6"
            style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
          >
            <h3 className="font-medium text-sm sm:text-base mb-4 sm:mb-5" style={{ color: theme.text }}>Template Info</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs sm:text-sm mb-1.5" style={{ color: theme.textMuted }}>
                    Name <span style={{ color: theme.error }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={isCallScript ? 'e.g., Intro / Discovery Call' : 'e.g., Initial Outreach'}
                    className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:outline-none"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm mb-1.5" style={{ color: theme.textMuted }}>Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:outline-none"
                    style={inputStyle}
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="call_script">Call Script</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm mb-1.5" style={{ color: theme.textMuted }}>Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={isCallScript ? 'e.g., First cold call to a new lead — build rapport and qualify' : 'Brief description of when to use this'}
                  className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:outline-none"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div 
            className="rounded-xl p-4 sm:p-6"
            style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
          >
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <h3 className="font-medium text-sm sm:text-base" style={{ color: theme.text }}>Content</h3>
              <button
                onClick={() => setShowVariables(!showVariables)}
                className="text-xs sm:text-sm transition-colors"
                style={{ color: theme.primary }}
              >
                {showVariables ? 'Hide' : 'Show'} Variables
              </button>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              {/* Subject — only for email */}
              {formData.type === 'email' && (
                <div>
                  <label className="block text-xs sm:text-sm mb-1.5" style={{ color: theme.textMuted }}>
                    Subject <span style={{ color: theme.error }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Quick question about {lead_business_name}"
                    className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-mono focus:outline-none"
                    style={inputStyle}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm mb-1.5" style={{ color: theme.textMuted }}>
                  {isCallScript ? 'Script' : 'Body'} <span style={{ color: theme.error }}>*</span>
                </label>
                <textarea
                  id="template-body"
                  value={formData.body}
                  onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                  placeholder={getBodyPlaceholder()}
                  rows={getBodyRows()}
                  className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm font-mono resize-none focus:outline-none"
                  style={inputStyle}
                />
                {isSms && (
                  <p className="text-[10px] sm:text-xs mt-1" style={{ color: theme.textMuted }}>
                    {formData.body.length} characters (SMS limit: 160/segment)
                  </p>
                )}
                {isCallScript && (
                  <p className="text-[10px] sm:text-xs mt-1" style={{ color: theme.textMuted }}>
                    Tip: Use [BRACKETS] for stage directions and → for response branches
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Variables Panel */}
          {showVariables && variables && (
            <div 
              className="lg:hidden rounded-xl p-4"
              style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
            >
              <h3 className="font-medium text-sm mb-3" style={{ color: theme.text }}>Variables</h3>
              <p className="text-[10px] mb-3" style={{ color: theme.textMuted }}>Tap to copy</p>
              
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-medium mb-1.5" style={{ color: theme.textMuted }}>Lead</p>
                  <div className="flex flex-wrap gap-1.5">
                    {variables.lead.map((v) => renderVariableButton(v, '#34d399'))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-medium mb-1.5" style={{ color: theme.textMuted }}>Agency</p>
                  <div className="flex flex-wrap gap-1.5">
                    {variables.agency.map((v) => renderVariableButton(v, '#60a5fa'))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-medium mb-1.5" style={{ color: theme.textMuted }}>Dynamic</p>
                  <div className="flex flex-wrap gap-1.5">
                    {variables.dynamic.map((v) => renderVariableButton(v, '#a78bfa'))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block space-y-6">
          {showVariables && variables && (
            <div 
              className="rounded-xl p-6"
              style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
            >
              <h3 className="font-medium mb-4" style={{ color: theme.text }}>Available Variables</h3>
              <p className="text-xs mb-4" style={{ color: theme.textMuted }}>
                Click to copy, then paste into your template
              </p>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: theme.textMuted }}>Lead Info</p>
                  <div className="space-y-1">
                    {variables.lead.map((v) => renderVariableRow(v, '#34d399'))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: theme.textMuted }}>Your Info</p>
                  <div className="space-y-1">
                    {variables.agency.map((v) => renderVariableRow(v, '#60a5fa'))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: theme.textMuted }}>Dynamic</p>
                  <div className="space-y-1">
                    {variables.dynamic.map((v) => renderVariableRow(v, '#a78bfa'))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tips — context-aware */}
          <div 
            className="rounded-xl p-4"
            style={{ 
              backgroundColor: theme.infoBg,
              border: `1px solid ${theme.infoBorder}`,
            }}
          >
            <div className="flex items-start gap-3">
              <Info className="h-4 w-4 shrink-0 mt-0.5" style={{ color: theme.info }} />
              <div className="text-xs" style={{ color: theme.infoText }}>
                <p className="font-medium mb-1">
                  {isCallScript ? 'Call Script Tips:' : isSms ? 'SMS Tips:' : 'Email Tips:'}
                </p>
                <ul className="space-y-1" style={{ color: theme.infoText, opacity: 0.8 }}>
                  {isCallScript ? (
                    <>
                      <li>Start with rapport — ask how their day is going</li>
                      <li>Use open-ended discovery questions</li>
                      <li>Include [IF YES], [IF NO] response branches</li>
                      <li>Always set a next step (demo, callback, email)</li>
                      <li>Use &#123;agency_caller_name&#125; for your name</li>
                    </>
                  ) : isSms ? (
                    <>
                      <li>Keep under 160 characters per segment</li>
                      <li>Lead with value, not your name</li>
                      <li>One clear call-to-action</li>
                      <li>Include opt-out language if required</li>
                    </>
                  ) : (
                    <>
                      <li>Keep subject lines under 50 chars</li>
                      <li>Personalize with first name</li>
                      <li>One clear call-to-action</li>
                      <li>Keep emails under 200 words</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
