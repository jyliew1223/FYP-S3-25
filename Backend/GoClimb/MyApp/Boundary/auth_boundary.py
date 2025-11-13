from typing import Any
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.decorators import api_view
from rest_framework import status

from firebase_admin import auth

from MyApp.Serializer.serializers import UserSerializer
from MyApp.Firebase.helpers import authenticate_app_check_token, verify_id_token
from MyApp.Controller import user_controller
from MyApp.Exceptions.exceptions import UserAlreadyExistsError, InvalidUIDError
from MyApp.Utils.helper import extract_single_file_and_clean_data

@api_view(["POST"])
def signup_view(request: Request) -> Response:

    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)

    # Extract profile picture and clean form data
    profile_picture, clean_data = extract_single_file_and_clean_data(request, "profile_picture")

    id_token = clean_data.get("id_token", "")
    username = clean_data.get("username", "")
    email = clean_data.get("email", "")

    if not id_token:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"id_token": "This field is required."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not username:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"username": "This field is required."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not email:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"email": "This field is required."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:

        user = user_controller.signup_user(id_token, username, email, profile_picture)

        user_serializer = UserSerializer(user)

        return Response(
            {
                "success": True,
                "message": "User created successfully.",
                "data": user_serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    except UserAlreadyExistsError as e:
        return Response(
            {
                "success": False,
                "message": str(e),
                "errors": {"email": "Email already in use."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except InvalidUIDError as e:
        return Response(
            {
                "success": False,
                "message": str(e),
                "errors": {"id_token": "Invalid user ID from token."},
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
    except ValueError as ve:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"profile_picture": str(ve)},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(
            {
                "success": False,
                "message": "An error occurred during signup.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@api_view(["GET"])
def verify_app_check_token_view(request: Request) -> Response:

    result = authenticate_app_check_token(request)

    if not result.get("success"):
        return Response(result, status=status.HTTP_401_UNAUTHORIZED)

    return Response(result, status=status.HTTP_200_OK)

@api_view(["POST"])
def verify_id_token_view(request: Request) -> Response:

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

    result = verify_id_token(id_token)

    if not result.get("success"):
        return Response(result, status=status.HTTP_400_BAD_REQUEST)

    return Response(result, status=status.HTTP_200_OK)
