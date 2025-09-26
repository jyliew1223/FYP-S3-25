from django.urls import reverse
from django.test import TestCase
from rest_framework import status
import uuid
import json
import datetime
import random
from unittest.mock import patch

from MyApp.Entity.user import User
from MyApp.Entity.crag import Crag
from MyApp.Entity.route import Route
from MyApp.Entity.climblog import ClimbLog

class GetUserTests(TestCase):
    def setUp(self):
        self.url = reverse("get_user")
        self.user_id = "user-123"
        self.username = f"testuser{uuid.uuid4().hex[:6]}"
        self.user_email = f"test{uuid.uuid4().hex[:6]}@example"
        self.id_token = "fake-id-token"
        self.user = User.objects.create(
            user_id=self.user_id,
            full_name=self.username,
            email=self.user_email,
            role="member",
            status=True,
        )
        
    @patch("MyApp.Boundary.user_boundary.authenticate_app_check_token")
    @patch("MyApp.Controller.user_controller.auth.verify_id_token")
    def test_get_user_unauthorize(self, mock_id_token, mock_app_check):
        mock_app_check.return_value = {"success": False}
        mock_id_token.return_value = {"success": False, "message": "Missing ID token"}

        payload = {
            "id_token": self.id_token,
        }
        response = self.client.post(self.url, payload, format="json")

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response_json.get("success"))
        
    @patch("MyApp.Boundary.user_boundary.authenticate_app_check_token")
    @patch("MyApp.Controller.user_controller.auth.verify_id_token")
    def test_get_user_missing_id_token(self, mock_id_token, mock_app_check):
        mock_app_check.return_value = {"success": True}
        mock_id_token.return_value = {"success": False, "message": "Missing ID token"}

        payload = {
            "id_token": "",
        }
        response = self.client.post(self.url, payload, format="json")

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response_json.get("success"))
        
    @patch("MyApp.Boundary.user_boundary.authenticate_app_check_token")
    @patch("MyApp.Controller.user_controller.auth.verify_id_token")
    def test_get_user_success(self, mock_id_token, mock_app_check):
        mock_app_check.return_value = {"success": True}
        mock_id_token.return_value = {"uid": self.user_id}

        payload = {
            "id_token": self.id_token,
        }
        response = self.client.post(self.url, payload, format="json")

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response_json.get("success"))
        self.assertIn("data", response_json)
        
    @patch("MyApp.Boundary.user_boundary.authenticate_app_check_token")
    @patch("MyApp.Controller.user_controller.auth.verify_id_token")
    def test_get_user_not_found(self, mock_id_token, mock_app_check):
        mock_app_check.return_value = {"success": True}
        mock_id_token.return_value = {"uid": "nonexistent-user-id"}

        payload = {
            "id_token": self.id_token,
        }
        response = self.client.post(self.url, payload, format="json")

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(response_json.get("success"))
    
class GetMonthlyUserRankingTests(TestCase):
    def setUp(self):
        self.url = reverse("get_monthly_user_ranking")
        
        self.users = []
        for _ in range(5):
            user_id = uuid.uuid4().hex
            username = f"testuser{uuid.uuid4().hex[:6]}"
            user_email = f"test{uuid.uuid4().hex[:6]}@example"
            user = User.objects.create(
                user_id=user_id,
                full_name=username,
                email=user_email,
                role="member",
                status=True,
            )
            self.users.append(user)
            
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
        
        # Create routes for the crag
        self.routes = []
        for i in range(20):
            route = Route.objects.create(
                route_name=f"Route {i}",
                route_grade=8,  # Corresponds to 5.8 difficulty
                route_type=Route.SPORT,
                crag=self.crag,
            )
            self.routes.append(route)
           
        self.climblogs = []
        for i in range(20):
            user = random.choice(self.users)
            route = self.routes[i]  # Use the corresponding route
            climb_log = ClimbLog.objects.create(
                user=user,
                route=route,
                date_climbed=datetime.date.today(),
                notes="Test climb log",
            )
            self.climblogs.append(climb_log)
            
    @patch("MyApp.Boundary.user_boundary.authenticate_app_check_token")
    def test_get_monthly_user_ranking_unauthorize(self, mock_app_check):
        mock_app_check.return_value = {
            "success": False,
            "message": "Invalid App Check token.",
        }

        response = self.client.get(self.url, {"count": 3})

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response_json.get("success"))
        
    @patch("MyApp.Boundary.user_boundary.authenticate_app_check_token")
    def test_get_monthly_user_ranking_success(self, mock_app_check):
        mock_app_check.return_value = {
            "success": True,
            "message": "Valid token.",
        }

        response = self.client.get(self.url, {"count": 3})

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response_json.get("success"))
        self.assertIn("data", response_json)
        self.assertNotIn("user_id", response_json.get("data")[0])