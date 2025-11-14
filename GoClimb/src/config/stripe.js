// GoClimb/src/config/stripe.js

/**
 * Stripe Configuration
 * 
 * Get your keys from: https://dashboard.stripe.com/test/apikeys
 * 
 * IMPORTANT: 
 * - Use TEST keys (pk_test_...) for development
 * - Use LIVE keys (pk_live_...) for production
 * - Never commit live keys to version control
 */

export const STRIPE_CONFIG = {
  // Replace with your actual Stripe publishable key
  PUBLISHABLE_KEY: 'pk_live_51SRsCKB8lh8sqtdbcgP1eRHwdymNgteGNMz4iexHFWocsEd5R2R3DZPnEDHSN5AuwdN8P9hVLvwiO9O9KtrlNTlf00V10yUWcL',
  
  // Membership pricing (SGD is base currency)
  MEMBERSHIP_AMOUNT_SGD: 60, // S$0.60 SGD in cents
  CURRENCY_SGD: 'sgd',
};
