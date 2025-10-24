// Server component that seeds the client AuthProvider with initial auth state
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { Providers } from "./providers";

export default async function ProvidersServer({
  children,
}: {
  children: React.ReactNode;
}) {
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

  let profile: Database["public"]["Tables"]["profiles"]["Row"] | null = null;
  let ambassadorProfile:
    | Database["public"]["Tables"]["ambassador_profiles"]["Row"]
    | null = null;
  let clientProfile:
    | Database["public"]["Tables"]["client_profiles"]["Row"]
    | null = null;

  if (user) {
    const { data: baseProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    profile = baseProfile ?? null;

    if (profile?.role === "ambassador") {
      const { data } = await supabase
        .from("ambassador_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      ambassadorProfile = data ?? null;
    } else if (profile?.role === "client") {
      const { data } = await supabase
        .from("client_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      clientProfile = data ?? null;
    }
  }

  return (
    <Providers
      initialUser={user ?? null}
      initialProfile={profile}
      initialAmbassadorProfile={ambassadorProfile}
      initialClientProfile={clientProfile}
    >
      {children}
    </Providers>
  );
}

