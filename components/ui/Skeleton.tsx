import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

export function MetricCardSkeleton() {
  return (
    <div className="rounded-2xl border border-c-border bg-c-card p-5 space-y-3">
      <div className="flex items-center gap-2.5">
        <Skeleton className="w-9 h-9 rounded-xl" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-7 w-24" />
    </div>
  );
}

export function QuoteRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 min-h-[72px]">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-36" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-5 w-24" />
    </div>
  );
}
