from typing import cast, Any
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.decorators import api_view
from rest_framework import status

from firebase_admin import auth

from MyApp.Serializer.serializers import UserSerializer
from MyApp.Utils.helper import authenticate_app_check_token
from MyApp.Firebase.helpers import verify_id_token
from MyApp.Controller.user_controller import (
    signup_user,
)

from MyApp.Exceptions.exceptions import UserAlreadyExistsError, InvalidUIDError


@api_view(["POST"])
def signup_view(request: Request) -> Response:
    """
    INPUT:{
        "id_token": str,
        "full_name": str,
        "email": str
    }
    OUTPUT:{
        "success": bool,
        "message": str
        "errors": dict[str, Any]  # Only if success is False
    }
    """
    result: dict = authenticate_app_check_token(request)

    if not result.get("success"):
        return Response(result, status=status.HTTP_401_UNAUTHORIZED)

    data: dict[str, Any] = request.data if isinstance(request.data, dict) else {}

    allowed_fields: list = ["full_name", "email"]
    filtered_data: dict = {k: v for k, v in data.items() if k in allowed_fields}

    serializer = UserSerializer(data=filtered_data)

    if not serializer.is_valid():
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    validated_data: dict = cast(dict[str, Any], serializer.validated_data)

    id_token: str = str(data.get("id_token", ""))
    full_name = str(validated_data.get("full_name", ""))
    email = str(validated_data.get("email", ""))

    required_fields: dict = {
        "id_token": id_token,
        "full_name": full_name,
        "email": email,
    }

    for field_name, value in required_fields.items():
        if not value:
            return Response(
                {
                    "success": False,
                    "message": f"{field_name} is required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    try:
        signup_result = signup_user(id_token, full_name, email)
        if signup_result:
            return Response(
                {
                    "success": True,
                    "message": "User created successfully.",
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(
            {
                "success": False,
                "message": "Failed to create user.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    except UserAlreadyExistsError as e:
        return Response(
            {"success": False, "message": str(e)},
            status=status.HTTP_400_BAD_REQUEST,
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
            {"success": False, "message": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def verify_app_check_token_view(request: Request) -> Response:
    """
    INPUT: NIL
    OUTPUT:{
        "success": bool,
        "message": str
        "errors": dict[str, Any]  # Only if success is False
    }
    """
    result: dict = authenticate_app_check_token(request)

    if not result.get("success"):
        return Response(result, status=status.HTTP_401_UNAUTHORIZED)

    return Response(result, status=status.HTTP_200_OK)


@api_view(["POST"])
def verify_id_token_view(request: Request) -> Response:
    """
    INPUT: {
        'id_token' : str
    }
    OUTPUT:{
        "success": bool,
        "message": str
        "errors": dict[str, Any]  # Only if success is False
    }
    """
    result: dict = authenticate_app_check_token(request)

    if not result.get("success"):
        return Response(result, status=status.HTTP_401_UNAUTHORIZED)

    request_data = cast(dict[str, Any], request.data)
    id_token = request_data.get("id_token", "")

    result = verify_id_token(id_token)

    if not result.get("success"):
        return Response(result, status=status.HTTP_400_BAD_REQUEST)

    return Response(result, status=status.HTTP_200_OK)
