import { cn } from '@/lib/utils';
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-c-text-3 tracking-wide">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full h-12 rounded-2xl bg-c-input border border-c-border-input px-5 text-c-text placeholder:text-c-text-5',
            'focus:outline-none focus:border-[#C62828]/70 focus:ring-2 focus:ring-[#C62828]/20',
            'transition-colors',
            error && 'border-red-500/50 focus:border-red-500/60 focus:ring-red-500/20',
            className
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-c-text-4">{hint}</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-c-text-3 tracking-wide">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-2xl bg-c-input border border-c-border-input px-5 py-4 text-c-text placeholder:text-c-text-5 resize-none',
            'focus:outline-none focus:border-[#C62828]/70 focus:ring-2 focus:ring-[#C62828]/20',
            'transition-colors',
            error && 'border-red-500/50',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export { Input, Textarea };
