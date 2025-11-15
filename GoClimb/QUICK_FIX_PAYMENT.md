# Quick Fix: Payment Issues

## TL;DR - The Problem

You're using **LIVE Stripe keys** but testing with **test cards**. They don't work together!

## The Quick Fix (Choose One)

### Option A: Switch to Test Mode (Recommended)

**1. Update Frontend** - Edit `src/config/stripe.js`:
```javascript
PUBLISHABLE_KEY: 'pk_test_YOUR_KEY_HERE',  // Change from pk_live_ to pk_test_
```

**2. Update Backend** - Tell your backend dev to use:
```python
STRIPE_SECRET_KEY = 'sk_test_YOUR_KEY_HERE'  # Change from sk_live_ to sk_test_
```

**3. Test with:**
- Card: `4242 4242 4242 4242`
- Expiry: `12/25`
- CVC: `123`

### Option B: Use Real Cards

Keep live keys, but use a **real credit card** instead of test cards.

## Why This Happened

| Your Setup | What Works | What Doesn't |
|------------|------------|--------------|
| Live keys (`pk_live_...`) | Real cards ✅ | Test cards ❌ |
| Test keys (`pk_test_...`) | Test cards ✅ | Real cards ❌ |

You had: Live keys + Test card = ❌ Declined

## Test It

1. Make the change above
2. Restart your app
3. Try payment again
4. Check console for `[PaymentScreen]` logs

## Still Not Working?

Check console logs and see **PAYMENT_TROUBLESHOOTING.md** for detailed help.

## Files to Check

- `src/config/stripe.js` - Frontend key
- Backend settings - Secret key (ask your backend dev)
- Both must match: test with test, live with live

---

**Quick Answer:** Use test keys for development, live keys for production!
