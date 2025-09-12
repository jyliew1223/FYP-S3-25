from typing import Any, Optional
from MyApp.Entity.crag import Crag
from datetime import timedelta
from django.utils.timezone import now
from MyApp.models import Climb
from django.db.models import Count

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
    
def get_trending_crags(count: int) -> list:
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
                trending_list.append((crag_obj, current_count, previous_count, growth, growth_rate))
    
    trending_list.sort(key=lambda x: x[4], reverse=True)
    trending_list = trending_list[:count]
    
    return trending_list
