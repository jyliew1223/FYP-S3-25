# users/urls.py

from django.urls import path
from MyApp.Boundary.user_boundary import signup_view
from MyApp.Boundary.auth_boundary import verify_id_token_view, verify_app_check_token_view
# from MyApp.Boundary.crag_info import crag_info_view, crag_monthly_ranking_view, crag_trending_view



# from .Boundary import

urlpatterns = [
    path('signup/', signup_view, name='User Signup'),
    path('verify_id_token/', verify_id_token_view, name='Verify ID Token'),
    path('verify_app_check_token/', verify_app_check_token_view, name='Verify App Check Token'),
    
    
    ### 
    #wei rong START edit
    ###
    # path('crag_info/', crag_info_view, name='Crag Info'),
    # path('crag_monthly_ranking/', crag_monthly_ranking_view, name='Crag Monthly Ranking'),
    # path('crag_trending/', crag_trending_view, name='Crag Trending'),  
    ### 
    #wei rong END edit
    ###
]
