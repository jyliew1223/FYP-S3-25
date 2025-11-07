from MyApp.Entity.crag_model import CragModel
from MyApp.Entity.crag import Crag
from MyApp.Serializer.serializers import CragModelSerializer
from MyApp.Utils.helper import PrefixedIDConverter


def get_models_by_crag_id(crag_id):
    if not crag_id:
        raise ValueError("crag_id is required")

    raw_id = PrefixedIDConverter.to_raw_id(crag_id)
    models_qs = CragModel.objects.filter(crag__crag_id=raw_id)
    serializer = CragModelSerializer(models_qs, many=True)
    return serializer.data
