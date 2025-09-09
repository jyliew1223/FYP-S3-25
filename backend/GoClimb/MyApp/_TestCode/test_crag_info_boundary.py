# MyApp/_TestCode/test_crag_info_boundary.py

from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock

class CragApiTests(APITestCase):

    def setUp(self):
        self.client = APIClient()
        self.crag_id = "example-id"






    # Mock authentication and helper functions
    @patch("MyApp.Boundary.crag_info.authenticate_app_check_token")
    @patch("MyApp.Boundary.crag_info.get_crag_info")
    def test_crag_info_missing_crag_id(self, mock_get_crag, mock_auth):
        mock_auth.return_value = {"success": True, "message": "Request authorized", "token_info": {}}
        mock_get_crag.return_value = None  # Crag not found

        url = reverse("crag_info")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])







    @patch("MyApp.Boundary.crag_info.authenticate_app_check_token")
    @patch("MyApp.Boundary.crag_info.get_crag_info")
    def test_crag_info_success(self, mock_get_crag, mock_auth):
        mock_auth.return_value = {"success": True, "message": "Request authorized", "token_info": {}}
        mock_get_crag.return_value = {"name": "Test Crag", "location": "Test Location"}

        url = reverse("crag_info") + f"?crag_id={self.crag_id}"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])








    @patch("MyApp.Boundary.crag_info.authenticate_app_check_token")
    @patch("MyApp.Boundary.crag_info.get_monthly_ranking")
    def test_crag_monthly_ranking_default(self, mock_ranking, mock_auth):
        mock_auth.return_value = {"success": True, "message": "Request authorized", "token_info": {}}
        mock_ranking.return_value = [{"name": "Crag A"}, {"name": "Crag B"}]

        url = reverse("crag_monthly_ranking")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])









    @patch("MyApp.Boundary.crag_info.authenticate_app_check_token")
    @patch("MyApp.Boundary.crag_info.get_monthly_ranking")
    def test_crag_monthly_ranking_invalid_count(self, mock_ranking, mock_auth):
        mock_auth.return_value = {"success": True, "message": "Request authorized", "token_info": {}}
        mock_ranking.return_value = []

        url = reverse("crag_monthly_ranking") + "?count=abc"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])









    @patch("MyApp.Boundary.crag_info.authenticate_app_check_token")
    @patch("MyApp.Boundary.crag_info.Climb")
    def test_crag_trending_success(self, mock_climb, mock_auth):
        mock_auth.return_value = {"success": True, "message": "Request authorized", "token_info": {}}

        # Mock queryset
        mock_qs = MagicMock()
        mock_qs.filter.return_value = [{"name": "Crag 1"}, {"name": "Crag 2"}]
        mock_climb.objects = mock_qs

        url = reverse("crag_trending")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])





    @patch("MyApp.Boundary.crag_info.authenticate_app_check_token")
    @patch("MyApp.Boundary.crag_info.Climb")
    def test_crag_trending_invalid_count(self, mock_climb, mock_auth):
        mock_auth.return_value = {"success": True, "message": "Request authorized", "token_info": {}}

        # Mock queryset
        mock_qs = MagicMock()
        mock_qs.filter.return_value = []
        mock_climb.objects = mock_qs

        url = reverse("crag_trending") + "?count=-1"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
