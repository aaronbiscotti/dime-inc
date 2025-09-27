"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    ambassadorProfile: null,
    clientProfile: null,
    loading: true,
  });

  const fetchUserProfile = async (userId: string) => {
    try {
      // Use maybeSingle() instead of single() to handle 406 errors
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
          .maybeSingle(); // Use maybeSingle() here too

        if (!error && data) {
          ambassadorProfile = data;
        }
      } else if (profile.role === "client") {
        const { data, error } = await supabase
          .from("client_profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle(); // Use maybeSingle() here too

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

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user && mounted) {
          const { profile, ambassadorProfile, clientProfile } =
            await fetchUserProfile(session.user.id);

          setState({
            user: session.user,
            session,
            profile,
            ambassadorProfile,
            clientProfile,
            loading: false,
          });
        } else if (mounted) {
          setState((prev) => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (mounted) {
          setState((prev) => ({ ...prev, loading: false }));
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_IN" && session?.user) {
        const { profile, ambassadorProfile, clientProfile } =
          await fetchUserProfile(session.user.id);
        setState({
          user: session.user,
          session,
          profile,
          ambassadorProfile,
          clientProfile,
          loading: false,
        });
      } else if (event === "SIGNED_OUT") {
        setState({
          user: null,
          session: null,
          profile: null,
          ambassadorProfile: null,
          clientProfile: null,
          loading: false,
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
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
            email: data.user.email,
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
          return {
            error: {
              message: `This login page is for ${
                expectedRole === "client" ? "clients" : "brand ambassadors"
              } only. Please use the correct login page for your account type.`,
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
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      // Manually clear the state for an immediate UI update
      setState({
        user: null,
        session: null,
        profile: null,
        ambassadorProfile: null,
        clientProfile: null,
        loading: false,
      });
    } catch (error) {
      throw error;
    }
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

  const value: AuthContextType = {
    ...state,
    signUp,
    signIn,
    signOut,
    createProfile,
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
