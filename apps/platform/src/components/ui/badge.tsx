import { cn } from '../../lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'pending' | 'muted'

const variants: Record<BadgeVariant, string> = {
  default: 'bg-[var(--accent-muted)] text-[var(--accent)] border-[var(--accent)]/20',
  success: 'bg-[var(--success-muted)] text-[var(--success)] border-[var(--success)]/20',
  warning: 'bg-[var(--warning-muted)] text-[var(--warning)] border-[var(--warning)]/20',
  danger: 'bg-[var(--danger-muted)] text-[var(--danger)] border-[var(--danger)]/20',
  pending: 'bg-[var(--warning-muted)] text-[var(--warning)] border-[var(--warning)]/20',
  muted: 'bg-[var(--surface-2)] text-[var(--text-3)] border-[var(--border)]',
}

export function Badge({ variant = 'default', className, children }: {
  variant?: BadgeVariant
  className?: string
  children: React.ReactNode
}) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    APPROVED: 'success',
    PENDING: 'pending',
    REJECTED: 'danger',
    REVOKED: 'muted',
    EXPIRED: 'muted',
    BLOCKED: 'danger',
    SUCCESS: 'success',
    DENIED: 'danger',
  }
  return <Badge variant={map[status] || 'muted'}>{status}</Badge>
}
