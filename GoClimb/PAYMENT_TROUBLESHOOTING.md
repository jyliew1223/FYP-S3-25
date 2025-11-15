# Payment Troubleshooting Guide

## Issue: "You need to create payment intent" Error

### Current Status
✅ **Backend is working correctly** - Tested and confirmed returning valid payment intents
✅ **Stripe is properly initialized** - App.js has StripeProvider with publishable key
✅ **Frontend code updated** - Added extensive logging to identify the issue

### Problem Analysis

The error "You need to create payment intent" typically occurs when:
1. The `clientSecret` is not properly passed to `confirmPayment()`
2. The payment intent has expired (they expire after 24 hours)
3. The Stripe SDK is not properly initialized
4. There's a mismatch between test/live keys

### Test Results

**Backend Test (Successful):**
```bash
curl -X POST "https://goclimb-web.onrender.com/payment/create-payment-intent/" \
  -H "Content-Type: application/json" \
  -d '{"amount": 60, "currency": "sgd", "paymentMethodTypes": ["card"]}'
```

**Response:**
```json
{
  "success": true,
  "clientSecret": "pi_3STdrjB8lh8sqtdb1LmsNrQV_secret_9WCPpX8kSdI3G68miFheHlMbg",
  "paymentIntentId": "pi_3STdrjB8lh8sqtdb1LmsNrQV"
}
```

✅ Backend is returning valid payment intents with `success: true`

### Updated Code

The PaymentScreen.js has been updated with:
1. **Enhanced logging** - Every step now logs to console
2. **Better error handling** - Checks for `data.success` field
3. **Detailed error messages** - Shows exactly what went wrong

### Debugging Steps

#### 1. Check Console Logs

When you click "Pay Now", look for these logs in your console:

```
[PaymentScreen] Calling: https://goclimb-web.onrender.com/payment/create-payment-intent/
[PaymentScreen] Request body: {amount: 60, currency: "sgd", paymentMethodTypes: ["card"]}
[PaymentScreen] Response status: 200
[PaymentScreen] Backend response: {success: true, clientSecret: "pi_...", paymentIntentId: "pi_..."}
[PaymentScreen] Client secret received: pi_...
[PaymentScreen] Confirming payment with Stripe...
[PaymentScreen] Stripe confirmPayment result: {...}
```

#### 2. Common Issues & Solutions

**Issue: "You need to create payment intent"**
- **Cause:** The clientSecret is not being passed correctly
- **Check:** Look for `[PaymentScreen] Client secret received:` in logs
- **Solution:** Ensure backend returns `success: true` along with `clientSecret`

**Issue: Card declined (4242 4242 4242 4242)**
- **Cause:** Using test card with live keys or vice versa
- **Check:** Verify key type in `src/config/stripe.js`
- **Solution:** 
  - Test keys: `pk_test_...` → Use test cards
  - Live keys: `pk_live_...` → Use real cards

**Issue: Real card declined**
- **Possible causes:**
  1. Insufficient funds
  2. Card doesn't support international payments (Singapore merchant)
  3. 3D Secure authentication required
  4. Card issuer blocking the transaction
- **Solution:** 
  - Try a different card
  - Contact card issuer
  - Check Stripe Dashboard for decline reason

#### 3. Verify Stripe Configuration

**Check `src/config/stripe.js`:**
```javascript
export const STRIPE_CONFIG = {
  PUBLISHABLE_KEY: 'pk_live_51SRsCKB8lh8sqtdb...',  // ← Should match backend
  MEMBERSHIP_AMOUNT_SGD: 60,  // ← S$0.60 in cents
  CURRENCY_SGD: 'sgd',
};
```

**Verify:**
- [ ] Publishable key matches the secret key on backend
- [ ] Amount is 60 (cents)
- [ ] Currency is 'sgd'

#### 4. Test with Different Cards

**Test Cards (for test mode only):**

