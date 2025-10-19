import { createClient } from "@/lib/supabase";
import { Database } from "@/types/database";

export const contractService = {
  async createContract(data: Omit<Database["public"]["Tables"]["contracts"]["Insert"], "created_at" | "updated_at">) {
    const supabase = createClient();
    const { data: contract, error } = await supabase
      .from("contracts")
      .insert([data])
      .select()
      .single();
    if (error) throw error;
    return contract;
  },

  /**
   * Fetch all contracts for a client by client_id FK, with campaign and ambassador info for display
   */
  async getContractsForClient(clientId: string) {
    const supabase = createClient();
    // Join campaign_ambassadors, campaigns, ambassador_profiles for display fields
    const { data, error } = await supabase
      .from("contracts")
      .select(`
        id, contract_text, terms_accepted, created_at, campaign_ambassador_id, client_id,
        campaign_ambassadors (
          campaign_id,
          ambassador_id,
          campaigns (title),
          ambassador_profiles:ambassador_id (full_name)
        )
      `)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    // Map for table display
    return (
      data || []
    ).map((row: any) => ({
      id: row.id,
      contract_text: row.contract_text,
      terms_accepted: row.terms_accepted,
      created_at: row.created_at,
      campaign_name: row.campaign_ambassadors?.campaigns?.title || "",
      ambassador_name: row.campaign_ambassadors?.ambassador_profiles?.full_name || "",
    }));
  },

  /**
   * Fetch all contracts for an ambassador by ambassador_id (via campaign_ambassadors FK)
   */
  async getContractsForAmbassador(ambassadorId: string) {
    const supabase = createClient();
    // Find all campaign_ambassadors rows for this ambassador
    const { data: caRows, error: caError } = await supabase
      .from("campaign_ambassadors")
      .select("id")
      .eq("ambassador_id", ambassadorId);
    if (caError) throw caError;
    const caIds = (caRows || []).map((row: any) => row.id);
    if (!caIds.length) return [];
    // Fetch contracts where campaign_ambassador_id is in caIds
    const { data, error } = await supabase
      .from("contracts")
      .select(`
        id, contract_text, terms_accepted, created_at, campaign_ambassador_id, client_id,
        campaign_ambassadors (
          campaigns (title),
          ambassador_profiles:ambassador_id (full_name)
        )
      `)
      .in("campaign_ambassador_id", caIds)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (
      data || []
    ).map((row: any) => ({
      id: row.id,
      contract_text: row.contract_text,
      terms_accepted: row.terms_accepted,
      created_at: row.created_at,
      campaign_name: row.campaign_ambassadors?.campaigns?.title || "",
      ambassador_name: row.campaign_ambassadors?.ambassador_profiles?.full_name || "",
    }));
  },
};
