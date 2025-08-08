# climbing/urls.py

from django.urls import path
from .views import hello_world_Django, hello_world_REST, login_or_signup

urlpatterns = [
    path("hello_Django/", hello_world_Django, name="hello_world"),
    path("hello_REST/", hello_world_REST, name="hello_world"),
    path("firebase-auth/", login_or_signup),
]
