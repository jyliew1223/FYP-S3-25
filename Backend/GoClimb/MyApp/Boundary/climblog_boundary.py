from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status

from MyApp.Serializer.serializers import ClimbLogSerializer
from MyApp.Firebase.helpers import authenticate_app_check_token
from MyApp.Controller import climblog_controller
from MyApp.Exceptions.exceptions import InvalidUIDError

@api_view(["POST"])
def get_user_climb_logs_view(request: Request) -> Response:

    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)

    data = request.data if isinstance(request.data, dict) else {}
    user_id = data.get("user_id", "").strip() if isinstance(data.get("user_id"), str) else ""

    if not user_id:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"user_id": "This field is required."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:

        climb_logs = climblog_controller.get_user_climb_logs(user_id)

        serializer = ClimbLogSerializer(climb_logs, many=True)

        return Response(
            {
                "success": True,
                "message": "Climb logs fetched successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    except InvalidUIDError as e:
        return Response(
            {
                "success": False,
                "message": str(e),
                "errors": {"user_id": "Invalid user ID."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(
            {
                "success": False,
                "message": "An error occurred while fetching climb logs.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@api_view(["POST"])
def get_user_climb_stats_view(request: Request) -> Response:

    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)

    data = request.data if isinstance(request.data, dict) else {}
    user_id = data.get("user_id", "").strip() if isinstance(data.get("user_id"), str) else ""

    if not user_id:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"user_id": "This field is required."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:

        total_routes = climblog_controller.get_user_climb_state(user_id)

        return Response(
            {
                "success": True,
                "message": "User statistics fetched successfully.",
                "data": {"total_routes": total_routes},
            },
            status=status.HTTP_200_OK,
        )

    except InvalidUIDError as e:
        return Response(
            {
                "success": False,
                "message": str(e),
                "errors": {"user_id": "Invalid user ID."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(
            {
                "success": False,
                "message": "An error occurred while fetching statistics.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
