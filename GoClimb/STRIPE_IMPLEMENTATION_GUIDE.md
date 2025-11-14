# Stripe Payment Implementation Guide - Backend Developer

## Overview
This guide is for the **backend developer** to implement Stripe payment processing for GoClimb's membership system. The frontend is already complete and ready to integrate.

---

## Current System Configuration

### Pricing
- **Amount:** S$0.60 SGD (60 cents in Singapore Dollars)
- **Type:** One-time payment for lifetime membership
- **Currency:** SGD (Singapore Dollars) - **ALL payments use SGD**

### Supported Payment Methods
1. **Credit/Debit Card** - Visa, Mastercard, Amex, etc.
2. **PayNow** - Singapore QR code payment system

---

## Payment Flow

```
User (Guest)
    ↓
Tries to access restricted feature (AR, Forum, etc.)
    ↓
Frontend redirects to PreSignUpScreen
    ↓
User clicks "Join Now!" (S$0.60)
    ↓
Frontend redirects to PaymentScreen
    ↓
User selects payment method (Card/PayNow/Google Pay)
    ↓
Frontend calls: POST /payment/create-payment-intent/
    ← Backend creates Stripe PaymentIntent
    ← Returns: { clientSecret, paymentIntentId }
    ↓
Frontend processes payment with Stripe SDK
    ↓
Payment succeeds
    ↓
Frontend redirects to SignUpScreen with paymentId
    ↓
Frontend calls: POST /payment/verify-payment/
    ← Backend verifies payment with Stripe
    ← Returns: { verified: true, success: true }
    ↓
User creates account
    ↓
Full access granted
```

---

## Backend Implementation

### 1. Install Stripe Python SDK

```bash
pip install stripe
```

### 2. Add Stripe Keys to Settings

Add to your Django `settings.py`:

```python
# Stripe Configuration
STRIPE_SECRET_KEY = 'sk_live_YOUR_SECRET_KEY_HERE'  # Get from Stripe Dashboard
STRIPE_PUBLISHABLE_KEY = 'pk_live_YOUR_PUBLISHABLE_KEY_HERE'

# For testing, use test keys:
# STRIPE_SECRET_KEY = 'sk_test_...'
# STRIPE_PUBLISHABLE_KEY = 'pk_test_...'
```

**Get your keys from:** https://dashboard.stripe.com/apikeys

⚠️ **IMPORTANT:** Never commit secret keys to version control!

---

### 3. Create Payment Intent Endpoint

**Endpoint:** `POST /payment/create-payment-intent/`

**What it does:** Creates a Stripe PaymentIntent and returns the client secret for the frontend to complete payment.

**Request Body:**
```json
{
  "amount": 60,
  "currency": "sgd",
  "paymentMethodTypes": ["card"]  // or ["paynow"] for PayNow QR payment
}
```

**Implementation:**

```python
# payments/views.py
import stripe
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

# Initialize Stripe with your secret key
stripe.api_key = settings.STRIPE_SECRET_KEY

@api_view(['POST'])
@permission_classes([AllowAny])  # No authentication required for payment creation
def create_payment_intent(request):
    """
    Creates a Stripe PaymentIntent for GoClimb membership payment.
    
    Expected request body:
    {
        "amount": 60,  // Amount in cents (S$0.60)
        "currency": "sgd",  // Always SGD
        "paymentMethodTypes": ["card"]  // or ["paynow"]
    }
    
    Returns:
    {
        "clientSecret": "pi_xxx_secret_xxx",
        "paymentIntentId": "pi_xxx"
    }
    """
    try:
        # Get parameters from request
        amount = request.data.get('amount', 60)  # Default S$0.60 in cents
        currency = request.data.get('currency', 'sgd')  # Default SGD
        payment_method_types = request.data.get('paymentMethodTypes', ['card'])
        
        # Validate amount (should always be 60 cents)
        if amount != 60:
            return Response(
                {'error': 'Invalid amount. Membership costs S$0.60'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate currency (should always be SGD)
        if currency != 'sgd':
            return Response(
                {'error': 'Invalid currency. Only SGD is supported'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create PaymentIntent with Stripe
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency=currency,
            payment_method_types=payment_method_types,
            metadata={
                'app': 'GoClimb',
                'type': 'membership',
                'version': '1.0'
            }
        )
        
        # Return client secret and payment intent ID
        return Response({
            'clientSecret': intent.client_secret,
            'paymentIntentId': intent.id
        }, status=status.HTTP_200_OK)
        
    except stripe.error.StripeError as e:
        # Handle Stripe-specific errors
        return Response(
            {'error': f'Stripe error: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        # Handle other errors
        return Response(
            {'error': f'Server error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
```

---

### 4. Create Payment Verification Endpoint

**Endpoint:** `POST /payment/verify-payment/`

**What it does:** Verifies that a payment was successful and hasn't been used before. Called before allowing user signup.

