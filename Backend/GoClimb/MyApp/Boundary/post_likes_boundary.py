# MyApp/Boundary/post_likes_boundary.py

from typing import Any, Dict, Optional, List
from django.db import IntegrityError
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from MyApp.Entity.post import Post
from MyApp.Entity.post_likes import PostLike
from MyApp.Serializer.serializers import PostLikeSerializer
from MyApp.Firebase.helpers import authenticate_app_check_token  # app-check
from MyApp.Utils.helper import PrefixedIDConverter


@api_view(["POST"])
def like_post_view(request):
    """
    INPUT:  { "post_id": 123 | "POST-123", "user_id": "<uuid or string>" }
    OUTPUT: 200 OK on success
    """
    try:
        auth = authenticate_app_check_token(request)
        if not auth.get("success"):
            return Response(
                {"success": False, "message": auth.get("message", "Unauthorized.")},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        post_id = request.data.get("post_id")
        user_id = request.data.get("user_id").strip()

        if post_id is None or not isinstance(user_id, str) or not user_id.strip():
            return Response(
                {
                    "success": False,
                    "message": "Invalid input.",
                    "errors": {
                        "post_id": "Must be an integer or 'POST-<int>'.",
                        "user_id": "Must be a non-empty string.",
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            serializer = PostLikeSerializer(data=request.data)

            if serializer.is_valid():
                serializer.save()
                return Response(
                    {"success": True, "data": {}, "message": "Post liked", "errors": []},
                    status=status.HTTP_200_OK,
                )

            return Response(
                {
                    "success": False,
                    "message": "Invalid input.",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Post.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Post not found.",
                    "errors": {"post_id": "Invalid ID."},
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        except IntegrityError as ie:
            return Response(
                {
                    "success": False,
                    "message": "IntegrityError",
                    "errors": ie,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
    except Exception as e:
            return Response(
                {
                    "success": False,
                    "message": "IntegrityError",
                    "errors": e,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

@api_view(["POST"])
def unlike_post_view(request):
    """
    INPUT:  { "post_id": 123 | "POST-123", "user_id": "<uuid or string>" }
    OUTPUT: 200 OK even if like didn’t exist (idempotent)
    """
    try:
        auth = authenticate_app_check_token(request)
        if not auth.get("success"):
            return Response(
                {"success": False, "message": auth.get("message", "Unauthorized.")},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        post_id = request.data.get("post_id")
        user_id = request.data.get("user_id")

        if post_id is None or not isinstance(user_id, str) or not user_id.strip():
            return Response(
                {
                    "success": False,
                    "message": "Invalid input.",
                    "errors": {
                        "post_id": "Must be an integer or 'POST-<int>'.",
                        "user_id": "Must be a non-empty string.",
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        post_id = PrefixedIDConverter.to_raw_id(post_id)
        PostLike.objects.filter(post_id=post_id, user_id=user_id.strip()).delete()

        return Response(
            {"success": True, "data": {}, "message": "Post unliked", "errors": []},
            status=status.HTTP_200_OK,
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


@api_view(["GET"])
def post_likes_count_view(request):
    """
    QUERY:  ?post_id=123 or ?post_id=POST-123
    OUTPUT: { "count": <int> }
    """
    auth = authenticate_app_check_token(request)
    if not auth.get("success"):
        return Response(
            {"success": False, "message": auth.get("message", "Unauthorized.")},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    post_id = request.query_params.get("post_id")
    if post_id is None:
        return Response(
            {
                "success": False,
                "message": "Invalid post_id.",
                "errors": {"post_id": "Must be an integer or 'POST-<int>'."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    count = PostLike.objects.filter(post_id=post_id).count()
    return Response(
        {"success": True, "data": {"count": count}, "message": "OK", "errors": []},
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
def post_likes_users_view(request):
    """
    QUERY:  ?post_id=123 (or POST-123)
    OUTPUT: { "users": [ {"user_id": "u-1"}, {"user_id": "u-2"}, ... ] }
    """
    auth = authenticate_app_check_token(request)
    if not auth.get("success"):
        return Response(
            {"success": False, "message": auth.get("message", "Unauthorized.")},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    post_id = request.query_params.get("post_id")
    if post_id is None:
        return Response(
            {
                "success": False,
                "message": "Invalid post_id.",
                "errors": {"post_id": "Must be an integer or 'POST-<int>'."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Fetch user_ids and wrap each as an object to match the test expectation
    user_ids = PostLike.objects.filter(post_id=post_id).values_list(
        "user_id", flat=True
    )
    users: List[Dict[str, str]] = [{"user_id": uid} for uid in user_ids]

    return Response(
        {"success": True, "data": {"users": users}, "message": "OK", "errors": []},
        status=status.HTTP_200_OK,
    )
