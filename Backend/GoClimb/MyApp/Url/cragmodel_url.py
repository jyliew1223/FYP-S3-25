from django.urls import path
from MyApp.Boundary.cragmodel_boundary import (
    get_models_by_crag_id_view,
    get_models_by_user_id_view,
    create_crag_model_view,
    update_crag_model_view,
    delete_crag_model_view,
)

urlpatterns = [
    path(
        "get_models_by_crag_id/",
        get_models_by_crag_id_view,
        name="get_models_by_crag_id",
    ),
    path(
        "get_models_by_user_id/",
        get_models_by_user_id_view,
        name="get_models_by_user_id",
    ),
    path(
        "create_crag_model/",
        create_crag_model_view,
        name="create_crag_model",
    ),
    path(
        "update_crag_model/",
        update_crag_model_view,
        name="update_crag_model",
    ),
    path(
        "delete_crag_model/",
        delete_crag_model_view,
        name="delete_crag_model",
    ),
]
