"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PortfolioItem } from "@/types/database";
import {
  Plus,
  Calendar,
  ExternalLink,
  Instagram,
  Download,
  RefreshCw,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Share,
} from "lucide-react";
import Image from "next/image";

interface AmbassadorPortfolioProps {
  portfolioItems: PortfolioItem[];
  loading: boolean;
}

export function AmbassadorPortfolio({ portfolioItems, loading }: AmbassadorPortfolioProps) {
  const handleAddContent = () => {
    // TODO: Implement content upload form
    console.log("Opening content upload form...");
  };

  if (loading) {
    return (
      <div className="lg:col-span-2">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Portfolio</h3>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-xl animate-pulse"></div>
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
            onClick={handleAddContent}
            className="bg-[#f5d82e] hover:bg-[#FEE65D] text-gray-900 border-2 border-[#f5d82e] hover:border-[#FEE65D]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Content
          </Button>
        </div>
      </div>

      {/* Portfolio Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {portfolioItems.length === 0 ? (
          /* Empty State - Mock portfolio cards */
          <div className="md:col-span-2 xl:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <Card className="bg-white border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      IG
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">
                        Summer Vibes
                      </h4>
                      <p className="text-xs text-gray-600">
                        Instagram Post • 50K views
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Calendar className="w-3 h-3" />
                      <span>2025-08-15</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>❤️ 2.5K likes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      TT
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">
                        Dance Challenge
                      </h4>
                      <p className="text-xs text-gray-600">
                        TikTok Video • 120K views
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Calendar className="w-3 h-3" />
                      <span>2025-08-20</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>❤️ 8.2K likes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      IG
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">
                        Fashion Haul
                      </h4>
                      <p className="text-xs text-gray-600">
                        Instagram Reel • 75K views
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Calendar className="w-3 h-3" />
                      <span>2025-09-01</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>❤️ 4.1K likes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Real Portfolio Items */
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
                      <div className="text-xs text-gray-500">
                        {item.date}
                      </div>
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

      {/* Content Integration Section */}
      <div className="mt-12">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Content Integration</h3>
              <p className="text-sm text-gray-600 mt-1">Import and showcase your latest posts from social platforms</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <Instagram className="w-4 h-4 mr-2" />
                Connect Instagram
              </Button>
              <Button
                variant="outline" 
                size="sm"
                className="border-gray-800 text-gray-800 hover:bg-gray-50"
              >
                <div className="w-4 h-4 mr-2 bg-black rounded-sm flex items-center justify-center text-white text-xs font-bold">T</div>
                Connect TikTok
              </Button>
            </div>
          </div>
        </div>

        {/* Content Integration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Instagram Story */}
          <Card className="group cursor-pointer hover:scale-105 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-0">
              <div className="relative">
                {/* Content Image */}
                <div className="h-64 bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 rounded-t-xl overflow-hidden relative">
                  <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                  <div className="absolute top-3 left-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                        IG
                      </div>
                      <span className="text-white text-xs font-medium">Story</span>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-white hover:bg-white hover:bg-opacity-20">
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-white text-sm font-medium">Morning workout vibes 💪</p>
                  </div>
                </div>
                
                {/* Content Info */}
                <div className="p-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                    <span>2 hours ago</span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>2.1K</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs">
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Sync
                    </Button>
                    <Button size="sm" className="flex-1 text-xs bg-purple-600 hover:bg-purple-700">
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TikTok Video */}
          <Card className="group cursor-pointer hover:scale-105 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-0">
              <div className="relative">
                {/* Content Image */}
                <div className="h-64 bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-t-xl overflow-hidden relative">
                  <div className="absolute top-3 left-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center text-white text-xs font-semibold">
                        TT
                      </div>
                      <span className="text-white text-xs font-medium">Video</span>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-white hover:bg-white hover:bg-opacity-20">
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-white text-sm font-medium">#FitnessChallenge trending now 🔥</p>
                  </div>
                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white bg-opacity-80 rounded-full flex items-center justify-center">
                      <div className="w-0 h-0 border-l-[8px] border-l-black border-y-[6px] border-y-transparent ml-1"></div>
                    </div>
                  </div>
                </div>
                
                {/* Content Info */}
                <div className="p-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                    <span>5 hours ago</span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>45K</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        <span>3.2K</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs">
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Sync
                    </Button>
                    <Button size="sm" className="flex-1 text-xs bg-gray-800 hover:bg-gray-900">
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instagram Reel */}
          <Card className="group cursor-pointer hover:scale-105 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-0">
              <div className="relative">
                {/* Content Image */}
                <div className="h-64 bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-400 rounded-t-xl overflow-hidden relative">
                  <div className="absolute top-3 left-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                        IG
                      </div>
                      <span className="text-white text-xs font-medium">Reel</span>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-white hover:bg-white hover:bg-opacity-20">
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-white text-sm font-medium">Style transformation ✨</p>
                  </div>
                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white bg-opacity-80 rounded-full flex items-center justify-center">
                      <div className="w-0 h-0 border-l-[8px] border-l-black border-y-[6px] border-y-transparent ml-1"></div>
                    </div>
                  </div>
                </div>
                
                {/* Content Info */}
                <div className="p-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                    <span>1 day ago</span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>12K</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        <span>890</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        <span>45</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs">
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Sync
                    </Button>
                    <Button size="sm" className="flex-1 text-xs bg-purple-600 hover:bg-purple-700">
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instagram Post */}
          <Card className="group cursor-pointer hover:scale-105 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-0">
              <div className="relative">
                {/* Content Image */}
                <div className="h-64 bg-gradient-to-br from-blue-400 via-teal-400 to-green-400 rounded-t-xl overflow-hidden relative">
                  <div className="absolute top-3 left-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                        IG
                      </div>
                      <span className="text-white text-xs font-medium">Post</span>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3">
                    <div className="flex items-center gap-1">
                      <div className="px-2 py-1 bg-green-500 rounded-full">
                        <TrendingUp className="w-3 h-3 text-white" />
                      </div>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-white hover:bg-white hover:bg-opacity-20">
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-white text-sm font-medium">Beach day essentials 🏖️</p>
                  </div>
                </div>
                
                {/* Content Info */}
                <div className="p-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                    <span>3 days ago</span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        <span>1.8K</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        <span>92</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Share className="w-3 h-3" />
                        <span>34</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs">
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Sync
                    </Button>
                    <Button size="sm" className="flex-1 text-xs bg-purple-600 hover:bg-purple-700">
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Load More Button */}
        <div className="text-center mt-6">
          <Button variant="outline" className="px-8">
            <RefreshCw className="w-4 h-4 mr-2" />
            Load More Content
          </Button>
        </div>
      </div>
    </div>
  );
}
