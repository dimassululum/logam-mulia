import { cn } from '@/core/lib/utils'

interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('bg-navy-100 rounded-lg animate-pulse', className)}
    />
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-navy-100 overflow-hidden">
      <Skeleton className="w-full aspect-square" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  )
}

export function OrderRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-navy-100 animate-pulse">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-20 ml-auto" />
      <Skeleton className="h-6 w-24 rounded-full" />
    </div>
  )
}
