// Test script to verify payment backend
// Run with: node test_payment_backend.js

const BASE_URL = 'https://goclimb-web.onrender.com';

async function testCreatePaymentIntent() {
  console.log('=== Testing Create Payment Intent ===\n');
  
  const url = `${BASE_URL}/payment/create-payment-intent/`;
  console.log('URL:', url);
  
  const requestBody = {
    amount: 60,
    currency: 'sgd',
    paymentMethodTypes: ['card']
  };
  
  console.log('Request Body:', JSON.stringify(requestBody, null, 2));
  console.log('\nSending request...\n');
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    console.log('Response Status:', response.status);
    console.log('Response OK:', response.ok);
    
    const data = await response.json();
    console.log('\nResponse Data:', JSON.stringify(data, null, 2));
    
    // Validate response
    console.log('\n=== Validation ===');
    console.log('✓ Has success field:', 'success' in data);
    console.log('✓ Success is true:', data.success === true);
    console.log('✓ Has clientSecret:', 'clientSecret' in data);
    console.log('✓ Has paymentIntentId:', 'paymentIntentId' in data);
    console.log('✓ clientSecret format:', data.clientSecret?.startsWith('pi_') ? 'Valid' : 'Invalid');
    
    if (data.success && data.clientSecret && data.paymentIntentId) {
      console.log('\n✅ Backend is working correctly!');
      console.log('\nYou can use this payment intent for testing:');
      console.log('Payment Intent ID:', data.paymentIntentId);
      console.log('Client Secret:', data.clientSecret);
    } else {
      console.log('\n❌ Backend response is missing required fields');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

async function testVerifyPayment() {
  console.log('\n\n=== Testing Verify Payment ===\n');
  
  // First create a payment intent
  console.log('Step 1: Creating payment intent...');
  const createUrl = `${BASE_URL}/payment/create-payment-intent/`;
  const createResponse = await fetch(createUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: 60,
      currency: 'sgd',
      paymentMethodTypes: ['card']
    }),
  });
  
  const createData = await createResponse.json();
  console.log('Payment Intent Created:', createData.paymentIntentId);
  
  // Try to verify it (will fail because payment not completed, but tests endpoint)
  console.log('\nStep 2: Testing verify endpoint...');
  const verifyUrl = `${BASE_URL}/payment/verify-payment/`;
  console.log('URL:', verifyUrl);
  
  const verifyBody = {
    paymentIntentId: createData.paymentIntentId
  };
  
  console.log('Request Body:', JSON.stringify(verifyBody, null, 2));
  
  try {
    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(verifyBody),
    });
    
    console.log('\nResponse Status:', response.status);
    const data = await response.json();
    console.log('Response Data:', JSON.stringify(data, null, 2));
    
    // This should fail because payment wasn't completed
    if (response.status === 400 && data.error) {
      console.log('\n✅ Verify endpoint is working (correctly rejecting incomplete payment)');
    } else {
      console.log('\n⚠️ Unexpected response from verify endpoint');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

// Run tests
(async () => {
  await testCreatePaymentIntent();
  await testVerifyPayment();
  
  console.log('\n\n=== Test Complete ===');
  console.log('\nIf both tests passed, the backend is configured correctly.');
  console.log('The issue is likely in the frontend Stripe integration.');
})();
