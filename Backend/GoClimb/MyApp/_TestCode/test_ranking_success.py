"""
Django TestCase for ranking endpoints - Success scenarios only with detailed output.

Run with: python manage.py test MyApp._TestCode.test_ranking_success
"""

from django.test import TestCase, Client
from django.urls import reverse
from django.utils.timezone import now
from datetime import timedelta
import json
import random
from unittest.mock import patch

from MyApp.Entity.user import User
from MyApp.Entity.crag import Crag
from MyApp.Entity.route import Route
from MyApp.Entity.climblog import ClimbLog


class RankingSuccessTestCase(TestCase):
    """Django TestCase for ranking endpoints - Success scenarios only."""
    
    def setUp(self):
        """Set up test data before each test method."""
        self.client = Client()
        self.users = []
        self.crags = []
        self.routes = []
        self.climb_logs = []
        
        # Create test data
        self.create_test_users()
        self.create_test_crags_and_routes()
        self.create_test_climb_logs()
    
    def create_test_users(self):
        """Create test users with different skill levels."""
        users_data = [
            {"username": "test_climber_pro", "email": "pro@test.com", "skill": "pro"},
            {"username": "test_climber_advanced", "email": "advanced@test.com", "skill": "advanced"},
            {"username": "test_climber_intermediate", "email": "intermediate@test.com", "skill": "intermediate"},
            {"username": "test_climber_beginner", "email": "beginner@test.com", "skill": "beginner"},
            {"username": "test_climber_casual", "email": "casual@test.com", "skill": "casual"},
        ]
        
        for i, user_data in enumerate(users_data, 1):
            user = User.objects.create(
                user_id=f"test_user_{i}",
                username=user_data["username"],
                email=user_data["email"],
                status=True
            )
            # Store skill level as a reference (not in database)
            self.users.append(user)
    
    def create_test_crags_and_routes(self):
        """Create test crags and routes with various grades."""
        # Create test crag
        crag = Crag.objects.create(
            name="Test Crag Boulder",
            location_lat=40.7128,
            location_lon=-74.0060,
            description="Test crag for ranking tests"
        )
        self.crags.append(crag)
        
        # Create routes with different grades (V-scale: 4.0-12.0)
        routes_data = [
            {"name": "Easy Warm-up", "grade": 4.0},      # V0
            {"name": "Beginner's Luck", "grade": 4.5},   # V1
            {"name": "Getting Harder", "grade": 5.0},    # V2
            {"name": "Intermediate Test", "grade": 6.0},  # V3
            {"name": "Solid Challenge", "grade": 7.0},   # V4
            {"name": "Advanced Problem", "grade": 8.0},  # V5
            {"name": "Expert Level", "grade": 9.0},      # V6
            {"name": "Pro Challenge", "grade": 10.0},    # V7
            {"name": "Elite Problem", "grade": 11.0},    # V8
            {"name": "World Class", "grade": 12.0},      # V9
        ]
        
        for route_data in routes_data:
            route = Route.objects.create(
                route_name=route_data["name"],
                route_grade=route_data["grade"],
                crag=crag
            )
            self.routes.append(route)
    
    def create_test_climb_logs(self):
        """Create realistic climb logs for different time periods."""
        today = now().date()
        
        # Define climbing patterns for different skill levels
        climbing_patterns = {
            "pro": {"routes_per_week": 15, "grade_range": (8.0, 12.0), "success_rate": 0.9},
            "advanced": {"routes_per_week": 12, "grade_range": (6.0, 10.0), "success_rate": 0.8},
            "intermediate": {"routes_per_week": 8, "grade_range": (4.5, 8.0), "success_rate": 0.7},
            "beginner": {"routes_per_week": 5, "grade_range": (4.0, 6.0), "success_rate": 0.6},
            "casual": {"routes_per_week": 3, "grade_range": (4.0, 5.5), "success_rate": 0.5},
        }
        
        # Set random seed for consistent test results
        random.seed(42)
        
        # Create logs for the past 8 weeks
        for week in range(8):
            week_start = today - timedelta(weeks=week)
            
            for user in self.users:
                # Get skill level from username
                skill_level = user.username.split('_')[-1]  # Extract from "test_climber_pro"
                pattern = climbing_patterns[skill_level]
                routes_this_week = pattern["routes_per_week"]
                
                # Reduce activity for older weeks (simulate realistic patterns)
                if week > 4:
                    routes_this_week = int(routes_this_week * 0.7)
                
                # Create climb logs for this week
                for day in range(7):
                    if day < 3:  # Most climbing happens on 3 days per week
                        routes_per_day = routes_this_week // 3
                        climb_date = week_start - timedelta(days=day)
                        
                        for _ in range(routes_per_day):
                            # Select appropriate routes based on skill level
                            suitable_routes = [
                                r for r in self.routes 
                                if pattern["grade_range"][0] <= r.route_grade <= pattern["grade_range"][1]
                            ]
                            
                            if suitable_routes:
                                route = random.choice(suitable_routes)
                                
                                # Determine if climb was successful
                                success = random.random() < pattern["success_rate"]
                                
                                climb_log = ClimbLog.objects.create(
                                    user=user,
                                    route=route,
                                    date_climbed=climb_date,
                                    status=success,
                                    attempt=random.choice([1, 2, 3, 4, 5]),
                                    title=f"Session at {route.route_name}",
                                    notes=f"{'Topped' if success else 'Attempted'} {route.route_name}"
                                )
                                self.climb_logs.append(climb_log)
    

    
    def print_endpoint_result(self, endpoint_name, url, response, params=None):
        """Print endpoint result in the same format as test_all_success.py"""
        print(f"\n{'='*60}")
        print(f"ENDPOINT: {endpoint_name}")
        print(f"URL: {url}")
        
        if params is not None:
            try:
                print(f"PARAMS: {json.dumps(params, indent=2)}")
            except TypeError:
                print(f"PARAMS: {params}")
        
        print(f"STATUS CODE: {response.status_code}")
        print(f"CONTENT TYPE: {response.get('Content-Type', 'Not specified')}")
        
        if response.status_code in [200, 201]:
            try:
                if "application/json" in response.get("Content-Type", ""):
                    content = response.json()
                    print(f"RESPONSE DATA: {json.dumps(content, indent=2)}")
                else:
                    content = response.content.decode("utf-8")[:500]
                    print(f"RESPONSE CONTENT (first 500 chars): {content}")
            except Exception as e:
                print(f"RESPONSE CONTENT: {response.content}")
                print(f"Error parsing response: {e}")
        else:
            print(f"RESPONSE CONTENT: {response.content}")
        
        print("=" * 60)

    @patch('MyApp.Firebase.helpers.authenticate_app_check_token')
    def test_01_weekly_user_ranking(self, mock_auth):
        """Test weekly user ranking endpoint."""
        mock_auth.return_value = {"success": True}
        
        url = reverse("get_weekly_user_ranking")
        params = {'count': 5}
        response = self.client.get(url, params)
        self.print_endpoint_result("RANKING - WEEKLY USER RANKING", url, response, params)
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)

    @patch('MyApp.Firebase.helpers.authenticate_app_check_token')
    def test_02_alltime_user_ranking(self, mock_auth):
        """Test all-time user ranking endpoint."""
        mock_auth.return_value = {"success": True}
        
        url = reverse("get_alltime_user_ranking")
        params = {'count': 5}
        response = self.client.get(url, params)
        self.print_endpoint_result("RANKING - ALL-TIME USER RANKING", url, response, params)
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)

    @patch('MyApp.Firebase.helpers.authenticate_app_check_token')
    def test_03_average_grade_ranking_weekly(self, mock_auth):
        """Test average grade ranking (weekly) endpoint."""
        mock_auth.return_value = {"success": True}
        
        url = reverse("get_average_grade_ranking")
        params = {'count': 5, 'timeframe': 'weekly'}
        response = self.client.get(url, params)
        self.print_endpoint_result("RANKING - AVERAGE GRADE RANKING (WEEKLY)", url, response, params)
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)

    @patch('MyApp.Firebase.helpers.authenticate_app_check_token')
    def test_04_average_grade_ranking_monthly(self, mock_auth):
        """Test average grade ranking (monthly) endpoint."""
        mock_auth.return_value = {"success": True}
        
        url = reverse("get_average_grade_ranking")
        params = {'count': 5, 'timeframe': 'monthly'}
        response = self.client.get(url, params)
        self.print_endpoint_result("RANKING - AVERAGE GRADE RANKING (MONTHLY)", url, response, params)
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)

    @patch('MyApp.Firebase.helpers.authenticate_app_check_token')
    def test_05_average_grade_ranking_alltime(self, mock_auth):
        """Test average grade ranking (all-time) endpoint."""
        mock_auth.return_value = {"success": True}
        
        url = reverse("get_average_grade_ranking")
        params = {'count': 5, 'timeframe': 'alltime'}
        response = self.client.get(url, params)
        self.print_endpoint_result("RANKING - AVERAGE GRADE RANKING (ALL-TIME)", url, response, params)
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)

    @patch('MyApp.Firebase.helpers.authenticate_app_check_token')
    def test_06_top_climbers_weekly(self, mock_auth):
        """Test top climbers (weekly) endpoint."""
        mock_auth.return_value = {"success": True}
        
        url = reverse("get_top_climbers")
        params = {'count': 5, 'timeframe': 'weekly'}
        response = self.client.get(url, params)
        self.print_endpoint_result("RANKING - TOP CLIMBERS (WEEKLY)", url, response, params)
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)

    @patch('MyApp.Firebase.helpers.authenticate_app_check_token')
    def test_07_top_climbers_monthly(self, mock_auth):
        """Test top climbers (monthly) endpoint."""
        mock_auth.return_value = {"success": True}
        
        url = reverse("get_top_climbers")
        params = {'count': 5, 'timeframe': 'monthly'}
        response = self.client.get(url, params)
        self.print_endpoint_result("RANKING - TOP CLIMBERS (MONTHLY)", url, response, params)
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)

    @patch('MyApp.Firebase.helpers.authenticate_app_check_token')
    def test_08_top_climbers_alltime(self, mock_auth):
        """Test top climbers (all-time) endpoint."""
        mock_auth.return_value = {"success": True}
        
        url = reverse("get_top_climbers")
        params = {'count': 5, 'timeframe': 'alltime'}
        response = self.client.get(url, params)
        self.print_endpoint_result("RANKING - TOP CLIMBERS (ALL-TIME)", url, response, params)
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)
    
    def test_09_data_summary(self):
        """Display test data summary."""
        print(f"\n{'='*60}")
        print(f"ENDPOINT: TEST DATA SUMMARY")
        print(f"{'='*60}")
        
        total_users = len(self.users)
        total_routes = len(self.routes)
        total_logs = ClimbLog.objects.count()
        successful_logs = ClimbLog.objects.filter(status=True).count()
        
        summary = {
            "test_data_overview": {
                "users_created": total_users,
                "routes_created": total_routes,
                "climb_logs_created": total_logs,
                "successful_climbs": successful_logs,
                "success_rate_percent": round((successful_logs / total_logs * 100) if total_logs > 0 else 0, 1)
            }
        }
        
        print(f"RESPONSE DATA: {json.dumps(summary, indent=2)}")
        print("=" * 60)
        
        # Basic assertions
        self.assertEqual(total_users, 5)
        self.assertEqual(total_routes, 10)
        self.assertGreater(total_logs, 0)
        self.assertGreater(successful_logs, 0)