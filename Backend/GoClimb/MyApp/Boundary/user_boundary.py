# MyApp/Boundary/user_boundary.py

from typing import cast, Any, Dict, Optional

from firebase_admin import auth

from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.decorators import api_view
from rest_framework import status

from MyApp.Serializer.serializers import UserSerializer
from MyApp.Controller.user_controller import (
    get_user_by_id,
    get_monthly_user_ranking,
)
from MyApp.Exceptions.exceptions import InvalidUIDError
from MyApp.Utils.helper import authenticate_app_check_token


@api_view(["POST"])
def get_user_view(request: Request) -> Response:
    """
    Input:
    {
    id_token : (str)
    }

    Output:
    {
    'success' : bool
    'message' : str
    'data' : { user details except user_id in JSON}
    "errors": dict[str, Any] # Only if success is False
    }

    Expected Status:
    200_OK
    404_Not Found
    400_Bad Request
    401_Unauthorzed
    """
    app_check: dict[str, Any] = authenticate_app_check_token(request)

    if not app_check.get("success"):
        return Response(app_check, status=status.HTTP_401_UNAUTHORIZED)

    data: dict[str, Any] = request.data if isinstance(request.data, dict) else {}

    id_token: str = str(data.get("id_token", ""))

    required_fields: dict = {"id_token": id_token}

    for field_name, value in required_fields.items():
        if not value:
            return Response(
                {
                    "success": False,
                    "message": f"{field_name} is required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    try:
        user = get_user_by_id(id_token)
        if user is None:
            return Response(
                {
                    "success": False,
                    "message": "User not found.",
                    "data": None,
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = UserSerializer(user)
        user_data = serializer.data

        return Response(
            {
                "success": True,
                "message": "User fetched successfully.",
                "data": user_data,
            },
            status=status.HTTP_200_OK,
        )
    except InvalidUIDError as e:
        return Response(
            {"success": False, "message": str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except auth.InvalidIdTokenError:
        return Response(
            {"success": False, "message": "Invalid Firebase ID token."},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    except Exception as e:
        return Response(
            {"success": False, "message": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def get_monthly_user_ranking_view(request: Request) -> Response:
    """
    Method: GET

    INPUT: ?count=(int)

    OUTPUT:
        {
    'success' : bool
    'message' : str
    'data' : [
        {
            'ranking' : int
            'user_id' : int
            'user_name' : int
            'route_attempt' : int
        },
        {
            # other entries
        }
        ]
    'errors': dict[str, Any] # Only if success is False
    }
    """
    auth_result: Dict[str, Any] = authenticate_app_check_token(request)

    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)

    count_str = request.query_params.get("count", "3")
    count = int(count_str) if count_str.isdigit() else 3

    required_fields: Dict[str, Any] = {
        "count": count,
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
        ranking: list[dict[str, Any]] = get_monthly_user_ranking(count)

        if not ranking:
            return Response(
                {
                    "success": True,
                    "message": "No ranking data found.",
                    "data": [],
                },
                status=status.HTTP_200_OK,
            )

        user_ranking: list[dict[str, Any]] = []

        for row in ranking:
            user = row.get("user")
            if user:
                serialized_user = dict(UserSerializer(user).data)

                ranking_entry = {
                    "user": serialized_user,
                    "rank": row.get("ranking", 0),
                    "total_routes": row.get("total_routes", 0),
                }

                user_ranking.append(ranking_entry)

        return Response(
            {
                "success": True,
                "message": "Monthly user ranking fetched successfully.",
                "data": user_ranking,
            },
            status=status.HTTP_200_OK,
        )

    except ValueError as e:
        return Response(
            {"success": False, "message": str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except InvalidUIDError as e:
        return Response(
            {"success": False, "message": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    except Exception as e:
        return Response(
            {"success": False, "message": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


'''
# -----------------
# ADMIN - 3 (start)
# -----------------
from typing import Any, Dict, Optional
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from MyApp.Utils.helper import authenticate_app_check_token
from MyApp.Controller.user_controller import delete_profile

def _parse_profile_id(raw: Any) -> Optional[str]:
    """
    Accepts:
      - integer like: 55
      - numeric string: "55"
      - prefixed string: "USER-55" -> "55"
      - any other non-empty string -> returned as-is (covers real user_id values)
    Returns normalized string user_id, or None if invalid.
    """
    if raw is None:
        return None

    # direct int -> string
    if isinstance(raw, int):
        return str(raw)

    if isinstance(raw, str):
        s = raw.strip()
        if not s:
            return None
        if s.upper().startswith("USER-"):
            s = s[5:].strip()
        # If it looks like an int, normalize to that string; otherwise allow raw (for UUID-like keys)
        return s if s else None

    return None


@api_view(["DELETE"])
def delete_profile_view(request) -> Response:
    """
    INPUT:
      { "profile_id": 55 }  // can be int, "55", or "USER-55"; also supports real string user_id

    OUTPUT (Success): 200
      {
        "success": true,
        "data": {},
        "message": "Profile permanently deleted",
        "errors": []
      }

    OUTPUT (Failure): 400
      {
        "success": false,
        "message": "...",
        "errors": { "profile_id": " ..." }
      }

    401 when app check fails.
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

    # 2) Validate input
    raw_id = request.data.get("profile_id")
    profile_id = _parse_profile_id(raw_id)
    if profile_id is None:
        return Response(
            {
                "success": False,
                "message": "Invalid profile_id.",
                "errors": {"profile_id": "This field is required and must be a valid identifier."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # 3) Delete via controller
    outcome = delete_profile(profile_id)
    if outcome.get("success"):
        return Response(outcome, status=status.HTTP_200_OK)
    else:
        return Response(outcome, status=status.HTTP_400_BAD_REQUEST)
# ---------------
# ADMIN - 3 (end)
# ---------------
'''