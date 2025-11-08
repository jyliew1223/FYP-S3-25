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
from MyApp.Entity.post_comment import PostComment
from rest_framework.test import APIClient
from rest_framework import status
import uuid



class AllEndpointsSuccessTestCase(TestCase):
    """Test all endpoints for successful responses and output their values"""

    is_first_test = True

    def __init__(self, methodName: str = "runTest") -> None:
        super().__init__(methodName)
        self.is_first_test = True

    def setUp(self):
        """Set up test data for all endpoints"""
        self.client = APIClient()
        self.client.credentials(
            HTTP_X_FIREBASE_APPCHECK="mock_app_check_token",
            HTTP_AUTHORIZATION="Bearer mock_id_token",
        )

        # Create test user
        self.test_user = User.objects.create(
            user_id="test_user_123",
            username="testuser",
            email="test@example.com",
            profile_picture="test_profile.jpg",
            status=True,
        )

        # Create test crag
        self.test_crag = Crag.objects.create(
            name="Test Crag",
            location_lat=40.7128,
            location_lon=-74.0060,
            description="A test climbing crag",
        )

        # Create test post
        self.test_post = Post.objects.create(
            user=self.test_user,
            content="Test climbing post content",
            title="Test",
            tags=["climbing", "test"],
            status="active",
        )

        self.teste_post_comment = PostComment.objects.create(
            post=self.test_post, user=self.test_user, content="some content"
        )

        self.test_route = Route.objects.create(
            crag=self.test_crag, route_name="Test Route", route_grade="6"
        )

        # Mock authentication headers for Firebase App Check
        self.auth_headers = {
            "HTTP_X_FIREBASE_APPCHECK": "mock_app_check_token",
            "HTTP_AUTHORIZATION": "Bearer mock_id_token",
        }

    def print_endpoint_result(self, endpoint_name, url, response, data=None):
        """Helper method to print endpoint results in a formatted way"""
        if AllEndpointsSuccessTestCase.is_first_test:
            AllEndpointsSuccessTestCase.is_first_test = False
            print(f"\n{'='*60}")
            print(f"Testing all endpoints for success")
            print(f"{'='*60}")

        print(f"\n{'='*60}")
        print(f"{self._testMethodName}")
        print(f"{'='*60}")
        print(f"ENDPOINT: {endpoint_name}")
        print(f"URL: {url}")

        # Print input data if provided
        if data is not None:
            try:
                print(f"INPUT DATA: {json.dumps(data, indent=2)}")
            except TypeError:
                print(f"INPUT DATA: {data}")

        print(f"STATUS CODE: {response.status_code}")
        print(f"CONTENT TYPE: {response.get('Content-Type', 'Not specified')}")

        # Check for JSON response
        if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            try:
                if "application/json" in response.get("Content-Type", ""):
                    content = response.json()
                    print(f"RESPONSE DATA: {json.dumps(content, indent=2)}")
                else:
                    content = response.content.decode("utf-8")[
                        :500
                    ]  # Limit HTML content
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
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("text/html", response.get("Content-Type", ""))
        self.assertIn(b"GoClimb", response.content)

    @patch("firebase_admin.auth.verify_id_token")
    @patch("firebase_admin.app_check.verify_token")
    def test_02_auth_signup(self, mock_verify_app_check, mock_verify_id_token):
        """Test auth signup endpoint: POST /auth/signup/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}
        mock_verify_id_token.return_value = {"uid": "fake_id"}

        url = reverse("signup")
        data = {
            "id_token": "mock_firebase_id_token",
            "username": "newuser",
            "email": "newuser@example.com",
        }
        response = self.client.post(url, data, format="json")
        self.print_endpoint_result("AUTH - SIGNUP", url, response, data)

        # Assertions
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response_data = response.json()
        self.assertIn("success", response_data)
        self.assertIn("message", response_data)

        # Expect success (status.HTTP_200_OK/status.HTTP_201_CREATED), fail if error
        if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            self.assertTrue(
                response_data.get("success"),
                f"Expected success=True but got: {response_data}",
            )
        else:
            self.fail(
                f"AUTH SIGNUP failed with status {response.status_code}: {response_data.get('message', 'Unknown error')}"
            )

    @patch("firebase_admin.auth.verify_id_token")
    @patch("firebase_admin.app_check.verify_token")
    def test_03_auth_verify_id_token(self, mock_verify_app_check, mock_verify_id_token):
        """Test auth verify ID token endpoint: POST /auth/verify_id_token/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}
        mock_verify_id_token.return_value = {"uid": self.test_user.user_id}

        url = reverse("verify_id_token")
        data = {"id_token": "mock_firebase_id_token"}
        response = self.client.post(url, data, format="json")
        self.print_endpoint_result("AUTH - VERIFY ID TOKEN", url, response, data)

        # Assertions
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response_data = response.json()
        self.assertIn("success", response_data)
        self.assertIn("message", response_data)

        # Expect success (status.HTTP_200_OK), fail if error
        if response.status_code == status.HTTP_200_OK:
            self.assertTrue(
                response_data.get("success"),
                f"Expected success=True but got: {response_data}",
            )
        else:
            self.fail(
                f"AUTH VERIFY ID TOKEN failed with status {response.status_code}: {response_data.get('message', 'Unknown error')}"
            )

    @patch("firebase_admin.app_check.verify_token")
    def test_04_auth_verify_app_check_token(self, mock_verify_app_check):
        """Test auth verify app check token endpoint: GET /auth/verify_app_check_token/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("verify_app_check_token")
        params = {"app_check_token": "test_app_check_token_123"}
        response = self.client.get(url, params)
        self.print_endpoint_result(
            "AUTH - VERIFY APP CHECK TOKEN", url, response, params
        )

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertEqual(response_data.get("message"), "Request authorized")

    @patch("firebase_admin.auth.verify_id_token")
    @patch("firebase_admin.app_check.verify_token")
    def test_05_user_get_user(self, mock_verify_app_check, mock_verify_id_token):
        """Test get user endpoint: POST /user/get_user/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}
        mock_verify_id_token.return_value = {"uid": self.test_user.user_id}

        url = reverse("get_user")
        data = {"id_token": "mock_id_token"}
        response = self.client.post(url, data, format="json")
        self.print_endpoint_result("USER - GET USER", url, response, data)

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)
        user_data = response_data["data"]
        self.assertEqual(user_data["user_id"], self.test_user.user_id)
        self.assertEqual(user_data["username"], self.test_user.username)
        self.assertEqual(user_data["email"], self.test_user.email)

    @patch("firebase_admin.app_check.verify_token")
    def test_06_user_get_monthly_ranking(self, mock_verify_app_check):
        """Test get monthly user ranking endpoint: GET /user/get_monthly_user_ranking/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("get_monthly_user_ranking")
        params = {"count": "5"}
        response = self.client.get(url, params)
        self.print_endpoint_result("USER - GET MONTHLY RANKING", url, response, params)

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)
        self.assertIsInstance(response_data["data"], list)

    @patch("firebase_admin.app_check.verify_token")
    def test_07_crag_get_info(self, mock_verify_app_check):
        """Test get crag info endpoint: GET /crag/get_crag_info/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("get_crag_info")
        params = {"crag_id": self.test_crag.crag_id}
        response = self.client.get(url, params)
        self.print_endpoint_result("CRAG - GET INFO", url, response, params)

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)
        crag_data = response_data["data"]
        self.assertEqual(crag_data["name"], self.test_crag.name)
        self.assertEqual(crag_data["location_lat"], self.test_crag.location_lat)
        self.assertEqual(crag_data["location_lon"], self.test_crag.location_lon)

    @patch("firebase_admin.app_check.verify_token")
    def test_08_crag_get_monthly_ranking(self, mock_verify_app_check):
        """Test get crag monthly ranking endpoint: GET /crag/get_crag_monthly_ranking/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("get_crag_monthly_ranking")
        params = {"crag_id": self.test_crag.crag_id, "count": "5"}
        response = self.client.get(url, params)
        self.print_endpoint_result("CRAG - GET MONTHLY RANKING", url, response, params)

        # Assertions
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response_data = response.json()
        self.assertIn("success", response_data)
        self.assertIn("message", response_data)

        # Expect success (status.HTTP_200_OK), fail if error
        if response.status_code == status.HTTP_200_OK:
            self.assertTrue(
                response_data.get("success"),
                f"Expected success=True but got: {response_data}",
            )
        else:
            self.fail(
                f"CRAG GET MONTHLY RANKING failed with status {response.status_code}: {response_data.get('message', 'Unknown error')}"
            )

    @patch("firebase_admin.app_check.verify_token")
    def test_09_crag_get_trending(self, mock_verify_app_check):
        """Test get trending crags endpoint: GET /crag/get_trending_crags/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("get_trending_crags")
        params = {"count": "5"}
        response = self.client.get(url, params)
        self.print_endpoint_result("CRAG - GET TRENDING", url, response, params)

        # Assertions
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response_data = response.json()
        self.assertIn("success", response_data)
        self.assertIn("message", response_data)

        # Expect success (status.HTTP_200_OK), fail if error
        if response.status_code == status.HTTP_200_OK:
            self.assertTrue(
                response_data.get("success"),
                f"Expected success=True but got: {response_data}",
            )
        else:
            self.fail(
                f"CRAG GET TRENDING failed with status {response.status_code}: {response_data.get('message', 'Unknown error')}"
            )

    @patch("firebase_admin.app_check.verify_token")
    def test_10_climb_log_get_user_logs(self, mock_verify_app_check):
        """Test get user climb logs endpoint: POST /climb_log/get_user_climb_logs/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("get_user_climb_logs")
        data = {"user_id": self.test_user.user_id}
        response = self.client.post(url, data, format="json")
        self.print_endpoint_result("CLIMB LOG - GET USER LOGS", url, response, data)

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)
        self.assertIsInstance(response_data["data"], list)

    @patch("firebase_admin.app_check.verify_token")
    def test_11_climb_log_get_user_stats(self, mock_verify_app_check):
        """Test get user climb stats endpoint: POST /climb_log/get_user_climb_stats/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("get_user_climb_stats")
        data = {"user_id": self.test_user.user_id}
        response = self.client.post(url, data, format="json")
        self.print_endpoint_result("CLIMB LOG - GET USER STATS", url, response, data)

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)
        self.assertIn("total_routes", response_data["data"])

    @patch("firebase_admin.app_check.verify_token")
    def test_12_post_get_post(self, mock_verify_app_check):
        """Test get post endpoint: GET /post/get_post/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("get_post")
        params = {"post_id": self.test_post.post_id}
        response = self.client.get(url, params)
        self.print_endpoint_result("POST - GET POST", url, response, params)

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)
        post_data = response_data["data"]
        self.assertEqual(post_data["user"]["user_id"], self.test_user.user_id)
        self.assertEqual(post_data["content"], self.test_post.content)
        self.assertEqual(post_data["tags"], self.test_post.tags)

    @patch("firebase_admin.app_check.verify_token")
    def test_13_post_get_by_user_id(self, mock_verify_app_check):
        """Test get post by user ID endpoint: POST /post/get_post_by_user_id/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("get_post_by_user_id")
        data = {"user_id": self.test_user.user_id, "count": 10, "blacklist": []}
        response = self.client.post(url, data, format="json")
        self.print_endpoint_result("POST - GET BY USER ID", url, response, data)

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)
        self.assertIsInstance(response_data["data"], list)
        if response_data["data"]:  # If posts exist
            self.assertEqual(
                response_data["data"][0]["user"]["user_id"], self.test_user.user_id
            )

    @patch("firebase_admin.app_check.verify_token")
    def test_14_post_get_random(self, mock_verify_app_check):
        """Test get random posts endpoint: POST /post/get_random_posts/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("get_random_post")
        data = {"count": 10, "blacklist": []}
        response = self.client.post(url, data, format="json")
        self.print_endpoint_result("POST - GET RANDOM", url, response, data)

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)
        self.assertIsInstance(response_data["data"], list)

    @patch("firebase_admin.app_check.verify_token")
    def test_15_post_create(self, mock_verify_app_check):
        """Test create post endpoint: POST /post/create_post/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("create_post")
        data = {
            "user_id": self.test_user.user_id,
            "content": "New test post content",
            "tags": ["new", "test", "climbing"],
        }
        response = self.client.post(url, data, format="json")
        self.print_endpoint_result("POST - CREATE", url, response, data)

        # Assertions
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response_data = response.json()
        self.assertIn("success", response_data)
        self.assertIn("message", response_data)

        # Expect success (status.HTTP_200_OK/status.HTTP_201_CREATED), fail if error
        if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            self.assertTrue(
                response_data.get("success"),
                f"Expected success=True but got: {response_data}",
            )
        else:
            self.fail(
                f"POST CREATE failed with status {response.status_code}: {response_data.get('message', 'Unknown error')}"
            )

    @patch("firebase_admin.app_check.verify_token")
    def test_16_post_like(self, mock_verify_app_check):
        """Test like post endpoint: POST /post/like/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("like_post")
        data = {"user_id": self.test_user.user_id, "post_id": self.test_post.post_id}
        response = self.client.post(url, data, format="json")
        self.print_endpoint_result("POST - LIKE", url, response, data)

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertEqual(response_data.get("message"), "Post liked")

    @patch("firebase_admin.app_check.verify_token")
    def test_17_post_unlike(self, mock_verify_app_check):
        """Test unlike post endpoint: POST /post/unlike/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("unlike_post")
        # First like the post
        PostLike.objects.create(user=self.test_user, post=self.test_post)

        data = {"user_id": self.test_user.user_id, "post_id": self.test_post.post_id}
        response = self.client.post(url, data, format="json")
        self.print_endpoint_result("POST - UNLIKE", url, response, data)

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertEqual(response_data.get("message"), "Post unliked")

    @patch("firebase_admin.app_check.verify_token")
    def test_18_post_likes_count(self, mock_verify_app_check):
        """Test post likes count endpoint: GET /post/likes/count/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("post_likes_count")
        params = {"post_id": self.test_post.post_id}
        response = self.client.get(url, params)
        self.print_endpoint_result("POST - LIKES COUNT", url, response, params)

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)
        self.assertIn("count", response_data["data"])
        self.assertIsInstance(response_data["data"]["count"], int)

    @patch("firebase_admin.app_check.verify_token")
    def test_19_post_likes_users(self, mock_verify_app_check):
        """Test post likes users endpoint: GET /post/likes/users/"""
        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("post_likes_users")
        params = {"post_id": self.test_post.post_id}
        response = self.client.get(url, params)
        self.print_endpoint_result("POST - LIKES USERS", url, response, params)

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)
        self.assertIn("users", response_data["data"])
        self.assertIsInstance(response_data["data"]["users"], list)

    @patch("firebase_admin.app_check.verify_token")
    def test_20_create_post_comment(self, mock_app_check):
        # Mock App Check to always succeed
        mock_app_check.return_value = {"success": True}

        url = reverse("create_post_comment")  # make sure this name matches urls.py
        data = {
            "post_id": f"POST-{self.test_post.post_id:06d}",  # formatted id if using PrefixedID
            "user_id": self.test_user.user_id,
            "content": "This is a test comment",
        }

        response = self.client.post(url, data=data, format="json")
        self.print_endpoint_result("COMMENT - CREATE COMMENT", url, response, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response_json = response.json()
        self.assertTrue(response_json["success"])

        # Check that comment is actually created
        comment = PostComment.objects.get(content="This is a test comment")
        self.assertEqual(comment.user, self.test_user)
        self.assertEqual(comment.post, self.test_post)

    @patch("firebase_admin.app_check.verify_token")
    def test_21_delete_post_comment(self, mock_app_check):
        # Mock App Check to always succeed
        mock_app_check.return_value = {"success": True}

        self.comment = PostComment.objects.create(
            post=self.test_post, user=self.test_user, content="Test comment"
        )

        url = reverse("delete_post_comment")  # make sure this name matches urls.py
        data = {"comment_id": self.comment.formatted_id}

        response = self.client.delete(url, data=data, format="json")
        self.print_endpoint_result("COMMENT - DELETE COMMENT", url, response, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_json = response.json()
        self.assertTrue(response_json["success"])

        # Ensure the comment is deleted
        self.assertFalse(
            PostComment.objects.filter(comment_id=self.comment.comment_id).exists()
        )

    @patch("firebase_admin.app_check.verify_token")
    def test_22_get_post_comments_by_post_id(self, mock_app_check):
        # Mock App Check to always succeed
        mock_app_check.return_value = {"success": True}

        # Create a test comment
        comment = PostComment.objects.create(
            post=self.test_post, user=self.test_user, content="Test comment for post"
        )

        # Endpoint URL
        url = reverse("get_post_comments_by_post_id")  # must match urls.py name
        data = {"post_id": self.test_post.formatted_id}

        # Perform GET request
        response = self.client.get(url, data=data, format="json")
        self.print_endpoint_result("COMMENT - GET BY POST ID", url, response, data)

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_json = response.json()
        self.assertTrue(response_json["success"])
        self.assertIsInstance(response_json["data"], list)
        self.assertGreaterEqual(len(response_json["data"]), 1)

    @patch("firebase_admin.app_check.verify_token")
    def test_23_get_post_comments_by_user_id(self, mock_app_check):
        # Mock App Check to always succeed
        mock_app_check.return_value = {"success": True}

        # Create a test comment
        comment = PostComment.objects.create(
            post=self.test_post, user=self.test_user, content="Test comment for user"
        )

        # Endpoint URL
        url = reverse("get_post_comments_by_user_id")  # must match urls.py name
        data = {"user_id": self.test_user.user_id}

        # Perform GET request
        response = self.client.get(url, data=data, format="json")
        self.print_endpoint_result("COMMENT - GET BY USER ID", url, response, data)

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_json = response.json()
        self.assertTrue(response_json["success"])
        self.assertIsInstance(response_json["data"], list)
        self.assertGreaterEqual(len(response_json["data"]), 1)

    @patch("firebase_admin.app_check.verify_token")
    def test_24_create_route(self, mock_app_check):
        mock_app_check.return_value = {"success": True}

        url = reverse("create_route")
        data = {
            "crag_id": self.test_crag.formatted_id,
            "route_name": "New Route",
            "route_grade": "5",
        }

        response = self.client.post(url, data=data, format="json")
        self.print_endpoint_result("ROUTE - CREATE ROUTE", url, response, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response_json = response.json()
        self.assertTrue(response_json["success"])
        self.assertEqual(response_json["data"]["route_name"], "New Route")

    @patch("firebase_admin.app_check.verify_token")
    def test_25_delete_route(self, mock_app_check):
        mock_app_check.return_value = {"success": True}

        url = reverse("delete_route")
        data = {"route_id": self.test_route.formatted_id}

        response = self.client.delete(url, data=data, format="json")
        self.print_endpoint_result("ROUTE - DELETE ROUTE", url, response, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_json = response.json()
        self.assertTrue(response_json["success"])
        self.assertFalse(
            Route.objects.filter(route_id=self.test_route.route_id).exists()
        )

    @patch("firebase_admin.app_check.verify_token")
    def test_26_get_route_by_crag_id(self, mock_app_check):
        mock_app_check.return_value = {"success": True}

        url = reverse("get_route_by_crag_id")
        data = {"crag_id": self.test_crag.formatted_id}

        response = self.client.get(url, data=data, format="json")
        self.print_endpoint_result("ROUTE - GET ROUTE BY CRAG ID", url, response, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_json = response.json()
        self.assertTrue(response_json["success"])
        self.assertIsInstance(response_json["data"], list)
        self.assertGreaterEqual(len(response_json["data"]), 1)
        self.assertEqual(
            response_json["data"][0]["route_name"], self.test_route.route_name
        )

    @patch("firebase_admin.app_check.verify_token")
    def test_27_get_route_by_id(self, mock_app_check):
        mock_app_check.return_value = {"success": True}

        url = reverse("get_route_by_id")
        data = {"route_id": self.test_route.formatted_id}

        response = self.client.get(url, data=data, format="json")
        self.print_endpoint_result("ROUTE - GET ROUTE BY ID", url, response, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_json = response.json()
        self.assertTrue(response_json["success"])
        self.assertEqual(
            response_json["data"]["route_name"], self.test_route.route_name
        )

    def tearDown(self):
        """Clean up after tests"""
        pass



# -------------------
# CREATING_01 (start)
# -------------------

class CreateCragViewTestCase(TestCase):
    def setUp(self):
        self.url = reverse("create_crag")

    def _pretty(self, resp):
        try:
            print(json.dumps(resp.json(), indent=2))
        except Exception:
            print("(non-json)", getattr(resp, "content", b"")[:200])

    @patch("MyApp.Boundary.crag_boundary.authenticate_app_check_token")
    def test_unauthorized(self, mock_auth):
        mock_auth.return_value = {"success": False, "message": "Invalid token."}
        resp = self.client.post(
            self.url,
            {"name": "Bukit Takun", "location_lat": 3.288, "location_lon": 101.650},
            content_type="application/json",
        )
        self._pretty(resp)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(resp.json().get("success"))

    @patch("MyApp.Boundary.crag_boundary.authenticate_app_check_token")
    def test_missing_fields(self, mock_auth):
        mock_auth.return_value = {"success": True}
        resp = self.client.post(
            self.url,
            {"location_lat": 3.288, "location_lon": 101.650},  # name missing
            content_type="application/json",
        )
        self._pretty(resp)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        body = resp.json()
        self.assertFalse(body["success"])
        self.assertIn("name", body["errors"])

    @patch("MyApp.Boundary.crag_boundary.authenticate_app_check_token")
    def test_success(self, mock_auth):
        mock_auth.return_value = {"success": True}
        payload = {
            "name": "Bukit Takun",
            "location_lat": 3.288,
            "location_lon": 101.650,
            "description": "A beautiful limestone crag with multi-pitch routes.",
        }
        resp = self.client.post(self.url, payload, content_type="application/json")
        self._pretty(resp)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        body = resp.json()
        self.assertTrue(body["success"])
        self.assertEqual(body["message"], "Crag created successfully")

        # row exists
        self.assertEqual(Crag.objects.count(), 1)
        crag = Crag.objects.first()
        self.assertEqual(crag.name, payload["name"])

        # shape matches CURRENT serializer (no additions)
        data = body["data"]
        for key in ["crag_id", "name", "location_lat", "location_lon", "description", "images_urls"]:
            self.assertIn(key, data)

        # optional: location_details if your model provides it
        # if "location_details" in data:  # keep flexible
        #     self.assertIsInstance(data["location_details"], (dict, list))

# -----------------
# CREATING_01 (end)
# -----------------



# -------------------
# CREATING_02 (start)
# -------------------

import uuid

class CreateClimbLogViewTestCase(TestCase):
    def setUp(self):
        # Create a minimal valid User for your current model fields
        self.user = User.objects.create(
            # keep your external string id if your model has it; if not, this is harmless
            user_id=str(uuid.uuid4()),
            username="jen",
            email="jen@example.com",
            profile_picture=None,
            status=True,
        )

        # Simple crag + route so the route FK exists
        self.crag = Crag.objects.create(
            name="Bukit Takun",
            location_lat=3.288,
            location_lon=101.65,
            description="test",
        )
        self.route = Route.objects.create(
            crag=self.crag,
            route_name="Classic",
            route_grade=6,
            # status="active",
        )

        self.url = reverse("create_climb_log")

    def _pretty(self, resp):
        try:
            print(json.dumps(resp.json(), indent=2))
        except Exception:
            print("(non-JSON):", getattr(resp, "content", b"")[:200])

    @patch("MyApp.Boundary.climblog_boundary.authenticate_app_check_token")
    def test_success(self, mock_auth):
        mock_auth.return_value = {"success": True}
        payload = {
            # IMPORTANT: pass the integer PK for user_id
            "user_id": self.user.user_id,
            # Route id can be formatted or raw int – formatted is fine
            "route_id": self.route.formatted_id,
            "date_climbed": "2025-10-29",
            "notes": "Onsight",
        }
        resp = self.client.post(self.url, payload, content_type="application/json")
        self._pretty(resp)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.json().get("success"))
        self.assertEqual(resp.json()["data"]["route"]["route_id"], self.route.formatted_id)

    @patch("MyApp.Boundary.climblog_boundary.authenticate_app_check_token")
    def test_missing_fields(self, mock_auth):
        mock_auth.return_value = {"success": True}
        payload = {
            "user_id": self.user.user_id,
            # route_id missing on purpose
            "date_climbed": "2025-10-29",
        }
        resp = self.client.post(self.url, payload, content_type="application/json")
        self._pretty(resp)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(resp.json().get("success"))
        self.assertIn("route_id", resp.json()["errors"])

    @patch("MyApp.Boundary.climblog_boundary.authenticate_app_check_token")
    def test_unauthorized(self, mock_auth):
        mock_auth.return_value = {"success": False, "message": "Invalid token."}
        payload = {
            "user_id": self.user.user_id,
            "route_id": self.route.formatted_id,
            "date_climbed": "2025-10-29",
        }
        resp = self.client.post(self.url, payload, content_type="application/json")
        self._pretty(resp)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

# -----------------
# CREATING_02 (end)
# -----------------



# -------------------
# CREATING_03 (start)
# -------------------

import uuid

class CreateRouteTestCase(TestCase):
    def setUp(self):
        self.url = reverse("create_route")

        # seed user (not actually needed by endpoint body, but keeps parity with others)
        self.user = User.objects.create(
            user_id=str(uuid.uuid4()),
            username="maker",
            email="maker@example.com",
            status=True,
            profile_picture=None,
        )

        # seed crag
        self.crag = Crag.objects.create(
            name="Bukit Takun",
            location_lat=3.288,
            location_lon=101.65,
            description="demo crag",
            # location_details={"city": None, "country": None},
        )

    def _pretty(self, resp):
        try:
            print(json.dumps(resp.json(), indent=2))
        except Exception:
            print("(non-JSON)", getattr(resp, "content", b"")[:200])

    @patch("MyApp.Boundary.route_boundary.authenticate_app_check_token")
    def test_missing_fields(self, mock_appcheck):
        mock_appcheck.return_value = {"success": True}
        resp = self.client.post(self.url, data={"route_name": "Classic"}, content_type="application/json")
        self._pretty(resp)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("route_grade", resp.json().get("errors", {}))
        self.assertIn("crag_id", resp.json().get("errors", {}))

    @patch("MyApp.Boundary.route_boundary.authenticate_app_check_token")
    def test_success(self, mock_appcheck):
        mock_appcheck.return_value = {"success": True}
        payload = {
            "route_name": "Classic",
            "route_grade": 6,
            "crag_id": self.crag.formatted_id,  # "CRAG-00000X" works via serializer
        }
        resp = self.client.post(self.url, data=payload, content_type="application/json")
        self._pretty(resp)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        body = resp.json()
        self.assertTrue(body["success"])
        self.assertEqual(body["message"], "Route created successfully")
        self.assertEqual(body["data"]["route_name"], "Classic")
        self.assertEqual(body["data"]["route_grade"], 6)
        self.assertTrue(body["data"]["route_id"].startswith("ROUTE-"))

    @patch("MyApp.Boundary.route_boundary.authenticate_app_check_token")
    def test_unauthorized(self, mock_appcheck):
        mock_appcheck.return_value = {"success": False, "message": "Invalid token."}
        payload = {"route_name": "Classic", "route_grade": 6, "crag_id": self.crag.pk}
        resp = self.client.post(self.url, data=payload, content_type="application/json")
        self._pretty(resp)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

# -----------------
# CREATING_03 (end)
# -----------------



# ------------------
# DEELETE_01 (start)
# ------------------

from datetime import date


class DeleteClimbLogViewTestCase(TestCase):
    def setUp(self):
        # minimal entities to own a log
        self.user = User.objects.create(
            user_id="u-1",
            username="jen",
            email="jen@example.com",
            profile_picture=None,
            status=True,
        )
        self.crag = Crag.objects.create(
            name="Bukit Takun",
            location_lat=3.288,
            location_lon=101.65,
            description="demo",
        )
        self.route = Route.objects.create(
            route_name="Classic",
            route_grade=6,
            crag=self.crag,
        )
        self.log = ClimbLog.objects.create(
            user=self.user,
            route=self.route,
            date_climbed=date(2025, 10, 29),
            notes="demo",
        )

        # url name you added in climb_log_url.py
        self.url = reverse("delete_climb_log")

    def _pretty(self, resp):
        try:
            import json
            print(json.dumps(resp.json(), indent=2))
        except Exception:
            print("(non-JSON)", getattr(resp, "content", b"")[:200])

    @patch("MyApp.Boundary.climblog_boundary.authenticate_app_check_token")
    def test_success_with_formatted_id(self, mock_appcheck):
        mock_appcheck.return_value = {"success": True}

        # accept formatted like "CLIMBLOG-000001"
        resp = self.client.delete(f"{self.url}?log_id={self.log.formatted_id}")
        self._pretty(resp)

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.json().get("success"))
        self.assertFalse(ClimbLog.objects.filter(pk=self.log.pk).exists())

    @patch("MyApp.Boundary.climblog_boundary.authenticate_app_check_token")
    def test_bad_request_missing_id(self, mock_appcheck):
        mock_appcheck.return_value = {"success": True}

        resp = self.client.delete(self.url)  # no query param
        self._pretty(resp)

        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(resp.json().get("success"))

    @patch("MyApp.Boundary.climblog_boundary.authenticate_app_check_token")
    def test_not_found(self, mock_appcheck):
        mock_appcheck.return_value = {"success": True}

        # id that does not exist
        resp = self.client.delete(f"{self.url}?log_id=CLIMBLOG-999999")
        self._pretty(resp)

        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    @patch("MyApp.Boundary.climblog_boundary.authenticate_app_check_token")
    def test_unauthorized(self, mock_appcheck):
        mock_appcheck.return_value = {"success": False, "message": "Invalid token."}

        resp = self.client.delete(f"{self.url}?log_id={self.log.pk}")
        self._pretty(resp)

        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

# ---------------
# DELETE_01 (end)
# ---------------



# -----------------
# DELETE_02 (start)
# -----------------

class DeleteRouteViewTestCase(TestCase):
    def setUp(self):
        self.url = reverse("delete_route")

        self.user = User.objects.create(
            user_id=str(uuid.uuid4()),
            username="tester",
            email="tester@example.com",
            status=True,
            profile_picture=None,
        )
        self.crag = Crag.objects.create(
            name="Bukit Takun",
            location_lat=3.288,
            location_lon=101.65,
            description="test",
        )
        self.route = Route.objects.create(
            route_name="Classic",
            route_grade=6,
            crag=self.crag,
        )

    def _pretty(self, resp):
        try:
            import json; print(json.dumps(resp.json(), indent=2))
        except Exception:
            print(getattr(resp, "content", b"")[:200])

    @patch("MyApp.Boundary.route_boundary.authenticate_app_check_token")
    def test_missing_fields(self, mock_appcheck):
        mock_appcheck.return_value = {"success": True}
        # no route_id anywhere
        resp = self.client.delete(self.url)
        self._pretty(resp)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("route_id", resp.json().get("errors", {}))

    @patch("MyApp.Boundary.route_boundary.authenticate_app_check_token")
    def test_not_found(self, mock_appcheck):
        mock_appcheck.return_value = {"success": True}
        # send as query param to avoid body parsing ambiguity
        resp = self.client.delete(f"{self.url}?route_id=ROUTE-999999")
        self._pretty(resp)
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    @patch("MyApp.Boundary.route_boundary.authenticate_app_check_token")
    def test_success(self, mock_appcheck):
        mock_appcheck.return_value = {"success": True}
        rid = f"ROUTE-{self.route.pk:06d}"   # <-- use pk, not id
        resp = self.client.delete(f"{self.url}?route_id={rid}")
        self._pretty(resp)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.json().get("success"))

    @patch("MyApp.Boundary.route_boundary.authenticate_app_check_token")
    def test_unauthorized(self, mock_appcheck):
        mock_appcheck.return_value = {"success": False, "message": "Invalid token."}
        rid = f"ROUTE-{self.route.pk:06d}"   # <-- use pk, not id
        resp = self.client.delete(f"{self.url}?route_id={rid}")
        self._pretty(resp)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

# ---------------
# DELETE_02 (end)
# ---------------



# -----------------
# DELETE_03 (start)
# -----------------

from unittest import mock
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from MyApp.Entity.user import User
from MyApp.Entity.post import Post
# from MyApp.Entity.crag import Crag  # not needed here; you can remove

class DeletePostViewTestCase(APITestCase):
    def setUp(self):
        # two users
        self.owner = User.objects.create(
            user_id="11111111-1111-1111-1111-111111111111",
            username="owner",
            email="owner@example.com",
            status=True,
        )
        self.other = User.objects.create(
            user_id="22222222-2222-2222-2222-222222222222",
            username="other",
            email="other@example.com",
            status=True,
        )
        # a post by owner
        self.post = Post.objects.create(
            user=self.owner, title="Hello", content="World", tags=[]
        )
        self.url = reverse("delete_post")

    def _auth_ok(self, m_verify):
        m_verify.return_value = {"success": True, "message": "OK"}

    def _formatted_post_id(self, post_pk: int) -> str:
        return f"POST-{post_pk:06d}"

    @mock.patch("MyApp.Firebase.helpers.verify_app_check_token")
    def test_missing_fields(self, m_verify):
        self._auth_ok(m_verify)
        resp = self.client.delete(self.url, data={}, format="json",
                                  HTTP_X_FIREBASE_APPCHECK="t")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        body = resp.json()
        self.assertFalse(body["success"])
        # Both fields should be flagged
        self.assertIn("post_id", body.get("errors", {}))
        self.assertIn("user_id", body.get("errors", {}))

    @mock.patch("MyApp.Firebase.helpers.verify_app_check_token")
    def test_not_found(self, m_verify):
        self._auth_ok(m_verify)
        payload = {"post_id": "POST-999999", "user_id": self.owner.user_id}
        resp = self.client.delete(self.url, data=payload, format="json",
                                  HTTP_X_FIREBASE_APPCHECK="t")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(resp.json()["success"])

    @mock.patch("MyApp.Firebase.helpers.verify_app_check_token")
    def test_forbidden_not_owner(self, m_verify):
        self._auth_ok(m_verify)
        payload = {
            "post_id": self._formatted_post_id(self.post.pk),
            "user_id": self.other.user_id,
        }
        resp = self.client.delete(self.url, data=payload, format="json",
                                  HTTP_X_FIREBASE_APPCHECK="t")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(resp.json()["success"])

    @mock.patch("MyApp.Firebase.helpers.verify_app_check_token")
    def test_success(self, m_verify):
        self._auth_ok(m_verify)
        payload = {
            "post_id": self._formatted_post_id(self.post.pk),
            "user_id": self.owner.user_id,
        }
        # Pre-check exists
        self.assertTrue(Post.objects.filter(pk=self.post.pk).exists())
        resp = self.client.delete(self.url, data=payload, format="json",
                                  HTTP_X_FIREBASE_APPCHECK="t")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.json()["success"])
        # Post should be gone
        self.assertFalse(Post.objects.filter(pk=self.post.pk).exists())

    def test_unauthorized(self):
        # No App Check header -> 401 (helper returns missing token)
        payload = {
            "post_id": self._formatted_post_id(self.post.pk),
            "user_id": self.owner.user_id,
        }
        resp = self.client.delete(self.url, data=payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(resp.json()["success"])

# ---------------
# DELETE_03 (end)
# ---------------



# ---------------
# USER_02 (start)
# ---------------

from unittest.mock import patch
from rest_framework import status
from rest_framework.test import APITestCase
from MyApp.Entity.user import User

class DeleteUserAccountViewTestCase(APITestCase):

    @patch("MyApp.Utils.helper.authenticate_app_check_token")
    @patch("MyApp.Utils.helper.verify_id_token")
    def test_success(self, mock_verify, mock_auth):
        mock_auth.return_value = {"success": True}
        mock_verify.return_value = {"success": True, "uid": "USER123"}
        User.objects.create(user_id="USER123", username="testuser", email="test@example.com")

        resp = self.client.delete("/user/delete", {"id_token": "validtoken"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.data["success"])

    @patch("MyApp.Utils.helper.authenticate_app_check_token")
    def test_missing_field(self, mock_auth):
        mock_auth.return_value = {"success": True}
        resp = self.client.delete("/user/delete", {}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("MyApp.Utils.helper.authenticate_app_check_token")
    @patch("MyApp.Utils.helper.verify_id_token")
    def test_not_found(self, mock_verify, mock_auth):
        mock_auth.return_value = {"success": True}
        mock_verify.return_value = {"success": True, "uid": "NON_EXISTENT"}
        resp = self.client.delete("/user/delete", {"id_token": "token"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(resp.data["success"])

    @patch("MyApp.Utils.helper.authenticate_app_check_token")
    def test_unauthorized_appcheck(self, mock_auth):
        mock_auth.return_value = {"success": False, "message": "Invalid app check token"}
        resp = self.client.delete("/user/delete", {"id_token": "token"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch("MyApp.Utils.helper.authenticate_app_check_token")
    @patch("MyApp.Utils.helper.verify_id_token")
    def test_invalid_id_token(self, mock_verify, mock_auth):
        mock_auth.return_value = {"success": True}
        mock_verify.return_value = {"success": False, "message": "Invalid token"}
        resp = self.client.delete("/user/delete", {"id_token": "badtoken"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch("MyApp.Utils.helper.authenticate_app_check_token")
    @patch("MyApp.Utils.helper.verify_id_token")
    def test_success_with_query_param(self, mock_verify, mock_auth):
        mock_auth.return_value = {"success": True}
        mock_verify.return_value = {"success": True, "uid": "USER123"}
        User.objects.create(user_id="USER123", username="queryuser", email="query@example.com")

        # Call using query parameter instead of JSON body
        resp = self.client.delete("/user/delete?id_token=validtoken")

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.data["success"])
        self.assertFalse(User.objects.filter(pk="USER123").exists())

# -------------
# USER_02 (end)
# -------------



# ---------------
# USER_03 (start) 
# ---------------

from unittest.mock import patch
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from MyApp.Entity.user import User

USER_PATH = "/user/update"

class UpdateUserInfoViewTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create(
            user_id="UID-1",
            username="jen",
            email="jen@example.com",
            status=True,
        )

    # Happy path
    @patch("MyApp.Boundary.user_boundary.helper.verify_user_id", return_value={"success": True, "user_id": "UID-1"})
    @patch("MyApp.Boundary.user_boundary.helper.authenticate_app_check_token", return_value={"success": True})
    def test_success_update_username(self, *_):
        resp = self.client.post(
            USER_PATH,
            {"id_token": "token", "field": "username", "data": "jen_new"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        body = resp.json()
        self.assertTrue(body["success"])
        self.assertEqual(body["data"]["username"], "jen_new")

    # Invalid field name
    @patch("MyApp.Boundary.user_boundary.helper.verify_user_id", return_value={"success": True, "user_id": "UID-1"})
    @patch("MyApp.Boundary.user_boundary.helper.authenticate_app_check_token", return_value={"success": True})
    def test_invalid_field_name(self, *_):
        resp = self.client.post(
            USER_PATH,
            {"id_token": "token", "field": "bad_field", "data": "x"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(resp.json()["success"])

    # Missing required fields
    @patch("MyApp.Boundary.user_boundary.helper.authenticate_app_check_token", return_value={"success": True})
    def test_missing_fields(self, *_):
        resp = self.client.post(USER_PATH, {}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        j = resp.json()
        self.assertIn("id_token", j["errors"])
        self.assertIn("field", j["errors"])
        self.assertIn("data", j["errors"])

    # Unauthorized: bad id_token
    @patch("MyApp.Boundary.user_boundary.helper.verify_user_id", return_value={"success": False})
    @patch("MyApp.Boundary.user_boundary.helper.authenticate_app_check_token", return_value={"success": True})
    def test_unauthorized_bad_token(self, *_):
        resp = self.client.post(
            USER_PATH,
            {"id_token": "bad", "field": "username", "data": "x"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    # App Check failed
    @patch("MyApp.Boundary.user_boundary.helper.authenticate_app_check_token", return_value={"success": False, "message": "Invalid token."})
    def test_app_check_failed(self, *_):
        resp = self.client.post(
            USER_PATH,
            {"id_token": "token", "field": "username", "data": "x"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

# -------------
# USER_03 (end)
# -------------


