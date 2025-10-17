# MyApp/Boundary/post_boundary.py

from typing import Any, Optional, Dict, Tuple

from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.decorators import api_view
from rest_framework import status

from MyApp.Controller import post_controller
from MyApp.Utils.helper import authenticate_app_check_token, verify_id_token
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


@api_view(["POST"])
def get_post_by_user_id_view(request: Request) -> Response:
    """
        Method: POST (blacklist may get huge)

        INPUT:
        {
        user_id:str
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

    user_id: str = data.get("user_id", "")
    count_str: int = data.get("count", 10)
    count: int = int(count_str)
    blacklist: list[str] = data.get("blacklist", [])

    required_fields: dict = {
        "user_id": user_id,
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
        post_list = post_controller.get_post_by_user_id(user_id, count, blacklist)
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


# -----------------
# ADMIN - 1 (start)
# -----------------
from typing import Any, Dict
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status

from MyApp.Utils.helper import authenticate_app_check_token
from MyApp.Controller.post_controller import delete_post


def _parse_post_id(raw) -> int:
    """
    Accepts an int-like value or a string like 'POST-123'.
    Raises ValueError if not parseable.
    """
    if isinstance(raw, str) and raw.startswith("POST-"):
        raw = raw.split("POST-", 1)[1]
    return int(raw)


@api_view(["DELETE"])
def delete_post_view(request: Request) -> Response:
    """
    DELETE /post_delete/

    Input (body OR query-string):
    {
      "post_id": int
    }

    Output (success):
    {
      "success": true,
      "data": { "post_id": 123 },
      "message": "Post deleted successfully",
      "errors": []
    }

    Output (failure):
    {
      "success": false,
      "message": "...",
      "errors": { ... }
    }
    """

    # 1) App Check (authorization/authentication gate)
    result: Dict[str, Any] = authenticate_app_check_token(request)
    if not result.get("success"):
        # let helper's message/errors pass through
        return Response(result, status=status.HTTP_401_UNAUTHORIZED)

    """
    # 2) get post_id (accept from JSON body or ?post_id=)
    raw_id = request.data.get("post_id", None)
    if raw_id is None:
        raw_id = request.query_params.get("post_id", None)

    # validate to int
    try:
        post_id = int(raw_id)
    except (TypeError, ValueError):
        return Response(
            {
                "success": False,
                "message": "Invalid post_id.",
                "errors": {"post_id": "This field is required and must be an integer."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    """

    raw_id = request.data.get("post_id", None)
    if raw_id is None:
        raw_id = request.query_params.get("post_id", None)

    try:
        post_id = _parse_post_id(raw_id)
    except (TypeError, ValueError):
        return Response(
            {
                "success": False,
                "message": "Invalid post_id.",
                "errors": {"post_id": "Must be an integer or 'POST-<int>'."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # 3) delegate to controller
    response = delete_post(post_id)

    # 4) map to HTTP status
    http_status = (
        status.HTTP_200_OK if response.get("success") else status.HTTP_400_BAD_REQUEST
    )
    return Response(response, status=http_status)


# ----------------
# ADMIN - 1 (end)
# ----------------

# -----------------
# ADMIN - 4 (start)
# -----------------
from MyApp.Controller.post_controller import get_posts_by_member


def _normalize_member_id(raw: Any) -> Optional[str]:
    """
    Accepts: "55", 55, "USER-55", or any non-empty string user_id (e.g., UUID).
    Returns normalized string or None if invalid/missing.
    """
    if raw is None:
        return None
    if isinstance(raw, int):
        return str(raw)
    if isinstance(raw, str):
        s = raw.strip()
        if not s:
            return None
        if s.upper().startswith("USER-"):
            s = s[5:].strip()
        return s or None
    return None


@api_view(["GET"])
def get_member_posts_view(request) -> Response:
    """
    GET /posts_by_member?member_id=<id>[&limit=10]

    200:
    {
      "success": true,
      "data": [{"post_id": 123, "media_url": "...", "caption": "..."}],
      "message": "Posts retrieved",
      "errors": []
    }
    400 on invalid input, 401 on failed app check.
    """
    # 1) App Check
    result: Dict[str, Any] = authenticate_app_check_token(request)
    if not result.get("success"):
        return Response(
            {
                "success": False,
                "message": result.get("message", "Unauthorized."),
                "errors": result.get("errors", {}),
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # 2) Validate query params
    member_id = _normalize_member_id(request.query_params.get("member_id"))
    if member_id is None:
        return Response(
            {
                "success": False,
                "message": "Invalid member_id.",
                "errors": {
                    "member_id": "This query param is required and must be a valid identifier."
                },
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    limit_val: Optional[int] = None
    raw_limit = request.query_params.get("limit")
    if raw_limit:
        try:
            limit_val = int(raw_limit)
            if limit_val < 1:
                raise ValueError
        except ValueError:
            return Response(
                {
                    "success": False,
                    "message": "Invalid limit.",
                    "errors": {"limit": "Must be a positive integer."},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    # 3) Fetch
    payload = get_posts_by_member(member_id, limit=limit_val)
    return Response(payload, status=status.HTTP_200_OK)


# ---------------
# ADMIN - 4 (end)
# ---------------

# ------------------
# MEMBER - 2 (start)
# ------------------
from MyApp.Controller.post_controller import (
    _parse_post_id_to_int,
    like_post,
    unlike_post,
    get_likes_count,
    get_likes_users,
)


def _require_appcheck(request: Request) -> Tuple[bool, Response]:
    result: Dict[str, Any] = authenticate_app_check_token(request)
    if not result.get("success"):
        return False, Response(
            {"success": False, "message": result.get("message", "Unauthorized.")},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    return True, None  # type: ignore


def _require_uid_from_id_token(
    request: Request,
) -> Tuple[bool, str | None, Response | None]:
    ok, resp = _require_appcheck(request)
    if not ok:
        return False, None, resp

    id_token = request.data.get("id_token")
    if not isinstance(id_token, str) or not id_token.strip():
        return (
            False,
            None,
            Response(
                {
                    "success": False,
                    "message": "Invalid or missing id_token.",
                    "errors": {
                        "id_token": "This field is required and must be a non-empty string."
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            ),
        )
    verified = verify_id_token(id_token)
    if not verified or not verified.get("success") or not verified.get("uid"):
        return (
            False,
            None,
            Response(
                {
                    "success": False,
                    "message": (verified or {}).get(
                        "message", "Failed to verify id_token."
                    ),
                },
                status=status.HTTP_401_UNAUTHORIZED,
            ),
        )
    return True, verified["uid"], None


@api_view(["POST"])
def like_post_view(request: Request) -> Response:
    # App Check (authorization/authentication gate)
    result: Dict[str, Any] = authenticate_app_check_token(request)
    if not result.get("success"):
        # let helper's message/errors pass through
        return Response(result, status=status.HTTP_401_UNAUTHORIZED)

    uid = request.data.get("user_id", "")

    post_id_val = request.data.get("post_id")
    ok, post_id_int, err = _parse_post_id_to_int(post_id_val)
    if not ok:
        return Response(
            {
                "success": False,
                "message": "Invalid post_id.",
                "errors": {"post_id": err},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    result = like_post(uid, post_id_int)  # type: ignore[arg-type]
    return Response(
        result,
        status=(
            status.HTTP_200_OK if result.get("success") else status.HTTP_400_BAD_REQUEST
        ),
    )


@api_view(["POST"])
def unlike_post_view(request: Request) -> Response:
    # App Check (authorization/authentication gate)
    result: Dict[str, Any] = authenticate_app_check_token(request)
    if not result.get("success"):
        # let helper's message/errors pass through
        return Response(result, status=status.HTTP_401_UNAUTHORIZED)

    uid = request.data.get("user_id", "")

    post_id_val = request.data.get("post_id")
    ok, post_id_int, err = _parse_post_id_to_int(post_id_val)
    if not ok:
        return Response(
            {
                "success": False,
                "message": "Invalid post_id.",
                "errors": {"post_id": err},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    result = unlike_post(uid, post_id_int)  # type: ignore[arg-type]
    return Response(
        result,
        status=(
            status.HTTP_200_OK if result.get("success") else status.HTTP_400_BAD_REQUEST
        ),
    )


@api_view(["GET"])
def post_likes_count_view(request: Request) -> Response:
    ok, error_resp = _require_appcheck(request)
    if not ok:
        return error_resp  # type: ignore

    post_id_val = request.query_params.get("post_id")
    ok, post_id_int, err = _parse_post_id_to_int(post_id_val)
    if not ok:
        return Response(
            {
                "success": False,
                "message": "Invalid post_id.",
                "errors": {"post_id": err},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    result = get_likes_count(post_id_int)  # type: ignore[arg-type]
    return Response(
        result,
        status=(
            status.HTTP_200_OK if result.get("success") else status.HTTP_400_BAD_REQUEST
        ),
    )


@api_view(["GET"])
def post_likes_users_view(request: Request) -> Response:
    ok, error_resp = _require_appcheck(request)
    if not ok:
        return error_resp  # type: ignore

    post_id_val = request.query_params.get("post_id")
    ok, post_id_int, err = _parse_post_id_to_int(post_id_val)
    if not ok:
        return Response(
            {
                "success": False,
                "message": "Invalid post_id.",
                "errors": {"post_id": err},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    def _to_int(val, default):
        try:
            return int(val)
        except Exception:
            return default

    page = _to_int(request.query_params.get("page", 1), 1)
    page_size = _to_int(request.query_params.get("page_size", 50), 50)

    result = get_likes_users(post_id_int, page=page, page_size=page_size)  # type: ignore[arg-type]
    return Response(
        result,
        status=(
            status.HTTP_200_OK if result.get("success") else status.HTTP_400_BAD_REQUEST
        ),
    )


# ----------------
# MEMBER - 2 (end)
# ----------------

from MyApp.Entity.user import User
from MyApp.Controller.post_controller import create_post


@api_view(["POST"])
def create_post_view(request):
    """
    Create a new post by specifying a user ID in request data.
    input:
    {
        "user_id":,
        "content": ,
        "tags": [],
        "image_urls": []
    }
    output:
    {
        "success": bool,
        "message": str,
        "data": {
            "post_id": int,
            "media_url": str,
            "caption": str
        },
        "errors": dict[str, Any]   # present only when success is False
    }
    """

    result: dict = authenticate_app_check_token(request)

    if not result.get("success"):
        return Response(result, status=status.HTTP_401_UNAUTHORIZED)

    user_id = request.data.get("user_id", "")

    required_fields: dict = {
        "user_id": user_id,
        "content": request.data.get("content"),
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
        success: bool = create_post(user_id, request.data)

        if success:
            return Response(
                {
                    "success": True,
                    "message": "Post created successfully.",
                    "data": result,
                },
                status=status.HTTP_201_CREATED,
            )

        return (
            Response(
                {
                    "success": False,
                    "message": "Post creation failed.",
                    "data": None,
                }
            ),
        )
    except User.DoesNotExist as e:
        return Response(
            {"success": False, "message": str(e)},
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        return Response(
            {"success": False, "message": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
