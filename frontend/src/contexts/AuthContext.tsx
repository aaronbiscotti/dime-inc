"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import {
  Profile,
  UserRole,
  AmbassadorProfile,
  ClientProfile,
  Database,
} from "@/types/database";

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  ambassadorProfile: AmbassadorProfile | null;
  clientProfile: ClientProfile | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  signUp: (
    email: string,
    password: string,
    role: UserRole
  ) => Promise<{ error: any }>;
  signIn: (
    email: string,
    password: string,
    expectedRole?: UserRole
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  createProfile: (role: UserRole, profileData: Record<string, any>) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Create Supabase client once and memoize it
  const supabaseRef = React.useRef(createClient());
  const supabase = supabaseRef.current;

  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    ambassadorProfile: null,
    clientProfile: null,
    loading: true,
  });

  const isUpdatingProfileRef = React.useRef(false);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return { profile: null, ambassadorProfile: null, clientProfile: null };
      }

      if (!profile) {
        return { profile: null, ambassadorProfile: null, clientProfile: null };
      }

      let ambassadorProfile = null;
      let clientProfile = null;

      // Only query role-specific profiles if the main profile exists and has the correct role
      if (profile.role === "ambassador") {
        const { data, error } = await supabase
          .from("ambassador_profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (!error && data) {
          ambassadorProfile = data;
        }
      } else if (profile.role === "client") {
        const { data, error } = await supabase
          .from("client_profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (!error && data) {
          clientProfile = data;
        }
      }

      return { profile, ambassadorProfile, clientProfile };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return { profile: null, ambassadorProfile: null, clientProfile: null };
    }
  };

  useEffect(() => {
    let mounted = true;

    const updateAuthState = async (session: Session | null, isInitialLoad = false) => {
      if (!mounted) return;
      if (isUpdatingProfileRef.current) return;

      if (session?.user) {
        isUpdatingProfileRef.current = true;

        // Only show loading skeleton on initial load, not on refresh
        if (isInitialLoad) {
          setState(prev => ({ ...prev, loading: true }));
        }

        try {
          const { profile, ambassadorProfile, clientProfile } =
            await fetchUserProfile(session.user.id);

          if (mounted) {
            setState({
              user: session.user,
              session,
              profile,
              ambassadorProfile,
              clientProfile,
              loading: false,
            });
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          if (mounted) {
            setState(prev => ({ ...prev, loading: false }));
          }
        } finally {
          isUpdatingProfileRef.current = false;
        }
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

    const initializeAuth = async (isInitialLoad = false) => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        await updateAuthState(session, isInitialLoad);
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (mounted) {
          setState(prev => ({ ...prev, loading: false }));
        }
      }
    };

    // Handle page visibility change - refresh when user returns (background refresh)
    const handleVisibilityChange = () => {
      if (!document.hidden && mounted) {
        // Background refresh - don't show loading skeleton
        initializeAuth(false);
      }
    };

    // Handle window focus - additional refresh trigger (background refresh)
    const handleWindowFocus = () => {
      if (mounted) {
        // Background refresh - don't show loading skeleton
        initializeAuth(false);
      }
    };

    // Initial load - show loading skeleton
    initializeAuth(true);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // Skip INITIAL_SESSION event - we handle this in initializeAuth
      if (event === 'INITIAL_SESSION') {
        return;
      }

      // Add a small delay to prevent rapid state changes
      await new Promise(resolve => setTimeout(resolve, 100));

      // Auth state change - don't show loading skeleton (background refresh)
      await updateAuthState(session, false);
    });

    // Delay adding event listeners to prevent them from firing during initial mount
    const timeoutId = setTimeout(() => {
      if (mounted) {
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleWindowFocus);
      }
    }, 1000);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      // Cleanup function to reset any pending states
      if (isUpdatingProfileRef.current) {
        isUpdatingProfileRef.current = false;
      }
    };
  }, []);

  const signUp = async (email: string, password: string, role: UserRole) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        // Use upsert to handle potential conflicts
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (profileError) {
          return { error: profileError };
        }
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signIn = async (
    email: string,
    password: string,
    expectedRole?: UserRole
  ) => {
    try {
      // Sign in with credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      // If expectedRole is provided, validate user's role matches
      if (expectedRole && data.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();

        if (profileError) {
          return { error: profileError };
        }

        if (profile && profile.role !== expectedRole) {
          // Sign out the user since their role doesn't match
          await supabase.auth.signOut();

          const roleName = expectedRole === "client" ? "client" : "brand ambassador";
          const userRoleName = profile.role === "client" ? "client" : "brand ambassador";

          return {
            error: {
              message: `You have a ${userRoleName} account. Please sign in as a ${userRoleName}.`,
              code: "ROLE_MISMATCH",
              userRole: profile.role,
            },
          };
        }
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Cancel any ongoing operations
      if (isUpdatingProfileRef.current) {
        isUpdatingProfileRef.current = false;
      }

      // Clear state immediately for responsive UI
      setState({
        user: null,
        session: null,
        profile: null,
        ambassadorProfile: null,
        clientProfile: null,
        loading: false,
      });

      // Clear all possible auth-related storage
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (storageError) {
        console.warn("Could not clear storage:", storageError);
      }

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
      }
    } catch (error) {
      console.error("Sign out error:", error);
    }

    // Force a complete state reset regardless of errors
    setState({
      user: null,
      session: null,
      profile: null,
      ambassadorProfile: null,
      clientProfile: null,
      loading: false,
    });
  };

  const createProfile = async (role: UserRole, profileData: Record<string, any>) => {
    if (!state.user) {
      return { error: new Error("No user logged in") };
    }

    try {
      if (role === "ambassador") {
        const { error } = await supabase
          .from("ambassador_profiles")
          .insert({
            user_id: state.user.id,
            full_name: profileData.full_name || "",
            ...profileData,
          });

        if (error) return { error };

        const { profile, ambassadorProfile, clientProfile } =
          await fetchUserProfile(state.user.id);
        setState((prev) => ({
          ...prev,
          profile,
          ambassadorProfile,
          clientProfile,
        }));
      } else if (role === "client") {
        const { error } = await supabase
          .from("client_profiles")
          .insert({
            user_id: state.user.id,
            company_name: profileData.company_name || "",
            ...profileData,
          });

        if (error) return { error };

        const { profile, ambassadorProfile, clientProfile } =
          await fetchUserProfile(state.user.id);
        setState((prev) => ({
          ...prev,
          profile,
          ambassadorProfile,
          clientProfile,
        }));
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const refreshProfile = async () => {
    if (!state.user) return;
    
    try {
      const { profile, ambassadorProfile, clientProfile } = await fetchUserProfile(state.user.id);
      setState(prev => ({
        ...prev,
        profile,
        ambassadorProfile,
        clientProfile,
      }));
    } catch (error) {
      console.error("Error refreshing profile:", error);
    }
  };

  const value: AuthContextType = {
    ...state,
    signUp,
    signIn,
    signOut,
    createProfile,
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
