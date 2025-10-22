'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Building } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

export default function Home() {
  const [selectedRole, setSelectedRole] = useState<'ambassador' | 'client' | null>(null)
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && profile) {
      const redirectPath = profile.role === 'client' ? '/client-dashboard' : '/ambassador-dashboard'
      router.push(redirectPath)
    }
  }, [user, profile, loading, router])

  // If user is authenticated but profile is still loading, show a loading state
  if (!loading && user && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f5d82e] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f5d82e]"></div>
      </div>
    )
  }

  if (user && profile) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to Dime
          </h1>
          <p className="text-gray-600">
            Choose how you want to join us
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedRole === 'ambassador' 
                ? 'ring-2 ring-[#f5d82e] shadow-lg' 
                : ''
            }`}
            onClick={() => setSelectedRole('ambassador')}
          >
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-[#f5d82e]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-[#f5d82e]" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                I'm an Ambassador
              </h2>
              <p className="text-gray-600 mb-4">
                Create content, join campaigns, and grow your influence
              </p>
              <ul className="text-left space-y-2 text-sm text-gray-600">
                <li>✓ Connect with brands</li>
                <li>✓ Showcase your portfolio</li>
                <li>✓ Track your earnings</li>
              </ul>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedRole === 'client' 
                ? 'ring-2 ring-[#f5d82e] shadow-lg' 
                : ''
            }`}
            onClick={() => setSelectedRole('client')}
          >
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-[#f5d82e]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="w-10 h-10 text-[#f5d82e]" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                I'm a Client
              </h2>
              <p className="text-gray-600 mb-4">
                Launch campaigns and connect with talented creators
              </p>
              <ul className="text-left space-y-2 text-sm text-gray-600">
                <li>✓ Create campaigns</li>
                <li>✓ Find ambassadors</li>
                <li>✓ Manage submissions</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {selectedRole && (
          <div className="flex justify-center gap-4">
            <Link href={`/signup?role=${selectedRole}`}>
              <Button 
                size="lg"
                className="bg-[#f5d82e] hover:bg-[#f5d82e]/90 text-gray-900 font-semibold px-8"
              >
                Sign Up as {selectedRole === 'ambassador' ? 'Ambassador' : 'Client'}
              </Button>
            </Link>
            <Link href={`/signin?role=${selectedRole}`}>
              <Button 
                size="lg" 
                variant="outline"
                className="border-gray-300 hover:bg-gray-50 px-8"
              >
                I have an account
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
