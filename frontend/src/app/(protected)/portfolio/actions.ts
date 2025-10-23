"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";

// ============================================================================
// PORTFOLIO ACTIONS
// ============================================================================

export async function createPortfolioItemAction(_: any, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const instagramUrl = String(formData.get("instagramUrl") ?? "").trim();
  const tiktokUrl = String(formData.get("tiktokUrl") ?? "").trim();
  const mediaUrls = JSON.parse(String(formData.get("mediaUrls") ?? "[]"));
  const campaignDate = String(formData.get("campaignDate") ?? "");
  const clientId = String(formData.get("clientId") ?? "").trim();
  const results = JSON.parse(String(formData.get("results") ?? "{}"));

  if (!title) {
    return { ok: false, error: "Title is required" } as const;
  }

  const { data: portfolioItem, error } = await supabase
    .from("portfolios")
    .insert({
      ambassador_id: user.id,
      title,
      description: description || null,
      instagram_url: instagramUrl || null,
      tiktok_url: tiktokUrl || null,
      media_urls: mediaUrls.length > 0 ? mediaUrls : null,
      campaign_date: campaignDate || null,
      client_id: clientId || null,
      results: Object.keys(results).length > 0 ? results : null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message } as const;

  revalidatePath("/portfolio");
  return { ok: true, data: portfolioItem } as const;
}

export async function getMyPortfolioAction() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: portfolioItems, error } = await supabase
    .from("portfolios")
    .select(
      `
      id,
      ambassador_id,
      title,
      description,
      instagram_url,
      tiktok_url,
      media_urls,
      campaign_date,
      client_id,
      results,
      created_at,
      updated_at,
      client_profiles(
        id,
        company_name,
        logo_url
      )
    `
    )
    .eq("ambassador_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { ok: false, error: error.message } as const;
  return { ok: true, data: portfolioItems || [] } as const;
}

export async function getPortfolioItemAction(portfolioItemId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: portfolioItem, error } = await supabase
    .from("portfolios")
    .select(
      `
      id,
      ambassador_id,
      title,
      description,
      instagram_url,
      tiktok_url,
      media_urls,
      campaign_date,
      client_id,
      results,
      created_at,
      updated_at,
      client_profiles(
        id,
        company_name,
        logo_url
      )
    `
    )
    .eq("id", portfolioItemId)
    .eq("ambassador_id", user.id)
    .single();

  if (error || !portfolioItem) {
    return { ok: false, error: "Portfolio item not found" } as const;
  }

  return { ok: true, data: portfolioItem } as const;
}

export async function updatePortfolioItemAction(_: any, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const portfolioItemId = String(formData.get("portfolioItemId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const instagramUrl = String(formData.get("instagramUrl") ?? "").trim();
  const tiktokUrl = String(formData.get("tiktokUrl") ?? "").trim();
  const mediaUrls = JSON.parse(String(formData.get("mediaUrls") ?? "[]"));
  const campaignDate = String(formData.get("campaignDate") ?? "");
  const clientId = String(formData.get("clientId") ?? "").trim();
  const results = JSON.parse(String(formData.get("results") ?? "{}"));

  if (!portfolioItemId || !title) {
    return {
      ok: false,
      error: "Portfolio item ID and title are required",
    } as const;
  }

  // Verify user owns this portfolio item
  const { data: existingItem, error: fetchError } = await supabase
    .from("portfolios")
    .select("ambassador_id")
    .eq("id", portfolioItemId)
    .single();

  if (fetchError || !existingItem || existingItem.ambassador_id !== user.id) {
    return { ok: false, error: "Access denied" } as const;
  }

  const { error } = await supabase
    .from("portfolios")
    .update({
      title,
      description: description || null,
      instagram_url: instagramUrl || null,
      tiktok_url: tiktokUrl || null,
      media_urls: mediaUrls.length > 0 ? mediaUrls : null,
      campaign_date: campaignDate || null,
      client_id: clientId || null,
      results: Object.keys(results).length > 0 ? results : null,
    })
    .eq("id", portfolioItemId);

  if (error) return { ok: false, error: error.message } as const;

  revalidatePath(`/portfolio/${portfolioItemId}`);
  return { ok: true } as const;
}

export async function deletePortfolioItemAction(_: any, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const portfolioItemId = String(formData.get("portfolioItemId") ?? "");

  if (!portfolioItemId) {
    return { ok: false, error: "Portfolio item ID is required" } as const;
  }

  // Verify user owns this portfolio item
  const { data: existingItem, error: fetchError } = await supabase
    .from("portfolios")
    .select("ambassador_id")
    .eq("id", portfolioItemId)
    .single();

  if (fetchError || !existingItem || existingItem.ambassador_id !== user.id) {
    return { ok: false, error: "Access denied" } as const;
  }

  const { error } = await supabase
    .from("portfolios")
    .delete()
    .eq("id", portfolioItemId);

  if (error) return { ok: false, error: error.message } as const;

  revalidatePath("/portfolio");
  return { ok: true } as const;
}
