'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, Mail, MessageSquare, PhoneCall, Plus, Search, Loader2,
  MoreVertical, Copy, Trash2, Edit, Sparkles
} from 'lucide-react';
import { useAgency } from '../context';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import LockedFeatureOverlay from '@/components/LockedFeature';
import { useTheme } from '../../../hooks/useTheme';

interface Template {
  id: string;
  name: string;
  description: string;
  type: 'email' | 'sms' | 'call_script';
  subject: string;
  body: string;
  is_default: boolean;
  is_follow_up: boolean;
  sequence_name: string | null;
  sequence_order: number | null;
  use_count: number;
  created_at: string;
}

export default function OutreachPage() {
  const { agency, loading: contextLoading } = useAgency();
  const theme = useTheme();
  const { canUseLeadFinder } = usePlanFeatures();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    if (agency) {
      fetchTemplates();
    }
  }, [agency]);

  const fetchTemplates = async () => {
    if (!agency) return;

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/templates`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (template: Template) => {
    if (!agency) return;
    setActiveDropdown(null);

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(
        `${backendUrl}/api/agency/${agency.id}/templates/${template.id}/duplicate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: `${template.name} (Copy)` }),
        }
      );

      if (response.ok) {
        fetchTemplates();
      }
    } catch (error) {
      console.error('Failed to duplicate template:', error);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!agency) return;
    if (!confirm('Are you sure you want to delete this template?')) return;
    setActiveDropdown(null);

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(
        `${backendUrl}/api/agency/${agency.id}/templates/${templateId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (response.ok) {
        fetchTemplates();
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !typeFilter || template.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const emailTemplates = filteredTemplates.filter(t => t.type === 'email');
  const smsTemplates = filteredTemplates.filter(t => t.type === 'sms');
  const callScriptTemplates = filteredTemplates.filter(t => t.type === 'call_script');

  if (!canUseLeadFinder) {
    const previewEmails = [
      { name: 'Initial Outreach', desc: 'First contact — introduces AI receptionist value prop' },
      { name: 'Follow-up #1', desc: 'Soft follow-up with missed call cost data' },
      { name: 'Follow-up #2', desc: 'Social proof — client results and testimonials' },
      { name: 'Follow-up #3', desc: 'Urgency — limited availability messaging' },
      { name: 'Break-up Email', desc: 'Final touch — door stays open' },
      { name: 'Re-engagement', desc: 'Win-back for cold leads after 30+ days' },
    ];
    const previewSms = [
      { name: 'Initial SMS', desc: 'Quick intro text with value hook' },
      { name: 'Follow-up SMS', desc: 'Missed call ROI angle' },
      { name: 'Demo Invite SMS', desc: 'Link to try AI demo line' },
    ];
    const previewCalls = [
      { name: 'Cold Call Opener', desc: 'Pattern interrupt + qualify in 30 seconds' },
      { name: 'Voicemail Script', desc: 'Curiosity-driven voicemail for callbacks' },
      { name: 'Follow-up Call', desc: 'Reference previous touch + book demo' },
      { name: 'Objection Handling', desc: 'Cost, trust, and "not now" rebuttals' },
    ];
    return (
      <LockedFeatureOverlay
        title="Outreach Templates"
        description="13 conversion-tested email, SMS, and cold call templates built specifically for selling AI receptionists to local businesses."
        requiredPlan="Pro"
        features={[
          '6 email templates with proven sequences',
          '3 SMS templates for quick engagement',
          '4 cold call scripts with objection handling',
          'Customizable per lead with merge fields',
        ]}
      >
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Outreach</h1>
            <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>13 conversion-tested templates</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Email column */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Mail className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-medium" style={{ color: theme.text }}>Email Templates</h3>
                <span className="text-xs" style={{ color: theme.textMuted }}>({previewEmails.length})</span>
              </div>
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                {previewEmails.map((t, i) => (
                  <div key={t.name} className="px-3 py-2.5" style={{ borderBottom: i < previewEmails.length - 1 ? `1px solid ${theme.isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6'}` : 'none' }}>
                    <p className="text-sm font-medium truncate" style={{ color: theme.text }}>{t.name}</p>
                    <p className="text-xs truncate" style={{ color: theme.textMuted }}>{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* SMS column */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-medium" style={{ color: theme.text }}>SMS Templates</h3>
                <span className="text-xs" style={{ color: theme.textMuted }}>({previewSms.length})</span>
              </div>
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                {previewSms.map((t, i) => (
                  <div key={t.name} className="px-3 py-2.5" style={{ borderBottom: i < previewSms.length - 1 ? `1px solid ${theme.isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6'}` : 'none' }}>
                    <p className="text-sm font-medium truncate" style={{ color: theme.text }}>{t.name}</p>
                    <p className="text-xs truncate" style={{ color: theme.textMuted }}>{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Call Scripts column */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <PhoneCall className="h-4 w-4 text-green-400" />
                <h3 className="text-sm font-medium" style={{ color: theme.text }}>Call Scripts</h3>
                <span className="text-xs" style={{ color: theme.textMuted }}>({previewCalls.length})</span>
              </div>
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                {previewCalls.map((t, i) => (
                  <div key={t.name} className="px-3 py-2.5" style={{ borderBottom: i < previewCalls.length - 1 ? `1px solid ${theme.isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6'}` : 'none' }}>
                    <p className="text-sm font-medium truncate" style={{ color: theme.text }}>{t.name}</p>
                    <p className="text-xs truncate" style={{ color: theme.textMuted }}>{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </LockedFeatureOverlay>
    );
  }

  if (contextLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.primary }} />
      </div>
    );
  }

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />;
      case 'sms': return <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />;
      case 'call_script': return <PhoneCall className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />;
      default: return <FileText className="h-4 w-4 sm:h-5 sm:w-5" />;
    }
  };

  const getTemplateIconBg = (type: string) => {
    switch (type) {
      case 'email': return 'rgba(168,85,247,0.1)';
      case 'sms': return 'rgba(6,182,212,0.1)';
      case 'call_script': return 'rgba(34,197,94,0.1)';
      default: return theme.hover;
    }
  };

  const getTemplatePreview = (template: Template) => {
    switch (template.type) {
      case 'email':
        return template.subject || template.description || 'No subject';
      case 'sms':
        return (template.body?.substring(0, 50) || 'No content') + '...';
      case 'call_script':
        return template.description || (template.body?.substring(0, 50) || 'No content') + '...';
      default:
        return template.description || 'No content';
    }
  };

  const renderTemplateRow = (template: Template, idx: number, total: number) => (
    <div
      key={template.id}
      className="flex items-center justify-between p-3 sm:p-4 transition-colors"
      style={{ borderBottom: idx < total - 1 ? `1px solid ${theme.isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6'}` : 'none' }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hover}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <Link
        href={`/agency/outreach/templates/${template.id}`}
        className="flex-1 min-w-0"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div 
            className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg shrink-0"
            style={{ backgroundColor: getTemplateIconBg(template.type) }}
          >
            {getTemplateIcon(template.type)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <p className="font-medium text-sm truncate" style={{ color: theme.text }}>{template.name}</p>
              {template.is_default && (
                <span 
                  className="flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-xs px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: theme.warningBg, color: theme.warning }}
                >
                  <Sparkles className="h-2.5 w-2.5" />
                  Default
                </span>
              )}
              {template.type === 'call_script' && template.sequence_order && (
                <span 
                  className="text-[9px] sm:text-xs px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: theme.isDark ? '#4ade80' : '#16a34a' }}
                >
                  Step {template.sequence_order}
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-sm truncate" style={{ color: theme.textMuted }}>
              {getTemplatePreview(template)}
            </p>
          </div>
        </div>
      </Link>
      
      <div className="flex items-center gap-1 ml-2">
        <span className="text-[10px] hidden sm:inline mr-1" style={{ color: theme.textMuted }}>
          {template.use_count || 0}x
        </span>
        <div className="relative">
          <button
            onClick={() => setActiveDropdown(activeDropdown === template.id ? null : template.id)}
            className="rounded-lg p-1.5 sm:p-2 transition-colors"
            style={{ color: theme.textMuted }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          
          {activeDropdown === template.id && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)} />
              <div 
                className="absolute right-0 mt-1 w-32 sm:w-40 rounded-xl shadow-xl z-20"
                style={{ backgroundColor: theme.isDark ? '#0f0f0f' : '#ffffff', border: `1px solid ${theme.inputBorder}` }}
              >
                <Link
                  href={`/agency/outreach/templates/${template.id}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm transition-colors"
                  style={{ color: theme.text }}
                  onClick={() => setActiveDropdown(null)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Link>
                <button
                  onClick={() => handleDuplicate(template)}
                  className="flex items-center gap-2 px-3 py-2 text-sm transition-colors w-full text-left"
                  style={{ color: theme.text }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Copy className="h-4 w-4" />
                  Duplicate
                </button>
                {!template.is_default && (
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="flex items-center gap-2 px-3 py-2 text-sm transition-colors w-full text-left"
                    style={{ color: theme.error }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.errorBg}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Outreach</h1>
            <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
              Manage email, SMS, and call script templates
            </p>
          </div>
          
          <Link
            href="/agency/outreach/templates/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors w-full sm:w-auto"
            style={{ backgroundColor: theme.primary, color: theme.primaryText }}
          >
            <Plus className="h-4 w-4" />
            New Template
          </Link>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 mb-6 sm:mb-8">
        <Link
          href="/agency/outreach/templates/new?type=email"
          className="rounded-xl p-4 transition-colors"
          style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.card}
        >
          <div className="flex items-center gap-3">
            <div 
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg shrink-0"
              style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}
            >
              <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm sm:text-base" style={{ color: theme.text }}>Email Template</p>
              <p className="text-xs sm:text-sm truncate" style={{ color: theme.textMuted }}>Create new email</p>
            </div>
          </div>
        </Link>
        
        <Link
          href="/agency/outreach/templates/new?type=sms"
          className="rounded-xl p-4 transition-colors"
          style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.card}
        >
          <div className="flex items-center gap-3">
            <div 
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg shrink-0"
              style={{ backgroundColor: 'rgba(6,182,212,0.1)' }}
            >
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm sm:text-base" style={{ color: theme.text }}>SMS Template</p>
              <p className="text-xs sm:text-sm truncate" style={{ color: theme.textMuted }}>Create new SMS</p>
            </div>
          </div>
        </Link>

        <Link
          href="/agency/outreach/templates/new?type=call_script"
          className="rounded-xl p-4 transition-colors"
          style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.card}
        >
          <div className="flex items-center gap-3">
            <div 
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg shrink-0"
              style={{ backgroundColor: 'rgba(34,197,94,0.1)' }}
            >
              <PhoneCall className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm sm:text-base" style={{ color: theme.text }}>Call Script</p>
              <p className="text-xs sm:text-sm truncate" style={{ color: theme.textMuted }}>Create cold call script</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 sm:mb-6">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textMuted }} />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm transition-colors focus:outline-none"
            style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}
          />
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { value: null, label: 'All' },
            { value: 'email', label: 'Email' },
            { value: 'sms', label: 'SMS' },
            { value: 'call_script', label: 'Call Scripts' },
          ].map((filter) => (
            <button
              key={filter.label}
              onClick={() => setTypeFilter(filter.value)}
              className="rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
              style={typeFilter === filter.value ? {
                backgroundColor: theme.primary15,
                color: theme.primary,
              } : {
                color: theme.textMuted,
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Templates List */}
      {filteredTemplates.length === 0 ? (
        <div 
          className="rounded-xl py-12 sm:py-20 text-center px-4"
          style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
        >
          <div 
            className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.primary15 }}
          >
            <FileText className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: theme.primary, opacity: 0.8 }} />
          </div>
          <p className="mt-4 font-medium text-sm sm:text-base" style={{ color: theme.text, opacity: 0.7 }}>
            {searchQuery || typeFilter ? 'No templates match your search' : 'No templates yet'}
          </p>
          <p className="text-xs sm:text-sm mt-1 mb-4" style={{ color: theme.textMuted }}>
            Create your first outreach template
          </p>
          <Link
            href="/agency/outreach/templates/new"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors"
            style={{ backgroundColor: theme.primary, color: theme.primaryText }}
          >
            <Plus className="h-4 w-4" />
            Create Template
          </Link>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {emailTemplates.length > 0 && (!typeFilter || typeFilter === 'email') && (
            <div>
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <Mail className="h-4 w-4" style={{ color: theme.textMuted }} />
                <h3 className="text-xs sm:text-sm font-medium" style={{ color: theme.text, opacity: 0.7 }}>Email Templates</h3>
                <span className="text-[10px] sm:text-xs" style={{ color: theme.textMuted }}>({emailTemplates.length})</span>
              </div>
              <div 
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
              >
                {emailTemplates.map((t, idx) => renderTemplateRow(t, idx, emailTemplates.length))}
              </div>
            </div>
          )}

          {smsTemplates.length > 0 && (!typeFilter || typeFilter === 'sms') && (
            <div>
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <MessageSquare className="h-4 w-4" style={{ color: theme.textMuted }} />
                <h3 className="text-xs sm:text-sm font-medium" style={{ color: theme.text, opacity: 0.7 }}>SMS Templates</h3>
                <span className="text-[10px] sm:text-xs" style={{ color: theme.textMuted }}>({smsTemplates.length})</span>
              </div>
              <div 
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
              >
                {smsTemplates.map((t, idx) => renderTemplateRow(t, idx, smsTemplates.length))}
              </div>
            </div>
          )}

          {callScriptTemplates.length > 0 && (!typeFilter || typeFilter === 'call_script') && (
            <div>
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <PhoneCall className="h-4 w-4" style={{ color: theme.textMuted }} />
                <h3 className="text-xs sm:text-sm font-medium" style={{ color: theme.text, opacity: 0.7 }}>Call Scripts</h3>
                <span className="text-[10px] sm:text-xs" style={{ color: theme.textMuted }}>({callScriptTemplates.length})</span>
              </div>
              <div 
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
              >
                {callScriptTemplates.map((t, idx) => renderTemplateRow(t, idx, callScriptTemplates.length))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
