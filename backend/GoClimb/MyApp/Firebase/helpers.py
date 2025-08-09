# MyApp/Firebase/helpers.py

from typing import Any
from firebase_admin import auth, exceptions


def verify_firebase_user(id_token: str) -> dict[str, Any]:
    try:
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token.get('uid')
        
        # Optional: check email_verified here
        # if not decoded_token.get("email_verified", False):
        #     return {"success": False, "message": "Email not verified."}
        
        return {"success": True, "message": "User verified successfully"}
    except exceptions.FirebaseError as e:
        return {"success": False, "message": f"Firebase error: {str(e)}"}
    except Exception as e:
        return {"success": False, "message": f"Unexpected error: {str(e)}"}
