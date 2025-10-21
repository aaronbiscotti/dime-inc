"""Unit tests for profile endpoints."""

from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app

client = TestClient(app)


class TestUpdateAmbassadorProfile:
    """Tests for updating ambassador profiles."""

    def test_ambassador_can_update_own_profile(self):
        """Tests that authenticated ambassador can update their profile."""
        with patch("core.security.admin_client.auth.get_user") as mock_get_user, \
             patch("core.security.admin_client.table") as mock_auth_table, \
             patch("routers.profiles.admin_client.table") as mock_profiles_table:
            
            # Mock authenticated ambassador
            mock_user = MagicMock()
            mock_user.id = "ambassador-user-id"
            mock_user.email = "ambassador@example.com"
            mock_user_response = MagicMock()
            mock_user_response.user = mock_user
            mock_get_user.return_value = mock_user_response
            
            mock_profile = MagicMock()
            mock_profile.data = {"id": "ambassador-user-id", "role": "ambassador"}
            
            mock_ambassador_profile = MagicMock()
            mock_ambassador_profile.data = {
                "id": "ambassador-profile-id",
                "user_id": "ambassador-user-id",
                "full_name": "Old Name"
            }
            
            def mock_auth_table_fn(table_name):
                mock_chain = MagicMock()
                if table_name == "profiles":
                    mock_chain.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_profile
                elif table_name == "ambassador_profiles":
                    mock_chain.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_ambassador_profile
                return mock_chain
            mock_auth_table.side_effect = mock_auth_table_fn
            
            # Mock profile update for ambassador_profiles table
            def mock_profiles_table_fn(table_name):
                mock_chain = MagicMock()
                if table_name == "ambassador_profiles":
                    mock_updated = MagicMock()
                    mock_updated.data = [{
                        "id": "ambassador-profile-id",
                        "full_name": "New Name",
                        "bio": "Updated bio"
                    }]
                    mock_chain.update.return_value.eq.return_value.execute.return_value = mock_updated
                return mock_chain
            mock_profiles_table.side_effect = mock_profiles_table_fn

            response = client.put(
                "/api/profiles/ambassador",
                headers={"Authorization": "Bearer fake-jwt-token"},
                json={
                    "full_name": "New Name",
                    "bio": "Updated bio"
                }
            )

            assert response.status_code == 200
            assert response.json()["success"] is True
            assert response.json()["profile"]["full_name"] == "New Name"

    def test_client_cannot_update_ambassador_profile(self):
        """Tests that client cannot update ambassador profile (403)."""
        with patch("core.security.admin_client.auth.get_user") as mock_get_user, \
             patch("core.security.admin_client.table") as mock_table:
            
            # Mock authenticated client
            mock_user = MagicMock()
            mock_user.id = "client-user-id"
            mock_user.email = "client@example.com"
            mock_user_response = MagicMock()
            mock_user_response.user = mock_user
            mock_get_user.return_value = mock_user_response
            
            mock_profile = MagicMock()
            mock_profile.data = {"id": "client-user-id", "role": "client"}
            mock_table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_profile

            response = client.put(
                "/api/profiles/ambassador",
                headers={"Authorization": "Bearer fake-jwt-token"},
                json={"full_name": "New Name"}
            )

            assert response.status_code == 403
            assert response.json()["detail"] == "User is not an ambassador"


class TestUpdateClientProfile:
    """Tests for updating client profiles."""

    def test_client_can_update_own_profile(self):
        """Tests that authenticated client can update their profile."""
        with patch("core.security.admin_client.auth.get_user") as mock_get_user, \
             patch("core.security.admin_client.table") as mock_auth_table, \
             patch("routers.profiles.admin_client.table") as mock_profiles_table:
            
            # Mock authenticated client
            mock_user = MagicMock()
            mock_user.id = "client-user-id"
            mock_user.email = "client@example.com"
            mock_user_response = MagicMock()
            mock_user_response.user = mock_user
            mock_get_user.return_value = mock_user_response
            
            mock_profile = MagicMock()
            mock_profile.data = {"id": "client-user-id", "role": "client"}
            
            mock_client_profile = MagicMock()
            mock_client_profile.data = {
                "id": "client-profile-id",
                "user_id": "client-user-id",
                "company_name": "Old Company"
            }
            
            def mock_auth_table_fn(table_name):
                mock_chain = MagicMock()
                if table_name == "profiles":
                    mock_chain.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_profile
                elif table_name == "client_profiles":
                    mock_chain.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_client_profile
                return mock_chain
            mock_auth_table.side_effect = mock_auth_table_fn
            
            # Mock profile update for client_profiles table
            def mock_profiles_table_fn(table_name):
                mock_chain = MagicMock()
                if table_name == "client_profiles":
                    mock_updated = MagicMock()
                    mock_updated.data = [{
                        "id": "client-profile-id",
                        "company_name": "New Company",
                        "industry": "Tech"
                    }]
                    mock_chain.update.return_value.eq.return_value.execute.return_value = mock_updated
                return mock_chain
            mock_profiles_table.side_effect = mock_profiles_table_fn

            response = client.put(
                "/api/profiles/client",
                headers={"Authorization": "Bearer fake-jwt-token"},
                json={
                    "company_name": "New Company",
                    "industry": "Tech"
                }
            )

            assert response.status_code == 200
            assert response.json()["success"] is True
            assert response.json()["profile"]["company_name"] == "New Company"

    def test_ambassador_cannot_update_client_profile(self):
        """Tests that ambassador cannot update client profile (403)."""
        with patch("core.security.admin_client.auth.get_user") as mock_get_user, \
             patch("core.security.admin_client.table") as mock_table:
            
            # Mock authenticated ambassador
            mock_user = MagicMock()
            mock_user.id = "ambassador-user-id"
            mock_user.email = "ambassador@example.com"
            mock_user_response = MagicMock()
            mock_user_response.user = mock_user
            mock_get_user.return_value = mock_user_response
            
            mock_profile = MagicMock()
            mock_profile.data = {"id": "ambassador-user-id", "role": "ambassador"}
            mock_table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_profile

            response = client.put(
                "/api/profiles/client",
                headers={"Authorization": "Bearer fake-jwt-token"},
                json={"company_name": "New Company"}
            )

            assert response.status_code == 403
            assert response.json()["detail"] == "User is not a client"