| Card Number | Result | Use Case |
|-------------|--------|----------|
| 4242 4242 4242 4242 | Success | Basic test |
| 4000 0025 0000 3155 | Requires authentication | Test 3D Secure |
| 4000 0000 0000 9995 | Declined (insufficient funds) | Test decline |
| 4000 0000 0000 0002 | Declined (generic) | Test decline |

**Important:** Test cards ONLY work with test keys (`pk_test_...`)

#### 5. Check Stripe Dashboard

1. Go to: https://dashboard.stripe.com/payments
2. Look for recent payment attempts
3. Check the status and any error messages
4. View logs for detailed information

### Key Differences: Test vs Live Mode

| Aspect | Test Mode | Live Mode |
|--------|-----------|-----------|
| Keys | `pk_test_...` / `sk_test_...` | `pk_live_...` / `sk_live_...` |
| Cards | Test cards only | Real cards only |
| Money | No real money | Real money charged |
| Dashboard | https://dashboard.stripe.com/test/payments | https://dashboard.stripe.com/payments |

### Current Configuration

**You are using:** LIVE MODE (`pk_live_...`)

This means:
- ❌ Test cards (4242...) will be DECLINED
- ✅ Real cards should work
- 💰 Real money will be charged

### Recommended Actions

#### Option 1: Switch to Test Mode (Recommended for Development)

1. Get test keys from: https://dashboard.stripe.com/test/apikeys
2. Update `src/config/stripe.js`:
```javascript
PUBLISHABLE_KEY: 'pk_test_YOUR_TEST_KEY_HERE',
```
3. Update backend with test secret key
4. Use test card: 4242 4242 4242 4242

#### Option 2: Continue with Live Mode

1. Use a real credit/debit card
2. Ensure card supports international payments
3. Check with card issuer if declined
4. Monitor Stripe Dashboard for decline reasons

### Testing Checklist

- [ ] Backend returns `success: true` in response
- [ ] `clientSecret` is present in backend response
- [ ] Console shows "Client secret received"
- [ ] Stripe keys match (test with test, live with live)
- [ ] Using appropriate card for mode (test card for test mode, real card for live mode)
- [ ] Card details are complete (number, expiry, CVC)
- [ ] Amount is 60 cents (S$0.60)
- [ ] Currency is SGD

### Next Steps

1. **Run the app** and attempt a payment
2. **Check the console logs** - Look for the detailed logs added
3. **Copy the logs** and share them if issue persists
4. **Check Stripe Dashboard** for any payment attempts

### Expected Console Output (Success)

```
[PaymentScreen] Calling: https://goclimb-web.onrender.com/payment/create-payment-intent/
[PaymentScreen] Request body: {amount: 60, currency: "sgd", paymentMethodTypes: ["card"]}
[PaymentScreen] Response status: 200
[PaymentScreen] Backend response: {success: true, clientSecret: "pi_xxx_secret_xxx", paymentIntentId: "pi_xxx"}
[PaymentScreen] Client secret received: pi_xxx_secret_xxx
[PaymentScreen] Confirming payment with Stripe...
[PaymentScreen] Stripe confirmPayment result: {paymentIntent: {id: "pi_xxx", status: "Succeeded"}}
[PaymentScreen] Payment intent status: Succeeded
```

### Contact Support

If the issue persists after following these steps:

1. **Collect logs:** Copy all `[PaymentScreen]` logs from console
2. **Check Stripe Dashboard:** Note any payment attempts and their status
3. **Verify keys:** Ensure frontend and backend use matching key pairs
4. **Test mode first:** Always test in test mode before going live

### Additional Resources

- **Stripe React Native Docs:** https://stripe.com/docs/payments/accept-a-payment?platform=react-native
- **Stripe Dashboard:** https://dashboard.stripe.com/
- **Test Cards:** https://stripe.com/docs/testing#cards
- **Decline Codes:** https://stripe.com/docs/declines/codes
