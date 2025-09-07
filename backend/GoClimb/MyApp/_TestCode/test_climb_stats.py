# MyApp_TestCode/test_user_stats_boundary.py
from unittest.mock import patch
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from MyApp.models import Climb

class UserStatsApiTests(APITestCase):
    def setUp(self):
        self.url = reverse("climb_stats")
        self.uid = "user-123"
        self.token = "id-token"

    @patch("MyApp.Boundary.user_stats.authenticate_app_check_token")
    @patch("MyApp.Boundary.user_stats.verify_id_token")
    def test_missing_id_token_400(self, mock_verify, mock_app):
        mock_app.return_value = {"success": True}
        resp = self.client.post(self.url, data={}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)  # Bad Request[5]

    @patch("MyApp.Boundary.user_stats.authenticate_app_check_token")
    @patch("MyApp.Boundary.user_stats.verify_id_token")
    def test_empty_stats_200(self, mock_verify, mock_app):
        mock_app.return_value = {"success": True}
        mock_verify.return_value = {"success": True, "uid": self.uid}
        resp = self.client.post(self.url, data={"id_token": self.token}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)  # 200 with empty stats[3]
        self.assertIn("data", resp.data)

    @patch("MyApp.Boundary.user_stats.authenticate_app_check_token")
    @patch("MyApp.Boundary.user_stats.verify_id_token")
    def test_stats_values_200(self, mock_verify, mock_app):
        mock_app.return_value = {"success": True}
        mock_verify.return_value = {"success": True, "uid": self.uid}
        Climb.objects.create(user_id=self.uid, style="on_sight", grade_numeric=6.5, attempts=1, crag_id=1, route_name="A")
        Climb.objects.create(user_id=self.uid, style="red_point", grade_numeric=6.7, attempts=2, crag_id=1, route_name="B")
        resp = self.client.post(self.url, data={"id_token": self.token}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(resp.data["data"]["on_sight"], 1)
