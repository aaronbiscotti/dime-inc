export function AppSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="animate-pulse">
        {/* Navbar skeleton */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              <div className="h-8 bg-gray-200 rounded w-24"></div>
              <div className="flex gap-4">
                <div className="h-8 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Page Content skeleton */}
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar - Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Yellow banner */}
                <div className="h-32 bg-gray-200"></div>

                {/* Profile photo overlapping banner */}
                <div className="px-6 -mt-12 relative z-10">
                  <div className="w-24 h-24 bg-gray-300 rounded-full border-4 border-white"></div>
                </div>

                {/* Profile info */}
                <div className="px-6 pb-6 mt-4 space-y-4">
                  <div>
                    <div className="h-7 bg-gray-200 rounded w-40 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-36"></div>
                    <div className="h-4 bg-gray-200 rounded w-40"></div>
                  </div>

                  {/* Social links */}
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-4 bg-gray-200 rounded w-28"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Content Grid */}
            <div className="lg:col-span-2">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="h-7 bg-gray-200 rounded w-32"></div>
                <div className="h-10 bg-gray-200 rounded w-40"></div>
              </div>

              {/* Grid of cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {/* Card image */}
                    <div className="h-48 bg-gray-200"></div>

                    {/* Card content */}
                    <div className="p-4 space-y-3">
                      <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
