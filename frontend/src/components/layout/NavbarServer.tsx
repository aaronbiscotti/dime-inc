// Server Component: reads auth on the server and seeds the Navbar
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Database } from "@/types/database";
import Navbar from "./Navbar";

export default async function NavbarServer() {
  // Read cookies for SSR auth
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const c = cookieStore.get(name);
          return c?.value;
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch the profile/role here for the navbar
  let profile = null;
  if (user) {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileData && !profileError) {
      // Get additional profile info from ambassador_profiles if user is ambassador
      let fullName = null;
      let avatarUrl = null;

      if (profileData.role === "ambassador") {
        const { data: ambassadorProfile } = await supabase
          .from("ambassador_profiles")
          .select("full_name, profile_photo_url")
          .eq("user_id", user.id)
          .maybeSingle();

        if (ambassadorProfile) {
          fullName = ambassadorProfile.full_name;
          avatarUrl = ambassadorProfile.profile_photo_url;
        }
      }

      profile = {
        id: profileData.id,
        role: profileData.role,
        full_name: fullName || undefined,
        avatar_url: avatarUrl || undefined,
      };
    }
  }

  return <Navbar initialUser={user ?? null} initialProfile={profile ?? null} />;
}
