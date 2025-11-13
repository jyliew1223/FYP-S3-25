from django.urls import path

from MyApp.Boundary.ranking_boundary import (
    get_weekly_user_ranking_view,
    get_alltime_user_ranking_view,
    get_average_grade_ranking_view,
    get_top_climbers_view,
)

urlpatterns = [
    path("get_weekly_user_ranking/", get_weekly_user_ranking_view, name="get_weekly_user_ranking"),
    path("get_alltime_user_ranking/", get_alltime_user_ranking_view, name="get_alltime_user_ranking"),
    path("get_average_grade_ranking/", get_average_grade_ranking_view, name="get_average_grade_ranking"),
    path("get_top_climbers/", get_top_climbers_view, name="get_top_climbers"),
]