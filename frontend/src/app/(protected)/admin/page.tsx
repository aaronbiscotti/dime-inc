"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  getAdminOverview,
  getAdminAnalytics,
  listAmbassadors,
  listClients,
  listCampaigns,
  adminAssignAmbassadorToCampaign,
  bulkAssignAmbassadorsToCampaign,
  getAmbassadorPerformance,
  getCampaignInsights,
  getAvailableNiches,
  getAvailableIndustries,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search, 
  Filter, 
  Users, 
  Building2, 
  Target, 
  TrendingUp, 
  BarChart3,
  UserCheck,
  Calendar,
  DollarSign,
  Eye,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Upload,
  Settings
} from "lucide-react";

interface Ambassador {
  id: string;
  full_name: string;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  twitter_handle: string | null;
  profile_photo_url: string | null;
  niche: string[] | null;
  bio: string | null;
  location: string | null;
  created_at: string | null;
}

interface Client {
  id: string;
  company_name: string;
  industry?: string;
  website?: string;
  logo_url?: string;
  company_description?: string;
  created_at: string;
}

interface Campaign {
  id: string;
  title: string;
  status: string;
  client_id: string;
  created_at: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [authorized, setAuthorized] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "creators" | "campaigns" | "analytics">("overview");

  // Overview data
  const [overview, setOverview] = useState<{ ambassadors: number; clients: number; campaigns: number } | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  // Creator database
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [ambassadorQuery, setAmbassadorQuery] = useState("");
  const [ambassadorFilters, setAmbassadorFilters] = useState({
    niche: "",
    location: "",
    sortBy: "created_at" as "created_at" | "full_name",
    sortOrder: "desc" as "asc" | "desc"
  });
  const [availableNiches, setAvailableNiches] = useState<string[]>([]);

  // Client management
  const [clients, setClients] = useState<Client[]>([]);
  const [clientQuery, setClientQuery] = useState("");
  const [clientFilters, setClientFilters] = useState({
    industry: "",
    sortBy: "created_at" as "created_at" | "company_name",
    sortOrder: "desc" as "asc" | "desc"
  });
  const [availableIndustries, setAvailableIndustries] = useState<string[]>([]);

  // Campaign assignment
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [selectedAmbassadors, setSelectedAmbassadors] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Performance tracking
  const [selectedAmbassadorForPerformance, setSelectedAmbassadorForPerformance] = useState<string>("");
  const [ambassadorPerformance, setAmbassadorPerformance] = useState<any>(null);

