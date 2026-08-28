'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, Search, Plus, ChevronRight, Loader2, ArrowUpRight,
  Target, Phone, Mail, Calendar, DollarSign, TrendingUp,
  ExternalLink, BookOpen, Lightbulb, Filter, AlertCircle, X, Lock,
  CheckCircle2, FileSpreadsheet
} from 'lucide-react';
import { useAgency } from '../context';
import LockedFeatureOverlay from '@/components/LockedFeature';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { useTheme } from '../../../hooks/useTheme';
import { getDemoLeads, getDemoLeadStats } from '../demoData';
import CSVImportModal from '@/components/CSVImportModal';

interface Lead {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  industry: string;
  source: string;
  status: string;
  estimated_value: number;
  next_follow_up: string | null;
  created_at: string;
}

interface LeadStats {
  total: number;
  new: number;
  contacted: number;
  qualified: number;
  proposal: number;
  won: number;
  lost: number;
  totalEstimatedValue: number;
  followUpsToday: number;
  overdueFollowUps: number;
}

interface FollowUpItem {
  lead_id: string;
  business_name: string;
  contact_name: string;
  next_type: string;
  next_template_name: string;
  next_sequence_order: number;
  due_date: string;
  urgency: 'overdue' | 'due_today' | 'upcoming';
  days_overdue: number;
}

