/**
 * Submission Service - Handles all submission-related operations via direct Supabase calls
 * Now uses RLS policies for security instead of FastAPI backend
 */

import { createClient } from "@/lib/supabase/client"; // Use the client-side client

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type SubmissionStatus =
  | "pending_review"
  | "approved"
  | "requires_changes";

export interface Submission {
  id: string;
  campaign_ambassador_id: string;
  content_url: string;
  ad_code: string | null;
  status: SubmissionStatus;
  feedback: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

export interface CreateSubmissionData {
  campaign_ambassador_id: string;
  content_url: string;
  ad_code?: string;
}

export interface ReviewSubmissionData {
  status: "approved" | "requires_changes";
  feedback?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Handle API errors consistently
 */
function handleError(error: unknown, context: string): never {
  console.error(`[SubmissionService] ${context}:`, error);

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "An unexpected error occurred";

  throw new Error(message);
}

// ============================================================================
// SUBMISSION SERVICE
// ============================================================================

class SubmissionService {
  private supabase = createClient(); // Instantiate the client

  async createSubmission(data: CreateSubmissionData): Promise<Submission> {
    try {
      const { data: result, error } = await this.supabase
        .from("campaign_submissions")
        .insert({
          campaign_ambassador_id: data.campaign_ambassador_id,
          content_url: data.content_url,
          ad_code: data.ad_code || null,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      handleError(error, "createSubmission");
    }
  }

  async getSubmissionsForCampaign(campaignId: string): Promise<Submission[]> {
    try {
      const { data, error } = await this.supabase
        .from("campaign_submissions")
        .select(`
          *,
          campaign_ambassadors!inner(
            campaign_id
          )
        `)
        .eq("campaign_ambassadors.campaign_id", campaignId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, "getSubmissionsForCampaign");
    }
  }

  async getMySubmissionsForCampaign(
    campaignAmbassadorId: string
  ): Promise<Submission[]> {
    try {
      const { data, error } = await this.supabase
        .from("campaign_submissions")
        .select("*")
        .eq("campaign_ambassador_id", campaignAmbassadorId)
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, "getMySubmissionsForCampaign");
    }
  }

  async reviewSubmission(
    submissionId: string,
    data: ReviewSubmissionData
  ): Promise<Submission> {
    try {
      const { data: result, error } = await this.supabase
        .from("campaign_submissions")
        .update({
          status: data.status,
          feedback: data.feedback || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", submissionId)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      handleError(error, "reviewSubmission");
    }
  }
}

export const submissionService = new SubmissionService();