import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar Skeleton */}
      <nav className="bg-white border-b border-gray-300 w-full">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <Skeleton className="w-8 h-8 rounded-lg mr-3" />
                <Skeleton className="h-6 w-12" />
              </div>
              <div className="flex items-center space-x-6">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-10" />
              </div>
            </div>
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar Skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-300 sticky top-6">
              <div className="p-6">
                {/* Banner */}
                <div className="h-32 bg-gradient-to-r from-[#f5d82e] to-[#FEE65D] rounded-xl mb-6 relative">
                  <div className="absolute -bottom-6 left-6">
                    <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-300"></div>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="mt-8 space-y-4">
                  <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>

                  <Skeleton className="h-16 w-full" />

                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-36" />
                  </div>

                  <div className="space-y-2">
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side Skeleton */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-10 w-36 rounded-xl" />
              </div>
            </div>

            {/* Empty State Skeleton */}
            <div className="md:col-span-2 xl:col-span-3">
              <div className="bg-white rounded-xl border border-dashed border-gray-300">
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-[#f5d82e] rounded-full mx-auto mb-4"></div>
                  <Skeleton className="h-6 w-32 mx-auto mb-2" />
                  <Skeleton className="h-4 w-64 mx-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
