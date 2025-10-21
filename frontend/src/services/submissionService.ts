import { API_URL } from "@/config/api";
import { authFetch, authPost, authPut, handleApiResponse } from "@/utils/fetch";

const API_BASE_URL = API_URL;

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
// SUBMISSION SERVICE
// ============================================================================

class SubmissionService {
  async createSubmission(data: CreateSubmissionData): Promise<Submission> {
    const response = await authPost(`${API_BASE_URL}/api/submissions/`, data);
    return handleApiResponse<Submission>(response);
  }

  async getSubmissionsForCampaign(campaignId: string): Promise<Submission[]> {
    const response = await authFetch(
      `${API_BASE_URL}/api/submissions/campaign/${campaignId}`
    );
    return handleApiResponse<Submission[]>(response);
  }

  async getMySubmissionsForCampaign(
    campaignAmbassadorId: string
  ): Promise<Submission[]> {
    const response = await authFetch(
      `${API_BASE_URL}/api/submissions/ambassador/${campaignAmbassadorId}`
    );
    return handleApiResponse<Submission[]>(response);
  }

  async reviewSubmission(
    submissionId: string,
    data: ReviewSubmissionData
  ): Promise<Submission> {
    const response = await authPut(
      `${API_BASE_URL}/api/submissions/${submissionId}/review`,
      data
    );
    return handleApiResponse<Submission>(response);
  }
}

export const submissionService = new SubmissionService();
