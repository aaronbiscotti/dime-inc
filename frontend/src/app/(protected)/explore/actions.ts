"use server";

import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";

// ============================================================================
// EXPLORE ACTIONS
// ============================================================================

export async function getAmbassadorsAction(params?: {
  search?: string;
  niches?: string[];
  location?: string;
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
    profiles!inner(
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

  const { data: ambassadors, error } = await query.order("created_at", {
    ascending: false,
  });

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

  const { data: campaigns, error } = await query
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) return { ok: false, error: error.message } as const;
  return { ok: true, data: campaigns || [] } as const;
}

export async function getCampaignAction(campaignId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: campaign, error } = await supabase
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
    .eq("id", campaignId)
    .single();

  if (error || !campaign) {
    return { ok: false, error: "Campaign not found" } as const;
  }

  return { ok: true, data: campaign } as const;
}
