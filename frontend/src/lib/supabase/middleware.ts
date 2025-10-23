import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  // Create an initial response; we will mutate cookies on this response.
  let response = NextResponse.next();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Read the incoming cookies
        getAll: () => request.cookies.getAll(),
        // IMPORTANT: write mutated cookies onto the OUTGOING RESPONSE,
        // not onto the request. This is what actually updates the browser.
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Touch the auth session so Supabase can refresh / clear cookies as needed.
  // If this fails, we still let the request pass through.
  await supabase.auth.getUser().catch(() => {});

  // Get user and handle authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    // If user is not logged in, allow them to access auth pages or the root page
    const isAuthPath =
      request.nextUrl.pathname.startsWith("/signin") ||
      request.nextUrl.pathname.startsWith("/signup") ||
      request.nextUrl.pathname.startsWith("/login");
    if (isAuthPath || request.nextUrl.pathname === "/") {
      return response;
    }

    // For any other page, redirect to root if not logged in
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    return NextResponse.redirect(redirectUrl);
  }

  // --- If user IS logged in ---

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, role")
    .eq("id", user.id)
    .single();

  const isOnboardingRoute = request.nextUrl.pathname.startsWith("/onboarding");
  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/signin") ||
    request.nextUrl.pathname.startsWith("/signup") ||
    request.nextUrl.pathname.startsWith("/login");
  const isRootRoute = request.nextUrl.pathname === "/";

  // If user exists but profile is not yet created (transient state after signup)
  // or there was an error, redirect to root to retry. Don't let them hit a protected page.
  if (!profile) {
    if (isOnboardingRoute || isAuthRoute || isRootRoute) {
      // Allow them to be on these pages during this transient state
      return response;
    }
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    console.log(
      "No profile found for authenticated user, redirecting to root."
    );
    return NextResponse.redirect(redirectUrl);
  }

  // If user hasn't completed onboarding, force them to the onboarding page
  if (!profile.onboarding_completed && !isOnboardingRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/onboarding/${profile.role}`;
    console.log("Redirecting to onboarding:", redirectUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user has completed onboarding, prevent them from accessing auth, onboarding, or root pages
  if (
    profile.onboarding_completed &&
    (isAuthRoute || isOnboardingRoute || isRootRoute)
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname =
      profile.role === "client" ? "/client/dashboard" : "/ambassador/dashboard";
    console.log(
      "Redirecting authenticated, onboarded user to their dashboard:",
      redirectUrl.pathname
    );
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect old /dashboard route to role-specific dashboard
  if (
    profile.onboarding_completed &&
    request.nextUrl.pathname === "/dashboard"
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname =
      profile.role === "client" ? "/client/dashboard" : "/ambassador/dashboard";
    console.log("Redirecting from /dashboard to:", redirectUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Role-based route protection
  if (profile.onboarding_completed) {
    const isAmbassadorOnlyRoute =
      request.nextUrl.pathname.startsWith("/ambassador");
    const isClientOnlyRoute =
      request.nextUrl.pathname.startsWith("/client") ||
      request.nextUrl.pathname.startsWith("/contracts") ||
      request.nextUrl.pathname.startsWith("/campaigns");

    // If ambassador tries to access client-only routes
    if (profile.role === "ambassador" && isClientOnlyRoute) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/ambassador/dashboard";
      console.log(
        "Ambassador trying to access client route, redirecting to ambassador dashboard"
      );
      return NextResponse.redirect(redirectUrl);
    }

    // If client tries to access ambassador-only routes
    if (profile.role === "client" && isAmbassadorOnlyRoute) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/client/dashboard";
      console.log(
        "Client trying to access ambassador route, redirecting to client dashboard"
      );
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}
