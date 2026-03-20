import React from "react";

// ── MetricCard ──────────────────────────────────────────────
type MetricColor = "default" | "purple" | "green" | "red" | "amber";

interface MetricCardProps {
  label: string;
  value: string | number;
  delta?: string;
  color?: MetricColor;
}

const METRIC_COLOR_MAP: Record<MetricColor, string> = {
  default: "var(--text-primary)",
  purple:  "var(--accent-purple-light)",
  green:   "var(--accent-green)",
  red:     "var(--accent-red)",
  amber:   "var(--accent-amber)",
};

export function MetricCard({ label, value, delta, color = "default" }: MetricCardProps) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={{ color: METRIC_COLOR_MAP[color] }}>
        {value}
      </div>
      {delta && <div className="metric-delta">{delta}</div>}
    </div>
  );
}

// ── PageHeader ──────────────────────────────────────────────
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <div className="page-title">{title}</div>
        {subtitle && <div className="page-sub">{subtitle}</div>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ── ScopeTag ────────────────────────────────────────────────
interface ScopeTagProps {
  scope: string;
  denied?: boolean;
  neutral?: boolean;
}

export function ScopeTag({ scope, denied, neutral }: ScopeTagProps) {
  const cls = denied
    ? "scope-tag-denied"
    : neutral
    ? "scope-tag-neutral"
    : "";
  return <span className={`scope-tag ${cls}`}>{scope}</span>;
}

// ── FilterBar ───────────────────────────────────────────────
interface FilterBarProps {
  filters: string[];
  active: string;
  onChange: (f: string) => void;
  format?: (f: string) => string;
}

export function FilterBar({
  filters,
  active,
  onChange,
  format = (f) => f.replace(/_/g, " "),
}: FilterBarProps) {
  return (
    <div className="filter-bar">
      {filters.map((f) => (
        <button
          key={f}
          className={`filter-btn ${active === f ? "active" : ""}`}
          onClick={() => onChange(f)}
        >
          {format(f)}
        </button>
      ))}
    </div>
  );
}

// ── LiveToggle ──────────────────────────────────────────────
interface LiveToggleProps {
  live: boolean;
  onToggle: () => void;
  dotColor?: string;
}

export function LiveToggle({ live, onToggle, dotColor }: LiveToggleProps) {
  return (
    <div className="live-toggle" onClick={onToggle}>
      <span
        className={`status-dot ${live ? "status-dot-pulse" : "status-dot-muted"}`}
        style={live && dotColor ? { background: dotColor } : undefined}
      />
      <span className="live-toggle-label">{live ? "LIVE" : "PAUSED"}</span>
    </div>
  );
}

// ── InfoBanner ──────────────────────────────────────────────
interface InfoBannerProps {
  children: React.ReactNode;
}

export function InfoBanner({ children }: InfoBannerProps) {
  return (
    <div className="info-banner">
      <span style={{ fontSize: "16px", marginTop: "1px" }}>ℹ</span>
      <div className="info-banner-text">{children}</div>
    </div>
  );
}

// ── SectionLabel ────────────────────────────────────────────
interface SectionLabelProps {
  children: React.ReactNode;
}

export function SectionLabel({ children }: SectionLabelProps) {
  return <div className="section-label">{children}</div>;
}
