# GoClimb Payment System Summary

## Current Configuration

### Pricing
- **Amount:** S$0.60 SGD (60 cents)
- **Type:** One-time payment
- **Access:** Lifetime membership

### Supported Payment Methods

1. **Credit/Debit Card**
   - All major cards (Visa, Mastercard, Amex)
   - Powered by Stripe
   - Currency: SGD

2. **PayNow (Singapore)**
   - QR code payment
   - All Singapore banks
   - Currency: SGD

3. **Google Pay (Android only)**
   - Quick tap-to-pay
   - Requires Google Pay setup
   - Currency: SGD

## User Flow

```
Guest User
    ↓
Tries to access restricted feature
    ↓
Redirected to PreSignUpScreen
    ↓
Clicks "Join Now!" (S$0.60)
    ↓
PaymentScreen - Choose payment method
    ↓
Complete payment
    ↓
SignUpScreen - Create account
    ↓
Full access granted
```

## Testing

### Test Card Details
- **Card Number:** 4242 4242 4242 4242
- **Expiry Date:** Any future date (e.g., 12/25)
- **CVC:** Any 3 digits (e.g., 123)

### Test Modes
- **Card:** Enter test card details → Auto-succeeds
- **PayNow:** QR code shown → Auto-succeeds in test mode
- **Google Pay:** Payment sheet shown → Auto-succeeds in test mode

## Files Modified

### Configuration
- `src/config/stripe.js` - Pricing and currency settings
- `App.js` - StripeProvider wrapper

### Screens
- `src/screens/PreSignUpScreen.js` - Compact marketing page
- `src/screens/PaymentScreen.js` - Multi-method payment
- `src/screens/SignUpScreen.js` - Payment verification

### API
- `src/constants/api.js` - Payment endpoints

## Backend Requirements

### Endpoints Needed
1. `/payment/create-payment-intent/`
   - Creates Stripe payment intent
   - Accepts: amount, currency, paymentMethodTypes
   - Returns: clientSecret, paymentIntentId

2. `/payment/verify-payment/`
   - Verifies payment before signup
   - Accepts: paymentIntentId
   - Returns: verified (boolean)

### Payment Method Types
- `['card']` - For card and Google Pay
- `['paynow']` - For PayNow QR payments

## Key Features

### PreSignUpScreen
- Compact design (no scrolling needed)
- Shows 5 key features as chips
- Clear pricing (S$0.60)
- "Join Now!" CTA button

### PaymentScreen
- Toggle between payment methods
- Dynamic UI based on selection
- Test card info for development
- Secure Stripe integration

### Payment Verification
- Checks payment on SignUpScreen mount
- Prevents signup without payment
- Stores verification in AsyncStorage
- Redirects to PreSignUp if invalid

## Production Checklist

Before going live:
- [ ] Test all payment methods on real devices
- [ ] Verify backend endpoints are working
- [ ] Enable PayNow in Stripe Dashboard
- [ ] Test Google Pay with real Google account
- [ ] Update pricing if needed (currently S$0.60)
- [ ] Set up Stripe webhooks for payment confirmations
- [ ] Add payment receipt/confirmation emails
- [ ] Test payment failure scenarios
- [ ] Verify currency conversion (if supporting multiple currencies)
- [ ] Add terms of service and refund policy

## Troubleshooting

### Google Pay not showing
- Only available on Android
- Requires Google Pay to be initialized
- Check `googlePayReady` state

### Payment not completing
- Check backend logs for errors
- Verify Stripe keys are correct
- Ensure payment intent is created successfully
- Check network connectivity

### PreSignUpScreen too tall
- Already optimized to fit without scrolling
- Features shown as compact chips
- Reduced padding and margins

## Future Enhancements

Potential improvements:
- Add more payment methods (GrabPay, FavePay)
- Support multiple currencies based on location
- Add subscription model option
- Implement promotional pricing
- Add referral discounts
- Payment history in profile
- Receipt generation and email
