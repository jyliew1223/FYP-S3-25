from typing import Any
from rest_framework.request import Request
from MyApp.Firebase.helpers import verify_firebase_user


def authenticate(request: Request) -> dict[str, Any]:
    """
    Extracts the Firebase ID token from Authorization header.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return {"success": False, "message": "Authorization header missing or invalid"}

    id_token = auth_header.split(" ")[1]
    if id_token is not None:
        verification_result = verify_firebase_user(id_token)
        if not verification_result.get("success"):
            return {"success": False, "message": verification_result.get("message")}

        else:
            return{"success": True, "message": "User authenticated successfully."}

    else:
        return {"success": False, "message": "ID token missing in Authorization header"}
