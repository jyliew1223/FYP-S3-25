from typing import cast, Any
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.decorators import api_view
from rest_framework import status
from MyApp.Utils.helper import authenticate_app_check_token
from MyApp.Firebase.helpers import verify_id_token

@api_view(["GET"])
def verify_app_check_token_view(request: Request) -> Response:
    """
    INPUT:{}
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

@api_view(["GET"])
def verify_id_token_view(request: Request) -> Response:
    """
    INPUT: ?id_token=(str)
    OUTPUT:{
        "success": bool,
        "message": str
        "errors": dict[str, Any]  # Only if success is False
    }
    """
    result: dict = authenticate_app_check_token(request)

    if not result.get("success"):
        return Response(result, status=status.HTTP_401_UNAUTHORIZED)
    
    id_token = request.GET.get("id_token", "")
    
    result = verify_id_token(id_token)
    
    if not result.get("success"):
        return Response(result, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(result, status=status.HTTP_200_OK)
