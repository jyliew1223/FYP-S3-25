# MyApp/Boundary/post_boundary.py

from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.decorators import api_view
from rest_framework import status

from MyApp.Controller.post_controller import get_post_by_id
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
        post = get_post_by_id(post_id)
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