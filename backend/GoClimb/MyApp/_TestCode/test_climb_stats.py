# MyApp_TestCode/test_climb_stats_boundary.py
import json

from unittest.mock import patch
from django.urls import reverse
from django.test import TestCase
from rest_framework import status

# add this
import datetime
from MyApp.Entity.user import User
from MyApp.Entity.crag import Crag
from MyApp.Entity.climblog import ClimbLog


class GetUserClimbStatsTests(TestCase):
    def setUp(self):
        self.url = reverse("climb_stats")
        self.user_id = "user-123"
        self.id_token = "fake-id-token"

        # Create a user
        self.user = User.objects.create(
            user_id=self.user_id, full_name="Test User01", email="email01@example.com"
        )

        # Optionally create a crag
        self.crag = Crag.objects.create(
            name="Bukit Timah",
            location_lat=1.3483,
            location_lon=103.7795,
            description="A popular climbing crag in Singapore.",
            image_urls=[
                "https://example.com/crag1.jpg",
                "https://example.com/crag2.jpg",
            ],
        )

        # Create a climb log
        self.climb_log = ClimbLog.objects.create(
            user=self.user,
            crag=self.crag,
            route_name="Easy Route",
            date_climbed=datetime.date.today(),
            difficulty_grade="5.8",
            notes="Test climb log",
        )

    @patch("MyApp.Boundary.climb_stats.authenticate_app_check_token")
    @patch("MyApp.Controller.climblog_control.auth.verify_id_token")
    def test_get_user_climb_stats_view_unauthorize(self, mock_id_token, mock_app_check):
        mock_app_check.return_value = {"success": False}
        mock_id_token.return_value = {"success": False, "message": "Missing ID token"}

        payload = {
            "id_token": self.id,
        }
        response = self.client.post(self.url, payload, format="json")

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response_json.get("success"))

    @patch("MyApp.Boundary.climb_stats.authenticate_app_check_token")
    @patch("MyApp.Controller.climblog_control.auth.verify_id_token")
    def test_get_user_climb_stats_view_missing_id_token(
        self, mock_id_token, mock_app_check
    ):
        mock_app_check.return_value = {"success": True}
        mock_id_token.return_value = {"success": False, "message": "Missing ID token"}

        payload = {
            "id_token": self.id,
        }
        response = self.client.post(self.url, payload, format="json")

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response_json.get("success"))

    @patch("MyApp.Boundary.climb_stats.authenticate_app_check_token")
    @patch("MyApp.Controller.climblog_control.auth.verify_id_token")
    def test_get_user_climb_stats_success(self, mock_id_token, mock_app_check):
        mock_app_check.return_value = {"success": True}
        mock_id_token.return_value = {"uid": self.user_id}

        payload = {
            "id_token": self.id,
        }
        response = self.client.post(self.url, payload, format="json")

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response_json.get("success"))
        self.assertIn("data", response_json)
