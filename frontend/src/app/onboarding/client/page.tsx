'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AlertCircle, Loader2 } from 'lucide-react'

export default function ClientOnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    company_name: '',
    company_description: '',
    industry: '',
    website: '',
  })

  // Handle browser extension errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message.includes('message channel closed') || 
          event.message.includes('asynchronous response')) {
        console.warn('Browser extension conflict detected, but continuing...')
        // Don't show this error to the user as it's typically harmless
        event.preventDefault()
      }
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = supabaseBrowser()
      
      // Get current user with retry mechanism
      let user = null
      let userError = null
      
      // Try to get user with a small delay to ensure auth state is ready
      for (let i = 0; i < 3; i++) {
        const { data: { user: currentUser }, error: currentError } = await supabase.auth.getUser()
        if (currentUser && !currentError) {
          user = currentUser
          userError = null
          break
        }
        userError = currentError
        if (i < 2) {
          await new Promise(resolve => setTimeout(resolve, 500)) // Wait 500ms before retry
        }
      }
      
      if (userError || !user) {
        console.error('Authentication error:', userError)
        throw new Error('Not authenticated. Please try refreshing the page.')
      }

      console.log('Creating client profile for user:', user.id)

      // Create client profile
      const { error: profileError } = await supabase
        .from('client_profiles')
        .insert({
          user_id: user.id,
          company_name: formData.company_name,
          company_description: formData.company_description || null,
          industry: formData.industry || null,
          website: formData.website || null,
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        throw new Error(`Failed to create profile: ${profileError.message}`)
      }

      console.log('Updating onboarding status for user:', user.id)

      // Update onboarding status
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id)

      if (updateError) {
        console.error('Onboarding update error:', updateError)
        throw new Error(`Failed to update onboarding status: ${updateError.message}`)
      }

      console.log('Profile creation completed successfully')

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      console.error('Onboarding error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Complete Your Company Profile
            </CardTitle>
            <CardDescription>
              Tell us about your company to start creating campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    required
                    placeholder="Acme Inc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="Technology, Fashion, etc."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Company Description</Label>
                <Textarea
                  id="description"
                  value={formData.company_description}
                  onChange={(e) => setFormData({ ...formData, company_description: e.target.value })}
                  placeholder="Tell ambassadors about your company, your mission, and what kind of campaigns you run..."
                  rows={4}
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  disabled={loading}
                >
                  Skip for now
                </Button>
                
                <Button
                  type="submit"
                  className="bg-[#f5d82e] hover:bg-[#f5d82e]/90 text-gray-900 font-semibold"
                  disabled={loading || !formData.company_name}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Complete Profile'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
