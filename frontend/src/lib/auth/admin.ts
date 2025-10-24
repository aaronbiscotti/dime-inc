import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getAdminEmails(): Promise<string[]> {
  const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return false;
  const admins = await getAdminEmails();
  return admins.includes(user.email.toLowerCase());
}

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");
  const ok = await isAdmin();
  if (!ok) redirect("/");
  return user;
}

