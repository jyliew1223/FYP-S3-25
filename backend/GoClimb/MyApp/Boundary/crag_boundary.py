# MyApp/Boundary/crag_info.py
from typing import Any, Optional
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.decorators import api_view
from rest_framework import status

# Serializers
from MyApp.Serializer.serializers import CragSerializer

# Utils
from MyApp.Utils.helper import authenticate_app_check_token

from MyApp.Controller.crag_controller import (
    get_crag_info,
    get_monthly_ranking,
    get_trending_crags,
)


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
        crag = get_crag_info(crag_id)
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
        count = int(count_param) if count_param is not None else 0  # default value
    except ValueError:
        return Response(
            {
                "success": False,
                "message": "Invalid count value.",
                "errors": {"count must be an integer."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        crag_list: list = get_monthly_ranking(count)

        serialized_data = []
        for idx, item in enumerate(crag_list, 1):
            # Accept either a Crag model or a dict (as mocked in tests)
            if hasattr(item, "_meta"):  # Django model
                crag_data = CragSerializer(item).data
            elif isinstance(item, dict):  # mocked dict from tests
                crag_data = dict(item)
            else:
                # Unknown type; skip safely
                continue

            if isinstance(crag_data, dict):
                crag_data["ranking"] = idx
            serialized_data.append(crag_data)

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
                "errors": {str(ve)},
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
        count = int(count_param) if count_param is not None else 0  # default value
    except ValueError:
        return Response(
            {
                "success": False,
                "message": "Invalid count value.",
                "errors": {"count must be an integer."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        trending_list = get_trending_crags(count)
        
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
                crag_obj = item["crag"]  # Crag instance
                crag_data = dict(CragSerializer(crag_obj).data)

                # Add the other values into the serialized dict
                crag_data["current_count"] = item.get("current_count", 0)
                crag_data["previous_count"] = item.get("previous_count", 0)
                crag_data["growth"] = item.get("growth", 0)
                crag_data["growth_rate"] = item.get("growth_rate", 0)

                trending_list_json.append(crag_data)

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
                "errors": {str(ve)},
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
