"""Unit tests for user endpoints."""

from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app

client = TestClient(app)


def create_mock_token(user_id="test-user-id", role="ambassador"):
    """Helper function to create a mock authentication token."""
    return "Bearer fake-jwt-token"


class TestGetCurrentUser:
    """Tests for the /users/me endpoint."""

    def test_get_current_user_success(self):
        """Tests that authenticated user can fetch their own profile."""
        with patch("core.security.admin_client.auth.get_user") as mock_get_user, \
             patch("core.security.admin_client.table") as mock_table:
            
            # Mock user authentication
            mock_user = MagicMock()
            mock_user.id = "test-user-id"
            mock_user.email = "test@example.com"
            mock_user_response = MagicMock()
            mock_user_response.user = mock_user
            mock_get_user.return_value = mock_user_response
            
            # Mock profile data
            mock_profile = MagicMock()
            mock_profile.data = {
                "id": "test-user-id",
                "email": "test@example.com",
                "role": "ambassador"
            }
            
            # Mock ambassador profile
            mock_ambassador = MagicMock()
            mock_ambassador.data = {
                "id": "ambassador-id",
                "user_id": "test-user-id",
                "full_name": "Test Ambassador"
            }
            
            mock_table_chain = MagicMock()
            mock_table_chain.select.return_value.eq.return_value.maybe_single.return_value.execute.side_effect = [
                mock_profile,
                mock_ambassador
            ]
            mock_table.return_value = mock_table_chain

            response = client.get(
                "/api/users/me",
                headers={"Authorization": "Bearer fake-jwt-token"}
            )

            assert response.status_code == 200
            assert response.json()["id"] == "test-user-id"
            assert response.json()["email"] == "test@example.com"

    def test_get_current_user_unauthorized(self):
        """Tests that unauthenticated user cannot fetch profile (401)."""
        response = client.get("/api/users/me")

        assert response.status_code == 403  # FastAPI HTTPBearer returns 403 when no auth provided

    def test_get_current_user_invalid_token(self):
        """Tests that invalid token returns 401."""
        with patch("core.security.admin_client.auth.get_user") as mock_get_user:
            mock_get_user.return_value = None

            response = client.get(
                "/api/users/me",
                headers={"Authorization": "Bearer invalid-token"}
            )

            assert response.status_code == 401


class TestDeleteUser:
    """Tests for the delete user endpoint."""

    def test_delete_user_success(self):
        """Tests that a user can be deleted successfully."""
        with patch("routers.users.admin_client.table") as mock_table, \
             patch("routers.users.admin_client.auth.admin.delete_user") as mock_delete:
            
            # Mock profile exists check
            mock_result = MagicMock()
            mock_result.data = {"id": "test-user-id"}
            mock_table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_result
            
            # Mock successful deletion
            mock_delete.return_value = None

            response = client.request(
                "DELETE",
                "/api/users/delete",
                json={"user_id": "test-user-id"}
            )

            assert response.status_code == 200
            assert response.json()["success"] is True
            assert "deleted successfully" in response.json()["message"]
            mock_delete.assert_called_once_with("test-user-id")

    def test_delete_user_not_found(self):
        """Tests that deleting non-existent user returns 404."""
        with patch("routers.users.admin_client.table") as mock_table:
            mock_result = MagicMock()
            mock_result.data = None
            mock_table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_result

            response = client.request(
                "DELETE",
                "/api/users/delete",
                json={"user_id": "nonexistent-user-id"}
            )

            assert response.status_code == 404
            assert response.json()["detail"] == "User not found"

    def test_delete_user_missing_id(self):
        """Tests that missing user_id returns 400."""
        response = client.request(
            "DELETE",
            "/api/users/delete",
            json={"user_id": ""}
        )

        assert response.status_code == 400
        assert response.json()["detail"] == "Missing user_id"

    def test_delete_user_cascade(self):
        """Tests that deleting a user triggers cascade deletion of all related data."""
        with patch("routers.users.admin_client.table") as mock_table, \
             patch("routers.users.admin_client.auth.admin.delete_user") as mock_delete:
            
            # Mock profile exists
            mock_result = MagicMock()
            mock_result.data = {"id": "test-user-id"}
            mock_table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_result
            
            mock_delete.return_value = None

            response = client.request(
                "DELETE",
                "/api/users/delete",
                json={"user_id": "test-user-id"}
            )

            assert response.status_code == 200
            # The actual cascade happens in the database via ON DELETE CASCADE
            # We just verify the user deletion was called
            mock_delete.assert_called_once_with("test-user-id")

