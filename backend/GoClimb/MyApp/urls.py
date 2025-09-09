# users/urls.py

from django.urls import path
from MyApp.Boundary.user_boundary import signup_view
from MyApp.Boundary.auth_boundary import verify_id_token_view, verify_app_check_token_view

from MyApp.Boundary.user_boundary import update_user_info_view

from MyApp.Boundary.user_boundary import delete_user_account_view

# from .Boundary import

urlpatterns = [
    path('signup/', signup_view, name='User Signup'),
    path('verify_id_token/', verify_id_token_view, name='Verify ID Token'),
    path('verify_app_check_token/', verify_app_check_token_view, name='Verify App Check Token'),
    ###############
    # Yehuda 1 Start
    ###############
      path("users/update-info/", update_user_info_view, name="user_update_info"),
    ###############
    # Yehuda 1 End
    ###############
    ################
    # Yehuda 2 Start
    ################
      path("users/delete/", delete_user_account_view, name="user_delete"),
    ##############
    # Yehuda 2 End
    ##############
]


