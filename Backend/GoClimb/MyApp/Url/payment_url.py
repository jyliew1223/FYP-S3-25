from django.urls import path
from MyApp.Views import payment_views, webhook_views

urlpatterns = [
    # Payment Intent Management
    path('create-payment-intent/', payment_views.create_payment_intent, name='create-payment-intent'),
    path('verify-payment/', payment_views.verify_payment, name='verify-payment'),
    
    # Payment Status and History
    path('status/<str:payment_intent_id>/', payment_views.check_payment_status, name='check-payment-status'),
    path('history/<str:user_id>/', payment_views.get_payment_history, name='get-payment-history'),
    
    # Webhook endpoint
    path('webhook/', webhook_views.stripe_webhook, name='stripe-webhook'),
]