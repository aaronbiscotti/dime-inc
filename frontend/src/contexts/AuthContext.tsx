"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Profile,
  UserRole,
  AmbassadorProfile,
  ClientProfile,
} from "@/types/database";

// Define a simpler User type since we're no longer using Supabase's User type
interface User {
  id: string;
  email: string;
}

interface Session {
  user: User;
  access_token?: string;
}

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
  ) => Promise<{ error: string | null }>;
  signIn: (
    email: string,
    password: string,
    expectedRole?: UserRole
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  createProfile: (
    role: UserRole,
    profileData: Record<string, unknown>
  ) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { API_URL } from "@/config/api";

// API base URL from centralized config
const API_BASE_URL = API_URL;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    ambassadorProfile: null,
    clientProfile: null,
    loading: true,
  });

  // Initialize auth on mount - check for auth cookie via backend
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Verify auth cookie with backend and get user data
        // Cookie is automatically sent by browser (httpOnly, secure)
        const response = await fetch(`${API_BASE_URL}/api/users/me`, {
          credentials: "include", // Send cookies
        });

        if (response.ok) {
          // Backend confirmed auth cookie is valid, get user data
          const userData = await response.json();

          setState({
            user: { id: userData.id, email: userData.email },
            session: {
              user: { id: userData.id, email: userData.email },
              access_token: "cookie-based", // Token is in httpOnly cookie, not accessible
            },
            profile: userData.profile || null,
            ambassadorProfile: userData.ambassador_profile || null,
            clientProfile: userData.client_profile || null,
            loading: false,
          });
        } else {
          // Backend said no valid auth cookie found
          setState({
            user: null,
            session: null,
            profile: null,
            ambassadorProfile: null,
            clientProfile: null,
            loading: false,
          });
        }
      } catch (error) {
        // Network error, backend is down, etc.
        console.error("Failed to authenticate with backend", error);
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

    initializeAuth();
  }, []); // This hook runs only ONCE when the app loads

  const signUp = async (email: string, password: string, role: UserRole) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.detail || "Signup failed" };
      }

      return { error: null };
    } catch {
      return { error: "Network error during signup" };
    }
  };

  const signIn = async (
    email: string,
    password: string,
    expectedRole?: UserRole
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, expected_role: expectedRole }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { error: data.detail || "Invalid login credentials" };
      }

      await refreshProfile(); // Fetches user data after successful login
      return { error: null };
    } catch (err) {
      return { error: "Network error during login" };
    }
  };

  const signOut = async () => {
    try {
      // Call backend logout endpoint to clear httpOnly cookie
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include", // Send cookie to be cleared
      });

      // Clear all auth-related storage (if any)
      try {
        sessionStorage.clear();
        // Remove any legacy tokens
        localStorage.removeItem("auth-token");
      } catch (storageError) {
        console.warn("Could not clear session storage:", storageError);
      }

      // Clear state
      setState({
        user: null,
        session: null,
        profile: null,
        ambassadorProfile: null,
        clientProfile: null,
        loading: false,
      });
    } catch (error) {
      console.error("Sign out error:", error);
      // Even if backend fails, clear local state
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

  const createProfile = async (
    role: UserRole,
    profileData: Record<string, unknown>
  ) => {
    if (!state.user) {
      return { error: new Error("No user logged in") };
    }

    try {
      const endpoint =
        role === "ambassador"
          ? `${API_BASE_URL}/api/profiles/ambassador`
          : `${API_BASE_URL}/api/profiles/client`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Send auth cookie
        body: JSON.stringify({
          user_id: state.user.id,
          ...profileData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.detail || "Failed to create profile" };
      }

      // Refresh profile data
      await refreshProfile();

      return { error: null };
    } catch {
      return { error: "Network error during profile creation" };
    }
  };

  const refreshProfile = async () => {
    if (!state.user) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        credentials: "include", // Send auth cookie
      });

      if (response.ok) {
        const userData = await response.json();

        setState((prev) => ({
          ...prev,
          profile: userData.profile || null,
          ambassadorProfile: userData.ambassador_profile || null,
          clientProfile: userData.client_profile || null,
        }));
      }
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
