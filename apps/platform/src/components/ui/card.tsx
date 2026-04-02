import { cn } from '../../lib/utils'

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn(
      'bg-[var(--surface)] border border-[var(--border)] rounded-xl',
      className
    )}>
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('px-5 py-4 border-b border-[var(--border)]', className)}>
      {children}
    </div>
  )
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('px-5 py-4', className)}>
      {children}
    </div>
  )
}
