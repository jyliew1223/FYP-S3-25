from typing import Any, Dict, List, Optional, cast

from django.utils.timezone import now
from django.db.models import Count

from firebase_admin import auth

from MyApp.Entity.climblog import ClimbLog
from MyApp.Exceptions.exceptions import InvalidUIDError


def get_user_climb_logs(id_token: str) -> List[ClimbLog]:
    decoded_token = auth.verify_id_token(id_token)
    user_id = decoded_token.get("uid")
    if not user_id:
        raise InvalidUIDError("User ID is null or empty.")

    logs = ClimbLog.objects.filter(user=user_id).order_by("-date_climbed")
    return list(logs)


def get_user_climb_state(id_token: str) -> Optional[int]:
    decoded_token = auth.verify_id_token(id_token)
    user_id = decoded_token.get("uid")
    if not user_id:
        raise InvalidUIDError("User ID is null or empty.")

    """
    uid = verify.get("uid")
    if not uid:
        return Response({
            "success": False,
            "message": "Verified token missing uid.",
            "data": {},
            "errors": {"uid": "Not found in decoded token."}
        }, status=status.HTTP_401_UNAUTHORIZED)
    """

    """
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
    """

    # 4) NEW CODE OF 4 Compute stats (only total_routes for now)
    total_routes = ClimbLog.objects.count()

    return total_routes