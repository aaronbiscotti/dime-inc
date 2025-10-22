'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

export default function SignUpPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const role = searchParams.get('role') as 'ambassador' | 'client'
  const { user, profile, loading: authLoading } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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

  if (!role) {
    router.push('/')
    return null
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    formData.append('role', role)
    
    const result = await signUp(formData)
    
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.success) {
      setSuccess(result.message || 'Account created successfully!')
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
          Back to role selection
        </Link>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Create your {role === 'ambassador' ? 'Ambassador' : 'Client'} account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
              
              {success && (
                <div className="bg-green-50 text-green-700 p-3 rounded-lg border border-green-200">
                  <span className="text-sm">{success}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={role === 'ambassador' ? 'your@email.com' : 'company@email.com'}
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
                  minLength={6}
                />
                <p className="text-xs text-gray-500">
                  Must be at least 6 characters
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#f5d82e] hover:bg-[#f5d82e]/90 text-gray-900 font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Sign Up'
                )}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link 
                  href={`/signin?role=${role}`}
                  className="text-[#f5d82e] hover:underline font-semibold"
                >
                  Sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
