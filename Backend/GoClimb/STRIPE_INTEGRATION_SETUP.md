# Stripe Payment Integration Setup Guide

## ✅ What's Been Implemented

Your Django backend now has complete Stripe payment integration with the following components:

### 1. Database Model
- `UserPayment` model to track payment intents and prevent reuse
- Proper indexing and relationships with User model
- Migration created and applied successfully

### 2. Payment Controller (`MyApp/Controller/payment_controller.py`)
- `create_payment_intent()` - Creates Stripe PaymentIntent for S$0.60 membership
- `verify_payment()` - Verifies payment before allowing signup
- `check_payment_status()` - Checks current payment status
- `get_payment_history()` - Gets user's payment history

### 3. API Endpoints
- `POST /payment/create-payment-intent/` - Create payment intent
- `POST /payment/verify-payment/` - Verify completed payment
- `GET /payment/status/<payment_intent_id>/` - Check payment status
- `GET /payment/history/<user_id>/` - Get payment history

### 4. Integration with User Signup
- Modified `signup_user()` to accept optional `payment_intent_id`
- Automatic payment verification during signup process

## 🔧 Setup Instructions

### Step 1: Get Stripe API Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

### Step 2: Update Environment Variables
Update your `.env` file with real Stripe keys:

```env
# Replace with your actual Stripe test keys
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Step 3: Install Dependencies
The `stripe` package has been added to `requirements.txt` and installed.

### Step 4: Enable PayNow (Optional)
1. Go to [Stripe Payment Methods](https://dashboard.stripe.com/settings/payment_methods)
2. Enable PayNow for Singapore customers
3. This allows local bank transfers and digital wallets

## 🧪 Testing

### Test Cards for Development
Use these test card numbers in your React Native app:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`
- **Expiry**: Any future date (e.g., `12/25`)
- **CVC**: Any 3 digits (e.g., `123`)

### API Testing Examples

#### 1. Create Payment Intent
```bash
curl -X POST https://goclimb-web.onrender.com/payment/create-payment-intent/ \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 60,
    "currency": "sgd",
    "paymentMethodTypes": ["card"]
  }'
```

**Response:**
```json
{
  "success": true,
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

#### 2. Verify Payment
```bash
curl -X POST https://goclimb-web.onrender.com/payment/verify-payment/ \
  -H "Content-Type: application/json" \
  -d '{
    "paymentIntentId": "pi_xxx",
    "userId": "optional_user_id"
  }'
```

**Response:**
```json
{
  "success": true,
  "verified": true,
  "amount": 60,
  "currency": "sgd"
}
```

## 🔄 Frontend Integration

Your React Native app is already configured to use these endpoints. The payment flow:

1. **Create Payment Intent**: App calls `/payment/create-payment-intent/`
2. **Process Payment**: User completes payment with Stripe
3. **Verify Payment**: App calls `/payment/verify-payment/` before signup
4. **Complete Signup**: User registration proceeds if payment verified

## 🚀 Deployment

### For Production:
1. Get live Stripe keys from [Live Dashboard](https://dashboard.stripe.com/apikeys)
2. Update production environment variables
3. Test with real payment methods
4. Monitor payments in Stripe Dashboard

### Security Notes:
- Never expose secret keys in frontend code
- Always verify payments on the backend
- Use HTTPS in production
- Monitor for suspicious activity

## 📊 Monitoring

### Stripe Dashboard
- View all payments: https://dashboard.stripe.com/payments
- Monitor failed payments
- Set up webhooks for real-time updates
- Download transaction reports

### Database Queries
```python
# Get all successful payments
UserPayment.objects.filter(status='succeeded')

# Get unused payments
UserPayment.objects.filter(used_at__isnull=True)

# Get user's payment history
UserPayment.objects.filter(user=user).order_by('-created_at')
```

## 🛠 Troubleshooting

### Common Issues:

1. **"Invalid amount" error**
   - Ensure amount is exactly 60 (cents)
   - Check currency is 'sgd'

2. **"Payment already used" error**
   - Each payment can only be used once for signup
   - Create new payment intent for new attempts

3. **"Payment not completed" error**
   - Payment status must be 'succeeded'
   - Check Stripe dashboard for payment status

4. **Stripe API errors**
   - Verify API keys are correct
   - Check network connectivity
   - Review Stripe logs in dashboard

## ✅ Verification Checklist

- [ ] Stripe package installed
- [ ] Database migration applied
- [ ] Environment variables updated with real keys
- [ ] API endpoints responding correctly
- [ ] Test payments working with test cards
- [ ] Payment verification preventing duplicate usage
- [ ] User signup integration working

Your Stripe payment integration is now complete and ready for testing! 🎉