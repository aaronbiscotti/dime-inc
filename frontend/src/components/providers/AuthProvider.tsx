'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type AmbassadorProfile = Database['public']['Tables']['ambassador_profiles']['Row']
type ClientProfile = Database['public']['Tables']['client_profiles']['Row']

interface AuthContextType {
  user: User | null
  profile: Profile | null
  ambassadorProfile: AmbassadorProfile | null
  clientProfile: ClientProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  ambassadorProfile: null,
  clientProfile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [ambassadorProfile, setAmbassadorProfile] = useState<AmbassadorProfile | null>(null)
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  async function fetchUserProfile(userId: string) {
    try {
      console.log('Fetching profile for user', userId);
      
      // Fetch base profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select()
        .eq('id', userId)
        .single();
  
      if (profileError) {
        console.error('Error fetching profile', profileError);
        setProfile(null);
        setLoading(false);
        return;
      }
  
      console.log('Profile data', profileData);
      setProfile(profileData);
  
      // Fetch role-specific profile
      if (profileData?.role === 'ambassador') {
        const { data: ambassadorData, error: ambassadorError } = await supabase
          .from('ambassador_profiles')
          .select()
          .eq('user_id', userId)
          .single();
  
        if (ambassadorError) {
          console.error('Error fetching ambassador profile', ambassadorError);
          setAmbassadorProfile(null);
        } else {
          console.log('Ambassador profile data', ambassadorData);
          setAmbassadorProfile(ambassadorData);
        }
        setClientProfile(null);
        
      } else if (profileData?.role === 'client') {
        const { data: clientData, error: clientError } = await supabase
          .from('client_profiles')
          .select()
          .eq('user_id', userId)
          .single();
  
        if (clientError) {
          console.error('Error fetching client profile', clientError);
          setClientProfile(null);
        } else {
          console.log('Client profile data', clientData);
          setClientProfile(clientData);
        }
        setAmbassadorProfile(null);
      }
  
      console.log('Profile fetch completed successfully');
    } catch (error) {
      console.error('Error fetching profile', error);
      setProfile(null);
    } finally {
      // ALWAYS set loading to false, even if there are errors
      setLoading(false);
    }
  }
  

  async function refreshProfile() {
    if (user) {
      await fetchUserProfile(user.id)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setAmbassadorProfile(null)
    setClientProfile(null)
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id)
      
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Add a small delay to ensure the session is fully established
        await new Promise(resolve => setTimeout(resolve, 100))
        await fetchUserProfile(session.user.id)
      } else {
        setProfile(null)
        setAmbassadorProfile(null)
        setClientProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        ambassadorProfile,
        clientProfile,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
