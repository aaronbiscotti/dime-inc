"use server";

import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";

// Returns campaigns this ambassador has accepted/active association with.
// Filters out mere proposals (status = 'proposal_received') and completed/terminated.
export async function getMyActiveCampaignsAction() {
  const user = await requireUser();
  const supabase = await createClient();

  // Join through campaign_ambassadors to ensure membership and status
  const { data, error } = await supabase
    .from("campaign_ambassadors")
    .select(
      `
      status,
      campaigns!inner(
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
        updated_at,
        client_profiles!inner(
          id,
          company_name,
          company_description,
          logo_url,
          industry
        )
      )
    `
    )
    .eq("ambassador_id", user.id)
    // Accepted/active states only
    .in("status", ["contract_drafted", "contract_signed", "active"])
    .order("created_at", { referencedTable: "campaigns", ascending: false });

  if (error) return { ok: false, error: error.message } as const;

  const campaigns = (data || []).map((row: any) => row.campaigns);
  return { ok: true, data: campaigns } as const;
}

