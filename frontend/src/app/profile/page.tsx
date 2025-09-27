"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/layout/Navbar";
import { ProfileSkeleton } from "@/components/skeletons/ProfileSkeleton";
import {
  Plus,
  Instagram,
  Twitter,
  MapPin,
  Calendar,
  ExternalLink,
  Users,
  DollarSign,
  Clock,
} from "lucide-react";
import Image from "next/image";

export default function Profile() {
  const { user, profile, ambassadorProfile, clientProfile, loading } =
    useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!user || !profile) {
    return null;
  }

  // Data arrays for when we have real data
  const portfolioItems = []; // TODO: Fetch from database
  const campaigns = []; // TODO: Fetch from database

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Profile Info */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardContent>
                {/* Banner Area */}
                <div className="h-32 bg-gradient-to-r from-[#f5d82e] to-[#FEE65D] rounded-xl mb-6 relative">
                  <div className="absolute -bottom-6 left-6">
                    <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 overflow-hidden">
                      {profile.role === "ambassador" &&
                      ambassadorProfile?.profile_photo_url ? (
                        <Image
                          src={ambassadorProfile.profile_photo_url}
                          alt={ambassadorProfile.full_name}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      ) : profile.role === "client" &&
                        clientProfile?.logo_url ? (
                        <Image
                          src={clientProfile.logo_url}
                          alt={clientProfile.company_name}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 text-xl font-semibold">
                          {profile.role === "ambassador" && ambassadorProfile
                            ? ambassadorProfile.full_name.charAt(0)
                            : profile.role === "client" && clientProfile
                            ? clientProfile.company_name.charAt(0)
                            : "?"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="mt-8 space-y-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      {profile.role === "ambassador" && ambassadorProfile
                        ? ambassadorProfile.full_name
                        : profile.role === "client" && clientProfile
                        ? clientProfile.company_name
                        : "Profile"}
                    </h2>
                    <p className="text-gray-600">
                      @
                      {profile.role === "ambassador" && ambassadorProfile
                        ? ambassadorProfile.full_name
                            .toLowerCase()
                            .replace(/\s+/g, "")
                        : profile.role === "client" && clientProfile
                        ? clientProfile.company_name
                            .toLowerCase()
                            .replace(/\s+/g, "")
                        : "user"}
                    </p>
                  </div>

                  {/* Bio/Description */}
                  {profile.role === "ambassador" && ambassadorProfile?.bio && (
                    <p className="text-gray-700 leading-relaxed">
                      {ambassadorProfile.bio}
                    </p>
                  )}
                  {profile.role === "client" &&
                    clientProfile?.company_description && (
                      <p className="text-gray-700 leading-relaxed">
                        {clientProfile.company_description}
                      </p>
                    )}

                  {/* Details */}
                  <div className="space-y-2">
                    {/* Ambassador specific details */}
                    {profile.role === "ambassador" && ambassadorProfile && (
                      <>
                        {ambassadorProfile.location && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">
                              {ambassadorProfile.location}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">
                            Joined{" "}
                            {new Date(
                              ambassadorProfile.created_at
                            ).toLocaleDateString("en-US", {
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </>
                    )}

                    {/* Client specific details */}
                    {profile.role === "client" && clientProfile && (
                      <>
                        {clientProfile.industry && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <div className="w-4 h-4 bg-gray-600 rounded-sm flex items-center justify-center text-white text-xs font-semibold">
                              I
                            </div>
                            <span className="text-sm">
                              {clientProfile.industry}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">
                            Joined{" "}
                            {new Date(
                              clientProfile.created_at
                            ).toLocaleDateString("en-US", {
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-semibold text-gray-900">
                            {campaigns.length}
                          </span>{" "}
                          campaigns created
                        </div>
                      </>
                    )}
                  </div>

                  {/* Social Links / Website */}
                  <div className="space-y-2">
                    {/* Ambassador social links */}
                    {profile.role === "ambassador" && ambassadorProfile && (
                      <>
                        {ambassadorProfile.instagram_handle && (
                          <a
                            href={`https://instagram.com/${ambassadorProfile.instagram_handle.replace(
                              "@",
                              ""
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-gray-600 hover:text-[#f5d82e] transition-colors"
                          >
                            <Instagram className="w-4 h-4" />
                            <span className="text-sm">
                              @
                              {ambassadorProfile.instagram_handle.replace(
                                "@",
                                ""
                              )}
                            </span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {ambassadorProfile.tiktok_handle && (
                          <a
                            href={`https://tiktok.com/@${ambassadorProfile.tiktok_handle.replace(
                              "@",
                              ""
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-gray-600 hover:text-[#f5d82e] transition-colors"
                          >
                            <div className="w-4 h-4 bg-gray-600 rounded-sm flex items-center justify-center text-white text-xs font-semibold">
                              T
                            </div>
                            <span className="text-sm">
                              @
                              {ambassadorProfile.tiktok_handle.replace("@", "")}
                            </span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {ambassadorProfile.twitter_handle && (
                          <a
                            href={`https://twitter.com/${ambassadorProfile.twitter_handle.replace(
                              "@",
                              ""
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-gray-600 hover:text-[#f5d82e] transition-colors"
                          >
                            <Twitter className="w-4 h-4" />
                            <span className="text-sm">
                              @
                              {ambassadorProfile.twitter_handle.replace(
                                "@",
                                ""
                              )}
                            </span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </>
                    )}

                    {/* Client website */}
                    {profile.role === "client" && clientProfile?.website && (
                      <a
                        href={clientProfile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-600 hover:text-[#f5d82e] transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="text-sm">
                          {clientProfile.website.replace(/^https?:\/\//, "")}
                        </span>
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Portfolio/Campaign Grid */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  {profile.role === "ambassador" ? "Portfolio" : "Campaigns"}
                </h3>
                <Button className="bg-[#f5d82e] hover:bg-[#FEE65D] text-gray-900 border-2 border-[#f5d82e] hover:border-[#FEE65D]">
                  <Plus className="w-4 h-4 mr-2" />
                  {profile.role === "ambassador"
                    ? "Add Campaign"
                    : "Create Campaign"}
                </Button>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {(profile.role === "ambassador" ? portfolioItems : campaigns)
                .length === 0 ? (
                /* Empty State */
                <div className="md:col-span-2 xl:col-span-3">
                  <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-all duration-200 cursor-pointer group">
                    <CardContent className="p-12 text-center">
                      <div className="w-16 h-16 bg-[#f5d82e] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                        <Plus className="w-8 h-8 text-gray-900" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {profile.role === "ambassador"
                          ? "No campaigns yet"
                          : "No campaigns yet"}
                      </h4>
                      <p className="text-gray-600">
                        {profile.role === "ambassador"
                          ? "Create your first campaign to showcase your work"
                          : "Create your first campaign to find ambassadors"}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ) : /* Filled Cards - Ambassador Portfolio */
              profile.role === "ambassador" ? (
                portfolioItems.map((item: any) => (
                  <Card
                    key={item.id}
                    className="group cursor-pointer hover:scale-105 hover:shadow-lg transition-all duration-200 aspect-square"
                  >
                    <CardContent className="p-0 h-full">
                      <div className="relative h-full">
                        {/* Campaign Image/Video Thumbnail */}
                        <div className="h-2/3 bg-gray-200 rounded-t-xl overflow-hidden">
                          {item.coverImage ? (
                            <Image
                              src={item.coverImage}
                              alt={item.title}
                              width={300}
                              height={200}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                              <span className="text-gray-500 text-4xl">📸</span>
                            </div>
                          )}
                        </div>

                        {/* Campaign Info */}
                        <div className="p-4 h-1/3 flex flex-col justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">
                              {item.title}
                            </h4>
                            <p className="text-gray-600 text-xs">
                              @{item.clientName}
                            </p>
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.date}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                /* Filled Cards - Client Campaigns */
                campaigns.map((campaign: any) => (
                  <Card
                    key={campaign.id}
                    className="group cursor-pointer hover:scale-105 hover:shadow-lg transition-all duration-200"
                  >
                    <CardContent className="p-0">
                      <div className="relative">
                        {/* Campaign Cover */}
                        <div className="h-48 bg-gray-200 rounded-t-xl overflow-hidden relative">
                          {campaign.coverImage ? (
                            <Image
                              src={campaign.coverImage}
                              alt={campaign.title}
                              width={300}
                              height={192}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                              <span className="text-gray-500 text-4xl">📸</span>
                            </div>
                          )}

                          {/* Status Badge */}
                          <div className="absolute top-3 right-3">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                campaign.status === "active"
                                  ? "bg-green-100 text-green-800 border border-green-200"
                                  : "bg-gray-100 text-gray-800 border border-gray-200"
                              }`}
                            >
                              {campaign.status === "active"
                                ? "Active"
                                : "Completed"}
                            </span>
                          </div>
                        </div>

                        {/* Campaign Info */}
                        <div className="p-4 space-y-3">
                          <div>
                            <h4 className="font-semibold text-gray-900 line-clamp-1">
                              {campaign.title}
                            </h4>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              <span>{campaign.budgetRange}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>
                                {campaign.ambassadorCount} ambassadors
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{campaign.timeline}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
