import { cn } from '@/lib/utils';
import type { QuoteStatus } from '@/types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'amber' | 'green' | 'blue' | 'red' | 'neutral' | 'orange';
  className?: string;
}

export function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
      {
        'bg-[#C62828]/15 text-[#C62828] border border-[#C62828]/20': variant === 'amber',
        'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20': variant === 'green',
        'bg-blue-500/15 text-blue-400 border border-blue-500/20': variant === 'blue',
        'bg-red-500/15 text-red-400 border border-red-500/20': variant === 'red',
        'bg-neutral-500/15 text-neutral-400 border border-neutral-500/20': variant === 'neutral',
        'bg-orange-500/15 text-orange-400 border border-orange-500/20': variant === 'orange',
      },
      className
    )}>
      {children}
    </span>
  );
}

const STATUS_VARIANTS: Record<QuoteStatus, BadgeProps['variant']> = {
  draft: 'neutral',
  presented: 'amber',
  accepted: 'green',
  lost: 'red',
  expired: 'orange',
};

const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Draft',
  presented: 'Presented',
  accepted: 'Accepted',
  lost: 'Lost',
  expired: 'Expired',
};

export function StatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <Badge variant={STATUS_VARIANTS[status]}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {STATUS_LABELS[status]}
    </Badge>
  );
}
