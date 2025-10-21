"use client";

import { useState } from "react";
import { FunnelIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/types/database";

interface ExploreFiltersProps {
  userRole: UserRole;
  selectedFilters: Record<string, string[]>;
  onFilterChange: (filterType: string, value: string, checked: boolean) => void;
  onClearFilters: () => void;
}

export function ExploreFilters({
  userRole,
  selectedFilters,
  onFilterChange,
  onClearFilters,
}: ExploreFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  // Filter options based on user role
  const ambassadorFilters = {
    niche: [
      "Fashion",
      "Beauty",
      "Fitness",
      "Food",
      "Travel",
      "Tech",
      "Gaming",
      "Lifestyle",
    ],
    location: [
      "New York",
      "Los Angeles",
      "Chicago",
      "Miami",
      "Austin",
      "Seattle",
      "Remote",
    ],
    followerRange: [
      "1K-10K",
      "10K-50K",
      "50K-100K",
      "100K-500K",
      "500K-1M",
      "1M+",
    ],
  };

  const clientFilters = {
    industry: [
      "Fashion",
      "Beauty",
      "Technology",
      "Food & Beverage",
      "Travel",
      "Fitness",
      "Gaming",
      "Automotive",
    ],
    budgetRange: [
      "$500-1K",
      "$1K-5K",
      "$5K-10K",
      "$10K-25K",
      "$25K-50K",
      "$50K+",
    ],
    location: [
      "New York",
      "Los Angeles",
      "Chicago",
      "Miami",
      "Austin",
      "Seattle",
      "Remote",
    ],
  };

  const filters = userRole === "client" ? ambassadorFilters : clientFilters;

  const hasActiveFilters = Object.values(selectedFilters).some(
    (arr) => arr.length > 0
  );

  return (
    <div className="bg-white rounded-xl border border-gray-300 p-6 mb-6">
      {/* Filter Toggle */}
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <FunnelIcon className="w-5 h-5" />
          Filters
          {hasActiveFilters && (
            <span className="bg-[#f5d82e] text-gray-900 text-xs px-2 py-1 rounded-full">
              {Object.values(selectedFilters).flat().length}
            </span>
          )}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={onClearFilters}>
            Clear All
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="border-t border-gray-300 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(filters).map(([filterType, options]) => (
              <div key={filterType}>
                <h4 className="font-medium text-gray-900 mb-3 capitalize">
                  {filterType === "followerRange"
                    ? "Followers"
                    : filterType === "budgetRange"
                    ? "Budget"
                    : filterType}
                </h4>
                <div className="space-y-2">
                  {options.map((option) => (
                    <label key={option} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={
                          selectedFilters[filterType]?.includes(option) || false
                        }
                        onChange={(e) =>
                          onFilterChange(filterType, option, e.target.checked)
                        }
                        className="w-4 h-4 text-[#f5d82e] bg-gray-100 border-gray-300 rounded focus:ring-[#f5d82e] focus:ring-2"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {option}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-300">
          {Object.entries(selectedFilters).map(([filterType, values]) =>
            values.map((value) => (
              <span
                key={`${filterType}-${value}`}
                className="inline-flex items-center gap-1 px-3 py-1 bg-[#FEF9E7] text-gray-900 text-sm rounded-full border border-[#f5d82e]"
              >
                {value}
                <button
                  onClick={() => onFilterChange(filterType, value, false)}
                  className="ml-1 text-gray-600 hover:text-gray-800"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>
      )}
    </div>
  );
}
