"""
Test script for Stripe payment integration
Run this to test the payment endpoints before deploying
"""

import os
import sys
import django
from django.test import TestCase, Client
from django.urls import reverse
import json

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'GoClimb.settings')
django.setup()

from MyApp.Controller import payment_controller
from MyApp.Entity.payment import UserPayment


def test_payment_controller():
    """Test the payment controller functions directly"""
    print("Testing Payment Controller...")
    
    # Test create_payment_intent
    print("\n1. Testing create_payment_intent...")
    result = payment_controller.create_payment_intent()
    print(f"Result: {result}")
    
    if result['success']:
        print("✅ Payment intent created successfully")
        payment_intent_id = result['paymentIntentId']
        
        # Test check_payment_status
        print(f"\n2. Testing check_payment_status for {payment_intent_id}...")
        status_result = payment_controller.check_payment_status(payment_intent_id)
        print(f"Status Result: {status_result}")
        
        if status_result['success']:
            print("✅ Payment status check successful")
        else:
            print("❌ Payment status check failed")
    else:
        print("❌ Payment intent creation failed")
    
    # Test invalid amount
    print("\n3. Testing invalid amount...")
    invalid_result = payment_controller.create_payment_intent(amount=100)
    print(f"Invalid Amount Result: {invalid_result}")
    
    if not invalid_result['success'] and 'Invalid amount' in invalid_result['error']:
        print("✅ Invalid amount validation working")
    else:
        print("❌ Invalid amount validation failed")


def test_payment_endpoints():
    """Test the payment API endpoints"""
    print("\n\nTesting Payment API Endpoints...")
    
    client = Client()
    
    # Test create-payment-intent endpoint
    print("\n1. Testing /payment/create-payment-intent/...")
    response = client.post('/payment/create-payment-intent/', 
                          data=json.dumps({
                              "amount": 60,
                              "currency": "sgd",
                              "paymentMethodTypes": ["card"]
                          }),
                          content_type='application/json')
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200 and response.json().get('success'):
        print("✅ Create payment intent endpoint working")
        payment_intent_id = response.json().get('paymentIntentId')
        
        # Test verify-payment endpoint (will fail since payment not actually completed)
        print(f"\n2. Testing /payment/verify-payment/ with {payment_intent_id}...")
        verify_response = client.post('/payment/verify-payment/',
                                    data=json.dumps({
                                        "paymentIntentId": payment_intent_id
                                    }),
                                    content_type='application/json')
        
        print(f"Verify Status Code: {verify_response.status_code}")
        print(f"Verify Response: {verify_response.json()}")
        
        # This should fail since payment is not completed
        if verify_response.status_code == 400:
            print("✅ Payment verification correctly rejects incomplete payment")
        else:
            print("❌ Payment verification should reject incomplete payment")
            
        # Test status endpoint
        print(f"\n3. Testing /payment/status/{payment_intent_id}/...")
        status_response = client.get(f'/payment/status/{payment_intent_id}/')
        
        print(f"Status Code: {status_response.status_code}")
        print(f"Status Response: {status_response.json()}")
        
        if status_response.status_code == 200:
            print("✅ Payment status endpoint working")
        else:
            print("❌ Payment status endpoint failed")
    else:
        print("❌ Create payment intent endpoint failed")
    
    # Test invalid requests
    print("\n4. Testing invalid requests...")
    
    # Invalid amount
    invalid_response = client.post('/payment/create-payment-intent/',
                                 data=json.dumps({
                                     "amount": 100,
                                     "currency": "sgd"
                                 }),
                                 content_type='application/json')
    
    if invalid_response.status_code == 400:
        print("✅ Invalid amount properly rejected")
    else:
        print("❌ Invalid amount should be rejected")
    
    # Missing payment intent ID
    missing_response = client.post('/payment/verify-payment/',
                                 data=json.dumps({}),
                                 content_type='application/json')
    
    if missing_response.status_code == 400:
        print("✅ Missing payment intent ID properly rejected")
    else:
        print("❌ Missing payment intent ID should be rejected")


def test_database_integration():
    """Test database operations"""
    print("\n\nTesting Database Integration...")
    
    # Check if UserPayment model works
    print("\n1. Testing UserPayment model...")
    
    try:
        # Create a test payment record
        payment = UserPayment.objects.create(
            payment_intent_id="pi_test_123456789",
            amount=60,
            currency="sgd",
            status="succeeded"
        )
        
        print(f"✅ Created payment record: {payment}")
        print(f"Amount in dollars: ${payment.amount_dollars}")
        print(f"Is used: {payment.is_used()}")
        
        # Mark as used
        payment.mark_as_used()
        print(f"After marking as used: {payment.is_used()}")
        
        # Clean up
        payment.delete()
        print("✅ Database operations working correctly")
        
    except Exception as e:
        print(f"❌ Database operations failed: {e}")


if __name__ == "__main__":
    print("🚀 Starting Stripe Payment Integration Tests")
    print("=" * 50)
    
    try:
        test_payment_controller()
        test_payment_endpoints()
        test_database_integration()
        
        print("\n" + "=" * 50)
        print("✅ All tests completed!")
        print("\nNext steps:")
        print("1. Get your Stripe API keys from https://dashboard.stripe.com/test/apikeys")
        print("2. Update your .env file with real Stripe keys")
        print("3. Test with real Stripe test cards")
        print("4. Deploy to production with live keys")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()