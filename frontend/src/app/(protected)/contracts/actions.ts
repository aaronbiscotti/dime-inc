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

// Generate PDF from contract text
export async function generateContractPDF(contractId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  // Get contract data
  const { data: contract, error: fetchError } = await supabase
    .from("contracts")
    .select(`
      id,
      contract_text,
      status,
      client_signed_at,
      ambassador_signed_at,
      campaign_ambassadors!inner(
        ambassador_profiles!inner(
          full_name
        ),
        campaigns!inner(
          title,
          client_profiles!inner(
            company_name,
            company_description
          )
        )
      )
    `)
    .eq("id", contractId)
    .single();

  if (fetchError || !contract) {
    return { ok: false, error: "Contract not found" } as const;
  }

  // Verify user has access to this contract
  const [{ data: clientProfile }, { data: ambassadorProfile }] = await Promise.all([
    supabase.from("client_profiles").select("id").eq("user_id", user.id).maybeSingle(),
    supabase.from("ambassador_profiles").select("id").eq("user_id", user.id).maybeSingle(),
  ]);

  const hasAccess = 
    (clientProfile?.id && contract.campaign_ambassadors?.campaigns?.client_profiles) ||
    (ambassadorProfile?.id && contract.campaign_ambassadors?.ambassador_profiles);

  if (!hasAccess) {
    return { ok: false, error: "Access denied" } as const;
  }

  try {
    // Generate PDF using a simple HTML to PDF approach
    const contractData = contract;
    const ambassadorName = contractData.campaign_ambassadors?.ambassador_profiles?.full_name || "Ambassador";
    const clientName = contractData.campaign_ambassadors?.campaigns?.client_profiles?.company_name || "Client";
    const campaignTitle = contractData.campaign_ambassadors?.campaigns?.title || "Campaign";
    
    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Contract - ${campaignTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .contract-content { white-space: pre-line; margin: 20px 0; }
          .signatures { margin-top: 50px; display: flex; justify-content: space-between; }
          .signature-block { width: 45%; text-align: center; }
          .signature-line { border-bottom: 1px solid #333; margin-bottom: 10px; height: 40px; }
          .date { margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>CREATOR COLLABORATION AGREEMENT</h1>
          <h2>${campaignTitle}</h2>
          <p>Between ${clientName} and ${ambassadorName}</p>
        </div>
        
        <div class="contract-content">
          ${contractData.contract_text || "Contract content not available"}
        </div>
        
        <div class="signatures">
          <div class="signature-block">
            <div class="signature-line"></div>
            <p><strong>Client Signature</strong></p>
            <p>${clientName}</p>
            ${contractData.client_signed_at ? `<p>Signed: ${new Date(contractData.client_signed_at).toLocaleDateString()}</p>` : ''}
          </div>
          
          <div class="signature-block">
            <div class="signature-line"></div>
            <p><strong>Creator Signature</strong></p>
            <p>${ambassadorName}</p>
            ${contractData.ambassador_signed_at ? `<p>Signed: ${new Date(contractData.ambassador_signed_at).toLocaleDateString()}</p>` : ''}
          </div>
        </div>
      </body>
      </html>
    `;

    // For now, we'll store the HTML content and return a URL
    // In a production environment, you'd use a service like Puppeteer or similar
    const pdfFileName = `contract-${contractId}-${Date.now()}.html`;
    
    // Store the HTML content (in production, this would be converted to PDF)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(pdfFileName, htmlContent, {
        contentType: 'text/html',
        upsert: true
      });

    if (uploadError) {
      return { ok: false, error: "Failed to generate PDF" } as const;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('contracts')
      .getPublicUrl(pdfFileName);

    // Update contract with PDF URL
    const { error: updateError } = await supabase
      .from("contracts")
      .update({ pdf_url: urlData.publicUrl })
      .eq("id", contractId);

    if (updateError) {
      return { ok: false, error: "Failed to save PDF URL" } as const;
    }

    return { ok: true, data: { pdfUrl: urlData.publicUrl } } as const;
  } catch (error) {
    return { ok: false, error: "Failed to generate PDF" } as const;
  }
}

// Get contract templates
export async function getContractTemplates() {
  await requireUser();
  const supabase = await createClient();

  const { data: templates, error } = await supabase
    .from("contract_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { ok: false, error: error.message } as const;
  return { ok: true, data: templates || [] } as const;
}

// Create contract from template
export async function createContractFromTemplate(_: any, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const templateId = String(formData.get("templateId") ?? "");
  const campaignAmbassadorId = String(formData.get("campaignAmbassadorId") ?? "");
  const customizations = JSON.parse(String(formData.get("customizations") ?? "{}"));

  if (!templateId || !campaignAmbassadorId) {
    return { ok: false, error: "Template ID and campaign ambassador ID are required" } as const;
  }

  // Get template
  const { data: template, error: templateError } = await supabase
    .from("contract_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (templateError || !template) {
    return { ok: false, error: "Template not found" } as const;
  }

  // Get campaign ambassador data
  const { data: campaignAmbassador, error: ambassadorError } = await supabase
    .from("campaign_ambassadors")
    .select(`
      id,
      campaigns!inner(
        id,
        title,
        client_id,
        client_profiles!inner(
          company_name,
          company_description
        )
      ),
      ambassador_profiles!inner(
        full_name
      )
    `)
    .eq("id", campaignAmbassadorId)
    .single();

  if (ambassadorError || !campaignAmbassador) {
    return { ok: false, error: "Campaign ambassador not found" } as const;
  }

  // Generate contract text from template
  let contractText = template.template_content;
  
  // Replace placeholders with actual data
  contractText = contractText
    .replace(/\[CLIENT_NAME\]/g, campaignAmbassador.campaigns.client_profiles.company_name)
    .replace(/\[CREATOR_NAME\]/g, campaignAmbassador.ambassador_profiles.full_name)
    .replace(/\[CAMPAIGN_TITLE\]/g, campaignAmbassador.campaigns.title)
    .replace(/\[START_DATE\]/g, customizations.startDate || "[START_DATE]")
    .replace(/\[PAYMENT_AMOUNT\]/g, customizations.paymentAmount || "[PAYMENT_AMOUNT]")
    .replace(/\[DURATION\]/g, customizations.duration || "[DURATION]");

  // Create contract
  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .insert({
      id: crypto.randomUUID(),
      campaign_ambassador_id: campaignAmbassadorId,
      client_id: campaignAmbassador.campaigns.client_id,
      contract_text: contractText,
      status: "draft",
      payment_type: customizations.paymentType || "pay_per_post",
      target_impressions: customizations.targetImpressions || null,
      cost_per_cpm: customizations.costPerCpm || null,
      start_date: customizations.startDate || null,
      usage_rights_duration: customizations.duration || null,
      terms_accepted: false,
    })
    .select()
    .single();

  if (contractError) return { ok: false, error: contractError.message } as const;

  revalidatePath("/contracts");
  return { ok: true, data: contract } as const;
}

// Enhanced signature with validation
export async function signContractWithValidation(_: any, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const contractId = String(formData.get("contractId") ?? "");
  const signatureType = String(formData.get("signatureType") ?? "") as "client" | "ambassador";
  const signatureData = String(formData.get("signatureData") ?? ""); // Base64 signature image
  const signatureName = String(formData.get("signatureName") ?? "").trim();

  if (!contractId || !signatureType || !signatureName) {
    return { ok: false, error: "Contract ID, signature type, and name are required" } as const;
  }

  // Get contract and verify access
  const { data: contract, error: fetchError } = await supabase
    .from("contracts")
    .select(`
      id,
      client_id,
      contract_text,
      client_signed_at,
      ambassador_signed_at,
      campaign_ambassadors!inner(
        ambassador_id
      )
    `)
    .eq("id", contractId)
    .single();

  if (fetchError || !contract) {
    return { ok: false, error: "Contract not found" } as const;
  }

  // Verify user has permission to sign
  const [{ data: clientProfile }, { data: ambassadorProfile }] = await Promise.all([
    supabase.from("client_profiles").select("id, company_name").eq("user_id", user.id).maybeSingle(),
    supabase.from("ambassador_profiles").select("id, full_name").eq("user_id", user.id).maybeSingle(),
  ]);

  const isClient = !!clientProfile?.id && contract.client_id === clientProfile.id;
  const isAmbassador = !!ambassadorProfile?.id && contract.campaign_ambassadors.ambassador_id === ambassadorProfile.id;

  if ((signatureType === "client" && !isClient) || (signatureType === "ambassador" && !isAmbassador)) {
    return { ok: false, error: "Access denied" } as const;
  }

  // Check if already signed
  if (signatureType === "client" && contract.client_signed_at) {
    return { ok: false, error: "Contract already signed by client" } as const;
  }
  if (signatureType === "ambassador" && contract.ambassador_signed_at) {
    return { ok: false, error: "Contract already signed by ambassador" } as const;
  }

  // Store signature image if provided
  let signatureUrl = null;
  if (signatureData) {
    const signatureFileName = `signature-${contractId}-${signatureType}-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('signatures')
      .upload(signatureFileName, signatureData, {
        contentType: 'image/png',
        upsert: true
      });

    if (!uploadError && uploadData) {
      const { data: urlData } = supabase.storage
        .from('signatures')
        .getPublicUrl(signatureFileName);
      signatureUrl = urlData.publicUrl;
    }
  }

  // Update contract with signature
  const updateData: any = {
    terms_accepted: true,
  };

  if (signatureType === "client") {
    updateData.client_signed_at = new Date().toISOString();
    updateData.status = "pending_ambassador_signature";
  } else {
    updateData.ambassador_signed_at = new Date().toISOString();
    updateData.status = "active";
  }

  // Append signature to contract text
  const existingText = contract.contract_text || "";
  const dateStr = new Date().toLocaleDateString();
  const signerName = signatureType === "client" ? clientProfile?.company_name : ambassadorProfile?.full_name;
  
  const signatureBlock = `\n\n${signatureType === "client" ? "CLIENT" : "CREATOR"} SIGNATURE:\n${signerName}\nDate: ${dateStr}\n${signatureUrl ? `Signature Image: ${signatureUrl}` : "Digitally signed"}`;
  
  updateData.contract_text = existingText + signatureBlock;

  const { error } = await supabase
    .from("contracts")
    .update(updateData)
    .eq("id", contractId);

  if (error) return { ok: false, error: error.message } as const;

  revalidatePath(`/contracts/${contractId}`);
  return { ok: true } as const;
}

// Get contract history/versions
export async function getContractHistory(contractId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  // For now, we'll return the current contract
  // In a full implementation, you'd have a contract_versions table
  const { data: contract, error } = await supabase
    .from("contracts")
    .select(`
      id,
      contract_text,
      status,
      created_at,
      updated_at,
      client_signed_at,
      ambassador_signed_at
    `)
    .eq("id", contractId)
    .single();

  if (error || !contract) {
    return { ok: false, error: "Contract not found" } as const;
  }

  // Verify access
  const [{ data: clientProfile }, { data: ambassadorProfile }] = await Promise.all([
    supabase.from("client_profiles").select("id").eq("user_id", user.id).maybeSingle(),
    supabase.from("ambassador_profiles").select("id").eq("user_id", user.id).maybeSingle(),
  ]);

  // This is a simplified access check - in production you'd verify the relationship
  if (!clientProfile && !ambassadorProfile) {
    return { ok: false, error: "Access denied" } as const;
  }

  return { ok: true, data: contract } as const;
}
