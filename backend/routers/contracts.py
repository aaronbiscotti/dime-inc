from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime, timezone
from supabase_client import admin_client
from core.security import get_current_user
from models.contracts import Contract, ContractCreate, ContractUpdate, ContractStatus

router = APIRouter(tags=["contracts"])


@router.get("/client/{client_id}")
async def get_contracts_for_client(
    client_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all contracts for a specific client.
    """
    try:
        # Verify user is authorized (must be the client or an admin)
        if current_user["id"] != client_id:
            client_profile = current_user.get("client_profile")
            if not client_profile or client_profile["id"] != client_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to view these contracts"
                )

        # Fetch contracts for this client
        contracts_result = admin_client.table("contracts").select("*").eq("client_id", client_id).order("created_at", desc=True).execute()

        print(f"Found {len(contracts_result.data or [])} contracts for client {client_id}")

        # Enrich each contract with campaign and ambassador data
        enriched_contracts = []
        for contract in contracts_result.data or []:
            # Get campaign_ambassador details
            ca_result = admin_client.table("campaign_ambassadors").select("campaign_id, ambassador_id").eq("id", contract["campaign_ambassador_id"]).maybe_single().execute()

            if ca_result and ca_result.data:
                ca_data = ca_result.data
                
                # Get campaign details
                campaign_result = admin_client.table("campaigns").select("id, title").eq("id", ca_data["campaign_id"]).maybe_single().execute()
                
                # Get ambassador details
                ambassador_result = admin_client.table("ambassador_profiles").select("id, full_name, instagram_handle").eq("id", ca_data["ambassador_id"]).maybe_single().execute()
                
                # Enrich contract with campaign and ambassador data
                enriched_contract = {
                    **contract,
                    "campaign_ambassadors": {
                        "id": contract["campaign_ambassador_id"],
                        "campaigns": campaign_result.data if campaign_result.data else None,
                        "ambassador_profiles": ambassador_result.data if ambassador_result.data else None
                    }
                }

                campaign_title = campaign_result.data.get("title", "Unknown") if campaign_result.data else "Unknown"
                ambassador_name = ambassador_result.data.get("full_name", "Unknown") if ambassador_result.data else "Unknown"
                print(f"Contract ID: {contract.get('id')}, Campaign: {campaign_title}, Ambassador: {ambassador_name}")

                enriched_contracts.append(enriched_contract)
            else:
                print(f"Contract ID: {contract.get('id')}, Campaign: Unknown (no campaign_ambassador), Ambassador: Unknown")
                enriched_contracts.append(contract)

        return {
            "contracts": enriched_contracts
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching contracts: {str(e)}"
        )


@router.get("/ambassador/{ambassador_id}")
async def get_contracts_for_ambassador(
    ambassador_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all contracts for a specific ambassador.
    """
    try:
        # Verify user is authorized (must be the ambassador or an admin)
        ambassador_profile = current_user.get("ambassador_profile")
        if not ambassador_profile or ambassador_profile["user_id"] != ambassador_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view these contracts"
            )
        
        # Fetch contracts for this ambassador via campaign_ambassadors
        # First get campaign_ambassador_ids for this ambassador
        ca_result = admin_client.table("campaign_ambassadors").select("id").eq("ambassador_id", ambassador_profile["id"]).execute()
        
        if not ca_result.data:
            return {"contracts": []}
        
        ca_ids = [ca["id"] for ca in ca_result.data]
        result = admin_client.table("contracts").select("*").in_("campaign_ambassador_id", ca_ids).order("created_at", desc=True).execute()
        
        return {
            "contracts": result.data or []
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching contracts: {str(e)}"
        )


