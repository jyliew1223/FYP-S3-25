# MyApp/Boundary/post_boundary.py

from typing import Any, Optional

from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.decorators import api_view
from rest_framework import status

from MyApp.Controller import post_controller
from MyApp.Utils.helper import authenticate_app_check_token
from MyApp.Serializer.serializers import PostSerializer


@api_view(["GET"])
def get_post_view(request: Request) -> Response:
    """
    INPUT: ?post_id=str
    OUTPUT:{
        "success": bool,
        "message": str
        "errors": dict[str, Any]  # Only if success is False
    }
    """
    result: dict = authenticate_app_check_token(request)

    if not result.get("success"):
        return Response(result, status=status.HTTP_401_UNAUTHORIZED)

    post_id = request.query_params.get("post_id", "")

    required_fields: dict = {
        "post_id": post_id,
    }

    if not all(required_fields.values()):
        return Response(
            {
                "success": False,
                "message": "Missing required fields.",
                "errors": {
                    k: "This field is required."
                    for k, v in required_fields.items()
                    if not v
                },
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        post = post_controller.get_post_by_id(post_id)
        if not post:
            return Response(
                {"success": False, "message": "Post not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = PostSerializer(post)

        return Response(
            {
                "success": True,
                "message": "Post fetched successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        return Response(
            {"success": False, "message": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
def get_random_post_view(request: Request) -> Response:
    """
        Method: POST (blacklist may get huge)

        INPUT:
        {
        count: int,
        blacklist:[list of post_id]
        }

        OUTPUT:
        {
        'success' : bool
        'message' : str
        'data' :[
            {
                post_data....
            },
            {
                post_data
            }
            ]
        'errors': # Only if success is False
        }


        Expected Status:
        200_OK
        400_Bad Request
        401_Unauthorzed

        Note:
        use 200_OK for empty list
    }
    """
    result: dict = authenticate_app_check_token(request)

    if not result.get("success"):
        return Response(result, status=status.HTTP_401_UNAUTHORIZED)

    data: dict[str, Any] = request.data if isinstance(request.data, dict) else {}

    count_str: str = data.get("count", 10)
    count: int = int(count_str)
    blacklist: list[str] = data.get("blacklist", [])

    required_fields: dict = {
        "count": count,
    }

    for field_name, value in required_fields.items():
        if not value:
            return Response(
                {
                    "success": False,
                    "message": "missing field",
                    "errors": f"{field_name} is required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    try:
        post_list = post_controller.get_random_post(count, blacklist)
        serializer = PostSerializer(post_list, many=True)
        serialized_data = serializer.data if isinstance(serializer.data, list) else []

        if not serialized_data:
            return Response(
                {
                    "success": True,
                    "message": "No posts available.",
                    "data": [],
                },
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {
                    "success": True,
                    "message": "Posts fetched successfully.",
                    "data": serialized_data,
                },
                status=status.HTTP_200_OK,
            )
    except ValueError as ve:
        return Response(
            {
                "success": False,
                "message": str(ve),
                "errors": {"ValueError": str(ve)},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except IndexError as ie:
        return Response(
            {
                "success": False,
                "message": str(ie),
                "errors": {"IndexError": str(ie)},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(
            {
                "success": False,
                "message": str(e),
                "errors": {"Exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
