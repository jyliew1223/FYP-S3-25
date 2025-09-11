# MyApp/Boundary/climb_logs.py
from typing import Any, Dict, List
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status

from MyApp.Serializer.serializers import ClimbLogSerializer
from MyApp.Entity.climblog import ClimbLog  # adjust import to your app
from MyApp.Utils.helper import authenticate_app_check_token,verify_id_token   # implement in Utils

@api_view(["POST"])
def get_user_climb_logs_view(request: Request) -> Response:
    """
    POST /climb_logs
    Body: {"id_token": str}

    Returns:
    {
        "success": bool,
        "message": str,
        "data": [
            {
                "log_id": int,
                "crag_id": int,
                "user_id": str,
                "route_name": str,
                "climb_date": str,     # ISO 8601
                "difficulty_grade": str,
                "note": str
            },
            ...
        ],
        "errors": dict[str, Any]     # only when success is False
    }
    """

    # 1) App Check verification (reject unauthorized)
    app_check: Dict[str, Any] = authenticate_app_check_token(request)
    if not app_check.get("success"):
        return Response({
            "success": False,
            "message": app_check.get("message", "Unauthorized."),
            "data": [],
            "errors": app_check.get("errors", {}),
        }, status=status.HTTP_401_UNAUTHORIZED)  # 401 for failed auth[9]

    # 2) Validate body
    id_token = request.data.get("id_token")
    if not isinstance(id_token, str) or not id_token.strip():
        return Response({
            "success": False,
            "message": "Invalid or missing id_token.",
            "data": [],
            "errors": {"id_token": "This field is required and must be a non-empty string."}
        }, status=status.HTTP_400_BAD_REQUEST)  # 400 for bad input[12]

    # 3) Verify id_token -> uid
    verify = verify_id_token(id_token)
    if not verify or not verify.get("success"):
        return Response({
            "success": False,
            "message": verify.get("message", "Failed to verify id_token."),
            "data": [],
            "errors": verify.get("errors", {}),
        }, status=status.HTTP_401_UNAUTHORIZED)  # still auth failure[9]

    uid = verify.get("uid")
    if not uid:
        return Response({
            "success": False,
            "message": "Verified token missing uid.",
            "data": [],
            "errors": {"uid": "Not found in decoded token."}
        }, status=status.HTTP_401_UNAUTHORIZED)  # auth info incomplete[9]

    # 4) Fetch user’s climb logs (newest first)
    qs = ClimbLog.objects.filter(user=uid).order_by("-date_climbed")

    # 5) Serialize and map id -> log_id
    ser = ClimbLogSerializer(qs, many=True)
    items: List[Dict[str, Any]] = [{
        "log_id": row["log_id"],
        "crag_id": row["crag"],
        "user_id": row["user"],
        "route_name": row["route_name"],
        "date_climbed": row["date_climbed"],
        "difficulty_grade": row["difficulty_grade"],
       # "note": row["note"],
    } for row in ser.data]

    # 6) Always 200 on success, even if list is empty
    return Response({
        "success": True,
        "message": "Climb logs fetched successfully.",
        "data": items
    }, status=status.HTTP_200_OK)  # 200 with [] is correct for empty collection[2]
