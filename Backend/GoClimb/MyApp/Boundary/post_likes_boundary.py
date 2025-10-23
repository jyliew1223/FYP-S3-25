# MyApp/Boundary/post_likes_boundary.py

from typing import Any, Dict, Optional, List
from django.db import IntegrityError
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from MyApp.Entity.post import Post
from MyApp.Entity.post_likes import PostLike  
from MyApp.Firebase.helpers import authenticate_app_check_token  # app-check
from MyApp.Firebase.helpers import parse_prefixed_int  # we already added this helper



def _get_post_id(value: Any) -> Optional[int]:
    """
    Accepts 123 or 'POST-123'. Returns int or None.
    """
    return parse_prefixed_int(value, "POST")


@api_view(["POST"])
def like_post_view(request):
    """
    INPUT:  { "post_id": 123 | "POST-123", "user_id": "<uuid or string>" }
    OUTPUT: 200 OK on success
    """
    # 1) App Check
    auth = authenticate_app_check_token(request)
    if not auth.get("success"):
        return Response(
            {"success": False, "message": auth.get("message", "Unauthorized.")},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    post_id = _get_post_id(request.data.get("post_id"))
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

    # 2) Ensure post exists
    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        return Response(
            {"success": False, "message": "Post not found.", "errors": {"post_id": "Invalid ID."}},
            status=status.HTTP_404_NOT_FOUND,
        )

    # 3) Create like idempotently
    try:
        PostLike.objects.get_or_create(post=post, user_id=user_id.strip())
    except IntegrityError:
        # unique_together(post, user) might throw under race; treat as success
        pass

    return Response(
        {"success": True, "data": {}, "message": "Post liked", "errors": []},
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
def unlike_post_view(request):
    """
    INPUT:  { "post_id": 123 | "POST-123", "user_id": "<uuid or string>" }
    OUTPUT: 200 OK even if like didn’t exist (idempotent)
    """
    auth = authenticate_app_check_token(request)
    if not auth.get("success"):
        return Response(
            {"success": False, "message": auth.get("message", "Unauthorized.")},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    post_id = _get_post_id(request.data.get("post_id"))
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

    # Delete any matching records (idempotent)
    PostLike.objects.filter(post_id=post_id, user_id=user_id.strip()).delete()

    return Response(
        {"success": True, "data": {}, "message": "Post unliked", "errors": []},
        status=status.HTTP_200_OK,
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

    post_id = _get_post_id(request.query_params.get("post_id"))
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

    post_id = _get_post_id(request.query_params.get("post_id"))
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
    user_ids = PostLike.objects.filter(post_id=post_id).values_list("user_id", flat=True)
    users: List[Dict[str, str]] = [{"user_id": uid} for uid in user_ids]

    return Response(
        {"success": True, "data": {"users": users}, "message": "OK", "errors": []},
        status=status.HTTP_200_OK,
    )