**Request Body:**
```json
{
  "paymentIntentId": "pi_xxx"
}
```

**Implementation:**

First, create a model to track used payments:

```python
# payments/models.py
from django.db import models
from django.contrib.auth.models import User

class UserPayment(models.Model):
    """
    Tracks payment intents to prevent reuse.
    A payment can only be used once for signup.
    """
    payment_intent_id = models.CharField(max_length=255, unique=True, db_index=True)
    amount = models.IntegerField()  # Amount in cents
    currency = models.CharField(max_length=3, default='sgd')
    status = models.CharField(max_length=50)  # succeeded, pending, failed
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    used_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'user_payments'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.payment_intent_id} - {self.status}"
```

Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

Now create the verification endpoint:

```python
# payments/views.py
from django.utils import timezone
from .models import UserPayment

@api_view(['POST'])
@permission_classes([AllowAny])  # No authentication required for verification
def verify_payment(request):
    """
    Verifies a payment intent before allowing signup.
    
    Expected request body:
    {
        "paymentIntentId": "pi_xxx"
    }
    
    Returns:
    {
        "verified": true,
        "success": true,
        "amount": 60
    }
    """
    try:
        payment_intent_id = request.data.get('paymentIntentId')
        
        if not payment_intent_id:
            return Response(
                {'error': 'Payment intent ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if payment has already been used
        existing_payment = UserPayment.objects.filter(
            payment_intent_id=payment_intent_id
        ).first()
        
        if existing_payment:
            return Response(
                {'error': 'Payment has already been used for signup'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Retrieve payment intent from Stripe
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        # Check if payment succeeded
        if intent.status != 'succeeded':
            return Response(
                {'error': f'Payment not completed. Status: {intent.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify amount and currency
        if intent.amount != 60:
            return Response(
                {'error': 'Invalid payment amount'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if intent.currency != 'sgd':
            return Response(
                {'error': 'Invalid payment currency'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create payment record to mark as used
        UserPayment.objects.create(
            payment_intent_id=payment_intent_id,
            amount=intent.amount,
            currency=intent.currency,
            status=intent.status,
            used_at=timezone.now()
        )
        
        # Return success
        return Response({
            'verified': True,
            'success': True,
            'amount': intent.amount
        }, status=status.HTTP_200_OK)
        
    except stripe.error.StripeError as e:
        return Response(
            {'error': f'Stripe error: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': f'Server error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
```

---

### 5. Add URL Routes

Add to your `urls.py`:

```python
# urls.py
from django.urls import path
from payments.views import create_payment_intent, verify_payment

urlpatterns = [
    # ... your other URLs ...
    
    # Payment endpoints
    path('payment/create-payment-intent/', create_payment_intent, name='create-payment-intent'),
    path('payment/verify-payment/', verify_payment, name='verify-payment'),
]
```

**Expected URLs:**
- `https://goclimb-web.onrender.com/payment/create-payment-intent/`
- `https://goclimb-web.onrender.com/payment/verify-payment/`

---

### 6. Link Payment to User Account (Optional but Recommended)

When a user signs up, link their payment to their account:

```python
# In your signup view
from payments.models import UserPayment

def signup_user(request):
    # ... your signup logic ...
    
    # After user is created successfully
    payment_intent_id = request.data.get('paymentIntentId')
    
    if payment_intent_id:
        # Link payment to user
        payment = UserPayment.objects.filter(
            payment_intent_id=payment_intent_id
        ).first()
        
        if payment:
            payment.user = user
            payment.save()
```

---

## Testing

### Test Mode Setup

1. Use test API keys from Stripe Dashboard
2. Test keys start with `sk_test_` and `pk_test_`
3. No real money is charged in test mode

### Test Cards

**Success:**
- Card: 4242 4242 4242 4242
- Expiry: Any future date (e.g., 12/25)
- CVC: Any 3 digits (e.g., 123)

**Decline:**
- Card: 4000 0000 0000 0002

**Requires Authentication:**
- Card: 4000 0025 0000 3155

### Test PayNow

In test mode, PayNow payments automatically succeed without requiring actual QR code scanning.

### Testing the Flow

1. **Create Payment Intent:**
```bash
curl -X POST https://your-backend.com/payment/create-payment-intent/ \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 60,
    "currency": "sgd",
    "paymentMethodTypes": ["card"]
  }'
```

Expected response:
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

2. **Verify Payment:**
```bash
curl -X POST https://your-backend.com/payment/verify-payment/ \
  -H "Content-Type: application/json" \
  -d '{
    "paymentIntentId": "pi_xxx"
  }'
```

Expected response:
```json
{
  "verified": true,
  "success": true,
  "amount": 60
}
```

---

## Enable PayNow in Stripe Dashboard

1. Go to https://dashboard.stripe.com/settings/payment_methods
2. Find "PayNow" in the list
3. Click "Enable"
4. Save changes

PayNow requires:
- SGD currency
- Singapore-based Stripe account (or enabled for your region)

