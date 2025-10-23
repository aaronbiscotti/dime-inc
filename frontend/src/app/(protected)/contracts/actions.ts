"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";

// ============================================================================
// CONTRACT ACTIONS
// ============================================================================

export async function createContractAction(_: any, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const campaignAmbassadorId = String(
    formData.get("campaignAmbassadorId") ?? ""
  );
  const contractText = String(formData.get("contractText") ?? "").trim();
  const paymentType = String(formData.get("paymentType") ?? "") as
    | "pay_per_post"
    | "pay_per_cpm";
  const targetImpressions = Number(formData.get("targetImpressions") ?? 0);
  const costPerCpm = Number(formData.get("costPerCpm") ?? 0);
  const startDate = String(formData.get("startDate") ?? "");
  const usageRightsDuration = String(formData.get("usageRightsDuration") ?? "");
  const contractFileUrl = String(formData.get("contractFileUrl") ?? "").trim();

  if (!campaignAmbassadorId || !contractText) {
    return {
      ok: false,
      error: "Campaign ambassador ID and contract text are required",
    } as const;
  }

  // Get the client_id from the campaign_ambassador relationship
  const { data: campaignAmbassador, error: fetchError } = await supabase
    .from("campaign_ambassadors")
    .select(
      `
      id,
      campaigns!inner(
        client_id
      )
    `
    )
    .eq("id", campaignAmbassadorId)
    .single();

  if (fetchError || !campaignAmbassador) {
    return { ok: false, error: "Campaign ambassador not found" } as const;
  }

  const { data: contract, error } = await supabase
    .from("contracts")
    .insert({
      id: crypto.randomUUID(),
      terms_accepted: false,
      campaign_ambassador_id: campaignAmbassadorId,
      client_id: campaignAmbassador.campaigns.client_id,
      status: "draft",
      payment_type: paymentType,
      target_impressions: targetImpressions || null,
      cost_per_cpm: costPerCpm || null,
      start_date: startDate || null,
      usage_rights_duration: usageRightsDuration || null,
      contract_file_url: contractFileUrl || null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message } as const;

  revalidatePath("/contracts");
  return { ok: true, data: contract } as const;
}

export async function getMyContractsAction() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: contracts, error } = await supabase
    .from("contracts")
    .select(
      `
      id,
      contract_text,
      terms_accepted,
      created_at,
      campaign_ambassador_id,
      client_id,
      ambassador_signed_at,
      client_signed_at,
      status,
      payment_type,
      target_impressions,
      cost_per_cpm,
      start_date,
      usage_rights_duration,
      contract_file_url,
      pdf_url,
      updated_at,
      campaign_ambassadors!inner(
        ambassador_profiles!inner(
          id,
          full_name
        ),
        campaigns!inner(
          title
        )
      )
    `
    )
    .or(
      `client_id.eq.${user.id},campaign_ambassadors.ambassador_id.eq.${user.id}`
    )
    .order("created_at", { ascending: false });

  if (error) return { ok: false, error: error.message } as const;
  return { ok: true, data: contracts || [] } as const;
}

export async function getContractAction(contractId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: contract, error } = await supabase
    .from("contracts")
    .select(
      `
      id,
      contract_text,
      terms_accepted,
      created_at,
      campaign_ambassador_id,
      client_id,
      ambassador_signed_at,
      client_signed_at,
      status,
      payment_type,
      target_impressions,
      cost_per_cpm,
      start_date,
      usage_rights_duration,
      contract_file_url,
      pdf_url,
      updated_at,
      campaign_ambassadors!inner(
        ambassador_profiles!inner(
          id,
          full_name
        ),
        campaigns!inner(
          title
        )
      )
    `
    )
    .eq("id", contractId)
    .or(
      `client_id.eq.${user.id},campaign_ambassadors.ambassador_id.eq.${user.id}`
    )
    .single();

  if (error || !contract) {
    return { ok: false, error: "Contract not found" } as const;
  }

  return { ok: true, data: contract } as const;
}

export async function signContractAction(_: any, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const contractId = String(formData.get("contractId") ?? "");
  const signatureType = String(formData.get("signatureType") ?? "") as
    | "client"
    | "ambassador";

  if (!contractId || !signatureType) {
    return {
      ok: false,
      error: "Contract ID and signature type are required",
    } as const;
  }

  // Get the contract to verify access
  const { data: contract, error: fetchError } = await supabase
    .from("contracts")
    .select(
      `
      id,
      client_id,
      campaign_ambassadors!inner(
        ambassador_id
      )
    `
    )
    .eq("id", contractId)
    .single();

  if (fetchError || !contract) {
    return { ok: false, error: "Contract not found" } as const;
  }

  // Verify user has permission to sign
  const isClient = contract.client_id === user.id;
  const isAmbassador = contract.campaign_ambassadors.ambassador_id === user.id;

  if (
    (signatureType === "client" && !isClient) ||
    (signatureType === "ambassador" && !isAmbassador)
  ) {
    return { ok: false, error: "Access denied" } as const;
  }

  const updateData: any = {};
  if (signatureType === "client") {
    updateData.client_signed_at = new Date().toISOString();
  } else {
    updateData.ambassador_signed_at = new Date().toISOString();
  }

  // Update status based on who signed
  if (signatureType === "client") {
    updateData.status = "pending_ambassador_signature";
  } else {
    updateData.status = "active";
  }

  const { error } = await supabase
    .from("contracts")
    .update(updateData)
    .eq("id", contractId);

  if (error) return { ok: false, error: error.message } as const;

  revalidatePath(`/contracts/${contractId}`);
  return { ok: true } as const;
}

export async function updateContractAction(_: any, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const contractId = String(formData.get("contractId") ?? "");
  const contractText = String(formData.get("contractText") ?? "").trim();
  const paymentType = String(formData.get("paymentType") ?? "") as
    | "pay_per_post"
    | "pay_per_cpm";
  const targetImpressions = Number(formData.get("targetImpressions") ?? 0);
  const costPerCpm = Number(formData.get("costPerCpm") ?? 0);
  const startDate = String(formData.get("startDate") ?? "");
  const usageRightsDuration = String(formData.get("usageRightsDuration") ?? "");
  const contractFileUrl = String(formData.get("contractFileUrl") ?? "").trim();

  if (!contractId) {
    return { ok: false, error: "Contract ID is required" } as const;
  }

  // Verify user has permission to update (only client can update)
  const { data: contract, error: fetchError } = await supabase
    .from("contracts")
    .select("client_id")
    .eq("id", contractId)
    .single();

  if (fetchError || !contract || contract.client_id !== user.id) {
    return { ok: false, error: "Access denied" } as const;
  }

  const { error } = await supabase
    .from("contracts")
    .update({
      contract_text: contractText,
      payment_type: paymentType,
      target_impressions: targetImpressions || null,
      cost_per_cpm: costPerCpm || null,
      start_date: startDate || null,
      usage_rights_duration: usageRightsDuration || null,
      contract_file_url: contractFileUrl || null,
    })
    .eq("id", contractId);

  if (error) return { ok: false, error: error.message } as const;

  revalidatePath(`/contracts/${contractId}`);
  return { ok: true } as const;
}
