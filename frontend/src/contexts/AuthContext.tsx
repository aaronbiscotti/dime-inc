'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Profile, UserRole, AmbassadorProfile, ClientProfile } from '@/types/database'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  ambassadorProfile: AmbassadorProfile | null
  clientProfile: ClientProfile | null
  loading: boolean
}

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, role: UserRole) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  createProfile: (role: UserRole, profileData: any) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    ambassadorProfile: null,
    clientProfile: null,
    loading: true,
  })

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError || !profile) {
        return { profile: null, ambassadorProfile: null, clientProfile: null }
      }

      let ambassadorProfile = null
      let clientProfile = null

      if (profile.role === 'ambassador') {
        const { data } = await supabase
          .from('ambassador_profiles')
          .select('*')
          .eq('user_id', userId)
          .single()
        ambassadorProfile = data
      } else if (profile.role === 'client') {
        const { data } = await supabase
          .from('client_profiles')
          .select('*')
          .eq('user_id', userId)
          .single()
        clientProfile = data
      }

      return { profile, ambassadorProfile, clientProfile }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return { profile: null, ambassadorProfile: null, clientProfile: null }
    }
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user && mounted) {
          const { profile, ambassadorProfile, clientProfile } = await fetchUserProfile(session.user.id)

          setState({
            user: session.user,
            session,
            profile,
            ambassadorProfile,
            clientProfile,
            loading: false,
          })
        } else if (mounted) {
          setState(prev => ({ ...prev, loading: false }))
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          setState(prev => ({ ...prev, loading: false }))
        }
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_IN' && session?.user) {
        const { profile, ambassadorProfile, clientProfile } = await fetchUserProfile(session.user.id)
        setState({
          user: session.user,
          session,
          profile,
          ambassadorProfile,
          clientProfile,
          loading: false,
        })
      } else if (event === 'SIGNED_OUT') {
        setState({
          user: null,
          session: null,
          profile: null,
          ambassadorProfile: null,
          clientProfile: null,
          loading: false,
        })
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, role: UserRole) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        return { error }
      }

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            role,
          })

        if (profileError) {
          return { error: profileError }
        }
      }

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const createProfile = async (role: UserRole, profileData: any) => {
    if (!state.user) {
      return { error: new Error('No user logged in') }
    }

    try {
      if (role === 'ambassador') {
        const { error } = await supabase
          .from('ambassador_profiles')
          .insert({
            user_id: state.user.id,
            ...profileData,
          })

        if (error) return { error }

        const { profile, ambassadorProfile, clientProfile } = await fetchUserProfile(state.user.id)
        setState(prev => ({
          ...prev,
          profile,
          ambassadorProfile,
          clientProfile,
        }))
      } else if (role === 'client') {
        const { error } = await supabase
          .from('client_profiles')
          .insert({
            user_id: state.user.id,
            ...profileData,
          })

        if (error) return { error }

        const { profile, ambassadorProfile, clientProfile } = await fetchUserProfile(state.user.id)
        setState(prev => ({
          ...prev,
          profile,
          ambassadorProfile,
          clientProfile,
        }))
      }

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const value: AuthContextType = {
    ...state,
    signUp,
    signIn,
    signOut,
    createProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}