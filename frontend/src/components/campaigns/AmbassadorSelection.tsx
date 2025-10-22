"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Search, MapPin, Users, Star, CheckCircle } from "lucide-react";
// Using Next.js API routes instead of external API

interface Ambassador {
  id: string;
  user_id: string;
  full_name: string;
  bio: string | null;
  location: string | null;
  profile_photo_url: string | null;
  instagram_handle: string | null;
  niche: string[] | null;
  followers?: string;
  rating?: number;
  completedCampaigns?: number;
}

interface AmbassadorSelectionProps {
  campaign: {
    id: string;
    campaign_title: string;
    campaign_description: string | null;
    budget: number | null;
    timeline: string | null;
    requirements: string | null;
  };
  onClose: () => void;
}

export function AmbassadorSelection({
  campaign,
  onClose,
}: AmbassadorSelectionProps) {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [filteredAmbassadors, setFilteredAmbassadors] = useState<Ambassador[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAmbassadors, setSelectedAmbassadors] = useState<Set<string>>(
    new Set()
  );
  const [invitationMessage, setInvitationMessage] = useState("");
  const [sentInvitations] = useState<Set<string>>(new Set());
  const [targetNiches, setTargetNiches] = useState<string[]>([]);

  useEffect(() => {
    fetchAmbassadors();

    // Parse campaign metadata from requirements field
    try {
      if (campaign.requirements) {
        const metadata = JSON.parse(campaign.requirements);
        if (metadata.targetNiches) {
          setTargetNiches(metadata.targetNiches);
        }
      }
    } catch {
      // If parsing fails, requirements is probably a string
      console.log("Campaign requirements is not JSON metadata");
    }
  }, [campaign.requirements]);

  useEffect(() => {
    // Generate default invitation message
    const budgetText = campaign.budget ? `$${campaign.budget}` : "TBD";
    const timelineText = campaign.timeline || "TBD";

    setInvitationMessage(
      `Hi! I'd like to invite you to participate in our "${campaign.campaign_title}" campaign. ` +
        `Budget: ${budgetText}, Timeline: ${timelineText}. ` +
        `This opportunity aligns with your content style and we'd love to collaborate with you!`
    );
  }, [campaign]);

  useEffect(() => {
    // Filter ambassadors based on search term and campaign niches
    let filtered = ambassadors;

    if (searchTerm) {
      filtered = filtered.filter(
        (ambassador) =>
          ambassador.full_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          ambassador.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ambassador.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Prioritize ambassadors whose niches match campaign target niches
    if (targetNiches.length > 0) {
      filtered = filtered.sort((a, b) => {
        const aMatches =
          a.niche?.filter((n) => targetNiches.includes(n)).length || 0;
        const bMatches =
          b.niche?.filter((n) => targetNiches.includes(n)).length || 0;
        return bMatches - aMatches;
      });
    }

    setFilteredAmbassadors(filtered);
  }, [ambassadors, searchTerm, targetNiches]);

  const fetchAmbassadors = async () => {
    try {
      const response = await fetch(`/api/explore/ambassadors`, {
        credentials: "include",
      });

      if (!response.ok) {
        console.error("Error fetching ambassadors:", response.statusText);
        return;
      }

      const result = await response.json();
      const data = result.data || [];

      // Add mock data for demonstration
      const ambassadorsWithMockData = data.map(
        (ambassador: Record<string, unknown>) => ({
          ...ambassador,
          followers: `${Math.floor(Math.random() * 100)}K`,
          rating: 4.2 + Math.random() * 0.8,
          completedCampaigns: Math.floor(Math.random() * 20) + 1,
        })
      );

      setAmbassadors(ambassadorsWithMockData);
    } catch (error) {
      console.error("Error fetching ambassadors:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAmbassadorSelection = (ambassadorId: string) => {
    const newSelection = new Set(selectedAmbassadors);
    if (newSelection.has(ambassadorId)) {
      newSelection.delete(ambassadorId);
    } else {
      newSelection.add(ambassadorId);
    }
    setSelectedAmbassadors(newSelection);
  };

  const hasNicheMatch = (ambassador: Ambassador) => {
    return ambassador.niche?.some((n) => targetNiches.includes(n)) || false;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur effect */}
      <div className="fixed inset-0 bg-gray-900/50" onClick={onClose} />

      {/* Modal with bounce animation */}
      <Card className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-hidden animate-bounce-in">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Find Ambassadors for &quot;{campaign.campaign_title}&quot;
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Target niches: {targetNiches.join(", ") || "All"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ambassadors by name, bio, or location..."
              className="pl-9"
            />
          </div>

          {/* Invitation Message */}
          <div>
            <Label htmlFor="invitation">Invitation Message</Label>
            <Textarea
              id="invitation"
              value={invitationMessage}
              onChange={(e) => setInvitationMessage(e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Selected Count */}
          {selectedAmbassadors.size > 0 && (
            <div className="flex items-center justify-between p-3 bg-[#f5d82e]/10 rounded-lg border border-[#f5d82e]/20">
              <span className="text-sm font-medium text-gray-900">
                {selectedAmbassadors.size} ambassador
                {selectedAmbassadors.size > 1 ? "s" : ""} selected
              </span>
            </div>
          )}

          {/* Ambassadors Grid */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-300 h-32 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAmbassadors.map((ambassador) => {
                  const isSelected = selectedAmbassadors.has(ambassador.id);
                  const isInvited = sentInvitations.has(ambassador.id);
                  const nicheMatch = hasNicheMatch(ambassador);

                  return (
                    <Card
                      key={ambassador.id}
                      className={`cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "ring-2 ring-[#f5d82e] bg-[#f5d82e]/5"
                          : "hover:shadow-md"
                      } ${nicheMatch ? "border-[#f5d82e]/50" : ""}`}
                      onClick={() =>
                        !isInvited && toggleAmbassadorSelection(ambassador.id)
                      }
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-semibold flex-shrink-0 overflow-hidden">
                            {ambassador.profile_photo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={ambassador.profile_photo_url}
                                alt={ambassador.full_name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              ambassador.full_name.charAt(0)
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900 text-sm truncate">
                                {ambassador.full_name}
                              </h4>
                              {nicheMatch && (
                                <span className="px-1.5 py-0.5 bg-[#f5d82e] text-gray-900 text-xs rounded font-medium">
                                  Match
                                </span>
                              )}
                              {isInvited && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                            </div>

                            {ambassador.bio && (
                              <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                                {ambassador.bio}
                              </p>
                            )}

                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                              {ambassador.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  <span>{ambassador.location}</span>
                                </div>
                              )}
                              {ambassador.followers && (
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  <span>{ambassador.followers}</span>
                                </div>
                              )}
                              {ambassador.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3" />
                                  <span>{ambassador.rating.toFixed(1)}</span>
                                </div>
                              )}
                            </div>

                            {ambassador.niche &&
                              ambassador.niche.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {ambassador.niche.slice(0, 3).map((niche) => (
                                    <span
                                      key={niche}
                                      className={`px-1.5 py-0.5 text-xs rounded-full ${
                                        targetNiches.includes(niche)
                                          ? "bg-[#f5d82e]/20 text-gray-900 border border-[#f5d82e]/30"
                                          : "bg-gray-100 text-gray-600"
                                      }`}
                                    >
                                      {niche}
                                    </span>
                                  ))}
                                </div>
                              )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Summary */}
          {sentInvitations.size > 0 && (
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-800">
                {sentInvitations.size} invitation
                {sentInvitations.size > 1 ? "s" : ""} sent successfully!
              </p>
              <p className="text-xs text-green-600 mt-1">
                Check your chats to continue conversations with interested
                ambassadors.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
