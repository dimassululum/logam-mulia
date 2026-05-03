import Card from '@/shared/ui/Card'
import { Skeleton } from '@/shared/ui'

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} padding="md">
            <div className="space-y-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-full" />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <Card padding="md">
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </Card>

        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} padding="md">
              <div className="space-y-4">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-10 w-36" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
