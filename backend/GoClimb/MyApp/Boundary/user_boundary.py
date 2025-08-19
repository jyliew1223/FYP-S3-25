# MyApp/Boundary/user_boundary.py

from typing import cast, Any
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.decorators import api_view
from rest_framework import status
from MyApp.Serializer.serializers import UserSerializer
from MyApp.Controller.user_control import signup_user
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

    allowed_fields = ["full_name", "email"]
    filtered_data = {k: v for k, v in data.items() if k in allowed_fields}

    serializer = UserSerializer(data=filtered_data)

    if serializer.is_valid():
        validated_data = cast(dict[str, Any], serializer.validated_data)

        id_token: str = str(data.get("id_token", ""))
        full_name = str(validated_data.get("full_name", ""))
        email = str(validated_data.get("email", ""))

        response: dict[str, Any] = signup_user(id_token, full_name, email)

        if response.get("success"):
            return Response(response, status=status.HTTP_201_CREATED)
        else:
            return Response(response, status=status.HTTP_400_BAD_REQUEST)
    else:
        error_response: dict[str, Any] = {
            "success": False,
            "message": "Invalid data provided.",
            "errors": serializer.errors,
        }
        return Response(error_response, status=status.HTTP_400_BAD_REQUEST)
