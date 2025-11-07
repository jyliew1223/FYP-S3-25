from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.decorators import api_view
from rest_framework import status

from MyApp.Firebase.helpers import authenticate_app_check_token
from MyApp.Serializer.serializers import PostCommentSerializer
from MyApp.Controller import post_comment_controller

from django.core.exceptions import ObjectDoesNotExist

@api_view(["POST"])
def create_post_comment_view(request: Request) -> Response:

    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)

    data = request.data if isinstance(request.data, dict) else {}

    try:

        comment = post_comment_controller.create_post_comment(data)

        serializer = PostCommentSerializer(comment)

        return Response(
            {
                "success": True,
                "message": "Comment created successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_201_CREATED,
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
                "message": "An error occurred while creating comment.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@api_view(["DELETE"])
def delete_post_comment_view(request: Request) -> Response:

    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)

    comment_id = request.data.get("comment_id", "").strip() if isinstance(request.data.get("comment_id"), str) else ""

    if not comment_id:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"comment_id": "This field is required."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:

        post_comment_controller.delete_post_comment(comment_id)

        return Response(
            {
                "success": True,
                "message": "Comment deleted successfully.",
            },
            status=status.HTTP_200_OK,
        )

    except ValueError as ve:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"comment_id": str(ve)},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except ObjectDoesNotExist:
        return Response(
            {
                "success": False,
                "message": "Comment not found.",
                "errors": {"comment_id": "Invalid ID."},
            },
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        return Response(
            {
                "success": False,
                "message": "An error occurred while deleting comment.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@api_view(["GET"])
def get_post_comments_by_post_id_view(request: Request) -> Response:

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

        comments = post_comment_controller.get_post_comments_by_post_id(post_id)

        serializer = PostCommentSerializer(comments, many=True)

        return Response(
            {
                "success": True,
                "message": "Comments fetched successfully.",
                "data": serializer.data,
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
                "message": "An error occurred while fetching comments.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@api_view(["GET"])
def get_post_comments_by_user_id_view(request: Request) -> Response:

    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)

    user_id = request.query_params.get("user_id", "").strip()

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

        comments = post_comment_controller.get_post_comments_by_user_id(user_id)

        serializer = PostCommentSerializer(comments, many=True)

        return Response(
            {
                "success": True,
                "message": "Comments fetched successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    except ValueError as ve:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"user_id": str(ve)},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(
            {
                "success": False,
                "message": "An error occurred while fetching comments.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
