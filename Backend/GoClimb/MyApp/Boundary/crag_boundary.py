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
        count = int(count_param) if count_param is not None else 0 
    except ValueError:
        return Response(
            {
                "success": False,
                "message": "Invalid count value.",
                "errors": {"count":"count must be an integer."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        crag_list: list = get_monthly_ranking(count)

        serialized_data = []
        for idx, item in enumerate(crag_list, 1):
            if hasattr(item, "_meta"):
                crag_data = CragSerializer(item).data
            elif isinstance(item, dict):
                crag_data = dict(item)
            else:
                continue

            serialized_data.append({
                "crag": crag_data, 
                "ranking": idx    
            })

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
                crag_obj = item["crag"]
                crag_data = dict(CragSerializer(crag_obj).data)

                trending_list_json.append({
                    "crag": crag_data,
                    "current_count": item.get("current_count", 0),
                    "previous_count": item.get("previous_count", 0),
                    "growth": item.get("growth", 0),
                    "growth_rate": item.get("growth_rate", 0),
                })

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
