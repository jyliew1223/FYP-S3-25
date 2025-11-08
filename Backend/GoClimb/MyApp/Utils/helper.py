# MyApp/Utils/helper.py
from typing import Any, Dict
from rest_framework.request import Request

# Firebase Admin SDK imports
import firebase_admin
from firebase_admin import auth, credentials

from MyApp.Firebase.helpers import verify_id_token as _real_verify_id_token

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
    @staticmethod
    def to_raw_id(prefixed_id: str) -> int:
        if not prefixed_id:
            raise ValueError(f"prefixed_id is null")
        if "-" not in prefixed_id:
            try:
                id = int(prefixed_id)
                return id
            except:
                raise ValueError(f"not - found Invalid ID format: {prefixed_id}")
        parts = prefixed_id.split("-")
        if len(parts) != 2:
            raise ValueError(f"len of part !=2 Invalid ID format: {prefixed_id}")
        try:
            return int(parts[1])
        except ValueError:
            raise ValueError(f"Invalid numeric part in ID: {prefixed_id}")
        


# -----------------
# DELETE_03 (start)
# -----------------

# --- Compatibility shims so tests can patch Firebase helpers ---

from typing import Optional
try:
    from MyApp.Firebase import helpers as fb_helpers
except Exception:
    fb_helpers = None  # module not available during some tests

def _get_app_check_token_from_request(request) -> Optional[str]:
    token = None
    if hasattr(request, "headers"):
        token = request.headers.get("X-Firebase-AppCheck") or request.headers.get("X-AppCheck-Token")
    if not token and hasattr(request, "META"):
        token = request.META.get("HTTP_X_FIREBASE_APPCHECK") or request.META.get("HTTP_X_APPCHECK_TOKEN")
    return token

def authenticate_app_check_token(request):
    """
    Extract token from headers and delegate to fb_helpers.verify_app_check_token(token).
    Using the module attribute (not a cached alias) so unittest.mock.patch works.
    """
    if fb_helpers is None or not hasattr(fb_helpers, "verify_app_check_token"):
        return {"success": False, "message": "App Check not available"}

    token = _get_app_check_token_from_request(request)
    try:
        return fb_helpers.verify_app_check_token(token)
    except Exception as e:
        return {"success": False, "message": f"Unexpected error: {e}"}

def verify_id_token(id_token):
    if fb_helpers is None or not hasattr(fb_helpers, "verify_id_token"):
        return {"success": False, "message": "ID token not available"}
    return fb_helpers.verify_id_token(id_token)

def parse_prefixed_int(value, prefix=None):
    if fb_helpers is None or not hasattr(fb_helpers, "parse_prefixed_int"):
        return None
    return fb_helpers.parse_prefixed_int(value, prefix)

# --- end shims ---

# ---------------
# DELETE_03 (end)
# ---------------



# ---------------
# USER_03 (start)
# ---------------

def verify_user_id(id_token: str) -> dict:
    """
    Shim used by tests. Verifies a Firebase ID token and returns:
      {"success": True, "user_id": "<uid>"}  on success
      {"success": False, "message": "..."}   on failure
    """
    try:
        res = _real_verify_id_token(id_token)
        if res and res.get("success"):
            uid = res.get("uid") or res.get("user_id")
            if uid:
                return {"success": True, "user_id": str(uid)}
        return {"success": False, "message": res.get("message", "Invalid id_token.")}
    except Exception as e:
        return {"success": False, "message": f"Unexpected error: {e}"}

# -------------
# USER_03 (end)
# -------------
