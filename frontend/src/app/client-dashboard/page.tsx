"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { ExploreInterface } from "@/components/explore/ExploreInterface";
import { Navbar } from "@/components/layout/Navbar";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { ProfileEditModal } from "@/components/profile/ProfileEditModal";
import { useAuth } from "@/contexts/AuthContext";
import { campaignService } from "@/services/campaignService";

export default function ClientDashboard() {
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { profile, clientProfile } = useAuth();

  useEffect(() => {
    const checkClientRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push("/login/client");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role === "client") {
          setIsClient(true);
        } else {
          // Redirect ambassadors to their dashboard
          router.push("/ambassador-dashboard");
          return;
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        router.push("/login/client");
      } finally {
        setLoading(false);
      }
    };

    checkClientRole();
  }, [router, supabase]);

  // Fetch campaigns for client
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!clientProfile) return;

      try {
        const { data: campaignBids, error } = await campaignService.getCampaignsForClient(clientProfile.id);

        if (!error && campaignBids) {
          setCampaigns(campaignBids);
        }
      } catch (error) {
        console.error("Error fetching campaigns:", error);
      }
    };

    if (isClient && clientProfile) {
      fetchCampaigns();
    }
  }, [isClient, clientProfile]);

  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f5d82e]"></div>
      </div>
    );
  }

  if (!isClient) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Profile Sidebar */}
            {profile && (
              <div className="lg:col-span-1">
                <ProfileSidebar
                  profile={profile}
                  clientProfile={clientProfile}
                  campaignCount={campaigns.length}
                  onEditProfile={handleEditProfile}
                />
              </div>
            )}
            
            {/* Main Content - Ambassador Discovery */}
            <div className="lg:col-span-3">
              <ExploreInterface userRole="client" />
            </div>
          </div>
        </div>
      </div>

      {/* Profile Edit Modal */}
      {isEditModalOpen && (
        <ProfileEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={() => {
            setIsEditModalOpen(false);
            // Refresh will happen automatically through AuthContext
          }}
        />
      )}
    </div>
  );
}
