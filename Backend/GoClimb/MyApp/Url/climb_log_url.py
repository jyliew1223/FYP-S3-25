# Url/climb_log_url.py

from django.urls import path

from MyApp.Boundary.climblog_boundary import (
    get_user_climb_logs_view,
    get_user_climb_stats_view,
)

urlpatterns = [
    path("get_user_climb_logs/", get_user_climb_logs_view, name="get_user_climb_logs"),
    path(
        "get_user_climb_stats/", get_user_climb_stats_view, name="get_user_climb_stats"
    ),
]
