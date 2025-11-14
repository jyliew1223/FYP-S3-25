import json
from unittest.mock import patch
from django.test import TestCase
from django.urls import reverse
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.test import APIClient
from rest_framework import status
from MyApp.Entity.user import User
from MyApp.Entity.crag import Crag


class GetCragsByUserIdTestCase(TestCase):
    """Test cases for get_crags_by_user_id_view endpoint"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create test users
        self.test_user = User.objects.create(
            user_id="test_user_123",
            username="testuser",
            email="test@example.com",
            profile_picture="test_profile.jpg",
            status=True,
        )
        
        self.other_user = User.objects.create(
            user_id="other_user_456",
            username="otheruser",
            email="other@example.com",
            profile_picture="other_profile.jpg",
            status=True,
        )
        
        # Create test crags for the test user
        self.test_crag_1 = Crag.objects.create(
            name="Test Crag 1",
            location_lat=40.7128,
            location_lon=-74.0060,
            description="First test climbing crag",
            user=self.test_user,
        )
        
        self.test_crag_2 = Crag.objects.create(
            name="Test Crag 2",
            location_lat=41.8781,
            location_lon=-87.6298,
            description="Second test climbing crag",
            user=self.test_user,
        )
        
        # Create a crag for the other user (should not appear in results)
        self.other_crag = Crag.objects.create(
            name="Other User Crag",
            location_lat=34.0522,
            location_lon=-118.2437,
            description="Crag created by other user",
            user=self.other_user,
        )

    @patch("firebase_admin.app_check.verify_token")
    def test_get_crags_by_user_id_success(self, mock_verify_app_check):
        """Test successful retrieval of crags by user ID"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}
        
        self.client.credentials(HTTP_X_FIREBASE_APPCHECK="mock_app_check_token")
        
        url = reverse("get_crags_by_user_id")
        response = self.client.get(url, {"user_id": self.test_user.user_id})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        
        response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertEqual(response_data.get("message"), "Crags fetched successfully.")
        self.assertIn("data", response_data)
        
        # Should return 2 crags for test_user
        crags_data = response_data["data"]
        self.assertEqual(len(crags_data), 2)
        
        # Verify crag data structure and content
        crag_names = [crag["name"] for crag in crags_data]
        self.assertIn("Test Crag 1", crag_names)
        self.assertIn("Test Crag 2", crag_names)
        
        # Verify each crag has expected fields
        for crag in crags_data:
            self.assertIn("crag_id", crag)
            self.assertIn("name", crag)
            self.assertIn("location_lat", crag)
            self.assertIn("location_lon", crag)
            self.assertIn("description", crag)
            self.assertIn("user", crag)
            self.assertEqual(crag["user"]["user_id"], self.test_user.user_id)

    @patch("firebase_admin.app_check.verify_token")
    def test_get_crags_by_user_id_empty_result(self, mock_verify_app_check):
        """Test retrieval for user with no crags"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}
        
        # Create a user with no crags
        user_no_crags = User.objects.create(
            user_id="user_no_crags",
            username="nocrags",
            email="nocrags@example.com",
            status=True,
        )
        
        self.client.credentials(HTTP_X_FIREBASE_APPCHECK="mock_app_check_token")
        
        url = reverse("get_crags_by_user_id")
        response = self.client.get(url, {"user_id": user_no_crags.user_id})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertEqual(response_data.get("message"), "Crags fetched successfully.")
        self.assertEqual(len(response_data["data"]), 0)

    @patch("firebase_admin.app_check.verify_token")
    def test_get_crags_by_user_id_missing_user_id(self, mock_verify_app_check):
        """Test error when user_id parameter is missing"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}
        
        self.client.credentials(HTTP_X_FIREBASE_APPCHECK="mock_app_check_token")
        
        url = reverse("get_crags_by_user_id")
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response_data = response.json()
        self.assertFalse(response_data.get("success"))
        self.assertEqual(response_data.get("message"), "Invalid input.")
        self.assertIn("errors", response_data)
        self.assertIn("user_id", response_data["errors"])
        self.assertEqual(response_data["errors"]["user_id"], "This field is required.")

    @patch("firebase_admin.app_check.verify_token")
    def test_get_crags_by_user_id_empty_user_id(self, mock_verify_app_check):
        """Test error when user_id parameter is empty"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}
        
        self.client.credentials(HTTP_X_FIREBASE_APPCHECK="mock_app_check_token")
        
        url = reverse("get_crags_by_user_id")
        response = self.client.get(url, {"user_id": ""})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response_data = response.json()
        self.assertFalse(response_data.get("success"))
        self.assertEqual(response_data.get("message"), "Invalid input.")
        self.assertIn("errors", response_data)
        self.assertIn("user_id", response_data["errors"])

    @patch("firebase_admin.app_check.verify_token")
    def test_get_crags_by_user_id_whitespace_user_id(self, mock_verify_app_check):
        """Test error when user_id parameter is only whitespace"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}
        
        self.client.credentials(HTTP_X_FIREBASE_APPCHECK="mock_app_check_token")
        
        url = reverse("get_crags_by_user_id")
        response = self.client.get(url, {"user_id": "   "})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response_data = response.json()
        self.assertFalse(response_data.get("success"))
        self.assertEqual(response_data.get("message"), "Invalid input.")

    @patch("firebase_admin.app_check.verify_token")
    def test_get_crags_by_user_id_nonexistent_user(self, mock_verify_app_check):
        """Test error when user does not exist"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}
        
        self.client.credentials(HTTP_X_FIREBASE_APPCHECK="mock_app_check_token")
        
        url = reverse("get_crags_by_user_id")
        response = self.client.get(url, {"user_id": "nonexistent_user_id"})
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        response_data = response.json()
        self.assertFalse(response_data.get("success"))
        self.assertEqual(response_data.get("message"), "User not found.")
        self.assertIn("errors", response_data)
        self.assertIn("user_id", response_data["errors"])
        self.assertEqual(response_data["errors"]["user_id"], "Invalid user ID.")

    @patch("firebase_admin.app_check.verify_token")
    @patch("MyApp.Controller.crag_controller.get_crags_by_user_id")
    def test_get_crags_by_user_id_controller_value_error(self, mock_controller, mock_verify_app_check):
        """Test handling of ValueError from controller"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}
        mock_controller.side_effect = ValueError("Invalid user ID format")
        
        self.client.credentials(HTTP_X_FIREBASE_APPCHECK="mock_app_check_token")
        
        url = reverse("get_crags_by_user_id")
        response = self.client.get(url, {"user_id": "invalid_format"})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response_data = response.json()
        self.assertFalse(response_data.get("success"))
        self.assertEqual(response_data.get("message"), "Invalid input.")
        self.assertIn("errors", response_data)
        self.assertIn("user_id", response_data["errors"])
        self.assertEqual(response_data["errors"]["user_id"], "Invalid user ID format")

    @patch("firebase_admin.app_check.verify_token")
    @patch("MyApp.Controller.crag_controller.get_crags_by_user_id")
    def test_get_crags_by_user_id_controller_object_does_not_exist(self, mock_controller, mock_verify_app_check):
        """Test handling of ObjectDoesNotExist from controller"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}
        mock_controller.side_effect = ObjectDoesNotExist("User not found")
        
        self.client.credentials(HTTP_X_FIREBASE_APPCHECK="mock_app_check_token")
        
        url = reverse("get_crags_by_user_id")
        response = self.client.get(url, {"user_id": "nonexistent_user"})
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        response_data = response.json()
        self.assertFalse(response_data.get("success"))
        self.assertEqual(response_data.get("message"), "User not found.")
        self.assertIn("errors", response_data)
        self.assertIn("user_id", response_data["errors"])
        self.assertEqual(response_data["errors"]["user_id"], "Invalid user ID.")

    @patch("firebase_admin.app_check.verify_token")
    @patch("MyApp.Controller.crag_controller.get_crags_by_user_id")
    def test_get_crags_by_user_id_unexpected_exception(self, mock_controller, mock_verify_app_check):
        """Test handling of unexpected exceptions"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}
        mock_controller.side_effect = Exception("Database connection error")
        
        self.client.credentials(HTTP_X_FIREBASE_APPCHECK="mock_app_check_token")
        
        url = reverse("get_crags_by_user_id")
        response = self.client.get(url, {"user_id": self.test_user.user_id})
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        response_data = response.json()
        self.assertFalse(response_data.get("success"))
        self.assertEqual(response_data.get("message"), "An error occurred while fetching crags.")
        self.assertIn("errors", response_data)
        self.assertIn("exception", response_data["errors"])
        self.assertEqual(response_data["errors"]["exception"], "Database connection error")

    @patch("firebase_admin.app_check.verify_token")
    def test_get_crags_by_user_id_response_format(self, mock_verify_app_check):
        """Test that response format matches expected structure"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}
        
        self.client.credentials(HTTP_X_FIREBASE_APPCHECK="mock_app_check_token")
        
        url = reverse("get_crags_by_user_id")
        response = self.client.get(url, {"user_id": self.test_user.user_id})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        
        # Verify response structure
        self.assertIn("success", response_data)
        self.assertIn("message", response_data)
        self.assertIn("data", response_data)
        self.assertNotIn("errors", response_data)
        
        # Verify data is a list
        self.assertIsInstance(response_data["data"], list)
        
        # Verify each crag object structure
        for crag in response_data["data"]:
            self.assertIn("crag_id", crag)
            self.assertIn("name", crag)
            self.assertIn("location_lat", crag)
            self.assertIn("location_lon", crag)
            self.assertIn("description", crag)
            self.assertIn("user", crag)
            
            # Verify user object structure
            user_data = crag["user"]
            self.assertIn("user_id", user_data)
            self.assertIn("username", user_data)
            self.assertIn("email", user_data)

    @patch("firebase_admin.app_check.verify_token")
    def test_get_crags_by_user_id_ordering(self, mock_verify_app_check):
        """Test that crags are returned in the correct order (by crag_id descending)"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}
        
        self.client.credentials(HTTP_X_FIREBASE_APPCHECK="mock_app_check_token")
        
        url = reverse("get_crags_by_user_id")
        response = self.client.get(url, {"user_id": self.test_user.user_id})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        
        crags_data = response_data["data"]
        self.assertEqual(len(crags_data), 2)
        
        # Verify ordering - newer crag should come first (higher crag_id)
        crag_ids = [int(crag["crag_id"].split("-")[1]) for crag in crags_data]
        self.assertEqual(crag_ids, sorted(crag_ids, reverse=True))