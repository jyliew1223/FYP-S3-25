# MyApp/Boundary/user_stats.py
from typing import Any, Dict
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Avg, Count, Q

from MyApp.models import Climb  # adjust to your app
from MyApp.Utils.helper import authenticate_app_check_token, verify_id_token  # ensure verify_id_token exists in helper.py

@api_view(["POST"])
def get_user_climb_stats_view(request: Request) -> Response:
    """
    POST /climb_stats
    Body: {"id_token": str}

    Returns:
    {
        "success": bool,
        "message": str,
        "data": {
            "on_sight": int,
            "red_point": int,
            "avg_grade": float | null,
            "avg_attempts": float | null
        },
        "errors": dict[str, Any]   # present only when success is False
    }

    Notes:
    - 200 OK with empty stats if user has no logs (all zeros/nulls).
    - 400 for invalid input; 401 for failed auth/app check.
    """

    # 1) App Check
    auth_app: Dict[str, Any] = authenticate_app_check_token(request)
    if not auth_app.get("success"):
        return Response({
            "success": False,
            "message": auth_app.get("message", "Unauthorized."),
            "data": {},
            "errors": auth_app.get("errors", {}),  # make sure helper always returns 'errors' key or this defaults to empty dict
        }, status=status.HTTP_401_UNAUTHORIZED)

    # 2) Validate request body
    id_token = request.data.get("id_token")
    if not isinstance(id_token, str) or not id_token.strip():
        return Response({
            "success": False,
            "message": "Invalid or missing id_token.",
            "data": {},
            "errors": {"id_token": "This field is required and must be a non-empty string."}
        }, status=status.HTTP_400_BAD_REQUEST)

    # 3) Verify id_token -> uid
    verify = verify_id_token(id_token)  # ensure helper.py has this function
    if not verify or not verify.get("success") or not verify.get("uid"):
        return Response({
            "success": False,
            "message": (verify or {}).get("message", "Failed to verify id_token."),
            "data": {},
            "errors": (verify or {}).get("errors", {"uid": "Missing or invalid."}),  # ensure verify_id_token returns 'errors' key even if empty
        }, status=status.HTTP_401_UNAUTHORIZED)

    '''
    uid = verify.get("uid")
    if not uid:
        return Response({
            "success": False,
            "message": "Verified token missing uid.",
            "data": {},
            "errors": {"uid": "Not found in decoded token."}
        }, status=status.HTTP_401_UNAUTHORIZED)
    '''

    '''
    # 4) Aggregate statistics
    qs = Climb.objects.filter(user_id=uid)

    if not qs.exists():
        return Response({
            "success": True,
            "message": "No climbs found for user.",
            "data": {
                "on_sight": 0,
                "red_point": 0,
                "avg_grade": None,
                "avg_attempts": None,
                "total_routes": 0, # Newly added
            }
        }, status=status.HTTP_200_OK)

    stats = qs.aggregate(
        on_sight=Count("id", filter=Q(style="on_sight")),
        red_point=Count("id", filter=Q(style="red_point")),
        avg_grade=Avg("grade_numeric"),
        avg_attempts=Avg("attempts"),
    )

    payload = {
        "on_sight": int(stats.get("on_sight") or 0) if "on_sight" in stats else 0,
        "red_point": int(stats.get("red_point") or 0) if "red_point" in stats else 0,
        "avg_grade": float(stats["avg_grade"]) if stats.get("avg_grade") is not None else None,
        "avg_attempts": float(stats["avg_attempts"]) if stats.get("avg_attempts") is not None else None,
         "total_routes": qs.count(),  # <-- add this
    }

    total_routes = qs.count()  # ADD THIS (NEW)

    return Response({
        "success": True,
        "message": "User statistics fetched successfully.",
        "data": {
            "total_routes": total_routes
            }   
        }, 
        status=status.HTTP_200_OK
    )
'''


# 4) NEW CODE OF 4 Compute stats (only total_routes for now)
    total_routes = Climb.objects.count()

    return Response(
        {
            "success": True,
            "message": "User statistics fetched successfully.",
            "data": {"total_routes": total_routes},
        },
        status=status.HTTP_200_OK,
    )