---

## Production Deployment Checklist

### Before Going Live:

- [ ] **Replace test keys with live keys** in settings.py
- [ ] **Test all payment methods** with real cards (small amounts)
- [ ] **Set up Stripe webhooks** for payment confirmations (recommended)
- [ ] **Add proper logging** for all payment attempts
- [ ] **Implement rate limiting** on payment endpoints
- [ ] **Add monitoring/alerts** for failed payments
- [ ] **Test error scenarios** (declined cards, network failures)
- [ ] **Verify database backups** include payment records
- [ ] **Add admin interface** to view payments
- [ ] **Document refund process** for customer support

### Remove Test Mode Indicators:

⚠️ **CRITICAL:** Remove all test mode code before production!

**In PaymentScreen.js, remove:**
```javascript
// Remove this test card info section:
<View style={styles.testCardInfo}>
  <Text>Test Card: 4242 4242 4242 4242</Text>
</View>
```

**In Stripe config, remove test keys:**
```python
# Remove test keys
# STRIPE_SECRET_KEY = 'sk_test_...'

# Use live keys only
STRIPE_SECRET_KEY = 'sk_live_...'
```

---

## Security Best Practices

1. **Never expose secret keys** - Keep them server-side only
2. **Use HTTPS only** - All payment endpoints must use HTTPS
3. **Validate all inputs** - Check amount, currency, payment method types
4. **Prevent payment reuse** - Track used payment intents in database
5. **Log all attempts** - Keep audit trail of payment attempts
6. **Implement rate limiting** - Prevent abuse of payment endpoints
7. **Use Stripe webhooks** - For reliable payment status updates
8. **Handle errors gracefully** - Return clear error messages
9. **Monitor for fraud** - Use Stripe Radar (included with Stripe)
10. **Keep Stripe SDK updated** - Regular security updates

---

## Webhook Setup (Recommended)

Webhooks provide reliable payment status updates even if the app crashes or loses connection.

### Create Webhook Endpoint:

```python
# payments/views.py
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
import json

@csrf_exempt
def stripe_webhook(request):
    """
    Handle Stripe webhook events.
    """
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    webhook_secret = settings.STRIPE_WEBHOOK_SECRET
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError:
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError:
        return HttpResponse(status=400)
    
    # Handle payment_intent.succeeded event
    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        
        # Update payment record
        UserPayment.objects.filter(
            payment_intent_id=payment_intent['id']
        ).update(status='succeeded')
        
        # Add any additional logic here
    
    return HttpResponse(status=200)
```

Add to urls.py:
```python
path('payment/webhook/', stripe_webhook, name='stripe-webhook'),
```

Configure in Stripe Dashboard:
1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://your-backend.com/payment/webhook/`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy webhook secret to settings.py

---

## Monitoring & Debugging

### View Payments in Stripe Dashboard

https://dashboard.stripe.com/payments

- See all transactions
- View payment details
- Issue refunds
- Export data

### Common Issues

**"Payment intent not found"**
- Check payment intent ID is correct
- Verify using correct Stripe account (test vs live)

**"Payment already used"**
- Payment intent already in UserPayment table
- User trying to reuse same payment

**"Invalid amount"**
- Frontend sending wrong amount
- Check STRIPE_CONFIG.MEMBERSHIP_AMOUNT_SGD = 60

**"Currency not supported"**
- Ensure Stripe account supports SGD
- Check payment_method_types for PayNow

---

## Support & Resources

- **Stripe Documentation:** https://stripe.com/docs
- **Stripe API Reference:** https://stripe.com/docs/api
- **Stripe Python Library:** https://github.com/stripe/stripe-python
- **Stripe Support:** https://support.stripe.com/
- **Stripe Dashboard:** https://dashboard.stripe.com/

---

## Summary for Backend Developer

### What You Need to Implement:

1. ✅ Install Stripe Python SDK: `pip install stripe`
2. ✅ Add Stripe keys to settings.py
3. ✅ Create `UserPayment` model and run migrations
4. ✅ Implement `POST /payment/create-payment-intent/` endpoint
5. ✅ Implement `POST /payment/verify-payment/` endpoint
6. ✅ Add URL routes for both endpoints
7. ✅ Enable PayNow in Stripe Dashboard
8. ✅ Test with test cards and PayNow
9. ✅ Set up webhooks (recommended)
10. ✅ Deploy and test with frontend

### Key Points:

- **Amount:** Always 60 cents (S$0.60)
- **Currency:** Always SGD
- **Payment Methods:** Card, PayNow, Google Pay (uses card type)
- **Security:** Prevent payment reuse, validate all inputs
- **Testing:** Use test keys and test cards
- **Production:** Replace with live keys, remove test indicators

### Frontend is Ready:

The frontend is fully implemented and waiting for these two endpoints:
- `POST /payment/create-payment-intent/`
- `POST /payment/verify-payment/`

Once you implement these, the payment system will work end-to-end!
