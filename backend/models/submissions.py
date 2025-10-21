from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, Literal
from datetime import datetime

SubmissionStatus = Literal["pending_review", "approved", "requires_changes"]

class SubmissionCreate(BaseModel):
    """Model for creating a new content submission."""
    campaign_ambassador_id: str
    content_url: str
    ad_code: Optional[str] = None

    class Config:
        from_attributes = True

class SubmissionReview(BaseModel):
    """Model for a client reviewing a submission."""
    status: Literal["approved", "requires_changes"]
    feedback: Optional[str] = None

class Submission(BaseModel):
    """Full submission model for API responses."""
    id: str
    campaign_ambassador_id: str
    content_url: str
    ad_code: Optional[str] = None
    status: SubmissionStatus
    feedback: Optional[str] = None
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
