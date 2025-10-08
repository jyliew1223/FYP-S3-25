# MyApp/Boundary/user_admin.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from MyApp.Utils.helper import authenticate_app_check_token
from MyApp.Controller.user_controller import suspend_user  # <-- uses your controller


# -----------------
# ADMIN - 2 (start)
# -----------------
@api_view(["POST"])
def suspend_profile_view(request):
    auth = authenticate_app_check_token(request)
    if not auth.get("success"):
        return Response({"success": False, "message": auth.get("message", "Unauthorized.")},
                        status=status.HTTP_401_UNAUTHORIZED)

    user_id = request.data.get("user_id")
    if not isinstance(user_id, str) or not user_id.strip():
        return Response({
            "success": False,
            "message": "Invalid user_id.",
            "errors": {"user_id": "This field is required and must be a valid string."}
        }, status=status.HTTP_400_BAD_REQUEST)

    ok, payload = suspend_user(user_id.strip())

    if not ok:
        return Response(
            {"success": False,
            "message": payload.get("message", "Failed to suspend."),
            "errors": payload.get("errors", {})},
             status=status.HTTP_400_BAD_REQUEST,  # <-- test expects 400
        )

    return Response({
        "success": True,
        "message": "User suspended successfully.",
        "data": payload,
        "errors": []
    }, status=status.HTTP_200_OK)
# ----------------
# ADMIN - 2 (end)
# ----------------