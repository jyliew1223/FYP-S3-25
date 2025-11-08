from typing import Any, Optional
from MyApp.Entity.crag import Crag
from datetime import timedelta
from django.utils.timezone import now
from MyApp.Entity.climblog import ClimbLog
from django.db.models import Count
from MyApp.Utils.helper import PrefixedIDConverter


def get_crag_info(crag_id: str) -> Optional[Crag]:
    """Fetch a single crag object"""
    raw_id = PrefixedIDConverter.to_raw_id(crag_id)
    return Crag.objects.filter(crag_id=raw_id).first()


def get_monthly_ranking(count: int) -> list:
    """Fetch top crags by number of climbs in the past month"""
    if count < 1:
        raise ValueError("count must be a positive integer")

    today = now().date()
    period_start = today - timedelta(days=30)
    ranking = (
        ClimbLog.objects.filter(date_climbed__gte=period_start)
        .values("route__crag")
        .annotate(total_climbs=Count("log_id"))
        .order_by("-total_climbs")[:count]
    )

    crag_list = []
    for item in ranking:
        crag_obj = Crag.objects.filter(crag_id=item["route__crag"]).first()
        if crag_obj:
            crag_list.append(crag_obj)
    return crag_list


def get_trending_crags(count: int) -> list[dict[str, Any]]:
    if count < 1:
        raise ValueError(f"count must be a positive integer, count:{count}")

    days = 7
    today = now().date()
    period_start = today - timedelta(days=days)
    lastperiod_start = today - timedelta(days=days * 2)

    current_counts = (
        ClimbLog.objects.filter(date_climbed__gte=period_start)
        .values("route__crag")
        .annotate(current_count=Count("route__crag"))
    )

    previous_counts = (
        ClimbLog.objects.filter(
            date_climbed__gte=lastperiod_start, date_climbed__lt=period_start
        )
        .values("route__crag")
        .annotate(previous_count=Count("log_id"))
    )

    previous_lookup = {
        item["route__crag"]: item["previous_count"] for item in previous_counts
    }

    crag_ids = [item["route__crag"] for item in current_counts]
    crags = {c.crag_id: c for c in Crag.objects.filter(crag_id__in=crag_ids)}

    trending_list: list[dict[str, Any]] = []

    for current in current_counts:
        crag_id = current["route__crag"]
        crag_obj = crags.get(crag_id)
        if not crag_obj:
            continue

        current_count = current["current_count"]
        previous_count = previous_lookup.get(crag_id, 0)
        growth = current_count - previous_count
        growth_rate = (growth / previous_count) if previous_count > 0 else growth

        if growth > 0:
            trending_list.append(
                {
                    "crag": crag_obj,
                    "current_count": current_count,
                    "previous_count": previous_count,
                    "growth": growth,
                    "growth_rate": growth_rate,
                }
            )

    # Sort by growth_rate descending and limit to requested count
    trending_list.sort(key=lambda x: x["growth_rate"], reverse=True)
    return trending_list[:count]


# --------------------
# CREATING_01 (start)
# --------------------

def create_crag(*, name, location_lat, location_lon, description=""):
    """
    Create and return a Crag row.
    Only uses fields that exist in your current CragSerializer.
    """
    if not isinstance(name, str) or not name.strip():
        raise ValueError("Invalid name")

    try:
        lat = float(location_lat)
        lon = float(location_lon)
    except (TypeError, ValueError):
        raise ValueError("Invalid coordinates")

    crag = Crag.objects.create(
        name=name.strip(),
        location_lat=lat,
        location_lon=lon,
        description=description or "",
        # If your model has `location_details` and you want to accept it:
        # location_details=location_details or {},
    )
    return crag

# ------------------
# CREATING_01 (end)
# ------------------