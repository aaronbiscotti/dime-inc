"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PortfolioItem } from "@/types/database";
import { Plus, ExternalLink, Calendar } from "lucide-react";
import Image from "next/image";

interface AmbassadorPortfolioProps {
  portfolioItems: PortfolioItem[];
  loading: boolean;
  onAddContent: () => void;
}

export function AmbassadorPortfolio({
  portfolioItems,
  loading,
  onAddContent,
}: AmbassadorPortfolioProps) {
  if (loading) {
    return (
      <div className="lg:col-span-2">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Portfolio</h3>
            <Button
              onClick={onAddContent}
              className="bg-[#f5d82e] hover:bg-[#FEE65D] text-gray-900"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Content
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="aspect-square animate-pulse">
              <CardContent className="p-0 h-full">
                <div className="h-2/3 bg-gray-200 rounded-t-xl"></div>
                <div className="p-4 h-1/3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">Portfolio</h3>
          <Button
            onClick={onAddContent}
            className="bg-[#f5d82e] hover:bg-[#FEE65D] text-gray-900"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Content
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {portfolioItems.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-3">
            <div className="bg-white rounded-xl border border-dashed border-gray-300">
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-[#f5d82e] bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✨</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Your Portfolio is Empty
                </h3>
                <p className="text-gray-600 mb-4">
                  Add content to showcase your work to potential clients.
                </p>
                <Button
                  onClick={onAddContent}
                  className="bg-[#f5d82e] hover:bg-[#FEE65D] text-gray-900"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Content
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Filled Cards - Ambassador Portfolio */
          portfolioItems.map((item: PortfolioItem) => (
            <Card
              key={item.id}
              className="group cursor-pointer hover:scale-105 hover:shadow-lg transition-all duration-200 aspect-square"
              onClick={() => window.open(item.postUrl, "_blank")}
            >
              <CardContent className="p-0 h-full">
                <div className="relative h-full">
                  {/* Social Media Thumbnail */}
                  <div className="h-2/3 bg-gray-200 rounded-t-xl overflow-hidden relative">
                    {item.thumbnailUrl ? (
                      <Image
                        src={item.thumbnailUrl}
                        alt={item.title}
                        width={300}
                        height={200}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <span className="text-gray-500 text-4xl">
                          {item.platform === "instagram"
                            ? "📷"
                            : item.platform === "tiktok"
                            ? "🎵"
                            : item.platform === "youtube"
                            ? "📹"
                            : "📱"}
                        </span>
                      </div>
                    )}

                    {/* Platform Badge */}
                    <div className="absolute top-2 right-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold ${
                          item.platform === "instagram"
                            ? "bg-gradient-to-br from-purple-500 to-pink-500"
                            : item.platform === "tiktok"
                            ? "bg-black"
                            : item.platform === "youtube"
                            ? "bg-red-600"
                            : "bg-blue-500"
                        }`}
                      >
                        {item.platform === "instagram"
                          ? "IG"
                          : item.platform === "tiktok"
                          ? "TT"
                          : item.platform === "youtube"
                          ? "YT"
                          : "X"}
                      </div>
                    </div>

                    {/* External Link Icon */}
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="w-4 h-4 text-white drop-shadow-lg" />
                    </div>
                  </div>

                  {/* Post Info */}
                  <div className="p-4 h-1/3 flex flex-col justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-gray-600 text-xs capitalize">
                        {item.platform} • {item.views || "N/A"} views
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">{item.date}</div>
                      {item.likes && (
                        <div className="text-xs text-gray-500">
                          ❤️ {item.likes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
