#Url/admin_urls.py
from django.urls import path
from MyApp.Boundary.user_admin import suspend_profile_view

urlpatterns = [
    path("suspend_profile/", suspend_profile_view, name="suspend_profile"),   # ADMIN - 2
]