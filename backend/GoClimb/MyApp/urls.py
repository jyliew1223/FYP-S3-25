# users/urls.py

from django.urls import path
from MyApp.Boundary.user_boundary import signup_view, signin_view

# from .Boundary import

urlpatterns = [
    path('signup/', signup_view, name='User Signup'),
    path('login/', signin_view, name='User Signin'),
]
