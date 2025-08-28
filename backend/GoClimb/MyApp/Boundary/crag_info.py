# MyApp/Boundary/crag_info.py

from typing import cast, Any
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.decorators import api_view
from rest_framework import status


 # Change to your Crag serializer
from MyApp.Serializer.serializers import CragSerializer 
 # Controller to fetch crag info
from MyApp.Controller.crag_control import get_crag_info 


from MyApp.Utils.helper import authenticate_app_check_token

@api_view(["GET"])
def crag_info_view(request: Request) -> Response:
    """
    GET /crag_info?crag_id=str

    Returns:
    {
        "success": bool,
        "message": str,
        "data": dict,  # Crag details in JSON
        "errors": dict[str, Any]  # Only if success is False
    }
    """
    # Authenticate request
    result: dict = authenticate_app_check_token(request)
    if not result.get("success"):
        return Response(result, status=status.HTTP_401_UNAUTHORIZED)

    # Get crag_id from query parameters
    crag_id = request.query_params.get("crag_id", "")
    if not crag_id:
        return Response({
            "success": False,
            "message": "Missing crag_id.",
            "errors": {"crag_id": "This field is required."}
        }, status=status.HTTP_400_BAD_REQUEST)

    # Fetch crag info using controller
    crag_info = get_crag_info(crag_id)
    if not crag_info.get("success"):
        return Response(crag_info, status=status.HTTP_404_NOT_FOUND)

    # Serialize crag data
    crag_obj = crag_info.get("crag")
    if not crag_obj:
        return Response({
            "success": False,
            "message": "Crag not found."
        }, status=status.HTTP_404_NOT_FOUND)

    crag_data = CragSerializer(crag_obj).data

    return Response({
        "success": True,
        "message": "Crag info fetched successfully.",
        "data": crag_data
    }, status=status.HTTP_200_OK)




@api_view(["GET"])
def crag_monthly_ranking_view(request: Request) -> Response:
    """
    GET /crag_monthly_ranking?count=int

    Returns:
    {
        "success": True,
        "message": "Monthly ranking fetched successfully.",
        "data": [
            {
                "ranking": int,
                # other crag details in JSON
            },
            ...
        ],
        "errors": {},
    }
    """
    # Authenticate request
    result: dict = authenticate_app_check_token(request)
    if not result.get("success"):
        return Response(result, status=status.HTTP_401_UNAUTHORIZED)

    # Get count from query parameters, default to 10 if not provided
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

    # Call controller for ranking
    crag_list = get_monthly_ranking(count)  # returns list of crag model instances
    if crag_list is None:
        return Response({
            "success": False,
            "message": "Ranking fetch failed.",
            "data": [],
            "errors": {}
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Format response data with ranking
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


    
### 
#wei rong START edit
###
    # --- New API View for Trending Crags ---
    @api_view(["GET"])
    def crag_trending_view(request: Request) -> Response:
        """
        GET /crag_trending?count=int

        Returns:
        {
            "success": True,
            "message": "Trending crags fetched successfully.",
            "data": [
                {
                    "ranking": int,
                    # crag details in JSON plus trending metrics:
                    "current_count": int,
                    "previous_count": int,
                    "growth": int,
                    "growth_rate": float,
                },
                ...
            ],
            "errors": {},
        }
        """
        # Authenticate request
        result: dict = authenticate_app_check_token(request)
        if not result.get("success"):
            return Response(result, status=status.HTTP_401_UNAUTHORIZED)

        # Get count param, default 10
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

        # Define periods: last 7 days vs previous 7 days
        days = 7
        today = now().date()
        period_start = today - timedelta(days=days)
        lastperiod_start = today - timedelta(days=days*2)

        # Current period climbs count per crag
        current_counts = (
            Climb.objects.filter(date_climbed__gte=period_start)
            .values('crag__id')
            .annotate(current_count=Count('id'))
        )

        # Previous period climbs count per crag
        previous_counts = (
            Climb.objects.filter(date_climbed__gte=lastperiod_start, date_climbed__lt=period_start)
            .values('crag__id')
            .annotate(previous_count=Count('id'))
        )

        # Build lookup dict for previous counts
        previous_lookup = {item['crag__id']: item['previous_count'] for item in previous_counts}

        trending_list = []
        for current in current_counts:
            crag_id = current['crag__id']
            current_count = current['current_count']
            previous_count = previous_lookup.get(crag_id, 0)

            growth = current_count - previous_count
            growth_rate = (growth / previous_count) if previous_count > 0 else (float('inf') if growth > 0 else 0)

            if growth > 0:
                # Fetch Crag model for serialization
                crag_obj = get_crag_info(crag_id).get("crag")
                if crag_obj:
                    crag_data = CragSerializer(crag_obj).data
                    crag_data.update({
                        "ranking": 0,  # placeholder, set below
                        "current_count": current_count,
                        "previous_count": previous_count,
                        "growth": growth,
                        "growth_rate": growth_rate,
                    })
                    trending_list.append(crag_data)

        # Sort and truncate list by growth_rate desc
        trending_list.sort(key=lambda x: x['growth_rate'], reverse=True)
        trending_list = trending_list[:count]

        # Assign ranking numbers
        for idx, item in enumerate(trending_list, 1):
            item['ranking'] = idx

        return Response({
            "success": True,
            "message": "Trending crags fetched successfully.",
            "data": trending_list,
            "errors": {},
        }, status=status.HTTP_200_OK)


### 
#wei rong END edit
###