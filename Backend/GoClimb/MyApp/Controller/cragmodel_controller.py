from MyApp.Entity.crag_model import CragModel
from MyApp.Entity.crag import Crag
from MyApp.Utils.helper import PrefixedIDConverter


def get_models_by_crag_id(crag_id):
    """
    Controller: Business logic to retrieve CragModel entities by crag_id.
    Returns QuerySet of CragModel entities (not serialized data).
    """
    if not crag_id:
        raise ValueError("crag_id is required")

    raw_id = PrefixedIDConverter.to_raw_id(crag_id)
    
    # Verify crag exists
    if not Crag.objects.filter(crag_id=raw_id).exists():
        return None
    
    # Return QuerySet of entities
    return CragModel.objects.filter(crag__crag_id=raw_id)
