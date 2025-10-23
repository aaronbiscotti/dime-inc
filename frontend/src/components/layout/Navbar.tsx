"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/AuthProvider";
import Image from "next/image";

export function Navbar() {
  const { user, profile, loading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(); // Call the AuthProvider's signOut to clear local state
    router.push("/"); // Then navigate to root
  };

  // Show loading skeleton while auth state is being determined
  if (loading) {
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

  if (!user || !profile) {
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
                profile.role === "client"
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
              {profile.role === "client" ? (
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
                    Dashboard
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
                    href="/chats"
                    className={`text-sm font-medium transition-colors ${
                      pathname === "/chats"
                        ? "text-yellow-600 font-bold"
                        : "text-gray-600 hover:text-yellow-600 font-bold"
                    }`}
                  >
                    Chats
                  </Link>

                  <Link
                    href="/profile"
                    className={`text-sm font-medium transition-colors ${
                      pathname.startsWith("/profile")
                        ? "text-yellow-600 font-bold"
                        : "text-gray-600 hover:text-yellow-600 font-bold"
                    }`}
                  >
                    Profile
                  </Link>

                  {/* Contracts (Client only) */}
                  <Link
                    href="/contracts"
                    className={`text-sm font-medium transition-colors ${
                      pathname.startsWith("/contracts")
                        ? "text-yellow-600 font-bold"
                        : "text-gray-600 hover:text-yellow-600 font-bold"
                    }`}
                  >
                    Contracts
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
                    Dashboard
                  </Link>

                  <Link
                    href="/profile"
                    className={`text-sm font-medium transition-colors ${
                      pathname.startsWith("/profile")
                        ? "text-yellow-600 font-bold"
                        : "text-gray-600 hover:text-yellow-600 font-bold"
                    }`}
                  >
                    Profile
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
                    Chats
                  </Link>

                  <Link
                    href="/contracts"
                    className={`text-sm font-medium transition-colors ${
                      pathname.startsWith("/contracts")
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

          {/* Sign Out Button */}
          <div>
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
