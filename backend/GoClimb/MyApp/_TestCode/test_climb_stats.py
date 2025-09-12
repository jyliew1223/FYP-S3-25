# MyApp_TestCode/test_climb_stats_boundary.py
from unittest.mock import patch
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from MyApp.models import Climb

# add this
from datetime import date
from MyApp.Entity.crag import Crag

class UserStatsApiTests(APITestCase):
    def setUp(self):
        self.url = reverse("climb_stats")
        self.uid = "user-123"
        self.token = "id-token"

    @patch("MyApp.Boundary.climb_stats.authenticate_app_check_token")
    @patch("MyApp.Boundary.climb_stats.verify_id_token")
    def test_missing_id_token_400(self, mock_verify, mock_app):
        mock_app.return_value = {"success": True}
        resp = self.client.post(self.url, data={}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)  # Bad Request[5]

    @patch("MyApp.Boundary.climb_stats.authenticate_app_check_token")
    @patch("MyApp.Boundary.climb_stats.verify_id_token")
    def test_empty_stats_200(self, mock_verify, mock_app):
        mock_app.return_value = {"success": True}
        mock_verify.return_value = {"success": True, "uid": self.uid}
        resp = self.client.post(self.url, data={"id_token": self.token}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)  # 200 with empty stats[3]
        self.assertIn("data", resp.data)
        # add new code below. no row yet = total_routes is 0
        self.assertEqual(resp.data["data"]["total_routes"], 0)

    @patch("MyApp.Boundary.climb_stats.authenticate_app_check_token")
    @patch("MyApp.Boundary.climb_stats.verify_id_token")
    def test_stats_values_200(self, mock_verify, mock_app):
        mock_app.return_value = {"success": True}
        mock_verify.return_value = {"success": True, "uid": self.uid}

        # Create the FK target first
        Crag.objects.create(
            crag_id="C1",
            name="Test Crag",
            location_lat=0.0,
            location_lon=0.0,
            description="",
            image_urls=[],
        )
        # END OF NEW CODES

        # Create 2 Climb rows using REAL fields that exist in your Climb model
        Climb.objects.create(name="Route A", crag_id="C1", date_climbed=date.today())
        Climb.objects.create(name="Route B", crag_id="C1", date_climbed=date.today())

        # Climb.objects.create(user_id=self.uid, style="on_sight", grade_numeric=6.5, attempts=1, crag_id=1, route_name="A")
        # Climb.objects.create(user_id=self.uid, style="red_point", grade_numeric=6.7, attempts=2, crag_id=1, route_name="B")
        
        resp = self.client.post(self.url, data={"id_token": self.token}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        # Since your model doesn’t have 'style' etc., assert 'total_routes' instead
        self.assertGreaterEqual(resp.data["data"]["total_routes"], 1)
