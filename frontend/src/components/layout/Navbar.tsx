"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/AuthProvider";
import { signOut } from "@/app/auth/actions";
import Image from "next/image";
import type { User } from "@supabase/supabase-js";

type Props = {
  initialUser?: User | null;
  initialProfile?: {
    id: string;
    role?: string;
    full_name?: string;
    avatar_url?: string;
  } | null;
};

export default function Navbar({ initialUser, initialProfile }: Props) {
  const { user, profile, loading, clearAuthState } = useAuth();

  // Prefer server truth for first paint; hydrate to client state later.
  const effectiveUser = user ?? initialUser;
  const effectiveProfile = profile ?? initialProfile ?? null;
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const handleSignOut = async () => {
    if (signingOut) return; // Prevent multiple clicks

    setSigningOut(true);
    try {
      // Clear client-side state immediately for better UX
      clearAuthState();

      // Call server action to sign out and redirect
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
      // Even if there's an error, clear local state and redirect
      clearAuthState();
      // Force a hard refresh to ensure all server state is cleared
      window.location.href = "/";
    } finally {
      setSigningOut(false);
    }
  };

  // Show loading skeleton only if we have no server-provided auth fallback
  const hasServerSeed = Boolean(initialUser && initialProfile);
  if (loading && !hasServerSeed) {
    return (
      <nav className="bg-white border-b border-gray-300 w-full">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-8">
              <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
              <div className="flex space-x-6">
                <div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-4 w-18 bg-gray-200 animate-pulse rounded"></div>
              </div>
            </div>
            <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
      </nav>
    );
  }

  if (!effectiveUser || !effectiveProfile) {
    return null;
  }

  return (
    <nav className="bg-white border-b border-gray-300 w-full">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between w-full">
          {/* Logo and Navigation Links */}
          <div className="flex items-center space-x-8">
            <Link
              href={
                effectiveProfile.role === "client"
                  ? "/client/dashboard"
                  : "/ambassador/dashboard"
              }
              className="flex items-center"
            >
              <Image
                src="/logo.svg"
                alt="Dime Logo"
                width={32}
                height={32}
                className="mr-3"
              />
              <span className="text-xl font-semibold text-gray-900">Dime</span>
            </Link>

            <div className="flex items-center space-x-6">
              {effectiveProfile.role === "client" ? (
                <>
                  {/* Client Navigation */}
                  <Link
                    href="/client/dashboard"
                    className={`text-sm font-medium transition-colors ${
                      pathname === "/client/dashboard"
                        ? "text-yellow-600 font-bold"
                        : "text-gray-600 hover:text-yellow-600 font-bold"
                    }`}
                  >
                    Overview
                  </Link>

                  <Link
                    href="/campaigns"
                    className={`text-sm font-medium transition-colors ${
                      pathname === "/campaigns"
                        ? "text-yellow-600 font-bold"
                        : "text-gray-600 hover:text-yellow-600 font-bold"
                    }`}
                  >
                    Campaigns
                  </Link>

                  <Link
                    href="/explore"
                    className={`text-sm font-medium transition-colors ${
                      pathname === "/explore"
                        ? "text-yellow-600 font-bold"
                        : "text-gray-600 hover:text-yellow-600 font-bold"
                    }`}
                  >
                    Explore
                  </Link>

                  <Link
                    href="/contracts"
                    className={`text-sm font-medium transition-colors ${
                      pathname === "/contracts"
                        ? "text-yellow-600 font-bold"
                        : "text-gray-600 hover:text-yellow-600 font-bold"
                    }`}
                  >
                    Contracts
                  </Link>

                  <Link
                    href="/chats"
                    className={`text-sm font-medium transition-colors ${
                      pathname === "/chats"
                        ? "text-yellow-600 font-bold"
                        : "text-gray-600 hover:text-yellow-600 font-bold"
                    }`}
                  >
                    Messages
                  </Link>
                </>
              ) : (
                <>
                  {/* Ambassador Navigation */}
                  <Link
                    href="/ambassador/dashboard"
                    className={`text-sm font-medium transition-colors ${
                      pathname === "/ambassador/dashboard"
                        ? "text-yellow-600 font-bold"
                        : "text-gray-600 hover:text-yellow-600 font-bold"
                    }`}
                  >
                    Overview
                  </Link>

                  <Link
                    href="/explore"
                    className={`text-sm font-medium transition-colors ${
                      pathname === "/explore"
                        ? "text-yellow-600 font-bold"
                        : "text-gray-600 hover:text-yellow-600 font-bold"
                    }`}
                  >
                    Explore
                  </Link>

                  <Link
                    href="/chats"
                    className={`text-sm font-medium transition-colors ${
                      pathname === "/chats"
                        ? "text-yellow-600 font-bold"
                        : "text-gray-600 hover:text-yellow-600 font-bold"
                    }`}
                  >
                    Messages
                  </Link>
                  <Link
                    href="/contracts"
                    className={`text-sm font-medium transition-colors ${
                      pathname === "/contracts"
                        ? "text-yellow-600 font-bold"
                        : "text-gray-600 hover:text-yellow-600 font-bold"
                    }`}
                  >
                    Contracts
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right side: Search + Profile menu */}
          <div className="flex items-center gap-4 relative" ref={menuRef}>
            <div className="hidden md:block">
              <input
                placeholder="Search influencers..."
                className="px-3 py-1.5 border border-gray-300 rounded-full text-sm focus:outline-none"
              />
            </div>
            <button
              onClick={() => setMenuOpen((s) => !s)}
              className="flex items-center gap-2"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
           >
              <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                {effectiveProfile?.avatar_url ? (
                  <Image
                    src={effectiveProfile.avatar_url}
                    alt={effectiveProfile.full_name || "Profile"}
                    width={36}
                    height={36}
                    className="w-9 h-9 object-cover"
                  />
                ) : (
                  <span className="text-gray-700 text-sm font-semibold">
                    {(effectiveProfile?.full_name || "U").charAt(0)}
                  </span>
                )}
              </div>
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-12 w-40 bg-white border border-gray-200 rounded-lg shadow-md z-50"
                role="menu"
              >
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                  onClick={() => {
                    setMenuOpen(false);
                    router.push("/profile");
                  }}
                >
                  Profile
                </button>
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                  onClick={handleSignOut}
                  disabled={signingOut}
                >
                  {signingOut ? "Signing out..." : "Sign out"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
