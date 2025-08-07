# climbing/urls.py

from django.urls import path
from .views import hello_world, login_or_signup

urlpatterns = [
    path('hello/', hello_world, name='hello_world'),
    path('firebase-auth/', login_or_signup),
]
