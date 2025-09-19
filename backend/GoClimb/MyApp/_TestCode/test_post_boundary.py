from django.urls import reverse
from django.test import TestCase
from rest_framework import status
import uuid
import json
from unittest.mock import patch

from MyApp.Entity.user import User
from MyApp.Entity.post import Post


class GetPostViewTestCase(TestCase):
    def setUp(self):
        self.url = reverse("get_post")

        self.fake_post_id = 10

        self.user_id = str(uuid.uuid4())
        self.username = "testuser"
        self.email = self.username + "@example.com"
        self.user = User.objects.create(
            user_id=self.user_id,
            full_name=self.username,
            email=self.email,
            profile_picture="https://example.com/avatar.png",
            role="member",
            status=True,
        )

        self.post = Post.objects.create(
            user=self.user,
            content="My first post from the shell!",
            tags=["django", "orm", "example"],  # optional
            image_urls=["https://example.com/image1.png"],  # optional
            status="active",
        )

    @patch("MyApp.Boundary.post_boundary.authenticate_app_check_token")
    def test_get_post_unauthorize(self, mock_authenticate):
        mock_authenticate.return_value = {
            "success": False,
            "message": "Invalid token.",
        }

        response = self.client.get(self.url, {"post_id": f"POST-{self.post.post_id}"})

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response_json.get("success"))

    @patch("MyApp.Boundary.post_boundary.authenticate_app_check_token")
    def test_get_post_bad_request(self, mock_authenticate):
        mock_authenticate.return_value = {
            "success": True,
            "message": "Valid token.",
        }

        response = self.client.get(self.url)

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response_json.get("success"))

    @patch("MyApp.Boundary.post_boundary.authenticate_app_check_token")
    def test_get_post_not_found(self, mock_authenticate):
        mock_authenticate.return_value = {
            "success": True,
            "message": "Valid token.",
        }

        response = self.client.get(self.url, {"post_id": f"POST-{self.fake_post_id}"})

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(response_json.get("success"))

    @patch("MyApp.Boundary.post_boundary.authenticate_app_check_token")
    def test_get_post_success(self, mock_authenticate):
        mock_authenticate.return_value = {
            "success": True,
            "message": "Valid token.",
        }

        response = self.client.get(self.url, {"post_id": f"POST-{self.post.post_id}"})

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response_json.get("success"))


class GetRandomPostTestCase(TestCase):
    def setUp(self):
        self.url = reverse("get_random_post")
        self.user_array = []
        self.post_array = []
        for i in range(15):
            user = User.objects.create(
                user_id=str(uuid.uuid4()),
                full_name=f"user{i}",
                email=f"user{i}@example.com",
                profile_picture="https://example.com/avatar.png",
                role="member",
                status=True,
            )
            self.user_array.append(user)

        for i in range(50):
            post = Post.objects.create(
                user=self.user_array[i % 15],
                content="My first post from the shell!",
                tags=["django", "orm", "example"],  # optional
                image_urls=["https://example.com/image1.png"],  # optional
                status="active",
            )
            self.post_array.append(post)

    @patch("MyApp.Boundary.post_boundary.authenticate_app_check_token")
    def test_get_random_post_unauthorize(self, mock_authenticate):
        mock_authenticate.return_value = {
            "success": False,
            "message": "Invalid token.",
        }

        response = self.client.post(
            self.url,
            {"count": 5},
            content_type="application/json",
        )

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response_json.get("success"))

    @patch("MyApp.Boundary.post_boundary.authenticate_app_check_token")
    def test_get_random_post_bad_request(self, mock_authenticate):
        mock_authenticate.return_value = {
            "success": True,
            "message": "Valid token.",
        }

        response = self.client.post(
            self.url, {"count": -5}, content_type="application/json"
        )

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response_json.get("success"))

    @patch("MyApp.Boundary.post_boundary.authenticate_app_check_token")
    def test_get_random_post_success_nulled_blacklist(self, mock_authenticate):
        mock_authenticate.return_value = {
            "success": True,
            "message": "Valid token.",
        }

        response = self.client.post(
            self.url,
            {"count": 5},
            content_type="application/json",
        )

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response_json.get("success"))
        self.assertEqual(len(response_json.get("data", [])), 5)

    @patch("MyApp.Boundary.post_boundary.authenticate_app_check_token")
    def test_get_random_post_success(self, mock_authenticate):
        mock_authenticate.return_value = {
            "success": True,
            "message": "Valid token.",
        }

        blacklist = [f"POST-{p.post_id}" for p in self.post_array[:5]]

        response = self.client.post(
            self.url,
            {"count": 5, "blacklist": blacklist},  # <- pass the list directly
            content_type="application/json",  # ensure proper parsing
        )

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response_json.get("success"))
        self.assertEqual(len(response_json.get("data", [])), 5)

    @patch("MyApp.Boundary.post_boundary.authenticate_app_check_token")
    def test_get_random_post_bad_request_invalid_data_in_blacklist(
        self, mock_authenticate
    ):
        mock_authenticate.return_value = {
            "success": True,
            "message": "Valid token.",
        }

        response = self.client.post(
            self.url,
            {
                "count": 5,
                "blacklist": [f"POST{self.post_array[i].post_id}" for i in range(10)],
            },
            content_type="application/json",
        )

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response_json.get("success"))


class GetPostByUserIdTestCase(TestCase):
    def setUp(self):
        self.url = reverse("get_post_by_user_id")
        self.user_id = str(uuid.uuid4())
        self.post_array = []
        self.user = User.objects.create(
            user_id=self.user_id,
            full_name=f"user",
            email=f"user@example.com",
            profile_picture="https://example.com/avatar.png",
            role="member",
            status=True,
        )

        for i in range(50):
            post = Post.objects.create(
                user=self.user,
                content="My first post from the shell!",
                tags=["django", "orm", "example"],  # optional
                image_urls=["https://example.com/image1.png"],  # optional
                status="active",
            )
            self.post_array.append(post)

    @patch("MyApp.Boundary.post_boundary.authenticate_app_check_token")
    @patch("MyApp.Controller.post_controller.auth.verify_id_token")
    def test_get_post_by_user_id_success(self, mock_verify_id, mock_appcheck):
        mock_appcheck.return_value = {
            "success": True,
            "message": "Valid token.",
        }
        mock_verify_id.return_value = {
            "success": True,
            "uid": self.user_id,
        }
        response = self.client.post(
            self.url,
            {
                "id_token": "fake_token",
                "count": 5,
                "blacklist": [],
            },  # <- pass the list directly
            content_type="application/json",  # ensure proper parsing
        )

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response_json.get("success"))
        self.assertEqual(len(response_json.get("data", [])), 5)
