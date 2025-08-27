# MyApp/Boundary/user_boundary.py

from typing import cast, Any
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.decorators import api_view
from rest_framework import status
from MyApp.Serializer.serializers import UserSerializer
from MyApp.Controller.user_control import signup_user
from MyApp.Utils.helper import authenticate_app_check_token

''' Yehuda
from MyApp.Utils.helper import verify_id_token, get_user_model
from MyApp.Controller.user_control import update_user_info
'''


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


''' Yehuda
@api_view(["POST"])
def update_user_info_view(request: Request) -> Response:
    """
    #User03 Update Info
    Method: POST
    Input:
    {
        "id_token": str,
        "field": str,
        "data": str
    }
    Output:
    {
        "success": bool,
        "message": str,
        "errors": dict[str, Any]   # only when success is False
    }
    """
    # Step 1 – Verify App Check
    app_check = authenticate_app_check_token(request)
    if not app_check.get("success"):
        payload = {
            "success": False,
            "message": app_check.get("message", "App Check token verification failed."),
            "errors": cast(dict[str, Any], app_check.get("errors", {})),
        }
        return Response(payload, status=status.HTTP_401_UNAUTHORIZED)

    # Step 2 – Extract request data
    data = request.data if isinstance(request.data, dict) else {}
    raw_id_token = data.get("id_token", "")
    field = data.get("field")
    new_value = data.get("data")

    if not raw_id_token or not isinstance(raw_id_token, str):
        return Response(
            {
                "success": False,
                "message": "Missing or invalid 'id_token'.",
                "errors": {"id_token": ["A valid Firebase ID token is required."]},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Step 3 – Verify ID Token and get UID
    token_result = verify_id_token(raw_id_token)
    if not token_result.get("success"):
        return Response(
            {
                "success": False,
                "message": token_result.get("message", "ID token verification failed."),
                "errors": cast(dict[str, Any], token_result.get("errors", {})),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    user_id: str = token_result.get("uid", "")
    if not user_id:
        return Response(
            {
                "success": False,
                "message": "Unable to extract user ID from token.",
                "errors": {"id_token": ["UID missing in token."]},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Step 4 – Delegate to controller
    result = update_user_info(user_id=user_id, field=field, value=new_value)

    if result.get("success"):
        return Response(result, status=status.HTTP_200_OK)

    return Response(result, status=status.HTTP_400_BAD_REQUEST)
'''