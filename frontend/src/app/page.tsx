"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user, profile, ambassadorProfile, clientProfile, loading } =
    useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && profile) {
      // Check if user has completed their role-specific profile
      const hasCompleteProfile =
        (profile.role === "ambassador" && ambassadorProfile) ||
        (profile.role === "client" && clientProfile);

      // If user has a complete profile, redirect to dashboard
      if (hasCompleteProfile) {
        router.push("/dashboard");
      }
    }
  }, [user, profile, ambassadorProfile, clientProfile, loading, router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <Image
            src="/logo.svg"
            alt="Dime Logo"
            width={150}
            height={75}
            className="mx-auto mb-4"
          />
          <CardTitle className="text-2xl">
            How are you joining us today?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/login/brand-ambassador" className="block h-full">
              <Card className="cursor-pointer transition-all duration-150 rounded-xl border border-gray-300 bg-background hover:bg-gray-50 h-full">
                <CardContent className="p-8 text-center h-full flex flex-col justify-center">
                  <div className="text-4xl mb-4">📸</div>
                  <h3 className="text-xl font-semibold mb-2">
                    I&apos;m a Brand Ambassador
                  </h3>
                  <p className="text-muted-foreground">
                    I create content and partner with brands.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/login/client" className="block h-full">
              <Card className="cursor-pointer transition-all duration-150 rounded-xl border border-gray-300 bg-background hover:bg-gray-50 h-full">
                <CardContent className="p-8 text-center h-full flex flex-col justify-center">
                  <div className="text-4xl mb-4">🏢</div>
                  <h3 className="text-xl font-semibold mb-2">
                    I&apos;m a Client
                  </h3>
                  <p className="text-muted-foreground">
                    I&apos;m looking for talent for my brand.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
