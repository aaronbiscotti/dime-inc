import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, return a placeholder URL
    // In a real implementation, you would generate an Instagram OAuth URL
    const authUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/instagram/callback`

    return NextResponse.json({ 
      auth_url: authUrl,
      message: 'Instagram OAuth URL generated successfully'
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
