"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");
  return user;
}

export async function requireOnboardedProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (!profile || !(profile as any).onboarding_completed) {
    if ((profile as any)?.role === "client") redirect("/onboarding/client");
    if ((profile as any)?.role === "ambassador")
      redirect("/onboarding/ambassador");
  }

  return { user, profile } as const;
}
