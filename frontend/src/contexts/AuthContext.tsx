"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client"; // Use your new client
import {
  Profile,
  UserRole,
  AmbassadorProfile,
  ClientProfile,
} from "@/types/database";
import type { User, Session } from "@supabase/supabase-js";

// Keep your existing types
interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  ambassadorProfile: AmbassadorProfile | null;
  clientProfile: ClientProfile | null;
  loading: boolean;
}

// Interface simplifies: we will use server actions for auth
interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    ambassadorProfile: null,
    clientProfile: null,
    loading: true,
  });

  // Fetch full profile data for a user
  const fetchFullProfile = async (user: User) => {
    // This now uses the JS client, which respects RLS policies
    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("*, ambassador_profiles(*), client_profiles(*)")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching full profile:", error);
      return { profile: null, ambassadorProfile: null, clientProfile: null };
    }

    return {
      profile: profileData ? { id: profileData.id, email: profileData.email, role: profileData.role, created_at: profileData.created_at, updated_at: profileData.updated_at } : null,
      ambassadorProfile: profileData?.ambassador_profiles || null,
      clientProfile: profileData?.client_profiles || null,
    };
  };

  useEffect(() => {
    // Initial auth state check
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Initial session check:", session?.user?.email);
      
      if (session?.user) {
        const { profile, ambassadorProfile, clientProfile } = await fetchFullProfile(session.user);
        setState({
          user: session.user,
          session,
          profile,
          ambassadorProfile,
          clientProfile,
          loading: false,
        });
      } else {
        setState({
          user: null,
          session: null,
          profile: null,
          ambassadorProfile: null,
          clientProfile: null,
          loading: false,
        });
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state change:", event, session?.user?.email);
        setState((prevState) => ({ ...prevState, loading: true }));

        const user = session?.user || null;
        if (user) {
          console.log("User authenticated:", user.email);
          const { profile, ambassadorProfile, clientProfile } = await fetchFullProfile(user);
          setState({
            user,
            session,
            profile,
            ambassadorProfile,
            clientProfile,
            loading: false,
          });
        } else {
          console.log("User not authenticated");
          setState({
            user: null,
            session: null,
            profile: null,
            ambassadorProfile: null,
            clientProfile: null,
            loading: false,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    // The onAuthStateChange listener will handle state updates
  };

  const refreshProfile = async () => {
    if (state.user) {
      const { profile, ambassadorProfile, clientProfile } = await fetchFullProfile(state.user);
      setState(prev => ({ ...prev, profile, ambassadorProfile, clientProfile }));
    }
  };

  // Auth actions (signIn, signUp) will be moved to Server Actions
  // so they are no longer needed in the context provider itself.
  const value: AuthContextType = {
    ...state,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}