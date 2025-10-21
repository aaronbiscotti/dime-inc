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

// API base URL - adjust this based on your environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    ambassadorProfile: null,
    clientProfile: null,
    loading: true,
  });

  // Initialize auth on mount - check for existing token and validate it
  useEffect(() => {
    const initializeAuth = async () => {
      // 1. Get the token stored after login
      const token = localStorage.getItem('auth-token');

      if (!token) {
        // No token found, user is not logged in
        setState({ 
          user: null, 
          session: null, 
          profile: null, 
          ambassadorProfile: null,
          clientProfile: null,
          loading: false 
        });
        return;
      }

      try {
        // 2. Verify token with backend and get user data
        const response = await fetch(`${API_BASE_URL}/api/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          // 3. Backend confirmed token is valid, get user data
          const userData = await response.json();
          
          setState({
            user: { id: userData.id, email: userData.email },
            session: { 
              user: { id: userData.id, email: userData.email },
              access_token: token 
            },
            profile: userData.profile || null,
            ambassadorProfile: userData.ambassador_profile || null,
            clientProfile: userData.client_profile || null,
            loading: false
          });
        } else {
          // 4. Backend said token is invalid (expired, etc.)
          localStorage.removeItem('auth-token');
          setState({ 
            user: null, 
            session: null, 
            profile: null, 
            ambassadorProfile: null,
            clientProfile: null,
            loading: false 
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
          loading: false 
        });
      }
    };

    initializeAuth();
  }, []); // This hook runs only ONCE when the app loads

  const signUp = async (email: string, password: string, role: UserRole) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: { message: data.detail || 'Signup failed' } };
      }

      return { error: null };
    } catch (error) {
      return { error: { message: 'Network error during signup' } };
    }
  };

  const signIn = async (
    email: string,
    password: string,
    expectedRole?: UserRole
  ) => {
    try {
      // First validate credentials and role with the validate-login endpoint
      if (expectedRole) {
        const validateResponse = await fetch(`${API_BASE_URL}/api/auth/validate-login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, expected_role: expectedRole }),
        });

        const validateData = await validateResponse.json();

        if (!validateData.valid) {
          return { 
            error: { 
              message: validateData.message,
              code: validateData.error_type === 'role_mismatch' ? 'ROLE_MISMATCH' : 'INVALID_CREDENTIALS',
              userRole: validateData.user_role
            } 
          };
        }
      }

      // Now sign in with the login endpoint
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: { message: data.detail || 'Invalid login credentials' } };
      }

      // Store the access token
      const accessToken = data.access_token;
      localStorage.setItem('auth-token', accessToken);

      // Fetch user profile with the new token
      const meResponse = await fetch(`${API_BASE_URL}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (meResponse.ok) {
        const userData = await meResponse.json();
        
        setState({
          user: { id: userData.id, email: userData.email },
          session: { 
            user: { id: userData.id, email: userData.email },
            access_token: accessToken 
          },
          profile: userData.profile || null,
          ambassadorProfile: userData.ambassador_profile || null,
          clientProfile: userData.client_profile || null,
          loading: false
        });

        return { error: null };
      } else {
        localStorage.removeItem('auth-token');
        return { error: { message: 'Failed to fetch user data' } };
      }
    } catch (error) {
      return { error: { message: 'Network error during login' } };
    }
  };

  const signOut = async () => {
    try {
      // Clear token from storage
      localStorage.removeItem('auth-token');
      
      // Clear all auth-related storage
      try {
        sessionStorage.clear();
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
    }
  };

  const createProfile = async (role: UserRole, profileData: Record<string, any>) => {
    if (!state.user || !state.session?.access_token) {
      return { error: new Error("No user logged in") };
    }

    try {
      const endpoint = role === "ambassador" 
        ? `${API_BASE_URL}/api/profiles/ambassador`
        : `${API_BASE_URL}/api/profiles/client`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.session.access_token}`
        },
        body: JSON.stringify({
          user_id: state.user.id,
          ...profileData
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: { message: data.detail || 'Failed to create profile' } };
      }

      // Refresh profile data
      await refreshProfile();

      return { error: null };
    } catch (error) {
      return { error: { message: 'Network error during profile creation' } };
    }
  };

  const refreshProfile = async () => {
    if (!state.session?.access_token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${state.session.access_token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        
        setState(prev => ({
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
