from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
import uuid
import time
import os
import json
from firebase_admin import auth
from typing import cast, Any

# Generate a custom token for a specific user ID
uid = os.getenv("TEST_USER_UID")  # Use an environment variable
custom_token_bytes = auth.create_custom_token(uid)
custom_token_str = custom_token_bytes.decode("utf-8")

import requests

API_KEY = os.getenv("FIREBASE_API_KEY")


def get_id_token_from_custom_token(custom_token: str) -> str:
    """
    Exchange a custom token for a real Firebase ID token using REST API.
    """
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key={API_KEY}"
    payload = {"token": custom_token, "returnSecureToken": True}
    response = requests.post(url, json=payload)
    response.raise_for_status()
    data = response.json()
    return data["idToken"]  # This is the real ID token


class UserBoundaryAPITest(APITestCase):

    def setUp(self):
        self.signup_url = reverse("User Signup")
        self.verify_url = reverse("Verify ID Token")
        self.real_token = get_id_token_from_custom_token(custom_token_str)
        time.sleep(2)
        self.user_data = {
            "id_token": self.real_token,
            "full_name": "Real Token User",
            "email": f"realtest{uuid.uuid4().hex[:6]}@example.com",
        }

    def test_signup_unothorize(self):
        self.real_token = "invalid_token"

        headers = {"HTTP_AUTHORIZATION": f"Bearer {self.real_token}"}
        response = self.client.post(
            self.signup_url, self.user_data, format="json", **cast(Any, headers)
        )

        print(
            self._testMethodName + ":\n" + json.dumps(response.json(), indent=2)
        )  # Debug any errors

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.json().get("success"))

    def test_signup_invalid_id_token(self):
        self.user_data["id_token"] = "invalid_token"

        headers = {"HTTP_AUTHORIZATION": f"Bearer {self.real_token}"}
        response = self.client.post(
            self.signup_url, self.user_data, format="json", **cast(Any, headers)
        )

        print(
            self._testMethodName + ":\n" + json.dumps(response.json(), indent=2)
        )  # Debug any errors

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.json().get("success"))

    def test_signup_duplicate_email(self):

        headers = {"HTTP_AUTHORIZATION": f"Bearer {self.real_token}"}
        response1 = self.client.post(
            self.signup_url, self.user_data, format="json", **cast(Any, headers)
        )
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)

        duplicate_data = self.user_data.copy()
        response2 = self.client.post(
            self.signup_url, duplicate_data, format="json", **cast(Any, headers)
        )

        print(
            self._testMethodName + ":\n" + json.dumps(response2.json(), indent=2)
        )  # Debug any errors

        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response2.json().get("success"))

    def test_signup_success(self):

        headers = {"HTTP_AUTHORIZATION": f"Bearer {self.real_token}"}
        response = self.client.post(
            self.signup_url, self.user_data, format="json", **cast(Any, headers)
        )

        print(
            self._testMethodName + ":\n" + json.dumps(response.json(), indent=2)
        )  # Debug any errors

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.json().get("success"))

    def test_verify_success(self):

        headers = {"HTTP_AUTHORIZATION": f"Bearer {self.real_token}"}
        response = self.client.post(
            self.verify_url, {}, format="json", **cast(Any, headers)
        )

        print(self._testMethodName + ":\n" + json.dumps(response.json(), indent=2))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.json().get("success"))

    def test_verify_fail(self):
        self.real_token = "invalid_token"

        headers = {"HTTP_AUTHORIZATION": f"Bearer {self.real_token}"}
        response = self.client.post(
            self.verify_url, {}, format="json", **cast(Any, headers)
        )

        print(self._testMethodName + ":\n" + json.dumps(response.json(), indent=2))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.json().get("success"))
