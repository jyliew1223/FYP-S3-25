"""
Ranking Controller - Business logic for user rankings and leaderboards.
"""

from typing import List, Dict, Any, Optional
from django.utils.timezone import now
from django.db.models import Count, Avg, Q, F
from datetime import datetime, timedelta
from MyApp.Entity.user import User
from MyApp.Entity.climblog import ClimbLog


def get_weekly_user_ranking(count: int = 50) -> List[Dict[str, Any]]:
    if count <= 0:
        raise ValueError("Count must be a positive integer.")
    
    # Calculate date range for this week (last 7 days)
    end_date = now().date()
    start_date = end_date - timedelta(days=7)
    
    # Get users with their climb counts for the week
    ranking = (
        ClimbLog.objects.filter(
            date_climbed__gte=start_date,
            date_climbed__lte=end_date,
            status=True  # Only completed/topped routes
        )
        .values("user__user_id")
        .annotate(total_routes=Count("log_id"))
        .order_by("-total_routes")[:count]
    )
    
    # Get user objects
    user_ids = [row["user__user_id"] for row in ranking]
    users = {u.user_id: u for u in User.objects.filter(user_id__in=user_ids)}
    
    # Build ranking list
    user_ranking = []
    for idx, row in enumerate(ranking, start=1):
        user = users.get(row["user__user_id"])
        if user:
            user_ranking.append({
                "user": user,
                "rank": idx,
                "total_routes": row["total_routes"]
            })
    
    return user_ranking


def get_alltime_user_ranking(count: int = 50) -> List[Dict[str, Any]]:
    if count <= 0:
        raise ValueError("Count must be a positive integer.")
    
    # Get users with their total climb counts
    ranking = (
        ClimbLog.objects.filter(
            status=True  # Only completed/topped routes
        )
        .values("user__user_id")
        .annotate(total_routes=Count("log_id"))
        .order_by("-total_routes")[:count]
    )
    
    # Get user objects
    user_ids = [row["user__user_id"] for row in ranking]
    users = {u.user_id: u for u in User.objects.filter(user_id__in=user_ids)}
    
    # Build ranking list
    user_ranking = []
    for idx, row in enumerate(ranking, start=1):
        user = users.get(row["user__user_id"])
        if user:
            user_ranking.append({
                "user": user,
                "rank": idx,
                "total_routes": row["total_routes"]
            })
    
    return user_ranking


def get_average_grade_ranking(count: int = 50, timeframe: str = "alltime") -> List[Dict[str, Any]]:
    if count <= 0:
        raise ValueError("Count must be a positive integer.")
    
    if timeframe not in ["monthly", "weekly", "alltime"]:
        raise ValueError("Timeframe must be 'monthly', 'weekly', or 'alltime'.")
    
    # Calculate date filters based on timeframe
    today = now().date()
    date_filter = Q()
    
    if timeframe == "weekly":
        start_date = today - timedelta(days=7)
        date_filter = Q(date_climbed__gte=start_date, date_climbed__lte=today)
    elif timeframe == "monthly":
        start_date = today.replace(day=1)
        date_filter = Q(date_climbed__gte=start_date, date_climbed__lte=today)
    # For alltime, no date filter needed
    
    # Get users with average grades (minimum 5 routes)
    ranking = (
        ClimbLog.objects.filter(
            date_filter,
            status=True,  # Only completed/topped routes
            route__route_grade__isnull=False  # Must have grade
        )
        .values("user__user_id")
        .annotate(
            total_routes=Count("log_id"),
            average_grade=Avg("route__route_grade")
        )
        .filter(total_routes__gte=5)  # Minimum 5 routes
        .order_by("-average_grade")[:count]
    )
    
    # Get user objects
    user_ids = [row["user__user_id"] for row in ranking]
    users = {u.user_id: u for u in User.objects.filter(user_id__in=user_ids)}
    
    # Build ranking list
    user_ranking = []
    for idx, row in enumerate(ranking, start=1):
        user = users.get(row["user__user_id"])
        if user:
            user_ranking.append({
                "user": user,
                "rank": idx,
                "average_grade": round(row["average_grade"], 1),
                "total_routes": row["total_routes"]
            })
    
    return user_ranking


def get_top_climbers(count: int = 50, timeframe: str = "alltime") -> List[Dict[str, Any]]:
    if count <= 0:
        raise ValueError("Count must be a positive integer.")
    
    if timeframe not in ["monthly", "weekly", "alltime"]:
        raise ValueError("Timeframe must be 'monthly', 'weekly', or 'alltime'.")
    
    # Calculate date filters based on timeframe
    today = now().date()
    date_filter = Q()
    
    if timeframe == "weekly":
        start_date = today - timedelta(days=7)
        date_filter = Q(date_climbed__gte=start_date, date_climbed__lte=today)
    elif timeframe == "monthly":
        start_date = today.replace(day=1)
        date_filter = Q(date_climbed__gte=start_date, date_climbed__lte=today)
    # For alltime, no date filter needed
    
    # Get users with stats and calculate combined score
    ranking = (
        ClimbLog.objects.filter(
            date_filter,
            status=True,  # Only completed/topped routes
            route__route_grade__isnull=False  # Must have grade
        )
        .values("user__user_id")
        .annotate(
            total_routes=Count("log_id"),
            average_grade=Avg("route__route_grade")
        )
        .filter(total_routes__gte=5)  # Minimum 5 routes
    )
    
    # Calculate scores and sort
    scored_users = []
    for row in ranking:
        total_score = (row["total_routes"] * 10) + (row["average_grade"] * 100)
        scored_users.append({
            "user_id": row["user__user_id"],
            "total_routes": row["total_routes"],
            "average_grade": round(row["average_grade"], 1),
            "total_score": round(total_score, 0)
        })
    
    # Sort by total score descending and limit
    scored_users.sort(key=lambda x: x["total_score"], reverse=True)
    scored_users = scored_users[:count]
    
    # Get user objects
    user_ids = [row["user_id"] for row in scored_users]
    users = {u.user_id: u for u in User.objects.filter(user_id__in=user_ids)}
    
    # Build ranking list
    user_ranking = []
    for idx, row in enumerate(scored_users, start=1):
        user = users.get(row["user_id"])
        if user:
            user_ranking.append({
                "user": user,
                "rank": idx,
                "total_score": int(row["total_score"]),
                "total_routes": row["total_routes"],
                "average_grade": row["average_grade"]
            })
    
    return user_ranking