import { cn } from '../../lib/utils'

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full h-9 px-3 rounded-lg text-[13px]',
        'bg-[var(--surface-2)] border border-[var(--border-2)]',
        'text-[var(--text)] placeholder:text-[var(--text-3)]',
        'focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30',
        'transition-colors duration-150',
        className
      )}
    />
  )
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        'w-full px-3 py-2 rounded-lg text-[13px] resize-none',
        'bg-[var(--surface-2)] border border-[var(--border-2)]',
        'text-[var(--text)] placeholder:text-[var(--text-3)]',
        'focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30',
        'transition-colors duration-150',
        className
      )}
    />
  )
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'w-full h-9 px-3 rounded-lg text-[13px]',
        'bg-[var(--surface-2)] border border-[var(--border-2)]',
        'text-[var(--text)]',
        'focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30',
        'transition-colors duration-150',
        className
      )}
    >
      {children}
    </select>
  )
}

export function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className={cn('block text-[12px] font-medium text-[var(--text-2)] mb-1.5', className)}
    >
      {children}
    </label>
  )
}
