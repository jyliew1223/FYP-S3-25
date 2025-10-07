from django.urls import path

from . import views

from MyApp.Boundary.user_boundary import (
    signup_view,
    get_user_view,
    get_monthly_user_ranking_view,
    delete_profile_view,
)
from MyApp.Boundary.auth_boundary import (
    verify_id_token_view,
    verify_app_check_token_view,
)
from MyApp.Boundary.crag_boundary import (
    get_crag_info_view,
    get_crag_monthly_ranking_view,
    get_trending_crags_view,
)
from MyApp.Boundary.climblog_boundary import (
    get_user_climb_logs_view,
    get_user_climb_stats_view,
)
from MyApp.Boundary.post_boundary import (
    get_post_view,
    get_random_post_view,
    get_post_by_user_id_view,
    delete_post_view,
    get_member_posts_view,
)
from MyApp.Boundary.user_admin import (
    suspend_profile_view
)

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),  # use custom admin
    # ==========================
    # html page
    # ==========================
    path("", views.home, name="home"),
    # ==========================
    # ==========================
    # auth related
    # ==========================
    path("verify_id_token/", verify_id_token_view, name="verify_id_token"),
    path(
        "verify_app_check_token/",
        verify_app_check_token_view,
        name="verify_app_check_token",
    ),
    # ==========================
    # ==========================
    # user related
    # ==========================
    path("signup/", signup_view, name="signup"),
    path("get_user/", get_user_view, name="get_user"),
    path(
        "get_monthly_user_ranking/",
        get_monthly_user_ranking_view,
        name="get_monthly_user_ranking",
    ),
    # ==========================
    # ==========================
    # crag related
    # ==========================
    path("get_crag_info/", get_crag_info_view, name="get_crag_info"),
    path(
        "get_crag_monthly_ranking/",
        get_crag_monthly_ranking_view,
        name="get_crag_monthly_ranking",
    ),
    path("get_trending_crags/", get_trending_crags_view, name="get_trending_crags"),
    path("get_random_posts/", get_random_post_view, name="get_random_post"),
    # ==========================
    # ==========================
    # climb logs related
    # ==========================
    path("get_user_climb_logs/", get_user_climb_logs_view, name="get_user_climb_logs"),
    path(
        "get_user_climb_stats/", get_user_climb_stats_view, name="get_user_climb_stats"
    ),
    # ==========================
    # ==========================
    # post related
    # ==========================
    path("get_post/", get_post_view, name="get_post"),
    path("get_post_by_user_id/", get_post_by_user_id_view, name="get_post_by_user_id"),
    path('post_delete/', delete_post_view, name='post_delete'),   # ADMIN -1 
    path('admin/suspend_profile/', suspend_profile_view, name='suspend_profile'),   # ADMIN - 2
    path('profile_delete/', delete_profile_view, name='profile_delete'),  # Admin_3
    path('posts_by_member/', get_member_posts_view, name='posts_by_member'),  # Admin_04
    # ==========================
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
