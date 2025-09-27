import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Navbar } from "@/components/layout/Navbar"

export function ChatsSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="w-6 h-6" />
              <Skeleton className="h-7 w-16" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#f5d82e] rounded-full mx-auto mb-4"></div>
              <Skeleton className="h-6 w-40 mx-auto mb-2" />
              <Skeleton className="h-4 w-64 mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}