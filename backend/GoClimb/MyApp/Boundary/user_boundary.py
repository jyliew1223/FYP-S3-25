# MyApp/Boundary/user_boundary.py

from typing import cast, Any

from firebase_admin import auth

from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.decorators import api_view
from rest_framework import status

from MyApp.Serializer.serializers import UserSerializer
from MyApp.Controller.user_control import signup_user, get_user_by_id
from MyApp.Exceptions.exceptions import UserAlreadyExistsError, InvalidUIDError
from MyApp.Utils.helper import authenticate_app_check_token


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


@api_view(["POST"])
def get_user_view(request: Request) -> Response:
    """
    Input:
    {
    id_token : (str)
    }

    Output:
    {
    'success' : bool
    'message' : str
    'data' : { user details except user_id in JSON}
    "errors": dict[str, Any] # Only if success is False
    }

    Expected Status:
    200_OK
    404_Not Found
    400_Bad Request
    401_Unauthorzed
    """
    app_check: dict[str, Any] = authenticate_app_check_token(request)

    if not app_check.get("success"):
        return Response(app_check, status=status.HTTP_401_UNAUTHORIZED)

    data: dict[str, Any] = request.data if isinstance(request.data, dict) else {}

    id_token: str = str(data.get("id_token", ""))

    required_fields: dict = {"id_token": id_token}

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
        user = get_user_by_id(id_token)
        if user is None:
            return Response(
                {
                    "success": False,
                    "message": "User not found.",
                    "data": None,
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = UserSerializer(user)
        user_data = serializer.data
        if isinstance(user_data, dict) and "user_id" in user_data:
            del user_data["user_id"]

        return Response(
            {
                "success": True,
                "message": "User fetched successfully.",
                "data": user_data,
            },
            status=status.HTTP_200_OK,
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
