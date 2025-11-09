from django.urls import path

from MyApp.Boundary.climblog_boundary import (
    get_user_climb_logs_view,
    get_user_climb_stats_view,
    create_climb_log_view,
    delete_climb_log_view,
    create_climb_log_view,   # CREATING_02
    delete_climb_log_view,
)

urlpatterns = [
    path("get_user_climb_logs/", get_user_climb_logs_view, name="get_user_climb_logs"),
    path(
        "get_user_climb_stats/", get_user_climb_stats_view, name="get_user_climb_stats"
    ),
    path("create/", create_climb_log_view, name="create_climb_log"),
    path("delete/", delete_climb_log_view, name="delete_climb_log"),
    path("create/", create_climb_log_view, name="create_climb_log"),   # CREATING_02
    path("delete/", delete_climb_log_view, name="delete_climb_log"),   # DELETE_01
]
