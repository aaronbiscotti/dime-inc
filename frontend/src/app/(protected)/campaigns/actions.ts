"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";

export async function createCampaignAction(_: any, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const budget_min = Number(formData.get("budget_min") ?? 0);
  const budget_max = Number(formData.get("budget_max") ?? 0);
  const deadline = String(formData.get("deadline") ?? "");
  const requirements = String(formData.get("requirements") ?? "");
  const proposal_message = String(formData.get("proposal_message") ?? "");
  const max_ambassadors = Number(formData.get("max_ambassadors") ?? 1);

  if (!title) return { ok: false, error: "Title is required" } as const;

  // Get the client profile ID for the current user
  const { data: clientProfile, error: clientError } = await supabase
    .from("client_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (clientError || !clientProfile) {
    return { ok: false, error: "Client profile not found" } as const;
  }

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .insert({
      title,
      description,
      budget_min,
      budget_max,
      deadline: deadline || null,
      requirements: requirements || null,
      proposal_message: proposal_message || null,
      max_ambassadors,
      client_id: clientProfile.id,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message } as const;
  revalidatePath("/client/dashboard");
  return { ok: true, data: campaign } as const;
}

export async function reviewSubmissionAction(_: any, formData: FormData) {
  await requireUser();
  const supabase = await createClient();

  const id = String(formData.get("submissionId") ?? "");
  const status = String(formData.get("status") ?? "") as
    | "approved"
    | "requires_changes";
  if (!id || !status) return { ok: false, error: "Missing fields" } as const;

  const { error } = await supabase
    .from("campaign_submissions")
    .update({ status })
    .eq("id", id);

  if (error) return { ok: false, error: error.message } as const;
  revalidatePath(`/campaigns/${String(formData.get("campaignId") ?? "")}`);
  return { ok: true } as const;
}

export async function createSubmissionAction(_: any, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const campaignId = String(formData.get("campaignId") ?? "");
  const contentUrl = String(formData.get("contentUrl") ?? "").trim();
  if (!campaignId || !contentUrl)
    return { ok: false, error: "Missing fields" } as const;

  // First, get the campaign_ambassador_id for this campaign and user
  const { data: campaignAmbassador } = await supabase
    .from("campaign_ambassadors")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("ambassador_id", user.id)
    .single();

  if (!campaignAmbassador) {
    return {
      ok: false,
      error: "Campaign ambassador relationship not found",
    } as const;
  }

  const { error } = await supabase.from("campaign_submissions").insert({
    campaign_ambassador_id: campaignAmbassador.id,
    content_url: contentUrl,
    status: "pending_review",
  });

  if (error) return { ok: false, error: error.message } as const;
  revalidatePath(`/campaigns/${campaignId}`);
  return { ok: true } as const;
}

export async function updateCampaignStatus(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as
    | "active"
    | "draft"
    | "completed"
    | "cancelled";

  if (!id || !status) return { ok: false, error: "Missing fields" } as const;

  const { error } = await supabase
    .from("campaigns")
    .update({ status })
    .eq("id", id);

  if (error) return { ok: false, error: error.message } as const;
  revalidatePath(`/campaigns/${id}`);
  return { ok: true } as const;
}

export async function updateCampaign(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const budget_min = Number(formData.get("budget_min") ?? 0);
  const budget_max = Number(formData.get("budget_max") ?? 0);
  const deadline = String(formData.get("deadline") ?? "");
  const requirements = String(formData.get("requirements") ?? "");
  const proposal_message = String(formData.get("proposal_message") ?? "");
  const max_ambassadors = Number(formData.get("max_ambassadors") ?? 1);

  if (!id || !title)
    return { ok: false, error: "ID and title are required" } as const;

  // Verify user owns this campaign
  const { data: campaign, error: fetchError } = await supabase
    .from("campaigns")
    .select("client_id")
    .eq("id", id)
    .single();

  if (fetchError || !campaign || campaign.client_id !== user.id) {
    return { ok: false, error: "Access denied" } as const;
  }

  const { data: updated, error } = await supabase
    .from("campaigns")
    .update({
      title,
      description,
      budget_min,
      budget_max,
      deadline: deadline || null,
      requirements: requirements || null,
      proposal_message: proposal_message || null,
      max_ambassadors,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message } as const;
  revalidatePath(`/campaigns/${id}`);
  return { ok: true, data: updated } as const;
}

export async function deleteCampaign(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "ID is required" } as const;

  // Verify user owns this campaign
  const { data: campaign, error: fetchError } = await supabase
    .from("campaigns")
    .select("client_id")
    .eq("id", id)
    .single();

  if (fetchError || !campaign || campaign.client_id !== user.id) {
    return { ok: false, error: "Access denied" } as const;
  }

  const { error } = await supabase.from("campaigns").delete().eq("id", id);

  if (error) return { ok: false, error: error.message } as const;
  revalidatePath("/campaigns");
  return { ok: true } as const;
}

export async function addAmbassadorToCampaign(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const campaignId = String(formData.get("campaignId") ?? "");
  const ambassadorId = String(formData.get("ambassadorId") ?? "");

  if (!campaignId || !ambassadorId) {
    return {
      ok: false,
      error: "Campaign ID and Ambassador ID are required",
    } as const;
  }

  // Verify user owns this campaign
  const { data: campaign, error: fetchError } = await supabase
    .from("campaigns")
    .select("client_id")
    .eq("id", campaignId)
    .single();

  if (fetchError || !campaign || campaign.client_id !== user.id) {
    return { ok: false, error: "Access denied" } as const;
  }

  // Check if relationship already exists
  const { data: existing } = await supabase
    .from("campaign_ambassadors")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("ambassador_id", ambassadorId)
    .single();

  if (existing) {
    return {
      ok: false,
      error: "Ambassador is already added to this campaign",
    } as const;
  }

  const { data: relationship, error } = await supabase
    .from("campaign_ambassadors")
    .insert({
      campaign_id: campaignId,
      ambassador_id: ambassadorId,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message } as const;
  revalidatePath(`/campaigns/${campaignId}`);
  return { ok: true, data: relationship } as const;
}

export async function getCampaignAmbassadorsAction(campaignId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: ambassadors, error } = await supabase
    .from("campaign_ambassadors")
    .select(
      `
      id,
      ambassador_id,
      campaign_id,
      ambassador_profiles!inner(
        id,
        full_name,
        profile_photo_url,
        instagram_handle,
        tiktok_handle,
        twitter_handle
      )
    `
    )
    .eq("campaign_id", campaignId);

  if (error) return { ok: false, error: error.message } as const;
  return { ok: true, data: ambassadors || [] } as const;
}

export async function getCampaignAmbassadorRowsAction(campaignId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("campaign_ambassadors")
    .select("id, ambassador_id, campaign_id")
    .eq("campaign_id", campaignId);

  if (error) return { ok: false, error: error.message } as const;
  return { ok: true, data: rows || [] } as const;
}

export async function getClientCampaignsAction() {
  const user = await requireUser();
  const supabase = await createClient();

  // Find the client's profile id for this user
  const { data: clientProfile, error: clientErr } = await supabase
    .from("client_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (clientErr || !clientProfile) {
    return { ok: false, error: "Client profile not found" } as const;
  }

  const { data: campaigns, error } = await supabase
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
      updated_at
    `
    )
    .eq("client_id", clientProfile.id)
    .order("created_at", { ascending: false });

  if (error) return { ok: false, error: error.message } as const;
  return { ok: true, data: campaigns || [] } as const;
}

// Invite an ambassador to a campaign: creates or reuses a 1:1 chat, sends the intro
// message, and records a campaign_ambassadors row with status 'proposal_received'.
export async function inviteAmbassadorToCampaignAction(_: any, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const campaignId = String(formData.get("campaignId") ?? "").trim();
  const ambassadorProfileId = String(formData.get("ambassadorProfileId") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!campaignId || !ambassadorProfileId) {
    return { ok: false, error: "Campaign and ambassador are required" } as const;
  }

  // Verify ownership: campaign must belong to the current client's profile
  const { data: clientProfile, error: clientErr } = await supabase
    .from("client_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (clientErr || !clientProfile) return { ok: false, error: "Client profile not found" } as const;

  const { data: campaign, error: campErr } = await supabase
    .from("campaigns")
    .select("id, client_id, title")
    .eq("id", campaignId)
    .eq("client_id", clientProfile.id)
    .single();
  if (campErr || !campaign) return { ok: false, error: "Campaign not found or unauthorized" } as const;

  // Get ambassador user id
  const { data: ambassador, error: ambErr } = await supabase
    .from("ambassador_profiles")
    .select("id, user_id")
    .eq("id", ambassadorProfileId)
    .single();
  if (ambErr || !ambassador) return { ok: false, error: "Ambassador not found" } as const;

  // Create or reuse a 1:1 chat and send the invite message
  const { createChatAction } = await import("@/app/(protected)/chat/actions");
  const cf = new FormData();
  cf.append("participantId", ambassador.user_id);
  if (message) cf.append("initialMessage", message);
  const chatResult = await createChatAction(null as any, cf);
  if (!chatResult.ok || !chatResult.data) return { ok: false, error: chatResult.error || "Failed to create chat" } as const;
  const chatId = chatResult.data.id as string;

  // Upsert campaign_ambassadors link
  // Try to find existing row first
  const { data: existing } = await supabase
    .from("campaign_ambassadors")
    .select("id, status")
    .eq("campaign_id", campaignId)
    .eq("ambassador_id", ambassadorProfileId)
    .maybeSingle();

  if (existing?.id) {
    const { error: upErr } = await supabase
      .from("campaign_ambassadors")
      .update({ chat_room_id: chatId, status: existing.status || "proposal_received" })
      .eq("id", existing.id);
    if (upErr) return { ok: false, error: upErr.message } as const;
  } else {
    const { error: insErr } = await supabase
      .from("campaign_ambassadors")
      .insert({
        campaign_id: campaignId,
        ambassador_id: ambassadorProfileId,
        chat_room_id: chatId,
        status: "proposal_received",
      });
    if (insErr) return { ok: false, error: insErr.message } as const;
  }

  // Post a system message noting the campaign invite
  await supabase.from("messages").insert({
    chat_room_id: chatId,
    sender_id: user.id,
    message_type: "system",
    content: `Invitation to campaign: ${campaign.title}`,
  });

  return { ok: true, data: { chatId } } as const;
}

// Ambassador accepts an invitation in chat
export async function acceptCampaignInvitationAction(_: any, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const campaignAmbassadorId = String(formData.get("campaignAmbassadorId") ?? "").trim();
  if (!campaignAmbassadorId) return { ok: false, error: "Missing invitation id" } as const;

  // Verify the logged-in user owns this ambassador profile
  const { data: ca, error: caErr } = await supabase
    .from("campaign_ambassadors")
    .select("id, ambassador_id, chat_room_id")
    .eq("id", campaignAmbassadorId)
    .single();
  if (caErr || !ca) return { ok: false, error: "Invitation not found" } as const;

  const { data: amb } = await supabase
    .from("ambassador_profiles")
    .select("id, user_id")
    .eq("id", ca.ambassador_id)
    .single();
  if (!amb || amb.user_id !== user.id) return { ok: false, error: "Not authorized" } as const;

  const { error: upErr } = await supabase
    .from("campaign_ambassadors")
    .update({ status: "contract_drafted", selected_at: new Date().toISOString() })
    .eq("id", ca.id);
  if (upErr) return { ok: false, error: upErr.message } as const;

  // Send system message
  await supabase.from("messages").insert({
    chat_room_id: ca.chat_room_id as string,
    sender_id: user.id,
    message_type: "system",
    content: "Ambassador accepted the campaign invitation",
  });

  return { ok: true } as const;
}
