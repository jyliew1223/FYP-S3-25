# MyApp/Boundary/crag_info.py
from typing import Any, Optional
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.decorators import api_view
from rest_framework import status

# Serializers
from MyApp.Serializer.serializers import CragSerializer

# Utils
from MyApp.Firebase.helpers import authenticate_app_check_token

from MyApp.Controller import crag_controller


@api_view(["GET"])
def get_crag_info_view(request: Request) -> Response:
    """GET /crag_info?crag_id=str"""
    result: dict = authenticate_app_check_token(request)
    if not result.get("success"):
        return Response(result, status=status.HTTP_401_UNAUTHORIZED)

    crag_id = request.query_params.get("crag_id", "")
    if not crag_id:
        return Response(
            {
                "success": False,
                "message": "Missing crag_id.",
                "errors": {"crag_id": "This field is required."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        crag = crag_controller.get_crag_info(crag_id)
        if not crag:
            return Response(
                {"success": False, "message": "Crag not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CragSerializer(crag)

        return Response(
            {
                "success": True,
                "message": "Crag info fetched successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        return Response(
            {"success": False, "message": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def get_crag_monthly_ranking_view(request: Request) -> Response:
    """GET /crag_monthly_ranking?count=int"""
    result: dict = authenticate_app_check_token(request)
    if not result.get("success"):
        return Response(result, status=status.HTTP_401_UNAUTHORIZED)

    count_param = request.query_params.get("count")
    try:
        count = int(count_param) if count_param is not None else 0
    except ValueError:
        return Response(
            {
                "success": False,
                "message": "Invalid count value.",
                "errors": {"count": "count must be an integer."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        crag_list: list = crag_controller.get_monthly_ranking(count)

        serialized_data = []
        for idx, item in enumerate(crag_list, 1):
            if hasattr(item, "_meta"):
                crag_data = CragSerializer(item).data
            elif isinstance(item, dict):
                crag_data = dict(item)
            else:
                continue

            serialized_data.append({"crag": crag_data, "ranking": idx})

        return Response(
            {
                "success": True,
                "message": "Monthly ranking fetched successfully.",
                "data": serialized_data,
                "errors": {},
            },
            status=status.HTTP_200_OK,
        )
    except ValueError as ve:
        return Response(
            {
                "success": False,
                "message": f"Error: {str(ve)}",
                "data": [],
                "errors": {"exception": str(ve)},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(
            {
                "success": False,
                "message": f"Error fetching climb logs: {str(e)}",
                "data": [],
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def get_trending_crags_view(request: Request) -> Response:
    """GET /crag_trending?count=int"""
    result: dict = authenticate_app_check_token(request)
    if not result.get("success"):
        return Response(result, status=status.HTTP_401_UNAUTHORIZED)

    count_param = request.query_params.get("count")
    try:
        count = int(count_param) if count_param is not None else 0
    except ValueError:
        return Response(
            {
                "success": False,
                "message": "Invalid count value.",
                "errors": {"count": "count must be an integer."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        trending_list = crag_controller.get_trending_crags(count)

        if not trending_list:
            return Response(
                {
                    "success": True,
                    "message": "No trending crags found.",
                    "data": [],
                    "errors": {},
                },
                status=status.HTTP_200_OK,
            )

        trending_list_json = []

        for item in trending_list:
            if item:
                crag_obj = item["crag"]
                crag_data = dict(CragSerializer(crag_obj).data)

                trending_list_json.append(
                    {
                        "crag": crag_data,
                        "current_count": item.get("current_count", 0),
                        "previous_count": item.get("previous_count", 0),
                        "growth": item.get("growth", 0),
                        "growth_rate": item.get("growth_rate", 0),
                    }
                )

        return Response(
            {
                "success": True,
                "message": "Trending crags fetched successfully.",
                "data": trending_list_json,
                "errors": {},
            },
            status=status.HTTP_200_OK,
        )
    except ValueError as ve:
        return Response(
            {
                "success": False,
                "message": f"Error: {str(ve)}",
                "data": [],
                "errors": {"exception": str(ve)},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(
            {
                "success": False,
                "message": f"Error fetching climb logs: {str(e)}",
                "data": [],
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
def get_random_crag_view(request: Request) -> Response:
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
        crag_list = crag_controller.get_random_crag(count, blacklist)
        serializer = CragSerializer(crag_list, many=True)
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
