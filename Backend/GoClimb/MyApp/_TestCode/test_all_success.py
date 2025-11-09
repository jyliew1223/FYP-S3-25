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
    def test_28_crag_get_random(self, mock_verify_app_check):
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
    def test_29_get_crag_model_by_id(self, mock_verify_app_check):
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
    def test_30_create_crag_model(self, mock_verify_app_check):
        """Test creating a crag model"""

        mock_verify_app_check.return_value = {"app_id": "test_app"}

        url = reverse("create_crag_model")
        data = {
            "user_id": self.test_user.user_id,
            "crag_id": self.test_crag.formatted_id,
            "name": "Test 3D Model Creation",
            "status": "active",
        }
        response = self.client.post(url, data, format="json")
        self.print_endpoint_result("CRAG MODEL - CREATE", url, response, data)

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
            model_data = response_data["data"]
            self.assertEqual(model_data["name"], "Test 3D Model Creation")
            self.assertEqual(model_data["status"], "active")
            self.assertEqual(model_data["user"]["user_id"], self.test_user.user_id)
            self.assertEqual(model_data["crag"]["crag_id"], self.test_crag.formatted_id)
        else:
            self.fail(
                f"CRAG MODEL CREATE failed with status {response.status_code}: {response_data.get('message', 'Unknown error')}"
            )

    @patch("firebase_admin.app_check.verify_token")
    def test_31_climb_log_create(self, mock_verify_app_check):

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
    def test_32_climb_log_delete(self, mock_verify_app_check):

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
    def test_33_model_route_data_create(self, mock_verify_app_check):
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
    def test_34_model_route_data_get_by_model_id(self, mock_verify_app_check):
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
    def test_35_model_route_data_delete(self, mock_verify_app_check):
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
    def test_36_model_route_data_get_by_user_id(self, mock_verify_app_check):
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
    def test_38_crag_get_all_ids(self, mock_verify_app_check):
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
            self.assertIn("crag_id", crag_item)
            self.assertIn("name", crag_item)
            # Verify the format of crag_id
            self.assertTrue(crag_item["crag_id"].startswith("CRAG-"))
            # Check if our test crag is included
            crag_ids = [item["crag_id"] for item in response_data["data"]]
            self.assertIn(self.test_crag.formatted_id, crag_ids)