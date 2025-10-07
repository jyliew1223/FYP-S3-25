# Url/climb_log_url.py

from django.urls import path

from MyApp.Boundary.post_boundary import (
    get_post_view,
    get_random_post_view,
    get_post_by_user_id_view,
)

urlpatterns = [
    path("get_post/", get_post_view, name="get_post"),
    path(
        "get_post_by_user_id/",
        get_post_by_user_id_view,
        name="get_post_by_user_id",
    ),
    path("get_random_posts/", get_random_post_view, name="get_random_post"),
]
