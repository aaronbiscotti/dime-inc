"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Failed to sign out:", error);
      // You could add a toast notification here to show the error to the user
    }
  };

  if (!user || !profile) {
    return null;
  }

  return (
    <nav className="bg-white border-b-2 border-gray-300 w-full">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between w-full">
          {/* Logo and Navigation Links */}
          <div className="flex items-center space-x-8">
            <Link 
              href={profile.role === "client" ? "/client-dashboard" : "/ambassador-dashboard"} 
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
                    href="/client-dashboard"
                    className={`text-sm font-medium transition-colors ${
                      pathname === "/client-dashboard"
                        ? "text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Dashboard
                  </Link>
                  
                  <Link
                    href="/campaigns"
                    className={`text-sm font-medium transition-colors ${
                      pathname === "/campaigns"
                        ? "text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Campaigns
                  </Link>

                  <Link
                    href="/explore"
                    className={`text-sm font-medium transition-colors ${
                      pathname === "/explore"
                        ? "text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Explore
                  </Link>

                  <Link
                    href="/chats"
                    className={`text-sm font-medium transition-colors ${
                      pathname === "/chats"
                        ? "text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Chats
                  </Link>

                  <Link
                    href="/profile"
                    className={`text-sm font-medium transition-colors ${
                      pathname.startsWith("/profile")
                        ? "text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Profile
                  </Link>
                </>
              ) : (
                <>
                  {/* Ambassador Navigation */}
                  <Link
                    href="/ambassador-dashboard"
                    className={`text-sm font-medium transition-colors ${
                      pathname === "/ambassador-dashboard"
                        ? "text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Dashboard
                  </Link>

                  <Link
                    href="/profile"
                    className={`text-sm font-medium transition-colors ${
                      pathname.startsWith("/profile")
                        ? "text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Profile
                  </Link>

                  <Link
                    href="/explore"
                    className={`text-sm font-medium transition-colors ${
                      pathname === "/explore"
                        ? "text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Explore
                  </Link>

                  <Link
                    href="/chats"
                    className={`text-sm font-medium transition-colors ${
                      pathname === "/chats"
                        ? "text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Chats
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
