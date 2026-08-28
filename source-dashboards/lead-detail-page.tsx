'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Loader2, Phone, Mail, Globe, Building2, User,
  Calendar, DollarSign, Tag, FileText, Save, Trash2, Clock,
  CheckCircle, XCircle, MessageSquare, PhoneCall, Send,
  Hash, TrendingUp
} from 'lucide-react';
import { useAgency } from '../../context';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { useTheme } from '../../../../hooks/useTheme';
import { getDemoLeadDetail } from '../../demoData';
import ActivityLog from '../../../../components/ActivityLog';
import ComposerModal from '../../../../components/ComposerModal';
import CallScriptModal from '../../../../components/CallScriptModal';

interface Lead {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  source: string;
  status: string;
  notes: string;
  estimated_value: number;
  next_follow_up: string | null;
  created_at: string;
  updated_at: string;
}

interface OutreachStats {
  email_count: number;
  sms_count: number;
  call_count?: number;
  total_count: number;
  last_email: { sent_at: string; subject: string } | null;
  last_sms: { sent_at: string } | null;
  last_call?: { sent_at: string; subject?: string } | null;
  last_outreach: { type: string; sent_at: string } | null;
  next_email_number: number;
  next_sms_number: number;
  history: Array<{
    id: string;
    type: string;
    sent_at: string;
    subject: string | null;
  }>;
}

interface SequenceInfo {
  next_type: string;
  next_template_name: string;
  next_sequence_order: number;
  due_date: string;
  urgency: 'overdue' | 'due_today' | 'upcoming';
  days_overdue: number;
  pending_steps: any[];
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: 'blue' },
  { value: 'contacted', label: 'Contacted', color: 'amber' },
  { value: 'qualified', label: 'Qualified', color: 'purple' },
  { value: 'proposal', label: 'Proposal Sent', color: 'cyan' },
  { value: 'won', label: 'Won', color: 'emerald' },
  { value: 'lost', label: 'Lost', color: 'red' },
];

const SOURCE_OPTIONS = [
  { value: 'google_maps', label: 'Google Maps' },
  { value: 'google_search', label: 'Google Search' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'yelp', label: 'Yelp' },
  { value: 'referral', label: 'Referral' },
  { value: 'in_person', label: 'In Person' },
  { value: 'event', label: 'Event / Trade Show' },
  { value: 'lead_finder_maps', label: 'Lead Finder (Maps)' },
  { value: 'csv_import', label: 'CSV Import' },
  { value: 'other', label: 'Other' },
];

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

