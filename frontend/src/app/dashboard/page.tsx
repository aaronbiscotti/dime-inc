"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const { user, profile, ambassadorProfile, clientProfile, signOut } =
    useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button onClick={handleSignOut} variant="outline">
            Sign Out
          </Button>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                You are logged in as a <strong>{profile.role}</strong>.
              </p>
              <p className="text-sm text-gray-500">Email: {user.email}</p>
            </CardContent>
          </Card>

          {profile.role === "ambassador" && ambassadorProfile && (
            <Card>
              <CardHeader>
                <CardTitle>Ambassador Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>
                    <strong>Name:</strong> {ambassadorProfile.full_name}
                  </p>
                  {ambassadorProfile.bio && (
                    <p>
                      <strong>Bio:</strong> {ambassadorProfile.bio}
                    </p>
                  )}
                  {ambassadorProfile.location && (
                    <p>
                      <strong>Location:</strong> {ambassadorProfile.location}
                    </p>
                  )}
                  {ambassadorProfile.instagram_handle && (
                    <p>
                      <strong>Instagram:</strong> @
                      {ambassadorProfile.instagram_handle}
                    </p>
                  )}
                  {ambassadorProfile.tiktok_handle && (
                    <p>
                      <strong>TikTok:</strong> @
                      {ambassadorProfile.tiktok_handle}
                    </p>
                  )}
                  {ambassadorProfile.twitter_handle && (
                    <p>
                      <strong>Twitter:</strong> @
                      {ambassadorProfile.twitter_handle}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {profile.role === "client" && clientProfile && (
            <Card>
              <CardHeader>
                <CardTitle>Client Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>
                    <strong>Company:</strong> {clientProfile.company_name}
                  </p>
                  {clientProfile.company_description && (
                    <p>
                      <strong>Description:</strong>{" "}
                      {clientProfile.company_description}
                    </p>
                  )}
                  {clientProfile.website && (
                    <p>
                      <strong>Website:</strong>{" "}
                      <a
                        href={clientProfile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {clientProfile.website}
                      </a>
                    </p>
                  )}
                  {clientProfile.industry && (
                    <p>
                      <strong>Industry:</strong> {clientProfile.industry}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
