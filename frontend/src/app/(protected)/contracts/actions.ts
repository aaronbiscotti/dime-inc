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
      contract_text: contractText || null,
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

  const SELECT = `
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
        ambassador_id,
        ambassador_profiles!inner(
          id,
          full_name
        ),
        campaigns!inner(
          title
        )
      )
    `;

  // Resolve profile IDs for filtering
  const [{ data: clientProfile }, { data: ambassadorProfile }] = await Promise.all([
    supabase.from("client_profiles").select("id").eq("user_id", user.id).maybeSingle(),
    supabase.from("ambassador_profiles").select("id").eq("user_id", user.id).maybeSingle(),
  ]);

  const asClient = clientProfile?.id
    ? await supabase
        .from("contracts")
        .select(SELECT)
        .eq("client_id", clientProfile.id)
    : ({ data: [], error: null } as any);
  const asAmbassador = ambassadorProfile?.id
    ? await supabase
        .from("contracts")
        .select(SELECT)
        .eq("campaign_ambassadors.ambassador_id", ambassadorProfile.id)
    : ({ data: [], error: null } as any);

  if (asClient.error) return { ok: false, error: asClient.error.message } as const;
  if (asAmbassador.error)
    return { ok: false, error: asAmbassador.error.message } as const;

  const merged = [...(asClient.data || []), ...(asAmbassador.data || [])];
  const dedup = Array.from(new Map(merged.map((c: any) => [c.id, c])).values());
  dedup.sort(
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return { ok: true, data: dedup } as const;
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
        ambassador_id,
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
    .single();

  if (error || !contract) {
    return { ok: false, error: "Contract not found" } as const;
  }

  // Manual access check (avoid logic-tree parser issues on joins)
  // Determine profile scopes
  const [{ data: clientProfile }, { data: ambassadorProfile }] = await Promise.all([
    supabase.from("client_profiles").select("id").eq("user_id", user.id).maybeSingle(),
    supabase.from("ambassador_profiles").select("id").eq("user_id", user.id).maybeSingle(),
  ]);
  const allowed =
    (clientProfile?.id && contract.client_id === clientProfile.id) ||
    (ambassadorProfile?.id && (contract as any).campaign_ambassadors?.ambassador_id === ambassadorProfile.id);
  if (!allowed) return { ok: false, error: "Contract not found" } as const;

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
      contract_text,
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
  // Determine profile scopes for the current user
  const [{ data: clientProfile }, { data: ambassadorProfile }] = await Promise.all([
    supabase.from("client_profiles").select("id, company_name").eq("user_id", user.id).maybeSingle(),
    supabase.from("ambassador_profiles").select("id, full_name").eq("user_id", user.id).maybeSingle(),
  ]);
  const isClient = !!clientProfile?.id && contract.client_id === clientProfile.id;
  const isAmbassador =
    !!ambassadorProfile?.id && contract.campaign_ambassadors.ambassador_id === ambassadorProfile.id;

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

  // Append signature to the contract text if not present yet
  const existingText = (contract as any).contract_text || "";
  const dateStr = new Date().toLocaleDateString();
  let newText = existingText as string;
  if (signatureType === "client") {
    const tag = "Client Signature:";
    if (!existingText.includes(tag)) {
      const name = clientProfile?.company_name || "Client";
      newText = `${existingText}\n\n${tag} ${name} — ${dateStr}`;
    }
  } else if (signatureType === "ambassador") {
    const tag = "Ambassador Signature:";
    if (!existingText.includes(tag)) {
      const name = ambassadorProfile?.full_name || "Ambassador";
      newText = `${existingText}\n\n${tag} ${name} — ${dateStr}`;
    }
  }
  updateData.contract_text = newText;

  const { error } = await supabase
    .from("contracts")
    .update(updateData)
    .eq("id", contractId);

  if (error) return { ok: false, error: error.message } as const;

  revalidatePath(`/contracts/${contractId}`);
  return { ok: true } as const;
}

export async function sendContractToAmbassadorAction(_: any, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const contractId = String(formData.get("contractId") ?? "");

  if (!contractId) {
    return {
      ok: false,
      error: "Contract ID is required",
    } as const;
  }

  // Get the contract to verify access and get ambassador info
  const { data: contract, error: fetchError } = await supabase
    .from("contracts")
    .select(`
      id,
      client_id,
      status,
      campaign_ambassadors!inner(
        ambassador_id,
        ambassador_profiles!inner(
          id,
          full_name
        )
      )
    `)
    .eq("id", contractId)
    .single();

  if (fetchError || !contract) {
    return { ok: false, error: "Contract not found" } as const;
  }

  // Verify user is the client owner
  const { data: clientProfile } = await supabase
    .from("client_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!clientProfile || contract.client_id !== clientProfile.id) {
    return { ok: false, error: "Access denied" } as const;
  }

  // Only allow sending if contract is in draft status
  if (contract.status !== "draft") {
    return { ok: false, error: "Contract must be in draft status to send" } as const;
  }

  // Update contract status to pending_ambassador_signature
  const { error: updateError } = await supabase
    .from("contracts")
    .update({ status: "pending_ambassador_signature" })
    .eq("id", contractId);

  if (updateError) {
    return { ok: false, error: updateError.message } as const;
  }

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
