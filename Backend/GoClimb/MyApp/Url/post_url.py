from django.urls import path

from MyApp.Boundary.post_boundary import (
    get_post_view,
    get_random_post_view,
    get_post_by_user_id_view,
    create_post_view,
    delete_post_view,
    search_posts_view,
)

from MyApp.Boundary.post_likes_boundary import (
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

    path("create_post/", create_post_view, name="create_post"),
    path("like/", like_post_view, name="like_post"),
    path("unlike/", unlike_post_view, name="unlike_post"),
    path("likes/count/", post_likes_count_view, name="post_likes_count"),
    path("likes/users/", post_likes_users_view, name="post_likes_users"),
    path("delete", delete_post_view, name="delete_post"),   # DELETE_03
    path("search/", search_posts_view, name="search_posts"),
]
