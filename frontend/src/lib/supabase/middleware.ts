// frontend/src/lib/supabase/middleware.ts

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/types/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // If user is not logged in, allow them to access auth pages or the root page
    const isAuthPath = request.nextUrl.pathname.startsWith('/signin') || request.nextUrl.pathname.startsWith('/signup')
    if (isAuthPath || request.nextUrl.pathname === '/') {
      return supabaseResponse
    }
    
    // For any other page, redirect to root if not logged in
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/'
    return NextResponse.redirect(redirectUrl)
  }

  // --- If user IS logged in ---
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed, role')
    .eq('id', user.id)
    .single()

  const isOnboardingRoute = request.nextUrl.pathname.startsWith('/onboarding')
  const isAuthRoute = request.nextUrl.pathname.startsWith('/signin') || request.nextUrl.pathname.startsWith('/signup')
  const isRootRoute = request.nextUrl.pathname === '/'

  // If user exists but profile is not yet created (transient state after signup)
  // or there was an error, redirect to root to retry. Don't let them hit a protected page.
  if (!profile) {
      if (isOnboardingRoute || isAuthRoute || isRootRoute) {
        // Allow them to be on these pages during this transient state
        return supabaseResponse
      }
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/'
      console.log('No profile found for authenticated user, redirecting to root.')
      return NextResponse.redirect(redirectUrl)
  }

  // If user hasn't completed onboarding, force them to the onboarding page
  if (!profile.onboarding_completed && !isOnboardingRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = `/onboarding/${profile.role}`
    console.log('Redirecting to onboarding:', redirectUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  // If user has completed onboarding, prevent them from accessing auth, onboarding, or root pages
  if (profile.onboarding_completed && (isAuthRoute || isOnboardingRoute || isRootRoute)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = profile.role === 'client' ? '/client-dashboard' : '/ambassador-dashboard'
    console.log('Redirecting authenticated, onboarded user to their dashboard:', redirectUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  // Redirect old /dashboard route to role-specific dashboard
  if (profile.onboarding_completed && request.nextUrl.pathname === '/dashboard') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = profile.role === 'client' ? '/client-dashboard' : '/ambassador-dashboard'
    console.log('Redirecting from /dashboard to:', redirectUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}