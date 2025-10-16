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


# # ------------------
# # ADMIN - 1 (start)
# # ------------------
# class DeletePostViewTestCase(TestCase):
#     def setUp(self):
#         self.url = reverse("post_delete")
#         # create a user + a post we can delete
#         self.user = User.objects.create(
#             user_id=str(uuid.uuid4()),
#             full_name="deleter",
#             email="deleter@example.com",
#             profile_picture="https://example.com/avatar.png",
#             role="admin",     # if your boundary enforces admin-only later
#             status=True,
#         )
#         self.post = Post.objects.create(
#             user=self.user,
#             content="To be deleted",
#             tags=["tmp"],
#             image_urls=[],
#             status="active",
#         )

#     @patch("MyApp.Boundary.post_boundary.authenticate_app_check_token")
#     def test_delete_unauthorized(self, mock_auth):
#         mock_auth.return_value = {"success": False, "message": "Invalid token."}

#         resp = self.client.delete(self.url, data={"post_id": self.post.post_id}, content_type="application/json")
#         payload = resp.json()
#         print(f"\n{self._testMethodName}\n{json.dumps(payload, indent=2)}\n")

#         self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
#         self.assertFalse(payload.get("success"))

#     @patch("MyApp.Boundary.post_boundary.authenticate_app_check_token")
#     def test_delete_missing_post_id(self, mock_auth):
#         mock_auth.return_value = {"success": True, "message": "Valid token."}

#         resp = self.client.delete(self.url, data={}, content_type="application/json")
#         payload = resp.json()
#         print(f"\n{self._testMethodName}\n{json.dumps(payload, indent=2)}\n")

#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
#         self.assertFalse(payload.get("success"))

#     @patch("MyApp.Boundary.post_boundary.authenticate_app_check_token")
#     def test_delete_invalid_post_id_format(self, mock_auth):
#         mock_auth.return_value = {"success": True, "message": "Valid token."}

#         resp = self.client.delete(self.url, data={"post_id": "NOT-A-NUMBER"}, content_type="application/json")
#         payload = resp.json()
#         print(f"\n{self._testMethodName}\n{json.dumps(payload, indent=2)}\n")

#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
#         self.assertFalse(payload.get("success"))

#     @patch("MyApp.Boundary.post_boundary.authenticate_app_check_token")
#     def test_delete_not_found(self, mock_auth):
#         mock_auth.return_value = {"success": True, "message": "Valid token."}

#         # assume no post with this ID
#         resp = self.client.delete(self.url, data={"post_id": 999999}, content_type="application/json")
#         payload = resp.json()
#         print(f"\n{self._testMethodName}\n{json.dumps(payload, indent=2)}\n")

#         # your boundary currently returns 400 for not found (keep consistent)
#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
#         self.assertFalse(payload.get("success"))

#     @patch("MyApp.Boundary.post_boundary.authenticate_app_check_token")
#     def test_delete_success_with_int_id(self, mock_auth):
#         mock_auth.return_value = {"success": True, "message": "Valid token.", "uid": self.user.user_id}

#         resp = self.client.delete(self.url, data={"post_id": self.post.post_id}, content_type="application/json")
#         payload = resp.json()
#         print(f"\n{self._testMethodName}\n{json.dumps(payload, indent=2)}\n")

#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertTrue(payload.get("success"))
#         self.assertEqual(payload.get("data", {}).get("post_id"), self.post.post_id)

#     @patch("MyApp.Boundary.post_boundary.authenticate_app_check_token")
#     def test_delete_success_with_prefixed_id(self, mock_auth):
#         """
#         Only passes if you applied the optional _parse_post_id() change above.
#         """
#         mock_auth.return_value = {"success": True, "message": "Valid token.", "uid": self.user.user_id}

#         resp = self.client.delete(self.url, data={"post_id": f"POST-{self.post.post_id}"}, content_type="application/json")
#         payload = resp.json()
#         print(f"\n{self._testMethodName}\n{json.dumps(payload, indent=2)}\n")

#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertTrue(payload.get("success"))
#         self.assertEqual(payload.get("data", {}).get("post_id"), self.post.post_id)
# # ----------------
# # ADMIN - 1 (end)
# # ----------------

