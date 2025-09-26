#Url/user_url.py

from django.urls import path

from MyApp.Boundary.user_boundary import (
    get_user_view,
    get_monthly_user_ranking_view,
)

urlpatterns = [
    path("get_user/", get_user_view, name="get_user"),
    path("get_monthly_user_ranking/", get_monthly_user_ranking_view, name="get_monthly_user_ranking"),
]