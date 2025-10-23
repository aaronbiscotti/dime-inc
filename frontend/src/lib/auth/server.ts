import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getServerUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return user;
}

export async function getServerProfile(userId: string) {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    redirect("/signin");
  }

  return profile;
}

export async function requireClientRole(userId: string) {
  const profile = await getServerProfile(userId);

  if (profile.role !== "client") {
    redirect("/ambassador/dashboard"); // role-aware redirect
  }

  if (!profile.onboarding_completed) {
    redirect(`/onboarding/${profile.role}`);
  }

  return profile;
}

export async function requireRole(
  role: "client" | "ambassador",
  userId: string
) {
  const profile = await getServerProfile(userId);

  if (profile.role !== role) {
    // Role-aware redirects
    if (role === "client") {
      redirect("/ambassador/dashboard");
    } else {
      redirect("/client/dashboard");
    }
  }

  if (!profile.onboarding_completed) {
    redirect(`/onboarding/${profile.role}`);
  }

  return profile;
}

// Legacy function names for backward compatibility
export async function getAuthenticatedUser() {
  return getServerUser();
}

export async function getClientWithProfile(userId?: string) {
  const user = userId ? { id: userId } : await getServerUser();
  const profile = await requireClientRole(user.id);

  // Fetch the actual client profile data
  const supabase = await createClient();
  const { data: clientProfile } = await supabase
    .from("client_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return { user, profile, clientProfile };
}

export async function getAmbassadorWithProfile(userId?: string) {
  const user = userId ? { id: userId } : await getServerUser();
  const profile = await requireRole("ambassador", user.id);

  // Fetch the actual ambassador profile data
  const supabase = await createClient();
  const { data: ambassadorProfile } = await supabase
    .from("ambassador_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return { user, profile, ambassadorProfile };
}
