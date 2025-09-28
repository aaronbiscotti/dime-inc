"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  X,
  MapPin,
  Calendar,
  Instagram,
  Twitter,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

export function ProfileEditModal({ isOpen, onClose, onSave }: ProfileEditModalProps) {
  const { profile, ambassadorProfile, clientProfile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize form state with current profile data
  const [formData, setFormData] = useState(() => {
    if (profile?.role === "ambassador" && ambassadorProfile) {
      return {
        full_name: ambassadorProfile.full_name || "",
        bio: ambassadorProfile.bio || "",
        location: ambassadorProfile.location || "",
        instagram_handle: ambassadorProfile.instagram_handle || "",
        tiktok_handle: ambassadorProfile.tiktok_handle || "",
        twitter_handle: ambassadorProfile.twitter_handle || "",
        profile_photo_url: ambassadorProfile.profile_photo_url || "",
      };
    } else if (profile?.role === "client" && clientProfile) {
      return {
        company_name: clientProfile.company_name || "",
        company_description: clientProfile.company_description || "",
        industry: clientProfile.industry || "",
        website: clientProfile.website || "",
        logo_url: clientProfile.logo_url || "",
      };
    }
    return {};
  });

  const handleInputChange = (field: string, value: string) => {
    // Clear error and success states when user starts editing
    if (error) setError(null);
    if (success) setSuccess(false);
    
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!profile) return;
    
    setLoading(true);
    setError(null);

    try {
      if (profile.role === "ambassador" && ambassadorProfile) {
        // Update ambassador profile
        const { error: updateError } = await supabase
          .from("ambassador_profiles")
          .update({
            full_name: formData.full_name,
            bio: formData.bio,
            location: formData.location,
            instagram_handle: formData.instagram_handle,
            tiktok_handle: formData.tiktok_handle,
            twitter_handle: formData.twitter_handle,
            profile_photo_url: formData.profile_photo_url,
            updated_at: new Date().toISOString(),
          })
          .eq("id", ambassadorProfile.id);

        if (updateError) {
          throw updateError;
        }
      } else if (profile.role === "client" && clientProfile) {
        // Update client profile
        const { error: updateError } = await supabase
          .from("client_profiles")
          .update({
            company_name: formData.company_name,
            company_description: formData.company_description,
            industry: formData.industry,
            website: formData.website,
            logo_url: formData.logo_url,
            updated_at: new Date().toISOString(),
          })
          .eq("id", clientProfile.id);

        if (updateError) {
          throw updateError;
        }
      }

      // Call the parent's onSave callback
      onSave(formData);
      
      // Refresh the profile data in the context
      await refreshProfile();
      
      // Show success message briefly before closing
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !profile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred Background Overlay - Fallback with visible effect */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-black from-opacity-30 via-gray-900 via-opacity-40 to-black to-opacity-30"
        style={{
          backdropFilter: 'blur(12px) saturate(150%)',
          WebkitBackdropFilter: 'blur(12px) saturate(150%)',
          background: 'rgba(0, 0, 0, 0.4)',
        }}
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-2xl mx-4">
        <Card>
          <CardContent className="relative p-0">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-20 h-8 w-8 p-0 hover:bg-black hover:bg-opacity-10"
              onClick={onClose}
            >
              <X className="w-4 h-4 text-white" />
            </Button>

            {/* Banner Area - matching the profile page */}
            <div className="h-32 bg-gradient-to-r from-[#f5d82e] to-[#FEE65D] rounded-t-xl mb-6 relative">
              <div className="absolute -bottom-6 left-6">
                <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 overflow-hidden">
                  {profile.role === "ambassador" && formData.profile_photo_url ? (
                    <Image
                      src={formData.profile_photo_url}
                      alt="Profile"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : profile.role === "client" && formData.logo_url ? (
                    <Image
                      src={formData.logo_url}
                      alt="Company Logo"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 text-xl font-semibold">
                      {profile.role === "ambassador" && formData.full_name
                        ? formData.full_name.charAt(0)
                        : profile.role === "client" && formData.company_name
                        ? formData.company_name.charAt(0)
                        : "?"}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Content - matching profile page padding */}
            <div className="px-6 pb-6">
              {/* Modal Header */}
              <div className="mt-8 mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Edit Profile
                </h2>
                <p className="text-sm text-gray-600">
                  Update your {profile.role === "ambassador" ? "ambassador" : "company"} information
                </p>
                
                {/* Error Message */}
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                
                {/* Success Message */}
                {success && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-600">Profile updated successfully!</p>
                  </div>
                )}
              </div>

              {/* Form Fields - Grid Layout */}
              <div className="grid grid-cols-2 gap-4">
                {/* Ambassador Fields */}
                {profile.role === "ambassador" && (
                  <>
                    <div>
                      <Label htmlFor="full_name" className="text-sm font-medium text-gray-700">
                        Full Name
                      </Label>
                      <Input
                        id="full_name"
                        value={formData.full_name || ""}
                        onChange={(e) => handleInputChange("full_name", e.target.value)}
                        className="mt-1"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                        Location
                      </Label>
                      <Input
                        id="location"
                        value={formData.location || ""}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        className="mt-1"
                        placeholder="City, Country"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="bio" className="text-sm font-medium text-gray-700">
                        Bio
                      </Label>
                      <Textarea
                        id="bio"
                        value={formData.bio || ""}
                        onChange={(e) => handleInputChange("bio", e.target.value)}
                        className="mt-1 resize-none"
                        rows={3}
                        placeholder="Tell us about yourself..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="profile_photo_url" className="text-sm font-medium text-gray-700">
                        Profile Photo URL
                      </Label>
                      <Input
                        id="profile_photo_url"
                        value={formData.profile_photo_url || ""}
                        onChange={(e) => handleInputChange("profile_photo_url", e.target.value)}
                        className="mt-1"
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="instagram_handle" className="text-sm font-medium text-gray-700">
                        Instagram Handle
                      </Label>
                      <Input
                        id="instagram_handle"
                        value={formData.instagram_handle || ""}
                        onChange={(e) => handleInputChange("instagram_handle", e.target.value)}
                        className="mt-1"
                        placeholder="@username"
                      />
                    </div>

                    <div>
                      <Label htmlFor="tiktok_handle" className="text-sm font-medium text-gray-700">
                        TikTok Handle
                      </Label>
                      <Input
                        id="tiktok_handle"
                        value={formData.tiktok_handle || ""}
                        onChange={(e) => handleInputChange("tiktok_handle", e.target.value)}
                        className="mt-1"
                        placeholder="@username"
                      />
                    </div>

                    <div>
                      <Label htmlFor="twitter_handle" className="text-sm font-medium text-gray-700">
                        Twitter Handle
                      </Label>
                      <Input
                        id="twitter_handle"
                        value={formData.twitter_handle || ""}
                        onChange={(e) => handleInputChange("twitter_handle", e.target.value)}
                        className="mt-1"
                        placeholder="@username"
                      />
                    </div>
                  </>
                )}

                {/* Client Fields */}
                {profile.role === "client" && (
                  <>
                    <div>
                      <Label htmlFor="company_name" className="text-sm font-medium text-gray-700">
                        Company Name
                      </Label>
                      <Input
                        id="company_name"
                        value={formData.company_name || ""}
                        onChange={(e) => handleInputChange("company_name", e.target.value)}
                        className="mt-1"
                        placeholder="Enter company name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="industry" className="text-sm font-medium text-gray-700">
                        Industry
                      </Label>
                      <Input
                        id="industry"
                        value={formData.industry || ""}
                        onChange={(e) => handleInputChange("industry", e.target.value)}
                        className="mt-1"
                        placeholder="e.g. Fashion, Technology"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="company_description" className="text-sm font-medium text-gray-700">
                        Company Description
                      </Label>
                      <Textarea
                        id="company_description"
                        value={formData.company_description || ""}
                        onChange={(e) => handleInputChange("company_description", e.target.value)}
                        className="mt-1 resize-none"
                        rows={3}
                        placeholder="Describe your company..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="website" className="text-sm font-medium text-gray-700">
                        Website
                      </Label>
                      <Input
                        id="website"
                        value={formData.website || ""}
                        onChange={(e) => handleInputChange("website", e.target.value)}
                        className="mt-1"
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="logo_url" className="text-sm font-medium text-gray-700">
                        Logo URL
                      </Label>
                      <Input
                        id="logo_url"
                        value={formData.logo_url || ""}
                        onChange={(e) => handleInputChange("logo_url", e.target.value)}
                        className="mt-1"
                        placeholder="https://..."
                      />
                    </div>
                  </>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={loading || success}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-[#f5d82e] hover:bg-[#FEE65D] text-gray-900 border-2 border-[#f5d82e] hover:border-[#FEE65D]"
                disabled={loading || success}
              >
                {loading ? "Saving..." : success ? "Saved!" : "Save Changes"}
              </Button>
            </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
