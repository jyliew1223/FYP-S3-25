# Url/post_comment_url.py

from django.urls import path

from MyApp.Boundary.post_comment_boundary import (
    create_post_comment_view,
    delete_post_comment_view,
    get_post_comments_by_post_id_view,
    get_post_comments_by_user_id_view,
)

urlpatterns = [
    path("create_post_comment/", create_post_comment_view, name="create_post_comment"),
    path("delete_post_comment/", delete_post_comment_view, name="delete_post_comment"),
    path(
        "get_post_comments_by_post_id/",
        get_post_comments_by_post_id_view,
        name="get_post_comments_by_post_id",
    ),
    path(
        "get_post_comments_by_user_id/",
        get_post_comments_by_user_id_view,
        name="get_post_comments_by_user_id",
    ),
]
