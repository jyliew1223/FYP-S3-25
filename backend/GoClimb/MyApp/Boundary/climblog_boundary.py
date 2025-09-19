# MyApp/Boundary/climb_logs.py
from typing import Any, Dict, List
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status

from firebase_admin import auth

from MyApp.Serializer.serializers import ClimbLogSerializer
from MyApp.Utils.helper import authenticate_app_check_token
from MyApp.Controller.climblog_controller import get_user_climb_logs, get_user_climb_state
from MyApp.Exceptions.exceptions import InvalidUIDError


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
    app_check: Dict[str, Any] = authenticate_app_check_token(request)

    if not app_check.get("success"):
        return Response(app_check, status=status.HTTP_401_UNAUTHORIZED)

    data = request.data if isinstance(request.data, dict) else {}

    id_token = data.get("id_token", "")

    required_fields = {"id_token": id_token}

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
        list = get_user_climb_logs(id_token)

        serializer = ClimbLogSerializer(list, many=True)
        items: List[Dict[str, Any]] = [
            {
                "log_id": row["log_id"],
                "crag_id": row["crag"],
                "user_id": row["user"],
                "route_name": row["route_name"],
                "date_climbed": row["date_climbed"],
                "difficulty_grade": row["difficulty_grade"],
            }
            for row in serializer.data
        ]

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
    app_check: Dict[str, Any] = authenticate_app_check_token(request)

    if not app_check.get("success"):
        return Response(app_check, status=status.HTTP_401_UNAUTHORIZED)

    data = request.data if isinstance(request.data, dict) else {}

    id_token = data.get("id_token", "")

    required_fields = {"id_token": id_token}

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
        route_count = get_user_climb_state(id_token)

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
