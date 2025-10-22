"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { UserRole } from "@/types/database";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const expectedRole = formData.get("expected_role") as UserRole | null;

  // 1. Validate role first if required
  if (expectedRole) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("email", email)
      .single();

    if (profile && profile.role !== expectedRole) {
      return { error: `This is the login page for a ${expectedRole}. You have a ${profile.role} account.` };
    }
  }

  // 2. Sign in the user
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Login error:", error.message);
    return { error: "Invalid login credentials." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as UserRole;
  
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: role,
      },
    },
  });

  if (error) {
      console.error("Signup error:", error.message);
      return { error: "Could not authenticate user." };
  }
  
  revalidatePath("/", "layout");
  // The onAuthStateChange listener will handle the redirect to profile setup
  return { error: null };
}

export async function createProfile(role: UserRole, profileData: Record<string, unknown>) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "User is not authenticated." };
  }

  const dataToInsert = {
    ...profileData,
    user_id: user.id,
  };

  let error;

  if (role === 'client') {
    ({ error } = await supabase.from('client_profiles').insert(dataToInsert));
  } else if (role === 'ambassador') {
    ({ error } = await supabase.from('ambassador_profiles').insert(dataToInsert));
  } else {
    return { error: "Invalid user role provided." };
  }

  if (error) {
    console.error("Profile creation error:", error.message);
    return { error: "Could not create user profile." };
  }

  // Revalidate the cache to ensure profile data is fresh
  revalidatePath("/", "layout");
  return { error: null };
}
