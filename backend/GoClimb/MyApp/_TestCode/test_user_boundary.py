from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
import uuid
import json
from unittest.mock import patch

from MyApp.Entity.user import User

DUMMY_ID_TOKEN = "dummy-id-token"


class UserBoundaryAPITest(APITestCase):

    def setUp(self):
        self.signup_url = reverse("user_signup")
        self.user_data = {
            "id_token": DUMMY_ID_TOKEN,
            "full_name": "Real Token User",
            "email": f"realtest{uuid.uuid4().hex[:6]}@example.com",
        }

    @patch("MyApp.Boundary.user_boundary.authenticate_app_check_token")
    def test_signup_unothorize(self, mock_verify):
        mock_verify.return_value = {"success": False, "message": "Mocked Failed"}
        resp = self.client.post(self.signup_url, self.user_data, format="json")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(resp.json().get("success"))

    @patch("MyApp.Boundary.user_boundary.authenticate_app_check_token")
    @patch("MyApp.Boundary.user_boundary.signup_user")
    def test_signup_invalid_id_token(self, mock_signup_user, mock_verify):
        mock_verify.return_value = {"success": True, "message": "Mocked Success", "uid": "mocked_uid"}
        mock_signup_user.return_value = {
            "success": False,
            "message": "Invalid ID token.",
            "errors": {"id_token": ["Invalid or expired."]},
        }
        bad_payload = dict(self.user_data, id_token="invalid_token")
        resp = self.client.post(self.signup_url, bad_payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(resp.json().get("success"))


    @patch("MyApp.Boundary.user_boundary.authenticate_app_check_token")
    @patch("MyApp.Boundary.user_boundary.signup_user")
    def test_signup_duplicate_email(self, mock_signup_user, mock_verify):
        mock_verify.return_value = {"success": True, "message": "Mocked Success", "uid": "mocked_uid"}

        # 1st call: let the *mocked controller* create the user (so serializer sees no duplicate)
        def create_user_side_effect(id_token, full_name, email):
            if not User.objects.filter(email=email).exists():
                User.objects.create(
                    user_id=uuid.uuid4().hex,
                    full_name=full_name,
                    email=email,
                    role="member",
                    status=True,
                )
            return {"success": True, "message": "Created."}

        mock_signup_user.side_effect = create_user_side_effect

        resp1 = self.client.post(self.signup_url, self.user_data, format="json")
        self.assertEqual(resp1.status_code, status.HTTP_201_CREATED)

        # 2nd call: controller signals duplicate this time
        mock_signup_user.side_effect = None
        mock_signup_user.return_value = {
            "success": False,
            "message": "Duplicate email.",
            "errors": {"email": ["This email is already registered."]},
        }

        resp2 = self.client.post(self.signup_url, self.user_data, format="json")
        self.assertEqual(resp2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(resp2.json().get("success"))



    @patch("MyApp.Boundary.user_boundary.authenticate_app_check_token")
    @patch("MyApp.Boundary.user_boundary.signup_user")
    def test_signup_success_returns_data_without_user_id(self, mock_signup_user, mock_verify):
        mock_verify.return_value = {"success": True, "message": "Mocked Success", "uid": "mocked_uid"}

        # Controller creates the user row so serializer can later fetch it
        def create_user_side_effect(id_token, full_name, email):
            if not User.objects.filter(email=email).exists():
                User.objects.create(
                    user_id=uuid.uuid4().hex,
                    full_name=full_name,
                    email=email,
                    role="member",
                    status=True,
                )
            return {"success": True, "message": "Created."}

        mock_signup_user.side_effect = create_user_side_effect

        resp = self.client.post(self.signup_url, self.user_data, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(resp.json().get("success"))

        payload = resp.json().get("data")
        self.assertIsInstance(payload, dict)
        self.assertEqual(payload.get("full_name"), self.user_data["full_name"])
        self.assertEqual(payload.get("email"), self.user_data["email"])
        self.assertNotIn("user_id", payload)