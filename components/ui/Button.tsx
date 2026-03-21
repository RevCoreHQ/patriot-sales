import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold rounded-2xl cursor-pointer select-none transition-all active:scale-[0.97]',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
          loading && 'pointer-events-none',
          {
            // Variants
            'bg-accent active:bg-accent text-black': variant === 'primary',
            'bg-c-elevated active:bg-c-surface text-c-text border border-c-border-inner': variant === 'secondary',
            'active:bg-c-elevated text-c-text-3 active:text-c-text': variant === 'ghost',
            'bg-red-500/10 active:bg-red-500/20 text-red-400 border border-red-500/20': variant === 'danger',
            'border border-c-border-inner active:border-accent/50 text-c-text active:text-accent bg-transparent': variant === 'outline',
            // Sizes — 48px minimum touch targets
            'h-12 px-5 text-sm': size === 'sm',
            'h-13 px-6 text-sm': size === 'md',
            'h-14 px-8 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
            </svg>
            {typeof children === 'string' ? children : null}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
export { Button };
