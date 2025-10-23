"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Database } from "@/types/database";

type UserRole = Database["public"]["Enums"]["user_role"];

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as UserRole;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: role,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If email confirmation is disabled, return redirect path
  if (data.user) {
    revalidatePath("/", "layout");
    return {
      success: true,
      redirectTo: `/onboarding/${role}`,
    };
  }

  return {
    success: true,
    message: "Check your email to confirm your account!",
  };
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Get user profile to determine redirect destination
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication failed" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, role")
    .eq("id", user.id)
    .single();

  revalidatePath("/", "layout");
  revalidatePath("/client/dashboard", "layout");
  revalidatePath("/ambassador/dashboard", "layout");

  // Return the redirect path instead of redirecting
  if (!profile || !profile.onboarding_completed) {
    return {
      success: true,
      redirectTo: `/onboarding/${profile?.role || "client"}`,
    };
  }

  const dashboardPath =
    profile.role === "client" ? "/client/dashboard" : "/ambassador/dashboard";

  return { success: true, redirectTo: dashboardPath };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Clear all cached data
  revalidatePath("/", "layout");
  revalidatePath("/client/dashboard", "layout");
  revalidatePath("/ambassador/dashboard", "layout");

  redirect("/");
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}
