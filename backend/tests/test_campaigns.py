"""Unit tests for campaign endpoints."""

from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app

client = TestClient(app)


class TestCreateCampaign:
    """Tests for creating campaigns."""

    def test_client_can_create_campaign(self):
        """Tests that authenticated client can create a campaign."""
        with patch("core.security.admin_client.auth.get_user") as mock_get_user, \
             patch("supabase_client.admin_client.table") as mock_table:
            
            # Mock authenticated user
            mock_user = MagicMock()
            mock_user.id = "client-user-id"
            mock_user.email = "client@example.com"
            mock_user_response = MagicMock()
            mock_user_response.user = mock_user
            mock_get_user.return_value = mock_user_response
            
            # Mock profile data (client)
            mock_profile = MagicMock()
            mock_profile.data = {
                "id": "client-user-id",
                "role": "client"
            }
            
            # Mock client profile
            mock_client_profile = MagicMock()
            mock_client_profile.data = {
                "id": "client-profile-id",
                "user_id": "client-user-id",
                "company_name": "Test Company"
            }
            
            # Unified table mock for all tables
            def mock_table_fn(table_name):
                mock_chain = MagicMock()
                if table_name == "profiles":
                    mock_chain.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_profile
                elif table_name == "client_profiles":
                    mock_chain.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_client_profile
                elif table_name == "campaigns":
                    mock_result = MagicMock()
                    mock_result.data = [{
                        "id": "campaign-id",
                        "title": "Test Campaign",
                        "status": "draft"
                    }]
                    mock_chain.insert.return_value.execute.return_value = mock_result
                return mock_chain
            mock_table.side_effect = mock_table_fn

            response = client.post(
                "/api/campaigns/create",
                headers={"Authorization": "Bearer fake-jwt-token"},
                json={
                    "title": "Test Campaign",
                    "description": "Test Description",
                    "budget": "$1000",
                    "timeline": "2 weeks",
                    "requirements": ["Requirement 1"],
                    "target_niches": ["Fashion"],
                    "campaign_type": "Instagram",
                    "deliverables": ["3 posts"]
                }
            )

            assert response.status_code == 200
            assert response.json()["success"] is True
            assert response.json()["campaign"]["title"] == "Test Campaign"

    def test_ambassador_cannot_create_campaign(self):
        """Tests that authenticated ambassador cannot create a campaign (403)."""
        with patch("core.security.admin_client.auth.get_user") as mock_get_user, \
             patch("core.security.admin_client.table") as mock_table:
            
            # Mock authenticated ambassador user
            mock_user = MagicMock()
            mock_user.id = "ambassador-user-id"
            mock_user.email = "ambassador@example.com"
            mock_user_response = MagicMock()
            mock_user_response.user = mock_user
            mock_get_user.return_value = mock_user_response
            
            mock_profile = MagicMock()
            mock_profile.data = {
                "id": "ambassador-user-id",
                "role": "ambassador"
            }
            
            mock_table_chain = MagicMock()
            mock_table_chain.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_profile
            mock_table.return_value = mock_table_chain

            response = client.post(
                "/api/campaigns/create",
                headers={"Authorization": "Bearer fake-jwt-token"},
                json={
                    "title": "Test Campaign",
                    "description": "Test Description",
                    "budget": "$1000",
                    "timeline": "2 weeks",
                    "requirements": ["Requirement 1"],
                    "target_niches": ["Fashion"],
                    "campaign_type": "Instagram",
                    "deliverables": ["3 posts"]
                }
            )

            assert response.status_code == 403
            assert response.json()["detail"] == "Only clients can create campaigns"


