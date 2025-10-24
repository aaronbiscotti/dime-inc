"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type AmbassadorProfile =
  Database["public"]["Tables"]["ambassador_profiles"]["Row"];
type ClientProfile = Database["public"]["Tables"]["client_profiles"]["Row"];

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  ambassadorProfile: AmbassadorProfile | null;
  clientProfile: ClientProfile | null;
  userRole: "client" | "ambassador" | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearAuthState: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  ambassadorProfile: null,
  clientProfile: null,
  userRole: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  clearAuthState: () => {},
});

export function AuthProvider({
  children,
  initialUser = null,
  initialProfile = null,
  initialAmbassadorProfile = null,
  initialClientProfile = null,
}: {
  children: React.ReactNode;
  initialUser?: User | null;
  initialProfile?: Profile | null;
  initialAmbassadorProfile?: AmbassadorProfile | null;
  initialClientProfile?: ClientProfile | null;
}) {
  const hasServerSeed = Boolean(initialUser && initialProfile);

  const [user, setUser] = useState<User | null>(initialUser);
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [ambassadorProfile, setAmbassadorProfile] = useState<
    AmbassadorProfile | null
  >(initialAmbassadorProfile);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(
    initialClientProfile
  );
  const [userRole, setUserRole] = useState<"client" | "ambassador" | null>(
    (initialProfile?.role as "client" | "ambassador" | null) ?? null
  );
  const [loading, setLoading] = useState(!hasServerSeed);

  const supabase = supabaseBrowser();

  async function fetchUserProfile(userId: string) {
    try {
      console.log("Fetching profile for user", userId);
      console.log("Current loading state:", loading);

      // Check if Supabase is properly configured
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) {
        console.error("Supabase environment variables not configured");
        setProfile(null);
        setLoading(false);
        return;
      }

      // Fetch base profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select()
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Error fetching profile", profileError);
        setProfile(null);
        setLoading(false);
        return;
      }

      console.log("Profile data", profileData);
      setProfile(profileData);
      setUserRole(profileData?.role as "client" | "ambassador" | null);

      // Fetch role-specific profile
      if (profileData?.role === "ambassador") {
        const { data: ambassadorData, error: ambassadorError } = await supabase
          .from("ambassador_profiles")
          .select()
          .eq("user_id", userId)
          .single();

        if (ambassadorError) {
          console.error("Error fetching ambassador profile", ambassadorError);
          setAmbassadorProfile(null);
        } else {
          console.log("Ambassador profile data", ambassadorData);
          setAmbassadorProfile(ambassadorData);
        }
        setClientProfile(null);
      } else if (profileData?.role === "client") {
        const { data: clientData, error: clientError } = await supabase
          .from("client_profiles")
          .select()
          .eq("user_id", userId)
          .single();

        if (clientError) {
          console.error("Error fetching client profile", clientError);
          setClientProfile(null);
        } else {
          console.log("Client profile data", clientData);
          setClientProfile(clientData);
        }
        setAmbassadorProfile(null);
      }

      console.log("Profile fetch completed successfully");
    } catch (error) {
      console.error("Error fetching profile", error);
      setProfile(null);
    } finally {
      // ALWAYS set loading to false, even if there are errors
      setLoading(false);
    }
  }

  async function refreshProfile() {
    if (user) {
      await fetchUserProfile(user.id);
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Client-side sign out error:", error);
    } finally {
      // Always clear state, even if signOut fails
      setUser(null);
      setProfile(null);
      setAmbassadorProfile(null);
      setClientProfile(null);
      setUserRole(null);
    }
  }

  // Manual method to clear all state (useful after server actions)
  function clearAuthState() {
    setUser(null);
    setProfile(null);
    setAmbassadorProfile(null);
    setClientProfile(null);
    setUserRole(null);
    setLoading(false);
  }

  useEffect(() => {
    let mounted = true;

    // Only set loading true when we have no server seed
    setLoading((prev) => (hasServerSeed ? false : true));

    // Check current session immediately on mount
    const checkInitialSession = async () => {
      try {
        // Check if Supabase is properly configured
        if (
          !process.env.NEXT_PUBLIC_SUPABASE_URL ||
          !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ) {
          console.error("Supabase environment variables not configured");
          if (mounted) {
            setUser(null);
            setProfile(null);
            setAmbassadorProfile(null);
            setClientProfile(null);
            setLoading(false);
          }
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        console.log("Initial session check:", session?.user?.id);

        if (!mounted) return;

        const currentUser = session?.user ?? null;
        // If we had a server seed, avoid redundant state churn when unchanged
        setUser((prev) => (prev?.id === currentUser?.id ? prev : currentUser));

        if (currentUser) {
          // Only fetch if we don't already have a profile from server seed
          if (!hasServerSeed) {
            await fetchUserProfile(currentUser.id);
          } else {
            setLoading(false);
          }
        } else {
          console.log("No initial session found, clearing all profile data");
          setProfile(null);
          setAmbassadorProfile(null);
          setClientProfile(null);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error checking initial session:", error);
        if (mounted) {
          setUser(null);
          setProfile(null);
          setAmbassadorProfile(null);
          setClientProfile(null);
          setLoading(false);
        }
      }
    };

    // Check session immediately
    checkInitialSession();

    // Add a timeout to ensure loading doesn't get stuck
    const timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.log("Auth loading timeout - forcing loading to false");
        setLoading(false);
      }
    }, 3000); // 3 second timeout - reduced further

    // onAuthStateChange fires an INITIAL_SESSION event on page load,
    // which is more reliable than getSession() after a redirect.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (!mounted) {
        return;
      }

      console.log("Auth state change:", event, session?.user?.id);
      console.log("Session:", session);
      console.log("User:", session?.user);

      const currentUser = session?.user ?? null;
      setUser((prev) => (prev?.id === currentUser?.id ? prev : currentUser));

      if (currentUser) {
        // If a user is found, fetch their profile. `fetchUserProfile` will set loading to false.
        // Avoid re-fetch if server already provided profile
        if (!hasServerSeed) {
          await fetchUserProfile(currentUser.id);
        } else {
          setLoading(false);
        }
      } else {
        // If no user is found (on initial load or after sign out), clear all profile data.
        console.log("No user found, clearing all profile data");
        setProfile(null);
        setAmbassadorProfile(null);
        setClientProfile(null);
        setLoading(false); // We are done loading; there is no user.
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run this effect only once when the provider mounts.

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        ambassadorProfile,
        clientProfile,
        userRole,
        loading,
        signOut,
        refreshProfile,
        clearAuthState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
