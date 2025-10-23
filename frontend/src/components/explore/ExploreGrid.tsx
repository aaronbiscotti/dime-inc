"use client";

import { useState, useEffect, useMemo } from "react";
import { Database } from "@/types/database";

type UserRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];
import { AmbassadorCard } from "./AmbassadorCard";
import { ClientCard } from "./ClientCard";
// Using Next.js API routes instead of external API

interface ExploreGridProps {
  userRole: UserRole;
  searchQuery: string;
  filters: Record<string, string[]>;
}

const ITEMS_PER_PAGE = 12; // Limit items per page to reduce memory usage

export function ExploreGrid({
  userRole,
  searchQuery,
  filters,
}: ExploreGridProps) {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Memoized pagination calculations to prevent unnecessary re-renders
  const paginationInfo = useMemo(() => {
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return { totalPages, startIndex, endIndex };
  }, [currentPage, totalCount]);

  // Fetch real data from FastAPI using cookie-based auth with pagination
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
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
          // Add pagination parameters
          params.append("page", currentPage.toString());
          params.append("limit", ITEMS_PER_PAGE.toString());

          const response = await fetch(
            `/api/explore/ambassadors?${params.toString()}`,
            {
              credentials: "include", // Use cookie-based auth
            }
          );

          if (response.ok) {
            const result = await response.json();
            setData(result.data || []);
            setTotalCount(result.total || 0);
          }
        } else {
          // Ambassador is looking for clients
          const params = new URLSearchParams();
          if (searchQuery) params.append("search", searchQuery);
          if (filters.industry && filters.industry.length > 0) {
            params.append("industry", filters.industry[0]);
          }
          // Add pagination parameters
          params.append("page", currentPage.toString());
          params.append("limit", ITEMS_PER_PAGE.toString());

          const response = await fetch(
            `/api/explore/clients?${params.toString()}`,
            {
              credentials: "include", // Use cookie-based auth
            }
          );

          if (response.ok) {
            const result = await response.json();
            setData(result.data || []);
            setTotalCount(result.total || 0);
          }
        }
      } catch (error) {
        console.error("Error fetching explore data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userRole, searchQuery, filters, currentPage]);

  // Reset to first page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

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

  if (data.length === 0) {
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
          Showing {data.length} of {totalCount}{" "}
          {userRole === "client" ? "ambassadors" : "clients"}
        </p>
        {paginationInfo.totalPages > 1 && (
          <div className="text-sm text-gray-500">
            Page {currentPage} of {paginationInfo.totalPages}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.map((item) =>
          userRole === "client" ? (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <AmbassadorCard key={item.id as string} ambassador={item as any} />
          ) : (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <ClientCard key={item.id as string} client={item as any} />
          )
        )}
      </div>

      {/* Pagination Controls */}
      {paginationInfo.totalPages > 1 && (
        <div className="flex justify-center items-center mt-8 space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {/* Page numbers */}
          <div className="flex space-x-1">
            {Array.from(
              { length: Math.min(5, paginationInfo.totalPages) },
              (_, i) => {
                const pageNum = Math.max(
                  1,
                  Math.min(paginationInfo.totalPages, currentPage - 2 + i)
                );
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === pageNum
                        ? "bg-[#f5d82e] text-black"
                        : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              }
            )}
          </div>

          <button
            onClick={() =>
              setCurrentPage(
                Math.min(paginationInfo.totalPages, currentPage + 1)
              )
            }
            disabled={currentPage === paginationInfo.totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