function getOutreachLabel(type: 'email' | 'sms', number: number): string {
  if (number === 1) {
    return type === 'email' ? 'Initial Email' : 'Initial SMS';
  } else if (number === 2) {
    return type === 'email' ? 'Follow-up Email' : 'Follow-up SMS';
  } else {
    return type === 'email' ? `Follow-up Email #${number - 1}` : `Follow-up SMS #${number - 1}`;
  }
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;
  const { agency, loading: contextLoading, demoMode } = useAgency();
  const theme = useTheme();
  const { canUseLeadFinder } = usePlanFeatures();

  if (canUseLeadFinder === false) {
    if (typeof window !== "undefined") window.location.href = "/agency/leads";
    return null;
  }

  
  const [lead, setLead] = useState<Lead | null>(null);
  const [outreach, setOutreach] = useState<OutreachStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activityKey, setActivityKey] = useState(0);
  
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerType, setComposerType] = useState<'email' | 'sms'>('email');
  const [callScriptOpen, setCallScriptOpen] = useState(false);

  // Sequence follow-up timing
  const [sequenceInfo, setSequenceInfo] = useState<SequenceInfo | null>(null);
  
  const [formData, setFormData] = useState({
    business_name: '',
    contact_name: '',
    email: '',
    phone: '',
    website: '',
    industry: '',
    source: '',
    status: 'new',
    notes: '',
    estimated_value: '',
    next_follow_up: '',
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'new':
        return { bg: theme.infoBg, text: theme.info, border: theme.infoBorder };
      case 'contacted':
        return { bg: theme.warningBg, text: theme.warning, border: theme.warningBorder };
      case 'qualified':
        return { bg: 'rgba(168,85,247,0.1)', text: theme.isDark ? '#a78bfa' : '#7c3aed', border: 'rgba(168,85,247,0.2)' };
      case 'proposal':
        return { bg: 'rgba(6,182,212,0.1)', text: theme.isDark ? '#22d3ee' : '#0891b2', border: 'rgba(6,182,212,0.2)' };
      case 'won':
        return { bg: theme.primary15, text: theme.primary, border: theme.primary30 };
      case 'lost':
        return { bg: theme.errorBg, text: theme.error, border: theme.errorBorder };
      default:
        return { bg: theme.hover, text: theme.textMuted, border: theme.border };
    }
  };

  useEffect(() => {
    if (!agency || !leadId) return;

    if (demoMode) {
      const demoData = getDemoLeadDetail(leadId);
      const demoLead = demoData.lead as Lead;
      setLead(demoLead);
      setOutreach(demoData.outreachStats as OutreachStats);
      setFormData({
        business_name: demoLead.business_name || '',
        contact_name: demoLead.contact_name || '',
        email: demoLead.email || '',
        phone: demoLead.phone || '',
        website: demoLead.website || '',
        industry: demoLead.industry || '',
        source: demoLead.source || '',
        status: demoLead.status || 'new',
        notes: demoLead.notes || '',
        estimated_value: demoLead.estimated_value ? String(demoLead.estimated_value / 100) : '',
        next_follow_up: demoLead.next_follow_up ? demoLead.next_follow_up.split('T')[0] : '',
      });
      setLoading(false);
      return;
    }

    fetchLead();
  }, [agency, leadId, demoMode]);

  const fetchLead = async () => {
    if (!agency || !leadId) return;

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/leads/${leadId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('Lead not found');
        } else {
          setError('Failed to load lead');
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      setLead(data.lead);
      setOutreach(data.outreach || null);
      
      setFormData({
        business_name: data.lead.business_name || '',
        contact_name: data.lead.contact_name || '',
        email: data.lead.email || '',
        phone: data.lead.phone || '',
        website: data.lead.website || '',
        industry: data.lead.industry || '',
        source: data.lead.source || '',
        status: data.lead.status || 'new',
        notes: data.lead.notes || '',
        estimated_value: data.lead.estimated_value ? String(data.lead.estimated_value / 100) : '',
        next_follow_up: data.lead.next_follow_up ? data.lead.next_follow_up.split('T')[0] : '',
      });

      // Fetch sequence follow-up info
      fetchSequenceInfo();
    } catch (err) {
      console.error('Failed to fetch lead:', err);
      setError('Failed to load lead');
    } finally {
      setLoading(false);
    }
  };

  const fetchSequenceInfo = async () => {
    if (!agency || !leadId || demoMode) return;

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/leads/follow-up-queue`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const myItem = (data.queue || []).find((q: any) => q.lead_id === leadId);
        setSequenceInfo(myItem || null);
      }
    } catch (error) {
      console.error('Failed to fetch sequence info:', error);
    }
  };

  const handleSave = async () => {
    if (demoMode) return;
    if (!agency || !leadId) return;
    
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('auth_token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const payload = {
        ...formData,
        estimated_value: formData.estimated_value 
          ? Math.round(parseFloat(formData.estimated_value) * 100) 
          : null,
        next_follow_up: formData.next_follow_up || null,
        userId: user.id,
      };

      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save');
      }

      const data = await response.json();
      setLead(data.lead);
      setOutreach(data.outreach || outreach);
      setSuccessMessage('Lead updated successfully');
      setActivityKey(prev => prev + 1);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save lead');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (demoMode) return;
    if (!agency || !leadId) return;
    
    if (!confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/leads/${leadId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete lead');
      }

      router.push('/agency/leads');
    } catch (err: any) {
      setError(err.message || 'Failed to delete lead');
      setDeleting(false);
    }
  };

  const handleQuickStatusChange = async (newStatus: string) => {
    if (demoMode) {
      setFormData(prev => ({ ...prev, status: newStatus }));
      setSuccessMessage('Status updated (demo)');
      setTimeout(() => setSuccessMessage(''), 2000);
      return;
    }
    if (!agency || !leadId) return;

    try {
      const token = localStorage.getItem('auth_token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus, userId: user.id }),
      });

      if (response.ok) {
        const data = await response.json();
        setLead(data.lead);
        setFormData(prev => ({ ...prev, status: newStatus }));
        setSuccessMessage('Status updated');
        setActivityKey(prev => prev + 1);
        setTimeout(() => setSuccessMessage(''), 2000);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const openComposer = (type: 'email' | 'sms') => {
    setComposerType(type);
    setComposerOpen(true);
  };

  const handleOutreachSent = () => {
    setActivityKey(prev => prev + 1);
    fetchLead();
    fetchSequenceInfo();
  };

  if (contextLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.primary }} />
      </div>
    );
  }

  if (error && !lead) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Link 
          href="/agency/leads"
          className="inline-flex items-center gap-2 text-sm transition-colors mb-8"
          style={{ color: theme.textMuted }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Leads
        </Link>
        <div className="text-center py-16 sm:py-20">
          <div 
            className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.errorBg }}
          >
            <XCircle className="h-7 w-7 sm:h-8 sm:w-8" style={{ color: theme.error, opacity: 0.5 }} />
          </div>
          <p className="mt-4 font-medium" style={{ color: theme.text, opacity: 0.7 }}>{error}</p>
          <Link 
            href="/agency/leads"
            className="mt-4 inline-flex items-center gap-2 text-sm transition-colors"
            style={{ color: theme.primary }}
          >
            <ArrowLeft className="h-4 w-4" />
            Return to leads
          </Link>
        </div>
      </div>
    );
  }

  const canSendEmail = Boolean(formData.email && formData.email.includes('@'));
  const canSendSms = Boolean(formData.phone && formData.phone.length >= 10);
  const canCall = Boolean(formData.phone && formData.phone.length >= 10);

  const inputStyle = {
    backgroundColor: theme.input,
    border: `1px solid ${theme.inputBorder}`,
    color: theme.text,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Back Button & Header */}
      <div className="mb-6 sm:mb-8">
        <Link 
          href="/agency/leads"
          className="inline-flex items-center gap-2 text-sm transition-colors mb-4"
          style={{ color: theme.textMuted }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Leads
        </Link>
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div 
              className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl flex-shrink-0"
              style={{ backgroundColor: theme.infoBg }}
            >
              <span className="text-lg sm:text-2xl font-medium" style={{ color: theme.info }}>
                {lead?.business_name?.charAt(0) || '?'}
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-semibold tracking-tight truncate" style={{ color: theme.text }}>{lead?.business_name}</h1>
              <p className="text-sm" style={{ color: theme.textMuted }}>
                Added {lead?.created_at ? new Date(lead.created_at).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>
          
          {!demoMode && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: theme.errorBg,
                  border: `1px solid ${theme.errorBorder}`,
                  color: theme.error,
                }}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Delete</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 flex-1 sm:flex-none justify-center"
                style={{ backgroundColor: theme.primary, color: theme.primaryText }}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status Messages */}
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
      {successMessage && (
        <div 
          className="mb-4 sm:mb-6 rounded-xl p-3 sm:p-4 text-sm flex items-center gap-2"
          style={{
            backgroundColor: theme.primary15,
            border: `1px solid ${theme.primary30}`,
            color: theme.primary,
          }}
        >
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          {successMessage}
        </div>
      )}

      {/* Outreach Progress Card */}
      <div 
        className="mb-6 sm:mb-8 rounded-xl p-4 sm:p-5"
        style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4" style={{ color: theme.primary }} />
          <h3 className="font-medium text-sm sm:text-base" style={{ color: theme.text }}>Outreach Progress</h3>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-4">
          {/* Email Count */}
          <div 
            className="rounded-lg p-3"
            style={{ backgroundColor: 'rgba(168,85,247,0.1)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Mail className="h-4 w-4" style={{ color: theme.isDark ? '#a78bfa' : '#7c3aed' }} />
              <span className="text-xs" style={{ color: theme.textMuted }}>Emails</span>
            </div>
            <p className="text-xl font-semibold" style={{ color: theme.isDark ? '#a78bfa' : '#7c3aed' }}>
              {outreach?.email_count || 0}
            </p>
            {outreach?.last_email && (
              <p className="text-[10px] sm:text-xs mt-1" style={{ color: theme.textMuted }}>
                Last: {timeAgo(outreach.last_email.sent_at)}
              </p>
            )}
          </div>
          
          {/* SMS Count */}
          <div 
            className="rounded-lg p-3"
            style={{ backgroundColor: 'rgba(6,182,212,0.1)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="h-4 w-4" style={{ color: theme.isDark ? '#22d3ee' : '#0891b2' }} />
              <span className="text-xs" style={{ color: theme.textMuted }}>SMS</span>
            </div>
            <p className="text-xl font-semibold" style={{ color: theme.isDark ? '#22d3ee' : '#0891b2' }}>
              {outreach?.sms_count || 0}
            </p>
            {outreach?.last_sms && (
              <p className="text-[10px] sm:text-xs mt-1" style={{ color: theme.textMuted }}>
                Last: {timeAgo(outreach.last_sms.sent_at)}
              </p>
            )}
          </div>

          {/* Call Count */}
          <div 
            className="rounded-lg p-3"
            style={{ backgroundColor: 'rgba(34,197,94,0.1)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <PhoneCall className="h-4 w-4" style={{ color: theme.isDark ? '#4ade80' : '#16a34a' }} />
              <span className="text-xs" style={{ color: theme.textMuted }}>Calls</span>
            </div>
            <p className="text-xl font-semibold" style={{ color: theme.isDark ? '#4ade80' : '#16a34a' }}>
              {outreach?.call_count || 0}
            </p>
            {outreach?.last_call && (
              <p className="text-[10px] sm:text-xs mt-1" style={{ color: theme.textMuted }}>
                Last: {timeAgo(outreach.last_call.sent_at)}
              </p>
            )}
          </div>
          
          {/* Total Touches */}
          <div 
            className="rounded-lg p-3"
            style={{ backgroundColor: theme.hover }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Hash className="h-4 w-4" style={{ color: theme.textMuted }} />
              <span className="text-xs" style={{ color: theme.textMuted }}>Total</span>
            </div>
            <p className="text-xl font-semibold" style={{ color: theme.text }}>
              {outreach?.total_count || 0}
            </p>
            <p className="text-[10px] sm:text-xs mt-1" style={{ color: theme.textMuted }}>
              touches
            </p>
          </div>
          
          {/* Last Contact */}
          <div 
            className="rounded-lg p-3"
            style={{ backgroundColor: theme.hover }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4" style={{ color: theme.textMuted }} />
              <span className="text-xs" style={{ color: theme.textMuted }}>Last Contact</span>
            </div>
            <p className="text-sm font-medium truncate" style={{ color: theme.text }}>
              {outreach?.last_outreach 
                ? timeAgo(outreach.last_outreach.sent_at)
                : 'Never'}
            </p>
            {outreach?.last_outreach && (
              <p className="text-[10px] sm:text-xs mt-1 capitalize" style={{ color: theme.textMuted }}>
                via {outreach.last_outreach.type}
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => openComposer('email')}
            disabled={!canSendEmail}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: canSendEmail ? 'rgba(168,85,247,0.1)' : theme.hover,
              border: `1px solid ${canSendEmail ? 'rgba(168,85,247,0.3)' : theme.border}`,
              color: canSendEmail ? (theme.isDark ? '#a78bfa' : '#7c3aed') : theme.textMuted,
            }}
            title={!canSendEmail ? 'Add email address to send' : undefined}
          >
            <Mail className="h-4 w-4" />
            <span>{getOutreachLabel('email', outreach?.next_email_number || 1)}</span>
            <Send className="h-3 w-3" />
          </button>
          
          <button
            onClick={() => openComposer('sms')}
            disabled={!canSendSms}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: canSendSms ? 'rgba(6,182,212,0.1)' : theme.hover,
              border: `1px solid ${canSendSms ? 'rgba(6,182,212,0.3)' : theme.border}`,
              color: canSendSms ? (theme.isDark ? '#22d3ee' : '#0891b2') : theme.textMuted,
            }}
            title={!canSendSms ? 'Add phone number to send' : undefined}
          >
            <MessageSquare className="h-4 w-4" />
            <span>{getOutreachLabel('sms', outreach?.next_sms_number || 1)}</span>
            <Send className="h-3 w-3" />
          </button>
          
          {canCall && (
            <button
              onClick={() => setCallScriptOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.3)',
                color: theme.isDark ? '#4ade80' : '#16a34a',
              }}
            >
              <PhoneCall className="h-4 w-4" />
              Call
              {(outreach?.call_count || 0) > 0 && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(34,197,94,0.15)' }}
                >
                  #{(outreach?.call_count || 0) + 1}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Sequence Follow-up Timing */}
        {sequenceInfo && (
          <div 
            className="mt-4 rounded-lg p-3 flex items-center justify-between"
            style={{ 
              backgroundColor: sequenceInfo.urgency === 'overdue' 
                ? theme.errorBg 
                : sequenceInfo.urgency === 'due_today'
                  ? theme.warningBg
                  : 'rgba(168,85,247,0.08)',
              border: `1px solid ${
                sequenceInfo.urgency === 'overdue' 
                  ? theme.errorBorder 
                  : sequenceInfo.urgency === 'due_today'
                    ? theme.warningBorder
                    : 'rgba(168,85,247,0.2)'
              }`,
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ 
                  backgroundColor: sequenceInfo.urgency === 'overdue' 
                    ? 'rgba(239,68,68,0.2)' 
                    : sequenceInfo.urgency === 'due_today'
                      ? 'rgba(245,158,11,0.2)'
                      : 'rgba(168,85,247,0.15)',
                }}
              >
                {sequenceInfo.next_type === 'email' 
                  ? <Mail className="h-4 w-4" style={{ color: sequenceInfo.urgency === 'overdue' ? theme.error : sequenceInfo.urgency === 'due_today' ? theme.warning : (theme.isDark ? '#a78bfa' : '#7c3aed') }} />
                  : <MessageSquare className="h-4 w-4" style={{ color: sequenceInfo.urgency === 'overdue' ? theme.error : sequenceInfo.urgency === 'due_today' ? theme.warning : (theme.isDark ? '#22d3ee' : '#0891b2') }} />
                }
              </div>
              <div>
                <p className="text-sm font-medium" style={{ 
                  color: sequenceInfo.urgency === 'overdue' 
                    ? theme.error 
                    : sequenceInfo.urgency === 'due_today'
                      ? theme.warning
                      : (theme.isDark ? '#a78bfa' : '#7c3aed')
                }}>
                  Next: {sequenceInfo.next_template_name}
                </p>
                <p className="text-xs" style={{ color: theme.textMuted }}>
                  {sequenceInfo.urgency === 'overdue' 
                    ? `Overdue by ${sequenceInfo.days_overdue} day${sequenceInfo.days_overdue !== 1 ? 's' : ''}`
                    : sequenceInfo.urgency === 'due_today'
                      ? 'Due today'
                      : `Due ${new Date(sequenceInfo.due_date).toLocaleDateString()}`
                  }
                </p>
              </div>
            </div>
            <button
              onClick={() => openComposer(sequenceInfo.next_type as 'email' | 'sms')}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors shrink-0"
              style={{
                backgroundColor: sequenceInfo.urgency === 'overdue' 
                  ? theme.error 
                  : sequenceInfo.urgency === 'due_today'
                    ? theme.warning
                    : (theme.isDark ? '#a78bfa' : '#7c3aed'),
                color: '#ffffff',
              }}
            >
              Send Now
            </button>
          </div>
        )}

        {/* Missing contact info warnings */}
        {!demoMode && (!canSendEmail || !canSendSms) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {!canSendEmail && (
              <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: theme.warningBg, color: theme.warning }}>
                Add email to enable email outreach
              </span>
            )}
            {!canSendSms && (
              <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: theme.warningBg, color: theme.warning }}>
                Add phone to enable SMS outreach
              </span>
            )}
          </div>
        )}
      </div>

      {/* Quick Status Buttons */}
      <div className="mb-6 sm:mb-8">
        <p className="text-xs sm:text-sm mb-2 sm:mb-3" style={{ color: theme.textMuted }}>Pipeline Stage</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((status) => {
            const style = getStatusStyle(status.value);
            const isActive = formData.status === status.value;
            return (
              <button
                key={status.value}
                onClick={() => handleQuickStatusChange(status.value)}
                className="rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium transition-all"
                style={isActive ? {
                  backgroundColor: style.bg,
                  border: `1px solid ${style.text}`,
                  color: style.text,
                } : {
                  backgroundColor: theme.card,
                  border: `1px solid ${theme.inputBorder}`,
                  color: theme.textMuted,
                }}
              >
                {status.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Business Information */}
          <div 
            className="rounded-xl p-4 sm:p-6"
            style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
          >
            <h3 className="font-medium mb-4 sm:mb-5 flex items-center gap-2 text-sm sm:text-base" style={{ color: theme.text }}>
              <Building2 className="h-4 w-4" style={{ color: theme.textMuted }} />
              Business Information
            </h3>
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs sm:text-sm mb-1.5" style={{ color: theme.textMuted }}>Business Name *</label>
                <input type="text" value={formData.business_name} onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))} readOnly={demoMode} className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs sm:text-sm mb-1.5" style={{ color: theme.textMuted }}>Industry</label>
                <input type="text" value={formData.industry} onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))} readOnly={demoMode} placeholder="e.g., Plumbing, HVAC" className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs sm:text-sm mb-1.5" style={{ color: theme.textMuted }}>Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textMuted }} />
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} readOnly={demoMode} className="w-full rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-sm focus:outline-none" style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm mb-1.5" style={{ color: theme.textMuted }}>Website</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textMuted }} />
                  <input type="url" value={formData.website} onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))} readOnly={demoMode} placeholder="example.com" className="w-full rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-sm focus:outline-none" style={inputStyle} />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div 
            className="rounded-xl p-4 sm:p-6"
            style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
          >
            <h3 className="font-medium mb-4 sm:mb-5 flex items-center gap-2 text-sm sm:text-base" style={{ color: theme.text }}>
              <User className="h-4 w-4" style={{ color: theme.textMuted }} />
              Contact Information
            </h3>
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs sm:text-sm mb-1.5" style={{ color: theme.textMuted }}>Contact Name</label>
                <input type="text" value={formData.contact_name} onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))} readOnly={demoMode} className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs sm:text-sm mb-1.5" style={{ color: theme.textMuted }}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textMuted }} />
                  <input type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} readOnly={demoMode} className="w-full rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-sm focus:outline-none" style={inputStyle} />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div 
            className="rounded-xl p-4 sm:p-6"
            style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
          >
            <h3 className="font-medium mb-4 sm:mb-5 flex items-center gap-2 text-sm sm:text-base" style={{ color: theme.text }}>
              <FileText className="h-4 w-4" style={{ color: theme.textMuted }} />
              Internal Notes
            </h3>
            <textarea value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} readOnly={demoMode} placeholder="Add notes about this lead..." rows={4} className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm resize-none focus:outline-none" style={inputStyle} />
          </div>

          {/* Activity Log */}
          {!demoMode && agency && lead && (
            <ActivityLog 
              key={activityKey}
              agencyId={agency.id} 
              entityType="lead" 
              entityId={lead.id} 
            />
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-4 sm:space-y-6">
          {/* Lead Status & Source */}
          <div 
            className="rounded-xl p-4 sm:p-6"
            style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
          >
            <h3 className="font-medium mb-4 sm:mb-5 flex items-center gap-2 text-sm sm:text-base" style={{ color: theme.text }}>
              <Tag className="h-4 w-4" style={{ color: theme.textMuted }} />
              Lead Details
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm mb-1.5" style={{ color: theme.textMuted }}>Status</label>
                <select value={formData.status} onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))} disabled={demoMode} className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:outline-none" style={inputStyle}>
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm mb-1.5" style={{ color: theme.textMuted }}>Source</label>
                <select value={formData.source} onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))} disabled={demoMode} className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:outline-none" style={inputStyle}>
                  <option value="">Select source</option>
                  {SOURCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Deal Value & Follow-up */}
          <div 
            className="rounded-xl p-4 sm:p-6"
            style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
          >
            <h3 className="font-medium mb-4 sm:mb-5 flex items-center gap-2 text-sm sm:text-base" style={{ color: theme.text }}>
              <DollarSign className="h-4 w-4" style={{ color: theme.textMuted }} />
              Deal Info
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm mb-1.5" style={{ color: theme.textMuted }}>Estimated Value ($/mo)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textMuted }} />
                  <input type="number" value={formData.estimated_value} onChange={(e) => setFormData(prev => ({ ...prev, estimated_value: e.target.value }))} readOnly={demoMode} placeholder="99" className="w-full rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-sm focus:outline-none" style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm mb-1.5" style={{ color: theme.textMuted }}>
                  Scheduled Follow-up
                  <span className="ml-1 text-[10px]" style={{ color: theme.textMuted }}>(optional)</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textMuted }} />
                  <input type="date" value={formData.next_follow_up} onChange={(e) => setFormData(prev => ({ ...prev, next_follow_up: e.target.value }))} readOnly={demoMode} className="w-full rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-sm focus:outline-none" style={inputStyle} />
                </div>
                <p className="text-[10px] mt-1" style={{ color: theme.textMuted }}>
                  Set a reminder date for manual follow-up
                </p>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div 
            className="rounded-xl p-4 sm:p-6"
            style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
          >
            <h3 className="font-medium mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base" style={{ color: theme.text }}>
              <Clock className="h-4 w-4" style={{ color: theme.textMuted }} />
              Timestamps
            </h3>
            <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span style={{ color: theme.textMuted }}>Created</span>
                <span style={{ color: theme.text }}>{lead?.created_at ? new Date(lead.created_at).toLocaleString() : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: theme.textMuted }}>Last Updated</span>
                <span style={{ color: theme.text }}>{lead?.updated_at ? new Date(lead.updated_at).toLocaleString() : '—'}</span>
              </div>
              {outreach?.last_outreach && (
                <div className="flex justify-between">
                  <span style={{ color: theme.textMuted }}>Last Outreach</span>
                  <span style={{ color: theme.text }}>{new Date(outreach.last_outreach.sent_at).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Composer Modal */}
      {agency && lead && (
        <ComposerModal
          isOpen={composerOpen}
          onClose={() => setComposerOpen(false)}
          agencyId={agency.id}
          lead={{
            ...lead,
            email: formData.email,
            phone: formData.phone,
          }}
          type={composerType}
          onSent={handleOutreachSent}
        />
      )}

      {/* Call Script Modal */}
      {agency && lead && (
        <CallScriptModal
          isOpen={callScriptOpen}
          onClose={() => setCallScriptOpen(false)}
          agencyId={agency.id}
          lead={{
            ...lead,
            email: formData.email,
            phone: formData.phone,
          }}
          onSent={handleOutreachSent}
        />
      )}
    </div>
  );
}
