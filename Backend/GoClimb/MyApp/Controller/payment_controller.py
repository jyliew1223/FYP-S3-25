import stripe
from typing import Dict, Any, Optional
from django.conf import settings
from django.utils import timezone
from decouple import config

from MyApp.Entity.payment import UserPayment
from MyApp.Entity.user import User
from MyApp.Exceptions.exceptions import InvalidUIDError


# Initialize Stripe with secret key
stripe.api_key = config('STRIPE_SECRET_KEY', default='')


def create_payment_intent(
    amount: int = 60,
    currency: str = 'sgd',
    payment_method_types: list = None
) -> Dict[str, Any]:
    """
    Creates a Stripe PaymentIntent for GoClimb membership payment.
    
    Args:
        amount: Payment amount in cents (default: 60 = S$0.60)
        currency: Payment currency (default: 'sgd')
        payment_method_types: Allowed payment methods (default: ['card'])
    
    Returns:
        Dict containing success status, clientSecret, and paymentIntentId
    """
    try:
        if payment_method_types is None:
            payment_method_types = ['card']
        
        # Validate amount (should always be 60 cents = S$0.60)
        if amount != 60:
            return {
                'success': False,
                'error': 'Invalid amount. Membership costs S$0.60',
                'code': 'INVALID_AMOUNT'
            }
        
        # Validate currency (should always be SGD)
        if currency.lower() != 'sgd':
            return {
                'success': False,
                'error': 'Invalid currency. Only SGD is supported',
                'code': 'INVALID_CURRENCY'
            }
        
        # Create PaymentIntent with Stripe
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency=currency.lower(),
            payment_method_types=payment_method_types,
            metadata={
                'app': 'GoClimb',
                'type': 'membership',
                'version': '1.0'
            }
        )
        
        return {
            'success': True,
            'clientSecret': intent.client_secret,
            'paymentIntentId': intent.id
        }
        
    except stripe.error.StripeError as e:
        return {
            'success': False,
            'error': f'Stripe error: {str(e)}',
            'code': 'STRIPE_ERROR'
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'Server error: {str(e)}',
            'code': 'SERVER_ERROR'
        }


def verify_payment(payment_intent_id: str, user_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Verifies a payment intent before allowing signup.
    
    Args:
        payment_intent_id: Stripe PaymentIntent ID
        user_id: Optional user ID to associate with payment
    
    Returns:
        Dict containing verification status and payment details
    """
    try:
        if not payment_intent_id:
            return {
                'success': False,
                'error': 'Payment intent ID is required',
                'code': 'MISSING_PAYMENT_ID'
            }
        
        # Check if payment has already been used
        existing_payment = UserPayment.objects.filter(
            payment_intent_id=payment_intent_id
        ).first()
        
        if existing_payment and existing_payment.is_used():
            return {
                'success': False,
                'error': 'Payment has already been used for signup',
                'code': 'PAYMENT_ALREADY_USED'
            }
        
        # Retrieve payment intent from Stripe
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        # Check if payment succeeded
        if intent.status != 'succeeded':
            return {
                'success': False,
                'error': f'Payment not completed. Status: {intent.status}',
                'code': 'PAYMENT_NOT_COMPLETED'
            }
        
        # Verify amount and currency
        if intent.amount != 60:
            return {
                'success': False,
                'error': 'Invalid payment amount',
                'code': 'INVALID_AMOUNT'
            }
        
        if intent.currency != 'sgd':
            return {
                'success': False,
                'error': 'Invalid payment currency',
                'code': 'INVALID_CURRENCY'
            }
        
        # Get user if user_id provided
        user = None
        if user_id:
            user = User.objects.filter(user_id=user_id).first()
        
        # Create or update payment record
        if existing_payment:
            # Update existing record
            existing_payment.status = intent.status
            existing_payment.user = user
            existing_payment.metadata = dict(intent.metadata) if intent.metadata else {}
            existing_payment.mark_as_used()
            payment_record = existing_payment
        else:
            # Create new payment record
            payment_record = UserPayment.objects.create(
                payment_intent_id=payment_intent_id,
                amount=intent.amount,
                currency=intent.currency,
                status=intent.status,
                user=user,
                used_at=timezone.now(),
                metadata=dict(intent.metadata) if intent.metadata else {}
            )
        
        return {
            'success': True,
            'verified': True,
            'amount': intent.amount,
            'currency': intent.currency,
            'payment_id': payment_record.id
        }
        
    except stripe.error.StripeError as e:
        return {
            'success': False,
            'error': f'Stripe error: {str(e)}',
            'code': 'STRIPE_ERROR'
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'Server error: {str(e)}',
            'code': 'SERVER_ERROR'
        }


def get_payment_history(user_id: str, limit: int = 10) -> Dict[str, Any]:
    """
    Get payment history for a user.
    
    Args:
        user_id: User ID to get payments for
        limit: Maximum number of payments to return
    
    Returns:
        Dict containing payment history
    """
    try:
        if not user_id:
            return {
                'success': False,
                'error': 'User ID is required',
                'code': 'MISSING_USER_ID'
            }
        
        user = User.objects.filter(user_id=user_id).first()
        if not user:
            return {
                'success': False,
                'error': 'User not found',
                'code': 'USER_NOT_FOUND'
            }
        
        payments = UserPayment.objects.filter(user=user).order_by('-created_at')[:limit]
        
        payment_data = []
        for payment in payments:
            payment_data.append({
                'id': payment.id,
                'payment_intent_id': payment.payment_intent_id,
                'amount': payment.amount,
                'amount_dollars': payment.amount_dollars,
                'currency': payment.currency,
                'status': payment.status,
                'created_at': payment.created_at.isoformat(),
                'used_at': payment.used_at.isoformat() if payment.used_at else None,
                'is_used': payment.is_used()
            })
        
        return {
            'success': True,
            'payments': payment_data,
            'total_count': len(payment_data)
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f'Server error: {str(e)}',
            'code': 'SERVER_ERROR'
        }


def check_payment_status(payment_intent_id: str) -> Dict[str, Any]:
    """
    Check the current status of a payment intent.
    
    Args:
        payment_intent_id: Stripe PaymentIntent ID
    
    Returns:
        Dict containing payment status information
    """
    try:
        if not payment_intent_id:
            return {
                'success': False,
                'error': 'Payment intent ID is required',
                'code': 'MISSING_PAYMENT_ID'
            }
        
        # Get from local database first
        local_payment = UserPayment.objects.filter(
            payment_intent_id=payment_intent_id
        ).first()
        
        # Get current status from Stripe
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        # Update local record if it exists
        if local_payment:
            local_payment.status = intent.status
            local_payment.save(update_fields=['status'])
        
        return {
            'success': True,
            'payment_intent_id': payment_intent_id,
            'status': intent.status,
            'amount': intent.amount,
            'currency': intent.currency,
            'is_used': local_payment.is_used() if local_payment else False,
            'created_at': intent.created,
            'last_updated': intent.status_transitions.get('succeeded_at') or intent.created
        }
        
    except stripe.error.StripeError as e:
        return {
            'success': False,
            'error': f'Stripe error: {str(e)}',
            'code': 'STRIPE_ERROR'
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'Server error: {str(e)}',
            'code': 'SERVER_ERROR'
        }