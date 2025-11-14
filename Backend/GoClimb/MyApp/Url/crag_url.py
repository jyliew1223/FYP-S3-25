from django.urls import path

from MyApp.Boundary.crag_boundary import (
    get_crag_info_view,
    get_crag_monthly_ranking_view,
    get_trending_crags_view,
    get_random_crag_view,
    get_all_crag_ids_view,
    create_crag_view,  # CREATING_01
    delete_crag_view,
    get_crags_by_user_id_view,
    search_crags_view,
)

urlpatterns = [
    path("get_crag_info/", get_crag_info_view, name="get_crag_info"),
    path(
        "get_crag_monthly_ranking/",
        get_crag_monthly_ranking_view,
        name="get_crag_monthly_ranking",
    ),
    path("get_trending_crags/", get_trending_crags_view, name="get_trending_crags"),
    path("get_random_crags/", get_random_crag_view, name="get_random_crag"),
    path("get_all_crag_ids/", get_all_crag_ids_view, name="get_all_crag_ids"),
    path("create_crag/", create_crag_view, name="create_crag"),  # CREATING_01
    path("delete_crag/", delete_crag_view, name="delete_crag"),
    path("get_crags_by_user_id/", get_crags_by_user_id_view, name="get_crags_by_user_id"),
    path("search/", search_crags_view, name="search_crags"),
]
