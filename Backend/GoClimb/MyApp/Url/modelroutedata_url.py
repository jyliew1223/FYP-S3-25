from django.urls import path
from MyApp.Boundary.modelroutedata_boundary import (
    get_by_model_id_view,
    create_model_route_data_view,
)

urlpatterns = [
    path(
        "get_by_model_id/",
        get_by_model_id_view,
        name="get_model_route_data_by_model_id",
    ),
    path(
        "create_model_route_data/",
        create_model_route_data_view,
        name="create_model_route_data",
    ),
]