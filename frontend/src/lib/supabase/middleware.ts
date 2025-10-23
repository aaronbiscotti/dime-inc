import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  const url = request.nextUrl.clone();
  const path = url.pathname;

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookies.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicEntry =
    path === "/" ||
    path.startsWith("/signin") ||
    path.startsWith("/signup") ||
    path === "/login";
  const isOnboarding = path.startsWith("/onboarding");

  if (user) {
    // Fetch minimal profile flags used for routing
    const { data: profile } = await supabase
      .from("profiles")
      .select("role,onboarding_completed")
      .eq("id", user.id)
      .single();

    // If no profile exists, redirect to signin to complete registration
    if (!profile) {
      url.pathname = "/signin";
      return NextResponse.redirect(url);
    }

    const role = profile.role;
    const targetDash =
      role === "ambassador" ? "/ambassador/dashboard" : "/client/dashboard";

    // 1) If onboarding not done, send to onboarding unless we're already there
    if (!profile.onboarding_completed && !isOnboarding) {
      url.pathname = `/onboarding/${role}`;
      if (path !== url.pathname) return NextResponse.redirect(url);
      return response;
    }

    // 2) If already onboarded and we're on a public entry route, send to *their* dashboard
    if (profile.onboarding_completed && isPublicEntry && path !== targetDash) {
      url.pathname = targetDash;
      return NextResponse.redirect(url);
    }

    // 3) Never redirect dashboard → dashboard
    if (path === targetDash) return response;
  } else {
    // Block anonymous users from protected areas; let public pages pass
    const isProtected =
      path.startsWith("/client") ||
      path.startsWith("/ambassador") ||
      path.startsWith("/contracts") ||
      path.startsWith("/chats");

    if (
      isProtected &&
      !path.startsWith("/signin") &&
      !path.startsWith("/signup")
    ) {
      url.pathname = "/signin";
      return NextResponse.redirect(url);
    }
  }

  // Optional dev/prod cache guard for some Next builds:
  // response.headers.set("x-middleware-cache", "no-cache");

  return response;
}
