from typing import Any

from firebase_admin import auth

from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.decorators import api_view
from rest_framework import status

from MyApp.Serializer.serializers import UserSerializer
from MyApp.Controller import user_controller
from MyApp.Exceptions.exceptions import InvalidUIDError
from MyApp.Firebase.helpers import authenticate_app_check_token
from MyApp.Utils.helper import extract_single_file_and_clean_data

@api_view(["POST"])
def get_user_view(request: Request) -> Response:

    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)

    data = request.data if isinstance(request.data, dict) else {}
    id_token = data.get("id_token", "").strip() if isinstance(data.get("id_token"), str) else ""

    if not id_token:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"id_token": "This field is required."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:

        user = user_controller.get_user_by_id(id_token)

        if user is None:
            return Response(
                {
                    "success": False,
                    "message": "User not found.",
                    "errors": {"id_token": "Invalid token."},
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = UserSerializer(user)

        return Response(
            {
                "success": True,
                "message": "User fetched successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    except InvalidUIDError as e:
        return Response(
            {
                "success": False,
                "message": str(e),
                "errors": {"id_token": "Invalid user ID."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except auth.InvalidIdTokenError:
        return Response(
            {
                "success": False,
                "message": "Invalid Firebase ID token.",
                "errors": {"id_token": "Token verification failed."},
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )
    except Exception as e:
        return Response(
            {
                "success": False,
                "message": "An error occurred while fetching user.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@api_view(["GET"])
def get_monthly_user_ranking_view(request: Request) -> Response:

    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)

    count_str = request.query_params.get("count", "3").strip()

    try:
        count = int(count_str) if count_str.isdigit() else 3
    except (ValueError, TypeError):
        count = 3

    try:

        ranking = user_controller.get_monthly_user_ranking(count)

        user_ranking = []
        for row in ranking:
            user = row.get("user")
            if user:
                serialized_user = UserSerializer(user).data

                ranking_entry = {
                    "user": serialized_user,
                    "rank": row.get("ranking", 0),
                    "total_routes": row.get("total_routes", 0),
                }
                user_ranking.append(ranking_entry)

        return Response(
            {
                "success": True,
                "message": "Monthly user ranking fetched successfully.",
                "data": user_ranking,
            },
            status=status.HTTP_200_OK,
        )

    except ValueError as e:
        return Response(
            {
                "success": False,
                "message": str(e),
                "errors": {"count": str(e)},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except InvalidUIDError as e:
        return Response(
            {
                "success": False,
                "message": str(e),
                "errors": {"validation": str(e)},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(
            {
                "success": False,
                "message": "An error occurred while fetching ranking.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )



@api_view(["PUT", "PATCH"])
def update_user_view(request: Request) -> Response:
    """
    Boundary: Handle HTTP request to update user details.
    
    INPUT: {
        "user_id": str (required),
        "username": str (optional),
        "email": str (optional),
        "status": bool (optional),
        "profile_picture": file (optional)
    }
    OUTPUT: {
        "success": bool,
        "message": str,
        "data": User object,
        "errors": dict  # Only if success is False
    }
    """
    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)

    # Extract profile picture and clean form data
    profile_picture, clean_data = extract_single_file_and_clean_data(request, "profile_picture")

    user_id = clean_data.get("user_id", "")

    if not user_id:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"user_id": "This field is required."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Prepare update data (exclude user_id from update)
    update_data = {}
    allowed_fields = ["username", "email", "status"]
    
    for field in allowed_fields:
        if field in clean_data:
            value = clean_data[field]
            # Skip empty strings
            if isinstance(value, str):
                value = value.strip()
                if value:
                    update_data[field] = value
            else:
                update_data[field] = value

    try:
        user = user_controller.update_user(user_id, update_data, profile_picture)

        serializer = UserSerializer(user)

        return Response(
            {
                "success": True,
                "message": "User updated successfully.",
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
    except ValueError as ve:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"validation": str(ve)},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(
            {
                "success": False,
                "message": "An error occurred while updating user.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
