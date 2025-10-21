/**
 * Contract Service - Handles all contract-related operations via backend API
 * NO direct Supabase calls - all operations go through FastAPI backend
 */

import { API_URL } from "@/config/api";
import {
  authFetch,
  authPost,
  authPut,
  authDelete,
  handleApiResponse,
} from "@/utils/fetch";

const API_BASE_URL = API_URL;

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
      const response = await authPost(`${API_BASE_URL}/api/contracts`, data); // Changed to POST to base URL
      return await handleApiResponse<Contract>(response);
    } catch (error) {
      handleError(error, "createContract");
    }
  },

  /**
   * Get all contracts for a client
   */
  async getContractsForClient(clientId: string): Promise<Contract[]> {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/contracts/client/${clientId}`
      );
      const result = await handleApiResponse<{ contracts: Contract[] }>(
        response
      );
      return result.contracts || [];
    } catch (error) {
      handleError(error, "getContractsForClient");
    }
  },

  /**
   * Get all contracts for an ambassador
   */
  async getContractsForAmbassador(ambassadorId: string): Promise<Contract[]> {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/contracts/ambassador/${ambassadorId}`
      );
      const result = await handleApiResponse<{ contracts: Contract[] }>(
        response
      );
      return result.contracts || [];
    } catch (error) {
      handleError(error, "getContractsForAmbassador");
    }
  },

  /**
   * Get a single contract by ID
   */
  async getContract(contractId: string): Promise<Contract> {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/contracts/${contractId}`
      );
      return await handleApiResponse<Contract>(response);
    } catch (error) {
      handleError(error, "getContract");
    }
  },

  /**
   * Accept/sign a contract (for ambassadors)
   */
  async signContract(contractId: string): Promise<Contract> {
    try {
      const response = await authPost(
        `${API_BASE_URL}/api/contracts/${contractId}/sign`,
        {}
      );
      return await handleApiResponse<Contract>(response);
    } catch (error) {
      handleError(error, "signContract");
    }
  },
};
