from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from unittest.mock import patch

class AuthBoundaryAPITest(APITestCase):

    @patch("MyApp.Boundary.auth_boundary.authenticate_app_check_token")
    def test_verify_app_check_token_view_success(self, mock_auth):
        mock_auth.return_value = {"success": True, "message": "Mocked success"}

        url = reverse("Verify App Check Token") 
        response = self.client.get(url, data={}, format="json")
        response_json = response.json()
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response_json.get("success"))
        self.assertEqual(response_json.get("message"), "Mocked success")

    @patch("MyApp.Boundary.auth_boundary.authenticate_app_check_token")
    def test_verify_app_check_token_view_fail(self, mock_auth):
        mock_auth.return_value = {"success": False, "message": "Missing App Check token"}

        url = reverse("Verify App Check Token")
        response = self.client.get(url, data={}, format="json")
        response_json = response.json()

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response_json.get("success"))
        self.assertEqual(response_json.get("message"), "Missing App Check token")

    @patch("MyApp.Boundary.auth_boundary.authenticate_app_check_token")
    @patch("MyApp.Boundary.auth_boundary.verify_id_token")
    def test_verify_id_token_view_success(self, mock_verify_id, mock_auth):
        mock_auth.return_value = {"success": True, "message": "Mocked success"}
        mock_verify_id.return_value = {"success": True, "message": "ID token verified"}

        url = reverse("Verify ID Token")
        data = { "id_token": "valid-token" }
        
        response = self.client.post(url,data=data, format="json")
        response_json = response.json()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response_json.get("success"))
        self.assertEqual(response_json.get("message"), "ID token verified")

    @patch("MyApp.Boundary.auth_boundary.authenticate_app_check_token")
    @patch("MyApp.Boundary.auth_boundary.verify_id_token")
    def test_verify_id_token_view_fail(self, mock_verify_id, mock_auth):
        mock_auth.return_value = {"success": True, "message": "Mocked success"}
        mock_verify_id.return_value = {"success": False, "message": "Invalid ID token"}

        url = reverse("Verify ID Token")
        data = { "id_token": "bad-token" }
        
        response = self.client.post(url,data=data, format="json")
        response_json = response.json()

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response_json.get("success"))
        self.assertEqual(response_json.get("message"), "Invalid ID token")