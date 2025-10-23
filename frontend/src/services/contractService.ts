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
  created_at: string | null;
  campaign_ambassador_id: string | null;
  client_id: string | null;
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
      
      // Generate a UUID for the contract
      const contractId = crypto.randomUUID();
      
      const { data: result, error } = await supabase
        .from("contracts")
        .insert({
          id: contractId,
          payment_type: data.payment_type,
          target_impressions: data.target_impressions,
          cost_per_cpm: data.cost_per_cpm,
          start_date: data.start_date,
          usage_rights_duration: data.usage_rights_duration,
          contract_text: data.contract_text,
          contract_file_url: data.contract_file_url,
          campaign_ambassador_id: data.campaign_ambassador_id,
          client_id: data.client_id,
          status: "draft",
          terms_accepted: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Update campaign_ambassador status to contract_drafted when contract is created
      const { error: caError } = await supabase
        .from("campaign_ambassadors")
        .update({ status: "contract_drafted" })
        .eq("id", data.campaign_ambassador_id);
      
      if (caError) {
        console.error("Failed to update campaign_ambassador status:", caError);
      }

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
            ambassador_profiles(full_name)
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
            ambassador_profiles(full_name)
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
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get user's profile to check role and get ambassador/client profile ID
      const { data: profile } = await supabase
        .from("profiles")
        .select(`
          id, 
          role,
          ambassador_profiles(id),
          client_profiles(id)
        `)
        .eq("id", user.id)
        .single();

      if (!profile) {
        throw new Error("User profile not found");
      }

      // Fetch the contract with related data
      const { data, error } = await supabase
        .from("contracts")
        .select(`
          *,
          campaign_ambassadors(
            campaigns(title),
            ambassador_profiles(full_name, id)
          )
        `)
        .eq("id", contractId)
        .single();

      if (error) throw error;

      // Check permission: user must be either the client or the ambassador
      const isClient = profile.role === "client" && 
        profile.client_profiles?.id === data.client_id;
      const isAmbassador = profile.role === "ambassador" && 
        profile.ambassador_profiles?.id === data.campaign_ambassadors?.ambassador_profiles?.id;

      console.log("[ContractService] Permission check:", {
        userRole: profile.role,
        userId: profile.id,
        userAmbassadorProfileId: profile.ambassador_profiles?.id,
        userClientProfileId: profile.client_profiles?.id,
        contractClientId: data.client_id,
        contractAmbassadorId: data.campaign_ambassadors?.ambassador_profiles?.id,
        isClient,
        isAmbassador
      });

      if (!isClient && !isAmbassador) {
        throw new Error("You don't have permission to view this contract");
      }

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

  async signContractAsClient(contractId: string): Promise<Contract> {
    try {
      const supabase = createClient();
      
      // First, get the current contract to check if ambassador has already signed
      const { data: currentContract, error: fetchError } = await supabase
        .from("contracts")
        .select("ambassador_signed_at")
        .eq("id", contractId)
        .single();

      if (fetchError) throw fetchError;

      // Determine the new status based on whether both parties will have signed
      const willBeFullySigned = currentContract.ambassador_signed_at !== null;
      const newStatus = willBeFullySigned ? "active" : "pending_ambassador_signature";
      
      console.log("[ContractService] Client signing - willBeFullySigned:", willBeFullySigned, "newStatus:", newStatus);
      
      const { data: result, error } = await supabase
        .from("contracts")
        .update({
          client_signed_at: new Date().toISOString(),
          terms_accepted: true,
          status: newStatus,
        })
        .eq("id", contractId)
        .select()
        .single();

      if (error) throw error;

      // Update campaign_ambassador status when contract becomes active
      if (newStatus === "active" && result.campaign_ambassador_id) {
        console.log("[ContractService] Contract became active, updating campaign_ambassador status");
        console.log("[ContractService] campaign_ambassador_id:", result.campaign_ambassador_id);
        
        const { error: caError } = await supabase
          .from("campaign_ambassadors")
          .update({ status: "contract_signed" })
          .eq("id", result.campaign_ambassador_id);
        
        if (caError) {
          console.error("Failed to update campaign_ambassador status:", caError);
        } else {
          console.log("[ContractService] Successfully updated campaign_ambassador status to contract_signed");
        }
      } else {
        console.log("[ContractService] Not updating campaign_ambassador status:", {
          newStatus,
          campaign_ambassador_id: result.campaign_ambassador_id
        });
      }

      return result;
    } catch (error) {
      handleError(error, "signContractAsClient");
    }
  },

  async signContractAsAmbassador(contractId: string): Promise<Contract> {
    try {
      const supabase = createClient();
      
      // First, get the current contract to check if client has already signed
      const { data: currentContract, error: fetchError } = await supabase
        .from("contracts")
        .select("client_signed_at")
        .eq("id", contractId)
        .single();

      if (fetchError) throw fetchError;

      // Determine the new status based on whether both parties will have signed
      const willBeFullySigned = currentContract.client_signed_at !== null;
      const newStatus = willBeFullySigned ? "active" : "pending_ambassador_signature";
      
      console.log("[ContractService] Ambassador signing - willBeFullySigned:", willBeFullySigned, "newStatus:", newStatus);
      
      const { data: result, error } = await supabase
        .from("contracts")
        .update({
          ambassador_signed_at: new Date().toISOString(),
          terms_accepted: true,
          status: newStatus,
        })
        .eq("id", contractId)
        .select()
        .single();

      if (error) throw error;

      // Update campaign_ambassador status when contract becomes active
      if (newStatus === "active" && result.campaign_ambassador_id) {
        console.log("[ContractService] Contract became active, updating campaign_ambassador status");
        console.log("[ContractService] campaign_ambassador_id:", result.campaign_ambassador_id);
        
        const { error: caError } = await supabase
          .from("campaign_ambassadors")
          .update({ status: "contract_signed" })
          .eq("id", result.campaign_ambassador_id);
        
        if (caError) {
          console.error("Failed to update campaign_ambassador status:", caError);
        } else {
          console.log("[ContractService] Successfully updated campaign_ambassador status to contract_signed");
        }
      } else {
        console.log("[ContractService] Not updating campaign_ambassador status:", {
          newStatus,
          campaign_ambassador_id: result.campaign_ambassador_id
        });
      }

      return result;
    } catch (error) {
      handleError(error, "signContractAsAmbassador");
    }
  },
};