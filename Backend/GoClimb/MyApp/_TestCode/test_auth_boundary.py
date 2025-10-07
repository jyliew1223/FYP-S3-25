import json
import uuid

from django.urls import reverse
from django.test import TestCase
from rest_framework import status
from unittest.mock import patch


from MyApp.Entity.user import User

class SignUpViewTest(TestCase):

    def setUp(self):
        self.url = reverse("signup")
        self.id_token = "fake-id-token"
        self.user_id = "user-123"
        self.username = f"testuser{uuid.uuid4().hex[:6]}"
        self.user_email = f"test{uuid.uuid4().hex[:6]}@example.com"
        self.exsisting_id_token = "exsisting_fake-id-token"
        self.exsisting_user_id = "exsisting_ser-123"
        self.exsisting_username = f"exsisting_testuser{uuid.uuid4().hex[:6]}"
        self.exsisting_user_email = f"exsisting_test{uuid.uuid4().hex[:6]}@example.com"
        self.exsting_user = User.objects.create(
            user_id=self.exsisting_user_id,
            full_name=self.exsisting_username,
            email=self.exsisting_user_email,
            profile_picture="https://example.com/avatar.png",
            role="member",
            status=True,
        )

    @patch("MyApp.Boundary.auth_boundary.authenticate_app_check_token")
    def test_signup_unauthorize(self, mock_app_check):
        mock_app_check.return_value = {
            "success": False,
            "message": "Invalid App Check token.",
        }

        payload = {
            "id_token": self.id_token,
            "full_name": self.username,
            "email": self.user_email,
        }
        response = self.client.post(self.url, payload, format="json")

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response_json.get("success"))

    @patch("MyApp.Boundary.auth_boundary.authenticate_app_check_token")
    @patch("MyApp.Controller.user_controller.auth.verify_id_token")
    def test_signup_bad_request_serializer_failed(self, mock_id_token, mock_app_check):
        mock_app_check.return_value = {"success": True}
        mock_id_token.return_value = {"uid": self.user_id}

        payload = {
            "id_tokdawen": self.id_token,
            "fullawd_name": self.username,
            "emaawd": self.user_email,
        }
        response = self.client.post(self.url, payload, format="json")

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response_json.get("success"))

    @patch("MyApp.Boundary.auth_boundary.authenticate_app_check_token")
    @patch("MyApp.Controller.user_controller.auth.verify_id_token")
    def test_signup_bad_request_missing_field(self, mock_id_token, mock_app_check):
        mock_app_check.return_value = {"success": True}
        mock_id_token.return_value = {"uid": self.user_id}

        payload = {"id_token": "", "full_name": "", "email": ""}
        response = self.client.post(self.url, payload, format="json")

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response_json.get("success"))

    @patch("MyApp.Boundary.auth_boundary.authenticate_app_check_token")
    @patch("MyApp.Controller.user_controller.auth.verify_id_token")
    def test_signup_success(self, mock_id_token, mock_app_check):
        mock_app_check.return_value = {"success": True}
        mock_id_token.return_value = {"uid": self.user_id}

        payload = {
            "id_token": self.id_token,
            "full_name": self.username,
            "email": self.user_email,
        }
        response = self.client.post(self.url, payload, format="json")

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response_json.get("success"))

    @patch("MyApp.Boundary.auth_boundary.authenticate_app_check_token")
    @patch("MyApp.Controller.user_controller.auth.verify_id_token")
    def test_signup_bad_request_user_already_exsits(self, mock_id_token, mock_app_check):
        mock_app_check.return_value = {"success": True}
        mock_id_token.return_value = {"uid": self.user_id}

        payload = {
            "id_token": self.exsisting_id_token,
            "full_name": self.exsisting_id_token,
            "email": self.exsisting_id_token,
        }
        response = self.client.post(self.url, payload, format="json")

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response_json.get("success"))

    @patch("MyApp.Boundary.auth_boundary.authenticate_app_check_token")
    @patch("MyApp.Controller.user_controller.auth.verify_id_token")
    def test_signup_bad_request_invalid_uid(self, mock_id_token, mock_app_check):
        mock_app_check.return_value = {"success": True}
        mock_id_token.return_value = {"uid": None}

        payload = {
            "id_token": self.id_token,
            "full_name": self.username,
            "email": self.user_email,
        }
        response = self.client.post(self.url, payload, format="json")

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response_json.get("success"))

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
