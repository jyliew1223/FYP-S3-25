from MyApp.Entity.crag_model import CragModel
from MyApp.Entity.crag import Crag
from MyApp.Serializer.serializers import CragModelSerializer
from django.core.exceptions import ObjectDoesNotExist


def get_models_by_crag_id(crag_id):
    if not crag_id:
        raise ValueError("crag_id is required")
    try:
        crag = Crag.objects.get(crag_id=crag_id)
    except ObjectDoesNotExist:
        return None

    models_qs = CragModel.objects.filter(crag=crag)
    serializer = CragModelSerializer(models_qs, many=True)
    return serializer.data
