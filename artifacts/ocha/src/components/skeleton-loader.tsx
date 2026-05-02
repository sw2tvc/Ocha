import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-muted", className)}
    />
  );
}

export function CleanerCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex gap-3">
        <Skeleton className="w-14 h-14 rounded-full shrink-0" />
        <div className="flex-1">
          <Skeleton className="h-4 w-32 mb-1.5" />
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-3 w-full mb-1" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
    </div>
  );
}

export function BookingCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <Skeleton className="h-4 w-40 mb-2" />
      <Skeleton className="h-3 w-28 mb-3" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <Skeleton className="h-32 w-full rounded-none" />
      <div className="p-4">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}
