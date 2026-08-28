"use client";

/**
 * Lead Finder Page v3 — VoiceAI Connect Agency Dashboard
 * Path: app/agency/leads/finder/page.tsx
 * 
 * Two source tabs:
 * - Indeed: Search by job title → finds businesses actively hiring
 * - Google Maps: Search by industry → finds businesses in target verticals
 * 
 * Both flow into the same enrichment → scoring → CRM save pipeline.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@/hooks/useTheme";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { useAgency } from "../../context";
import Link from "next/link";
import {
  ArrowLeft, Search, Download, Phone, Mail, Globe, MapPin,
  Star, ExternalLink, ChevronDown, ChevronUp, Loader2, Target,
  Save, Check, X, Filter, AlertTriangle, CheckSquare, Square,
  Map, Briefcase,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type SourceTab = "indeed" | "google_maps";

// ── Indeed Logo SVG ─────────────────────────────────────────────────────
function IndeedLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#003A9B" />
      <path d="M13.5 4.5c-1.1 0-2 .7-2.4 1.7-.1.3-.2.7-.2 1.1v9.2c0 1.1-.3 2-.8 2.6-.4.5-.9.8-1.5.9h-.1v1h.2c1.3-.1 2.4-.7 3.1-1.7.7-1 1.1-2.3 1.1-3.8V7.3c0-.4.1-.7.2-1 .2-.5.6-.8 1.1-.8.3 0 .5.1.7.3.2.2.3.5.3.8 0 .4-.2.7-.5.9-.2.1-.4.2-.7.2v1.1c.8 0 1.5-.3 2-.8s.8-1.2.8-2c0-.5-.2-1-.5-1.3-.4-.5-.9-.7-1.5-.7h-.3z" fill="white"/>
    </svg>
  );
}

// ── Google Maps Logo SVG ────────────────────────────────────────────────
function GoogleMapsLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#ffffff" />
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#EA4335"/>
      <circle cx="12" cy="9" r="2.5" fill="#B31412"/>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 1.74.56 3.35 1.51 4.67L12 22l5.49-8.33C18.44 12.35 19 10.74 19 9c0-3.87-3.13-7-7-7z" fill="#EA4335" fillOpacity="0.3"/>
      <circle cx="12" cy="9" r="2.5" fill="white"/>
    </svg>
  );
}

// ── Source Badge ─────────────────────────────────────────────────────────
function SourceBadge({ source, theme }: { source: string; theme: any }) {
  if (source === "google_maps") {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
        style={{ background: "#ea433515", color: "#ea4335", border: "1px solid #ea433525" }}>
        <GoogleMapsLogo size={10} /> Maps
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
      style={{ background: "#003a9b15", color: "#003a9b", border: "1px solid #003a9b25" }}>
      <IndeedLogo size={10} /> Indeed
    </span>
  );
}

// ── Fit Score Badge ─────────────────────────────────────────────────────
function FitBadge({ score }: { score: number }) {
  let color: string, label: string;
  if (score >= 70) { color = "#10b981"; label = "Hot Lead"; }
  else if (score >= 50) { color = "#f59e0b"; label = "Warm"; }
  else if (score >= 30) { color = "#6b7280"; label = "Cool"; }
  else { color = "#374151"; label = "Low"; }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {score} — {label}
    </span>
  );
}

// ── Industry Tag ────────────────────────────────────────────────────────
function IndustryTag({ industry }: { industry: string }) {
  const colors: Record<string, string> = {
    Healthcare: "#06b6d4", Dental: "#8b5cf6", Veterinary: "#f97316",
    Legal: "#64748b", "Beauty & Wellness": "#ec4899", "Home Services": "#eab308",
    "Real Estate": "#22c55e", Insurance: "#3b82f6", Automotive: "#ef4444",
    Restaurant: "#f97316", Retail: "#a855f7", Hospitality: "#14b8a6",
    Accounting: "#6366f1", Fitness: "#f43f5e", Storage: "#78716c",
    Other: "#6b7280",
  };
  const color = colors[industry] || "#6b7280";
  return (
    <span className="px-2 py-0.5 rounded text-[11px] font-medium"
      style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
      {industry}
    </span>
  );
}

// ── Progress Bar ────────────────────────────────────────────────────────
function ProgressBar({ progress, theme }: { progress: any; theme: any }) {
  if (!progress) return null;
  return (
    <div className="py-5">
      <div className="flex justify-between mb-2 text-xs" style={{ color: theme.textMuted }}>
        <span>{progress.message}</span>
        {progress.current && progress.total && <span>{progress.current}/{progress.total}</span>}
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: theme.border }}>
        <div className="h-full rounded-full transition-all duration-400"
          style={{ width: `${progress.percent || 0}%`, background: `linear-gradient(90deg, ${theme.primary}, ${theme.primary}cc)` }} />
      </div>
    </div>
  );
}

// ── Stats Row ───────────────────────────────────────────────────────────
function StatsRow({ stats, theme }: { stats: any; theme: any }) {
  if (!stats) return null;
  const items = [
    { label: "Found", value: stats.uniqueCompanies || stats.businessesFound || 0 },
    { label: "Enriched", value: stats.enriched },
    { label: "With Phone", value: stats.withPhone },
    { label: "With Email", value: stats.withEmail },
    { label: "Avg Score", value: stats.avgFitScore },
    { label: "Time", value: `${stats.durationSeconds}s` },
  ];
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 py-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl p-3 text-center"
          style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <div className="text-lg font-bold" style={{ color: theme.text }}>{item.value}</div>
          <div className="text-[10px] mt-0.5" style={{ color: theme.textMuted }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Lead Card ───────────────────────────────────────────────────────────
function LeadCard({ lead, expanded, onToggle, theme, onSave, saving, saved, selected, onSelect }: any) {
  return (
    <div className="rounded-xl p-4 sm:px-5 mb-2 transition-all"
      style={{ background: theme.card, border: `1px solid ${theme.border}` }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${theme.primary}40`; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = theme.border; }}>

      <div className="flex items-center gap-3">
        {/* Checkbox */}
        <button onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className="flex-shrink-0 cursor-pointer" style={{ color: selected ? theme.primary : theme.textMuted }}>
          {selected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
        </button>

        {/* Main content — clickable */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onToggle}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-[180px]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold truncate" style={{ color: theme.text }}>{lead.companyName}</span>
                <SourceBadge source={lead.leadSource} theme={theme} />
              </div>
              <div className="text-xs flex items-center gap-2 flex-wrap" style={{ color: theme.textMuted }}>
                {lead.jobTitle && <span>Hiring: {lead.jobTitle}</span>}
                {lead.jobTitle && lead.jobLocation && <span style={{ color: theme.border }}>•</span>}
                {lead.jobLocation && <span>{lead.jobLocation}</span>}
                {!lead.jobTitle && lead.address && <span>{lead.address}</span>}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <IndustryTag industry={lead.industry} />
              <FitBadge score={lead.fitScore} />
              {lead.phone && (
                <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium no-underline"
                  style={{ background: `${theme.primary}15`, color: theme.primary, border: `1px solid ${theme.primary}25` }}>
                  <Phone className="h-3 w-3" /> {lead.phone}
                </a>
              )}
              {expanded ? <ChevronUp className="h-4 w-4" style={{ color: theme.textMuted }} />
                : <ChevronDown className="h-4 w-4" style={{ color: theme.textMuted }} />}
            </div>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {lead.warnings?.length > 0 && (
        <div className="mt-2 ml-7 flex items-start gap-1.5 text-xs" style={{ color: "#f59e0b" }}>
          <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
          <span>{lead.warnings.join(" • ")}</span>
        </div>
      )}

      {/* Expanded */}
      {expanded && (
        <div className="mt-4 pt-4 ml-7 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm"
          style={{ borderTop: `1px solid ${theme.border}` }}>

          {/* Contact */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>Contact</div>
            {lead.phone && (
              <div className="mb-1 flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 flex-shrink-0" style={{ color: theme.primary }} />
                <a href={`tel:${lead.phone}`} className="no-underline" style={{ color: theme.primary }}>{lead.phone}</a>
              </div>
            )}
            {lead.email && (
              <div className="mb-1 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 flex-shrink-0" style={{ color: theme.primary }} />
                <a href={`mailto:${lead.email}`} className="no-underline truncate" style={{ color: theme.primary }}>{lead.email}</a>
              </div>
            )}
            {lead.website && (
              <div className="mb-1 flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 flex-shrink-0" style={{ color: theme.primary }} />
                <a href={lead.website} target="_blank" rel="noopener" className="no-underline truncate" style={{ color: theme.primary }}>
                  {lead.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              </div>
            )}
            {lead.address && (
              <div className="mb-1 flex items-center gap-2 text-xs" style={{ color: theme.textMuted }}>
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" /> {lead.address}
              </div>
            )}
            {lead.googleMapsUrl && (
              <a href={lead.googleMapsUrl} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}
                className="text-[11px] underline mt-1 inline-flex items-center gap-1" style={{ color: theme.textMuted }}>
                Google Maps <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          {/* Business Intel */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>Business</div>
            {lead.rating && (
              <div className="mb-1 flex items-center gap-2 text-xs" style={{ color: theme.text }}>
                <Star className="h-3.5 w-3.5 flex-shrink-0 fill-yellow-500 text-yellow-500" />
                {lead.rating} ({lead.reviewCount} reviews)
              </div>
            )}
            {lead.businessStatus && (
              <div className="mb-1 text-xs" style={{ color: lead.businessStatus === "OPERATIONAL" ? "#10b981" : "#ef4444" }}>
                {lead.businessStatus === "OPERATIONAL" ? "✓ " : "⚠ "}{lead.businessStatus}
              </div>
            )}
            {lead.techStack?.length > 0 && (
              <div className="mb-1 text-xs" style={{ color: theme.textMuted }}>Tech: {lead.techStack.join(", ")}</div>
            )}
            {lead.jobSalary && <div className="mb-1 text-xs" style={{ color: theme.textMuted }}>Salary: {lead.jobSalary}</div>}
            {lead.jobSnippet && (
              <div className="text-xs mt-2 leading-relaxed italic" style={{ color: theme.textMuted }}>
                &ldquo;{lead.jobSnippet}&rdquo;
              </div>
            )}
          </div>

          {/* Social + Save */}
          <div>
            {Object.keys(lead.socialLinks || {}).length > 0 && (
              <>
                <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>Social</div>
                {Object.entries(lead.socialLinks).map(([platform, url]) => (
                  <a key={platform} href={url as string} target="_blank" rel="noopener"
                    onClick={(e) => e.stopPropagation()}
                    className="block mb-1 text-xs capitalize no-underline hover:underline" style={{ color: theme.textMuted }}>
                    {platform} →
                  </a>
                ))}
              </>
            )}
            <button onClick={(e) => { e.stopPropagation(); onSave(lead); }}
              disabled={saving || saved}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all"
              style={{
                background: saved ? `${theme.primary}15` : theme.primary,
                color: saved ? theme.primary : theme.primaryText,
                border: saved ? `1px solid ${theme.primary}30` : "none",
                opacity: saving ? 0.6 : 1,
                cursor: saving || saved ? "default" : "pointer",
              }}>
              {saved ? <><Check className="h-3.5 w-3.5" /> Saved to CRM</>
                : saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</>
                : <><Save className="h-3.5 w-3.5" /> Save to CRM</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Google Maps Industry Presets ─────────────────────────────────────────
const MAPS_INDUSTRIES = [
  { value: "dental", label: "Dental" },
  { value: "medical", label: "Medical / Clinics" },
  { value: "veterinary", label: "Veterinary" },
  { value: "legal", label: "Legal / Law Firms" },
  { value: "home_services", label: "Home Services" },
  { value: "plumbing", label: "Plumbing" },
  { value: "hvac", label: "HVAC" },
  { value: "roofing", label: "Roofing" },
  { value: "electrical", label: "Electrical" },
  { value: "landscaping", label: "Landscaping" },
  { value: "pest_control", label: "Pest Control" },
  { value: "real_estate", label: "Real Estate" },
  { value: "insurance", label: "Insurance" },
  { value: "accounting", label: "Accounting / CPA" },
  { value: "beauty_salon", label: "Salons / Spas" },
  { value: "automotive", label: "Auto Repair" },
  { value: "chiropractic", label: "Chiropractic" },
  { value: "therapy", label: "Therapy / Counseling" },
  { value: "optometry", label: "Optometry" },
  { value: "property_management", label: "Property Mgmt" },
  { value: "cleaning", label: "Cleaning Services" },
  { value: "towing", label: "Towing" },
];

// ── Indeed Presets ───────────────────────────────────────────────────────
const INDEED_PRESETS = [
  { keywords: "receptionist", label: "Receptionist" },
  { keywords: "front desk", label: "Front Desk" },
  { keywords: "office manager", label: "Office Manager" },
  { keywords: "dental receptionist", label: "Dental" },
  { keywords: "medical receptionist", label: "Medical" },
  { keywords: "legal receptionist", label: "Legal" },
  { keywords: "veterinary receptionist", label: "Vet" },
  { keywords: "customer service representative", label: "Customer Service" },
];


// ── Main Page ───────────────────────────────────────────────────────────
export default function LeadFinderPage() {
  const theme = useTheme();
  const { canUseLeadFinder } = usePlanFeatures();

  if (canUseLeadFinder === false) {
    if (typeof window !== "undefined") window.location.href = "/agency/leads";
    return null;
  }

  const { agency } = useAgency();

  // Shared state
  const [activeTab, setActiveTab] = useState<SourceTab>("google_maps");
  const [location, setLocation] = useState("");
  const [maxLeads, setMaxLeads] = useState(25);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterIndustry, setFilterIndustry] = useState("all");
  const [filterMinScore, setFilterMinScore] = useState(0);
  const [sortBy, setSortBy] = useState("fitScore");
  const [savingLeads, setSavingLeads] = useState<Set<string>>(new Set());
  const [savedLeads, setSavedLeads] = useState<Set<string>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());
  const eventSourceRef = useRef<EventSource | null>(null);

  // Indeed state
  const [keywords, setKeywords] = useState("receptionist");

  // Google Maps state
  const [mapsIndustry, setMapsIndustry] = useState("dental");
  const [mapsQuery, setMapsQuery] = useState("");

  const getAgencyId = () => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("agency");
      if (stored) { const p = JSON.parse(stored); return p.id || p.agency_id || null; }
    } catch {}
    return agency?.id || null;
  };

  // ── Search ──────────────────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    if (!location.trim()) { setError("Enter a location"); return; }
    if (activeTab === "indeed" && !keywords.trim()) { setError("Enter search keywords"); return; }
    if (activeTab === "google_maps" && !mapsIndustry && !mapsQuery.trim()) { setError("Select an industry or enter a search query"); return; }

    setLoading(true);
    setError(null);
    setLeads([]);
    setStats(null);
    setSavedLeads(new Set());
    setSelectedLeads(new Set());
    setProgress({ stage: "starting", message: "Initializing...", percent: 0 });

    const body: any = {
      source: activeTab,
      location: location.trim(),
      maxPages: activeTab === "google_maps" ? 2 : 1,
      maxLeads,
      agencyId: getAgencyId(),
    };

    if (activeTab === "indeed") {
      body.keywords = keywords.trim();
    } else {
      if (mapsQuery.trim()) {
        body.query = mapsQuery.trim();
      } else {
        body.industry = mapsIndustry;
      }
    }

    try {
      const res = await fetch(`${API_BASE}/api/leads/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.status === 429) { setError(data.error); setLoading(false); return; }
      if (!data.jobId) throw new Error(data.error || "Failed to start search");

      const evtSource = new EventSource(`${API_BASE}/api/leads/search/stream/${data.jobId}`);
      eventSourceRef.current = evtSource;

      evtSource.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data);
          setProgress(update.progress);
          if (update.status === "complete" && update.leads) {
            setLeads(update.leads || []);
            setStats(update.stats);
            setLoading(false);
            evtSource.close();
          } else if (update.status === "error") {
            setError(update.error || "Pipeline failed");
            setLoading(false);
            evtSource.close();
          }
        } catch {}
      };

      evtSource.onerror = () => { evtSource.close(); pollForResults(data.jobId); };
    } catch (err: any) { setError(err.message); setLoading(false); }
  }, [activeTab, keywords, location, maxLeads, mapsIndustry, mapsQuery]);

  const pollForResults = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/leads/search/status/${jobId}`);
        const data = await res.json();
        setProgress(data.progress);
        if (data.status === "complete") { setLeads(data.leads || []); setStats(data.stats); setLoading(false); clearInterval(interval); }
        else if (data.status === "error") { setError(data.error); setLoading(false); clearInterval(interval); }
      } catch { clearInterval(interval); setError("Lost connection"); setLoading(false); }
    }, 1000);
  };

  useEffect(() => { return () => { eventSourceRef.current?.close(); }; }, []);

  // ── Save ────────────────────────────────────────────────────────────────
  const handleSaveLead = async (lead: any) => {
    const agencyId = getAgencyId();
    if (!agencyId) { setError("Agency ID not found — please log in again."); return; }
    const key = lead.companyName;
    setSavingLeads((prev) => new Set(prev).add(key));
    try {
      const res = await fetch(`${API_BASE}/api/leads/save-to-crm`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: [lead], agencyId }),
      });
      const data = await res.json();
      if (data.saved > 0 || data.skipped > 0) setSavedLeads((prev) => new Set(prev).add(key));
      if (data.skipped > 0) setError(`${lead.companyName} already exists in your CRM`);
    } catch (err: any) { setError("Failed to save: " + err.message); }
    finally { setSavingLeads((prev) => { const n = new Set(prev); n.delete(key); return n; }); }
  };

  const handleSaveSelected = async () => {
    const agencyId = getAgencyId();
    if (!agencyId) { setError("Agency ID not found."); return; }
    const toSave = filteredLeads.filter((_, idx) => selectedLeads.has(idx)).filter((l) => !savedLeads.has(l.companyName));
    if (toSave.length === 0) return;
    setBulkSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/leads/save-to-crm`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: toSave, agencyId }),
      });
      const data = await res.json();
      const newSaved = new Set(savedLeads);
      toSave.forEach((l) => newSaved.add(l.companyName));
      setSavedLeads(newSaved);
      setSelectedLeads(new Set());
      if (data.saved > 0) {
        setError(`✓ ${data.saved} leads saved to CRM${data.skipped ? `, ${data.skipped} duplicates skipped` : ""}`);
        setTimeout(() => setError(null), 3000);
      }
    } catch (err: any) { setError("Bulk save failed: " + err.message); }
    finally { setBulkSaving(false); }
  };

  const handleSaveAll = async () => {
    const allIndices = new Set(filteredLeads.map((_, idx) => idx));
    setSelectedLeads(allIndices);
    // Use a small delay so state updates before save
    setTimeout(() => handleSaveSelected(), 50);
  };

  // ── Export ──────────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const toExport = selectedLeads.size > 0
        ? filteredLeads.filter((_, idx) => selectedLeads.has(idx))
        : filteredLeads;
      const res = await fetch(`${API_BASE}/api/leads/export`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: toExport }),
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `leads-${activeTab}-${location.replace(/\s+/g, "-")}.csv`;
      a.click(); window.URL.revokeObjectURL(url);
    } catch (err: any) { setError("Export failed: " + err.message); }
  };

  // ── Select All Toggle ─────────────────────────────────────────────────
  const toggleSelectAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map((_, idx) => idx)));
    }
  };

  // ── Filter / Sort ─────────────────────────────────────────────────────
  const industries = [...new Set(leads.map((l) => l.industry))].sort();
  const filteredLeads = leads
    .filter((l) => filterIndustry === "all" || l.industry === filterIndustry)
    .filter((l) => l.fitScore >= filterMinScore)
    .sort((a, b) => {
      if (sortBy === "fitScore") return b.fitScore - a.fitScore;
      if (sortBy === "company") return a.companyName.localeCompare(b.companyName);
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      return 0;
    });

  const inputClass = "w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors";
  const inputStyle = { background: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto" style={{ color: theme.text, zoom: 1.1 }}>
      {/* Header */}
      <div className="mb-6">
        <Link href="/agency/leads" className="inline-flex items-center gap-1.5 text-xs font-medium mb-4 no-underline transition-colors" style={{ color: theme.textMuted }}>
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Leads
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${theme.primary}20` }}>
            <Target className="h-5 w-5" style={{ color: theme.primary }} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: theme.text }}>Lead Finder</h1>
        </div>
        <p className="text-sm pl-12" style={{ color: theme.textMuted }}>
          Find businesses that need an AI receptionist — enrich with phone, email, website, and score by fit.
        </p>
      </div>

      {/* Search Card */}
      <div className="rounded-2xl overflow-hidden mb-6" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>

        {/* Source Tabs */}
        <div className="flex" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <button onClick={() => setActiveTab("google_maps")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-all"
            style={{
              color: activeTab === "google_maps" ? theme.primary : theme.textMuted,
              borderBottom: activeTab === "google_maps" ? `2px solid ${theme.primary}` : "2px solid transparent",
              background: activeTab === "google_maps" ? `${theme.primary}08` : "transparent",
            }}>
            <GoogleMapsLogo size={18} />
            Google Maps
          </button>
          <button onClick={() => setActiveTab("indeed")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-all"
            style={{
              color: activeTab === "indeed" ? "#003a9b" : theme.textMuted,
              borderBottom: activeTab === "indeed" ? "2px solid #003a9b" : "2px solid transparent",
              background: activeTab === "indeed" ? "#003a9b08" : "transparent",
            }}>
            <IndeedLogo size={18} />
            Indeed
          </button>
        </div>

        <div className="p-5">
          {/* Source description */}
          <p className="text-xs mb-4" style={{ color: theme.textMuted }}>
            {activeTab === "google_maps"
              ? "Search by industry to find local businesses in verticals that need AI receptionists."
              : "Search by job title to find businesses actively hiring for roles an AI receptionist can fill."}
          </p>

          {/* Indeed inputs */}
          {activeTab === "indeed" && (
            <>
              <div className="flex gap-2 flex-wrap mb-4">
                {INDEED_PRESETS.map((p) => (
                  <button key={p.keywords} onClick={() => setKeywords(p.keywords)}
                    className="px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer"
                    style={{
                      border: keywords === p.keywords ? "1px solid #003a9b" : `1px solid ${theme.inputBorder}`,
                      background: keywords === p.keywords ? "#003a9b15" : "transparent",
                      color: keywords === p.keywords ? "#003a9b" : theme.textMuted,
                    }}>
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textMuted }}>Job Title Keywords</label>
                  <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)}
                    placeholder='"receptionist", "front desk"' className={inputClass} style={inputStyle}
                    onKeyDown={(e) => e.key === "Enter" && !loading && handleSearch()} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textMuted }}>Location</label>
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                    placeholder='"Atlanta, GA"' className={inputClass} style={inputStyle}
                    onKeyDown={(e) => e.key === "Enter" && !loading && handleSearch()} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textMuted }}>Max</label>
                  <select value={maxLeads} onChange={(e) => setMaxLeads(Number(e.target.value))}
                    className={`${inputClass} cursor-pointer`} style={inputStyle}>
                    <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
                  </select>
                </div>
                <button onClick={handleSearch} disabled={loading}
                  className="rounded-lg px-6 py-2.5 text-sm font-semibold transition-all whitespace-nowrap"
                  style={{ background: loading ? theme.border : "#003a9b", color: loading ? theme.textMuted : "#fff", cursor: loading ? "not-allowed" : "pointer" }}>
                  {loading ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Searching...</span>
                    : <span className="inline-flex items-center gap-2"><Search className="h-4 w-4" /> Search Indeed</span>}
                </button>
              </div>
            </>
          )}

          {/* Google Maps inputs */}
          {activeTab === "google_maps" && (
            <>
              <div className="flex gap-2 flex-wrap mb-4">
                {MAPS_INDUSTRIES.slice(0, 12).map((ind) => (
                  <button key={ind.value} onClick={() => { setMapsIndustry(ind.value); setMapsQuery(""); }}
                    className="px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer"
                    style={{
                      border: mapsIndustry === ind.value && !mapsQuery ? `1px solid ${theme.primary}` : `1px solid ${theme.inputBorder}`,
                      background: mapsIndustry === ind.value && !mapsQuery ? `${theme.primary}15` : "transparent",
                      color: mapsIndustry === ind.value && !mapsQuery ? theme.primary : theme.textMuted,
                    }}>
                    {ind.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textMuted }}>Industry or Custom Search</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select value={mapsQuery ? "" : mapsIndustry} onChange={(e) => { setMapsIndustry(e.target.value); setMapsQuery(""); }}
                      className={`${inputClass} cursor-pointer`} style={inputStyle}>
                      {MAPS_INDUSTRIES.map((ind) => (
                        <option key={ind.value} value={ind.value}>{ind.label}</option>
                      ))}
                    </select>
                    <input type="text" value={mapsQuery} onChange={(e) => setMapsQuery(e.target.value)}
                      placeholder="or custom search..." className={inputClass} style={inputStyle}
                      onKeyDown={(e) => e.key === "Enter" && !loading && handleSearch()} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textMuted }}>Location</label>
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                    placeholder='"Atlanta, GA"' className={inputClass} style={inputStyle}
                    onKeyDown={(e) => e.key === "Enter" && !loading && handleSearch()} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textMuted }}>Max</label>
                  <select value={maxLeads} onChange={(e) => setMaxLeads(Number(e.target.value))}
                    className={`${inputClass} cursor-pointer`} style={inputStyle}>
                    <option value={10}>10</option><option value={25}>25</option><option value={40}>40</option>
                  </select>
                </div>
                <button onClick={handleSearch} disabled={loading}
                  className="rounded-lg px-6 py-2.5 text-sm font-semibold transition-all whitespace-nowrap"
                  style={{ background: loading ? theme.border : theme.primary, color: loading ? theme.textMuted : theme.primaryText, cursor: loading ? "not-allowed" : "pointer" }}>
                  {loading ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Searching...</span>
                    : <span className="inline-flex items-center gap-2"><Map className="h-4 w-4" /> Search Maps</span>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Progress */}
      {loading && <ProgressBar progress={progress} theme={theme} />}

      {/* Error / Success */}
      {error && (
        <div className="rounded-xl px-4 py-3 mb-4 text-sm flex items-center justify-between"
          style={{
            background: error.startsWith("✓") ? `${theme.primary}10` : "#ef444415",
            border: `1px solid ${error.startsWith("✓") ? `${theme.primary}30` : "#ef444430"}`,
            color: error.startsWith("✓") ? theme.primary : "#fca5a5",
          }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 cursor-pointer" style={{ color: "inherit" }}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Stats */}
      {stats && <StatsRow stats={stats} theme={theme} />}

      {/* Results */}
      {leads.length > 0 && (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap justify-between items-center gap-3 my-4">
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={toggleSelectAll} className="inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                style={{ color: theme.textMuted }}>
                {selectedLeads.size === filteredLeads.length
                  ? <CheckSquare className="h-3.5 w-3.5" style={{ color: theme.primary }} />
                  : <Square className="h-3.5 w-3.5" />}
                {selectedLeads.size > 0 ? `${selectedLeads.size} selected` : "Select all"}
              </button>

              <select value={filterIndustry} onChange={(e) => setFilterIndustry(e.target.value)}
                className="rounded-lg px-2.5 py-1.5 text-xs cursor-pointer" style={inputStyle}>
                <option value="all">All Industries</option>
                {industries.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
              </select>

              <select value={filterMinScore} onChange={(e) => setFilterMinScore(Number(e.target.value))}
                className="rounded-lg px-2.5 py-1.5 text-xs cursor-pointer" style={inputStyle}>
                <option value={0}>All Scores</option>
                <option value={30}>30+ (Cool)</option>
                <option value={50}>50+ (Warm)</option>
                <option value={70}>70+ (Hot)</option>
              </select>

              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg px-2.5 py-1.5 text-xs cursor-pointer" style={inputStyle}>
                <option value="fitScore">Sort: Fit Score</option>
                <option value="company">Sort: Company A-Z</option>
                <option value="rating">Sort: Rating</option>
              </select>

              <span className="text-xs" style={{ color: theme.textMuted }}>
                {filteredLeads.length} of {leads.length} leads
                {stats?.duplicatesRemoved > 0 && ` (${stats.duplicatesRemoved} dupes filtered)`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {selectedLeads.size > 0 && (
                <button onClick={handleSaveSelected} disabled={bulkSaving}
                  className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all cursor-pointer"
                  style={{ background: theme.primary, color: theme.primaryText, opacity: bulkSaving ? 0.6 : 1 }}>
                  {bulkSaving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</>
                    : <><Save className="h-3.5 w-3.5" /> Save {selectedLeads.size} to CRM</>}
                </button>
              )}
              {selectedLeads.size === 0 && (
                <button onClick={handleSaveAll} disabled={bulkSaving}
                  className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all cursor-pointer"
                  style={{ background: theme.primary, color: theme.primaryText, opacity: bulkSaving ? 0.6 : 1 }}>
                  <Save className="h-3.5 w-3.5" /> Save All
                </button>
              )}
              <button onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all cursor-pointer"
                style={{ border: `1px solid ${theme.inputBorder}`, color: theme.text, background: "transparent" }}>
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
            </div>
          </div>

          {/* Lead Cards */}
          <div>
            {filteredLeads.map((lead, idx) => (
              <LeadCard key={`${lead.companyName}-${idx}`} lead={lead} theme={theme}
                expanded={expandedId === idx} onToggle={() => setExpandedId(expandedId === idx ? null : idx)}
                onSave={handleSaveLead} saving={savingLeads.has(lead.companyName)} saved={savedLeads.has(lead.companyName)}
                selected={selectedLeads.has(idx)}
                onSelect={() => {
                  setSelectedLeads((prev) => {
                    const n = new Set(prev);
                    if (n.has(idx)) n.delete(idx); else n.add(idx);
                    return n;
                  });
                }} />
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {!loading && leads.length === 0 && !error && (
        <div className="text-center py-20" style={{ color: theme.textMuted }}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4"
            style={{ background: `${theme.primary}15` }}>
            <Target className="h-8 w-8" style={{ color: theme.primary, opacity: 0.7 }} />
          </div>
          <div className="text-base font-medium mb-2" style={{ color: theme.text, opacity: 0.7 }}>Find Your Next Clients</div>
          <div className="text-sm max-w-md mx-auto leading-relaxed">
            Use <strong>Google Maps</strong> to find businesses by industry, or <strong>Indeed</strong> to find businesses
            actively hiring for roles an AI receptionist can fill.
          </div>
        </div>
      )}
    </div>
  );
}