# # -----------------
# # ADMIN - 4 (start)
# # -----------------
# class ViewMemberPostsTestCase(TestCase):
#     def setUp(self):
#         self.url = reverse("posts_by_member")
#         self.member = User.objects.create(
#             user_id="55",
#             full_name="Member A",
#             email="member55@example.com",
#             role="member",
#             status=True,
#         )
#         self.other = User.objects.create(
#             user_id="77",
#             full_name="Member B",
#             email="member77@example.com",
#             role="member",
#             status=True,
#         )

#     @patch("MyApp.Boundary.post_boundary.authenticate_app_check_token")
#     def test_unauthorized(self, mock_app):
#         mock_app.return_value = {"success": False, "message": "Invalid token."}
#         resp = self.client.get(self.url, {"member_id": "55"})
#         self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

#     @patch("MyApp.Boundary.post_boundary.authenticate_app_check_token")
#     def test_missing_member_id(self, mock_app):
#         mock_app.return_value = {"success": True}
#         resp = self.client.get(self.url)
#         print("\nmissing_member_id\n", json.dumps(resp.json(), indent=2))
#         self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
#         self.assertFalse(resp.json().get("success"))

#     @patch("MyApp.Boundary.post_boundary.authenticate_app_check_token")
#     def test_success_empty(self, mock_app):
#         mock_app.return_value = {"success": True}
#         # no posts for member yet
#         resp = self.client.get(self.url, {"member_id": "55"})
#         print("\nsuccess_empty\n", json.dumps(resp.json(), indent=2))
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertTrue(resp.json().get("success"))
#         self.assertEqual(len(resp.json()["data"]), 0)

#     @patch("MyApp.Boundary.post_boundary.authenticate_app_check_token")
#     def test_success_with_posts(self, mock_app):
#         mock_app.return_value = {"success": True}
#         # create 3 posts for 55 and 2 for 77
#         for i in range(3):
#             Post.objects.create(user=self.member, content=f"p{i}", image_urls=[f"https://img/{i}.png"], status="active")
#         for i in range(2):
#             Post.objects.create(user=self.other, content=f"x{i}", image_urls=[], status="active")

#         resp = self.client.get(self.url, {"member_id": "USER-55"})  # prefixed works
#         body = resp.json()
#         print("\nsuccess_with_posts\n", json.dumps(body, indent=2))
#         self.assertEqual(resp.status_code, status.HTTP_200_OK)
#         self.assertTrue(body.get("success"))
#         self.assertEqual(len(body["data"]), 3)
#         # each item has required keys
#         for item in body["data"]:
#             self.assertIn("post_id", item)
#             self.assertIn("media_url", item)
#             self.assertIn("caption", item)
# # ---------------
# # ADMIN - 4 (end)
# # ---------------

# ------------------
# MEMBER - 2 (start)
# ------------------
from unittest.mock import patch
from django.urls import reverse
from django.test import TestCase
from rest_framework import status
import uuid
import json

from MyApp.Entity.user import User
from MyApp.Entity.post import Post
from MyApp.Entity.post_likes import PostLike


