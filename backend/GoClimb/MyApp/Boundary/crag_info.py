# MyApp/Boundary/crag_info.py
from typing import Any, Optional
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.decorators import api_view
from rest_framework import status
from datetime import timedelta
from django.utils.timezone import now
from django.db.models import Count

# Serializers
from MyApp.Serializer.serializers import CragSerializer

# Models
from MyApp.models import Climb
from MyApp.Entity.crag import Crag

# Utils
from MyApp.Utils.helper import authenticate_app_check_token


# Rename functions to match test expectations
def get_crag_info(crag_id: str) -> dict:
    """Fetch a single crag object"""
    try:
        crag_obj = Crag.objects.filter(crag_id=crag_id).first()
        if not crag_obj:
            return {"success": False, "message": "Crag not found."}
        return {"success": True, "crag": crag_obj}
    except Exception as e:
        return {"success": False, "message": str(e)}


def get_monthly_ranking(count: int) -> Optional[list]:
    """Fetch top crags by number of climbs in the past month"""
    try:
        today = now().date()
        period_start = today - timedelta(days=30)
        ranking = (
            Climb.objects.filter(date_climbed__gte=period_start)
            .values('crag')
            .annotate(total_climbs=Count('id'))
            .order_by('-total_climbs')[:count]
        )

        crag_list = []
        for item in ranking:
            crag_obj = Crag.objects.filter(crag_id=item['crag']).first()
            if crag_obj:
                crag_list.append(crag_obj)
        return crag_list
    except Exception:
        return None


@api_view(["GET"])
def crag_info_view(request: Request) -> Response:
    """GET /crag_info?crag_id=str"""
    result: dict = authenticate_app_check_token(request)
    if not result.get("success"):
        return Response(result, status=status.HTTP_401_UNAUTHORIZED)

    crag_id = request.query_params.get("crag_id", "")
    if not crag_id:
        return Response({
            "success": False,
            "message": "Missing crag_id.",
            "errors": {"crag_id": "This field is required."}
        }, status=status.HTTP_400_BAD_REQUEST)

    crag_info = get_crag_info(crag_id)
    if not crag_info.get("success"):
        return Response(crag_info, status=status.HTTP_404_NOT_FOUND)

    crag_obj = crag_info.get("crag")
    crag_data = CragSerializer(crag_obj).data
    return Response({
        "success": True,
        "message": "Crag info fetched successfully.",
        "data": crag_data
    }, status=status.HTTP_200_OK)


@api_view(["GET"])
def crag_monthly_ranking_view(request: Request) -> Response:
    """GET /crag_monthly_ranking?count=int"""
    result: dict = authenticate_app_check_token(request)
    if not result.get("success"):
        return Response(result, status=status.HTTP_401_UNAUTHORIZED)

    count = request.query_params.get("count")
    try:
        count = int(count) if count is not None else 10
        if count < 1:
            raise ValueError
    except (ValueError, TypeError):
        return Response({
            "success": False,
            "message": "Invalid count value.",
            "errors": {"count": "Must be a positive integer."}
        }, status=status.HTTP_400_BAD_REQUEST)

    crag_list = get_monthly_ranking(count)
    if crag_list is None:
        return Response({
            "success": False,
            "message": "Ranking fetch failed.",
            "data": [],
            "errors": {}
        }, status=status.HTTP_400_BAD_REQUEST)

    serialized_data = []
    for idx, crag_obj in enumerate(crag_list, 1):
        crag_data = CragSerializer(crag_obj).data
        crag_data['ranking'] = idx
        serialized_data.append(crag_data)

    return Response({
        "success": True,
        "message": "Monthly ranking fetched successfully.",
        "data": serialized_data,
        "errors": {},
    }, status=status.HTTP_200_OK)


@api_view(["GET"])
def crag_trending_view(request: Request) -> Response:
    """GET /crag_trending?count=int"""
    result: dict = authenticate_app_check_token(request)
    if not result.get("success"):
        return Response(result, status=status.HTTP_401_UNAUTHORIZED)

    count = request.query_params.get("count")
    try:
        count = int(count) if count is not None else 10
        if count < 1:
            raise ValueError
    except (ValueError, TypeError):
        return Response({
            "success": False,
            "message": "Invalid count value.",
            "errors": {"count": "Must be a positive integer."}
        }, status=status.HTTP_400_BAD_REQUEST)

    days = 7
    today = now().date()
    period_start = today - timedelta(days=days)
    lastperiod_start = today - timedelta(days=days*2)

    current_counts = (
        Climb.objects.filter(date_climbed__gte=period_start)
        .values('crag')
        .annotate(current_count=Count('id'))
    )

    previous_counts = (
        Climb.objects.filter(date_climbed__gte=lastperiod_start, date_climbed__lt=period_start)
        .values('crag')
        .annotate(previous_count=Count('id'))
    )

    previous_lookup = {item['crag']: item['previous_count'] for item in previous_counts}

    trending_list = []
    for current in current_counts:
        crag_id = current['crag']
        current_count = current['current_count']
        previous_count = previous_lookup.get(crag_id, 0)

        growth = current_count - previous_count
        growth_rate = (growth / previous_count) if previous_count > 0 else (float('inf') if growth > 0 else 0)

        if growth > 0:
            crag_obj = Crag.objects.filter(crag_id=crag_id).first()
            if crag_obj:
                crag_data = CragSerializer(crag_obj).data
                crag_data.update({
                    "ranking": 0,
                    "current_count": current_count,
                    "previous_count": previous_count,
                    "growth": growth,
                    "growth_rate": growth_rate,
                })
                trending_list.append(crag_data)

    trending_list.sort(key=lambda x: x['growth_rate'], reverse=True)
    trending_list = trending_list[:count]

    for idx, item in enumerate(trending_list, 1):
        item['ranking'] = idx

    return Response({
        "success": True,
        "message": "Trending crags fetched successfully.",
        "data": trending_list,
        "errors": {},
    }, status=status.HTTP_200_OK)
