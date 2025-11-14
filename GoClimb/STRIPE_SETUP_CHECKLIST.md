# Stripe Payment Setup Checklist

## ✅ Completed (Frontend)

- [x] Stripe SDK installed (`@stripe/stripe-react-native`)
- [x] StripeProvider wrapper added to App.js
- [x] PaymentScreen created with CardField integration
- [x] PreSignUpScreen marketing page created
- [x] SignUpScreen updated with payment verification
- [x] API endpoints configured in constants/api.js
- [x] Stripe config file created
- [x] All guest redirects updated to PreSignUp

## 🔧 Configuration Required

### 1. Add Stripe Publishable Key
**File:** `GoClimb/src/config/stripe.js`

Replace:
```javascript
PUBLISHABLE_KEY: 'pk_test_YOUR_PUBLISHABLE_KEY_HERE',
```

With your actual key from: https://dashboard.stripe.com/test/apikeys

### 2. Verify Backend Endpoints (Assuming Ready)

The app expects these endpoints:

**Create Payment Intent:**
- URL: `https://goclimb-web.onrender.com/payment/create-payment-intent/`
- Method: POST
- Body (Card/Google Pay): `{ amount: 60, currency: 'sgd', paymentMethodTypes: ['card'] }`
- Body (PayNow): `{ amount: 60, currency: 'sgd', paymentMethodTypes: ['paynow'] }`
- Response: `{ clientSecret: 'pi_xxx', paymentIntentId: 'pi_xxx' }`
- Note: All payments now use SGD (Singapore Dollars) at S$0.60

**Verify Payment:**
- URL: `https://goclimb-web.onrender.com/payment/verify-payment/`
- Method: POST
- Body: `{ paymentIntentId: 'pi_xxx' }`
- Response: `{ verified: true, success: true }`

## 🧪 Testing

### Test Payment Methods (Stripe Test Mode)

**Credit/Debit Cards:**
- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002
- **Expiry:** Any future date (e.g., 12/25, 01/26)
- **CVC:** Any 3 digits (e.g., 123, 456)
- **Requires Auth:** 4000 0025 0000 3155
- Use any future expiry date and any 3-digit CVC

**PayNow (Singapore):**
- In test mode, Stripe will simulate PayNow QR code generation
- The payment will be marked as successful automatically in test mode
- In production, users will scan the QR code with their banking app

### Test Flow

**Card Payment:**
1. Open app (not logged in)
2. Try to access restricted feature → Redirects to PreSignUpScreen
3. Click "Join Now!" → PaymentScreen
4. Select "Card" payment method
5. Enter test card: 4242 4242 4242 4242, Expiry: 12/25, CVC: 123
6. Click "Pay S$0.60"
7. Should redirect to SignUpScreen with payment verified
8. Create account → Full access granted

**PayNow Payment:**
1. Open app (not logged in)
2. Try to access restricted feature → Redirects to PreSignUpScreen
3. Click "Join Now!" → PaymentScreen
4. Select "PayNow" payment method
5. Click "Pay S$0.60"
6. QR code displayed (in test mode, auto-succeeds)
7. Should redirect to SignUpScreen with payment verified
8. Create account → Full access granted

**Google Pay (Android):**
1. Open app (not logged in)
2. Try to access restricted feature → Redirects to PreSignUpScreen
3. Click "Join Now!" → PaymentScreen
4. Select "Google Pay" payment method (if available)
5. Click "Pay S$0.60"
6. Google Pay sheet appears (in test mode, auto-succeeds)
7. Should redirect to SignUpScreen with payment verified
8. Create account → Full access granted

## 📱 Platform-Specific Setup

### iOS (if applicable)
```bash
cd ios
pod install
cd ..
```

### Android
Already configured - no additional steps needed.

## 🚀 Running the App

```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## 🐛 Troubleshooting

### "StripeProvider not found"
- Make sure you ran `npm install` after adding the package
- Restart Metro bundler

### "Payment intent creation failed"
- Check backend is running and accessible
- Verify API endpoint URLs in `src/constants/api.js`
- Check backend logs for errors

### "Payment verification failed"
- Ensure backend `/payment/verify-payment/` endpoint is working
- Check that payment intent ID is being passed correctly
- Verify backend is checking payment status with Stripe

### Card input not showing
- Make sure StripeProvider wraps your app in App.js
- Check that publishable key is set correctly
- Restart the app after adding the key

## 📝 Notes

- Currently using TEST mode keys
- Before production, replace with LIVE keys
- Never commit live keys to version control
- Consider using environment variables for keys
