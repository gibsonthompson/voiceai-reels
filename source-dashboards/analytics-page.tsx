'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, DollarSign, Users, Wallet, CreditCard, 
  ChevronRight, Loader2
} from 'lucide-react';
import { useAgency } from '../context';
import { useTheme } from '../../../hooks/useTheme';
import { DEMO_ANALYTICS } from '../demoData';
import { getCurrencyForCountry } from '@/lib/currency';

interface Stats {
  mrr: number;
  totalEarned: number;
  pendingPayout: number;
  activeClients: number;
  trialClients: number;
  totalClients: number;
}

interface Payment {
  id: string;
  client_id: string;
  amount: number;
  status: string;
  type: string;
  created_at: string;
  paid_out: boolean;
}

interface Client {
  id: string;
  business_name: string;
  plan_type: string;
  subscription_status: string;
}

/**
 * Format cents (USD) into the agency's local currency display.
 * Uses the agency's country to look up currency symbol, rate, and position.
 * All amounts stored in the DB are USD cents — this converts and formats.
 */
function formatCurrency(cents: number, countryCode: string = 'US'): string {
  const currency = getCurrencyForCountry(countryCode);
  const usdDollars = cents / 100;
  const converted = Math.round(usdDollars * currency.rate);

  const formatted = converted.toLocaleString();

  if (currency.symbolPosition === 'before') {
    return `${currency.symbol}${formatted}`;
  } else {
    return `${formatted} ${currency.symbol}`;
  }
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export default function AgencyAnalyticsPage() {
  const { agency, loading: contextLoading, demoMode } = useAgency();
  const theme = useTheme();
  const [stats, setStats] = useState<Stats>({
    mrr: 0,
    totalEarned: 0,
    pendingPayout: 0,
    activeClients: 0,
    trialClients: 0,
    totalClients: 0,
  });
  const [revenueByMonth, setRevenueByMonth] = useState<{ month: string; amount: number }[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Agency's country for currency formatting
  const agencyCountry = agency?.country || 'US';

  useEffect(() => {
    if (!agency) return;

    if (demoMode) {
      setStats(DEMO_ANALYTICS.stats as Stats);
      setRevenueByMonth(DEMO_ANALYTICS.revenueByMonth);
      setPayments(DEMO_ANALYTICS.payments as Payment[]);
      setClients(DEMO_ANALYTICS.clients as Client[]);
      setLoading(false);
      return;
    }

    fetchRevenueData();
  }, [agency, demoMode]);

  const fetchRevenueData = async () => {
    if (!agency) return;

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || stats);
        setRevenueByMonth(data.revenueByMonth || []);
        setPayments(data.payments || []);
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Failed to fetch revenue data:', error);
    } finally {
      setLoading(false);
    }
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

  const maxRevenue = Math.max(...revenueByMonth.map(r => r.amount), 1);

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
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Analytics & Revenue</h1>
        <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>Track your earnings and client metrics.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
        {/* MRR */}
        <div 
          className="rounded-xl p-3 sm:p-5"
          style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
        >
          <div className="flex items-center gap-2 sm:gap-4">
            <div 
              className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl flex-shrink-0"
              style={{ backgroundColor: theme.primary15 }}
            >
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: theme.primary }} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm" style={{ color: theme.textMuted }}>Monthly Recurring</p>
              <p className="text-lg sm:text-2xl font-semibold truncate" style={{ color: theme.text }}>{formatCurrency(stats.mrr, agencyCountry)}</p>
            </div>
          </div>
        </div>

        {/* Total Earned */}
        <div 
          className="rounded-xl p-3 sm:p-5"
          style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
        >
          <div className="flex items-center gap-2 sm:gap-4">
            <div 
              className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl flex-shrink-0"
              style={{ backgroundColor: theme.infoBg }}
            >
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: theme.info }} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm" style={{ color: theme.textMuted }}>Total Earned</p>
              <p className="text-lg sm:text-2xl font-semibold truncate" style={{ color: theme.text }}>{formatCurrency(stats.totalEarned, agencyCountry)}</p>
            </div>
          </div>
        </div>

        {/* Pending Payout */}
        <div 
          className="rounded-xl p-3 sm:p-5"
          style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
        >
          <div className="flex items-center gap-2 sm:gap-4">
            <div 
              className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl flex-shrink-0"
              style={{ backgroundColor: theme.warningBg }}
            >
              <Wallet className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: theme.warning }} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm" style={{ color: theme.textMuted }}>Pending Payout</p>
              <p className="text-lg sm:text-2xl font-semibold truncate" style={{ color: theme.text }}>{formatCurrency(stats.pendingPayout, agencyCountry)}</p>
            </div>
          </div>
        </div>

        {/* Active Clients */}
        <div 
          className="rounded-xl p-3 sm:p-5"
          style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
        >
          <div className="flex items-center gap-2 sm:gap-4">
            <div 
              className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl flex-shrink-0"
              style={{ backgroundColor: 'rgba(168,85,247,0.1)' }}
            >
              <Users className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: theme.isDark ? '#a78bfa' : '#7c3aed' }} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm" style={{ color: theme.textMuted }}>Paying Clients</p>
              <p className="text-lg sm:text-2xl font-semibold" style={{ color: theme.text }}>{stats.activeClients}</p>
              {stats.trialClients > 0 && (
                <p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted }}>+{stats.trialClients} in trial</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <div 
          className="lg:col-span-2 rounded-xl p-4 sm:p-6"
          style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
        >
          <h3 className="font-medium mb-4 sm:mb-6 text-sm sm:text-base" style={{ color: theme.text }}>Revenue Over Time</h3>
          
          {revenueByMonth.length === 0 ? (
            <div className="h-32 sm:h-48 flex items-center justify-center">
              <p className="text-sm" style={{ color: theme.textMuted }}>No revenue data yet</p>
            </div>
          ) : (
            <div className="h-32 sm:h-48">
              <div className="flex items-end justify-between h-full gap-1 sm:gap-2">
                {revenueByMonth.map((item, index) => {
                  const height = maxRevenue > 0 ? (item.amount / maxRevenue) * 100 : 0;
                  return (
                    <div key={item.month} className="flex-1 flex flex-col items-center gap-1 sm:gap-2">
                      <div className="w-full flex flex-col items-center justify-end h-24 sm:h-36">
                        <div 
                          className="w-full max-w-[32px] sm:max-w-[40px] rounded-t-lg transition-all duration-300"
                          style={{ 
                            height: `${Math.max(height, 2)}%`,
                            backgroundColor: theme.primary,
                            opacity: 0.6 + (index / revenueByMonth.length) * 0.4,
                          }}
                          title={formatCurrency(item.amount, agencyCountry)}
                        />
                      </div>
                      <span className="text-[8px] sm:text-xs" style={{ color: theme.textMuted }}>
                        {formatMonth(item.month)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Revenue by Plan */}
        <div 
          className="rounded-xl p-4 sm:p-6"
          style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
        >
          <h3 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base" style={{ color: theme.text }}>Revenue by Plan</h3>
          
          <div className="space-y-3 sm:space-y-4">
            {['starter', 'pro', 'growth'].map((plan) => {
              const planClients = clients.filter(
                c => c.plan_type === plan && c.subscription_status === 'active'
              );
              const planRevenue = planClients.length * getPlanPrice(plan);
              const percentage = stats.mrr > 0 ? (planRevenue / stats.mrr) * 100 : 0;
              
              const planColor = plan === 'starter' 
                ? theme.info
                : plan === 'pro' 
                ? theme.primary
                : (theme.isDark ? '#a78bfa' : '#7c3aed');
              
              return (
                <div key={plan}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs sm:text-sm capitalize" style={{ color: theme.text }}>{plan}</span>
                    <span className="text-xs sm:text-sm font-medium" style={{ color: theme.text }}>{formatCurrency(planRevenue, agencyCountry)}</span>
                  </div>
                  <div 
                    className="h-1.5 sm:h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: theme.border }}
                  >
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: planColor,
                      }}
                    />
                  </div>
                  <p className="text-[10px] sm:text-xs mt-1" style={{ color: theme.textMuted }}>
                    {planClients.length} client{planClients.length !== 1 ? 's' : ''}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div 
        className="mt-4 sm:mt-6 rounded-xl overflow-hidden"
        style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
      >
        <div 
          className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4"
          style={{ borderBottom: `1px solid ${theme.border}` }}
        >
          <h3 className="font-medium text-sm sm:text-base" style={{ color: theme.text }}>Recent Transactions</h3>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div 
              className="mx-auto w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: theme.primary15 }}
            >
              <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: theme.primary, opacity: 0.8 }} />
            </div>
            <p className="text-sm" style={{ color: theme.textMuted }}>No transactions yet</p>
            <p className="text-xs sm:text-sm mt-1" style={{ color: theme.textMuted }}>
              Transactions will appear here when clients pay
            </p>
          </div>
        ) : (
          <div>
            {/* Table Header - Desktop */}
            <div 
              className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium uppercase tracking-wide"
              style={{ color: theme.textMuted, borderBottom: `1px solid ${theme.border}` }}
            >
              <div className="col-span-4">Client</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2 text-right">Date</div>
            </div>

            {/* Table Rows */}
            <div>
              {payments.slice(0, 10).map((payment, idx) => {
                const client = clients.find(c => c.id === payment.client_id);
                const clientName = (payment as any).client_name || client?.business_name || 'Unknown';
                const statusColor = payment.status === 'succeeded' || payment.status === 'paid'
                  ? { bg: theme.successBg, text: theme.success }
                  : payment.status === 'pending'
                  ? { bg: theme.warningBg, text: theme.warning }
                  : { bg: theme.errorBg, text: theme.error };
                
                return (
                  <div
                    key={payment.id}
                    className="px-4 sm:px-6 py-3 sm:py-4"
                    style={{ borderBottom: idx < Math.min(payments.length, 10) - 1 ? `1px solid ${theme.borderSubtle}` : 'none' }}
                  >
                    {/* Mobile layout */}
                    <div className="lg:hidden">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0"
                            style={{ backgroundColor: theme.primary15, color: theme.primary }}
                          >
                            {clientName.charAt(0) || '?'}
                          </div>
                          <span className="truncate text-sm" style={{ color: theme.text }}>{clientName}</span>
                        </div>
                        <span className="font-medium text-sm" style={{ color: theme.text }}>{formatCurrency(payment.amount, agencyCountry)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs sm:text-sm pl-10 sm:pl-11">
                        <span 
                          className="rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-medium capitalize"
                          style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
                        >
                          {payment.status}
                        </span>
                        <span style={{ color: theme.textMuted }}>
                          {new Date(payment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Desktop layout */}
                    <div className="hidden lg:grid lg:grid-cols-12 lg:gap-4 lg:items-center">
                      <div className="col-span-4 flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium"
                          style={{ backgroundColor: theme.primary15, color: theme.primary }}
                        >
                          {clientName.charAt(0) || '?'}
                        </div>
                        <span className="truncate" style={{ color: theme.text }}>{clientName}</span>
                      </div>
                      
                      <div className="col-span-2 font-medium" style={{ color: theme.text }}>
                        {formatCurrency(payment.amount, agencyCountry)}
                      </div>
                      
                      <div className="col-span-2">
                        <span 
                          className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize"
                          style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
                        >
                          {payment.status}
                        </span>
                      </div>
                      
                      <div className="col-span-2 capitalize" style={{ color: theme.textMuted }}>
                        {payment.type || 'subscription'}
                      </div>
                      
                      <div className="col-span-2 text-right" style={{ color: theme.textMuted }}>
                        {new Date(payment.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Stripe Connect Status */}
      {agency && !agency.stripe_account_id && !demoMode && (
        <div 
          className="mt-4 sm:mt-6 rounded-xl p-4 sm:p-6"
          style={{ 
            backgroundColor: theme.warningBg,
            border: `1px solid ${theme.warningBorder}`,
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
              <div 
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: theme.warningBg }}
              >
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: theme.warning }} />
              </div>
              <div>
                <p className="font-medium text-sm sm:text-base" style={{ color: theme.warningText }}>Connect Stripe to receive payouts</p>
                <p className="text-xs sm:text-sm" style={{ color: theme.warningText, opacity: 0.7 }}>
                  Set up Stripe Connect to receive payments from your clients
                </p>
              </div>
            </div>
            <Link
              href="/agency/settings"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors w-full sm:w-auto"
              style={{ backgroundColor: theme.warning, color: '#050505' }}
            >
              Set Up Payments
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
