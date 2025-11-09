from django.urls import path

from MyApp.Boundary.user_boundary import (
    get_user_view,
    get_monthly_user_ranking_view,
    update_user_view,
    delete_user_account_view,   # USER_02
    update_user_info_view,   # USER_03
)

urlpatterns = [
    path("get_user/", get_user_view, name="get_user"),
    path("get_monthly_user_ranking/", get_monthly_user_ranking_view, name="get_monthly_user_ranking"),
    path("update/", update_user_view, name="update_user"),
    path("delete", delete_user_account_view, name="delete_user_account"),   # USER_02
    path("update", update_user_info_view, name="update_user_info_view"),   # USER_03
]
