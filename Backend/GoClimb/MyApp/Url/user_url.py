from django.urls import path

from MyApp.Boundary.user_boundary import (
    get_user_view,
    get_user_by_id_view,
    get_monthly_user_ranking_view,
    update_user_view,
)

urlpatterns = [
    path("get_user/", get_user_view, name="get_user"),
    path("get_user_by_id/", get_user_by_id_view, name="get_user_by_id"),
    path("get_monthly_user_ranking/", get_monthly_user_ranking_view, name="get_monthly_user_ranking"),
    path("update/", update_user_view, name="update_user"),
]
