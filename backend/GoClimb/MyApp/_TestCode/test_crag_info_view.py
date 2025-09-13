# MyApp/_TestCode/test_crag_info_view.py
import json

from django.urls import reverse
from django.test import TestCase
from django.utils.timezone import now, timedelta
from rest_framework import status
from unittest.mock import patch
from MyApp.Entity.crag import Crag
from MyApp.Entity.climblog import ClimbLog
from MyApp.Entity.user import User


class CragInfoTests(TestCase):
    def setUp(self):
        self.url = reverse("crag_info")
        self.crag_id = 1
        self.empty_crag_id = 999
        self.crag = Crag.objects.create(
            crag_id=self.crag_id,
            name="Bukit Takun",
            location_lat=3.2986,
            location_lon=101.6312,
            description="A scenic limestone hill popular for sport climbing.",
            image_urls=[
                "https://example.com/takun1.jpg",
                "https://example.com/takun2.jpg",
            ],
        )

    @patch("MyApp.Boundary.crag_info.authenticate_app_check_token")
    def test_crag_info_view_unouthorize(self, mock_appcheck):

        mock_appcheck.return_value = {"success": False}

        response = self.client.get(f"{self.url}?crag_id={self.crag_id}")

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response_json.get("success"))

    @patch("MyApp.Boundary.crag_info.authenticate_app_check_token")
    def test_crag_info_view_bad_request(self, mock_appcheck):

        mock_appcheck.return_value = {"success": True}

        response = self.client.get(f"{self.url}")

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response_json.get("success"))

    @patch("MyApp.Boundary.crag_info.authenticate_app_check_token")
    def test_crag_info_view_crag_not_found(self, mock_appcheck):

        mock_appcheck.return_value = {"success": True}

        response = self.client.get(f"{self.url}?crag_id={self.empty_crag_id}")

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(response_json.get("success"))

    @patch("MyApp.Boundary.crag_info.authenticate_app_check_token")
    def test_crag_info_view_success(self, mock_appcheck):

        mock_appcheck.return_value = {"success": True}

        response = self.client.get(f"{self.url}?crag_id={self.crag_id}")

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response_json.get("success"))
        self.assertEqual(response_json.get("data")["crag_id"], f"CRAG-{self.crag_id}")


class CragMonthlyRankingTests(TestCase):
    def setUp(self):
        self.url = reverse("crag_monthly_ranking")
        # Create a user
        self.user = User.objects.create(
            user_id="user-1",
            full_name="Test User",
            email="test@example.com",
            role="member",
            status=True,
        )

        # Create some crags
        self.crag1 = Crag.objects.create(
            name="Crag One", location_lat=1.23, location_lon=4.56
        )
        self.crag2 = Crag.objects.create(
            name="Crag Two", location_lat=7.89, location_lon=0.12
        )

        # Create climb logs
        today = now().date()
        last_week = today - timedelta(days=7)
        two_weeks_ago = today - timedelta(days=14)

        # Crag1 logs: 2 this week, 1 last week
        ClimbLog.objects.create(
            user=self.user, crag=self.crag1, date_climbed=today, route_name="Route A"
        )
        ClimbLog.objects.create(
            user=self.user, crag=self.crag1, date_climbed=today, route_name="Route B"
        )
        ClimbLog.objects.create(
            user=self.user,
            crag=self.crag1,
            date_climbed=last_week,
            route_name="Route C",
        )

        # Crag2 logs: 1 this week, 2 last week
        ClimbLog.objects.create(
            user=self.user, crag=self.crag2, date_climbed=today, route_name="Route D"
        )
        ClimbLog.objects.create(
            user=self.user,
            crag=self.crag2,
            date_climbed=last_week,
            route_name="Route E",
        )
        ClimbLog.objects.create(
            user=self.user,
            crag=self.crag2,
            date_climbed=two_weeks_ago,
            route_name="Route F",
        )

    @patch("MyApp.Boundary.crag_info.authenticate_app_check_token")
    def test_crag_monthly_ranking_view_unauthorize(self, mock_appcheck):
        mock_appcheck.return_value = {"success": False}

        response = self.client.get(f"{self.url}?count=2")

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response_json.get("success"))

    @patch("MyApp.Boundary.crag_info.authenticate_app_check_token")
    def test_crag_monthly_ranking_view_success(self, mock_appcheck):
        mock_appcheck.return_value = {"success": True}

        response = self.client.get(f"{self.url}?count=2")

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response_json.get("success"))
        self.assertEqual(len(response_json.get("data")), 2)

    @patch("MyApp.Boundary.crag_info.authenticate_app_check_token")
    def test_crag_monthly_ranking_view_invalid_input(self, mock_appcheck):
        mock_appcheck.return_value = {"success": True}

        response = self.client.get(f"{self.url}?count=-1")

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response_json.get("success"))


class CragTrendingTests(TestCase):
    def setUp(self):
        self.url = reverse("crag_monthly_ranking")
        # Create a user
        self.user = User.objects.create(
            user_id="user-1",
            full_name="Test User",
            email="test@example.com",
            role="member",
            status=True,
        )

        # Create some crags
        self.crag1 = Crag.objects.create(
            name="Crag One", location_lat=1.23, location_lon=4.56
        )
        self.crag2 = Crag.objects.create(
            name="Crag Two", location_lat=7.89, location_lon=0.12
        )

        # Create climb logs
        today = now().date()
        last_week = today - timedelta(days=7)
        two_weeks_ago = today - timedelta(days=14)

        # Crag1 logs: 2 this week, 1 last week
        ClimbLog.objects.create(
            user=self.user, crag=self.crag1, date_climbed=today, route_name="Route A"
        )
        ClimbLog.objects.create(
            user=self.user, crag=self.crag1, date_climbed=today, route_name="Route B"
        )
        ClimbLog.objects.create(
            user=self.user,
            crag=self.crag1,
            date_climbed=last_week,
            route_name="Route C",
        )

        # Crag2 logs: 1 this week, 2 last week
        ClimbLog.objects.create(
            user=self.user, crag=self.crag2, date_climbed=today, route_name="Route D"
        )
        ClimbLog.objects.create(
            user=self.user,
            crag=self.crag2,
            date_climbed=last_week,
            route_name="Route E",
        )
        ClimbLog.objects.create(
            user=self.user,
            crag=self.crag2,
            date_climbed=two_weeks_ago,
            route_name="Route F",
        )

    @patch("MyApp.Boundary.crag_info.authenticate_app_check_token")
    def test_crag_trending_view_unauthorize(self, mock_appcheck):
        mock_appcheck.return_value = {"success": False}

        response = self.client.get(f"{self.url}?count=2")

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response_json.get("success"))

    @patch("MyApp.Boundary.crag_info.authenticate_app_check_token")
    def test_crag_trending_view_success(self, mock_appcheck):
        mock_appcheck.return_value = {"success": True}

        response = self.client.get(f"{self.url}?count=2")

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response_json.get("success"))
        self.assertEqual(len(response_json.get("data")), 2)

    @patch("MyApp.Boundary.crag_info.authenticate_app_check_token")
    def test_crag_trending_view_invalid_input(self, mock_appcheck):
        mock_appcheck.return_value = {"success": True}

        response = self.client.get(f"{self.url}?count=-1")

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response_json.get("success"))
