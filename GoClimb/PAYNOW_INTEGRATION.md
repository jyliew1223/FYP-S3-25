# PayNow Integration for GoClimb

## Overview
PayNow is now integrated as an alternative payment method alongside credit/debit cards. Users in Singapore can pay using their preferred banking app via QR code.

## Payment Options

### 1. Credit/Debit Card
- **Price:** $9.99 USD
- **Currency:** USD
- **Method:** Stripe CardField
- **Supported Cards:** Visa, Mastercard, Amex, etc.

### 2. PayNow (Singapore)
- **Price:** S$13.50 SGD
- **Currency:** SGD
- **Method:** QR Code scan
- **Supported Banks:** DBS, OCBC, UOB, and all PayNow-enabled banks

## User Experience

### Payment Flow
1. User selects payment method (Card or PayNow)
2. Payment summary updates to show correct currency
3. For Card: User enters card details
4. For PayNow: User sees QR code information
5. User clicks pay button
6. Payment is processed via Stripe
7. User redirects to signup on success

### UI Features
- Toggle buttons to switch between Card and PayNow
- Dynamic pricing display (USD for card, SGD for PayNow)
- Payment method icons (card icon vs QR code icon)
- Contextual help text for each method

## Technical Implementation

### Frontend Changes
- **PaymentScreen.js:** Added payment method selector and PayNow flow
- **stripe.js config:** Added SGD pricing and currency constants
- **Payment handlers:** Separate functions for card and PayNow payments

### Backend Requirements
The backend must support both payment method types:

```python
# Example backend implementation
@api_view(['POST'])
def create_payment_intent(request):
    amount = request.data.get('amount')
    currency = request.data.get('currency')
    payment_method_types = request.data.get('paymentMethodTypes', ['card'])
    
    intent = stripe.PaymentIntent.create(
        amount=amount,
        currency=currency,
        payment_method_types=payment_method_types,  # ['card'] or ['paynow']
        metadata={
            'app': 'GoClimb',
            'type': 'membership'
        }
    )
    
    return Response({
        'clientSecret': intent.client_secret,
        'paymentIntentId': intent.id
    })
```

## Stripe Configuration

### Enable PayNow in Stripe Dashboard
1. Go to https://dashboard.stripe.com/settings/payment_methods
2. Find "PayNow" in the list
3. Click "Enable"
4. Configure settings (if any)
5. Save changes

### Currency Support
- PayNow only works with SGD currency
- Ensure your Stripe account supports SGD
- Set up currency conversion if needed

## Testing

### Test Mode
In Stripe test mode, PayNow payments are simulated:
- QR code generation is mocked
- Payment automatically succeeds
- No actual bank interaction occurs

### Production Mode
In live mode, PayNow works as expected:
- Real QR codes are generated
- Users scan with their banking app
- Actual money is transferred
- Payment confirmation is received

## Pricing Strategy

The pricing is set to be roughly equivalent:
- **Card:** $9.99 USD
- **PayNow:** S$13.50 SGD

Exchange rate used: ~1 USD = 1.35 SGD

You can adjust these values in `src/config/stripe.js`:
```javascript
export const STRIPE_CONFIG = {
  MEMBERSHIP_AMOUNT: 999,        // $9.99 USD
  MEMBERSHIP_AMOUNT_SGD: 1350,   // S$13.50 SGD
  CURRENCY: 'usd',
  CURRENCY_SGD: 'sgd',
};
```

## Benefits

### For Users
- More payment options
- Local currency (SGD) for Singapore users
- Familiar payment method (PayNow)
- No need to enter card details
- Instant bank transfer

### For Business
- Reduced card processing fees (PayNow has lower fees)
- Better conversion rates in Singapore market
- Reduced fraud risk
- Faster settlement times

## Troubleshooting

### PayNow not showing
- Check that PayNow is enabled in Stripe Dashboard
- Verify backend supports 'paynow' payment method type
- Ensure SGD currency is configured

### QR code not displaying
- Check Stripe SDK version (requires recent version)
- Verify payment intent was created with 'paynow' type
- Check console logs for errors

### Payment not completing
- Ensure user completes QR scan in their banking app
- Check payment intent status in Stripe Dashboard
- Verify webhook handlers are working (if implemented)

## Future Enhancements

Potential improvements:
- Add more local payment methods (GrabPay, FavePay, etc.)
- Implement subscription model instead of one-time payment
- Add payment history and receipts
- Support multiple currencies based on user location
- Add promotional pricing for different regions

## Resources

- [Stripe PayNow Documentation](https://stripe.com/docs/payments/paynow)
- [PayNow Official Site](https://www.abs.org.sg/consumer-banking/pay-now)
- [Stripe Payment Methods](https://stripe.com/docs/payments/payment-methods)
