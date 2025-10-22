'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

export default function SignInPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const role = searchParams.get('role') as 'ambassador' | 'client' | null
  const { user, profile, loading: authLoading } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && user && profile) {
      const redirectPath = profile.role === 'client' ? '/client-dashboard' : '/ambassador-dashboard'
      router.push(redirectPath)
    }
  }, [user, profile, authLoading, router])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f5d82e]"></div>
      </div>
    )
  }

  if (user && profile) {
    return null // Will redirect via useEffect
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    
    const result = await signIn(formData)
    
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.success) {
      // On success, the AuthProvider's onAuthStateChange will trigger.
      // The page will either redirect via its own useEffect or the middleware
      // will catch the next navigation. The loading spinner will continue until
      // the redirect is complete, which is the desired behavior.
      // No need to setLoading(false) here.
    } else {
      // Handle unexpected case
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link 
          href="/" 
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Link>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Welcome back
            </CardTitle>
            <p className="text-center text-gray-600 text-sm">
              Sign in to your account to continue
            </p>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#f5d82e] hover:bg-[#f5d82e]/90 text-gray-900 font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <Link 
                  href={role ? `/signup?role=${role}` : '/'}
                  className="text-[#f5d82e] hover:underline font-semibold"
                >
                  Sign up
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
