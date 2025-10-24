"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

export async function getAdminOverview() {
  await requireAdmin();
  const supabase = await createClient();

  const [ambCount, clientCount, campCount] = await Promise.all([
    supabase.from("ambassador_profiles").select("id", { count: "exact", head: true }),
    supabase.from("client_profiles").select("id", { count: "exact", head: true }),
    supabase.from("campaigns").select("id", { count: "exact", head: true }),
  ]);

  return {
    ok: true as const,
    data: {
      ambassadors: ambCount.count || 0,
      clients: clientCount.count || 0,
      campaigns: campCount.count || 0,
    },
  };
}

export async function listAmbassadors(query = "", filters?: {
  niche?: string;
  followerRange?: string;
  engagementRate?: string;
  sortBy?: "created_at" | "full_name" | "followers_count";
  sortOrder?: "asc" | "desc";
}) {
  await requireAdmin();
  const supabase = await createClient();
  
  let q = supabase
    .from("ambassador_profiles")
    .select(`
      id, 
      full_name, 
      instagram_handle, 
      tiktok_handle, 
      twitter_handle, 
      profile_photo_url, 
      user_id,
      niche,
      created_at,
      bio,
      location
    `)
    .limit(100);
    
  // Apply search query
  if (query) {
    q = q.or(`full_name.ilike.%${query}%,instagram_handle.ilike.%${query}%,tiktok_handle.ilike.%${query}%,twitter_handle.ilike.%${query}%`);
  }
  
  // Apply filters
  if (filters?.niche) {
    q = q.contains("niche", [filters.niche]);
  }
  
  // Note: followers_count and engagement_rate fields don't exist in current schema
  // These filters are disabled until the database schema is updated
  
  // Apply sorting
  const sortBy = filters?.sortBy || "created_at";
  const sortOrder = filters?.sortOrder || "desc";
  q = q.order(sortBy, { ascending: sortOrder === "asc" });
  
  const { data, error } = await q;
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, data: data || [] };
}

export async function listClients(query = "", filters?: {
  industry?: string;
  sortBy?: "created_at" | "company_name";
  sortOrder?: "asc" | "desc";
}) {
  await requireAdmin();
  const supabase = await createClient();
  
  let q = supabase
    .from("client_profiles")
    .select(`
      id, 
      company_name, 
      industry, 
      website, 
      logo_url, 
      user_id,
      company_description,
      created_at,
      updated_at
    `)
    .limit(100);
    
  if (query) {
    q = q.or(`company_name.ilike.%${query}%,industry.ilike.%${query}%,company_description.ilike.%${query}%`);
  }
  
  if (filters?.industry) {
    q = q.eq("industry", filters.industry);
  }
  
  const sortBy = filters?.sortBy || "created_at";
  const sortOrder = filters?.sortOrder || "desc";
  q = q.order(sortBy, { ascending: sortOrder === "asc" });
  
  const { data, error } = await q;
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, data: data || [] };
}

export async function listCampaigns(clientId?: string) {
  await requireAdmin();
  const supabase = await createClient();
  let q = supabase
    .from("campaigns")
    .select("id, title, status, client_id, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (clientId) q = q.eq("client_id", clientId);
  const { data, error } = await q;
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, data: data || [] };
}

// Admin-level assignment: attempts to add an ambassador to a campaign.
// Note: This respects underlying RLS; will fail if policies disallow.
export async function adminAssignAmbassadorToCampaign(campaignId: string, ambassadorId: string) {
  await requireAdmin();
  const supabase = await createClient();
  if (!campaignId || !ambassadorId) return { ok: false as const, error: "Missing ids" };

  // Prevent duplicates
  const { data: existing } = await supabase
    .from("campaign_ambassadors")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("ambassador_id", ambassadorId)
    .maybeSingle();
  if (existing?.id) return { ok: true as const };

  const { error } = await supabase.from("campaign_ambassadors").insert({
    campaign_id: campaignId,
    ambassador_id: ambassadorId,
    status: "contract_drafted" as any,
  });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

// Get detailed analytics for admin dashboard
export async function getAdminAnalytics() {
  await requireAdmin();
  const supabase = await createClient();

  // Get campaign performance metrics
  const { data: campaignStats } = await supabase
    .from("campaigns")
    .select(`
      id,
      status,
      created_at,
      campaign_ambassadors!inner(
        id,
        status,
        ambassador_profiles!inner(
          id,
          full_name,
          followers_count
        )
      )
    `);

  // Get submission metrics
  const { data: submissionStats } = await supabase
    .from("campaign_submissions")
    .select(`
      id,
      status,
      created_at,
      campaign_ambassadors!inner(
        campaigns!inner(
          id,
          title
        )
      )
    `);

  // Get user engagement metrics
  const { data: userStats } = await supabase
    .from("profiles")
    .select(`
      id,
      role,
      created_at,
      last_sign_in_at
    `);

  return {
    ok: true as const,
    data: {
      campaignStats: campaignStats || [],
      submissionStats: submissionStats || [],
      userStats: userStats || [],
    }
  };
}

// Get ambassador performance metrics
export async function getAmbassadorPerformance(ambassadorId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: performance } = await supabase
    .from("campaign_ambassadors")
    .select(`
      id,
      status,
      created_at,
      campaigns!inner(
        id,
        title,
        budget_min,
        budget_max
      ),
      campaign_submissions!inner(
        id,
        status,
        created_at
      )
    `)
    .eq("ambassador_id", ambassadorId);

  return { ok: true as const, data: performance || [] };
}

// Get campaign insights
export async function getCampaignInsights(campaignId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: insights } = await supabase
    .from("campaigns")
    .select(`
      id,
      title,
      status,
      budget_min,
      budget_max,
      created_at,
      campaign_ambassadors!inner(
        id,
        status,
        ambassador_profiles!inner(
          id,
          full_name,
          followers_count,
          engagement_rate
        ),
        campaign_submissions!inner(
          id,
          status,
          created_at
        )
      )
    `)
    .eq("id", campaignId)
    .single();

  return { ok: true as const, data: insights };
}

// Bulk operations for admin
export async function bulkAssignAmbassadorsToCampaign(campaignId: string, ambassadorIds: string[]) {
  await requireAdmin();
  const supabase = await createClient();

  const assignments = ambassadorIds.map(ambassadorId => ({
    campaign_id: campaignId,
    ambassador_id: ambassadorId,
    status: "contract_drafted" as any,
  }));

  const { error } = await supabase
    .from("campaign_ambassadors")
    .upsert(assignments, { onConflict: "campaign_id,ambassador_id" });

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

// Get available niches for filtering
export async function getAvailableNiches() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: niches } = await supabase
    .from("ambassador_profiles")
    .select("niche")
    .not("niche", "is", null);

  // Flatten the niche arrays and filter out null values
  const allNiches = niches?.flatMap(n => n.niche || []).filter(Boolean) || [];
  const uniqueNiches = [...new Set(allNiches)];
  return { ok: true as const, data: uniqueNiches };
}

// Get available industries for filtering
export async function getAvailableIndustries() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: industries } = await supabase
    .from("client_profiles")
    .select("industry")
    .not("industry", "is", null)
    .not("industry", "eq", "");

  const uniqueIndustries = [...new Set(industries?.map(i => i.industry).filter(Boolean) || [])];
  return { ok: true as const, data: uniqueIndustries };
}

