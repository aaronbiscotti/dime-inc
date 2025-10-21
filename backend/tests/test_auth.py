"""Unit tests for authentication endpoints."""

from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app

client = TestClient(app)


class TestLogin:
    """Tests for the login endpoint."""

    def test_login_success(self):
        """Tests that a user can successfully log in with correct credentials and receive an access token."""
        with patch("routers.auth.admin_client.auth.sign_in_with_password") as mock_signin:
            # Configure the mock to return a response with serializable session
            class MockUser:
                def __init__(self):
                    self.id = "test-user-id"
                    self.email = "test@example.com"
            
            class MockSession:
                def __init__(self):
                    self.access_token = "fake-jwt-token"
                    self.refresh_token = "fake-refresh-token"
                    self.user = MockUser()
                
                def __dict__(self):
                    return {
                        "access_token": self.access_token,
                        "refresh_token": self.refresh_token,
                        "user": {"id": self.user.id, "email": self.user.email}
                    }
            
            mock_response = MagicMock()
            mock_response.session = MockSession()
            mock_signin.return_value = mock_response

            # Make a simulated request to the login endpoint
            response = client.post(
                "/api/auth/login",
                json={"email": "test@example.com", "password": "password123"}
            )

            # Assert the results
            assert response.status_code == 200
            response_data = response.json()
            assert "access_token" in response_data
            assert response_data["access_token"] == "fake-jwt-token"

    def test_login_failure_wrong_password(self):
        """Tests that the API returns a 401 Unauthorized error when the login credentials are incorrect."""
        with patch("routers.auth.admin_client.auth.sign_in_with_password") as mock_signin:
            # Configure the mock to raise an exception
            mock_signin.side_effect = Exception("Invalid login credentials")

            # Make a simulated request with wrong credentials
            response = client.post(
                "/api/auth/login",
                json={"email": "test@example.com", "password": "wrongpassword"}
            )

            # Assert that the API correctly handled the error
            assert response.status_code == 401
            assert response.json()["detail"] == "Invalid login credentials"

    def test_login_failure_nonexistent_user(self):
        """Tests that login fails with non-existent user."""
        with patch("routers.auth.admin_client.auth.sign_in_with_password") as mock_signin:
            mock_signin.side_effect = Exception("Invalid login credentials")

            response = client.post(
                "/api/auth/login",
                json={"email": "nonexistent@example.com", "password": "password123"}
            )

            assert response.status_code == 401
            assert response.json()["detail"] == "Invalid login credentials"


class TestCheckUserExists:
    """Tests for the check-user-exists endpoint."""

    def test_user_exists(self):
        """Tests that the endpoint correctly identifies an existing user."""
        with patch("routers.auth.admin_client.auth.admin.list_users") as mock_list, \
             patch("routers.auth.admin_client.table") as mock_table:
            
            # Mock user exists in auth
            mock_user = MagicMock()
            mock_user.email = "test@example.com"
            mock_user.id = "test-user-id"
            mock_list.return_value = [mock_user]
            
            # Mock profile exists
            mock_result = MagicMock()
            mock_result.data = {"role": "ambassador"}
            mock_table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_result

            response = client.post(
                "/api/auth/check-user-exists",
                json={"email": "test@example.com"}
            )

            assert response.status_code == 200
            assert response.json()["exists"] is True
            assert response.json()["role"] == "ambassador"

    def test_user_does_not_exist(self):
        """Tests that the endpoint correctly identifies a non-existent user."""
        with patch("routers.auth.admin_client.auth.admin.list_users") as mock_list:
            mock_list.return_value = []

            response = client.post(
                "/api/auth/check-user-exists",
                json={"email": "nonexistent@example.com"}
            )

            assert response.status_code == 200
            assert response.json()["exists"] is False
            assert response.json()["role"] is None


class TestValidateLogin:
    """Tests for the validate-login endpoint."""

    def test_validate_login_success(self):
        """Tests that login validation passes for valid user with matching role."""
        with patch("routers.auth.admin_client.auth.admin.list_users") as mock_list, \
             patch("routers.auth.admin_client.table") as mock_table:
            
            mock_user = MagicMock()
            mock_user.email = "test@example.com"
            mock_user.id = "test-user-id"
            mock_list.return_value = [mock_user]
            
            mock_result = MagicMock()
            mock_result.data = {"role": "client"}
            mock_table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_result

            response = client.post(
                "/api/auth/validate-login",
                json={
                    "email": "test@example.com",
                    "password": "password123",
                    "expected_role": "client"
                }
            )

            assert response.status_code == 200
            assert response.json()["valid"] is True
            assert response.json()["role"] == "client"

    def test_validate_login_role_mismatch(self):
        """Tests that login validation fails when user role doesn't match expected role."""
        with patch("routers.auth.admin_client.auth.admin.list_users") as mock_list, \
             patch("routers.auth.admin_client.table") as mock_table:
            
            mock_user = MagicMock()
            mock_user.email = "test@example.com"
            mock_user.id = "test-user-id"
            mock_list.return_value = [mock_user]
            
            mock_result = MagicMock()
            mock_result.data = {"role": "ambassador"}
            mock_table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_result

            response = client.post(
                "/api/auth/validate-login",
                json={
                    "email": "test@example.com",
                    "password": "password123",
                    "expected_role": "client"
                }
            )

            assert response.status_code == 200
            assert response.json()["valid"] is False
            assert response.json()["error_type"] == "role_mismatch"

    def test_validate_login_user_not_found(self):
        """Tests that login validation fails for non-existent user."""
        with patch("routers.auth.admin_client.auth.admin.list_users") as mock_list:
            mock_list.return_value = []

            response = client.post(
                "/api/auth/validate-login",
                json={
                    "email": "nonexistent@example.com",
                    "password": "password123"
                }
            )

            assert response.status_code == 200
            assert response.json()["valid"] is False
            assert response.json()["error_type"] == "user_not_found"


class TestPasswordReset:
    """Tests for the password reset endpoint."""

    def test_password_reset_success(self):
        """Tests that password reset email is sent successfully."""
        with patch("routers.auth.admin_client.auth.reset_password_for_email") as mock_reset:
            mock_reset.return_value = None

            response = client.post(
                "/api/auth/reset-password",
                json={
                    "email": "test@example.com",
                    "redirect_to": "http://localhost:3000/reset"
                }
            )

            assert response.status_code == 200
            assert response.json()["message"] == "Password reset email sent successfully"
            mock_reset.assert_called_once()

    def test_password_reset_failure(self):
        """Tests that password reset handles errors gracefully."""
        with patch("routers.auth.admin_client.auth.reset_password_for_email") as mock_reset:
            mock_reset.side_effect = Exception("Email service unavailable")

            response = client.post(
                "/api/auth/reset-password",
                json={"email": "test@example.com"}
            )

            assert response.status_code == 500
            assert "Failed to send password reset email" in response.json()["detail"]

