# MyApp/Firebase/helpers.py

from typing import Any
from firebase_admin import auth, exceptions, app_check


def verify_id_token(id_token: str) -> dict[str, Any]:
    try:
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token.get("uid")

        # Optional: check email_verified here
        # if not decoded_token.get("email_verified", False):
        #     return {"success": False, "message": "Email not verified."}

        return {
            "success": True,
            "message": "User verified successfully",
            "user_id": uid,
        }
    except exceptions.FirebaseError as e:
        return {"success": False, "message": f"Firebase error: {str(e)}"}
    except Exception as e:
        return {"success": False, "message": f"Unexpected error: {str(e)}"}


def verify_app_check_token(app_check_token) -> dict[str, Any]:
    """
    Verifies a Firebase App Check token using the Firebase Admin SDK.
    """
    try:
        decoded_token = app_check.verify_token(app_check_token)
        return {
            "success": True,
            "message": "App Check token verified successfully",
            "token_info": decoded_token,
        }
    except exceptions.FirebaseError as e:
        return {"success": False, "message": f"Firebase error: {str(e)}"}
    except Exception as e:
        return {"success": False, "message": f"Unexpected error: {str(e)}"}
    
    
# ------------------------
# ADMIN 1, 2, 3, 4 (start)
# ------------------------
from typing import Optional

def parse_prefixed_int(value, prefix: str) -> Optional[int]:
    """
    Accepts plain int (123) or 'PREFIX-123' (case-sensitive).
    Returns int or None if invalid.
    """
    if isinstance(value, int):
        return value
    if isinstance(value, str):
        value = value.strip()
        if value.isdigit():
            return int(value)
        if value.startswith(f"{prefix}-"):
            tail = value[len(prefix) + 1 :]
            if tail.isdigit():
                return int(tail)
    return None
# ----------------------
# ADMIN 1, 2, 3, 4 (end)
# ----------------------
