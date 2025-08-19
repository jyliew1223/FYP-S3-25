# MyApp/Controller/user_control.py

from typing import Any
from MyApp.Entity.user import User
from MyApp.Firebase.helpers import verify_id_token


def signup_user(id_token: str, full_name: str, email: str) -> dict[str, Any]:
    try:
        # Create Firebase user
        result: dict[str, Any] = verify_id_token(id_token)

        if not result.get("success"):
            return {"success": False, "message": result.get("message")}

        user_id: str = str(result.get("uid"))
        
        if not user_id:
            return {"success": False, "message": "User ID is null or empty."}

        # Check if user with same email but different UID exists
        existing_user = (
            User.objects.filter(email=email).exclude(user_id=user_id).first()
        )
        if existing_user:
            return {
                "success": False,
                "message": "Email already linked to another account.",
            }

        # Save user to the database
        user: User = User(
            user_id=user_id,
            full_name=full_name,
            email=email,
            role="member",
            status=True,
        )
        user.save()

        return {"success": True, "message": "User created successfully."}
    except Exception as e:
        return {"success": False, "message": str(e)}