class LikePostViewTestCase(TestCase):
    def setUp(self):
        # Endpoints by name (make sure you added these in post_url.py)
        self.like_url = reverse("like_post")
        self.unlike_url = reverse("unlike_post")
        self.count_url = reverse("post_likes_count")
        self.users_url = reverse("post_likes_users")

        # Create a user that will LIKE the post
        self.liker_id = str(uuid.uuid4())
        self.liker = User.objects.create(
            user_id=self.liker_id,
            full_name="Liker",
            email="liker@example.com",
            profile_picture=None,
            role="member",
            status=True,
        )

        # Create a different author + post
        self.author_id = str(uuid.uuid4())
        self.author = User.objects.create(
            user_id=self.author_id,
            full_name="Author",
            email="author@example.com",
            profile_picture=None,
            role="member",
            status=True,
        )
        self.post = Post.objects.create(
            user=self.author,
            content="Hello world",
            tags=["test"],
            image_urls=[],
            status="active",
        )

    # Helpers
    def _pretty(self, resp):
        try:
            print(json.dumps(resp.json(), indent=2))
        except Exception:
            print("(non-JSON response)", getattr(resp, "content", b"")[:200])

    @patch("MyApp.Boundary.post_boundary.authenticate_app_check_token")
    def test_like_unauthorized(self, mock_appcheck):
        mock_appcheck.return_value = {"success": False, "message": "Invalid token."}
        resp = self.client.post(
            self.like_url,
            {"id_token": "x", "post_id": self.post.formatted_id},
            content_type="application/json",
        )
        self._pretty(resp)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch("MyApp.Boundary.post_boundary.authenticate_app_check_token")
    def test_like_missing_id_token(self, mock_appcheck):
        mock_appcheck.return_value = {"success": True}
        resp = self.client.post(
            self.like_url, {"post_id": self.post.formatted_id}, content_type="application/json"
        )
        self._pretty(resp)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(resp.json().get("success"))

    @patch("MyApp.Boundary.post_boundary.authenticate_app_check_token")
    @patch("MyApp.Boundary.post_boundary.verify_id_token")
    def test_like_invalid_post_id(self, mock_verify, mock_appcheck):
        mock_appcheck.return_value = {"success": True}
        mock_verify.return_value = {"success": True, "uid": self.liker_id}

        resp = self.client.post(
            self.like_url, {"id_token": "ok", "post_id": "BAD-ID"}, content_type="application/json"
        )
        self._pretty(resp)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(resp.json().get("success"))

    @patch("MyApp.Boundary.post_boundary.authenticate_app_check_token")
    @patch("MyApp.Boundary.post_boundary.verify_id_token")
    def test_like_success_with_prefixed_id(self, mock_verify, mock_appcheck):
        mock_appcheck.return_value = {"success": True}
        mock_verify.return_value = {"success": True, "uid": self.liker_id}

        resp = self.client.post(
            self.like_url, {"id_token": "ok", "post_id": self.post.formatted_id}, content_type="application/json"
        )
        self._pretty(resp)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.json().get("success"))
        self.assertTrue(PostLike.objects.filter(post=self.post, user=self.liker).exists())

    @patch("MyApp.Boundary.post_boundary.authenticate_app_check_token")
    @patch("MyApp.Boundary.post_boundary.verify_id_token")
    def test_like_and_count_and_users(self, mock_verify, mock_appcheck):
        mock_appcheck.return_value = {"success": True}
        mock_verify.return_value = {"success": True, "uid": self.liker_id}

        # Like using plain int id this time
        resp_like = self.client.post(
            self.like_url, {"id_token": "ok", "post_id": self.post.post_id}, content_type="application/json"
        )
        self._pretty(resp_like)
        self.assertEqual(resp_like.status_code, status.HTTP_200_OK)

        # Count
        resp_count = self.client.get(self.count_url, {"post_id": self.post.formatted_id})
        self._pretty(resp_count)
        self.assertEqual(resp_count.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_count.json()["data"]["count"], 1)

        # Users (default page/page_size)
        resp_users = self.client.get(self.users_url, {"post_id": self.post.post_id})
        self._pretty(resp_users)
        self.assertEqual(resp_users.status_code, status.HTTP_200_OK)
        users = resp_users.json()["data"]["users"]
        self.assertEqual(len(users), 1)
        self.assertEqual(users[0]["user_id"], self.liker_id)

    @patch("MyApp.Boundary.post_boundary.authenticate_app_check_token")
    @patch("MyApp.Boundary.post_boundary.verify_id_token")
    def test_unlike_then_count_zero(self, mock_verify, mock_appcheck):
        mock_appcheck.return_value = {"success": True}
        mock_verify.return_value = {"success": True, "uid": self.liker_id}

        # Seed a like
        PostLike.objects.get_or_create(post=self.post, user=self.liker)

        # Unlike
        resp_unlike = self.client.post(
            self.unlike_url, {"id_token": "ok", "post_id": self.post.formatted_id}, content_type="application/json"
        )
        self._pretty(resp_unlike)
        self.assertEqual(resp_unlike.status_code, status.HTTP_200_OK)
        self.assertFalse(PostLike.objects.filter(post=self.post, user=self.liker).exists())

        # Count = 0
        resp_count = self.client.get(self.count_url, {"post_id": self.post.post_id})
        self._pretty(resp_count)
        self.assertEqual(resp_count.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_count.json()["data"]["count"], 0)
# ----------------
# MEMBER - 2 (end)
# ----------------