from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from urllib.parse import urlencode
from unittest.mock import patch

class CragApiTests(APITestCase):

    def setUp(self):
        self.client = APIClient()
        self.crag_id = "example-id"
        self.token = "dummy-app-token"
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)

    @patch("MyApp.Utils.helper.authenticate_app_check_token")
    def test_crag_info_missing_crag_id(self, mock_auth):
        mock_auth.return_value = {"success": True}
        url = reverse("crag_info")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])

    @patch("MyApp.Utils.helper.authenticate_app_check_token")
    def test_crag_info_success(self, mock_auth):
        mock_auth.return_value = {"success": True}
        url = reverse("crag_info") + f"?crag_id={self.crag_id}"
        response = self.client.get(url)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND])

    # Similarly for other tests:
    @patch("MyApp.Utils.helper.authenticate_app_check_token")
    def test_crag_monthly_ranking_default(self, mock_auth):
        mock_auth.return_value = {"success": True}
        url = reverse("crag_monthly_ranking")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])

    @patch("MyApp.Utils.helper.authenticate_app_check_token")
    def test_crag_monthly_ranking_invalid_count(self, mock_auth):
        mock_auth.return_value = {"success": True}
        url = reverse("crag_monthly_ranking") + "?count=abc"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])

    @patch("MyApp.Utils.helper.authenticate_app_check_token")
    def test_crag_trending_success(self, mock_auth):
        mock_auth.return_value = {"success": True}
        url = reverse("crag_trending")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])

    @patch("MyApp.Utils.helper.authenticate_app_check_token")
    def test_crag_trending_invalid_count(self, mock_auth):
        mock_auth.return_value = {"success": True}
        url = reverse("crag_trending") + "?count=-1"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
