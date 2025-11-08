from typing import Any, Optional
from MyApp.Entity.crag import Crag
from datetime import timedelta
from django.utils.timezone import now
from MyApp.Entity.climblog import ClimbLog
from django.db.models import Count
from MyApp.Utils.helper import PrefixedIDConverter
from django.core.exceptions import ObjectDoesNotExist


def create_crag(crag_data: dict) -> Crag:
    """
    Controller: Business logic to create a crag.
    
    Args:
        crag_data: Dictionary containing crag data
    
    Returns:
        Crag entity
    
    Raises:
        ValueError: If data validation fails
    """
    from MyApp.Serializer.serializers import CragSerializer
    
    serializer = CragSerializer(data=crag_data)
    if not serializer.is_valid():
        raise ValueError(serializer.errors)
    
    crag = serializer.save()
    return crag


def delete_crag(crag_id: str) -> bool:
    """
    Controller: Business logic to delete a crag.
    
    Args:
        crag_id: The crag ID (can be prefixed like "CRAG-000001" or raw like "1")
    
    Returns:
        True if successful
    
    Raises:
        ValueError: If crag_id is empty
        ObjectDoesNotExist: If crag not found
    """
    if not crag_id:
        raise ValueError("crag_id is required")

    raw_id = PrefixedIDConverter.to_raw_id(crag_id)
    
    try:
        crag = Crag.objects.get(crag_id=raw_id)
        crag.delete()
        return True
    except Crag.DoesNotExist:
        raise ObjectDoesNotExist(f"Crag with ID {crag_id} does not exist.")


def get_crag_info(crag_id: str) -> Optional[Crag]:

    raw_id = PrefixedIDConverter.to_raw_id(crag_id)
    return Crag.objects.filter(crag_id=raw_id).first()

def get_monthly_ranking(count: int) -> list:

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

    trending_list.sort(key=lambda x: x["growth_rate"], reverse=True)
    return trending_list[:count]

def get_random_crag(count: int = 10, blacklist: list[str] | None = None):

    if count < 0:
        raise ValueError("Count must be a positive integer.")

    if blacklist is None:
        blacklist = []

    converter = PrefixedIDConverter()
    blacklist_int: list[int] = []

    for item in blacklist:
        data: int = converter.to_raw_id(item)
        blacklist_int.append(data)

    crags = Crag.objects.exclude(crag_id__in=blacklist_int).order_by("?")[:count]
    return crags
