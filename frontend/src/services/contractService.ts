/**
 * Contract Service - Handles all contract-related operations via direct Supabase calls
 * Now uses RLS policies for security instead of FastAPI backend
 */

import { createClient } from "@/lib/supabase/client"; // Use the client-side client

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ContractStatus =
  | "draft"
  | "pending_ambassador_signature"
  | "active"
  | "completed"
  | "terminated";

export interface Contract {
  id: string;
  contract_text: string | null;
  terms_accepted: boolean;
  created_at: string;
  campaign_ambassador_id: string;
  client_id: string;
  ambassador_signed_at: string | null;
  client_signed_at: string | null;
  status: ContractStatus;
  campaign_name?: string;
  ambassador_name?: string;
  // For detailed view
  campaign_ambassadors?: {
    ambassador_profiles?: { id?: string; full_name?: string } | null;
    campaigns?: { title?: string } | null;
  } | null;
}

export interface CreateContractData {
  payment_type: "pay_per_post" | "pay_per_cpm";
  target_impressions?: number;
  cost_per_cpm?: number;
  start_date?: string;
  usage_rights_duration?: string;
  contract_text?: string;
  contract_file_url?: string;
  campaign_ambassador_id: string;
  client_id: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Handle API errors consistently
 */
function handleError(error: unknown, context: string): never {
  console.error(`[ContractService] ${context}:`, error);

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "An unexpected error occurred";

  throw new Error(message);
}

// ============================================================================
// CONTRACT SERVICE
// ============================================================================

export const contractService = {
  /**
   * Create a new contract
   */
  async createContract(data: CreateContractData): Promise<Contract> {
    try {
      const supabase = createClient();
      
      const { data: result, error } = await supabase
        .from("contracts")
        .insert({
          payment_type: data.payment_type,
          target_impressions: data.target_impressions,
          cost_per_cpm: data.cost_per_cpm,
          start_date: data.start_date,
          usage_rights_duration: data.usage_rights_duration,
          contract_text: data.contract_text,
          contract_file_url: data.contract_file_url,
          campaign_ambassador_id: data.campaign_ambassador_id,
          client_id: data.client_id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      handleError(error, "createContract");
    }
  },

  /**
   * Get all contracts for a client
   */
  async getContractsForClient(clientId: string): Promise<Contract[]> {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from("contracts")
        .select(`
          *,
          campaign_ambassadors(
            campaigns(title),
            ambassador_profiles(name)
          )
        `)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, "getContractsForClient");
    }
  },

  /**
   * Get all contracts for an ambassador
   */
  async getContractsForAmbassador(ambassadorId: string): Promise<Contract[]> {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from("contracts")
        .select(`
          *,
          campaign_ambassadors!inner(
            ambassador_id,
            campaigns(title),
            ambassador_profiles(name)
          )
        `)
        .eq("campaign_ambassadors.ambassador_id", ambassadorId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, "getContractsForAmbassador");
    }
  },

  /**
   * Get a single contract by ID
   */
  async getContract(contractId: string): Promise<Contract> {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from("contracts")
        .select(`
          *,
          campaign_ambassadors(
            campaigns(title),
            ambassador_profiles(name)
          )
        `)
        .eq("id", contractId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, "getContract");
    }
  },

  /**
   * Accept/sign a contract (for ambassadors)
   */
  async signContract(contractId: string): Promise<Contract> {
    try {
      const supabase = createClient();
      
      const { data: result, error } = await supabase
        .from("contracts")
        .update({
          ambassador_signed_at: new Date().toISOString(),
          terms_accepted: true,
        })
        .eq("id", contractId)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      handleError(error, "signContract");
    }
  },
};