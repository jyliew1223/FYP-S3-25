# MyApp/Boundary/climb_logs.py
from typing import Any, Dict, List, Optional
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status

from firebase_admin import auth

from MyApp.Serializer.serializers import ClimbLogSerializer
from MyApp.Firebase.helpers import authenticate_app_check_token
from MyApp.Controller.climblog_controller import get_user_climb_logs, get_user_climb_state
from MyApp.Exceptions.exceptions import InvalidUIDError


@api_view(["POST"])
def get_user_climb_logs_view(request: Request) -> Response:
    """
    POST /climb_logs
    Body: {"user_id": str}

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
    app_check: Dict[str, Any] = authenticate_app_check_token(request)

    if not app_check.get("success"):
        return Response(app_check, status=status.HTTP_401_UNAUTHORIZED)

    data = request.data if isinstance(request.data, dict) else {}

    user_id = data.get("user_id", "")

    required_fields = {"user_id": user_id}

    for field_name, value in required_fields.items():
        if not value:
            return Response(
                {
                    "success": False,
                    "message": f"{field_name.replace('_', ' ').title()} is required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    try:
        list = get_user_climb_logs(user_id)

        serializer = ClimbLogSerializer(list, many=True)
        items = serializer.data

        # 6) Always 200 on success, even if list is empty
        return Response(
            {
                "success": True,
                "message": "Climb logs fetched successfully.",
                "data": items,
            },
            status=status.HTTP_200_OK,
        )  # 200 with [] is correct for empty collection[2]

    except InvalidUIDError as e:
        return Response(
            {"success": False, "message": str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except auth.InvalidIdTokenError:
        return Response(
            {"success": False, "message": "Invalid Firebase ID token."},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    except Exception as e:
        return Response(
            {
                "success": False,
                "message": f"Error fetching climb logs: {str(e)}",
                "data": [],
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

        # MyApp/Boundary/user_stats.py


@api_view(["POST"])
def get_user_climb_stats_view(request: Request) -> Response:
    """
    POST /climb_stats
    Body: {"user_id": str}

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
    app_check: Dict[str, Any] = authenticate_app_check_token(request)

    if not app_check.get("success"):
        return Response(app_check, status=status.HTTP_401_UNAUTHORIZED)

    data = request.data if isinstance(request.data, dict) else {}

    user_id = data.get("user_id", "")

    required_fields = {"user_id": user_id}

    for field_name, value in required_fields.items():
        if not value:
            return Response(
                {
                    "success": False,
                    "message": f"{field_name.replace('_', ' ').title()} is required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    try:
        route_count = get_user_climb_state(user_id)

        if isinstance(route_count, int):
            return Response(
                {
                    "success": True,
                    "message": "User statistics fetched successfully.",
                    "data": {"total_routes": route_count},
                },
                status=status.HTTP_200_OK,
            )
        return Response(
            {
                "success": False,
                "message": "User statistics fetched failed.",
                "data": None,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    except InvalidUIDError as e:
        return Response(
            {"success": False, "message": str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except auth.InvalidIdTokenError:
        return Response(
            {"success": False, "message": "Invalid Firebase ID token."},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    except Exception as e:
        return Response(
            {
                "success": False,
                "message": f"Error fetching climb logs: {str(e)}",
                "data": [],
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    


# -------------------
# CREATING_02 (start)
# -------------------

from datetime import date

from MyApp.Firebase.helpers import parse_prefixed_int

from MyApp.Entity.user import User
from MyApp.Entity.route import Route
from MyApp.Entity.climblog import ClimbLog


def _get_route_id(value: Any) -> Optional[int]:
    # accepts 123 or "ROUTE-123"
    return parse_prefixed_int(value, "ROUTE")


@api_view(["POST"])
def create_climb_log_view(request):
    """
    INPUT JSON:
      {
        "route_id": 123 | "ROUTE-123",
        "user_id": "<string PK from User.user_id>",
        "date_climbed": "YYYY-MM-DD",
        "notes": "optional"
      }
    """
    # 0) App Check
    auth = authenticate_app_check_token(request)
    if not auth.get("success"):
        return Response(
            {"success": False, "message": auth.get("message", "Invalid token.")},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    body = request.data
    route_id = _get_route_id(body.get("route_id"))
    user_id = body.get("user_id")
    date_str = body.get("date_climbed")
    notes = body.get("notes", "")

    # 1) Basic required-fields validation
    errors = {}
    if route_id is None:
        errors["route_id"] = "This field is required."
    if not isinstance(user_id, str) or not user_id.strip():
        errors["user_id"] = "Must be a non-empty string."
    if not isinstance(date_str, str) or not date_str.strip():
        errors["date_climbed"] = "This field is required."

    if errors:
        return Response(
            {"success": False, "message": "Invalid input.", "errors": errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # 2) Resolve FK objects
    try:
        route = Route.objects.get(pk=route_id)
    except Route.DoesNotExist:
        return Response(
            {"success": False, "message": "Route not found.", "errors": {"route_id": "Invalid ID."}},
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        user = User.objects.get(pk=user_id.strip())  # User PK is user_id (CharField)
    except User.DoesNotExist:
        return Response(
            {"success": False, "message": "User not found.", "errors": {"user_id": "Invalid ID."}},
            status=status.HTTP_404_NOT_FOUND,
        )

    # 3) Parse date
    try:
        d = date.fromisoformat(date_str)
    except ValueError:
        return Response(
            {"success": False, "message": "Invalid input.", "errors": {"date_climbed": "Use YYYY-MM-DD."}},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # 4) Create and serialize for OUTPUT only
    log = ClimbLog.objects.create(user=user, route=route, date_climbed=d, notes=notes)
    data = ClimbLogSerializer(log).data

    return Response(
        {"success": True, "message": "Climbing log created successfully", "data": data, "errors": []},
        status=status.HTTP_200_OK,
    )

# -----------------
# CREATING_02 (end)
# -----------------



# -----------------
# DELETE_01 (start)
# -----------------

from MyApp.Entity.climblog import ClimbLog
from MyApp.Firebase.helpers import parse_prefixed_int  # already in your helpers

def _get_log_pk(value: Any) -> Optional[int]:
    # Accepts 123 or "CLIMBLOG-123"
    return parse_prefixed_int(value, "CLIMBLOG")


@api_view(["DELETE"])
def delete_climb_log_view(request):
    """
    DELETE /climb_log/delete/?log_id=123 or log_id=CLIMBLOG-000123
    """
    # 1) App Check
    auth = authenticate_app_check_token(request)
    if not auth.get("success"):
        return Response(
            {"success": False, "message": auth.get("message", "Unauthorized.")},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # 2) Validate input
    raw = request.query_params.get("log_id")
    if raw is None:
        return Response(
            {
                "success": False,
                "message": "Missing required fields.",
                "errors": {"log_id": "This field is required."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    log_pk = _get_log_pk(raw)
    if log_pk is None:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"log_id": "Must be an integer or 'CLIMBLOG-<int>'."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # 3) Delete
    try:
        log = ClimbLog.objects.get(pk=log_pk)
    except ClimbLog.DoesNotExist:
        return Response(
            {"success": False, "message": "Climb log not found.", "errors": []},
            status=status.HTTP_404_NOT_FOUND,
        )

    log.delete()
    return Response(
        {"success": True, "message": "Climbing log deleted successfully", "errors": []},
        status=status.HTTP_200_OK,
    )

# ---------------
# DELETE_01 (end)
# ---------------
