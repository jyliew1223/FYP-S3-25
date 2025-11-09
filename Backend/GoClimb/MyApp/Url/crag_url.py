from django.urls import path

from MyApp.Boundary.crag_boundary import (
    get_crag_info_view,
    get_crag_monthly_ranking_view,
    get_trending_crags_view,
    get_random_crag_view,
    get_all_crag_ids_view,
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
]
