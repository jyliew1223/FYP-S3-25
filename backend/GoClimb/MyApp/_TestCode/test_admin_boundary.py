'''

# MyApp/_TestCode/test_admin_boundary.py
import json
import uuid
from django.urls import reverse
from django.test import TestCase
from rest_framework import status
from unittest.mock import patch

from MyApp.Entity.user import User

# ------------------
# ADMIN - 2 (start)
# ------------------
class SuspendProfileViewTestCase(TestCase):
    def setUp(self):
        self.url = reverse("suspend_profile")
        self.user = User.objects.create(
            user_id="u-123",
            full_name="Jane Admin",
            email="jane@example.com",
            profile_picture="",
            role="member",
            status=True,  # active
        )

    @patch("MyApp.Boundary.user_admin.authenticate_app_check_token")
    def test_unauthorized(self, mock_auth):
        mock_auth.return_value = {"success": False, "message": "Invalid token."}
        resp = self.client.post(self.url, data={"user_id": self.user.user_id}, content_type="application/json")
        print("\nunauthorized\n", json.dumps(resp.json(), indent=2))
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(resp.json().get("success"))

    @patch("MyApp.Boundary.user_admin.authenticate_app_check_token")
    def test_missing_user_id(self, mock_auth):
        mock_auth.return_value = {"success": True}
        resp = self.client.post(self.url, data={}, content_type="application/json")
        print("\nmissing_user_id\n", json.dumps(resp.json(), indent=2))
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(resp.json().get("success"))

    @patch("MyApp.Boundary.user_admin.authenticate_app_check_token")
    def test_not_found(self, mock_auth):
        mock_auth.return_value = {"success": True}
        resp = self.client.post(self.url, data={"user_id": "does-not-exist"}, content_type="application/json")
        print("\nnot_found\n", json.dumps(resp.json(), indent=2))
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(resp.json().get("success"))

    @patch("MyApp.Boundary.user_admin.authenticate_app_check_token")
    def test_success(self, mock_auth):
        mock_auth.return_value = {"success": True}
        resp = self.client.post(self.url, data={"user_id": self.user.user_id}, content_type="application/json")
        print("\nsuccess\n", json.dumps(resp.json(), indent=2))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.json().get("success"))
        # verify DB state changed
        self.user.refresh_from_db()
        self.assertFalse(self.user.status)
# ----------------
# ADMIN - 2 (end)
# ----------------

# -----------------
# ADMIN - 3 (start)
# -----------------
class DeleteProfileViewTestCase(TestCase):
    def setUp(self):
        self.url = reverse("profile_delete")

    @patch("MyApp.Boundary.user_boundary.authenticate_app_check_token")
    def test_unauthorized(self, mock_app):
        mock_app.return_value = {"success": False, "message": "Invalid token."}
        resp = self.client.delete(self.url, data={"profile_id": 55}, content_type="application/json")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch("MyApp.Boundary.user_boundary.authenticate_app_check_token")
    def test_missing_profile_id(self, mock_app):
        mock_app.return_value = {"success": True}
        resp = self.client.delete(self.url, data={}, content_type="application/json")
        # Show response for debugging like your other tests
        print("\nmissing_profile_id\n", json.dumps(resp.json(), indent=2))
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(resp.json().get("success"))

    @patch("MyApp.Boundary.user_boundary.authenticate_app_check_token")
    def test_not_found(self, mock_app):
        mock_app.return_value = {"success": True}
        resp = self.client.delete(self.url, data={"profile_id": "USER-999"}, content_type="application/json")
        print("\nnot_found\n", json.dumps(resp.json(), indent=2))
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(resp.json().get("success"))

    @patch("MyApp.Boundary.user_boundary.authenticate_app_check_token")
    def test_delete_success_with_int_id(self, mock_app):
        mock_app.return_value = {"success": True}
        # Create a user whose PK is "55" so numeric input works after normalization
        u = User.objects.create(
            user_id="55",
            full_name="To Delete",
            email="delete55@example.com",
            status=True,
            role="member",
        )
        resp = self.client.delete(self.url, data={"profile_id": 55}, content_type="application/json")
        print("\nsuccess_int\n", json.dumps(resp.json(), indent=2))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.json().get("success"))
        self.assertFalse(User.objects.filter(pk="55").exists())

    @patch("MyApp.Boundary.user_boundary.authenticate_app_check_token")
    def test_delete_success_with_prefixed_id(self, mock_app):
        mock_app.return_value = {"success": True}
        u = User.objects.create(
            user_id="77",
            full_name="To Delete",
            email="delete77@example.com",
            status=True,
            role="member",
        )
        resp = self.client.delete(self.url, data={"profile_id": "USER-77"}, content_type="application/json")
        print("\nsuccess_prefixed\n", json.dumps(resp.json(), indent=2))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.json().get("success"))
        self.assertFalse(User.objects.filter(pk="77").exists())

    @patch("MyApp.Boundary.user_boundary.authenticate_app_check_token")
    def test_delete_success_with_real_string_id(self, mock_app):
        mock_app.return_value = {"success": True}
        real_id = str(uuid.uuid4())
        User.objects.create(
            user_id=real_id,
            full_name="To Delete",
            email="delete_real@example.com",
            status=True,
            role="member",
        )
        resp = self.client.delete(self.url, data={"profile_id": real_id}, content_type="application/json")
        print("\nsuccess_real_id\n", json.dumps(resp.json(), indent=2))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.json().get("success"))
        self.assertFalse(User.objects.filter(pk=real_id).exists())
# ---------------
# ADMIN - 3 (end)
# ---------------

'''