  useEffect(() => {
    async function init() {
      try {
        const [overviewRes, analyticsRes, nichesRes, industriesRes] = await Promise.all([
          getAdminOverview(),
          getAdminAnalytics(),
          getAvailableNiches(),
          getAvailableIndustries()
        ]);

        if (overviewRes.ok) {
          setAuthorized(true);
          setOverview(overviewRes.data);
        }
        if (analyticsRes.ok) {
          setAnalytics(analyticsRes.data);
        }
        if (nichesRes.ok) {
          setAvailableNiches(nichesRes.data.filter((item): item is string => Boolean(item)));
        }
        if (industriesRes.ok) {
          setAvailableIndustries(industriesRes.data.filter((item): item is string => Boolean(item)));
        }

        // Load initial data
        await loadAmbassadors();
        await loadClients();
      } catch (e) {
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      loadCampaigns(selectedClientId);
    } else {
      setCampaigns([]);
      setSelectedCampaignId("");
    }
  }, [selectedClientId]);

  async function loadAmbassadors() {
    const res = await listAmbassadors(ambassadorQuery, ambassadorFilters);
    if (res.ok) setAmbassadors(res.data as unknown as Ambassador[]);
  }

  async function loadClients() {
    const res = await listClients(clientQuery, clientFilters);
    if (res.ok) setClients(res.data as Client[]);
  }

  async function loadCampaigns(clientId: string) {
    const res = await listCampaigns(clientId);
    if (res.ok) setCampaigns(res.data as Campaign[]);
  }

  async function handleSearchAmbassadors() {
    await loadAmbassadors();
  }

  async function handleSearchClients() {
    await loadClients();
  }

  async function handleBulkAssign() {
    if (!selectedCampaignId || selectedAmbassadors.length === 0) return;
    
    setAssigning(true);
    setAssignError(null);
    
    const res = await bulkAssignAmbassadorsToCampaign(selectedCampaignId, selectedAmbassadors);
    if (!res.ok) {
      setAssignError(res.error || "Failed to assign ambassadors");
    } else {
      setSelectedAmbassadors([]);
      setSelectedCampaignId("");
      setSelectedClientId("");
      setCampaigns([]);
    }
    
    setAssigning(false);
  }

  async function handleViewPerformance(ambassadorId: string) {
    setSelectedAmbassadorForPerformance(ambassadorId);
    const res = await getAmbassadorPerformance(ambassadorId);
    if (res.ok) {
      setAmbassadorPerformance(res.data);
    }
  }

  function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f5d82e]"></div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p>You are not authorized to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage creators, campaigns, and platform analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-white rounded-lg p-1 border">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "creators", label: "Creator Database", icon: Users },
            { id: "campaigns", label: "Campaign Management", icon: Target },
            { id: "analytics", label: "Analytics", icon: TrendingUp }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === id
                  ? "bg-[#f5d82e] text-black"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Creators</p>
                      <p className="text-2xl font-bold text-gray-900">{overview?.ambassadors ?? 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Building2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Clients</p>
                      <p className="text-2xl font-bold text-gray-900">{overview?.clients ?? 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Target className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                      <p className="text-2xl font-bold text-gray-900">{overview?.campaigns ?? 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Success Rate</p>
                      <p className="text-2xl font-bold text-gray-900">87%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-sm">New creator joined: @fashionista_jenny</span>
                    </div>
                    <span className="text-xs text-gray-500">2 hours ago</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-sm">Campaign "Summer Fashion 2024" launched</span>
                    </div>
                    <span className="text-xs text-gray-500">4 hours ago</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                      <span className="text-sm">Content submission approved: @travel_blogger_mike</span>
                    </div>
                    <span className="text-xs text-gray-500">6 hours ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Creator Database Tab */}
        {activeTab === "creators" && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Creator Database</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search by name or handle..."
                        value={ambassadorQuery}
                        onChange={(e) => setAmbassadorQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Niche</label>
                    <select
                      value={ambassadorFilters.niche}
                      onChange={(e) => setAmbassadorFilters(prev => ({ ...prev, niche: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">All Niches</option>
                      {availableNiches.map(niche => (
                        <option key={niche} value={niche}>{niche}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <Input
                      placeholder="Filter by location..."
                      value={ambassadorFilters.location || ""}
                      onChange={(e) => setAmbassadorFilters(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                    <select
                      value={`${ambassadorFilters.sortBy}-${ambassadorFilters.sortOrder}`}
                      onChange={(e) => {
                        const [sortBy, sortOrder] = e.target.value.split('-');
                        setAmbassadorFilters(prev => ({ ...prev, sortBy: sortBy as any, sortOrder: sortOrder as any }));
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="created_at-desc">Newest First</option>
                      <option value="created_at-asc">Oldest First</option>
                      <option value="full_name-asc">Name A-Z</option>
                      <option value="full_name-desc">Name Z-A</option>
                    </select>
                  </div>
                </div>
                <Button onClick={handleSearchAmbassadors} className="w-full">
                  <Search className="w-4 h-4 mr-2" />
                  Search Creators
                </Button>
              </CardContent>
            </Card>

            {/* Creator List */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creator</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Niche</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bio</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ambassadors.map((ambassador) => (
                        <tr key={ambassador.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {ambassador.profile_photo_url ? (
                                  <img className="h-10 w-10 rounded-full" src={ambassador.profile_photo_url} alt="" />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-gray-600" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{ambassador.full_name}</div>
                                <div className="text-sm text-gray-500">
                                  {ambassador.instagram_handle && `@${ambassador.instagram_handle}`}
                                  {ambassador.tiktok_handle && ` • @${ambassador.tiktok_handle}`}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1">
                              {ambassador.niche && ambassador.niche.length > 0 ? (
                                ambassador.niche.map((n, index) => (
                                  <span key={index} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                    {n}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-500">Not specified</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {ambassador.location || "Not specified"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                            {ambassador.bio || "No bio"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {ambassador.created_at ? formatDate(ambassador.created_at) : "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewPerformance(ambassador.id)}
                              >
                                <BarChart3 className="w-4 h-4 mr-1" />
                                Performance
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedAmbassadors(prev => 
                                    prev.includes(ambassador.id) 
                                      ? prev.filter(id => id !== ambassador.id)
                                      : [...prev, ambassador.id]
                                  );
                                }}
                              >
                                {selectedAmbassadors.includes(ambassador.id) ? "Selected" : "Select"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Campaign Management Tab */}
        {activeTab === "campaigns" && (
          <div className="space-y-6">
            {/* Client Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Client Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Client</label>
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search clients..."
                          value={clientQuery}
                          onChange={(e) => setClientQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Button onClick={handleSearchClients} size="sm" className="w-full">
                        Search Clients
                      </Button>
                    </div>
                    <div className="mt-3 max-h-60 overflow-y-auto border rounded-lg">
                      {clients.map((client) => (
                        <div
                          key={client.id}
                          className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                            selectedClientId === client.id ? "bg-blue-50 border-blue-200" : ""
                          }`}
                          onClick={() => setSelectedClientId(client.id)}
                        >
                          <div className="font-medium text-sm">{client.company_name}</div>
                          <div className="text-xs text-gray-500">{client.industry}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Campaign Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Campaign</label>
                    {selectedClientId ? (
                      <div className="max-h-60 overflow-y-auto border rounded-lg">
                        {campaigns.map((campaign) => (
                          <div
                            key={campaign.id}
                            className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                              selectedCampaignId === campaign.id ? "bg-blue-50 border-blue-200" : ""
                            }`}
                            onClick={() => setSelectedCampaignId(campaign.id)}
                          >
                            <div className="font-medium text-sm">{campaign.title}</div>
                            <div className="text-xs text-gray-500 capitalize">{campaign.status}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500 border rounded-lg">
                        Select a client to view campaigns
                      </div>
                    )}
                  </div>
                </div>

                {/* Assignment Actions */}
                {selectedCampaignId && selectedAmbassadors.length > 0 && (
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-yellow-800">Ready to Assign</h3>
                        <p className="text-sm text-yellow-700">
                          {selectedAmbassadors.length} creator(s) selected for assignment
                        </p>
                      </div>
                      <Button
                        onClick={handleBulkAssign}
                        disabled={assigning}
                        className="bg-[#f5d82e] hover:bg-[#e5c820] text-black"
                      >
                        {assigning ? "Assigning..." : "Assign to Campaign"}
                      </Button>
                    </div>
                    {assignError && (
                      <div className="mt-2 text-sm text-red-600">{assignError}</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Creator Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Top Performing Creator</span>
                      <span className="text-sm text-gray-600">@fashionista_jenny</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Highest Engagement Rate</span>
                      <span className="text-sm text-gray-600">8.5%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Most Active Niche</span>
                      <span className="text-sm text-gray-600">Fashion & Beauty</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Campaign Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Average Campaign Duration</span>
                      <span className="text-sm text-gray-600">45 days</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Success Rate</span>
                      <span className="text-sm text-gray-600">87%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Total Content Submitted</span>
                      <span className="text-sm text-gray-600">1,234 pieces</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Details */}
            {ambassadorPerformance && (
              <Card>
                <CardHeader>
                  <CardTitle>Creator Performance Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {ambassadorPerformance.map((performance: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{performance.campaigns?.title}</h4>
                          <span className="text-sm text-gray-500">{performance.status}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Budget Range:</span>
                            <span className="ml-2">${performance.campaigns?.budget_min} - ${performance.campaigns?.budget_max}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Submissions:</span>
                            <span className="ml-2">{performance.campaign_submissions?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}