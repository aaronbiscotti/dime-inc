"use server";

import { requireUser } from "@/lib/auth/requireUser";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// ============================================================================
// EXPLORE ACTIONS
// ============================================================================

export async function getAmbassadorsAction(params?: {
  search?: string;
  niches?: string[];
  location?: string;
  orderBy?: "relevance" | "engagement_rate" | "created_at";
  orderDir?: "asc" | "desc";
  limit?: number;
  offset?: number;
}) {
  const user = await requireUser();
  const supabase = await createClient();

  let query = supabase.from("ambassador_profiles").select(`
    id,
    full_name,
    bio,
    location,
    niche,
    profile_photo_url,
    instagram_handle,
    tiktok_handle,
    twitter_handle,
    user_id,
    created_at,
    profiles(
      id,
      email,
      role,
      created_at
    )
  `);

  // Apply search filter
  if (params?.search) {
    query = query.or(
      `full_name.ilike.%${params.search}%,bio.ilike.%${params.search}%`
    );
  }

  // Apply niche filter
  if (params?.niches && params.niches.length > 0) {
    query = query.overlaps("niche", params.niches);
  }

  // Apply location filter
  if (params?.location) {
    query = query.ilike("location", `%${params.location}%`);
  }

  // Sorting
  const orderBy = params?.orderBy || "created_at";
  const orderDir = params?.orderDir || "desc";
  
  // Map engagement_rate to created_at since engagement_rate column doesn't exist
  const actualOrderBy = orderBy === "engagement_rate" ? "created_at" : orderBy;
  
  let ambassadors = null as any;
  let error = null as any;
  
  if (params?.limit !== undefined) {
    const from = params.offset ?? 0;
    const to = from + params.limit - 1;
    const resp = await query.order(actualOrderBy, { ascending: orderDir === "asc" }).range(from, to);
    ambassadors = resp.data;
    error = resp.error as any;
  } else {
    const resp = await query.order(actualOrderBy, { ascending: orderDir === "asc" });
    ambassadors = resp.data;
    error = resp.error as any;
  }

  if (error) return { ok: false, error: error.message } as const;
  return { ok: true, data: ambassadors || [] } as const;
}

export async function getAmbassadorAction(ambassadorId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: ambassador, error } = await supabase
    .from("ambassador_profiles")
    .select(
      `
      id,
      full_name,
      bio,
      location,
      niche,
      profile_photo_url,
      instagram_handle,
      tiktok_handle,
      twitter_handle,
      user_id,
      profiles!inner(
        id,
        email,
        role,
        created_at
      )
    `
    )
    .eq("id", ambassadorId)
    .single();

  if (error || !ambassador) {
    return { ok: false, error: "Ambassador not found" } as const;
  }

  return { ok: true, data: ambassador } as const;
}

export async function getCampaignsAction(params?: {
  search?: string;
  niches?: string[];
  budgetMin?: number;
  budgetMax?: number;
  status?: string;
  limit?: number;
  offset?: number;
  orderBy?: "created_at" | "budget_max" | "deadline";
  orderDir?: "asc" | "desc";
}) {
  const user = await requireUser();
  const supabase = await createClient();

  let query = supabase.from("campaigns").select(`
    id,
    title,
    description,
    budget_min,
    budget_max,
    deadline,
    requirements,
    proposal_message,
    max_ambassadors,
    status,
    created_at,
    client_id,
    updated_at,
    client_profiles!inner(
      id,
      company_name,
      company_description,
      logo_url,
      industry
    )
  `);

  // Apply search filter
  if (params?.search) {
    query = query.or(
      `title.ilike.%${params.search}%,description.ilike.%${params.search}%`
    );
  }

  // Apply budget filter
  if (params?.budgetMin) {
    query = query.gte("budget_min", params.budgetMin);
  }
  if (params?.budgetMax) {
    query = query.lte("budget_max", params.budgetMax);
  }

  // Apply status filter
  if (params?.status) {
    query = query.eq(
      "status",
      params.status as "active" | "draft" | "completed" | "cancelled"
    );
  }

  const orderBy = params?.orderBy || "created_at";
  const orderDir = params?.orderDir || "desc";

  if (params?.status) {
    query = query.eq("status", params.status as any);
  } else {
    query = query.eq("status", "active");
  }

  let campaigns = null as any;
  let error = null as any;
  if (params?.limit !== undefined) {
    const from = params.offset ?? 0;
    const to = from + params.limit - 1;
    const resp = await query.order(orderBy, { ascending: orderDir === "asc" }).range(from, to);
    campaigns = resp.data;
    error = resp.error as any;
  } else {
    const resp = await query.order(orderBy, { ascending: orderDir === "asc" });
    campaigns = resp.data;
    error = resp.error as any;
  }

  if (error) return { ok: false, error: error.message } as const;
  return { ok: true, data: campaigns || [] } as const;
}

