from typing import Optional
from django.db.models import QuerySet

from MyApp.Entity.cragmodel import CragModel
from MyApp.Entity.crag import Crag
from MyApp.Utils.helper import PrefixedIDConverter

def get_models_by_crag_id(crag_id: str) -> Optional[QuerySet[CragModel]]:

    if not crag_id:
        raise ValueError("crag_id is required")

    raw_id = PrefixedIDConverter.to_raw_id(crag_id)

    if not Crag.objects.filter(crag_id=raw_id).exists():
        return None

    return CragModel.objects.filter(crag__crag_id=raw_id)
