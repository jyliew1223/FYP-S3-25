# MyApp/Controller/user_control.py

from typing import Optional
from firebase_admin import auth

from MyApp.Entity.user import User

from MyApp.Exceptions.exceptions import UserAlreadyExistsError, InvalidUIDError


def signup_user(id_token: str, full_name: str, email: str) -> bool:
    decoded_token = auth.verify_id_token(id_token)  # throws if invalid
    user_id = decoded_token.get("uid")
    if not user_id:
        raise InvalidUIDError("User ID is null or empty.")

    existing_user = User.objects.filter(email=email).exclude(user_id=user_id).first()
    if existing_user:
        raise UserAlreadyExistsError("Email already linked to another account.")

    user = User.objects.filter(user_id=user_id).first()
    if user:
        raise Exception("User ID already linked to another account.")

    user = User(
        user_id=user_id,
        full_name=full_name,
        email=email,
        role="member",
        status=True,
    )
    user.save()
    return True


def get_user_by_id(id_token: str) -> Optional[User]:
    decoded_token = auth.verify_id_token(id_token)  # throws if invalid
    user_id = decoded_token.get("uid")
    if not user_id:
        raise InvalidUIDError("User ID is null or empty.")

    return User.objects.filter(user_id=user_id).first()
