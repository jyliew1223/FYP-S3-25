from typing import Any
from rest_framework.request import Request
from MyApp.Firebase.helpers import verify_app_check_token

def authenticate_app_check_token(request: Request) -> dict[str, Any]:
    """
    Extracts the Firebase app check token from Authorization header.
    """
    app_check_token = request.headers.get("X-Firebase-AppCheck")

    if not app_check_token:
        return {"success": False, "message": "Missing App Check token"}

    verification_result = verify_app_check_token(app_check_token)
    if not verification_result.get("success"):
        return {"success": False, "message": verification_result.get("message")}

    else:
        return {
            "success": True,
            "message": "Request authorized",
            "token_info": verification_result.get("token_info"),
        }
