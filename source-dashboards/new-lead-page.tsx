'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Loader2, Phone, Mail, Globe, Building2, User,
  Calendar, DollarSign, Tag, FileText, Save
} from 'lucide-react';
import { useAgency } from '../../context';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { useTheme } from '../../../../hooks/useTheme';
import { addDemoLead } from '../../demoData';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal Sent' },
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

function formatWebsiteUrl(url: string): string {
  if (!url || !url.trim()) return '';
  let formatted = url.trim();
  if (!/^https?:\/\//i.test(formatted)) {
    formatted = `https://${formatted}`;
  }
  return formatted;
}

export default function NewLeadPage() {
  const router = useRouter();
  const { agency, loading: contextLoading, demoMode } = useAgency();
  const theme = useTheme();
  const { canUseLeadFinder } = usePlanFeatures();

  if (canUseLeadFinder === false) {
    if (typeof window !== "undefined") window.location.href = "/agency/leads";
    return null;
  }

  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
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

  const handleWebsiteBlur = () => {
    if (formData.website.trim()) {
      setFormData(prev => ({ ...prev, website: formatWebsiteUrl(prev.website) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agency) return;
    
    if (!formData.business_name.trim()) {
      setError('Business name is required');
      return;
    }

    if (demoMode) {
      const newLead = addDemoLead({
        ...formData,
        website: formatWebsiteUrl(formData.website),
        estimated_value: formData.estimated_value
          ? Math.round(parseFloat(formData.estimated_value) * 100)
          : null,
        next_follow_up: formData.next_follow_up || null,
      });
      router.push(`/agency/leads/${newLead.id}`);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const payload = {
        ...formData,
        website: formatWebsiteUrl(formData.website),
        estimated_value: formData.estimated_value 
          ? Math.round(parseFloat(formData.estimated_value) * 100) 
          : null,
        next_follow_up: formData.next_follow_up || null,
      };

      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/leads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create lead');
      }

      const data = await response.json();
      router.push(`/agency/leads/${data.lead.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create lead');
      setSaving(false);
    }
  };

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.primary }} />
      </div>
    );
  }

  const inputStyle = {
    backgroundColor: theme.input,
    border: `1px solid ${theme.inputBorder}`,
    color: theme.text,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Link 
          href="/agency/leads"
          className="inline-flex items-center gap-2 text-sm transition-colors mb-4"
          style={{ color: theme.textMuted }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Leads
        </Link>
        
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Add New Lead</h1>
        <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>Track a potential client in your pipeline</p>
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

      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Left Column - Contact & Business Info */}
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
                  <label className="block text-xs sm:text-sm mb-1.5" style={{ color: theme.textMuted }}>
                    Business Name <span style={{ color: theme.error }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.business_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                    className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:outline-none"
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm mb-1.5" style={{ color: theme.textMuted }}>Industry</label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                    placeholder="e.g., Plumbing, HVAC"
                    className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:outline-none"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm mb-1.5" style={{ color: theme.textMuted }}>Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textMuted }} />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-sm focus:outline-none"
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm mb-1.5" style={{ color: theme.textMuted }}>Website</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textMuted }} />
                    <input
                      type="text"
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      onBlur={handleWebsiteBlur}
                      placeholder="example.com"
                      className="w-full rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-sm focus:outline-none"
                      style={inputStyle}
                    />
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
                  <input
                    type="text"
                    value={formData.contact_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                    className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:outline-none"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm mb-1.5" style={{ color: theme.textMuted }}>Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textMuted }} />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-sm focus:outline-none"
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Initial Notes */}
            <div 
              className="rounded-xl p-4 sm:p-6"
              style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
            >
              <h3 className="font-medium mb-4 sm:mb-5 flex items-center gap-2 text-sm sm:text-base" style={{ color: theme.text }}>
                <FileText className="h-4 w-4" style={{ color: theme.textMuted }} />
                Initial Notes
              </h3>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="How did you find this lead? Any initial impressions..."
                rows={3}
                className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm resize-none focus:outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Right Column - Lead Details */}
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
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:outline-none"
                    style={inputStyle}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm mb-1.5" style={{ color: theme.textMuted }}>Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                    className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:outline-none"
                    style={inputStyle}
                  >
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
                    <input
                      type="number"
                      value={formData.estimated_value}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimated_value: e.target.value }))}
                      placeholder="99"
                      className="w-full rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-sm focus:outline-none"
                      style={inputStyle}
                    />
                  </div>
                  <p className="text-[10px] sm:text-xs mt-1" style={{ color: theme.textMuted }}>Expected monthly revenue</p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm mb-1.5" style={{ color: theme.textMuted }}>Next Follow-up</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textMuted }} />
                    <input
                      type="date"
                      value={formData.next_follow_up}
                      onChange={(e) => setFormData(prev => ({ ...prev, next_follow_up: e.target.value }))}
                      className="w-full rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-sm focus:outline-none"
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: theme.primary, color: theme.primaryText }}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Create Lead
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
