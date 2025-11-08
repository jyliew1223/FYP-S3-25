from django.urls import path
from MyApp.Boundary.modelroutedata_boundary import (
    get_by_model_id_view,
    get_by_user_id_view,
    create_model_route_data_view,
    delete_model_route_data_view,
)

urlpatterns = [
    path(
        "get_by_model_id/",
        get_by_model_id_view,
        name="get_model_route_data_by_model_id",
    ),
    path(
        "get_by_user_id/",
        get_by_user_id_view,
        name="get_model_route_data_by_user_id",
    ),
    path(
        "create_model_route_data/",
        create_model_route_data_view,
        name="create_model_route_data",
    ),
    path(
        "delete_model_route_data/",
        delete_model_route_data_view,
        name="delete_model_route_data",
    ),
]