class TestGetCampaigns:
    """Tests for fetching campaigns."""

    def test_user_can_fetch_own_campaigns(self):
        """Tests that authenticated user can fetch their own campaigns."""
        with patch("core.security.admin_client.auth.get_user") as mock_get_user, \
             patch("core.security.admin_client.table") as mock_auth_table, \
             patch("routers.campaigns.admin_client.table") as mock_campaigns_table:
            
            # Mock authenticated user
            mock_user = MagicMock()
            mock_user.id = "client-user-id"
            mock_user.email = "client@example.com"
            mock_user_response = MagicMock()
            mock_user_response.user = mock_user
            mock_get_user.return_value = mock_user_response
            
            # Mock profile
            mock_profile = MagicMock()
            mock_profile.data = {
                "id": "client-user-id",
                "role": "client"
            }
            
            # Mock client profile
            mock_client_profile = MagicMock()
            mock_client_profile.data = {
                "id": "client-profile-id",
                "user_id": "client-user-id"
            }
            
            def mock_auth_table_fn(table_name):
                mock_chain = MagicMock()
                if table_name == "profiles":
                    mock_chain.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_profile
                elif table_name == "client_profiles":
                    mock_chain.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_client_profile
                return mock_chain
            mock_auth_table.side_effect = mock_auth_table_fn
            
            # Mock campaigns from campaigns table
            def mock_campaigns_table_fn(table_name):
                mock_chain = MagicMock()
                if table_name == "campaigns":
                    mock_campaigns = MagicMock()
                    mock_campaigns.data = [
                        {"id": "campaign-1", "title": "Campaign 1"},
                        {"id": "campaign-2", "title": "Campaign 2"}
                    ]
                    mock_chain.select.return_value.eq.return_value.order.return_value.execute.return_value = mock_campaigns
                return mock_chain
            mock_campaigns_table.side_effect = mock_campaigns_table_fn

            response = client.get(
                "/api/campaigns/client/client-profile-id",
                headers={"Authorization": "Bearer fake-jwt-token"}
            )

            assert response.status_code == 200
            assert len(response.json()["data"]) == 2

    def test_user_cannot_fetch_other_campaigns(self):
        """Tests that user cannot fetch campaigns they do not own (403)."""
        with patch("core.security.admin_client.auth.get_user") as mock_get_user, \
             patch("core.security.admin_client.table") as mock_table:
            
            # Mock authenticated user
            mock_user = MagicMock()
            mock_user.id = "client-user-id"
            mock_user.email = "client@example.com"
            mock_user_response = MagicMock()
            mock_user_response.user = mock_user
            mock_get_user.return_value = mock_user_response
            
            mock_profile = MagicMock()
            mock_profile.data = {
                "id": "client-user-id",
                "role": "client"
            }
            
            mock_client_profile = MagicMock()
            mock_client_profile.data = {
                "id": "client-profile-id",
                "user_id": "client-user-id"
            }
            
            def mock_table_fn(table_name):
                mock_chain = MagicMock()
                if table_name == "profiles":
                    mock_chain.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_profile
                elif table_name == "client_profiles":
                    mock_chain.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_client_profile
                return mock_chain
            mock_table.side_effect = mock_table_fn

            # Try to fetch another client's campaigns
            response = client.get(
                "/api/campaigns/client/different-client-id",
                headers={"Authorization": "Bearer fake-jwt-token"}
            )

            assert response.status_code == 403
            assert response.json()["detail"] == "Not authorized to view these campaigns"

    def test_get_all_open_campaigns(self):
        """Tests that ambassadors can view all open campaigns."""
        with patch("core.security.admin_client.auth.get_user") as mock_get_user, \
             patch("core.security.admin_client.table") as mock_auth_table, \
             patch("routers.campaigns.admin_client.table") as mock_campaigns_table:
            
            # Mock authenticated ambassador
            mock_user = MagicMock()
            mock_user.id = "ambassador-user-id"
            mock_user.email = "ambassador@example.com"
            mock_user_response = MagicMock()
            mock_user_response.user = mock_user
            mock_get_user.return_value = mock_user_response
            
            mock_profile = MagicMock()
            mock_profile.data = {"id": "ambassador-user-id", "role": "ambassador"}
            mock_auth_table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_profile
            
            # Mock open campaigns from campaigns table
            def mock_campaigns_table_fn(table_name):
                mock_chain = MagicMock()
                if table_name == "campaigns":
                    mock_campaigns = MagicMock()
                    mock_campaigns.data = [
                        {"id": "campaign-1", "title": "Open Campaign 1", "status": "active"},
                        {"id": "campaign-2", "title": "Open Campaign 2", "status": "active"}
                    ]
                    mock_chain.select.return_value.eq.return_value.order.return_value.execute.return_value = mock_campaigns
                return mock_chain
            mock_campaigns_table.side_effect = mock_campaigns_table_fn

            response = client.get(
                "/api/campaigns/all",
                headers={"Authorization": "Bearer fake-jwt-token"}
            )

            assert response.status_code == 200
            assert len(response.json()["data"]) == 2


