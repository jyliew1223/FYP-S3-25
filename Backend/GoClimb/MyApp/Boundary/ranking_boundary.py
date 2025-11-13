"""
Ranking Boundary - Handle HTTP requests for user rankings and leaderboards.
"""

from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status

from MyApp.Controller import ranking_controller
from MyApp.Serializer.serializers import (
    WeeklyRankingSerializer,
    AlltimeRankingSerializer,
    AverageGradeRankingSerializer,
    TopClimbersSerializer
)
from MyApp.Firebase.helpers import authenticate_app_check_token


@api_view(["GET"])
def get_weekly_user_ranking_view(request: Request) -> Response:
    """
    Boundary: Handle HTTP request to get weekly user ranking.
    
    Query Parameters:
        count: number (default: 50)
    
    Response:
        Weekly user ranking based on climb count
    """
    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)
    
    # Get count parameter
    try:
        count = int(request.query_params.get("count", 50))
        if count <= 0:
            raise ValueError("Count must be positive")
    except (ValueError, TypeError):
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"count": "Must be a positive integer."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    
    try:
        ranking_data = ranking_controller.get_weekly_user_ranking(count)
        serializer = WeeklyRankingSerializer(ranking_data, many=True)
        
        return Response(
            {
                "success": True,
                "message": "Weekly user ranking fetched successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
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
                "message": "An error occurred while fetching weekly ranking.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def get_alltime_user_ranking_view(request: Request) -> Response:
    """
    Boundary: Handle HTTP request to get all-time user ranking.
    
    Query Parameters:
        count: number (default: 50)
    
    Response:
        All-time user ranking based on climb count
    """
    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)
    
    # Get count parameter
    try:
        count = int(request.query_params.get("count", 50))
        if count <= 0:
            raise ValueError("Count must be positive")
    except (ValueError, TypeError):
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"count": "Must be a positive integer."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    
    try:
        ranking_data = ranking_controller.get_alltime_user_ranking(count)
        serializer = AlltimeRankingSerializer(ranking_data, many=True)
        
        return Response(
            {
                "success": True,
                "message": "All-time user ranking fetched successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
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
                "message": "An error occurred while fetching all-time ranking.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def get_average_grade_ranking_view(request: Request) -> Response:
    """
    Boundary: Handle HTTP request to get average grade ranking.
    
    Query Parameters:
        count: number (default: 50)
        timeframe: string ("monthly" | "weekly" | "alltime")
    
    Response:
        User ranking based on average grade
    """
    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)
    
    # Get parameters
    try:
        count = int(request.query_params.get("count", 50))
        if count <= 0:
            raise ValueError("Count must be positive")
    except (ValueError, TypeError):
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"count": "Must be a positive integer."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    
    timeframe = request.query_params.get("timeframe", "alltime").lower()
    if timeframe not in ["monthly", "weekly", "alltime"]:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"timeframe": "Must be 'monthly', 'weekly', or 'alltime'."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    
    try:
        ranking_data = ranking_controller.get_average_grade_ranking(count, timeframe)
        serializer = AverageGradeRankingSerializer(ranking_data, many=True)
        
        return Response(
            {
                "success": True,
                "message": "Average grade ranking fetched successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
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
                "message": "An error occurred while fetching average grade ranking.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def get_top_climbers_view(request: Request) -> Response:
    """
    Boundary: Handle HTTP request to get top climbers.
    
    Query Parameters:
        count: number (default: 50)
        timeframe: string ("monthly" | "weekly" | "alltime")
    
    Response:
        Top climbers based on combined score
    """
    auth_result = authenticate_app_check_token(request)
    if not auth_result.get("success"):
        return Response(auth_result, status=status.HTTP_401_UNAUTHORIZED)
    
    # Get parameters
    try:
        count = int(request.query_params.get("count", 50))
        if count <= 0:
            raise ValueError("Count must be positive")
    except (ValueError, TypeError):
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"count": "Must be a positive integer."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    
    timeframe = request.query_params.get("timeframe", "alltime").lower()
    if timeframe not in ["monthly", "weekly", "alltime"]:
        return Response(
            {
                "success": False,
                "message": "Invalid input.",
                "errors": {"timeframe": "Must be 'monthly', 'weekly', or 'alltime'."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    
    try:
        ranking_data = ranking_controller.get_top_climbers(count, timeframe)
        serializer = TopClimbersSerializer(ranking_data, many=True)
        
        return Response(
            {
                "success": True,
                "message": "Top climbers fetched successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
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
                "message": "An error occurred while fetching top climbers.",
                "errors": {"exception": str(e)},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )