import json

from django.urls import reverse
from django.test import TestCase
from rest_framework import status
from unittest.mock import patch


class AuthBoundaryTest(TestCase):
    def setUp(self):
        self.app_check_url = reverse("verify_app_check_token")
        self.id_token_url = reverse("verify_id_token")

    @patch("MyApp.Boundary.auth_boundary.authenticate_app_check_token")
    def test_verify_app_check_token_success(self, mock_auth):
        mock_auth.return_value = {"success": True, "message": "Mocked success"}

        response = self.client.get(self.app_check_url, data={}, format="json")

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response_json.get("success"))
        self.assertEqual(response_json.get("message"), "Mocked success")

    @patch("MyApp.Boundary.auth_boundary.authenticate_app_check_token")
    def test_verify_app_check_token_fail(self, mock_auth):
        mock_auth.return_value = {
            "success": False,
            "message": "Missing App Check token",
        }

        response = self.client.get(self.app_check_url, data={}, format="json")

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response_json.get("success"))
        self.assertEqual(response_json.get("message"), "Missing App Check token")

    @patch("MyApp.Boundary.auth_boundary.authenticate_app_check_token")
    @patch("MyApp.Boundary.auth_boundary.verify_id_token")
    def test_verify_id_token_success(self, mock_verify_id, mock_auth):
        mock_auth.return_value = {"success": True, "message": "Mocked success"}
        mock_verify_id.return_value = {"success": True, "message": "ID token verified"}

        data = {"id_token": "valid-token"}

        response = self.client.post(self.id_token_url, data=data, format="json")

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response_json.get("success"))
        self.assertEqual(response_json.get("message"), "ID token verified")

    @patch("MyApp.Boundary.auth_boundary.authenticate_app_check_token")
    @patch("MyApp.Boundary.auth_boundary.verify_id_token")
    def test_verify_id_token_fail(self, mock_verify_id, mock_auth):
        mock_auth.return_value = {"success": True, "message": "Mocked success"}
        mock_verify_id.return_value = {"success": False, "message": "Invalid ID token"}

        data = {"id_token": "bad-token"}

        response = self.client.post(self.id_token_url, data=data, format="json")

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response_json.get("success"))
        self.assertEqual(response_json.get("message"), "Invalid ID token")
