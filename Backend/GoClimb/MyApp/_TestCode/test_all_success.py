# MyApp/_TestCode/test_all_success.py

import json
from unittest.mock import patch, MagicMock
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User as DjangoUser
from MyApp.Entity.user import User
from MyApp.Entity.crag import Crag
from MyApp.Entity.post import Post
from MyApp.Entity.climblog import ClimbLog
from MyApp.Entity.route import Route
from MyApp.Entity.post_likes import PostLike


class AllEndpointsSuccessTestCase(TestCase):
    """Test all endpoints for successful responses and output their values"""
    
    def setUp(self):
        """Set up test data for all endpoints"""
        self.client = Client()
        
        # Create test user
        self.test_user = User.objects.create(
            user_id="test_user_123",
            username="testuser",
            email="test@example.com",
            profile_picture="test_profile.jpg",
            status=True
        )
        
        # Create test crag
        self.test_crag = Crag.objects.create(
            name="Test Crag",
            location_lat=40.7128,
            location_lon=-74.0060,
            description="A test climbing crag"
        )
        
        # Create test post
        self.test_post = Post.objects.create(
            user=self.test_user,
            content="Test climbing post content",
            tags=["climbing", "test"],
            status="active"
        )
        
        # Mock authentication headers for Firebase App Check
        self.auth_headers = {
            'HTTP_X_FIREBASE_APPCHECK': 'mock_app_check_token',
            'HTTP_AUTHORIZATION': 'Bearer mock_id_token'
        }
        
        print("=" * 80)
        print("STARTING ENDPOINT TESTS - ALL SUCCESSFUL CALLS")
        print("=" * 80)

    def print_endpoint_result(self, endpoint_name, url, response):
        """Helper method to print endpoint results in a formatted way"""
        print(f"\n{'='*60}")
        print(f"ENDPOINT: {endpoint_name}")
        print(f"URL: {url}")
        print(f"STATUS CODE: {response.status_code}")
        print(f"CONTENT TYPE: {response.get('Content-Type', 'Not specified')}")
        
        if response.status_code == 200:
            try:
                if 'application/json' in response.get('Content-Type', ''):
                    content = json.loads(response.content.decode('utf-8'))
                    print(f"RESPONSE DATA: {json.dumps(content, indent=2)}")
                else:
                    content = response.content.decode('utf-8')[:500]  # Limit HTML content
                    print(f"RESPONSE CONTENT (first 500 chars): {content}")
            except Exception as e:
                print(f"RESPONSE CONTENT: {response.content}")
                print(f"Error parsing response: {e}")
        else:
            print(f"RESPONSE CONTENT: {response.content}")
        print("=" * 60)

    def test_01_home_endpoint(self):
        """Test home endpoint: GET /"""
        url = reverse("home")
        response = self.client.get(url)
        self.print_endpoint_result("HOME", url, response)
        
        # Assertions
        self.assertEqual(response.status_code, 200)
        self.assertIn('text/html', response.get('Content-Type', ''))
        self.assertIn(b'GoClimb', response.content)

    @patch('firebase_admin.auth.verify_id_token')
    @patch('firebase_admin.app_check.verify_token')
    def test_02_auth_signup(self, mock_verify_app_check, mock_verify_id_token):
        """Test auth signup endpoint: POST /auth/signup/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}
        mock_verify_id_token.return_value = {"uid" : "fake_id"}
        
        url = reverse("signup")
        data = {
            "id_token": "mock_firebase_id_token",
            "username": "newuser",
            "email": "newuser@example.com"
        }
        response = self.client.post(url, data=json.dumps(data), 
                                  content_type='application/json', **self.auth_headers)
        self.print_endpoint_result("AUTH - SIGNUP", url, response)
        
        # Assertions
        self.assertEqual(response.get('Content-Type'), 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertIn('success', response_data)
        self.assertIn('message', response_data)
        
        # Expect success (200/201), fail if error
        if response.status_code in [200, 201]:
            self.assertTrue(response_data.get('success'), 
                          f"Expected success=True but got: {response_data}")
        else:
            self.fail(f"AUTH SIGNUP failed with status {response.status_code}: {response_data.get('message', 'Unknown error')}")

    @patch('firebase_admin.auth.verify_id_token')
    @patch('firebase_admin.app_check.verify_token')
    def test_03_auth_verify_id_token(self, mock_verify_app_check, mock_verify_id_token):
        """Test auth verify ID token endpoint: POST /auth/verify_id_token/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}
        mock_verify_id_token.return_value = {"uid": self.test_user.user_id}
        
        url = reverse("verify_id_token")
        data = {
            "id_token": "mock_firebase_id_token"
        }
        response = self.client.post(url, data=json.dumps(data), 
                                  content_type='application/json', **self.auth_headers)
        self.print_endpoint_result("AUTH - VERIFY ID TOKEN", url, response)
        
        # Assertions
        self.assertEqual(response.get('Content-Type'), 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertIn('success', response_data)
        self.assertIn('message', response_data)
        
        # Expect success (200), fail if error
        if response.status_code == 200:
            self.assertTrue(response_data.get('success'), 
                          f"Expected success=True but got: {response_data}")
        else:
            self.fail(f"AUTH VERIFY ID TOKEN failed with status {response.status_code}: {response_data.get('message', 'Unknown error')}")

    @patch('firebase_admin.app_check.verify_token')
    def test_04_auth_verify_app_check_token(self, mock_verify_app_check):
        """Test auth verify app check token endpoint: GET /auth/verify_app_check_token/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}
        
        url = reverse("verify_app_check_token")
        params = {"app_check_token": "test_app_check_token_123"}
        response = self.client.get(url, params, **self.auth_headers)
        self.print_endpoint_result("AUTH - VERIFY APP CHECK TOKEN", url, response)
        
        # Assertions
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get('Content-Type'), 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(response_data.get('success'))
        self.assertEqual(response_data.get('message'), 'Request authorized')

    @patch('firebase_admin.auth.verify_id_token')
    @patch('firebase_admin.app_check.verify_token')
    def test_05_user_get_user(self, mock_verify_app_check, mock_verify_id_token):
        """Test get user endpoint: POST /user/get_user/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}
        mock_verify_id_token.return_value = {"uid": self.test_user.user_id}
        
        url = reverse("get_user")
        data = {"id_token": "mock_id_token"}
        response = self.client.post(url, data=json.dumps(data), 
                                  content_type='application/json', **self.auth_headers)
        self.print_endpoint_result("USER - GET USER", url, response)
        
        # Assertions
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get('Content-Type'), 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(response_data.get('success'))
        self.assertIn('data', response_data)
        user_data = response_data['data']
        self.assertEqual(user_data['user_id'], self.test_user.user_id)
        self.assertEqual(user_data['username'], self.test_user.username)
        self.assertEqual(user_data['email'], self.test_user.email)

    @patch('firebase_admin.app_check.verify_token')
    def test_06_user_get_monthly_ranking(self, mock_verify_app_check):
        """Test get monthly user ranking endpoint: GET /user/get_monthly_user_ranking/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}
        
        url = reverse("get_monthly_user_ranking")
        params = {"count": "5"}
        response = self.client.get(url, params, **self.auth_headers)
        self.print_endpoint_result("USER - GET MONTHLY RANKING", url, response)
        
        # Assertions
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get('Content-Type'), 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(response_data.get('success'))
        self.assertIn('data', response_data)
        self.assertIsInstance(response_data['data'], list)

    @patch('firebase_admin.app_check.verify_token')
    def test_07_crag_get_info(self, mock_verify_app_check):
        """Test get crag info endpoint: GET /crag/get_crag_info/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}
        
        url = reverse("get_crag_info")
        params = {"crag_id": self.test_crag.crag_id}
        response = self.client.get(url, params, **self.auth_headers)
        self.print_endpoint_result("CRAG - GET INFO", url, response)
        
        # Assertions
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get('Content-Type'), 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(response_data.get('success'))
        self.assertIn('data', response_data)
        crag_data = response_data['data']
        self.assertEqual(crag_data['name'], self.test_crag.name)
        self.assertEqual(crag_data['location_lat'], self.test_crag.location_lat)
        self.assertEqual(crag_data['location_lon'], self.test_crag.location_lon)

    @patch('firebase_admin.app_check.verify_token')
    def test_08_crag_get_monthly_ranking(self, mock_verify_app_check):
        """Test get crag monthly ranking endpoint: GET /crag/get_crag_monthly_ranking/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}
        
        url = reverse("get_crag_monthly_ranking")
        params = {"crag_id": self.test_crag.crag_id, "count": "5"}
        response = self.client.get(url, params, **self.auth_headers)
        self.print_endpoint_result("CRAG - GET MONTHLY RANKING", url, response)
        
        # Assertions
        self.assertEqual(response.get('Content-Type'), 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertIn('success', response_data)
        self.assertIn('message', response_data)
        
        # Expect success (200), fail if error
        if response.status_code == 200:
            self.assertTrue(response_data.get('success'), 
                          f"Expected success=True but got: {response_data}")
        else:
            self.fail(f"CRAG GET MONTHLY RANKING failed with status {response.status_code}: {response_data.get('message', 'Unknown error')}")

    @patch('firebase_admin.app_check.verify_token')
    def test_09_crag_get_trending(self, mock_verify_app_check):
        """Test get trending crags endpoint: GET /crag/get_trending_crags/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}
        
        url = reverse("get_trending_crags")
        params = {"count": "5"}
        response = self.client.get(url, params, **self.auth_headers)
        self.print_endpoint_result("CRAG - GET TRENDING", url, response)
        
        # Assertions
        self.assertEqual(response.get('Content-Type'), 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertIn('success', response_data)
        self.assertIn('message', response_data)
        
        # Expect success (200), fail if error
        if response.status_code == 200:
            self.assertTrue(response_data.get('success'), 
                          f"Expected success=True but got: {response_data}")
        else:
            self.fail(f"CRAG GET TRENDING failed with status {response.status_code}: {response_data.get('message', 'Unknown error')}")

    @patch('firebase_admin.app_check.verify_token')
    def test_10_climb_log_get_user_logs(self, mock_verify_app_check):
        """Test get user climb logs endpoint: POST /climb_log/get_user_climb_logs/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}
        
        url = reverse("get_user_climb_logs")
        data = {"user_id": self.test_user.user_id}
        response = self.client.post(url, data=json.dumps(data), 
                                  content_type='application/json', **self.auth_headers)
        self.print_endpoint_result("CLIMB LOG - GET USER LOGS", url, response)
        
        # Assertions
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get('Content-Type'), 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(response_data.get('success'))
        self.assertIn('data', response_data)
        self.assertIsInstance(response_data['data'], list)

    @patch('firebase_admin.app_check.verify_token')
    def test_11_climb_log_get_user_stats(self, mock_verify_app_check):
        """Test get user climb stats endpoint: POST /climb_log/get_user_climb_stats/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}
        
        url = reverse("get_user_climb_stats")
        data = {"user_id": self.test_user.user_id}
        response = self.client.post(url, data=json.dumps(data), 
                                  content_type='application/json', **self.auth_headers)
        self.print_endpoint_result("CLIMB LOG - GET USER STATS", url, response)
        
        # Assertions
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get('Content-Type'), 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(response_data.get('success'))
        self.assertIn('data', response_data)
        self.assertIn('total_routes', response_data['data'])

    @patch('firebase_admin.app_check.verify_token')
    def test_12_post_get_post(self, mock_verify_app_check):
        """Test get post endpoint: GET /post/get_post/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}
        
        url = reverse("get_post")
        params = {"post_id": self.test_post.post_id}
        response = self.client.get(url, params, **self.auth_headers)
        self.print_endpoint_result("POST - GET POST", url, response)
        
        # Assertions
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get('Content-Type'), 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(response_data.get('success'))
        self.assertIn('data', response_data)
        post_data = response_data['data']
        self.assertEqual(post_data['user'], self.test_user.user_id)
        self.assertEqual(post_data['content'], self.test_post.content)
        self.assertEqual(post_data['tags'], self.test_post.tags)

    @patch('firebase_admin.app_check.verify_token')
    def test_13_post_get_by_user_id(self, mock_verify_app_check):
        """Test get post by user ID endpoint: POST /post/get_post_by_user_id/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}
        
        url = reverse("get_post_by_user_id")
        data = {
            "user_id": self.test_user.user_id,
            "count": 10,
            "blacklist": []
        }
        response = self.client.post(url, data=json.dumps(data), 
                                  content_type='application/json', **self.auth_headers)
        self.print_endpoint_result("POST - GET BY USER ID", url, response)
        
        # Assertions
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get('Content-Type'), 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(response_data.get('success'))
        self.assertIn('data', response_data)
        self.assertIsInstance(response_data['data'], list)
        if response_data['data']:  # If posts exist
            self.assertEqual(response_data['data'][0]['user'], self.test_user.user_id)

    @patch('firebase_admin.app_check.verify_token')
    def test_14_post_get_random(self, mock_verify_app_check):
        """Test get random posts endpoint: POST /post/get_random_posts/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}
        
        url = reverse("get_random_post")
        data = {
            "count": 10,
            "blacklist": []
        }
        response = self.client.post(url, data=json.dumps(data), 
                                  content_type='application/json', **self.auth_headers)
        self.print_endpoint_result("POST - GET RANDOM", url, response)
        
        # Assertions
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get('Content-Type'), 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(response_data.get('success'))
        self.assertIn('data', response_data)
        self.assertIsInstance(response_data['data'], list)

    @patch('firebase_admin.app_check.verify_token')
    def test_15_post_create(self, mock_verify_app_check):
        """Test create post endpoint: POST /post/create_post/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}
        
        url = reverse("create_post")
        data = {
            "user_id": self.test_user.user_id,
            "content": "New test post content",
            "tags": ["new", "test", "climbing"]
        }
        response = self.client.post(url, data=json.dumps(data), 
                                  content_type='application/json', **self.auth_headers)
        self.print_endpoint_result("POST - CREATE", url, response)
        
        # Assertions
        self.assertEqual(response.get('Content-Type'), 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertIn('success', response_data)
        self.assertIn('message', response_data)
        
        # Expect success (200/201), fail if error
        if response.status_code in [200, 201]:
            self.assertTrue(response_data.get('success'), 
                          f"Expected success=True but got: {response_data}")
        else:
            self.fail(f"POST CREATE failed with status {response.status_code}: {response_data.get('message', 'Unknown error')}")

    @patch('firebase_admin.app_check.verify_token')
    def test_16_post_like(self, mock_verify_app_check):
        """Test like post endpoint: POST /post/like/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}
        
        url = reverse("like_post")
        data = {
            "user_id": self.test_user.user_id,
            "post_id": self.test_post.post_id
        }
        response = self.client.post(url, data=json.dumps(data), 
                                  content_type='application/json', **self.auth_headers)
        self.print_endpoint_result("POST - LIKE", url, response)
        
        # Assertions
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get('Content-Type'), 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(response_data.get('success'))
        self.assertEqual(response_data.get('message'), 'Post liked')

    @patch('firebase_admin.app_check.verify_token')
    def test_17_post_unlike(self, mock_verify_app_check):
        """Test unlike post endpoint: POST /post/unlike/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}
        
        url = reverse("unlike_post")
        # First like the post
        PostLike.objects.create(user=self.test_user, post=self.test_post)
        
        data = {
            "user_id": self.test_user.user_id,
            "post_id": self.test_post.post_id
        }
        response = self.client.post(url, data=json.dumps(data), 
                                  content_type='application/json', **self.auth_headers)
        self.print_endpoint_result("POST - UNLIKE", url, response)
        
        # Assertions
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get('Content-Type'), 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(response_data.get('success'))
        self.assertEqual(response_data.get('message'), 'Post unliked')

    @patch('firebase_admin.app_check.verify_token')
    def test_18_post_likes_count(self, mock_verify_app_check):
        """Test post likes count endpoint: GET /post/likes/count/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}
        
        url = reverse("post_likes_count")
        params = {"post_id": self.test_post.post_id}
        response = self.client.get(url, params, **self.auth_headers)
        self.print_endpoint_result("POST - LIKES COUNT", url, response)
        
        # Assertions
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get('Content-Type'), 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(response_data.get('success'))
        self.assertIn('data', response_data)
        self.assertIn('count', response_data['data'])
        self.assertIsInstance(response_data['data']['count'], int)

    @patch('firebase_admin.app_check.verify_token')
    def test_19_post_likes_users(self, mock_verify_app_check):
        """Test post likes users endpoint: GET /post/likes/users/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}
        
        url = reverse("post_likes_users")
        params = {"post_id": self.test_post.post_id}
        response = self.client.get(url, params, **self.auth_headers)
        self.print_endpoint_result("POST - LIKES USERS", url, response)
        
        # Assertions
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get('Content-Type'), 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(response_data.get('success'))
        self.assertIn('data', response_data)
        self.assertIn('users', response_data['data'])
        self.assertIsInstance(response_data['data']['users'], list)

    def tearDown(self):
        """Clean up after tests"""
        print("\n" + "=" * 80)
        print("ALL ENDPOINT TESTS COMPLETED")
        print("=" * 80)