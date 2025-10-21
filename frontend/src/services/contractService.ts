/**
 * Contract Service - Handles all contract-related operations via backend API
 * NO direct Supabase calls - all operations go through FastAPI backend
 */

import { API_URL } from '@/config/api';
import { authFetch, authPost, authPut, authDelete, handleApiResponse } from '@/utils/fetch';

const API_BASE_URL = API_URL;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Contract {
  id: string;
  contract_text: string | null;
  terms_accepted: boolean;
  created_at: string;
  campaign_ambassador_id: string;
  client_id: string;
  campaign_name?: string;
  ambassador_name?: string;
}

export interface CreateContractData {
  payment_type: 'pay_per_post' | 'pay_per_cpm';
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
function handleError(error: unknown, context: string) {
  console.error(`[ContractService] ${context}:`, error);
  
  const message = error instanceof Error 
    ? error.message 
    : typeof error === 'string' 
    ? error 
    : 'An unexpected error occurred';
  
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
      const response = await authPost(`${API_BASE_URL}/api/contracts/create`, data);
      const result = await handleApiResponse<{ contract: Contract }>(response);
      return result.contract;
    } catch (error) {
      return handleError(error, 'createContract');
    }
  },

  /**
   * Get all contracts for a client
   */
  async getContractsForClient(clientId: string): Promise<Contract[]> {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/contracts/client/${clientId}`);
      const result = await handleApiResponse<{ contracts: Contract[] }>(response);
      return result.contracts || [];
    } catch (error) {
      return handleError(error, 'getContractsForClient');
    }
  },

  /**
   * Get all contracts for an ambassador
   */
  async getContractsForAmbassador(ambassadorId: string): Promise<Contract[]> {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/contracts/ambassador/${ambassadorId}`);
      const result = await handleApiResponse<{ contracts: Contract[] }>(response);
      return result.contracts || [];
    } catch (error) {
      return handleError(error, 'getContractsForAmbassador');
    }
  },

  /**
   * Get a single contract by ID
   */
  async getContract(contractId: string): Promise<Contract> {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/contracts/${contractId}`);
      const result = await handleApiResponse<{ contract: Contract }>(response);
      return result.contract;
    } catch (error) {
      return handleError(error, 'getContract');
    }
  },

  /**
   * Accept/sign a contract
   */
  async acceptContract(contractId: string, userRole: 'client' | 'ambassador'): Promise<Contract> {
    try {
      const response = await authPost(
        `${API_BASE_URL}/api/contracts/${contractId}/accept`,
        { role: userRole }
      );
      const result = await handleApiResponse<{ contract: Contract }>(response);
      return result.contract;
    } catch (error) {
      return handleError(error, 'acceptContract');
    }
  },

  /**
   * Update a contract
   */
  async updateContract(contractId: string, updates: Partial<CreateContractData>): Promise<Contract> {
    try {
      const response = await authPut(`${API_BASE_URL}/api/contracts/${contractId}`, updates);
      const result = await handleApiResponse<{ contract: Contract }>(response);
      return result.contract;
    } catch (error) {
      return handleError(error, 'updateContract');
    }
  },

  /**
   * Delete a contract
   */
  async deleteContract(contractId: string): Promise<void> {
    try {
      const response = await authDelete(`${API_BASE_URL}/api/contracts/${contractId}`);
      await handleApiResponse(response);
    } catch (error) {
      return handleError(error, 'deleteContract');
    }
  }
};
