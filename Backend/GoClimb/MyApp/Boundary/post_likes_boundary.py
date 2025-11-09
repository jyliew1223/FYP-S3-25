from typing import List, Dict
from django.db import IntegrityError
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status

from MyApp.Controller import post_likes_controller
from MyApp.Serializer.serializers import PostLikeSerializer
from MyApp.Firebase.helpers import authenticate_app_check_token

@api_view(["POST"])
def like_post_view(request: Request) -> Response:

    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)

    post_id = request.data.get("post_id")
    user_id = request.data.get("user_id", "").strip() if isinstance(request.data.get("user_id"), str) else ""

    if post_id is None or not user_id:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {
                    "post_id": "This field is required." if post_id is None else None,
                    "user_id": "This field is required." if not user_id else None,
                },
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:

        post_like = post_likes_controller.like_post(post_id, user_id)

        serializer = PostLikeSerializer(post_like)

        return Response(
            {
                "success": True,
                "message": "Post liked successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
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
    except IntegrityError:
        return Response(
            {
                "success": False,
                "message": "Post already liked by this user.",
                "errors": {"duplicate": "Like already exists."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except ObjectDoesNotExist:
        return Response(
            {
                "success": False,
                "message": "Post not found.",
                "errors": {"post_id": "Invalid ID."},
            },
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        return Response(
            {
                "success": False,
                "message": "An error occurred while liking post.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@api_view(["POST"])
def unlike_post_view(request: Request) -> Response:

    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)

    post_id = request.data.get("post_id")
    user_id = request.data.get("user_id", "").strip() if isinstance(request.data.get("user_id"), str) else ""

    if post_id is None or not user_id:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {
                    "post_id": "This field is required." if post_id is None else None,
                    "user_id": "This field is required." if not user_id else None,
                },
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:

        post_likes_controller.unlike_post(post_id, user_id)

        return Response(
            {
                "success": True,
                "message": "Post unliked successfully.",
            },
            status=status.HTTP_200_OK,
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
                "message": "An error occurred while unliking post.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@api_view(["GET"])
def post_likes_count_view(request: Request) -> Response:

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

        count = post_likes_controller.get_post_likes_count(post_id)

        return Response(
            {
                "success": True,
                "message": "Likes count fetched successfully.",
                "data": {"count": count},
            },
            status=status.HTTP_200_OK,
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
                "message": "An error occurred while fetching likes count.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@api_view(["GET"])
def post_likes_users_view(request: Request) -> Response:

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

        user_ids = post_likes_controller.get_post_likes_users(post_id)

        users: List[Dict[str, str]] = [{"user_id": uid} for uid in user_ids]

        return Response(
            {
                "success": True,
                "message": "Likes users fetched successfully.",
                "data": {"users": users},
            },
            status=status.HTTP_200_OK,
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
                "message": "An error occurred while fetching likes users.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
