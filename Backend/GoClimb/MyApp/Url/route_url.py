from django.urls import path

from MyApp.Boundary.route_boundary import (
    create_route_view,
    delete_route_view,
    get_route_by_crag_id_view,
    get_route_by_id_view,
    get_routes_by_user_id_view,
)

urlpatterns = [
    path("create_route/", create_route_view, name="create_route"),
    path("delete_route/", delete_route_view, name="delete_route"),
    path(
        "get_route_by_crag_id/",
        get_route_by_crag_id_view,
        name="get_route_by_crag_id",
    ),
    path(
        "get_route_by_id/",
        get_route_by_id_view,
        name="get_route_by_id",
    ),
    path(
        "get_routes_by_user_id/",
        get_routes_by_user_id_view,
        name="get_routes_by_user_id",
    ),
]
