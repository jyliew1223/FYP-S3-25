# MyApp/Boundary/user_boundary.py

from django.http import JsonResponse, HttpRequest
import json

#####################################
# Normal HttpRequest based signup view
#####################################
# def signup_view(request:HttpRequest) -> JsonResponse:
#     if request.method != "POST":
#         return JsonResponse({"success": False, "message": "Method not allowed"}, status=405)

#     try:
#         data:dict = json.loads(request.body)
#         response:dict = signup_user(data.get("email"), data.get("password"), data.get("full_name"))

#         if response.get("success"):
#             return JsonResponse(response, status=201)
#         else:
#             return JsonResponse(response, status=400)
#     except Exception as e:
#         return JsonResponse({"success": False, "message": str(e)}, status=500)

#####################################
# Django with RESTapi framework signup view
#####################################
from typing import cast, Any
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.decorators import api_view
from rest_framework import status
from MyApp.Serializer.serializers import UserSerializer
from MyApp.Controller.user_control import signup_user, verify_user
from MyApp.Utils.helper import authenticate


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
    }
    """
    result:dict = authenticate(request)
    
    if not result.get("success"):
        return Response(result, status=status.HTTP_401_UNAUTHORIZED)
    
    serializer = UserSerializer(data=request.data)

    if serializer.is_valid():
        data: dict[str, Any] = cast(dict[str, Any], serializer.validated_data)

        response: dict[str, Any] = signup_user(
            id_token=data["id_token"],
            full_name=data["full_name"],
            email=data["email"]
        )

        if response.get("success"):
            return Response(response, status=status.HTTP_201_CREATED)
        else:
            return Response(response, status=status.HTTP_400_BAD_REQUEST)
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def signin_view(request: Request) -> Response:
    """
    INPUT:{}
    OUTPUT:{
        "success": bool,
        "message": str
    }
    """
    result:dict = authenticate(request)
    
    if not result.get("success"):
        return Response(result, status=status.HTTP_401_UNAUTHORIZED)
    
    return Response(result, status=status.HTTP_200_OK)
    
    