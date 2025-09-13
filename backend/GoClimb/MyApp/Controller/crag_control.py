from typing import Any, Optional
from MyApp.Entity.crag import Crag
from datetime import timedelta
from django.utils.timezone import now
from MyApp.Entity.climblog import ClimbLog
from django.db.models import Count


# Rename functions to match test expectations
def get_crag_info(crag_id: str) -> Optional[Crag]:
    """Fetch a single crag object"""
    return Crag.objects.filter(crag_id=crag_id).first()


def get_monthly_ranking(count: int) -> list:
    """Fetch top crags by number of climbs in the past month"""
    if count < 1:
        raise ValueError("count must be a positive integer")

    today = now().date()
    period_start = today - timedelta(days=30)
    ranking = (
        ClimbLog.objects.filter(date_climbed__gte=period_start)
        .values("crag")
        .annotate(total_climbs=Count("log_id")) 
        .order_by("-total_climbs")[:count]
    )

    crag_list = []
    for item in ranking:
        crag_obj = Crag.objects.filter(crag_id=item["crag"]).first()
        if crag_obj:
            crag_list.append(crag_obj)
    return crag_list


def get_trending_crags(count: int) -> list:
    if count < 1:
        raise ValueError("count must be a positive integer")

    days = 7
    today = now().date()
    period_start = today - timedelta(days=days)
    lastperiod_start = today - timedelta(days=days * 2)

    current_counts = (
        ClimbLog.objects.filter(date_climbed__gte=period_start)
        .values("crag")
        .annotate(current_count=Count("id"))
    )

    previous_counts = (
        ClimbLog.objects.filter(
            date_climbed__gte=lastperiod_start, date_climbed__lt=period_start
        )
        .values("crag")
        .annotate(total_climbs=Count("log_id")) 
    )

    previous_lookup = {item["crag"]: item["previous_count"] for item in previous_counts}

    trending_list = []
    for current in current_counts:
        crag_id = current["crag"]
        current_count = current["current_count"]
        previous_count = previous_lookup.get(crag_id, 0)

        growth = current_count - previous_count
        growth_rate = (
            (growth / previous_count)
            if previous_count > 0
            else (float("inf") if growth > 0 else 0)
        )

        if growth > 0:
            crag_obj = Crag.objects.filter(crag_id=crag_id).first()
            if crag_obj:
                trending_list.append(
                    (crag_obj, current_count, previous_count, growth, growth_rate)
                )

    trending_list.sort(key=lambda x: x[4], reverse=True)
    trending_list = trending_list[:count]

    return trending_list
