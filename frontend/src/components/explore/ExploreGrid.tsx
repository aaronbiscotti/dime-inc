"use client";

import { useState, useEffect } from "react";
import { UserRole } from "@/types/database";
import { AmbassadorCard } from "./AmbassadorCard";
import { ClientCard } from "./ClientCard";
import { supabase } from "@/lib/supabase";

interface ExploreGridProps {
  userRole: UserRole;
  searchQuery: string;
  filters: Record<string, string[]>;
}

export function ExploreGrid({
  userRole,
  searchQuery,
  filters,
}: ExploreGridProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real data from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (userRole === "client") {
          // Client is looking for ambassadors
          const { data: ambassadors, error } = await supabase
            .from("ambassador_profiles")
            .select("*, user_id");

          if (!error && ambassadors) {
            // Convert to expected format
            const formattedAmbassadors = ambassadors.map((ambassador) => ({
              id: ambassador.user_id, // Use user_id as the main ID
              profileId: ambassador.id, // Keep profile ID for reference
              name: ambassador.full_name,
              username: ambassador.full_name.toLowerCase().replace(/\s+/g, ""),
              bio: ambassador.bio || "Ambassador on Dime",
              location: ambassador.location || "Location not specified",
              followers: "N/A", // No follower count in our schema
              niche: ambassador.niche || [],
              rating: 4.8, // Default rating since we don't track this yet
              completedCampaigns: 0, // TODO: Calculate from actual data
              avgEngagement: "N/A",
            }));
            setData(formattedAmbassadors);
          }
        } else {
          // Ambassador is looking for clients
          const { data: clients, error } = await supabase
            .from("client_profiles")
            .select("*");

          if (!error && clients) {
            // Convert to expected format
            const formattedClients = clients.map((client) => ({
              id: client.id,
              companyName: client.company_name,
              industry: client.industry || "Various",
              description: client.company_description || "Company on Dime",
              location: "Location not specified", // Add location to client_profiles if needed
              activeCampaigns: 0, // TODO: Calculate from bids
              budgetRange: "TBD",
              rating: 4.7, // Default rating
              completedPartnerships: 0, // TODO: Calculate from actual data
            }));
            setData(formattedClients);
          }
        }
      } catch (error) {
        console.error("Error fetching explore data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userRole]);

  // Apply search filtering
  const filteredData = data.filter((item) => {
    const searchText = searchQuery.toLowerCase();
    if (!searchText) return true;

    if (userRole === "client") {
      // Searching ambassadors
      return (
        item.name?.toLowerCase().includes(searchText) ||
        item.bio?.toLowerCase().includes(searchText) ||
        item.niche?.some((n: string) => n.toLowerCase().includes(searchText))
      );
    } else {
      // Searching clients
      return (
        item.companyName?.toLowerCase().includes(searchText) ||
        item.description?.toLowerCase().includes(searchText) ||
        item.industry?.toLowerCase().includes(searchText)
      );
    }
  });

  if (loading) {
    return (
      <div>
        {/* Results Header Skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>

        {/* Grid Skeleton */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array(8)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mb-3"></div>
                  <div className="h-5 bg-gray-200 rounded w-32 mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                  <div className="space-y-2 w-full">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                  </div>
                  <div className="h-10 bg-gray-200 rounded-lg w-full mt-4"></div>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  }

  if (filteredData.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-[#f5d82e] rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🔍</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No {userRole === "client" ? "ambassadors" : "clients"} found
        </h3>
        <p className="text-gray-600">
          {searchQuery
            ? "Try adjusting your search criteria to find more results."
            : "No profiles available yet. Check back later!"}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-600">
          Showing {filteredData.length}{" "}
          {userRole === "client" ? "ambassadors" : "clients"}
        </p>
      </div>

      {/* Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredData.map((item) =>
          userRole === "client" ? (
            <AmbassadorCard key={item.id} ambassador={item as any} />
          ) : (
            <ClientCard key={item.id} client={item as any} />
          )
        )}
      </div>
    </div>
  );
}
