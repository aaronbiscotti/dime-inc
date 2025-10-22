'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get('role')

  useEffect(() => {
    // Redirect to the new auth route with role parameter
    const redirectUrl = role ? `/signin?role=${role}` : '/'
    router.replace(redirectUrl)
  }, [router, role])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f5d82e] mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  )
}
