import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Database } from "@/types/database";

type UserRole = Database["public"]["Enums"]["user_role"];

export interface AuthUser {
  id: string;
  email?: string;
  role: UserRole;
  onboarding_completed: boolean;
}

export interface AuthProfile {
  ambassadorProfile?: Database["public"]["Tables"]["ambassador_profiles"]["Row"];
  clientProfile?: Database["public"]["Tables"]["client_profiles"]["Row"];
}

/**
 * Get the authenticated user with their profile data
 * Redirects to login if not authenticated
 */
export async function getAuthenticatedUser(): Promise<AuthUser> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/signin");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, role, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/signin");
  }

  return {
    id: profile.id,
    email: profile.email || undefined,
    role: profile.role,
    onboarding_completed: profile.onboarding_completed || false,
  };
}

/**
 * Get the authenticated user with their role-specific profile data
 * Redirects to login if not authenticated
 */
export async function getAuthenticatedUserWithProfile(): Promise<
  AuthUser & AuthProfile
> {
  const user = await getAuthenticatedUser();
  const supabase = await createClient();

  let ambassadorProfile:
    | Database["public"]["Tables"]["ambassador_profiles"]["Row"]
    | undefined;
  let clientProfile:
    | Database["public"]["Tables"]["client_profiles"]["Row"]
    | undefined;

  if (user.role === "ambassador") {
    const { data } = await supabase
      .from("ambassador_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    ambassadorProfile = data || undefined;
  } else if (user.role === "client") {
    const { data } = await supabase
      .from("client_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    clientProfile = data || undefined;
  }

  return {
    ...user,
    ambassadorProfile,
    clientProfile,
  };
}

/**
 * Check if user has completed onboarding
 * Redirects to onboarding if not completed
 */
export async function requireOnboardingCompleted(): Promise<AuthUser> {
  const user = await getAuthenticatedUser();

  if (!user.onboarding_completed) {
    redirect(`/onboarding/${user.role}`);
  }

  return user;
}

/**
 * Check if user has a specific role
 * Redirects to appropriate dashboard if role doesn't match
 */
export async function requireRole(requiredRole: UserRole): Promise<AuthUser> {
  const user = await requireOnboardingCompleted();

  if (user.role !== requiredRole) {
    const redirectPath =
      user.role === "client" ? "/client-dashboard" : "/ambassador-dashboard";
    redirect(redirectPath);
  }

  return user;
}

/**
 * Check if user is an ambassador
 * Redirects to client dashboard if not an ambassador
 */
export async function requireAmbassador(): Promise<AuthUser> {
  return requireRole("ambassador");
}

/**
 * Check if user is a client
 * Redirects to ambassador dashboard if not a client
 */
export async function requireClient(): Promise<AuthUser> {
  return requireRole("client");
}

/**
 * Get user with role-specific profile, ensuring they have the correct role
 */
export async function getAmbassadorWithProfile(): Promise<
  AuthUser & {
    ambassadorProfile: Database["public"]["Tables"]["ambassador_profiles"]["Row"];
  }
> {
  const user = await requireAmbassador();
  const supabase = await createClient();

  const { data: ambassadorProfile, error } = await supabase
    .from("ambassador_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error || !ambassadorProfile) {
    redirect("/onboarding/ambassador");
  }

  return {
    ...user,
    ambassadorProfile,
  };
}

/**
 * Get user with role-specific profile, ensuring they have the correct role
 */
export async function getClientWithProfile(): Promise<
  AuthUser & {
    clientProfile: Database["public"]["Tables"]["client_profiles"]["Row"];
  }
> {
  const user = await requireClient();
  const supabase = await createClient();

  const { data: clientProfile, error } = await supabase
    .from("client_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error || !clientProfile) {
    redirect("/onboarding/client");
  }

  return {
    ...user,
    clientProfile,
  };
}
