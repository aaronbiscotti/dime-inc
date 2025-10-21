from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

# Defines the possible statuses a contract can have.
ContractStatus = Literal["draft", "pending_ambassador_signature", "active", "completed", "terminated"]

class ContractBase(BaseModel):
    """Base contract model with common fields."""
    campaign_ambassador_id: Optional[str] = None
    client_id: Optional[str] = None
    contract_text: Optional[str] = None
    payment_type: Literal["pay_per_post", "pay_per_cpm"]
    cost_per_cpm: Optional[float] = None
    target_impressions: Optional[int] = None
    start_date: Optional[str] = None
    usage_rights_duration: Optional[str] = None
    terms_accepted: bool = False
    contract_file_url: Optional[str] = None
    pdf_url: Optional[str] = None
    ambassador_signed_at: Optional[str] = None
    client_signed_at: Optional[str] = None
    status: ContractStatus = "draft"  # Add status field


class ContractCreate(ContractBase):
    """Model for creating a new contract."""
    # Note: id field removed - database generates UUID automatically


class ContractUpdate(BaseModel):
    """Model for updating a contract."""
    contract_text: Optional[str] = None
    payment_type: Optional[Literal["pay_per_post", "pay_per_cpm"]] = None
    cost_per_cpm: Optional[float] = None
    target_impressions: Optional[int] = None
    start_date: Optional[str] = None
    usage_rights_duration: Optional[str] = None
    terms_accepted: Optional[bool] = None
    contract_file_url: Optional[str] = None
    pdf_url: Optional[str] = None
    ambassador_signed_at: Optional[str] = None
    client_signed_at: Optional[str] = None
    status: Optional[ContractStatus] = None # Allow status updates


class Contract(ContractBase):
    """Full contract model with all fields."""
    id: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True
