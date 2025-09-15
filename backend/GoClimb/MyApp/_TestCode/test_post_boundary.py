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

        response = self.client.get(self.url, {"post_id": self.post.post_id})

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

        response = self.client.get(self.url, {"post_id": self.fake_post_id})

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

        response = self.client.get(self.url, {"post_id": self.post.post_id})

        response_json = response.json()
        pretty_json = json.dumps(response_json, indent=2, ensure_ascii=False)
        print(f"\n{self._testMethodName} ->\n{pretty_json}\n")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response_json.get("success"))
