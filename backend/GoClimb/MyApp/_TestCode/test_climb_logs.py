# MyApp_TestCode/test_climb_logs_boundary.py
import json

from unittest.mock import patch
from django.urls import reverse
from django.test import TestCase
from rest_framework import status
from MyApp.Entity.climblog import ClimbLog
from MyApp.Entity.crag import Crag
from MyApp.Entity.user import User
from datetime import date


class GetUserClimbLogsTests(TestCase):
    def setUp(self):
        self.url = reverse("climb_logs")
        self.uid = "user-123"
        self.empty_log_user_uid = "user-456"
        self.id_token = "token"
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
        ClimbLog.objects.create(
            log_id="0001",
            user=self.user,
            crag=self.crag,
            route_name="Skyline Traverse",
            date_climbed=date.today(),
            difficulty_grade="6a",
            notes="Felt good, tricky crux at the middle.",
        )

    @patch("MyApp.Boundary.climb_logs.authenticate_app_check_token")
    @patch("MyApp.Controller.climblog_control.auth.verify_id_token")
    def test_missing_id_token_400(self, mock_verify, mock_appcheck):
        mock_appcheck.return_value = {"success": True}
        mock_verify.return_value = {"success": False, "message": "Missing ID token"}

        response = self.client.post(self.url, data={}, format="json")

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST
        )  # missing field[7]

    @patch("MyApp.Boundary.climb_logs.authenticate_app_check_token")
    @patch("MyApp.Controller.climblog_control.auth.verify_id_token")
    def test_empty_list_200(self, mock_verify, mock_appcheck):
        mock_appcheck.return_value = {"success": True}
        mock_verify.return_value = {"success": True, "uid": self.empty_log_user_uid}

        response = self.client.post(
            self.url, data={"id_token": self.id_token}, format="json"
        )

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response_json.get("success"))
        self.assertEqual(response_json.get("data"), [])

    @patch("MyApp.Boundary.climb_logs.authenticate_app_check_token")
    @patch("MyApp.Controller.climblog_control.auth.verify_id_token")
    def test_returns_items_200(self, mock_verify, mock_appcheck):
        mock_appcheck.return_value = {"success": True}
        mock_verify.return_value = {"success": True, "uid": self.uid}

        response = self.client.post(
            self.url, data={"id_token": self.id_token}, format="json"
        )

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response_json.get("success"))
        self.assertNotEqual(response_json.get("data"), [])
