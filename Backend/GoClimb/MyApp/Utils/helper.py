# MyApp/Utils/helper.py
from typing import Any, Dict
from rest_framework.request import Request

# Firebase Admin SDK imports
import firebase_admin
from firebase_admin import auth, credentials

# Initialize Firebase app (if not already initialized)
if not firebase_admin._apps:
    cred = credentials.Certificate(
        "path/to/your/firebase-service-account.json"
    )  # <-- change path
    firebase_admin.initialize_app(cred)

# ------------------------------
# App Check authentication
# ------------------------------
from MyApp.Firebase.helpers import (
    verify_app_check_token,
)  # keep your existing App Check function


def authenticate_app_check_token(request: Request) -> Dict[str, Any]:
    """
    Extracts the Firebase App Check token from headers and verifies it.
    """
    app_check_token = request.headers.get("X-Firebase-AppCheck")

    if not app_check_token:
        return {"success": False, "message": "Missing App Check token"}

    verification_result = verify_app_check_token(app_check_token)
    if not verification_result.get("success"):
        return {"success": False, "message": verification_result.get("message")}

    return {
        "success": True,
        "message": "Request authorized",
        "token_info": verification_result.get("token_info"),
    }


# ------------------------------
# Firebase ID Token verification
# ------------------------------
def verify_id_token(id_token: str) -> Dict[str, Any]:
    """
    Verifies Firebase ID token and returns UID and status.
    """
    if not id_token or not isinstance(id_token, str):
        return {
            "success": False,
            "message": "Invalid token format.",
            "errors": {"id_token": "Token must be a non-empty string."},
        }

    try:
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token.get("uid")

        if not uid:
            return {
                "success": False,
                "message": "Token verified but UID not found.",
                "errors": {"uid": "Missing UID in decoded token."},
            }

        return {
            "success": True,
            "uid": uid,
            "message": "Token verified successfully.",
            "errors": {},
        }

    except auth.ExpiredIdTokenError:
        return {
            "success": False,
            "message": "Token has expired.",
            "errors": {"id_token": "Expired token."},
        }
    except auth.InvalidIdTokenError:
        return {
            "success": False,
            "message": "Invalid token.",
            "errors": {"id_token": "Token is not valid."},
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to verify token: {str(e)}",
            "errors": {},
        }

class PrefixedIDConverter:
    def to_raw_id(self, prefixed_id: str) -> int:
        if not prefixed_id or "-" not in prefixed_id:
            raise ValueError(f"not - found Invalid ID format: {prefixed_id}")
        parts = prefixed_id.split("-")
        if len(parts) != 2:
            raise ValueError(f"len of part !=2 Invalid ID format: {prefixed_id}")
        try:
            return int(parts[1])
        except ValueError:
            raise ValueError(f"Invalid numeric part in ID: {prefixed_id}")
