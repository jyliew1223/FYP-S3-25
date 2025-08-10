# users/urls.py

from django.urls import path
from MyApp.Boundary.user_boundary import signup_view, verify_id_token_view

# from .Boundary import

urlpatterns = [
    path('signup/', signup_view, name='User Signup'),
    path('verify_id_token/', verify_id_token_view, name='Verify ID Token'),
]
