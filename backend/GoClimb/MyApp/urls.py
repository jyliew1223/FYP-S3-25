# users/urls.py

from django.urls import path
from MyApp.Boundary.user_boundary import signup_view
from MyApp.Boundary.auth_boundary import verify_id_token_view, verify_app_check_token_view

# from .Boundary import

urlpatterns = [
    path('signup/', signup_view, name='User Signup'),
    path('verify_id_token/', verify_id_token_view, name='Verify ID Token'),
    path('verify_app_check_token/', verify_app_check_token_view, name='Verify App Check Token'),
]
