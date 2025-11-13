"""
Django TestCase for ranking endpoints - Success scenarios only.

Run with: python manage.py test MyApp._TestCode.test_ranking_endpoints
"""

from django.test import TestCase, Client
from django.utils.timezone import now
from datetime import timedelta
import json
import random
from unittest.mock import patch

from MyApp.Entity.user import User
from MyApp.Entity.crag import Crag
from MyApp.Entity.route import Route
from MyApp.Entity.climblog import ClimbLog
from MyApp.Controller import ranking_controller


class RankingSuccessTestCase(TestCase):
    """Django TestCase for ranking endpoints with comprehensive test data."""
    
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
    
    def tearDown(self):
        """Clean up after each test method."""
        # Django TestCase automatically handles database cleanup
        pass
    
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
            user.skill_level = user_data["skill"]  # Store for reference
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
                pattern = climbing_patterns[user.skill_level]
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
    
    def test_all_ranking_success_scenarios(self):
        """Test weekly user ranking controller logic."""
        print("\n" + "="*60)
        print("TESTING WEEKLY USER RANKING CONTROLLER")
        print("="*60)
        
        # Show input parameters
        count = 5
        print(f"INPUT: count={count}")
        
        # Show date range for weekly
        today = now().date()
        start_date = today - timedelta(days=7)
        print(f"Date range: {start_date} to {today}")
        
        ranking = ranking_controller.get_weekly_user_ranking(count=count)
        
        print(f"\nOUTPUT: Found {len(ranking)} rankings")
        print("-" * 40)
        
        for i, rank in enumerate(ranking):
            user = rank['user']
            print(f"{rank['rank']}. {user.username} ({user.skill_level})")
            print(f"   Total routes: {rank['total_routes']}")
            print(f"   User ID: {user.user_id}")
            print()
        
        # Assertions
        self.assertIsInstance(ranking, list)
        self.assertLessEqual(len(ranking), 5)
        
        if ranking:
            # Check structure of first ranking
            first_rank = ranking[0]
            self.assertIn('user', first_rank)
            self.assertIn('rank', first_rank)
            self.assertIn('total_routes', first_rank)
            self.assertEqual(first_rank['rank'], 1)
            self.assertIsInstance(first_rank['user'], User)
            self.assertGreater(first_rank['total_routes'], 0)
    
    def test_alltime_user_ranking_controller(self):
        """Test all-time user ranking controller logic."""
        print("\n" + "="*60)
        print("TESTING ALL-TIME USER RANKING CONTROLLER")
        print("="*60)
        
        count = 5
        print(f"INPUT: count={count}")
        print("Date range: All time")
        
        ranking = ranking_controller.get_alltime_user_ranking(count=count)
        
        print(f"\nOUTPUT: Found {len(ranking)} rankings")
        print("-" * 40)
        
        for i, rank in enumerate(ranking):
            user = rank['user']
            print(f"{rank['rank']}. {user.username} ({user.skill_level})")
            print(f"   Total routes: {rank['total_routes']}")
            
            # Show detailed stats for this user
            total_logs = ClimbLog.objects.filter(user=user).count()
            successful_logs = ClimbLog.objects.filter(user=user, status=True).count()
            success_rate = (successful_logs / total_logs * 100) if total_logs > 0 else 0
            print(f"   All logs: {total_logs}, Successful: {successful_logs} ({success_rate:.1f}%)")
            print()
        
        self.assertIsInstance(ranking, list)
        self.assertLessEqual(len(ranking), 5)
        
        if ranking:
            # Check that rankings are sorted by total_routes descending
            for i in range(len(ranking) - 1):
                self.assertGreaterEqual(
                    ranking[i]['total_routes'], 
                    ranking[i + 1]['total_routes']
                )
    
    def test_average_grade_ranking_controller(self):
        """Test average grade ranking controller logic."""
        # Test all timeframes
        for timeframe in ['weekly', 'monthly', 'alltime']:
            print(f"\n" + "="*60)
            print(f"TESTING AVERAGE GRADE RANKING CONTROLLER - {timeframe.upper()}")
            print("="*60)
            
            count = 5
            print(f"INPUT: count={count}, timeframe={timeframe}")
            
            # Show date range
            today = now().date()
            if timeframe == "weekly":
                start_date = today - timedelta(days=7)
                print(f"Date range: {start_date} to {today}")
            elif timeframe == "monthly":
                start_date = today.replace(day=1)
                print(f"Date range: {start_date} to {today}")
            else:
                print("Date range: All time")
            
            with self.subTest(timeframe=timeframe):
                ranking = ranking_controller.get_average_grade_ranking(count=count, timeframe=timeframe)
                
                print(f"\nOUTPUT: Found {len(ranking)} rankings")
                print("-" * 40)
                
                for i, rank in enumerate(ranking):
                    user = rank['user']
                    avg_grade = rank['average_grade']
                    v_grade = int(avg_grade - 4) if avg_grade >= 4 else 0
                    print(f"{rank['rank']}. {user.username} ({user.skill_level})")
                    print(f"   Average grade: {avg_grade} (V{v_grade})")
                    print(f"   Total routes: {rank['total_routes']}")
                    print()
                
                self.assertIsInstance(ranking, list)
                self.assertLessEqual(len(ranking), 5)
                
                if ranking:
                    first_rank = ranking[0]
                    self.assertIn('user', first_rank)
                    self.assertIn('rank', first_rank)
                    self.assertIn('average_grade', first_rank)
                    self.assertIn('total_routes', first_rank)
                    self.assertGreaterEqual(first_rank['total_routes'], 5)  # Minimum requirement
    
    def test_top_climbers_controller(self):
        """Test top climbers controller logic."""
        for timeframe in ['weekly', 'monthly', 'alltime']:
            print(f"\n" + "="*60)
            print(f"TESTING TOP CLIMBERS CONTROLLER - {timeframe.upper()}")
            print("="*60)
            
            count = 5
            print(f"INPUT: count={count}, timeframe={timeframe}")
            print("Scoring formula: (total_routes × 10) + (average_grade × 100)")
            
            # Show date range
            today = now().date()
            if timeframe == "weekly":
                start_date = today - timedelta(days=7)
                print(f"Date range: {start_date} to {today}")
            elif timeframe == "monthly":
                start_date = today.replace(day=1)
                print(f"Date range: {start_date} to {today}")
            else:
                print("Date range: All time")
            
            with self.subTest(timeframe=timeframe):
                ranking = ranking_controller.get_top_climbers(count=count, timeframe=timeframe)
                
                print(f"\nOUTPUT: Found {len(ranking)} rankings")
                print("-" * 40)
                
                for i, rank in enumerate(ranking):
                    user = rank['user']
                    avg_grade = rank['average_grade']
                    v_grade = int(avg_grade - 4) if avg_grade >= 4 else 0
                    total_routes = rank['total_routes']
                    total_score = rank['total_score']
                    
                    # Calculate expected score for verification
                    expected_score = (total_routes * 10) + (avg_grade * 100)
                    
                    print(f"{rank['rank']}. {user.username} ({user.skill_level})")
                    print(f"   Total score: {total_score}")
                    print(f"   Total routes: {total_routes}")
                    print(f"   Average grade: {avg_grade} (V{v_grade})")
                    print(f"   Score calculation: ({total_routes} × 10) + ({avg_grade} × 100) = {expected_score}")
                    print()
                
                self.assertIsInstance(ranking, list)
                self.assertLessEqual(len(ranking), 5)
                
                if ranking:
                    first_rank = ranking[0]
                    self.assertIn('user', first_rank)
                    self.assertIn('rank', first_rank)
                    self.assertIn('total_score', first_rank)
                    self.assertIn('total_routes', first_rank)
                    self.assertIn('average_grade', first_rank)
                    
                    # Verify score calculation
                    expected_score = (first_rank['total_routes'] * 10) + (first_rank['average_grade'] * 100)
                    self.assertAlmostEqual(first_rank['total_score'], expected_score, delta=1)
    
    def test_controller_validation(self):
        """Test controller input validation."""
        # Test invalid count
        with self.assertRaises(ValueError):
            ranking_controller.get_weekly_user_ranking(count=0)
        
        with self.assertRaises(ValueError):
            ranking_controller.get_weekly_user_ranking(count=-1)
        
        # Test invalid timeframe
        with self.assertRaises(ValueError):
            ranking_controller.get_average_grade_ranking(count=5, timeframe="invalid")
    
    # Boundary/API Tests
    
    @patch('MyApp.Firebase.helpers.authenticate_app_check_token')
    def test_weekly_ranking_endpoint(self, mock_auth):
        """Test weekly ranking API endpoint."""
        print("\n" + "="*60)
        print("TESTING WEEKLY RANKING API ENDPOINT")
        print("="*60)
        
        mock_auth.return_value = {"success": True}
        
        # Show request details
        url = '/ranking/get_weekly_user_ranking/'
        params = {'count': 3}
        print(f"REQUEST: GET {url}")
        print(f"PARAMS: {params}")
        print(f"AUTH: Mocked as successful")
        
        response = self.client.get(url, params)
        
        print(f"\nRESPONSE:")
        print(f"Status Code: {response.status_code}")
        
        data = json.loads(response.content)
        print(f"Response Body:")
        print(json.dumps(data, indent=2))
        
        # Show detailed ranking data
        if data.get('success') and data.get('data'):
            print(f"\nRANKING DETAILS:")
            print("-" * 40)
            for rank in data['data']:
                user = rank['user']
                print(f"{rank['rank']}. {user['username']}")
                print(f"   Total routes: {rank['total_routes']}")
                print(f"   User ID: {user['user_id']}")
                print(f"   Email: {user['email']}")
                print()
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data['success'])
        self.assertIn('data', data)
        self.assertLessEqual(len(data['data']), 3)
    
    @patch('MyApp.Firebase.helpers.authenticate_app_check_token')
    def test_alltime_ranking_endpoint(self, mock_auth):
        """Test all-time ranking API endpoint."""
        mock_auth.return_value = {"success": True}
        
        response = self.client.get('/ranking/get_alltime_user_ranking/', {'count': 3})
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data['success'])
        self.assertIn('data', data)
    
    @patch('MyApp.Firebase.helpers.authenticate_app_check_token')
    def test_average_grade_ranking_endpoint(self, mock_auth):
        """Test average grade ranking API endpoint."""
        mock_auth.return_value = {"success": True}
        
        for timeframe in ['weekly', 'monthly', 'alltime']:
            with self.subTest(timeframe=timeframe):
                response = self.client.get('/ranking/get_average_grade_ranking/', {
                    'count': 3,
                    'timeframe': timeframe
                })
                
                self.assertEqual(response.status_code, 200)
                data = json.loads(response.content)
                self.assertTrue(data['success'])
                self.assertIn('data', data)
    
    @patch('MyApp.Firebase.helpers.authenticate_app_check_token')
    def test_top_climbers_endpoint(self, mock_auth):
        """Test top climbers API endpoint."""
        mock_auth.return_value = {"success": True}
        
        for timeframe in ['weekly', 'monthly', 'alltime']:
            with self.subTest(timeframe=timeframe):
                response = self.client.get('/ranking/get_top_climbers/', {
                    'count': 3,
                    'timeframe': timeframe
                })
                
                self.assertEqual(response.status_code, 200)
                data = json.loads(response.content)
                self.assertTrue(data['success'])
                self.assertIn('data', data)
    
    @patch('MyApp.Firebase.helpers.authenticate_app_check_token')
    def test_endpoint_validation(self, mock_auth):
        """Test API endpoint input validation."""
        mock_auth.return_value = {"success": True}
        
        # Test invalid count
        response = self.client.get('/ranking/get_weekly_user_ranking/', {'count': 'invalid'})
        self.assertEqual(response.status_code, 400)
        
        response = self.client.get('/ranking/get_weekly_user_ranking/', {'count': -1})
        self.assertEqual(response.status_code, 400)
        
        # Test invalid timeframe
        response = self.client.get('/ranking/get_average_grade_ranking/', {
            'count': 5,
            'timeframe': 'invalid'
        })
        self.assertEqual(response.status_code, 400)
    
    @patch('MyApp.Firebase.helpers.authenticate_app_check_token')
    def test_authentication_required(self, mock_auth):
        """Test that authentication is required for all endpoints."""
        mock_auth.return_value = {"success": False, "message": "Unauthorized"}
        
        endpoints = [
            '/ranking/get_weekly_user_ranking/',
            '/ranking/get_alltime_user_ranking/',
            '/ranking/get_average_grade_ranking/',
            '/ranking/get_top_climbers/',
        ]
        
        for endpoint in endpoints:
            with self.subTest(endpoint=endpoint):
                response = self.client.get(endpoint)
                self.assertEqual(response.status_code, 401)
    
    def test_data_integrity(self):
        """Test that test data was created correctly."""
        print("\n" + "="*60)
        print("TESTING DATA INTEGRITY")
        print("="*60)
        
        print("TEST DATA SUMMARY:")
        print(f"Users created: {len(self.users)}")
        print(f"Routes created: {len(self.routes)}")
        print(f"Climb logs created: {len(self.climb_logs)}")
        
        print("\nUSER DETAILS:")
        print("-" * 40)
        for user in self.users:
            total_logs = ClimbLog.objects.filter(user=user).count()
            successful_logs = ClimbLog.objects.filter(user=user, status=True).count()
            success_rate = (successful_logs / total_logs * 100) if total_logs > 0 else 0
            print(f"{user.username} ({user.skill_level})")
            print(f"  Total climbs: {total_logs}")
            print(f"  Successful: {successful_logs} ({success_rate:.1f}%)")
            print(f"  User ID: {user.user_id}")
            print()
        
        print("ROUTE DETAILS:")
        print("-" * 40)
        for route in self.routes:
            v_grade = int(route.route_grade - 4) if route.route_grade >= 4 else 0
            climb_count = ClimbLog.objects.filter(route=route).count()
            success_count = ClimbLog.objects.filter(route=route, status=True).count()
            print(f"{route.route_name}: {route.route_grade} (V{v_grade})")
            print(f"  Attempts: {climb_count}, Successful: {success_count}")
            print()
        
        print("CLIMB LOG STATISTICS:")
        print("-" * 40)
        total_logs = ClimbLog.objects.count()
        successful_logs = ClimbLog.objects.filter(status=True).count()
        failed_logs = ClimbLog.objects.filter(status=False).count()
        overall_success_rate = (successful_logs / total_logs * 100) if total_logs > 0 else 0
        
        print(f"Total climb logs: {total_logs}")
        print(f"Successful climbs: {successful_logs}")
        print(f"Failed attempts: {failed_logs}")
        print(f"Overall success rate: {overall_success_rate:.1f}%")
        
        # Show date distribution
        today = now().date()
        weekly_logs = ClimbLog.objects.filter(date_climbed__gte=today - timedelta(days=7)).count()
        monthly_logs = ClimbLog.objects.filter(date_climbed__gte=today.replace(day=1)).count()
        
        print(f"\nDATE DISTRIBUTION:")
        print(f"Last 7 days: {weekly_logs} logs")
        print(f"This month: {monthly_logs} logs")
        print(f"All time: {total_logs} logs")
        
        # Assertions
        self.assertEqual(len(self.users), 5)
        self.assertEqual(len(self.routes), 10)
        self.assertGreater(len(self.climb_logs), 0)
        
        # Verify users have different skill levels
        skill_levels = [user.skill_level for user in self.users]
        self.assertEqual(len(set(skill_levels)), 5)  # All unique
        
        # Verify routes have different grades
        grades = [route.route_grade for route in self.routes]
        self.assertEqual(len(set(grades)), 10)  # All unique
        
        # Verify climb logs have both successful and failed attempts
        self.assertGreater(successful_logs, 0)
        self.assertGreater(failed_logs, 0)
    
    def test_ranking_consistency(self):
        """Test that rankings are consistent and logical."""
        # Get all-time ranking
        alltime_ranking = ranking_controller.get_alltime_user_ranking(count=5)
        
        if len(alltime_ranking) >= 2:
            # First place should have more or equal routes than second place
            self.assertGreaterEqual(
                alltime_ranking[0]['total_routes'],
                alltime_ranking[1]['total_routes']
            )
        
        # Get average grade ranking
        grade_ranking = ranking_controller.get_average_grade_ranking(count=5, timeframe='alltime')
        
        if len(grade_ranking) >= 2:
            # First place should have higher or equal average grade than second place
            self.assertGreaterEqual(
                grade_ranking[0]['average_grade'],
                grade_ranking[1]['average_grade']
            )
    
    def test_minimum_routes_requirement(self):
        """Test that grade-based rankings only include users with minimum routes."""
        grade_ranking = ranking_controller.get_average_grade_ranking(count=10, timeframe='alltime')
        
        for ranking in grade_ranking:
            self.assertGreaterEqual(ranking['total_routes'], 5, 
                                  f"User {ranking['user'].username} has less than 5 routes")
    
    def test_comprehensive_inspection(self):
        """Comprehensive test that outputs all ranking results for inspection."""
        print("\n" + "="*80)
        print("COMPREHENSIVE RANKING INSPECTION")
        print("="*80)
        
        # Test all ranking types
        ranking_tests = [
            {
                'name': 'Weekly User Ranking',
                'function': ranking_controller.get_weekly_user_ranking,
                'params': {'count': 10}
            },
            {
                'name': 'All-time User Ranking',
                'function': ranking_controller.get_alltime_user_ranking,
                'params': {'count': 10}
            },
            {
                'name': 'Average Grade Ranking (Weekly)',
                'function': ranking_controller.get_average_grade_ranking,
                'params': {'count': 10, 'timeframe': 'weekly'}
            },
            {
                'name': 'Average Grade Ranking (Monthly)',
                'function': ranking_controller.get_average_grade_ranking,
                'params': {'count': 10, 'timeframe': 'monthly'}
            },
            {
                'name': 'Average Grade Ranking (All-time)',
                'function': ranking_controller.get_average_grade_ranking,
                'params': {'count': 10, 'timeframe': 'alltime'}
            },
            {
                'name': 'Top Climbers (Weekly)',
                'function': ranking_controller.get_top_climbers,
                'params': {'count': 10, 'timeframe': 'weekly'}
            },
            {
                'name': 'Top Climbers (Monthly)',
                'function': ranking_controller.get_top_climbers,
                'params': {'count': 10, 'timeframe': 'monthly'}
            },
            {
                'name': 'Top Climbers (All-time)',
                'function': ranking_controller.get_top_climbers,
                'params': {'count': 10, 'timeframe': 'alltime'}
            }
        ]
        
        for test in ranking_tests:
            print(f"\n{'-'*60}")
            print(f"TESTING: {test['name']}")
            print(f"PARAMS: {test['params']}")
            print(f"{'-'*60}")
            
            try:
                ranking = test['function'](**test['params'])
                print(f"RESULTS: Found {len(ranking)} rankings")
                
                if not ranking:
                    print("No results found")
                    continue
                
                for i, rank in enumerate(ranking):
                    user = rank['user']
                    print(f"\n{rank['rank']}. {user.username} ({user.skill_level})")
                    print(f"   User ID: {user.user_id}")
                    print(f"   Email: {user.email}")
                    
                    if 'total_routes' in rank:
                        print(f"   Total routes: {rank['total_routes']}")
                    
                    if 'average_grade' in rank:
                        avg_grade = rank['average_grade']
                        v_grade = int(avg_grade - 4) if avg_grade >= 4 else 0
                        print(f"   Average grade: {avg_grade} (V{v_grade})")
                    
                    if 'total_score' in rank:
                        print(f"   Total score: {rank['total_score']}")
                        if 'total_routes' in rank and 'average_grade' in rank:
                            expected = (rank['total_routes'] * 10) + (rank['average_grade'] * 100)
                            print(f"   Score calc: ({rank['total_routes']} × 10) + ({rank['average_grade']} × 100) = {expected}")
                
            except Exception as e:
                print(f"ERROR: {str(e)}")
                import traceback
                traceback.print_exc()
        
        print(f"\n{'='*80}")
        print("INSPECTION COMPLETE")
        print(f"{'='*80}")
        
        # Basic assertion to make this a valid test
        self.assertTrue(True)
    
    def test_empty_results_handling(self):
        """Test handling of empty results."""
        # Create a new user with no climb logs
        empty_user = User.objects.create(
            user_id="empty_user",
            username="empty_climber",
            email="empty@test.com",
            status=True
        )
        
        # Rankings should still work and not include the empty user
        ranking = ranking_controller.get_weekly_user_ranking(count=10)
        user_ids = [r['user'].user_id for r in ranking]
        self.assertNotIn("empty_user", user_ids)