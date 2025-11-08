#!/usr/bin/env python3
"""
Test script for get model route data by user ID endpoint
"""

import os
import sys
import django
import requests
import json
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.append(str(project_root))

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "GoClimb.settings")
django.setup()

def test_get_by_user_id():
    """Test the get_by_user_id endpoint"""
    
    BASE_URL = "http://127.0.0.1:8000"
    ENDPOINT = f"{BASE_URL}/model_route_data/get_by_user_id/"
    
    # Replace with a valid user ID from your database
    user_id = "KhlqGVT00idJPn8tT2PzH8C48eh2"
    
    try:
        print("🧗‍♂️ Testing get model route data by user ID endpoint...")
        print(f"👤 User ID: {user_id}")
        print(f"🌐 Endpoint: {ENDPOINT}")
        print("-" * 50)
        
        response = requests.get(f"{ENDPOINT}?user_id={user_id}", timeout=30)
        
        print(f"📊 Status Code: {response.status_code}")
        
        try:
            response_json = response.json()
            print(f"📋 Response Body:")
            print(json.dumps(response_json, indent=2))
            
            if response.status_code == 200:
                data = response_json.get("data", [])
                print(f"\n📈 Found {len(data)} route data entries for this user")
        except:
            print(f"📋 Response Body (raw): {response.text}")
        
        if response.status_code == 200:
            print("✅ SUCCESS: Route data fetched successfully!")
            return True
        elif response.status_code == 401:
            print("🔐 AUTHENTICATION ERROR: Check your authentication tokens")
            return False
        elif response.status_code == 400:
            print("❌ BAD REQUEST: Check your request data")
            return False
        elif response.status_code == 404:
            print("🔍 NOT FOUND: User not found")
            return False
        else:
            print(f"❌ UNEXPECTED STATUS: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"💥 ERROR: {str(e)}")
        return False

def test_validation():
    """Test get by user ID with missing parameter"""
    
    BASE_URL = "http://127.0.0.1:8000"
    ENDPOINT = f"{BASE_URL}/model_route_data/get_by_user_id/"
    
    try:
        print("\n🧗‍♂️ Testing get by user ID validation (missing parameter)...")
        print(f"🌐 Endpoint: {ENDPOINT}")
        print("-" * 50)
        
        response = requests.get(ENDPOINT, timeout=30)
        
        print(f"📊 Status Code: {response.status_code}")
        
        try:
            response_json = response.json()
            print(f"📋 Response Body:")
            print(json.dumps(response_json, indent=2))
        except:
            print(f"📋 Response Body (raw): {response.text}")
        
        if response.status_code == 400:
            print("✅ SUCCESS: Validation error as expected!")
            return True
        else:
            print(f"❌ UNEXPECTED STATUS: Expected 400, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"💥 ERROR: {str(e)}")
        return False

def test_invalid_user():
    """Test get by user ID with non-existent user"""
    
    BASE_URL = "http://127.0.0.1:8000"
    ENDPOINT = f"{BASE_URL}/model_route_data/get_by_user_id/"
    
    user_id = "non_existent_user_999"
    
    try:
        print("\n🧗‍♂️ Testing get by user ID with invalid user...")
        print(f"👤 User ID: {user_id}")
        print(f"🌐 Endpoint: {ENDPOINT}")
        print("-" * 50)
        
        response = requests.get(f"{ENDPOINT}?user_id={user_id}", timeout=30)
        
        print(f"📊 Status Code: {response.status_code}")
        
        try:
            response_json = response.json()
            print(f"📋 Response Body:")
            print(json.dumps(response_json, indent=2))
        except:
            print(f"📋 Response Body (raw): {response.text}")
        
        if response.status_code == 404:
            print("✅ SUCCESS: User not found error as expected!")
            return True
        else:
            print(f"❌ UNEXPECTED STATUS: Expected 404, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"💥 ERROR: {str(e)}")
        return False

if __name__ == "__main__":
    print("🧗‍♂️ GoClimb - Get Model Route Data by User ID Test")
    print("=" * 60)
    
    # Test get by user ID
    success1 = test_get_by_user_id()
    
    # Test validation
    success2 = test_validation()
    
    # Test invalid user
    success3 = test_invalid_user()
    
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY:")
    print(f"Get by user ID test: {'✅ PASSED' if success1 else '❌ FAILED'}")
    print(f"Validation test: {'✅ PASSED' if success2 else '❌ FAILED'}")
    print(f"Invalid user test: {'✅ PASSED' if success3 else '❌ FAILED'}")
    
    if not any([success1, success2, success3]):
        print("\n💡 TROUBLESHOOTING TIPS:")
        print("1. Make sure Django server is running: python manage.py runserver")
        print("2. Replace user_id with a valid ID from your database")
        print("3. Check authentication requirements (Firebase App Check)")
        print("4. Review server logs for detailed error messages")