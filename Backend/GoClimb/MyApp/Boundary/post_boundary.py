from typing import Any

from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.decorators import api_view
from rest_framework import status

from MyApp.Controller import post_controller
from MyApp.Serializer.serializers import PostSerializer
from MyApp.Firebase.helpers import authenticate_app_check_token
from MyApp.Utils.helper import extract_files_and_clean_data


@api_view(["GET"])
def get_post_view(request: Request) -> Response:

    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)

    post_id = request.query_params.get("post_id", "").strip()
    if not post_id:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"post_id": "This field is required."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:

        post = post_controller.get_post_by_id(post_id)

        if not post:
            return Response(
                {
                    "success": False,
                    "message": "Post not found.",
                    "errors": {"post_id": "Invalid ID."},
                },
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
            {
                "success": False,
                "message": "An error occurred while fetching post.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@api_view(["POST"])
def get_random_post_view(request: Request) -> Response:

    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)

    data = request.data if isinstance(request.data, dict) else {}

    count = data.get("count", 10)
    blacklist = data.get("blacklist", [])

    try:
        count = int(count)
    except (ValueError, TypeError):
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"count": "Must be an integer."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not isinstance(blacklist, list):
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"blacklist": "Must be a list."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:

        post_list = post_controller.get_random_post(count, blacklist)

        serializer = PostSerializer(post_list, many=True)

        return Response(
            {
                "success": True,
                "message": "Posts fetched successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    except ValueError as ve:
        return Response(
            {
                "success": False,
                "message": str(ve),
                "errors": {"validation": str(ve)},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(
            {
                "success": False,
                "message": "An error occurred while fetching posts.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@api_view(["POST"])
def get_post_by_user_id_view(request: Request) -> Response:

    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)

    data = request.data if isinstance(request.data, dict) else {}

    user_id = data.get("user_id", "").strip() if isinstance(data.get("user_id"), str) else ""
    count = data.get("count", 10)
    blacklist = data.get("blacklist", [])

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
        count = int(count)
    except (ValueError, TypeError):
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"count": "Must be an integer."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not isinstance(blacklist, list):
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"blacklist": "Must be a list."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:

        post_list = post_controller.get_post_by_user_id(user_id, count, blacklist)

        serializer = PostSerializer(post_list, many=True)

        return Response(
            {
                "success": True,
                "message": "Posts fetched successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    except ValueError as ve:
        return Response(
            {
                "success": False,
                "message": str(ve),
                "errors": {"validation": str(ve)},
            },
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        return Response(
            {
                "success": False,
                "message": "An error occurred while fetching posts.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@api_view(["POST"])
def create_post_view(request: Request) -> Response:

    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)

    # Extract files and clean form data for normal serializer usage
    images, clean_data = extract_files_and_clean_data(request)
    
    # Basic validation
    user_id = clean_data.get("user_id", "")
    content = clean_data.get("content", "")
    
    if not user_id:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"user_id": "This field is required."},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if not content:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"content": "This field is required."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:

        post = post_controller.create_post(user_id, clean_data, images)

        serializer = PostSerializer(post)

        return Response(
            {
                "success": True,
                "message": "Post created successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    except ValueError as user_error:
        if "User not found" in str(user_error):
            return Response(
                {
                    "success": False,
                    "message": "User not found.",
                    "errors": {"user_id": "Invalid user ID."},
                },
                status=status.HTTP_404_NOT_FOUND,
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
                "message": "An error occurred while creating post.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@api_view(["DELETE"])
def delete_post_view(request: Request) -> Response:

    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)

    data = request.data if isinstance(request.data, dict) else {}
    post_id = data.get("post_id", "").strip() if isinstance(data.get("post_id"), str) else ""

    if not post_id:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"post_id": "This field is required."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:

        success = post_controller.delete_post(post_id)

        if success:
            return Response(
                {
                    "success": True,
                    "message": "Post deleted successfully.",
                },
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {
                    "success": False,
                    "message": "Post not found.",
                    "errors": {"post_id": "Invalid ID."},
                },
                status=status.HTTP_404_NOT_FOUND,
            )

    except ValueError as ve:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"post_id": str(ve)},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(
            {
                "success": False,
                "message": "An error occurred while deleting post.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )