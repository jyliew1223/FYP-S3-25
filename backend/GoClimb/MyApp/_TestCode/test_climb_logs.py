# MyApp_TestCode/test_climb_logs_boundary.py
from unittest.mock import patch
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from MyApp.models import Climb
from datetime import date

class ClimbLogsApiTests(APITestCase):
    def setUp(self):
        self.url = reverse("climb_logs")
        self.uid = "user-123"
        self.id_token = "token"

    @patch("MyApp.Boundary.climb_logs.authenticate_app_check_token")
    @patch("MyApp.Boundary.climb_logs.verify_id_token")
    def test_missing_id_token_400(self, mock_verify, mock_appcheck):
        mock_appcheck.return_value = {"success": True}
        resp = self.client.post(self.url, data={}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)  # missing field[7]

    @patch("MyApp.Boundary.climb_logs.authenticate_app_check_token")
    @patch("MyApp.Boundary.climb_logs.verify_id_token")
    def test_empty_list_200(self, mock_verify, mock_appcheck):
        mock_appcheck.return_value = {"success": True}
        mock_verify.return_value = {"success": True, "uid": self.uid}
        resp = self.client.post(self.url, data={"id_token": self.id_token}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["data"], [])

    @patch("MyApp.Boundary.climb_logs.authenticate_app_check_token")
    @patch("MyApp.Boundary.climb_logs.verify_id_token")
    def test_returns_items_200(self, mock_verify, mock_appcheck):
        mock_appcheck.return_value = {"success": True}
        mock_verify.return_value = {"success": True, "uid": self.uid}
        Climb.objects.create(
            crag_id=10, user_id=self.uid, route_name="Blue Arete",
            climb_date=date.today(), difficulty_grade="6b", note="Nice!"
        )
        resp = self.client.post(self.url, data={"id_token": self.id_token}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreater(len(resp.data["data"]), 0)