class TestGetCampaignDetails:
    """Tests for fetching campaign details."""

    def test_get_campaign_success(self):
        """Tests that campaign details can be fetched."""
        with patch("core.security.admin_client.auth.get_user") as mock_get_user, \
             patch("core.security.admin_client.table") as mock_auth_table, \
             patch("routers.campaigns.admin_client.table") as mock_campaigns_table:
            
            # Mock authenticated user
            mock_user = MagicMock()
            mock_user.id = "user-id"
            mock_user.email = "user@example.com"
            mock_user_response = MagicMock()
            mock_user_response.user = mock_user
            mock_get_user.return_value = mock_user_response
            
            mock_profile = MagicMock()
            mock_profile.data = {"id": "user-id", "role": "client"}
            
            mock_client_profile = MagicMock()
            mock_client_profile.data = {"id": "client-prof-id", "user_id": "user-id"}
            
            def mock_auth_table_fn(table_name):
                mock_chain = MagicMock()
                if table_name == "profiles":
                    mock_chain.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_profile
                elif table_name == "client_profiles":
                    mock_chain.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_client_profile
                return mock_chain
            mock_auth_table.side_effect = mock_auth_table_fn
            
            # Mock campaign details from campaigns table
            def mock_campaigns_table_fn(table_name):
                mock_chain = MagicMock()
                if table_name == "campaigns":
                    mock_campaign = MagicMock()
                    mock_campaign.data = {
                        "id": "campaign-id",
                        "title": "Test Campaign",
                        "description": "Description"
                    }
                    mock_chain.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_campaign
                return mock_chain
            mock_campaigns_table.side_effect = mock_campaigns_table_fn

            response = client.get(
                "/api/campaigns/campaign-id",
                headers={"Authorization": "Bearer fake-jwt-token"}
            )

            assert response.status_code == 200
            assert response.json()["title"] == "Test Campaign"

    def test_get_campaign_not_found(self):
        """Tests that fetching non-existent campaign returns 404."""
        with patch("core.security.admin_client.auth.get_user") as mock_get_user, \
             patch("core.security.admin_client.table") as mock_auth_table, \
             patch("routers.campaigns.admin_client.table") as mock_campaigns_table:
            
            mock_user = MagicMock()
            mock_user.id = "user-id"
            mock_user_response = MagicMock()
            mock_user_response.user = mock_user
            mock_get_user.return_value = mock_user_response
            
            mock_profile = MagicMock()
            mock_profile.data = {"id": "user-id", "role": "client"}
            
            mock_client_profile = MagicMock()
            mock_client_profile.data = {"id": "client-prof-id", "user_id": "user-id"}
            
            def mock_auth_table_fn(table_name):
                mock_chain = MagicMock()
                if table_name == "profiles":
                    mock_chain.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_profile
                elif table_name == "client_profiles":
                    mock_chain.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_client_profile
                return mock_chain
            mock_auth_table.side_effect = mock_auth_table_fn
            
            # Mock campaign not found from campaigns table
            def mock_campaigns_table_fn(table_name):
                mock_chain = MagicMock()
                if table_name == "campaigns":
                    mock_campaign = MagicMock()
                    mock_campaign.data = None
                    mock_chain.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_campaign
                return mock_chain
            mock_campaigns_table.side_effect = mock_campaigns_table_fn

            response = client.get(
                "/api/campaigns/nonexistent-id",
                headers={"Authorization": "Bearer fake-jwt-token"}
            )

            assert response.status_code == 404
            assert response.json()["detail"] == "Campaign not found"

