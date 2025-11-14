import stripe
import json
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.utils.decorators import method_decorator
from decouple import config
from django.conf import settings

from MyApp.Entity.payment import UserPayment

# Set Stripe API key
stripe.api_key = config('STRIPE_SECRET_KEY', default='')


@csrf_exempt
@require_POST
def stripe_webhook(request):
    """
    Handle Stripe webhook events for real-time payment updates
    """
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    endpoint_secret = config('STRIPE_WEBHOOK_SECRET', default='')
    
    if not endpoint_secret:
        return HttpResponse('Webhook secret not configured', status=400)
    
    try:
        # Verify webhook signature
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError:
        # Invalid payload
        return HttpResponse('Invalid payload', status=400)
    except stripe.error.SignatureVerificationError:
        # Invalid signature
        return HttpResponse('Invalid signature', status=400)
    
    # Handle the event
    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        handle_payment_succeeded(payment_intent)
        
    elif event['type'] == 'payment_intent.payment_failed':
        payment_intent = event['data']['object']
        handle_payment_failed(payment_intent)
        
    elif event['type'] == 'payment_intent.canceled':
        payment_intent = event['data']['object']
        handle_payment_canceled(payment_intent)
        
    else:
        print(f'Unhandled event type: {event["type"]}')
    
    return HttpResponse('Success', status=200)


def handle_payment_succeeded(payment_intent):
    """Handle successful payment"""
    payment_intent_id = payment_intent['id']
    
    try:
        # Update or create payment record
        payment, created = UserPayment.objects.get_or_create(
            payment_intent_id=payment_intent_id,
            defaults={
                'amount': payment_intent['amount'],
                'currency': payment_intent['currency'],
                'status': payment_intent['status'],
                'metadata': payment_intent.get('metadata', {})
            }
        )
        
        if not created:
            # Update existing record
            payment.status = payment_intent['status']
            payment.metadata = payment_intent.get('metadata', {})
            payment.save()
        
        print(f'Payment succeeded: {payment_intent_id}')
        
    except Exception as e:
        print(f'Error handling payment success: {e}')


def handle_payment_failed(payment_intent):
    """Handle failed payment"""
    payment_intent_id = payment_intent['id']
    
    try:
        # Update payment record if exists
        payment = UserPayment.objects.filter(
            payment_intent_id=payment_intent_id
        ).first()
        
        if payment:
            payment.status = payment_intent['status']
            payment.save()
        
        print(f'Payment failed: {payment_intent_id}')
        
    except Exception as e:
        print(f'Error handling payment failure: {e}')


def handle_payment_canceled(payment_intent):
    """Handle canceled payment"""
    payment_intent_id = payment_intent['id']
    
    try:
        # Update payment record if exists
        payment = UserPayment.objects.filter(
            payment_intent_id=payment_intent_id
        ).first()
        
        if payment:
            payment.status = payment_intent['status']
            payment.save()
        
        print(f'Payment canceled: {payment_intent_id}')
        
    except Exception as e:
        print(f'Error handling payment cancellation: {e}')