'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Phone, Users, DollarSign, PhoneCall, 
  Settings, LogOut, Copy, ExternalLink,
  TrendingUp, Clock, ChevronRight, Zap, Check,
  Sun, Moon, FlaskConical
} from 'lucide-react';

interface Branding {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  name: string;
}

interface DashboardClientProps {
  branding: Branding;
  user: any;
  agency: any;
  stats: { label: string; value: string; icon: string }[];
  recentClients: any[];
  signupLink: string;
  trialDaysLeft: number | null;
  demoMode?: boolean;
}

// Helper to determine if a color is light
function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

// Darken a color
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

// Lighten a color
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

// Add alpha to hex color
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const iconMap = {
  users: Users,
  dollar: DollarSign,
  phone: PhoneCall,
};

export function DashboardClient({
  branding,
  user,
  agency,
  stats,
  recentClients,
  signupLink,
  trialDaysLeft,
  demoMode = false,
}: DashboardClientProps) {
  const [copied, setCopied] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // Load preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dashboard-theme');
    if (saved) {
      setDarkMode(saved === 'dark');
    }
  }, []);

  // Save preference
  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('dashboard-theme', newMode ? 'dark' : 'light');
  };

  // Theme colors
  const theme = {
    bg: darkMode ? '#0a0a0a' : '#f8f8f6',
    text: darkMode ? '#f5f5f0' : '#1a1a1a',
    textMuted: darkMode ? 'rgba(245, 245, 240, 0.5)' : 'rgba(26, 26, 26, 0.5)',
    textMuted2: darkMode ? 'rgba(245, 245, 240, 0.3)' : 'rgba(26, 26, 26, 0.3)',
    textMuted6: darkMode ? 'rgba(245, 245, 240, 0.6)' : 'rgba(26, 26, 26, 0.6)',
    border: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    cardBg: darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.8)',
    hoverBg: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
  };

  // Generate theme colors from brand primary
  const primaryLight = isLightColor(branding.primaryColor);
  const sidebarBg = darkenColor(branding.primaryColor, 65);
  const sidebarBgDarker = darkenColor(branding.primaryColor, 75);
  const accentBg = hexToRgba(branding.accentColor, 0.1);
  const accentBorder = hexToRgba(branding.accentColor, 0.2);
  const primaryBg = hexToRgba(branding.primaryColor, 0.1);
  const primaryBorder = hexToRgba(branding.primaryColor, 0.2);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(signupLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const navItems = [
    { href: '/agency/dashboard', label: 'Dashboard', icon: TrendingUp, active: true },
    { href: '/agency/clients', label: 'Clients', icon: Users, active: false },
    { href: '/agency/revenue', label: 'Revenue', icon: DollarSign, active: false },
    { href: '/agency/settings', label: 'Settings', icon: Settings, active: false },
  ];

  return (
    <div className="min-h-screen transition-colors duration-200" style={{ backgroundColor: theme.bg, color: theme.text }}>
      {/* Subtle grain overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.015] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Theme Toggle - Top Right */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 p-2.5 rounded-full border transition-all hover:scale-105"
        style={{ 
          backgroundColor: theme.cardBg,
          borderColor: theme.border,
        }}
        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? (
          <Sun className="h-4 w-4" style={{ color: theme.text }} />
        ) : (
          <Moon className="h-4 w-4" style={{ color: theme.text }} />
        )}
      </button>

      {/* Sidebar with brand colors - always dark */}
      <aside 
        className="fixed inset-y-0 left-0 z-40 w-64 border-r transition-colors duration-200"
        style={{ 
          backgroundColor: sidebarBg,
          borderColor: hexToRgba(branding.primaryColor, 0.2),
        }}
      >
        <div 
          className="flex h-16 items-center gap-3 border-b px-6"
          style={{ borderColor: hexToRgba(branding.primaryColor, 0.2) }}
        >
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt={branding.name} className="h-8 w-8 rounded-lg object-contain" />
          ) : (
            <div 
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: branding.primaryColor }}
            >
              <Phone className="h-4 w-4" style={{ color: primaryLight ? '#0a0a0a' : '#f5f5f0' }} />
            </div>
          )}
          <span className="font-medium text-[#f5f5f0] truncate">{branding.name}</span>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: item.active ? hexToRgba(branding.primaryColor, 0.3) : 'transparent',
                color: item.active ? '#f5f5f0' : 'rgba(245, 245, 240, 0.6)',
              }}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div 
          className="absolute bottom-0 left-0 right-0 border-t p-4"
          style={{ borderColor: hexToRgba(branding.primaryColor, 0.2) }}
        >
          <Link
            href="/api/auth/logout"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#f5f5f0]/60 hover:text-[#f5f5f0] transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pl-64">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-medium tracking-tight">
              Welcome back{user.first_name ? `, ${user.first_name}` : ''}! 👋
            </h1>
            <p className="mt-1" style={{ color: theme.textMuted }}>Here&apos;s how your agency is doing.</p>
          </div>

          {/* Trial Banner */}
          {!demoMode && agency.subscription_status === 'trial' && trialDaysLeft !== null && (
            <div 
              className="mb-8 rounded-xl border p-4 flex items-center justify-between"
              style={{ 
                backgroundColor: accentBg,
                borderColor: accentBorder,
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: hexToRgba(branding.accentColor, 0.2) }}
                >
                  <Clock className="h-5 w-5" style={{ color: branding.accentColor }} />
                </div>
                <div>
                  <p className="font-medium" style={{ color: theme.text }}>
                    {trialDaysLeft > 0 ? `${trialDaysLeft} days left in your trial` : 'Your trial has ended'}
                  </p>
                  <p className="text-sm" style={{ color: theme.textMuted }}>Upgrade to keep your agency running.</p>
                </div>
              </div>
              <button 
                className="rounded-full px-4 py-2 text-sm font-medium transition-all hover:opacity-90"
                style={{ 
                  backgroundColor: branding.accentColor,
                  color: isLightColor(branding.accentColor) ? '#0a0a0a' : '#f5f5f0',
                }}
              >
                Upgrade Now
              </button>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            {stats.map((stat, index) => {
              const IconComponent = iconMap[stat.icon as keyof typeof iconMap] || Users;
              const colors = [
                { color: branding.primaryColor, bg: primaryBg },
                { color: branding.accentColor, bg: accentBg },
                { color: branding.secondaryColor, bg: hexToRgba(branding.secondaryColor, 0.1) },
              ];
              const { color, bg } = colors[index % colors.length];
              
              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border p-6 transition-colors"
                  style={{ 
                    borderColor: theme.border,
                    backgroundColor: theme.cardBg,
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="flex h-12 w-12 items-center justify-center rounded-xl"
                      style={{ backgroundColor: bg }}
                    >
                      <IconComponent className="h-6 w-6" style={{ color }} />
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: theme.textMuted }}>{stat.label}</p>
                      <p className="text-2xl font-semibold">{stat.value}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Signup Link Card */}
          <div 
            className="mb-8 rounded-2xl border p-6"
            style={{ 
              borderColor: primaryBorder,
              background: darkMode 
                ? `linear-gradient(135deg, ${hexToRgba(branding.primaryColor, 0.05)} 0%, transparent 50%)`
                : `linear-gradient(135deg, ${hexToRgba(branding.primaryColor, 0.08)} 0%, ${theme.cardBg} 50%)`,
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5" style={{ color: branding.primaryColor }} />
                  <h3 className="font-medium">Client Signup Link</h3>
                </div>
                <p className="text-sm mb-4" style={{ color: theme.textMuted }}>
                  Share this link with potential clients to let them sign up for your AI receptionist service.
                </p>
                <div className="flex items-center gap-3">
                  <div 
                    className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-mono truncate max-w-md"
                    style={{ 
                      borderColor: theme.border,
                      backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      color: theme.textMuted6,
                    }}
                  >
                    {signupLink}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all"
                    style={{ 
                      backgroundColor: branding.primaryColor,
                      color: primaryLight ? '#0a0a0a' : '#f5f5f0',
                    }}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <a
                    href={signupLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors"
                    style={{ 
                      borderColor: theme.border,
                      backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Preview
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Clients */}
          <div 
            className="rounded-2xl border transition-colors"
            style={{ 
              borderColor: theme.border,
              backgroundColor: theme.cardBg,
            }}
          >
            <div 
              className="flex items-center justify-between border-b p-6"
              style={{ borderColor: theme.border }}
            >
              <h3 className="font-medium">Recent Clients</h3>
              <Link 
                href="/agency/clients" 
                className="text-sm font-medium flex items-center gap-1 transition-colors hover:opacity-80"
                style={{ color: branding.accentColor }}
              >
                View All
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            
            {recentClients.length === 0 ? (
              <div className="p-12 text-center">
                <div 
                  className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: primaryBg }}
                >
                  <Users className="h-6 w-6" style={{ color: branding.primaryColor }} />
                </div>
                <p style={{ color: theme.textMuted }}>No clients yet</p>
                <p className="text-sm mt-1" style={{ color: theme.textMuted2 }}>Share your signup link to get started!</p>
              </div>
            ) : (
              <div style={{ borderColor: theme.border }}>
                {recentClients.map((client, index) => {
                  const isTest = client.is_test_client;
                  return (
                    <Link
                      key={client.id}
                      href={`/agency/clients/${client.id}`}
                      className="flex items-center justify-between p-4 transition-colors"
                      style={{ 
                        borderTop: index > 0 ? `1px solid ${theme.border}` : 'none',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium"
                          style={{ 
                            backgroundColor: isTest ? (darkMode ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.1)') : primaryBg,
                            color: isTest ? '#8b5cf6' : branding.primaryColor,
                          }}
                        >
                          {isTest ? (
                            <FlaskConical className="h-4 w-4" />
                          ) : (
                            client.business_name?.charAt(0) || '?'
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium" style={{ color: theme.text }}>{client.business_name}</p>
                            {isTest && (
                              <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: darkMode ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>Test</span>
                            )}
                          </div>
                          <p className="text-sm capitalize" style={{ color: theme.textMuted }}>
                            {isTest ? 'Test client' : `${client.plan_type || 'starter'} plan`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span 
                          className="rounded-full px-2.5 py-1 text-xs font-medium capitalize"
                          style={
                            client.subscription_status === 'active' 
                              ? { backgroundColor: 'rgba(52, 211, 153, 0.1)', color: '#34d399' }
                              : client.subscription_status === 'trial'
                              ? { backgroundColor: accentBg, color: branding.accentColor }
                              : client.subscription_status === 'past_due'
                              ? { backgroundColor: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24' }
                              : { backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: theme.textMuted6 }
                          }
                        >
                          {client.subscription_status || client.status}
                        </span>
                        <ChevronRight className="h-4 w-4" style={{ color: theme.textMuted2 }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
