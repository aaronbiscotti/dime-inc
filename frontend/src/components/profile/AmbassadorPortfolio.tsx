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
          /* Empty State - Show existing chat cards */
          <div className="md:col-span-2 xl:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Mock chat cards for empty state */}
              <Card className="bg-white border border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-semibold">
                      N
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">
                        Nike
                      </h4>
                      <p className="text-xs text-gray-600">
                        Summer Collection Launch
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Calendar className="w-3 h-3" />
                      <span>2025-09-15 - 2025-10-15</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Active</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-semibold">
                      A
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">
                        Adidas
                      </h4>
                      <p className="text-xs text-gray-600">Fall Campaign</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Calendar className="w-3 h-3" />
                      <span>2025-10-01 - 2025-11-01</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span>Pending</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-semibold">
                      P
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">
                        Puma
                      </h4>
                      <p className="text-xs text-gray-600">Winter Collection</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Calendar className="w-3 h-3" />
                      <span>2025-11-15 - 2025-12-15</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span>Draft</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
