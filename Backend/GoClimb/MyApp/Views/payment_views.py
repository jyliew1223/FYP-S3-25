from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from MyApp.Controller import payment_controller


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def create_payment_intent(request):
    """
    Creates a Stripe PaymentIntent for GoClimb membership payment.
    
    Expected POST data:
    {
        "amount": 60,
        "currency": "sgd",
        "paymentMethodTypes": ["card"]
    }
    
    Returns:
    {
        "success": true,
        "clientSecret": "pi_xxx_secret_xxx",
        "paymentIntentId": "pi_xxx"
    }
    """
    try:
        # Get request data with defaults
        amount = request.data.get('amount', 60)
        currency = request.data.get('currency', 'sgd')
        payment_method_types = request.data.get('paymentMethodTypes', ['card'])
        
        # Call controller function
        result = payment_controller.create_payment_intent(
            amount=amount,
            currency=currency,
            payment_method_types=payment_method_types
        )
        
        # Return appropriate HTTP status based on result
        if result['success']:
            return Response(result, status=status.HTTP_200_OK)
        else:
            # Determine appropriate error status
            error_code = result.get('code', 'UNKNOWN_ERROR')
            if error_code in ['INVALID_AMOUNT', 'INVALID_CURRENCY']:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
            elif error_code == 'STRIPE_ERROR':
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Unexpected error: {str(e)}',
            'code': 'UNEXPECTED_ERROR'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def verify_payment(request):
    """
    Verifies a payment intent before allowing signup.
    
    Expected POST data:
    {
        "paymentIntentId": "pi_xxx",
        "userId": "optional_user_id"
    }
    
    Returns:
    {
        "success": true,
        "verified": true,
        "amount": 60,
        "currency": "sgd"
    }
    """
    try:
        # Get request data
        payment_intent_id = request.data.get('paymentIntentId')
        user_id = request.data.get('userId')  # Optional
        
        if not payment_intent_id:
            return Response({
                'success': False,
                'error': 'Payment intent ID is required',
                'code': 'MISSING_PAYMENT_ID'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Call controller function
        result = payment_controller.verify_payment(
            payment_intent_id=payment_intent_id,
            user_id=user_id
        )
        
        # Return appropriate HTTP status based on result
        if result['success']:
            return Response(result, status=status.HTTP_200_OK)
        else:
            # Determine appropriate error status
            error_code = result.get('code', 'UNKNOWN_ERROR')
            if error_code in [
                'MISSING_PAYMENT_ID', 
                'PAYMENT_ALREADY_USED', 
                'PAYMENT_NOT_COMPLETED',
                'INVALID_AMOUNT',
                'INVALID_CURRENCY'
            ]:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
            elif error_code == 'STRIPE_ERROR':
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Unexpected error: {str(e)}',
            'code': 'UNEXPECTED_ERROR'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def check_payment_status(request, payment_intent_id):
    """
    Check the current status of a payment intent.
    
    URL: /payment/status/<payment_intent_id>/
    
    Returns:
    {
        "success": true,
        "payment_intent_id": "pi_xxx",
        "status": "succeeded",
        "amount": 60,
        "currency": "sgd",
        "is_used": false
    }
    """
    try:
        # Call controller function
        result = payment_controller.check_payment_status(payment_intent_id)
        
        # Return appropriate HTTP status based on result
        if result['success']:
            return Response(result, status=status.HTTP_200_OK)
        else:
            # Determine appropriate error status
            error_code = result.get('code', 'UNKNOWN_ERROR')
            if error_code == 'MISSING_PAYMENT_ID':
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
            elif error_code == 'STRIPE_ERROR':
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Unexpected error: {str(e)}',
            'code': 'UNEXPECTED_ERROR'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_payment_history(request, user_id):
    """
    Get payment history for a user.
    
    URL: /payment/history/<user_id>/?limit=10
    
    Returns:
    {
        "success": true,
        "payments": [...],
        "total_count": 5
    }
    """
    try:
        # Get query parameters
        limit = int(request.GET.get('limit', 10))
        
        # Call controller function
        result = payment_controller.get_payment_history(
            user_id=user_id,
            limit=limit
        )
        
        # Return appropriate HTTP status based on result
        if result['success']:
            return Response(result, status=status.HTTP_200_OK)
        else:
            # Determine appropriate error status
            error_code = result.get('code', 'UNKNOWN_ERROR')
            if error_code in ['MISSING_USER_ID', 'USER_NOT_FOUND']:
                return Response(result, status=status.HTTP_404_NOT_FOUND)
            else:
                return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
    except ValueError:
        return Response({
            'success': False,
            'error': 'Invalid limit parameter',
            'code': 'INVALID_LIMIT'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Unexpected error: {str(e)}',
            'code': 'UNEXPECTED_ERROR'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)