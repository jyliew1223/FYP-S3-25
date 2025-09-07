from django.urls import path
from MyApp.Boundary.user_boundary import signup_view
from MyApp.Boundary.auth_boundary import verify_id_token_view, verify_app_check_token_view
from MyApp.Boundary.crag_info import crag_info_view, crag_monthly_ranking_view, crag_trending_view

urlpatterns = [
    path('signup/', signup_view, name='user_signup'),
    path('verify_id_token/', verify_id_token_view, name='verify_id_token'),
    path('verify_app_check_token/', verify_app_check_token_view, name='verify_app_check_token'),

    ### 
    # wei rong START edit
    ###
    path('crag_info/', crag_info_view, name='crag_info'),
    path('crag_monthly_ranking/', crag_monthly_ranking_view, name='crag_monthly_ranking'),
    path('crag_trending/', crag_trending_view, name='crag_trending'),  
    ### 
    path('climb_logs/', get_user_climb_logs_view, name='climb_logs'),
    path('climb_stats/', get_user_climb_stats_view, name='climb_stats'),
    ### 
    # wei rong END edit
    ###
]
