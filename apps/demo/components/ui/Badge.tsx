import React from "react";

type BadgeVariant = "purple" | "green" | "red" | "amber" | "blue" | "ghost";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

export function Badge({
  variant = "ghost",
  children,
  dot,
  pulse,
  className = "",
}: BadgeProps) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {dot && (
        <span
          className={`status-dot status-dot-${variant === "ghost" ? "muted" : variant} ${pulse ? "status-dot-pulse" : ""}`}
        />
      )}
      {children}
    </span>
  );
}

type StatusVariant = "connected" | "disconnected" | "connecting" | "pending";

const STATUS_MAP: Record<StatusVariant, { variant: BadgeVariant; label: string }> = {
  connected:    { variant: "green",  label: "CONNECTED" },
  disconnected: { variant: "ghost",  label: "NOT CONNECTED" },
  connecting:   { variant: "amber",  label: "CONNECTING..." },
  pending:      { variant: "amber",  label: "PENDING" },
};

interface StatusBadgeProps {
  status: StatusVariant;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { variant, label } = STATUS_MAP[status];
  return (
    <Badge variant={variant} dot pulse={status === "connecting"}>
      {label}
    </Badge>
  );
}

type SeverityVariant = "CRITICAL" | "HIGH" | "MEDIUM";

const SEVERITY_MAP: Record<SeverityVariant, BadgeVariant> = {
  CRITICAL: "red",
  HIGH:     "amber",
  MEDIUM:   "blue",
};

interface SeverityBadgeProps {
  severity: SeverityVariant;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  return (
    <Badge variant={SEVERITY_MAP[severity]}>
      {severity}
    </Badge>
  );
}
