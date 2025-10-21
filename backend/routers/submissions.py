from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime, timezone
from supabase_client import admin_client
from core.security import get_current_user
from models.submissions import Submission, SubmissionCreate, SubmissionReview

router = APIRouter(prefix="/api/submissions", tags=["submissions"])

@router.post("/", response_model=Submission)
async def create_submission(
    submission_data: SubmissionCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Allows an ambassador to submit content for a campaign.
    """
    try:
        ambassador_profile = current_user.get("ambassador_profile")
        if not ambassador_profile:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only ambassadors can submit content.")

        # Verify the ambassador is part of the campaign_ambassador record
        ca_res = admin_client.table("campaign_ambassadors").select("id, ambassador_id").eq("id", submission_data.campaign_ambassador_id).maybe_single().execute()
        if not ca_res.data or ca_res.data.get("ambassador_id") != ambassador_profile["id"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to submit to this campaign.")

        # Create the submission
        new_submission_res = admin_client.table("campaign_submissions").insert({
            "campaign_ambassador_id": submission_data.campaign_ambassador_id,
            "content_url": submission_data.content_url,
            "ad_code": submission_data.ad_code,
            "status": "pending_review"
        }).execute()

        if not new_submission_res.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create submission.")

        return new_submission_res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An error occurred: {str(e)}")

@router.get("/campaign/{campaign_id}", response_model=List[Submission])
async def get_submissions_for_campaign(
    campaign_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Allows a client to view all submissions for one of their campaigns.
    """
    client_profile = current_user.get("client_profile")
    if not client_profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only clients can view campaign submissions.")
    
    # This is a complex query that is best handled by a database function or view for performance.
    # For now, we fetch in steps.
    # 1. Verify client owns campaign
    campaign_res = admin_client.table("campaigns").select("id").eq("id", campaign_id).eq("client_id", client_profile["id"]).maybe_single().execute()
    if not campaign_res.data:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this campaign.")

    # 2. Get all campaign_ambassador_ids for this campaign
    ca_ids_res = admin_client.table("campaign_ambassadors").select("id").eq("campaign_id", campaign_id).execute()
    if not ca_ids_res.data:
        return []
    
    ca_ids = [item['id'] for item in ca_ids_res.data]

    # 3. Get all submissions linked to those campaign_ambassador_ids
    submissions_res = admin_client.table("campaign_submissions").select("*").in_("campaign_ambassador_id", ca_ids).order("submitted_at", desc=True).execute()

    return submissions_res.data or []

@router.get("/ambassador/{campaign_ambassador_id}", response_model=List[Submission])
async def get_my_submissions_for_campaign(
    campaign_ambassador_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Allows an ambassador to view their submissions for a specific campaign.
    """
    ambassador_profile = current_user.get("ambassador_profile")
    if not ambassador_profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only ambassadors can view their submissions.")

    submissions_res = admin_client.table("campaign_submissions").select("*").eq("campaign_ambassador_id", campaign_ambassador_id).order("submitted_at", desc=True).execute()
    return submissions_res.data or []


@router.put("/{submission_id}/review", response_model=Submission)
async def review_submission(
    submission_id: str,
    review_data: SubmissionReview,
    current_user: dict = Depends(get_current_user)
):
    """
    Allows a client to approve or request changes to a submission.
    """
    client_profile = current_user.get("client_profile")
    if not client_profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only clients can review submissions.")

    # To verify ownership, we need to join through submissions -> campaign_ambassadors -> campaigns
    # This is another candidate for a DB function. Here's the multi-query version:
    submission_res = admin_client.table("campaign_submissions").select("*, campaign_ambassadors(campaigns(client_id))").eq("id", submission_id).maybe_single().execute()
    
    if not submission_res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found.")

    # Extremely nested access due to PostgREST response structure
    if submission_res.data.get("campaign_ambassadors", {}).get("campaigns", {}).get("client_id") != client_profile["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to review this submission.")

    update_payload = {
        "status": review_data.status,
        "feedback": review_data.feedback,
        "reviewed_at": datetime.now(timezone.utc).isoformat()
    }

    updated_submission_res = admin_client.table("campaign_submissions").update(update_payload).eq("id", submission_id).execute()

    if not updated_submission_res.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update submission.")
        
    return updated_submission_res.data[0]
