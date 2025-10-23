import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_PREFIXES = ["/client", "/ambassador", "/campaigns"];

export async function middleware(request: NextRequest) {
  const res = await updateSession(request);

  // Avoid redirect loops by ignoring already-on-target dashboard
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isProtected) return res;
  return res; // all auth gating happens in server pages via requireUser
}

export const config = {
  matcher: ["/(client|ambassador)(/.*)?", "/campaigns/:path*"],
};
