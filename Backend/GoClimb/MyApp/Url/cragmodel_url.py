from django.urls import path
from MyApp.Boundary.cragmodel_boundary import get_models_by_crag_id_view

urlpatterns = [
    path(
        "get_models_by_crag_id/",
        get_models_by_crag_id_view,
        name="get_models_by_crag_id",
    ),
]