export async function getCampaignAction(campaignId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  // Get the user's client profile ID if they are a client
  const { data: clientProfile } = await supabase
    .from("client_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  // Get the user's ambassador profile ID if they are an ambassador
  const { data: ambassadorProfile } = await supabase
    .from("ambassador_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  // Check if user has access to this campaign
  let campaignQuery = supabase
    .from("campaigns")
    .select(
      `
      id,
      title,
      description,
      budget_min,
      budget_max,
      deadline,
      requirements,
      proposal_message,
      max_ambassadors,
      status,
      created_at,
      client_profiles!inner(
        id,
        company_name,
        company_description,
        logo_url,
        industry
      )
    `
    )
    .eq("id", campaignId);

  // If user is a client, they can only see their own campaigns
  if (clientProfile) {
    campaignQuery = campaignQuery.eq("client_id", clientProfile.id);
  }
  // If user is an ambassador, they can only see active campaigns
  else if (ambassadorProfile) {
    campaignQuery = campaignQuery.eq("status", "active");
  }
  // If user has no profile, deny access
  else {
    return { ok: false, error: "Access denied" } as const;
  }

  const { data: campaign, error } = await campaignQuery.single();

  if (error || !campaign) {
    return { ok: false, error: "Campaign not found" } as const;
  }

  return { ok: true, data: campaign } as const;
}

// List client profiles for ambassadors browsing brands
export async function getClientsAction(params?: {
  search?: string;
  industry?: string;
  orderBy?: "created_at" | "company_name";
  orderDir?: "asc" | "desc";
  limit?: number;
  offset?: number;
}) {
  const user = await requireUser();
  const supabase = await createClient();

  let query = supabase.from("client_profiles").select(`
    id,
    user_id,
    company_name,
    company_description,
    logo_url,
    industry,
    website,
    profiles(
      id,
      email,
      role,
      created_at
    )
  `);

  if (params?.search) {
    query = query.or(
      `company_name.ilike.%${params.search}%,company_description.ilike.%${params.search}%`
    );
  }
  if (params?.industry) {
    query = query.ilike("industry", `%${params.industry}%`);
  }

  const orderBy = params?.orderBy || "created_at";
  const orderDir = params?.orderDir || "desc";

  let clients: any = null;
  let error: any = null;
  if (params?.limit !== undefined) {
    const from = params.offset ?? 0;
    const to = from + params.limit - 1;
    const resp = await query.order(orderBy, { ascending: orderDir === "asc" }).range(from, to);
    clients = resp.data;
    error = resp.error as any;
  } else {
    const resp = await query.order(orderBy, { ascending: orderDir === "asc" });
    clients = resp.data;
    error = resp.error as any;
  }

  if (error) return { ok: false, error: error.message } as const;
  return { ok: true, data: clients || [] } as const;
}

// Get user role to determine what profiles to show
export async function getUserRoleAction() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return { ok: false, error: "User profile not found" } as const;
  }

  return { ok: true, data: { role: profile.role } } as const;
}
