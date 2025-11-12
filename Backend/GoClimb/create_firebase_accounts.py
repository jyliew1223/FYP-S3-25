"""
Simple Firebase Account Creator for Testing

Usage:
    python create_firebase_accounts.py
"""

import os
import sys
import django
from typing import Dict, Any, Optional
import secrets
import string
import requests
import json

# Add the project path to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'GoClimb.settings')
django.setup()

from firebase_admin import auth, exceptions


def generate_random_password(length: int = 12) -> str:
    """Generate a secure random password."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    return password


def create_firebase_account(
    email: str,
    password: Optional[str] = None,
    display_name: Optional[str] = None,
    role: str = "user",
    email_verified: bool = True
) -> Dict[str, Any]:
    """
    Create a Firebase account for testing.
    
    Args:
        email: User's email
        password: User's password (auto-generated if None)
        display_name: User's display name
        role: User role (user, admin, climber)
        email_verified: Whether email is verified
    
    Returns:
        Dict with creation result
    """
    try:
        # Generate password if not provided
        if password is None:
            password = generate_random_password()
            generated_password = True
        else:
            generated_password = False
        
        # Create user
        user_record = auth.create_user(
            email=email,
            password=password,
            display_name=display_name,
            email_verified=email_verified
        )
        
        # Set custom claims based on role
        custom_claims = {"role": role}
        if role == "admin":
            custom_claims.update({
                "admin": True,
                "permissions": ["read", "write", "delete", "manage_users"]
            })
        elif role == "climber":
            custom_claims.update({
                "climbing_level": "intermediate",
                "permissions": ["read", "write", "upload_models"]
            })
        
        auth.set_custom_user_claims(user_record.uid, custom_claims)
        
        print(f"✓ Created account: {email}")
        print(f"  UID: {user_record.uid}")
        print(f"  Display Name: {display_name or 'Not set'}")
        if generated_password:
            print(f"  Password: {password}")
        print(f"  Role: {role}")
        print()
        
        return {
            "success": True,
            "uid": user_record.uid,
            "email": email,
            "password": password if generated_password else "[provided]",
            "role": role
        }
        
    except exceptions.EmailAlreadyExistsError:
        print(f"✗ Email already exists: {email}")
        return {"success": False, "error": "Email already exists"}
    except Exception as e:
        print(f"✗ Error creating {email}: {str(e)}")
        return {"success": False, "error": str(e)}


def test_signup_endpoint(email: str, password: str, username: str) -> Dict[str, Any]:
    """
    Test the signup endpoint with the created Firebase account.
    
    Args:
        email: User's email
        password: User's password
        username: Username for the app
    
    Returns:
        Dict with test result
    """
    try:
        # First, we need to get an ID token by signing in with Firebase
        # This would normally be done by the frontend, but we'll simulate it
        
        # For testing, we'll create a custom token and exchange it
        # In a real app, the frontend would handle Firebase authentication
        uid = auth.get_user_by_email(email).uid
        custom_token = auth.create_custom_token(uid)
        
        print(f"Testing signup endpoint for {email}...")
        print(f"UID: {uid}")
        print(f"Custom token created: {custom_token.decode()[:50]}...")
        
        # Note: In a real scenario, you'd exchange the custom token for an ID token
        # using Firebase Auth REST API, but for testing we'll use the custom token
        # as a placeholder since your endpoint expects an id_token
        
        # Test data for signup endpoint
        signup_data = {
            "id_token": custom_token.decode(),  # This should be an ID token in real usage
            "username": username,
            "email": email
        }
        
        # Make request to signup endpoint
        # Adjust the URL based on your Django server configuration
        url = "http://localhost:8000/auth/signup/"
        
        print(f"Making request to: {url}")
        print(f"Data: {json.dumps(signup_data, indent=2)}")
        
        response = requests.post(url, data=signup_data)
        
        print(f"Response status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 201:
            print("✓ Signup endpoint test successful!")
            return {"success": True, "response": response.json()}
        else:
            print("✗ Signup endpoint test failed")
            return {"success": False, "status_code": response.status_code, "response": response.text}
            
    except Exception as e:
        print(f"✗ Error testing signup endpoint: {str(e)}")
        return {"success": False, "error": str(e)}


def main():
    """Create test account and test signup endpoint."""
    print("Creating Firebase test account...\n")
    
    # Create single test account
    result = create_firebase_account(
        email="testsignup@example.com",
        display_name="TestSignUp",
        role="user"
    )
    
    if result["success"]:
        print("Test account created successfully!")
        
        # Test the signup endpoint
        print("\n" + "="*50)
        print("Testing signup endpoint...")
        print("="*50)
        
        signup_result = test_signup_endpoint(
            email="testsignup@example.com",
            password=result["password"],
            username="TestSignUp"
        )
        
        if signup_result["success"]:
            print("\n✓ All tests passed!")
        else:
            print(f"\n✗ Signup test failed: {signup_result}")
            
    else:
        print(f"Failed to create test account: {result['error']}")


if __name__ == "__main__":
    main()