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
    const industry = searchParams.get('industry')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build the query
    let query = supabase
      .from('client_profiles')
      .select(`
        id,
        user_id,
        company_name,
        company_description,
        industry,
        logo_url,
        website,
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
      query = query.or(`company_name.ilike.%${search}%,company_description.ilike.%${search}%`)
    }

    if (industry) {
      query = query.ilike('industry', `%${industry}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching clients:', error)
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
