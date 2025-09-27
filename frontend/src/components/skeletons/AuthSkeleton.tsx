import { Skeleton } from "@/components/ui/skeleton"

export function AuthSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-xl border-2 border-gray-300 w-full max-w-md mx-auto">
        <div className="p-6">
          <Skeleton className="h-8 w-32 mx-auto mb-6" />
        </div>
        <div className="px-6 pb-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />
            <div className="text-center">
              <Skeleton className="h-4 w-48 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}