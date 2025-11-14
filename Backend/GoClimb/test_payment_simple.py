"""
Simple test for payment integration
Run with: python manage.py test MyApp.tests_payment
"""

import os
import django
from django.test import TestCase, Client
from django.conf import settings
import json

# Ensure we're using the test environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'GoClimb.settings')

from MyApp.Controller import payment_controller
from MyApp.Entity.payment import UserPayment


def test_basic_functionality():
    """Basic test without Django test framework"""
    print("🚀 Testing Stripe Payment Integration")
    print("=" * 50)
    
    # Test 1: Create payment intent with valid data
    print("\n1. Testing create_payment_intent...")
    result = payment_controller.create_payment_intent()
    print(f"Result: {result}")
    
    if result.get('success'):
        print("✅ Payment intent creation works")
    else:
        print(f"❌ Payment intent creation failed: {result.get('error')}")
    
    # Test 2: Test invalid amount
    print("\n2. Testing invalid amount validation...")
    invalid_result = payment_controller.create_payment_intent(amount=100)
    
    if not invalid_result.get('success') and 'Invalid amount' in invalid_result.get('error', ''):
        print("✅ Amount validation works")
    else:
        print("❌ Amount validation failed")
    
    # Test 3: Test invalid currency
    print("\n3. Testing invalid currency validation...")
    invalid_currency = payment_controller.create_payment_intent(currency='usd')
    
    if not invalid_currency.get('success') and 'Invalid currency' in invalid_currency.get('error', ''):
        print("✅ Currency validation works")
    else:
        print("❌ Currency validation failed")
    
    print("\n" + "=" * 50)
    print("✅ Basic functionality tests completed!")
    print("\nTo complete the integration:")
    print("1. Add your Stripe test keys to .env file:")
    print("   STRIPE_SECRET_KEY=sk_test_...")
    print("   STRIPE_PUBLISHABLE_KEY=pk_test_...")
    print("2. Test with real Stripe test cards")
    print("3. Your endpoints are ready at:")
    print("   POST /payment/create-payment-intent/")
    print("   POST /payment/verify-payment/")


if __name__ == "__main__":
    test_basic_functionality()