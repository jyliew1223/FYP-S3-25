# Url/climb_log_url.py

from django.urls import path

from MyApp.Boundary.post_boundary import (
    get_post_view,
    get_random_post_view,
    get_post_by_user_id_view,
    # delete_post_view,
    # get_member_posts_view,
    like_post_view,
    unlike_post_view,
    post_likes_count_view,
    post_likes_users_view,
)

urlpatterns = [
    path("get_post/", get_post_view, name="get_post"),
    path(
        "get_post_by_user_id/",
        get_post_by_user_id_view,
        name="get_post_by_user_id",
    ),
    path("get_random_posts/", get_random_post_view, name="get_random_post"),
    # path('post_delete/', delete_post_view, name='post_delete'),  # Admin - 1
    # path('posts_by_member/', get_member_posts_view, name='posts_by_member'),  # Admin - 4
    path("like/", like_post_view, name="like_post"),   # MEMBER - 2
    path("unlike/", unlike_post_view, name="unlike_post"),   # MEMBER - 2
    path("likes/count/", post_likes_count_view, name="post_likes_count"),   # MEMBER - 2
    path("likes/users/", post_likes_users_view, name="post_likes_users"),   # MEMBER - 2
]
