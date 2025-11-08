# Url/crag_url.py

from django.urls import path

from MyApp.Boundary.crag_boundary import (
    get_crag_info_view,
    get_crag_monthly_ranking_view,
    get_trending_crags_view,
    create_crag_view,  # CREATING_01
)

urlpatterns = [
    path("get_crag_info/", get_crag_info_view, name="get_crag_info"),
    path("get_crag_monthly_ranking/", get_crag_monthly_ranking_view, name="get_crag_monthly_ranking"),
    path("get_trending_crags/", get_trending_crags_view, name="get_trending_crags"),
    path("create_crag/", create_crag_view, name="create_crag"),  # CREATING_01
]