const LEAD_TIPS = [
  {
    title: 'How to Find Leads on Google Maps',
    description: 'Free method to find 50+ qualified leads per hour.',
    url: '/blog/how-to-find-leads-google-maps',
    category: 'Prospecting',
  },
  {
    title: 'How to Pitch AI Receptionists',
    description: 'Pain points, ROI arguments, and objection handling.',
    url: '/blog/pitch-ai-receptionists-home-services',
    category: 'Sales',
  },
  {
    title: '5 Cold Outreach Templates',
    description: 'Email templates with 10-15% reply rates.',
    url: '/blog/cold-outreach-templates-that-work',
    category: 'Outreach',
  },
];

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function isOverdue(dateStr: string): boolean {
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

type FilterMode = 'all' | 'follow-up-today' | 'overdue' | 'active' | 'sequence-due';

export default function AgencyLeadsPage() {
  const { agency, loading: contextLoading, demoMode } = useAgency();
  const theme = useTheme();
  const { canUseLeadFinder } = usePlanFeatures();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [showTips, setShowTips] = useState(true);
  const [showCSVImport, setShowCSVImport] = useState(false);

  // Follow-up queue (sequence-based)
  const [followUpQueue, setFollowUpQueue] = useState<FollowUpItem[]>([]);
  const [followUpSummary, setFollowUpSummary] = useState<{ overdue: number; due_today: number; upcoming: number; total: number } | null>(null);

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

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new: 'New',
      contacted: 'Contacted',
      qualified: 'Qualified',
      proposal: 'Proposal',
      won: 'Won',
      lost: 'Lost',
    };
    return labels[status] || status;
  };

  useEffect(() => {
    if (!agency) return;

    if (demoMode) {
      setLeads(getDemoLeads() as Lead[]);
      setStats(getDemoLeadStats() as LeadStats);
      setLoading(false);
      return;
    }

    fetchLeads();
    fetchFollowUpQueue();
  }, [agency, demoMode]);

  const fetchLeads = async () => {
    if (!agency) return;

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/leads`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads || []);
        
        const allLeads = data.leads || [];
        
        const calculatedStats: LeadStats = {
          total: allLeads.length,
          new: allLeads.filter((l: Lead) => l.status === 'new').length,
          contacted: allLeads.filter((l: Lead) => l.status === 'contacted').length,
          qualified: allLeads.filter((l: Lead) => l.status === 'qualified').length,
          proposal: allLeads.filter((l: Lead) => l.status === 'proposal').length,
          won: allLeads.filter((l: Lead) => l.status === 'won').length,
          lost: allLeads.filter((l: Lead) => l.status === 'lost').length,
          totalEstimatedValue: allLeads
            .filter((l: Lead) => l.status !== 'lost')
            .reduce((sum: number, l: Lead) => sum + (l.estimated_value || 0), 0),
          followUpsToday: allLeads.filter((l: Lead) => {
            if (!l.next_follow_up) return false;
            return isToday(l.next_follow_up);
          }).length,
          overdueFollowUps: allLeads.filter((l: Lead) => {
            if (!l.next_follow_up) return false;
            if (['won', 'lost'].includes(l.status)) return false;
            return isOverdue(l.next_follow_up);
          }).length,
        };
        
        setStats(calculatedStats);
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowUpQueue = async () => {
    if (!agency || demoMode) return;

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/leads/follow-up-queue`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setFollowUpQueue(data.queue || []);
        setFollowUpSummary(data.summary || null);
      }
    } catch (error) {
      console.error('Failed to fetch follow-up queue:', error);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchQuery || 
      lead.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || lead.status === statusFilter;
    
    let matchesFilterMode = true;
    if (filterMode === 'follow-up-today') {
      matchesFilterMode = lead.next_follow_up ? isToday(lead.next_follow_up) : false;
    } else if (filterMode === 'overdue') {
      matchesFilterMode = lead.next_follow_up ? isOverdue(lead.next_follow_up) && !['won', 'lost'].includes(lead.status) : false;
    } else if (filterMode === 'active') {
      matchesFilterMode = !['won', 'lost'].includes(lead.status);
    } else if (filterMode === 'sequence-due') {
      matchesFilterMode = followUpQueue.some(q => q.lead_id === lead.id);
    }
    
    return matchesSearch && matchesStatus && matchesFilterMode;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter(null);
    setFilterMode('all');
  };

  const handleStatClick = (mode: FilterMode) => {
    setFilterMode(mode);
    setStatusFilter(null);
  };

  if (contextLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.primary }} />
      </div>
    );
  }

  const hasActiveFilters = searchQuery || statusFilter || filterMode !== 'all';

  if (!canUseLeadFinder) {
    return (
      <LockedFeatureOverlay
        title="Lead Generation"
        description="Find local businesses on Google Maps, run outreach sequences with conversion-tested templates, and track your entire pipeline from one dashboard."
        requiredPlan="Pro"
        features={[
          'Google Maps business prospecting',
          '13 email + SMS outreach templates',
          'Visual pipeline with follow-up tracking',
          'CSV import and export',
        ]}
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Placeholder preview content */}
          <div className="mb-8">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Leads</h1>
            <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>0 total leads</p>
          </div>
          <div className="grid gap-2 sm:gap-4 grid-cols-2 lg:grid-cols-5 mb-8">
            {['Active', 'Qualified', 'Pipeline', 'Sequence Due', 'Today'].map((label) => (
              <div key={label} className="rounded-xl p-3 sm:p-5" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                <p className="text-[10px] sm:text-sm" style={{ color: theme.textMuted }}>{label}</p>
                <p className="text-lg sm:text-xl font-semibold" style={{ color: theme.text }}>0</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl py-20 text-center" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
            <p className="font-medium" style={{ color: theme.textMuted }}>Start building your pipeline</p>
          </div>
        </div>
      </LockedFeatureOverlay>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Leads</h1>
            <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
              {stats?.total || 0} total leads
              {stats && stats.overdueFollowUps > 0 && (
                <span className="ml-2" style={{ color: theme.warning }}>
                  {stats.overdueFollowUps} overdue
                </span>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              href="/agency/leads/finder"
              prefetch={false}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
              style={{ backgroundColor: theme.primary, color: theme.primaryText }}
            >
              <Search className="h-4 w-4" />
              Find Leads
            </Link>

            <button
              onClick={() => setShowCSVImport(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6',
                border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
                color: theme.isDark ? 'rgba(250,250,249,0.7)' : '#374151',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6'}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Import CSV
            </button>

            <Link
              href="/agency/leads/new"
              prefetch={false}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6',
                border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
                color: theme.isDark ? 'rgba(250,250,249,0.7)' : '#374151',
              }}
            >
              <Plus className="h-4 w-4" />
              Add Lead
            </Link>
          </div>
        </div>
      </div>

      {/* Overdue Alert Banner */}
      {stats && stats.overdueFollowUps > 0 && filterMode !== 'overdue' && (
        <button
          onClick={() => handleStatClick('overdue')}
          className="w-full mb-4 sm:mb-6 rounded-xl p-3 sm:p-4 flex items-center justify-between transition-colors text-left"
          style={{
            backgroundColor: theme.warningBg,
            border: `1px solid ${theme.warningBorder}`,
          }}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" style={{ color: theme.warning }} />
            <div>
              <p className="font-medium text-sm" style={{ color: theme.warningText }}>
                {stats.overdueFollowUps} overdue follow-up{stats.overdueFollowUps > 1 ? 's' : ''}
              </p>
              <p className="text-xs hidden sm:block" style={{ color: theme.textMuted }}>Click to view leads that need attention</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" style={{ color: theme.warning }} />
        </button>
      )}

      {/* Tips Section */}
      {showTips && !hasActiveFilters && (
        <div 
          className="mb-6 sm:mb-8 rounded-xl overflow-hidden"
          style={{ 
            backgroundColor: theme.isDark ? 'rgba(168,85,247,0.08)' : 'rgba(168,85,247,0.05)',
            border: `1px solid ${theme.border}`,
          }}
        >
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
            <div className="flex items-center gap-2 sm:gap-3">
              <div 
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg flex-shrink-0"
                style={{ backgroundColor: 'rgba(168,85,247,0.2)' }}
              >
                <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-medium text-sm" style={{ color: theme.text }}>Lead Generation Tips</h3>
                <p className="text-xs hidden sm:block" style={{ color: theme.textMuted }}>Guides to grow your pipeline</p>
              </div>
            </div>
            <button
              onClick={() => setShowTips(false)}
              className="text-xs transition-colors"
              style={{ color: theme.textMuted }}
            >
              Hide
            </button>
          </div>
          <div className="grid gap-2 sm:gap-3 p-3 sm:p-5 sm:grid-cols-3">
            {LEAD_TIPS.map((tip, index) => (
              <a
                key={index}
                href={tip.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-lg p-3 sm:p-4 transition-colors"
                style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.card}
              >
                <div className="flex items-start justify-between gap-2 mb-1 sm:mb-2">
                  <span 
                    className="text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded"
                    style={{ backgroundColor: 'rgba(168,85,247,0.1)', color: theme.isDark ? '#a78bfa' : '#7c3aed' }}
                  >
                    {tip.category}
                  </span>
                  <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0 transition-colors" style={{ color: theme.textMuted }} />
                </div>
                <h4 className="font-medium text-xs sm:text-sm mb-0.5 sm:mb-1 line-clamp-2" style={{ color: theme.text }}>{tip.title}</h4>
                <p className="text-[10px] sm:text-xs line-clamp-2 hidden sm:block" style={{ color: theme.textMuted }}>{tip.description}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      {stats && stats.total > 0 && (
        <div className="grid gap-2 sm:gap-4 grid-cols-2 lg:grid-cols-5 mb-4 sm:mb-8">
          {/* Active Leads */}
          <button
            onClick={() => handleStatClick('active')}
            className="rounded-xl p-3 sm:p-5 text-left transition-all"
            style={filterMode === 'active' ? {
              backgroundColor: theme.infoBg,
              border: `1px solid ${theme.info}`,
            } : {
              backgroundColor: theme.card,
              border: `1px solid ${theme.border}`,
            }}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div 
                className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg flex-shrink-0"
                style={{ backgroundColor: theme.infoBg }}
              >
                <Target className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: theme.info }} />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm" style={{ color: theme.textMuted }}>Active</p>
                <p className="text-lg sm:text-xl font-semibold" style={{ color: theme.text }}>
                  {stats.total - stats.won - stats.lost}
                </p>
              </div>
            </div>
          </button>
          
          {/* Qualified */}
          <button
            onClick={() => {
              setFilterMode('all');
              setStatusFilter(statusFilter === 'qualified' ? null : 'qualified');
            }}
            className="rounded-xl p-3 sm:p-5 text-left transition-all"
            style={statusFilter === 'qualified' ? {
              backgroundColor: 'rgba(168,85,247,0.1)',
              border: '1px solid rgba(168,85,247,0.5)',
            } : {
              backgroundColor: theme.card,
              border: `1px solid ${theme.border}`,
            }}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div 
                className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg flex-shrink-0"
                style={{ backgroundColor: 'rgba(168,85,247,0.1)' }}
              >
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: theme.isDark ? '#a78bfa' : '#7c3aed' }} />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm" style={{ color: theme.textMuted }}>Qualified</p>
                <p className="text-lg sm:text-xl font-semibold" style={{ color: theme.text }}>{stats.qualified + stats.proposal}</p>
              </div>
            </div>
          </button>
          
          {/* Pipeline Value */}
          <div 
            className="rounded-xl p-3 sm:p-5"
            style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div 
                className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg flex-shrink-0"
                style={{ backgroundColor: theme.primary15 }}
              >
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: theme.primary }} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-sm" style={{ color: theme.textMuted }}>Pipeline</p>
                <p className="text-lg sm:text-xl font-semibold truncate" style={{ color: theme.text }}>
                  {formatCurrency(stats.totalEstimatedValue)}
                </p>
              </div>
            </div>
          </div>

          {/* Sequence Follow-ups Due */}
          {followUpSummary && followUpSummary.total > 0 && (
            <button
              onClick={() => handleStatClick('sequence-due')}
              className="rounded-xl p-3 sm:p-5 text-left transition-all"
              style={filterMode === 'sequence-due' ? {
                backgroundColor: 'rgba(168,85,247,0.1)',
                border: '1px solid rgba(168,85,247,0.5)',
              } : {
                backgroundColor: theme.card,
                border: `1px solid ${theme.border}`,
              }}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div 
                  className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg flex-shrink-0"
                  style={{ backgroundColor: followUpSummary.overdue > 0 ? theme.errorBg : 'rgba(168,85,247,0.1)' }}
                >
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: followUpSummary.overdue > 0 ? theme.error : (theme.isDark ? '#a78bfa' : '#7c3aed') }} />
                </div>
                <div>
                  <p className="text-[10px] sm:text-sm" style={{ color: theme.textMuted }}>Sequence Due</p>
                  <p className="text-lg sm:text-xl font-semibold" style={{ color: theme.text }}>{followUpSummary.total}</p>
                </div>
              </div>
            </button>
          )}
          
          {/* Follow-ups Today */}
          <button
            onClick={() => handleStatClick('follow-up-today')}
            className="rounded-xl p-3 sm:p-5 text-left transition-all"
            style={filterMode === 'follow-up-today' ? {
              backgroundColor: theme.warningBg,
              border: `1px solid ${theme.warning}`,
            } : {
              backgroundColor: theme.card,
              border: `1px solid ${theme.border}`,
            }}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div 
                className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg flex-shrink-0"
                style={{ backgroundColor: theme.warningBg }}
              >
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: theme.warning }} />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm" style={{ color: theme.textMuted }}>Today</p>
                <p className="text-lg sm:text-xl font-semibold" style={{ color: theme.text }}>{stats.followUpsToday}</p>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Active Filter Indicator */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 mb-3 sm:mb-4 flex-wrap">
          <span className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>Filtering:</span>
          
          {filterMode === 'follow-up-today' && (
            <span 
              className="inline-flex items-center gap-1 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium"
              style={{ backgroundColor: theme.warningBg, border: `1px solid ${theme.warningBorder}`, color: theme.warning }}
            >
              <Calendar className="h-3 w-3" />
              Today
            </span>
          )}
          
          {filterMode === 'overdue' && (
            <span 
              className="inline-flex items-center gap-1 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium"
              style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}`, color: theme.error }}
            >
              <AlertCircle className="h-3 w-3" />
              Overdue
            </span>
          )}
          
          {filterMode === 'active' && (
            <span 
              className="inline-flex items-center gap-1 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium"
              style={{ backgroundColor: theme.infoBg, border: `1px solid ${theme.infoBorder}`, color: theme.info }}
            >
              <Target className="h-3 w-3" />
              Active
            </span>
          )}

          {filterMode === 'sequence-due' && (
            <span 
              className="inline-flex items-center gap-1 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium"
              style={{ backgroundColor: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', color: theme.isDark ? '#a78bfa' : '#7c3aed' }}
            >
              <Mail className="h-3 w-3" />
              Sequence Due
            </span>
          )}
          
          {statusFilter && (
            <span 
              className="inline-flex items-center gap-1 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium"
              style={{ 
                backgroundColor: getStatusStyle(statusFilter).bg,
                border: `1px solid ${getStatusStyle(statusFilter).border}`,
                color: getStatusStyle(statusFilter).text,
              }}
            >
              {getStatusLabel(statusFilter)}
            </span>
          )}
          
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-xs transition-colors ml-1"
            style={{ color: theme.textMuted }}
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textMuted }} />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm transition-colors focus:outline-none"
            style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={statusFilter || ''}
            onChange={(e) => {
              setStatusFilter(e.target.value || null);
              if (e.target.value) setFilterMode('all');
            }}
            className="flex-1 sm:flex-none rounded-xl px-3 sm:px-4 py-2.5 text-sm focus:outline-none transition-colors"
            style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.isDark ? 'rgba(250,250,249,0.7)' : '#374151' }}
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="proposal">Proposal</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>

          {!showTips && (
            <button
              onClick={() => setShowTips(true)}
              className="flex items-center justify-center rounded-xl px-3 py-2.5 transition-colors"
              style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.isDark ? 'rgba(250,250,249,0.7)' : '#374151' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.input}
            >
              <BookOpen className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Leads List */}
      <div 
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
      >
        {filteredLeads.length === 0 ? (
          <div className="py-12 sm:py-20 text-center px-4">
            <div 
              className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: theme.primary15 }}
            >
              {hasActiveFilters ? (
                <Filter className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: theme.primary, opacity: 0.8 }} />
              ) : (
                <Target className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: theme.primary, opacity: 0.8 }} />
              )}
            </div>
            <p className="mt-4 font-medium text-sm sm:text-base" style={{ color: theme.text, opacity: 0.7 }}>
              {hasActiveFilters ? 'No leads match your filters' : 'No leads yet'}
            </p>
            <p className="text-xs sm:text-sm mt-1 mb-4" style={{ color: theme.textMuted }}>
              {hasActiveFilters 
                ? 'Try adjusting your filters' 
                : 'Start building your pipeline'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors"
                style={{ border: `1px solid ${theme.inputBorder}`, color: theme.isDark ? 'rgba(250,250,249,0.7)' : '#374151' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X className="h-4 w-4" />
                Clear Filters
              </button>
            ) : (
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link
                  href="/agency/leads/finder"
                  prefetch={false}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors"
                  style={{ backgroundColor: theme.primary, color: theme.primaryText }}
                >
                  <Search className="h-4 w-4" />
                  Find Leads
                </Link>
                <Link
                  href="/agency/leads/new"
                  prefetch={false}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors"
                  style={{ border: `1px solid ${theme.inputBorder}`, color: theme.isDark ? 'rgba(250,250,249,0.7)' : '#374151' }}
                >
                  <Plus className="h-4 w-4" />
                  Add Lead
                </Link>
                <button
                  onClick={() => setShowCSVImport(true)}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors"
                  style={{ border: `1px solid ${theme.inputBorder}`, color: theme.isDark ? 'rgba(250,250,249,0.7)' : '#374151' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Import CSV
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Table Header - Desktop */}
            <div 
              className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 text-xs font-medium uppercase tracking-wide"
              style={{ color: theme.textMuted, borderBottom: `1px solid ${theme.border}` }}
            >
              <div className="col-span-3">Business</div>
              <div className="col-span-2">Contact</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Value</div>
              <div className="col-span-2">Follow-up</div>
              <div className="col-span-1"></div>
            </div>
            
            {/* Table Rows */}
            <div>
              {filteredLeads.map((lead, idx) => {
                const followUpToday = lead.next_follow_up && isToday(lead.next_follow_up);
                const followUpOverdue = lead.next_follow_up && isOverdue(lead.next_follow_up) && !['won', 'lost'].includes(lead.status);
                const statusStyle = getStatusStyle(lead.status);
                const queueItem = followUpQueue.find(q => q.lead_id === lead.id);
                
                return (
                  <Link
                    key={lead.id}
                    href={`/agency/leads/${lead.id}`}
                    prefetch={false}
                    className="block px-4 sm:px-6 py-3 sm:py-4 transition-colors"
                    style={{ 
                      borderBottom: idx < filteredLeads.length - 1 ? `1px solid ${theme.borderSubtle}` : 'none',
                      backgroundColor: followUpOverdue ? (theme.isDark ? 'rgba(239,68,68,0.03)' : 'rgba(239,68,68,0.02)') : 'transparent',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = followUpOverdue ? (theme.isDark ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.04)') : theme.hover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = followUpOverdue ? (theme.isDark ? 'rgba(239,68,68,0.03)' : 'rgba(239,68,68,0.02)') : 'transparent'}
                  >
                    {/* Mobile Layout */}
                    <div className="lg:hidden">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div 
                            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg flex-shrink-0"
                            style={{ backgroundColor: theme.infoBg }}
                          >
                            <span className="text-xs sm:text-sm font-medium" style={{ color: theme.info }}>
                              {lead.business_name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate" style={{ color: theme.text }}>{lead.business_name}</p>
                            <p className="text-xs truncate" style={{ color: theme.textMuted }}>{lead.contact_name || 'No contact'}</p>
                          </div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 flex-shrink-0" style={{ color: theme.textMuted }} />
                      </div>
                      <div className="flex items-center justify-between text-xs sm:text-sm pl-11 sm:pl-[52px]">
                        <div className="flex items-center gap-2">
                          <span 
                            className="rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-medium"
                            style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                          >
                            {getStatusLabel(lead.status)}
                          </span>
                          {followUpOverdue && (
                            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: theme.error }} />
                          )}
                          {followUpToday && !followUpOverdue && (
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: theme.warning }} />
                          )}
                          {!followUpOverdue && !followUpToday && queueItem && (
                            <Mail className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: queueItem.urgency === 'overdue' ? theme.error : (theme.isDark ? '#a78bfa' : '#7c3aed') }} />
                          )}
                        </div>
                        <span style={{ color: theme.textMuted }}>
                          {lead.estimated_value ? formatCurrency(lead.estimated_value) : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center">
                      <div className="col-span-3 flex items-center gap-3">
                        <div 
                          className="flex h-10 w-10 items-center justify-center rounded-lg"
                          style={{ backgroundColor: theme.infoBg }}
                        >
                          <span className="text-sm font-medium" style={{ color: theme.info }}>
                            {lead.business_name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate" style={{ color: theme.text }}>{lead.business_name}</p>
                          <p className="text-sm capitalize truncate" style={{ color: theme.textMuted }}>{lead.industry || 'No industry'}</p>
                        </div>
                      </div>
                      
                      <div className="col-span-2 min-w-0">
                        <p className="text-sm truncate" style={{ color: theme.text }}>{lead.contact_name || '—'}</p>
                        <p className="text-xs truncate" style={{ color: theme.textMuted }}>{lead.email || '—'}</p>
                      </div>
                      
                      <div className="col-span-2">
                        <span 
                          className="inline-flex rounded-full px-3 py-1 text-xs font-medium"
                          style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                        >
                          {getStatusLabel(lead.status)}
                        </span>
                      </div>
                      
                      <div className="col-span-2">
                        <p className="text-sm" style={{ color: theme.text }}>
                          {lead.estimated_value ? formatCurrency(lead.estimated_value) : '—'}
                        </p>
                        {lead.estimated_value && (
                          <p className="text-xs" style={{ color: theme.textMuted }}>/month</p>
                        )}
                      </div>
                      
                      <div className="col-span-2">
                        {lead.next_follow_up ? (
                          <div className="flex items-center gap-2">
                            {followUpOverdue && (
                              <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: theme.error }} />
                            )}
                            {followUpToday && !followUpOverdue && (
                              <Calendar className="h-4 w-4 flex-shrink-0" style={{ color: theme.warning }} />
                            )}
                            <div>
                              <p 
                                className="text-sm"
                                style={{ color: followUpOverdue ? theme.error : followUpToday ? theme.warning : theme.text }}
                              >
                                {new Date(lead.next_follow_up).toLocaleDateString()}
                              </p>
                              {followUpOverdue && (
                                <p className="text-xs" style={{ color: theme.error }}>Overdue</p>
                              )}
                              {followUpToday && !followUpOverdue && (
                                <p className="text-xs" style={{ color: theme.warning }}>Today</p>
                              )}
                            </div>
                          </div>
                        ) : queueItem ? (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 flex-shrink-0" style={{ color: queueItem.urgency === 'overdue' ? theme.error : (theme.isDark ? '#a78bfa' : '#7c3aed') }} />
                            <div>
                              <p className="text-sm truncate" style={{ color: queueItem.urgency === 'overdue' ? theme.error : (theme.isDark ? '#a78bfa' : '#7c3aed') }}>
                                {queueItem.next_template_name}
                              </p>
                              <p className="text-xs" style={{ color: queueItem.urgency === 'overdue' ? theme.error : theme.textMuted }}>
                                {queueItem.urgency === 'overdue' ? `${queueItem.days_overdue}d overdue` : queueItem.urgency === 'due_today' ? 'Due today' : 'Due soon'}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm" style={{ color: theme.textMuted }}>Not set</p>
                        )}
                      </div>
                      
                      <div className="col-span-1 flex justify-end">
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

      {/* CSV Import Modal */}
      {agency && (
        <CSVImportModal
          isOpen={showCSVImport}
          onClose={() => setShowCSVImport(false)}
          agencyId={agency.id}
          onImportComplete={() => { fetchLeads(); fetchFollowUpQueue(); }}
          theme={theme}
        />
      )}
    </div>
  );
}
