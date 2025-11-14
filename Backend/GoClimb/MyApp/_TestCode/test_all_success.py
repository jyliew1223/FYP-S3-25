import json
from datetime import date, datetime
from unittest.mock import patch
from django.test import TestCase
from django.urls import reverse
from MyApp.Entity.user import User
from MyApp.Entity.crag import Crag
from MyApp.Entity.cragmodel import CragModel
from MyApp.Entity.post import Post
from MyApp.Entity.climblog import ClimbLog
from MyApp.Entity.route import Route
from MyApp.Entity.postlikes import PostLike
from MyApp.Entity.postcomment import PostComment
from MyApp.Entity.modelroutedata import ModelRouteData
from rest_framework.test import APIClient
from rest_framework import status
import uuid



class AllEndpointsSuccessTestCase(TestCase):

    is_first_test = True

    def __init__(self, methodName: str = "runTest") -> None:
        super().__init__(methodName)
        self.is_first_test = True

    def setUp(self):

        self.client = APIClient()
        self.client.credentials(
            HTTP_X_FIREBASE_APPCHECK="mock_app_check_token",
            HTTP_AUTHORIZATION="Bearer mock_id_token",
        )

        self.test_user = User.objects.create(
            user_id="test_user_123",
            username="testuser",
            email="test@example.com",
            profile_picture="test_profile.jpg",
            status=True,
        )

        self.test_crag = Crag.objects.create(
            name="Test Crag",
            location_lat=40.7128,
            location_lon=-74.0060,
            description="A test climbing crag",
        )

        self.test_post = Post.objects.create(
            user=self.test_user,
            content="Test climbing post content",
            title="Test",
            tags=["climbing", "test"],
            status="active",
        )

        self.test_post_comment = PostComment.objects.create(
            post=self.test_post, user=self.test_user, content="some content"
        )

        self.test_route = Route.objects.create(
            crag=self.test_crag, route_name="Test Route", route_grade="6"
        )

        self.test_climb_log = ClimbLog.objects.create(
            user=self.test_user, route=self.test_route, date_climbed=datetime.now()
        )

        self.test_post_like = PostLike.objects.create(
            user=self.test_user, post=self.test_post
        )

        self.test_crag_model = CragModel.objects.create(
            crag=self.test_crag, user=self.test_user, status="active"
        )

        self.test_log = ClimbLog.objects.create(
            user=self.test_user,
            route=self.test_route,
            date_climbed=date.today().isoformat(),
            notes="Test log to delete",
        )

        self.test_model_route_data = ModelRouteData.objects.create(
            model=self.test_crag_model,
            user=self.test_user,
            route=self.test_route,
            route_data={
                "coordinates": [
                    {"x": 100, "y": 200, "z": 50},
                    {"x": 150, "y": 250, "z": 75},
                ],
                "difficulty": "5.10a",
                "holds": [
                    {"type": "crimp", "position": {"x": 120, "y": 220}},
                    {"type": "jug", "position": {"x": 180, "y": 280}},
                ],
            },
            status="active",
        )

        self.auth_headers = {
            "HTTP_X_FIREBASE_APPCHECK": "mock_app_check_token",
            "HTTP_AUTHORIZATION": "Bearer mock_id_token",
        }

    def print_endpoint_result(self, endpoint_name, url, response, data=None):

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

        if data is not None:
            try:
                print(f"INPUT DATA: {json.dumps(data, indent=2)}")
            except TypeError:
                print(f"INPUT DATA: {data}")

        print(f"STATUS CODE: {response.status_code}")
        print(f"CONTENT TYPE: {response.get('Content-Type', 'Not specified')}")

        if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
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

    def test_01_home_endpoint(self):

        url = reverse("home")
        response = self.client.get(url)
        self.print_endpoint_result("HOME", url, response)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("text/html", response.get("Content-Type", ""))
        self.assertIn(b"GoClimb", response.content)

    @patch("firebase_admin.auth.verify_id_token")
    @patch("firebase_admin.app_check.verify_token")
    def test_02_auth_signup(self, mock_verify_app_check, mock_verify_id_token):

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

        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response_data = response.json()
        self.assertIn("success", response_data)
        self.assertIn("message", response_data)

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

        mock_verify_app_check.return_value = {"app_id": "test_app"}
        mock_verify_id_token.return_value = {"uid": self.test_user.user_id}

        url = reverse("verify_id_token")
        data = {"id_token": "mock_firebase_id_token"}
        response = self.client.post(url, data, format="json")
        self.print_endpoint_result("AUTH - VERIFY ID TOKEN", url, response, data)

        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response_data = response.json()
        self.assertIn("success", response_data)
        self.assertIn("message", response_data)

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

        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("verify_app_check_token")
        params = {"app_check_token": "test_app_check_token_123"}
        response = self.client.get(url, params)
        self.print_endpoint_result(
            "AUTH - VERIFY APP CHECK TOKEN", url, response, params
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertEqual(response_data.get("message"), "Request authorized")

    @patch("firebase_admin.auth.verify_id_token")
    @patch("firebase_admin.app_check.verify_token")
    def test_05_user_get_user(self, mock_verify_app_check, mock_verify_id_token):

        mock_verify_app_check.return_value = {"app_id": "test_app"}
        mock_verify_id_token.return_value = {"uid": self.test_user.user_id}

        url = reverse("get_user")
        data = {"id_token": "mock_id_token"}
        response = self.client.post(url, data, format="json")
        self.print_endpoint_result("USER - GET USER", url, response, data)

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

        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("get_monthly_user_ranking")
        params = {"count": "5"}
        response = self.client.get(url, params)
        self.print_endpoint_result("USER - GET MONTHLY RANKING", url, response, params)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)
        self.assertIsInstance(response_data["data"], list)

    @patch("firebase_admin.app_check.verify_token")
    def test_07_crag_get_info(self, mock_verify_app_check):

        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("get_crag_info")
        params = {"crag_id": self.test_crag.formatted_id}
        response = self.client.get(url, params)
        self.print_endpoint_result("CRAG - GET INFO", url, response, params)

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

        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("get_crag_monthly_ranking")
        params = {"count": "5"}
        response = self.client.get(url, params)
        self.print_endpoint_result("CRAG - GET MONTHLY RANKING", url, response, params)

        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response_data = response.json()
        self.assertIn("success", response_data)
        self.assertIn("message", response_data)

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

        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("get_trending_crags")
        params = {"count": "5"}
        response = self.client.get(url, params)
        self.print_endpoint_result("CRAG - GET TRENDING", url, response, params)

        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response_data = response.json()
        self.assertIn("success", response_data)
        self.assertIn("message", response_data)

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

        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("get_user_climb_logs")
        data = {"user_id": self.test_user.user_id}
        response = self.client.post(url, data, format="json")
        self.print_endpoint_result("CLIMB LOG - GET USER LOGS", url, response, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)
        self.assertIsInstance(response_data["data"], list)

    @patch("firebase_admin.app_check.verify_token")
    def test_11_climb_log_get_user_stats(self, mock_verify_app_check):

        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("get_user_climb_stats")
        data = {"user_id": self.test_user.user_id}
        response = self.client.post(url, data, format="json")
        self.print_endpoint_result("CLIMB LOG - GET USER STATS", url, response, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)
        self.assertIn("total_routes", response_data["data"])

    @patch("firebase_admin.app_check.verify_token")
    def test_12_post_get_post(self, mock_verify_app_check):

        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("get_post")
        params = {"post_id": self.test_post.formatted_id}
        response = self.client.get(url, params)
        self.print_endpoint_result("POST - GET POST", url, response, params)

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

        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("get_post_by_user_id")
        data = {"user_id": self.test_user.user_id, "count": 10, "blacklist": []}
        response = self.client.post(url, data, format="json")
        self.print_endpoint_result("POST - GET BY USER ID", url, response, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)
        self.assertIsInstance(response_data["data"], list)
        if response_data["data"]:
            self.assertEqual(
                response_data["data"][0]["user"]["user_id"], self.test_user.user_id
            )

    @patch("firebase_admin.app_check.verify_token")
    def test_14_post_get_random(self, mock_verify_app_check):

        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("get_random_post")
        data = {"count": 10, "blacklist": []}
        response = self.client.post(url, data, format="json")
        self.print_endpoint_result("POST - GET RANDOM", url, response, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)
        self.assertIsInstance(response_data["data"], list)

    @patch("firebase_admin.app_check.verify_token")
    def test_15_post_create(self, mock_verify_app_check):

        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("create_post")
        data = {
            "user_id": self.test_user.user_id,
            "content": "New test post content",
            "tags": ["new", "test", "climbing"],
            "title": "testing",
        }
        response = self.client.post(url, data, format="json")
        self.print_endpoint_result("POST - CREATE", url, response, data)

        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response_data = response.json()
        self.assertIn("success", response_data)
        self.assertIn("message", response_data)

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

        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("like_post")
        data = {
            "user_id": self.test_user.user_id,
            "post_id": self.test_post.formatted_id,
        }
        PostLike.objects.filter(post=self.test_post).delete()
        response = self.client.post(url, data, format="json")
        self.print_endpoint_result("POST - LIKE", url, response, data)

        count = PostLike.objects.filter(post_id=self.test_post.post_id).count()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response_data = response.json()
        self.assertTrue(response_data.get("success"))
        print("liked count: " + str(count))
        self.assertFalse(count == 0)

    @patch("firebase_admin.app_check.verify_token")
    def test_17_post_unlike(self, mock_verify_app_check):

        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("unlike_post")
        data = {
            "user_id": self.test_user.user_id,
            "post_id": self.test_post.formatted_id,
        }
        response = self.client.post(url, data, format="json")
        self.print_endpoint_result("POST - UNLIKE", url, response, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response_data = response.json()
        self.assertTrue(response_data.get("success"))

    @patch("firebase_admin.app_check.verify_token")
    def test_18_post_likes_count(self, mock_verify_app_check):

        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("post_likes_count")
        params = {"post_id": self.test_post.formatted_id}
        response = self.client.get(url, params)
        self.print_endpoint_result("POST - LIKES COUNT", url, response, params)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)
        self.assertIn("count", response_data["data"])
        self.assertIsInstance(response_data["data"]["count"], int)

    @patch("firebase_admin.app_check.verify_token")
    def test_19_post_likes_users(self, mock_verify_app_check):

        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("post_likes_users")
        params = {"post_id": self.test_post.formatted_id}
        response = self.client.get(url, params)
        self.print_endpoint_result("POST - LIKES USERS", url, response, params)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)
        self.assertIn("users", response_data["data"])
        self.assertIsInstance(response_data["data"]["users"], list)

    @patch("firebase_admin.app_check.verify_token")
    def test_20_create_post_comment(self, mock_app_check):

        mock_app_check.return_value = {"success": True}

        url = reverse("create_post_comment")
        data = {
            "post_id": self.test_post.formatted_id,
            "user_id": self.test_user.user_id,
            "content": "This is a test comment",
        }

        response = self.client.post(url, data=data, format="json")
        self.print_endpoint_result("COMMENT - CREATE COMMENT", url, response, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response_json = response.json()
        self.assertTrue(response_json["success"])

        comment = PostComment.objects.get(content="This is a test comment")
        self.assertEqual(comment.user, self.test_user)
        self.assertEqual(comment.post, self.test_post)

    @patch("firebase_admin.app_check.verify_token")
    def test_21_delete_post_comment(self, mock_app_check):

        mock_app_check.return_value = {"success": True}

        self.comment = PostComment.objects.create(
            post=self.test_post, user=self.test_user, content="Test comment"
        )

        url = reverse("delete_post_comment")
        data = {"comment_id": self.comment.formatted_id}

        response = self.client.delete(url, data=data, format="json")
        self.print_endpoint_result("COMMENT - DELETE COMMENT", url, response, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_json = response.json()
        self.assertTrue(response_json["success"])

        self.assertFalse(
            PostComment.objects.filter(comment_id=self.comment.comment_id).exists()
        )

    @patch("firebase_admin.app_check.verify_token")
    def test_22_get_post_comments_by_post_id(self, mock_app_check):

        mock_app_check.return_value = {"success": True}

        comment = PostComment.objects.create(
            post=self.test_post, user=self.test_user, content="Test comment for post"
        )

        url = reverse("get_post_comments_by_post_id")
        data = {"post_id": self.test_post.formatted_id}

        response = self.client.get(url, data=data, format="json")
        self.print_endpoint_result("COMMENT - GET BY POST ID", url, response, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_json = response.json()
        self.assertTrue(response_json["success"])
        self.assertIsInstance(response_json["data"], list)
        self.assertGreaterEqual(len(response_json["data"]), 1)

    @patch("firebase_admin.app_check.verify_token")
    def test_23_get_post_comments_by_user_id(self, mock_app_check):

        mock_app_check.return_value = {"success": True}

        comment = PostComment.objects.create(
            post=self.test_post, user=self.test_user, content="Test comment for user"
        )

        url = reverse("get_post_comments_by_user_id")
        data = {"user_id": self.test_user.user_id}

        response = self.client.get(url, data=data, format="json")
        self.print_endpoint_result("COMMENT - GET BY USER ID", url, response, data)

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
            "user_id": self.test_user.user_id,
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

    @patch("firebase_admin.app_check.verify_token")
    def test_28_get_routes_by_user_id(self, mock_app_check):
        """Test getting routes by user ID"""
        
        mock_app_check.return_value = {"success": True}

        # Create additional routes for the test user
        Route.objects.create(
            crag=self.test_crag,
            route_name="User's First Route",
            route_grade="7",
            user=self.test_user,
        )
        Route.objects.create(
            crag=self.test_crag,
            route_name="User's Second Route", 
            route_grade="8",
            user=self.test_user,
        )

        url = reverse("get_routes_by_user_id")
        params = {"user_id": self.test_user.user_id}
        response = self.client.get(url, params)
        self.print_endpoint_result("ROUTE - GET BY USER ID", url, response, params)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)
        self.assertIsInstance(response_data["data"], list)
        
        # Verify that returned routes belong to the test user
        if response_data["data"]:
            for route in response_data["data"]:
                self.assertTrue(route["route_id"].startswith("ROUTE-"))
                self.assertIn("route_name", route)
                self.assertIn("route_grade", route)
                self.assertIn("crag", route)
                # Verify the route has user information if available
                if "user" in route and route["user"]:
                    self.assertEqual(route["user"]["user_id"], self.test_user.user_id)

    @patch("firebase_admin.app_check.verify_token")
    def test_29_crag_get_random(self, mock_verify_app_check):
        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("get_random_crag")
        data = {"count": 10, "blacklist": []}
        response = self.client.post(url, data, format="json")
        self.print_endpoint_result("CRAG - GET RANDOM", url, response, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)
        self.assertIsInstance(response_data["data"], list)

    @patch("firebase_admin.app_check.verify_token")
    def test_30_get_crag_model_by_id(self, mock_verify_app_check):
        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("get_models_by_crag_id")
        params = {"crag_id": self.test_crag.formatted_id}
        response = self.client.get(url, params)
        self.print_endpoint_result(
            "CRAG MODEL - GET MODELS BY CRAG ID", url, response, params
        )

        response_data = response.json()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response_data["data"][0]["model_id"], self.test_crag_model.formatted_id
        )

    @patch("firebase_admin.app_check.verify_token")
    def test_31_delete_crag_model(self, mock_verify_app_check):
        """Test deleting a crag model"""
        
        mock_verify_app_check.return_value = {"app_id": "test_app"}

        # Create a model to delete (separate from the one used in other tests)
        model_to_delete = CragModel.objects.create(
            crag=self.test_crag,
            user=self.test_user,
            name="Model to Delete",
            status="active"
        )

        url = reverse("delete_crag_model")
        data = {
            "model_id": model_to_delete.formatted_id,
            "user_id": self.test_user.user_id,
        }
        response = self.client.delete(url, data, format="json")
        self.print_endpoint_result("CRAG MODEL - DELETE", url, response, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertEqual(
            response_data.get("message"), "Crag model deleted successfully."
        )

        # Verify the model is actually deleted
        self.assertFalse(
            CragModel.objects.filter(model_id=model_to_delete.model_id).exists()
        )

    @patch("firebase_admin.app_check.verify_token")
    def test_32_get_models_by_user_id(self, mock_verify_app_check):
        """Test getting crag models by user ID"""
        
        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("get_models_by_user_id")
        params = {"user_id": self.test_user.user_id}
        response = self.client.get(url, params)
        self.print_endpoint_result("CRAG MODEL - GET BY USER ID", url, response, params)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)
        self.assertIsInstance(response_data["data"], list)
        
        # Verify that the returned models belong to the test user
        if response_data["data"]:
            for model in response_data["data"]:
                self.assertEqual(model["user"]["user_id"], self.test_user.user_id)
                self.assertTrue(model["model_id"].startswith("MODEL-"))
                self.assertIn("crag", model)
                self.assertIn("status", model)

    @patch("firebase_admin.app_check.verify_token")
    def test_33_update_crag_model(self, mock_verify_app_check):
        """Test updating a crag model"""
        
        mock_verify_app_check.return_value = {"app_id": "test_app"}

        # Create a model to update (separate from the one used in other tests)
        model_to_update = CragModel.objects.create(
            crag=self.test_crag,
            user=self.test_user,
            name="Original Model Name",
            status="active"
        )

        url = reverse("update_crag_model")
        data = {
            "model_id": model_to_update.formatted_id,
            "user_id": self.test_user.user_id,
            "name": "Updated Model Name",
            "status": "suspended"
        }
        response = self.client.put(url, data, format="json")
        self.print_endpoint_result("CRAG MODEL - UPDATE", url, response, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertEqual(
            response_data.get("message"), "Crag model updated successfully."
        )
        
        # Verify the model was actually updated
        updated_model = CragModel.objects.get(model_id=model_to_update.model_id)
        self.assertEqual(updated_model.name, "Updated Model Name")
        self.assertEqual(updated_model.status, "suspended")
        
        # Verify response data
        self.assertEqual(response_data["data"]["name"], "Updated Model Name")
        self.assertEqual(response_data["data"]["status"], "suspended")

    # @patch("firebase_admin.app_check.verify_token")
    # def test_30_create_crag_model(self, mock_verify_app_check):
    #     """Test creating a crag model"""

    #     mock_verify_app_check.return_value = {"app_id": "test_app"}

    #     url = reverse("create_crag_model")
    #     data = {
    #         "user_id": self.test_user.user_id,
    #         "crag_id": self.test_crag.formatted_id,
    #         "name": "Test 3D Model Creation",
    #         "status": "active",
    #     }
    #     response = self.client.post(url, data, format="json")
    #     self.print_endpoint_result("CRAG MODEL - CREATE", url, response, data)

    #     self.assertEqual(response.get("Content-Type"), "application/json")
    #     response_data = response.json()
    #     self.assertIn("success", response_data)
    #     self.assertIn("message", response_data)

    #     if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
    #         self.assertTrue(
    #             response_data.get("success"),
    #             f"Expected success=True but got: {response_data}",
    #         )
    #         self.assertIn("data", response_data)
    #         model_data = response_data["data"]
    #         self.assertEqual(model_data["name"], "Test 3D Model Creation")
    #         self.assertEqual(model_data["status"], "active")
    #         self.assertEqual(model_data["user"]["user_id"], self.test_user.user_id)
    #         self.assertEqual(model_data["crag"]["crag_id"], self.test_crag.formatted_id)
    #     else:
    #         self.fail(
    #             f"CRAG MODEL CREATE failed with status {response.status_code}: {response_data.get('message', 'Unknown error')}"
    #         )

    @patch("firebase_admin.app_check.verify_token")
    def test_34_climb_log_create(self, mock_verify_app_check):

        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("create_climb_log")
        data = {
            "user_id": self.test_user.user_id,
            "route_id": self.test_route.formatted_id,
            "crag_id": self.test_crag.formatted_id,
            "date_climbed": date.today().isoformat(),
            "notes": "Great climb, challenging overhang",
        }
        response = self.client.post(url, data, format="json")
        self.print_endpoint_result("CLIMB LOG - CREATE", url, response, data)

        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response.json()
        self.assertIn("success", response_data)
        self.assertIn("message", response_data)

        if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            self.assertTrue(
                response_data.get("success"),
                f"Expected success=True but got: {response_data}",
            )
            self.assertIn("data", response_data)
            climb_log_data = response_data["data"]
            self.assertEqual(
                climb_log_data["notes"], "Great climb, challenging overhang"
            )
        else:
            self.fail(
                f"CLIMB LOG CREATE failed with status {response.status_code}: {response_data.get('message', 'Unknown error')}"
            )

    @patch("firebase_admin.app_check.verify_token")
    def test_35_climb_log_delete(self, mock_verify_app_check):

        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("delete_climb_log")
        data = {"log_id": self.test_log.formatted_id}
        response = self.client.delete(url, data, format="json")
        self.print_endpoint_result("CLIMB LOG - DELETE", url, response, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertEqual(
            response_data.get("message"), "Climb log deleted successfully."
        )

        self.assertFalse(ClimbLog.objects.filter(log_id=self.test_log.log_id).exists())

    @patch("firebase_admin.app_check.verify_token")
    def test_36_model_route_data_create(self, mock_verify_app_check):
        """Test creating model route data"""

        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("create_model_route_data")
        data = {
            "user_id": self.test_user.user_id,
            "model_id": self.test_crag_model.formatted_id,
            "route_id": self.test_route.formatted_id,
            "route_data": {
                "coordinates": [
                    {"x": 200, "y": 300, "z": 100},
                    {"x": 250, "y": 350, "z": 125},
                ],
                "difficulty": "5.11a",
                "holds": [
                    {"type": "pinch", "position": {"x": 220, "y": 320}},
                    {"type": "sloper", "position": {"x": 280, "y": 380}},
                ],
                "description": "New technical route with challenging holds",
            },
            "status": "active",
        }
        response = self.client.post(url, data, format="json")
        self.print_endpoint_result("MODEL ROUTE DATA - CREATE", url, response, data)

        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response.json()
        self.assertIn("success", response_data)
        self.assertIn("message", response_data)

        if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            self.assertTrue(
                response_data.get("success"),
                f"Expected success=True but got: {response_data}",
            )
            self.assertIn("data", response_data)
            route_data = response_data["data"]
            self.assertEqual(route_data["route_data"]["difficulty"], "5.11a")
            self.assertEqual(route_data["status"], "active")
            self.assertEqual(route_data["user"]["user_id"], self.test_user.user_id)
        else:
            self.fail(
                f"MODEL ROUTE DATA CREATE failed with status {response.status_code}: {response_data.get('message', 'Unknown error')}"
            )

    @patch("firebase_admin.app_check.verify_token")
    def test_37_model_route_data_get_by_model_id(self, mock_verify_app_check):
        """Test getting model route data by model ID"""

        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("get_model_route_data_by_model_id")
        params = {"model_id": self.test_crag_model.formatted_id}
        response = self.client.get(url, params)
        self.print_endpoint_result(
            "MODEL ROUTE DATA - GET BY MODEL ID", url, response, params
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)
        self.assertIsInstance(response_data["data"], list)

        # Check if our test data is in the response
        if response_data["data"]:
            route_data_item = response_data["data"][0]
            self.assertEqual(
                route_data_item["model"]["model_id"], self.test_crag_model.formatted_id
            )
            self.assertEqual(
                route_data_item["route"]["route_id"], self.test_route.formatted_id
            )
            self.assertEqual(route_data_item["user"]["user_id"], self.test_user.user_id)
            self.assertIn("route_data", route_data_item)
            self.assertIn("coordinates", route_data_item["route_data"])
            self.assertEqual(route_data_item["route_data"]["difficulty"], "5.10a")

    @patch("firebase_admin.app_check.verify_token")
    def test_38_model_route_data_delete(self, mock_verify_app_check):
        """Test deleting model route data"""

        mock_verify_app_check.return_value = {"app_id": "test_app"}

        # Create a route data to delete
        route_data_to_delete = ModelRouteData.objects.create(
            model=self.test_crag_model,
            user=self.test_user,
            route=self.test_route,
            route_data={"test": "data to delete"},
            status="active",
        )

        url = reverse("delete_model_route_data")
        data = {"route_data_id": route_data_to_delete.formatted_id}
        response = self.client.delete(url, data, format="json")
        self.print_endpoint_result("MODEL ROUTE DATA - DELETE", url, response, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertEqual(
            response_data.get("message"), "Model route data deleted successfully."
        )

        # Verify it's actually deleted
        self.assertFalse(
            ModelRouteData.objects.filter(
                model_route_data_id=route_data_to_delete.model_route_data_id
            ).exists()
        )

    @patch("firebase_admin.app_check.verify_token")
    def test_39_model_route_data_get_by_user_id(self, mock_verify_app_check):
        """Test getting model route data by user ID"""

        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("get_model_route_data_by_user_id")
        params = {"user_id": self.test_user.user_id}
        response = self.client.get(url, params)
        self.print_endpoint_result(
            "MODEL ROUTE DATA - GET BY USER ID", url, response, params
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)
        self.assertIsInstance(response_data["data"], list)

        # Check if our test data is in the response
        if response_data["data"]:
            route_data_item = response_data["data"][0]
            self.assertEqual(route_data_item["user"]["user_id"], self.test_user.user_id)
            self.assertIn("route_data", route_data_item)
            self.assertIn("model", route_data_item)
            self.assertIn("route", route_data_item)

    @patch("firebase_admin.app_check.verify_token")
    def test_40_crag_get_all_ids(self, mock_verify_app_check):
        """Test getting all crag IDs"""
        
        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("get_all_crag_ids")
        response = self.client.get(url)
        self.print_endpoint_result("CRAG - GET ALL IDS", url, response)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)
        self.assertIsInstance(response_data["data"], list)
        
        # Check if our test crag is in the response
        if response_data["data"]:
            crag_item = response_data["data"][0]
            # Verify only selected fields are present
            expected_fields = ["crag_id", "name", "location_details"]
            for field in expected_fields:
                self.assertIn(field, crag_item)
            
            # Verify the format of crag_id
            self.assertTrue(crag_item["crag_id"].startswith("CRAG-"))
            
            # Verify data types
            self.assertIsInstance(crag_item["location_details"], dict)
            
            # Check if our test crag is included
            crag_ids = [item["crag_id"] for item in response_data["data"]]
            self.assertIn(self.test_crag.formatted_id, crag_ids)


# # -------------------
# # CREATING_01 (start)
# # -------------------

# class CreateCragViewTestCase(TestCase):
#     def setUp(self):
#         self.url = reverse("create_crag")

#     def _pretty(self, resp):
#         try:
#             print(json.dumps(resp.json(), indent=2))
#         except Exception:
#             print("(non-json)", getattr(resp, "content", b"")[:200])

#     @patch("MyApp.Boundary.crag_boundary.authenticate_app_check_token")
#     def test_unauthorized(self, mock_auth):
#         mock_auth.return_value = {"success": False, "message": "Invalid token."}
#         resp = self.client.post(
#             self.url,
#             {"name": "Bukit Takun", "location_lat": 3.288, "location_lon": 101.650},
#             content_type="application/json",
#         )
#         self._pretty(resp)
#         self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
#         self.assertFalse(resp.json().get("success"))

#     @patch("MyApp.Boundary.crag_boundary.authenticate_app_check_token")
#     def test_missing_fields(self, mock_auth):
#         mock_auth.return_value = {"success": True}
#         resp = self.client.post(
#             self.url,
#             {"location_lat": 3.288, "location_lon": 101.650},  # name missing
#             content_type="application/json",
#         )
#         self._pretty(resp)
#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
#         body = resp.json()
#         self.assertFalse(body["success"])
#         self.assertIn("name", body["errors"])

#     @patch("MyApp.Boundary.crag_boundary.authenticate_app_check_token")
#     def test_success(self, mock_auth):
#         mock_auth.return_value = {"success": True}
#         payload = {
#             "name": "Bukit Takun",
#             "location_lat": 3.288,
#             "location_lon": 101.650,
#             "description": "A beautiful limestone crag with multi-pitch routes.",
#         }
#         resp = self.client.post(self.url, payload, content_type="application/json")
#         self._pretty(resp)
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)

#         body = resp.json()
#         self.assertTrue(body["success"])
#         self.assertEqual(body["message"], "Crag created successfully")

#         # row exists
#         self.assertEqual(Crag.objects.count(), 1)
#         crag = Crag.objects.first()
#         self.assertEqual(crag.name, payload["name"])

#         # shape matches CURRENT serializer (no additions)
#         data = body["data"]
#         for key in ["crag_id", "name", "location_lat", "location_lon", "description", "images_urls"]:
#             self.assertIn(key, data)

#         # optional: location_details if your model provides it
#         # if "location_details" in data:  # keep flexible
#         #     self.assertIsInstance(data["location_details"], (dict, list))

# # -----------------
# # CREATING_01 (end)
# # -----------------



# # -------------------
# # CREATING_02 (start)
# # -------------------

# import uuid

# class CreateClimbLogViewTestCase(TestCase):
#     def setUp(self):
#         # Create a minimal valid User for your current model fields
#         self.user = User.objects.create(
#             # keep your external string id if your model has it; if not, this is harmless
#             user_id=str(uuid.uuid4()),
#             username="jen",
#             email="jen@example.com",
#             profile_picture=None,
#             status=True,
#         )

#         # Simple crag + route so the route FK exists
#         self.crag = Crag.objects.create(
#             name="Bukit Takun",
#             location_lat=3.288,
#             location_lon=101.65,
#             description="test",
#         )
#         self.route = Route.objects.create(
#             crag=self.crag,
#             route_name="Classic",
#             route_grade=6,
#             # status="active",
#         )

#         self.url = reverse("create_climb_log")

#     def _pretty(self, resp):
#         try:
#             print(json.dumps(resp.json(), indent=2))
#         except Exception:
#             print("(non-JSON):", getattr(resp, "content", b"")[:200])

#     @patch("MyApp.Boundary.climblog_boundary.authenticate_app_check_token")
#     def test_success(self, mock_auth):
#         mock_auth.return_value = {"success": True}
#         payload = {
#             # IMPORTANT: pass the integer PK for user_id
#             "user_id": self.user.user_id,
#             # Route id can be formatted or raw int – formatted is fine
#             "route_id": self.route.formatted_id,
#             "date_climbed": "2025-10-29",
#             "notes": "Onsight",
#         }
#         resp = self.client.post(self.url, payload, content_type="application/json")
#         self._pretty(resp)
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertTrue(resp.json().get("success"))
#         self.assertEqual(resp.json()["data"]["route"]["route_id"], self.route.formatted_id)

#     @patch("MyApp.Boundary.climblog_boundary.authenticate_app_check_token")
#     def test_missing_fields(self, mock_auth):
#         mock_auth.return_value = {"success": True}
#         payload = {
#             "user_id": self.user.user_id,
#             # route_id missing on purpose
#             "date_climbed": "2025-10-29",
#         }
#         resp = self.client.post(self.url, payload, content_type="application/json")
#         self._pretty(resp)
#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
#         self.assertFalse(resp.json().get("success"))
#         self.assertIn("route_id", resp.json()["errors"])

#     @patch("MyApp.Boundary.climblog_boundary.authenticate_app_check_token")
#     def test_unauthorized(self, mock_auth):
#         mock_auth.return_value = {"success": False, "message": "Invalid token."}
#         payload = {
#             "user_id": self.user.user_id,
#             "route_id": self.route.formatted_id,
#             "date_climbed": "2025-10-29",
#         }
#         resp = self.client.post(self.url, payload, content_type="application/json")
#         self._pretty(resp)
#         self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

# # -----------------
# # CREATING_02 (end)
# # -----------------



# # -------------------
# # CREATING_03 (start)
# # -------------------

# import uuid

# class CreateRouteTestCase(TestCase):
#     def setUp(self):
#         self.url = reverse("create_route")

#         # seed user (not actually needed by endpoint body, but keeps parity with others)
#         self.user = User.objects.create(
#             user_id=str(uuid.uuid4()),
#             username="maker",
#             email="maker@example.com",
#             status=True,
#             profile_picture=None,
#         )

#         # seed crag
#         self.crag = Crag.objects.create(
#             name="Bukit Takun",
#             location_lat=3.288,
#             location_lon=101.65,
#             description="demo crag",
#             # location_details={"city": None, "country": None},
#         )

#     def _pretty(self, resp):
#         try:
#             print(json.dumps(resp.json(), indent=2))
#         except Exception:
#             print("(non-JSON)", getattr(resp, "content", b"")[:200])

#     @patch("MyApp.Boundary.route_boundary.authenticate_app_check_token")
#     def test_missing_fields(self, mock_appcheck):
#         mock_appcheck.return_value = {"success": True}
#         resp = self.client.post(self.url, data={"route_name": "Classic"}, content_type="application/json")
#         self._pretty(resp)
#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
#         self.assertIn("route_grade", resp.json().get("errors", {}))
#         self.assertIn("crag_id", resp.json().get("errors", {}))

#     @patch("MyApp.Boundary.route_boundary.authenticate_app_check_token")
#     def test_success(self, mock_appcheck):
#         mock_appcheck.return_value = {"success": True}
#         payload = {
#             "route_name": "Classic",
#             "route_grade": 6,
#             "crag_id": self.crag.formatted_id,  # "CRAG-00000X" works via serializer
#         }
#         resp = self.client.post(self.url, data=payload, content_type="application/json")
#         self._pretty(resp)
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         body = resp.json()
#         self.assertTrue(body["success"])
#         self.assertEqual(body["message"], "Route created successfully")
#         self.assertEqual(body["data"]["route_name"], "Classic")
#         self.assertEqual(body["data"]["route_grade"], 6)
#         self.assertTrue(body["data"]["route_id"].startswith("ROUTE-"))

#     @patch("MyApp.Boundary.route_boundary.authenticate_app_check_token")
#     def test_unauthorized(self, mock_appcheck):
#         mock_appcheck.return_value = {"success": False, "message": "Invalid token."}
#         payload = {"route_name": "Classic", "route_grade": 6, "crag_id": self.crag.pk}
#         resp = self.client.post(self.url, data=payload, content_type="application/json")
#         self._pretty(resp)
#         self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

# # -----------------
# # CREATING_03 (end)
# # -----------------



# # ------------------
# # DEELETE_01 (start)
# # ------------------

# from datetime import date


# class DeleteClimbLogViewTestCase(TestCase):
#     def setUp(self):
#         # minimal entities to own a log
#         self.user = User.objects.create(
#             user_id="u-1",
#             username="jen",
#             email="jen@example.com",
#             profile_picture=None,
#             status=True,
#         )
#         self.crag = Crag.objects.create(
#             name="Bukit Takun",
#             location_lat=3.288,
#             location_lon=101.65,
#             description="demo",
#         )
#         self.route = Route.objects.create(
#             route_name="Classic",
#             route_grade=6,
#             crag=self.crag,
#         )
#         self.log = ClimbLog.objects.create(
#             user=self.user,
#             route=self.route,
#             date_climbed=date(2025, 10, 29),
#             notes="demo",
#         )

#         # url name you added in climb_log_url.py
#         self.url = reverse("delete_climb_log")

#     def _pretty(self, resp):
#         try:
#             import json
#             print(json.dumps(resp.json(), indent=2))
#         except Exception:
#             print("(non-JSON)", getattr(resp, "content", b"")[:200])

#     @patch("MyApp.Boundary.climblog_boundary.authenticate_app_check_token")
#     def test_success_with_formatted_id(self, mock_appcheck):
#         mock_appcheck.return_value = {"success": True}

#         # accept formatted like "CLIMBLOG-000001"
#         resp = self.client.delete(f"{self.url}?log_id={self.log.formatted_id}")
#         self._pretty(resp)

#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertTrue(resp.json().get("success"))
#         self.assertFalse(ClimbLog.objects.filter(pk=self.log.pk).exists())

#     @patch("MyApp.Boundary.climblog_boundary.authenticate_app_check_token")
#     def test_bad_request_missing_id(self, mock_appcheck):
#         mock_appcheck.return_value = {"success": True}

#         resp = self.client.delete(self.url)  # no query param
#         self._pretty(resp)

#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
#         self.assertFalse(resp.json().get("success"))

#     @patch("MyApp.Boundary.climblog_boundary.authenticate_app_check_token")
#     def test_not_found(self, mock_appcheck):
#         mock_appcheck.return_value = {"success": True}

#         # id that does not exist
#         resp = self.client.delete(f"{self.url}?log_id=CLIMBLOG-999999")
#         self._pretty(resp)

#         self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

#     @patch("MyApp.Boundary.climblog_boundary.authenticate_app_check_token")
#     def test_unauthorized(self, mock_appcheck):
#         mock_appcheck.return_value = {"success": False, "message": "Invalid token."}

#         resp = self.client.delete(f"{self.url}?log_id={self.log.pk}")
#         self._pretty(resp)

#         self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

# # ---------------
# # DELETE_01 (end)
# # ---------------



# # -----------------
# # DELETE_02 (start)
# # -----------------

# class DeleteRouteViewTestCase(TestCase):
#     def setUp(self):
#         self.url = reverse("delete_route")

#         self.user = User.objects.create(
#             user_id=str(uuid.uuid4()),
#             username="tester",
#             email="tester@example.com",
#             status=True,
#             profile_picture=None,
#         )
#         self.crag = Crag.objects.create(
#             name="Bukit Takun",
#             location_lat=3.288,
#             location_lon=101.65,
#             description="test",
#         )
#         self.route = Route.objects.create(
#             route_name="Classic",
#             route_grade=6,
#             crag=self.crag,
#         )

#     def _pretty(self, resp):
#         try:
#             import json; print(json.dumps(resp.json(), indent=2))
#         except Exception:
#             print(getattr(resp, "content", b"")[:200])

#     @patch("MyApp.Boundary.route_boundary.authenticate_app_check_token")
#     def test_missing_fields(self, mock_appcheck):
#         mock_appcheck.return_value = {"success": True}
#         # no route_id anywhere
#         resp = self.client.delete(self.url)
#         self._pretty(resp)
#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
#         self.assertIn("route_id", resp.json().get("errors", {}))

#     @patch("MyApp.Boundary.route_boundary.authenticate_app_check_token")
#     def test_not_found(self, mock_appcheck):
#         mock_appcheck.return_value = {"success": True}
#         # send as query param to avoid body parsing ambiguity
#         resp = self.client.delete(f"{self.url}?route_id=ROUTE-999999")
#         self._pretty(resp)
#         self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

#     @patch("MyApp.Boundary.route_boundary.authenticate_app_check_token")
#     def test_success(self, mock_appcheck):
#         mock_appcheck.return_value = {"success": True}
#         rid = f"ROUTE-{self.route.pk:06d}"   # <-- use pk, not id
#         resp = self.client.delete(f"{self.url}?route_id={rid}")
#         self._pretty(resp)
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertTrue(resp.json().get("success"))

#     @patch("MyApp.Boundary.route_boundary.authenticate_app_check_token")
#     def test_unauthorized(self, mock_appcheck):
#         mock_appcheck.return_value = {"success": False, "message": "Invalid token."}
#         rid = f"ROUTE-{self.route.pk:06d}"   # <-- use pk, not id
#         resp = self.client.delete(f"{self.url}?route_id={rid}")
#         self._pretty(resp)
#         self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

# # ---------------
# # DELETE_02 (end)
# # ---------------



# # -----------------
# # DELETE_03 (start)
# # -----------------

# from unittest import mock
# from django.urls import reverse
# from rest_framework import status
# from rest_framework.test import APITestCase

# from MyApp.Entity.user import User
# from MyApp.Entity.post import Post
# # from MyApp.Entity.crag import Crag  # not needed here; you can remove

# class DeletePostViewTestCase(APITestCase):
#     def setUp(self):
#         # two users
#         self.owner = User.objects.create(
#             user_id="11111111-1111-1111-1111-111111111111",
#             username="owner",
#             email="owner@example.com",
#             status=True,
#         )
#         self.other = User.objects.create(
#             user_id="22222222-2222-2222-2222-222222222222",
#             username="other",
#             email="other@example.com",
#             status=True,
#         )
#         # a post by owner
#         self.post = Post.objects.create(
#             user=self.owner, title="Hello", content="World", tags=[]
#         )
#         self.url = reverse("delete_post")

#     def _auth_ok(self, m_verify):
#         m_verify.return_value = {"success": True, "message": "OK"}

#     def _formatted_post_id(self, post_pk: int) -> str:
#         return f"POST-{post_pk:06d}"

#     @mock.patch("MyApp.Firebase.helpers.verify_app_check_token")
#     def test_missing_fields(self, m_verify):
#         self._auth_ok(m_verify)
#         resp = self.client.delete(self.url, data={}, format="json",
#                                   HTTP_X_FIREBASE_APPCHECK="t")
#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
#         body = resp.json()
#         self.assertFalse(body["success"])
#         # Both fields should be flagged
#         self.assertIn("post_id", body.get("errors", {}))
#         self.assertIn("user_id", body.get("errors", {}))

#     @mock.patch("MyApp.Firebase.helpers.verify_app_check_token")
#     def test_not_found(self, m_verify):
#         self._auth_ok(m_verify)
#         payload = {"post_id": "POST-999999", "user_id": self.owner.user_id}
#         resp = self.client.delete(self.url, data=payload, format="json",
#                                   HTTP_X_FIREBASE_APPCHECK="t")
#         self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
#         self.assertFalse(resp.json()["success"])

#     @mock.patch("MyApp.Firebase.helpers.verify_app_check_token")
#     def test_forbidden_not_owner(self, m_verify):
#         self._auth_ok(m_verify)
#         payload = {
#             "post_id": self._formatted_post_id(self.post.pk),
#             "user_id": self.other.user_id,
#         }
#         resp = self.client.delete(self.url, data=payload, format="json",
#                                   HTTP_X_FIREBASE_APPCHECK="t")
#         self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
#         self.assertFalse(resp.json()["success"])

#     @mock.patch("MyApp.Firebase.helpers.verify_app_check_token")
#     def test_success(self, m_verify):
#         self._auth_ok(m_verify)
#         payload = {
#             "post_id": self._formatted_post_id(self.post.pk),
#             "user_id": self.owner.user_id,
#         }
#         # Pre-check exists
#         self.assertTrue(Post.objects.filter(pk=self.post.pk).exists())
#         resp = self.client.delete(self.url, data=payload, format="json",
#                                   HTTP_X_FIREBASE_APPCHECK="t")
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertTrue(resp.json()["success"])
#         # Post should be gone
#         self.assertFalse(Post.objects.filter(pk=self.post.pk).exists())

#     def test_unauthorized(self):
#         # No App Check header -> 401 (helper returns missing token)
#         payload = {
#             "post_id": self._formatted_post_id(self.post.pk),
#             "user_id": self.owner.user_id,
#         }
#         resp = self.client.delete(self.url, data=payload, format="json")
#         self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
#         self.assertFalse(resp.json()["success"])

# # ---------------
# # DELETE_03 (end)
# # ---------------



# # ---------------
# # USER_02 (start)
# # ---------------

# from unittest.mock import patch
# from rest_framework import status
# from rest_framework.test import APITestCase
# from MyApp.Entity.user import User

# class DeleteUserAccountViewTestCase(APITestCase):

#     @patch("MyApp.Utils.helper.authenticate_app_check_token")
#     @patch("MyApp.Utils.helper.verify_id_token")
#     def test_success(self, mock_verify, mock_auth):
#         mock_auth.return_value = {"success": True}
#         mock_verify.return_value = {"success": True, "uid": "USER123"}
#         User.objects.create(user_id="USER123", username="testuser", email="test@example.com")

#         resp = self.client.delete("/user/delete", {"id_token": "validtoken"}, format="json")
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertTrue(resp.data["success"])

#     @patch("MyApp.Utils.helper.authenticate_app_check_token")
#     def test_missing_field(self, mock_auth):
#         mock_auth.return_value = {"success": True}
#         resp = self.client.delete("/user/delete", {}, format="json")
#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

#     @patch("MyApp.Utils.helper.authenticate_app_check_token")
#     @patch("MyApp.Utils.helper.verify_id_token")
#     def test_not_found(self, mock_verify, mock_auth):
#         mock_auth.return_value = {"success": True}
#         mock_verify.return_value = {"success": True, "uid": "NON_EXISTENT"}
#         resp = self.client.delete("/user/delete", {"id_token": "token"}, format="json")
#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
#         self.assertFalse(resp.data["success"])

#     @patch("MyApp.Utils.helper.authenticate_app_check_token")
#     def test_unauthorized_appcheck(self, mock_auth):
#         mock_auth.return_value = {"success": False, "message": "Invalid app check token"}
#         resp = self.client.delete("/user/delete", {"id_token": "token"}, format="json")
#         self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

#     @patch("MyApp.Utils.helper.authenticate_app_check_token")
#     @patch("MyApp.Utils.helper.verify_id_token")
#     def test_invalid_id_token(self, mock_verify, mock_auth):
#         mock_auth.return_value = {"success": True}
#         mock_verify.return_value = {"success": False, "message": "Invalid token"}
#         resp = self.client.delete("/user/delete", {"id_token": "badtoken"}, format="json")
#         self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

#     @patch("MyApp.Utils.helper.authenticate_app_check_token")
#     @patch("MyApp.Utils.helper.verify_id_token")
#     def test_success_with_query_param(self, mock_verify, mock_auth):
#         mock_auth.return_value = {"success": True}
#         mock_verify.return_value = {"success": True, "uid": "USER123"}
#         User.objects.create(user_id="USER123", username="queryuser", email="query@example.com")

#         # Call using query parameter instead of JSON body
#         resp = self.client.delete("/user/delete?id_token=validtoken")

#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertTrue(resp.data["success"])
#         self.assertFalse(User.objects.filter(pk="USER123").exists())

# # -------------
# # USER_02 (end)
# # -------------



# # ---------------
# # USER_03 (start) 
# # ---------------

# from unittest.mock import patch
# from django.test import TestCase
# from rest_framework.test import APIClient
# from rest_framework import status

# from MyApp.Entity.user import User

# USER_PATH = "/user/update"

# class UpdateUserInfoViewTestCase(TestCase):
#     def setUp(self):
#         self.client = APIClient()
#         self.user = User.objects.create(
#             user_id="UID-1",
#             username="jen",
#             email="jen@example.com",
#             status=True,
#         )

#     # Happy path
#     @patch("MyApp.Boundary.user_boundary.helper.verify_user_id", return_value={"success": True, "user_id": "UID-1"})
#     @patch("MyApp.Boundary.user_boundary.helper.authenticate_app_check_token", return_value={"success": True})
#     def test_success_update_username(self, *_):
#         resp = self.client.post(
#             USER_PATH,
#             {"id_token": "token", "field": "username", "data": "jen_new"},
#             format="json",
#         )
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         body = resp.json()
#         self.assertTrue(body["success"])
#         self.assertEqual(body["data"]["username"], "jen_new")

#     # Invalid field name
#     @patch("MyApp.Boundary.user_boundary.helper.verify_user_id", return_value={"success": True, "user_id": "UID-1"})
#     @patch("MyApp.Boundary.user_boundary.helper.authenticate_app_check_token", return_value={"success": True})
#     def test_invalid_field_name(self, *_):
#         resp = self.client.post(
#             USER_PATH,
#             {"id_token": "token", "field": "bad_field", "data": "x"},
#             format="json",
#         )
#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
#         self.assertFalse(resp.json()["success"])

#     # Missing required fields
#     @patch("MyApp.Boundary.user_boundary.helper.authenticate_app_check_token", return_value={"success": True})
#     def test_missing_fields(self, *_):
#         resp = self.client.post(USER_PATH, {}, format="json")
#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
#         j = resp.json()
#         self.assertIn("id_token", j["errors"])
#         self.assertIn("field", j["errors"])
#         self.assertIn("data", j["errors"])

#     # Unauthorized: bad id_token
#     @patch("MyApp.Boundary.user_boundary.helper.verify_user_id", return_value={"success": False})
#     @patch("MyApp.Boundary.user_boundary.helper.authenticate_app_check_token", return_value={"success": True})
#     def test_unauthorized_bad_token(self, *_):
#         resp = self.client.post(
#             USER_PATH,
#             {"id_token": "bad", "field": "username", "data": "x"},
#             format="json",
#         )
#         self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

#     # App Check failed
#     @patch("MyApp.Boundary.user_boundary.helper.authenticate_app_check_token", return_value={"success": False, "message": "Invalid token."})
#     def test_app_check_failed(self, *_):
#         resp = self.client.post(
#             USER_PATH,
#             {"id_token": "token", "field": "username", "data": "x"},
#             format="json",
#         )
#         self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

# # -------------
# # USER_03 (end)
# # -------------



    @patch("firebase_admin.app_check.verify_token")
    def test_40_user_update(self, mock_verify_app_check):
        """Test updating user information"""
        
        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("update_user")
        data = {
            "user_id": self.test_user.user_id,
            "username": "updated_username",
            "email": "updated@example.com"
        }
        response = self.client.put(url, data, format="json")
        self.print_endpoint_result("USER - UPDATE", url, response, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)

    @patch("firebase_admin.app_check.verify_token")
    def test_41_post_delete(self, mock_verify_app_check):
        """Test deleting a post"""
        
        mock_verify_app_check.return_value = {"app_id": "test_app"}

        # Create a post to delete
        post_to_delete = Post.objects.create(
            user=self.test_user,
            content="Post to be deleted",
            title="Delete Test",
            tags=["delete", "test"],
            status="active",
        )

        url = reverse("delete_post")
        data = {"post_id": post_to_delete.formatted_id}
        response = self.client.delete(url, data, format="json")
        self.print_endpoint_result("POST - DELETE", url, response, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response.json()
        self.assertTrue(response_data.get("success"))

        # Verify post is deleted
        self.assertFalse(
            Post.objects.filter(post_id=post_to_delete.post_id).exists()
        )

    @patch("firebase_admin.app_check.verify_token")
    def test_42_crag_create(self, mock_verify_app_check):
        """Test creating a new crag"""
        
        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("create_crag")
        data = {
            "name": "New Test Crag",
            "location_lat": 35.6762,
            "location_lon": 139.6503,
            "description": "A new climbing crag for testing",
            "user_id": self.test_user.user_id,
        }
        response = self.client.post(url, data, format="json")
        self.print_endpoint_result("CRAG - CREATE", url, response, data)

        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response.json()
        self.assertIn("success", response_data)
        self.assertIn("message", response_data)

        if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            self.assertTrue(
                response_data.get("success"),
                f"Expected success=True but got: {response_data}",
            )
            self.assertIn("data", response_data)
            crag_data = response_data["data"]
            self.assertEqual(crag_data["name"], "New Test Crag")
            self.assertEqual(crag_data["location_lat"], 35.6762)
            self.assertEqual(crag_data["location_lon"], 139.6503)
        else:
            self.fail(
                f"CRAG CREATE failed with status {response.status_code}: {response_data.get('message', 'Unknown error')}"
            )

    @patch("firebase_admin.app_check.verify_token")
    def test_42b_crag_delete(self, mock_verify_app_check):
        """Test deleting a crag"""
        
        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("delete_crag")
        data = {"crag_id": self.test_crag.formatted_id}
        response = self.client.delete(url, data, format="json")
        self.print_endpoint_result("CRAG - DELETE", url, response, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertEqual(response_data.get("message"), "Crag deleted successfully.")

    @patch("firebase_admin.app_check.verify_token")
    def test_43_user_get_user_by_id(self, mock_verify_app_check):
        """Test getting user by ID"""
        
        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("get_user_by_id")
        data = {"user_id": self.test_user.user_id}
        response = self.client.post(url, data, format="json")
        self.print_endpoint_result("USER - GET USER BY ID", url, response, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)
        user_data = response_data["data"]
        self.assertEqual(user_data["user_id"], self.test_user.user_id)
        self.assertEqual(user_data["username"], self.test_user.username)
        self.assertEqual(user_data["email"], self.test_user.email)

    @patch("firebase_admin.app_check.verify_token")
    def test_44_search_users(self, mock_verify_app_check):
        """Test searching users"""
        
        mock_verify_app_check.return_value = {"app_id": "test_app"}

        # Create additional test users for search
        User.objects.create(
            user_id="search_user_1",
            username="climber_john",
            email="john@climbing.com",
            status=True,
        )
        User.objects.create(
            user_id="search_user_2", 
            username="boulder_sarah",
            email="sarah@bouldering.net",
            status=True,
        )

        url = reverse("search_users")
        params = {"query": "climb", "limit": 5}
        response = self.client.get(url, params)
        self.print_endpoint_result("SEARCH - USERS", url, response, params)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)
        self.assertIsInstance(response_data["data"], list)

    @patch("firebase_admin.app_check.verify_token")
    def test_45_search_posts(self, mock_verify_app_check):
        """Test searching posts"""
        
        mock_verify_app_check.return_value = {"app_id": "test_app"}

        # Create additional test posts for search
        Post.objects.create(
            user=self.test_user,
            title="Best Climbing Techniques",
            content="Learn essential climbing techniques for beginners",
            tags=["climbing", "techniques", "beginner"],
            status="active",
        )
        Post.objects.create(
            user=self.test_user,
            title="Bouldering Guide",
            content="Complete guide to bouldering for all skill levels",
            tags=["bouldering", "guide", "training"],
            status="active",
        )

        url = reverse("search_posts")
        params = {"query": "climbing", "limit": 5}
        response = self.client.get(url, params)
        self.print_endpoint_result("SEARCH - POSTS", url, response, params)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)
        self.assertIsInstance(response_data["data"], list)

    @patch("firebase_admin.app_check.verify_token")
    def test_46_search_crags(self, mock_verify_app_check):
        """Test searching crags"""
        
        mock_verify_app_check.return_value = {"app_id": "test_app"}

        # Create additional test crags for search
        Crag.objects.create(
            name="Red Rock Canyon",
            location_lat=36.1349,
            location_lon=-115.4194,
            description="Famous sandstone climbing area with excellent sport routes",
            user=self.test_user,
        )
        Crag.objects.create(
            name="Joshua Tree",
            location_lat=33.8734,
            location_lon=-115.9010,
            description="World-class bouldering destination in California desert",
            user=self.test_user,
        )

        url = reverse("search_crags")
        params = {"query": "rock", "limit": 5}
        response = self.client.get(url, params)
        self.print_endpoint_result("SEARCH - CRAGS", url, response, params)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)
        self.assertIsInstance(response_data["data"], list)

    @patch("firebase_admin.app_check.verify_token")
    def test_47_get_crags_by_user_id(self, mock_verify_app_check):
        """Test getting crags by user ID"""
        
        mock_verify_app_check.return_value = {"app_id": "test_app"}

        # Create additional crags for the test user
        Crag.objects.create(
            name="User's First Crag",
            location_lat=40.7589,
            location_lon=-73.9851,
            description="A crag created by the test user",
            user=self.test_user,
        )
        Crag.objects.create(
            name="User's Second Crag", 
            location_lat=34.0522,
            location_lon=-118.2437,
            description="Another crag by the same user",
            user=self.test_user,
        )

        url = reverse("get_crags_by_user_id")
        params = {"user_id": self.test_user.user_id}
        response = self.client.get(url, params)
        self.print_endpoint_result("CRAG - GET BY USER ID", url, response, params)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)
        self.assertIsInstance(response_data["data"], list)
        
        # Verify that returned crags belong to the test user
        if response_data["data"]:
            for crag in response_data["data"]:
                self.assertTrue(crag["crag_id"].startswith("CRAG-"))
                self.assertIn("name", crag)
                self.assertIn("location_lat", crag)
                self.assertIn("location_lon", crag)

    @patch("firebase_admin.app_check.verify_token")
    def test_48_search_posts_by_tags(self, mock_verify_app_check):
        """Test searching posts by specific tags"""
        
        mock_verify_app_check.return_value = {"app_id": "test_app"}

        # Create additional test posts with specific tags
        Post.objects.create(
            user=self.test_user,
            title="Advanced Bouldering Tips",
            content="Master advanced bouldering techniques and training methods",
            tags=["bouldering", "advanced", "training"],
            status="active",
        )
        Post.objects.create(
            user=self.test_user,
            title="Sport Climbing Safety",
            content="Essential safety tips for sport climbing outdoors",
            tags=["sport", "safety", "outdoor"],
            status="active",
        )

        url = reverse("search_posts_by_tags")
        data = {"tags": ["bouldering", "training"], "limit": 5}
        response = self.client.post(url, data, format="json")
        self.print_endpoint_result("SEARCH - POSTS BY TAGS", url, response, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Type"), "application/json")
        response_data = response.json()
        self.assertTrue(response_data.get("success"))
        self.assertIn("data", response_data)
        self.assertIsInstance(response_data["data"], list)
        
        # Verify that returned posts contain the searched tags
        for post in response_data["data"]:
            post_tags = [tag.lower() for tag in post["tags"]]
            has_matching_tag = any(tag in post_tags for tag in ["bouldering", "training"])
            self.assertTrue(has_matching_tag, f"Post should contain 'bouldering' or 'training' tag: {post['tags']}")
