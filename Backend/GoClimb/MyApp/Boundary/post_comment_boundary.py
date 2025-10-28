from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.decorators import api_view
from rest_framework import status

from MyApp.Firebase.helpers import authenticate_app_check_token
from MyApp.Exceptions.exceptions import BadRequestException
from MyApp.Serializer.serializers import PostCommentSerializer
from MyApp.Controller.post_comment_controller import (
    create_post_comment,
    delete_post_comment,
    get_post_comments_by_post_id,
    get_post_comments_by_user_id,
)

from django.core.exceptions import ObjectDoesNotExist


@api_view(["POST"])
def create_post_comment_view(request: Request) -> Response:
    app_check = authenticate_app_check_token(request)

    if not app_check.get("success"):
        return Response(app_check, status=status.HTTP_401_UNAUTHORIZED)

    data = request.data if isinstance(request.data, dict) else {}

    try:
        result = create_post_comment(data)

        return Response(
            {"success": True, "data": result}, status=status.HTTP_201_CREATED
        )
    except ValueError as ve:
        return Response(
            {"success": False, "message": str(ve)}, status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {"success": False, "message": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["DELETE"])
def delete_post_comment_view(request: Request) -> Response:
    app_check = authenticate_app_check_token(request)

    if not app_check.get("success"):
        return Response(app_check, status=status.HTTP_401_UNAUTHORIZED)

    data = request.data if isinstance(request.data, dict) else {}

    try:
        result = delete_post_comment(data)

        return Response({"success": True, "data": result}, status=status.HTTP_200_OK)

    except BadRequestException as e:
        return Response(
            {"success": False, "message": str(e)}, status=status.HTTP_400_BAD_REQUEST
        )

    except ObjectDoesNotExist as e:
        return Response(
            {"success": False, "message": str(e)}, status=status.HTTP_400_BAD_REQUEST
        )

    except Exception as e:
        return Response(
            {"success": False, "message": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def get_post_comments_by_post_id_view(request: Request) -> Response:
    app_check = authenticate_app_check_token(request)

    if not app_check.get("success"):
        return Response(app_check, status=status.HTTP_401_UNAUTHORIZED)

    data = request.data if request.method != "GET" else request.query_params
    data = data if isinstance(data, dict) else {}

    try:
        result = get_post_comments_by_post_id(data)

        serializer = PostCommentSerializer(result, many=True)

        return Response(
            {"success": True, "data": serializer.data}, status=status.HTTP_200_OK
        )

    except BadRequestException as e:
        return Response(
            {"success": False, "message": str(e)}, status=status.HTTP_400_BAD_REQUEST
        )

    except ObjectDoesNotExist as e:
        return Response(
            {"success": False, "message": str(e)}, status=status.HTTP_400_BAD_REQUEST
        )

    except Exception as e:
        return Response(
            {"success": False, "message": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def get_post_comments_by_user_id_view(request: Request) -> Response:
    app_check = authenticate_app_check_token(request)

    if not app_check.get("success"):
        return Response(app_check, status=status.HTTP_401_UNAUTHORIZED)

    data = request.data if request.method != "GET" else request.query_params
    data = data if isinstance(data, dict) else {}

    try:
        result = get_post_comments_by_user_id(data)

        serializer = PostCommentSerializer(result, many=True)

        return Response(
            {"success": True, "data": serializer.data}, status=status.HTTP_200_OK
        )

    except BadRequestException as e:
        return Response(
            {"success": False, "message": str(e)}, status=status.HTTP_400_BAD_REQUEST
        )

    except ObjectDoesNotExist as e:
        return Response(
            {"success": False, "message": str(e)}, status=status.HTTP_400_BAD_REQUEST
        )

    except Exception as e:
        return Response(
            {"success": False, "message": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
