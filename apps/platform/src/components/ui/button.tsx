import { cn } from '../../lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white border-transparent',
  secondary: 'bg-[var(--surface-2)] hover:bg-[var(--border)] text-[var(--text)] border-[var(--border-2)]',
  ghost: 'bg-transparent hover:bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] border-transparent',
  danger: 'bg-[var(--danger-muted)] hover:bg-[var(--danger)]/20 text-[var(--danger)] border-[var(--danger)]/20',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-7 px-3 text-[12px] gap-1.5',
  md: 'h-9 px-4 text-[13px] gap-2',
  lg: 'h-11 px-6 text-[14px] gap-2',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  disabled,
  onClick,
  type = 'button',
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  children: React.ReactNode
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center rounded-lg border font-medium transition-all duration-150',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  )
}
