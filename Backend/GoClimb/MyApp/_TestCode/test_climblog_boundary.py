# MyApp_TestCode/test_climblog_boundary_boundary.py
import json
import datetime

from unittest.mock import patch
from django.urls import reverse
from django.test import TestCase
from rest_framework import status
from MyApp.Entity.climblog import ClimbLog
from MyApp.Entity.crag import Crag
from MyApp.Entity.route import Route
from MyApp.Entity.user import User
from datetime import date


class GetUserClimbLogsTests(TestCase):
    def setUp(self):
        self.url = reverse("get_user_climb_logs")
        self.uid = "user-123"
        self.empty_log_user_uid = "user-456"
        self.user = User.objects.create(
            user_id=self.uid, full_name="Test User01", email="Email01"
        )
        self.empty_log_user = User.objects.create(
            user_id=self.empty_log_user_uid, full_name="Test User02", email="Email02"
        )
        self.crag = Crag.objects.create(
            name="Bukit Takun",
            location_lat=3.2986,
            location_lon=101.6312,
            description="A scenic limestone hill popular for sport climbing.",
            image_urls=[
                "https://example.com/takun1.jpg",
                "https://example.com/takun2.jpg",
            ],
        )
        self.route = Route.objects.create(
            route_name="Skyline Traverse",
            route_grade=10,  # Corresponds to 6a difficulty
            route_type=Route.SPORT,
            crag=self.crag,
        )
        ClimbLog.objects.create(
            user=self.user,
            route=self.route,
            date_climbed=date.today(),
            notes="Felt good, tricky crux at the middle.",
        )

    @patch("MyApp.Boundary.climblog_boundary.authenticate_app_check_token")
    def test_get_user_climb_logs_unauthorized(self, mock_appcheck):
        mock_appcheck.return_value = {"success": False}

        response = self.client.post(self.url, data={}, format="json")

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch("MyApp.Boundary.climblog_boundary.authenticate_app_check_token")
    def test_get_user_climb_logs_empty_list(self,  mock_appcheck):
        mock_appcheck.return_value = {"success": True}

        response = self.client.post(
            self.url, data={"user_id": self.empty_log_user_uid}, format="json"
        )

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response_json.get("success"))
        self.assertEqual(response_json.get("data"), [])

    @patch("MyApp.Boundary.climblog_boundary.authenticate_app_check_token")
    def test_get_user_climb_logs_success(self,  mock_appcheck):
        mock_appcheck.return_value = {"success": True}

        response = self.client.post(
            self.url, data={"user_id": self.uid}, format="json"
        )

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response_json.get("success"))
        self.assertNotEqual(response_json.get("data"), [])


class GetUserClimbStatsTests(TestCase):
    def setUp(self):
        self.url = reverse("get_user_climb_stats")
        self.user_id = "user-123"

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

        # Create a route
        self.route = Route.objects.create(
            route_name="Easy Route",
            route_grade=8,  # Corresponds to 5.8 difficulty
            route_type=Route.SPORT,
            crag=self.crag,
        )

        # Create a climb log
        self.climb_log = ClimbLog.objects.create(
            user=self.user,
            route=self.route,
            date_climbed=datetime.date.today(),
            notes="Test climb log",
        )

    @patch("MyApp.Boundary.climblog_boundary.authenticate_app_check_token")
    def test_get_user_climb_stats_unauthorize(self,  mock_app_check):
        mock_app_check.return_value = {"success": False}

        payload = {
            "user_id": self.user_id,
        }
        response = self.client.post(self.url, payload, format="json")

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response_json.get("success"))

    @patch("MyApp.Boundary.climblog_boundary.authenticate_app_check_token")
    def test_get_user_climb_stats_bad_request(self, mock_app_check):
        mock_app_check.return_value = {"success": True}

        payload = {
            "user_id": "",
        }
        response = self.client.post(self.url, payload, format="json")

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response_json.get("success"))

    @patch("MyApp.Boundary.climblog_boundary.authenticate_app_check_token")
    def test_get_user_climb_stats_success(self,  mock_app_check):
        mock_app_check.return_value = {"success": True}

        payload = {
            "user_id": self.user_id,
        }
        response = self.client.post(self.url, payload, format="json")

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response_json.get("success"))
        self.assertIn("data", response_json)