@router.get("/{contract_id}")
async def get_contract(
    contract_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get details for a specific contract.
    """
    try:
        # Get the contract
        contract_result = admin_client.table("contracts").select("*").eq("id", contract_id).maybe_single().execute()

        if not contract_result or not contract_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contract not found"
            )

        contract = contract_result.data

        # Get campaign_ambassador details
        ca_result = admin_client.table("campaign_ambassadors").select("campaign_id, ambassador_id").eq("id", contract["campaign_ambassador_id"]).maybe_single().execute()

        if ca_result and ca_result.data:
            ca_data = ca_result.data

            # Get campaign details
            campaign_result = admin_client.table("campaigns").select("id, title, description").eq("id", ca_data["campaign_id"]).maybe_single().execute()

            # Get ambassador details
            ambassador_result = admin_client.table("ambassador_profiles").select("id, full_name, instagram_handle").eq("id", ca_data["ambassador_id"]).maybe_single().execute()

            # Enrich contract with campaign and ambassador data
            enriched_contract = {
                **contract,
                "campaign_ambassadors": {
                    "id": contract["campaign_ambassador_id"],
                    "campaigns": campaign_result.data if campaign_result.data else None,
                    "ambassador_profiles": ambassador_result.data if ambassador_result.data else None
                }
            }

            return enriched_contract
        else:
            return contract

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching contract: {str(e)}"
        )


@router.post("/")
async def create_contract(
    contract: ContractCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new contract. Only clients can create contracts.
    The contract is created with a 'pending_ambassador_signature' status.
    """
    try:
        # Verify user is a client
        if not current_user.get("profile") or current_user["profile"]["role"] != "client":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only clients can create contracts"
            )

        # Create contract
        contract_data = contract.model_dump()
        contract_data["created_at"] = datetime.now(timezone.utc).isoformat()
        contract_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        # Set the client signature time and initial status
        contract_data["client_signed_at"] = datetime.now(timezone.utc).isoformat()
        contract_data["status"] = "pending_ambassador_signature"

        result = admin_client.table("contracts").insert(contract_data).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create contract"
            )

        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating contract: {str(e)}"
        )

@router.post("/{contract_id}/sign")
async def sign_contract(
    contract_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Allows an ambassador to sign a contract.
    """
    try:
        # 1. Verify user is an ambassador
        ambassador_profile = current_user.get("ambassador_profile")
        if not ambassador_profile:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only ambassadors can sign contracts."
            )

        # 2. Fetch the contract and its associated ambassador
        contract_res = admin_client.table("contracts").select("*, campaign_ambassadors(ambassador_id)").eq("id", contract_id).maybe_single().execute()

        if not contract_res.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found.")

        contract = contract_res.data
        
        # 3. Verify the ambassador signing is the one on the contract
        contract_ambassador_id = contract.get("campaign_ambassadors", {}).get("ambassador_id")
        if not contract_ambassador_id or contract_ambassador_id != ambassador_profile["id"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to sign this contract.")

        # 4. Check contract status
        if contract["status"] != "pending_ambassador_signature":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Contract is not pending signature. Current status: {contract['status']}")

        # 5. Update the contract
        update_data = {
            "ambassador_signed_at": datetime.now(timezone.utc).isoformat(),
            "status": "active",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        updated_contract_res = admin_client.table("contracts").update(update_data).eq("id", contract_id).execute()

        if not updated_contract_res.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to sign contract.")
        
        return updated_contract_res.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while signing the contract: {str(e)}"
        )


@router.put("/{contract_id}")
async def update_contract(
    contract_id: str,
    contract: ContractUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update a contract.
    """
    try:
        # Verify contract exists
        existing = admin_client.table("contracts").select("*").eq("id", contract_id).maybe_single().execute()

        if not existing or not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contract not found"
            )

        # Update contract
        update_data = contract.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

        result = admin_client.table("contracts").update(update_data).eq("id", contract_id).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update contract"
            )

        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating contract: {str(e)}"
        )


@router.delete("/{contract_id}")
async def delete_contract(
    contract_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a contract.
    """
    try:
        # Verify contract exists
        existing = admin_client.table("contracts").select("*").eq("id", contract_id).maybe_single().execute()

        if not existing or not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contract not found"
            )

        # Delete contract
        admin_client.table("contracts").delete().eq("id", contract_id).execute()

        return {"message": "Contract deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting contract: {str(e)}"
        )

