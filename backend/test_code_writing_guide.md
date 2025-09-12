# 🧪 Django Backend Testing Handbook

This document explains how to test our Django backend, write test cases, and run them effectively.

# 📌 Why Testing Matters

1. Ensures code correctness before deployment

2. Prevents regressions when adding new features

3. Helps developers understand expected API behavior

4. Increases confidence in refactoring

# ⚙️ Setting Up the Test Environment

1. Use a separate database for tests
    - Django automatically creates a temporary test database when running tests.

2. Run tests

```ini
python manage.py test # haven't setup yet dont use!!!
```

 - or to run specific tests:

```ini
python manage.py test MyApp.tests.test_user_boundary
```

# 🛠 Tools We Use

1. Django APITestCase – from rest_framework.test, simulates API calls

2. reverse() – gets URL by name (avoids hardcoding URLs)

3. patch() from unittest.mock – to mock external services (e.g., Firebase)

4. status – for readable HTTP status codes (e.g., status.HTTP_201_CREATED)

# 📝 Writing a Test Case

Each test case is a class that extends APITestCase.
Inside, each test is a function that starts with test_.

Example Structure
```ini
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from unittest.mock import patch
import uuid, json

class UserBoundaryAPITest(APITestCase):

    def setUp(self):
        """Run before every test"""
        self.signup_url = reverse("User Signup")
        self.user_data = {
            "id_token": "mock_token",
            "full_name": "Test User",
            "email": f"test{uuid.uuid4().hex[:6]}@example.com",
        }

    @patch("MyApp.Boundary.user_boundary.authenticate_app_check_token")
    def test_signup_success(self, mock_verify):
        """✅ User can successfully sign up"""
        mock_verify.return_value = {"success": True, "uid": "mocked_uid"}

        response = self.client.post(self.signup_url, self.user_data, format="json")

        print("test_signup_success:\n", json.dumps(response.json(), indent=2))
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.json().get("success"))
```

# 🔑 Best Practices

1. Use setUp() for shared test data

2. Name tests clearly (test_signup_success, test_signup_duplicate_email)

3. Mock external APIs – never rely on real Firebase/Stripe/etc. in tests

4. Test both success and failure cases

5. Use assertions:

    - self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    - self.assertTrue(response.json().get("success"))

    - self.assertFalse(response.json().get("success"))

# 📂 File Organization
```ini
backend/
 └── GoClimb/
    └── MyApp/
        └── _TestCode/
            ├── __init__.py
            ├── test_user_boundary.py   # User signup/login tests
            └── others....
```

# 🧾 Example Test Scenarios (User Signup)
| Test Name | Description | Expected Result |
|----------|----------|----------|
| test_signup_success | User signs up with valid token & email | 201 CREATED, success=True  |
|test_signup_duplicate_email | User tries to sign up again with same email	|400 BAD REQUEST, success=False|
|test_signup_invalid_id_token|	Invalid Firebase token	| 400 BAD REQUEST, success=False|
|test_signup_unothorize |	App Check token invalid|	401 UNAUTHORIZED, success=False|



# 🧰 Mocking in Django Tests
## 🔎 What is Mocking?

Mocking replaces real external calls (e.g., Firebase Auth, payment APIs, email services) with fake objects or responses during tests.
This makes tests:

1. Faster – no network calls

2. Reliable – no random external failures

3. Isolated – only your backend logic is tested

## ⚙️ The patch() Function

We use unittest.mock.patch to temporarily replace functions/classes with fakes.

Basic Example
```ini
from unittest.mock import patch

@patch("path.to.module.function_name")
def test_something(mock_function):
    mock_function.return_value = "fake result"
    assert mock_function() == "fake result"
```

## 🧑‍💻 Mocking in Django REST API Tests
1. Mock Firebase App Check
    - In your code, you might have:

```ini
    from firebase_admin import auth

    def authenticate_app_check_token(token: str) -> dict:
        # Real Firebase call
        decoded = auth.verify_id_token(token)
        return {"success": True, "uid": decoded["uid"]}
```


➡️ In tests, mock it:

```ini
@patch("MyApp.Boundary.user_boundary.authenticate_app_check_token")
def test_invalid_token(self, mock_verify):
    mock_verify.return_value = {"success": False, "message": "Invalid token"}

    response = self.client.post(self.signup_url, self.user_data, format="json")

    self.assertEqual(response.status_code, 401)
    self.assertFalse(response.json().get("success"))
```

2. Mock Firebase auth.create_custom_token

    - Normally this calls Firebase servers. For testing:

```ini
@patch("firebase_admin.auth.create_custom_token")
def test_mock_custom_token(self, mock_create_token):
    mock_create_token.return_value = b"fake_custom_token"
    token = auth.create_custom_token("test_uid")
    self.assertEqual(token, b"fake_custom_token")
```

3. Mock requests.post

    - Sometimes your code calls an external REST API:

```ini
import requests
def get_id_token(custom_token: str):
    response = requests.post("https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken", ...)
    return response.json()
```


➡️ In tests:

```ini
@patch("requests.post")
def test_mock_requests(self, mock_post):
    mock_post.return_value.status_code = 200
    mock_post.return_value.json.return_value = {"idToken": "fake_id"}

    token = get_id_token("custom_token")
    self.assertEqual(token["idToken"], "fake_id")
```

🔑 Mocking Best Practices

1. ✅ Patch at the right location
    - Patch where the function is used, not where it is defined.
    - Example: If your function imports authenticate_app_check_token inside MyApp.Boundary.user_boundary, patch:

```ini
@patch("MyApp.Boundary.user_boundary.authenticate_app_check_token")
```


    - (not @patch("firebase_admin.auth.verify_id_token") unless you want to mock Firebase directly).

2. ✅ Return realistic fake responses
    - If Firebase returns {"uid": "...", "email": "..."}, make your mock return something similar.

3. ✅ Test both success & failure paths

    - Success → mocked API returns expected data

    - Failure → mocked API raises an exception or returns an error

4. ✅ Don’t mock too much
    - Only mock external dependencies.
    - Don’t mock your own business logic (otherwise you’re not really testing it).

## 📌 Quick Mocking Examples
|Case|	What to Mock|	Example|
|----------|----------|----------|
|Firebase App Check|	authenticate_app_check_token|	Return {"success": False} for failure|
|Firebase Custom Token	|firebase_admin.auth.create_custom_token	|Return fake bytes|
|External REST API	|requests.post|	Return fake JSON response
|Email Sending	|django.core.mail.send_mail|turn fake success count|