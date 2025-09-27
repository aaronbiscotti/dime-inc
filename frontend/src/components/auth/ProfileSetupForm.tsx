"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/database";

interface ProfileSetupFormProps {
  role: UserRole;
  onComplete?: () => void;
}

export function ProfileSetupForm({ role, onComplete }: ProfileSetupFormProps) {
  const { createProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Client form fields
  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");

  // Ambassador form fields
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [tiktokHandle, setTiktokHandle] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let profileData: any = {};

    if (role === "client") {
      if (!companyName) {
        setError("Company name is required");
        setLoading(false);
        return;
      }
      profileData = {
        company_name: companyName,
        company_description: companyDescription || null,
        website: website || null,
        industry: industry || null,
      };
    } else if (role === "ambassador") {
      if (!fullName) {
        setError("Full name is required");
        setLoading(false);
        return;
      }
      profileData = {
        full_name: fullName,
        bio: bio || null,
        location: location || null,
        instagram_handle: instagramHandle || null,
        tiktok_handle: tiktokHandle || null,
        twitter_handle: twitterHandle || null,
        follower_count: 0,
      };
    }

    const { error } = await createProfile(role, profileData);

    if (error) {
      setError(error.message);
    } else {
      onComplete?.();
    }

    setLoading(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          Complete Your {role === "client" ? "Company" : "Ambassador"} Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {role === "client" ? (
            <>
              <div className="space-y-2">
                <label htmlFor="companyName" className="text-sm font-medium">
                  Company Name *
                </label>
                <Input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter your company name"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="companyDescription"
                  className="text-sm font-medium"
                >
                  Company Description
                </label>
                <textarea
                  id="companyDescription"
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  placeholder="Describe your company"
                  disabled={loading}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-xl resize-none focus:border-blue-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="website" className="text-sm font-medium">
                  Website
                </label>
                <Input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://your-website.com"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="industry" className="text-sm font-medium">
                  Industry
                </label>
                <Input
                  id="industry"
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g., Technology, Fashion, Food"
                  disabled={loading}
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium">
                  Full Name *
                </label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="bio" className="text-sm font-medium">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself"
                  disabled={loading}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-xl resize-none focus:border-blue-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium">
                  Location
                </label>
                <Input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, Country"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="instagramHandle"
                  className="text-sm font-medium"
                >
                  Instagram Handle
                </label>
                <Input
                  id="instagramHandle"
                  type="text"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  placeholder="@username"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="tiktokHandle" className="text-sm font-medium">
                  TikTok Handle
                </label>
                <Input
                  id="tiktokHandle"
                  type="text"
                  value={tiktokHandle}
                  onChange={(e) => setTiktokHandle(e.target.value)}
                  placeholder="@username"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="twitterHandle" className="text-sm font-medium">
                  Twitter Handle
                </label>
                <Input
                  id="twitterHandle"
                  type="text"
                  value={twitterHandle}
                  onChange={(e) => setTwitterHandle(e.target.value)}
                  placeholder="@username"
                  disabled={loading}
                />
              </div>
            </>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating profile...' : 'Complete Setup'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
