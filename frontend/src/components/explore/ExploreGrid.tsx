"use client";

import { useState, useEffect } from "react";
import { UserRole } from "@/types/database";
import { AmbassadorCard } from "./AmbassadorCard";
import { ClientCard } from "./ClientCard";
import { API_URL } from "@/config/api";

const API_BASE_URL = API_URL;

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
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real data from FastAPI using cookie-based auth
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (userRole === "client") {
          // Client is looking for ambassadors
          const params = new URLSearchParams();
          if (searchQuery) params.append("search", searchQuery);
          if (filters.niches && filters.niches.length > 0) {
            filters.niches.forEach((niche) => params.append("niches", niche));
          }
          if (filters.location && filters.location.length > 0) {
            params.append("location", filters.location[0]);
          }

          const response = await fetch(
            `${API_BASE_URL}/api/explore/ambassadors?${params.toString()}`,
            {
              credentials: "include", // Use cookie-based auth
            }
          );

          if (response.ok) {
            const result = await response.json();
            setData(result.data || []);
          }
        } else {
          // Ambassador is looking for clients
          const params = new URLSearchParams();
          if (searchQuery) params.append("search", searchQuery);
          if (filters.industry && filters.industry.length > 0) {
            params.append("industry", filters.industry[0]);
          }

          const response = await fetch(
            `${API_BASE_URL}/api/explore/clients?${params.toString()}`,
            {
              credentials: "include", // Use cookie-based auth
            }
          );

          if (response.ok) {
            const result = await response.json();
            setData(result.data || []);
          }
        }
      } catch (error) {
        console.error("Error fetching explore data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    userRole,
    searchQuery,
    filters.niches,
    filters.location,
    filters.industry,
  ]);

  // Apply search filtering
  const filteredData = data.filter((item) => {
    const searchText = searchQuery.toLowerCase();
    if (!searchText) return true;

    const itemData = item as Record<string, string | string[] | undefined>;

    if (userRole === "client") {
      // Searching ambassadors
      const name = itemData.name as string | undefined;
      const bio = itemData.bio as string | undefined;
      const niche = itemData.niche as string[] | undefined;
      return (
        name?.toLowerCase().includes(searchText) ||
        bio?.toLowerCase().includes(searchText) ||
        niche?.some((n: string) => n.toLowerCase().includes(searchText))
      );
    } else {
      // Searching clients
      const companyName = itemData.companyName as string | undefined;
      const description = itemData.description as string | undefined;
      const industry = itemData.industry as string | undefined;
      return (
        companyName?.toLowerCase().includes(searchText) ||
        description?.toLowerCase().includes(searchText) ||
        industry?.toLowerCase().includes(searchText)
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
                className="bg-white border border-gray-300 rounded-xl p-6 animate-pulse"
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <AmbassadorCard key={item.id as string} ambassador={item as any} />
          ) : (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <ClientCard key={item.id as string} client={item as any} />
          )
        )}
      </div>
    </div>
  );
}
