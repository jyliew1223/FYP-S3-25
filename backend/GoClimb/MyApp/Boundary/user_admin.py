# MyApp/Boundary/user_admin.py
from typing import Any, Dict
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status

from MyApp.Utils.helper import authenticate_app_check_token
from MyApp.Controller.user_controller import suspend_user  # controller below

# -----------------
# ADMIN - 2 (start)
# -----------------

@api_view(["POST"])
def suspend_profile_view(request: Request) -> Response:
    """
    Admin – suspend a user's profile.

    INPUT:
    {
      "user_id": "<string>"
    }

    OUTPUT (Success):
    {
      "success": true,
      "data": { "user_id": "<string>" },
      "message": "Profile suspended successfully",
      "errors": []
    }

    OUTPUT (Failure):
    {
      "success": false,
      "message": "...",
      "errors": { "<field>": "error message" }
    }

    Status: 200, 400, 401
    """
    # 1) App Check
    result: Dict[str, Any] = authenticate_app_check_token(request)
    if not result.get("success"):
        return Response({
            "success": False,
            "message": result.get("message", "Unauthorized."),
            "errors": result.get("errors", {}),
        }, status=status.HTTP_401_UNAUTHORIZED)

    # 2) Validate input
    user_id = request.data.get("user_id")
    if not isinstance(user_id, str) or not user_id.strip():
        return Response({
            "success": False,
            "message": "Invalid user_id.",
            "errors": {"user_id": "This field is required and must be a non-empty string."}
        }, status=status.HTTP_400_BAD_REQUEST)

    # 3) Suspend via controller
    try:
        ok, payload = suspend_user(user_id.strip())
        if not ok:
            return Response({
                "success": False,
                "message": payload.get("message", "Failed to suspend user."),
                "errors": payload.get("errors", {}),
            }, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "success": True,
            "data": {"user_id": user_id},
            "message": "Profile suspended successfully",
            "errors": []
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            "success": False,
            "message": "Error processing suspension.",
            "errors": {"exception": str(e)}
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # ----------------
    # ADMIN - 2 (end)
    # ----------------