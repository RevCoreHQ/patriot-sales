import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold rounded-2xl cursor-pointer select-none transition-all active:scale-[0.97]',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
          {
            // Variants
            'bg-amber-500 active:bg-amber-400 text-black': variant === 'primary',
            'bg-c-elevated active:bg-c-surface text-c-text border border-c-border-inner': variant === 'secondary',
            'active:bg-c-elevated text-c-text-3 active:text-c-text': variant === 'ghost',
            'bg-red-500/10 active:bg-red-500/20 text-red-400 border border-red-500/20': variant === 'danger',
            'border border-c-border-inner active:border-amber-500/50 text-c-text active:text-amber-400 bg-transparent': variant === 'outline',
            // Sizes — 48px minimum touch targets
            'h-12 px-5 text-sm': size === 'sm',
            'h-13 px-6 text-sm': size === 'md',
            'h-14 px-8 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export { Button };
