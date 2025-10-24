"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";

// ============================================================================
// SUBMISSION ACTIONS
// ============================================================================

export async function createSubmissionAction(_: any, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const campaignId = String(formData.get("campaignId") ?? "");
  const contentUrl = String(formData.get("contentUrl") ?? "").trim();
  const adCode = String(formData.get("adCode") ?? "").trim();

  if (!campaignId || !contentUrl) {
    return {
      ok: false,
      error: "Campaign ID and content URL are required",
    } as const;
  }

  // Get the campaign_ambassador_id for this campaign and user
  const { data: campaignAmbassador, error: fetchError } = await supabase
    .from("campaign_ambassadors")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("ambassador_id", user.id)
    .single();

  if (fetchError || !campaignAmbassador) {
    return {
      ok: false,
      error: "Campaign ambassador relationship not found",
    } as const;
  }

  const { data: submission, error } = await supabase
    .from("campaign_submissions")
    .insert({
      campaign_ambassador_id: campaignAmbassador.id,
      content_url: contentUrl,
      ad_code: adCode || null,
      status: "pending_review",
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message } as const;

  revalidatePath(`/campaigns/${campaignId}`);
  return { ok: true, data: submission } as const;
}

export async function getMySubmissionsAction() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: submissions, error } = await supabase
    .from("campaign_submissions")
    .select(
      `
      id,
      campaign_ambassador_id,
      content_url,
      ad_code,
      status,
      feedback,
      submitted_at,
      reviewed_at,
      campaign_ambassadors!inner(
        ambassador_id,
        campaigns!inner(
          id,
          title,
          client_profiles!inner(
            company_name,
            logo_url
          )
        )
      )
    `
    )
    .eq("campaign_ambassadors.ambassador_id", user.id)
    .order("submitted_at", { ascending: false });

  if (error) return { ok: false, error: error.message } as const;
  return { ok: true, data: submissions || [] } as const;
}

export async function getCampaignSubmissionsAction(campaignId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  // Get the user's client profile ID if they are a client
  const { data: clientProfile } = await supabase
    .from("client_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  // Verify user has access to this campaign (either as client or ambassador)
  const { data: campaignAccess, error: accessError } = await supabase
    .from("campaigns")
    .select(
      `
      id,
      client_id,
      campaign_ambassadors!inner(
        ambassador_id
      )
    `
    )
    .eq("id", campaignId)
    .or(
      clientProfile 
        ? `client_id.eq.${clientProfile.id},campaign_ambassadors.ambassador_id.eq.${user.id}`
        : `campaign_ambassadors.ambassador_id.eq.${user.id}`
    )
    .single();

  if (accessError || !campaignAccess) {
    return { ok: false, error: "Access denied" } as const;
  }

  const { data: submissions, error } = await supabase
    .from("campaign_submissions")
    .select(
      `
      id,
      campaign_ambassador_id,
      content_url,
      ad_code,
      status,
      feedback,
      submitted_at,
      reviewed_at,
      campaign_ambassadors!inner(
        ambassador_profiles!inner(
          id,
          full_name,
          profile_photo_url
        )
      )
    `
    )
    .eq("campaign_ambassadors.campaign_id", campaignId)
    .order("submitted_at", { ascending: false });

  if (error) return { ok: false, error: error.message } as const;
  return { ok: true, data: submissions || [] } as const;
}

export async function reviewSubmissionAction(_: any, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const submissionId = String(formData.get("submissionId") ?? "");
  const status = String(formData.get("status") ?? "") as
    | "approved"
    | "requires_changes";
  const feedback = String(formData.get("feedback") ?? "").trim();

  if (!submissionId || !status) {
    return {
      ok: false,
      error: "Submission ID and status are required",
    } as const;
  }

  // Verify user has permission to review (must be the client)
  const { data: submission, error: fetchError } = await supabase
    .from("campaign_submissions")
    .select(
      `
      id,
      campaign_ambassadors!inner(
        campaigns!inner(
          id,
          client_id
        )
      )
    `
    )
    .eq("id", submissionId)
    .single();

  if (
    fetchError ||
    !submission ||
    submission.campaign_ambassadors.campaigns.client_id !== user.id
  ) {
    return { ok: false, error: "Access denied" } as const;
  }

  const { error } = await supabase
    .from("campaign_submissions")
    .update({
      status,
      feedback: feedback || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (error) return { ok: false, error: error.message } as const;

  revalidatePath(
    `/campaigns/${
      (submission.campaign_ambassadors.campaigns as { id: string }).id
    }`
  );
  return { ok: true } as const;
}

export async function updateSubmissionAction(_: any, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const submissionId = String(formData.get("submissionId") ?? "");
  const contentUrl = String(formData.get("contentUrl") ?? "").trim();
  const adCode = String(formData.get("adCode") ?? "").trim();

  if (!submissionId || !contentUrl) {
    return {
      ok: false,
      error: "Submission ID and content URL are required",
    } as const;
  }

  // Verify user owns this submission
  const { data: submission, error: fetchError } = await supabase
    .from("campaign_submissions")
    .select(
      `
      id,
      campaign_ambassadors!inner(
        ambassador_id
      )
    `
    )
    .eq("id", submissionId)
    .single();

  if (
    fetchError ||
    !submission ||
    submission.campaign_ambassadors.ambassador_id !== user.id
  ) {
    return { ok: false, error: "Access denied" } as const;
  }

  const { error } = await supabase
    .from("campaign_submissions")
    .update({
      content_url: contentUrl,
      ad_code: adCode || null,
      status: "pending_review", // Reset status when updated
    })
    .eq("id", submissionId);

  if (error) return { ok: false, error: error.message } as const;

  revalidatePath(`/submissions/${submissionId}`);
  return { ok: true } as const;
}
