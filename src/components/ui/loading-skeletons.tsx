import { Skeleton } from "@/components/ui/skeleton"

export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-2 mb-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
    </div>
  )
}

export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full rounded-xl" />
      ))}
    </div>
  )
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  )
}

export function FullPageSkeleton() {
  return (
    <div className="p-4 md:p-8 w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <PageHeaderSkeleton />
      <CardGridSkeleton count={2} />
      <div className="mt-8">
        <Skeleton className="h-6 w-32 mb-4" />
        <ListSkeleton count={4} />
      </div>
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="p-4 md:p-8 w-full max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <PageHeaderSkeleton />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-full rounded-md mt-4" />
    </div>
  )
}
