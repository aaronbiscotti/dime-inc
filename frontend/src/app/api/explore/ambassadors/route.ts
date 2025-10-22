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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const location = searchParams.get('location')
    const niche = searchParams.get('niche')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build the query
    let query = supabase
      .from('ambassador_profiles')
      .select(`
        id,
        user_id,
        full_name,
        bio,
        location,
        niche,
        instagram_handle,
        tiktok_handle,
        twitter_handle,
        profile_photo_url,
        profiles!inner(
          id,
          email,
          role,
          onboarding_completed
        )
      `)
      .eq('profiles.onboarding_completed', true)

    // Apply filters
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,bio.ilike.%${search}%`)
    }

    if (location) {
      query = query.ilike('location', `%${location}%`)
    }

    if (niche) {
      query = query.contains('niche', [niche])
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching ambassadors:', error)
      return NextResponse.json({ error: 'Failed to fetch ambassadors' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
