# Url/auth_url.py

from django.urls import path

from MyApp.Boundary.auth_boundary import (
    signup_view,
    verify_id_token_view,
    verify_app_check_token_view,
)

urlpatterns = [
    path("signup/", signup_view, name="signup"),
    path("verify_id_token/", verify_id_token_view, name="verify_id_token"),
    path(
        "verify_app_check_token/",
        verify_app_check_token_view,
        name="verify_app_check_token",
    ),
]
