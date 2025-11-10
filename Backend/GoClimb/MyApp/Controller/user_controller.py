from typing import Optional, Any

from firebase_admin import auth
from django.core.files.uploadedfile import InMemoryUploadedFile

from django.utils.timezone import now
from django.db.models import Count

from MyApp.Entity.user import User
from MyApp.Entity.climblog import ClimbLog
from MyApp.Firebase.helpers import upload_image_to_storage

from MyApp.Exceptions.exceptions import UserAlreadyExistsError, InvalidUIDError

def signup_user(
    id_token: str, 
    username: str, 
    email: str, 
    profile_picture: Optional[InMemoryUploadedFile] = None
) -> User:
    """
    Controller: Business logic to create a new user.
    
    Args:
        id_token: Firebase ID token
        username: Username for the new user
        email: Email for the new user
        profile_picture: Optional profile picture file
    
    Returns:
        User entity
    
    Raises:
        InvalidUIDError: If user ID is invalid
        UserAlreadyExistsError: If email/user already exists
        ValueError: If validation fails
    """
    from MyApp.Serializer.serializers import UserSerializer
    
    # Verify Firebase token
    decoded_token = auth.verify_id_token(id_token)
    user_id = decoded_token.get("uid")
    if not user_id:
        raise InvalidUIDError("User ID is null or empty.")

    # Check if email already exists
    existing_user = User.objects.filter(email=email).exclude(user_id=user_id).first()
    if existing_user:
        raise UserAlreadyExistsError("Email already linked to another account.")

    # Check if user_id already exists
    user = User.objects.filter(user_id=user_id).first()
    if user:
        raise UserAlreadyExistsError("User ID already linked to another account.")

    # Prepare user data
    user_data = {
        "user_id": user_id,
        "username": username,
        "email": email,
        "status": True,
    }
    
    # Use serializer for validation and creation
    serializer = UserSerializer(data=user_data)
    if not serializer.is_valid():
        raise ValueError(serializer.errors)
    
    user = serializer.save()
    
    # Upload profile picture if provided
    if profile_picture:
        try:
            storage_path = f"{user.images_bucket_path}/{profile_picture.name}"
            filename = upload_image_to_storage(
                profile_picture, 
                storage_path, 
                user_id, 
                "profile_picture"
            )
            user.profile_picture = filename
            user.save()
        except ValueError as e:
            # If image upload fails, delete the user and raise error
            user.delete()
            raise ValueError(f"Failed to upload profile picture: {str(e)}")
    
    return user

def get_user_by_id_token(id_token: str) -> Optional[User]:
    decoded_token = auth.verify_id_token(id_token)
    user_id = decoded_token.get("uid")
    if not user_id:
        raise InvalidUIDError("User ID is null or empty.")

    return User.objects.filter(user_id=user_id).first()

def get_user_by_id(user_id: str) -> Optional[User]:
    return User.objects.filter(user_id=user_id).first()

def get_monthly_user_ranking(count: int) -> list[dict[str, Any]]:
    if count <= 0:
        raise ValueError("Count must be a positive integer.")

    today = now().date()
    year = today.year
    month = today.month

    ranking = (
        ClimbLog.objects.filter(
            date_climbed__year=year,
            date_climbed__month=month,
        )
        .values("user__user_id")
        .annotate(total_routes=Count("log_id"))
        .order_by("-total_routes")[:count]
    )

    user_ids = [row.get("user__user_id") for row in ranking]
    users = {u.user_id: u for u in User.objects.filter(user_id__in=user_ids)}

    user_ranking: list[dict[str, Any]] = []
    for idx, row in enumerate(ranking, start=1):
        user = users.get(row["user__user_id"])
        if user:
            user_ranking.append(
                {
                    "ranking": idx,
                    "user": user,
                    "total_routes": row["total_routes"],
                }
            )

    return user_ranking


def update_user(
    user_id: str,
    update_data: dict,
    profile_picture: Optional[InMemoryUploadedFile] = None,
) -> User:
    """
    Controller: Update user details using serializer.
    
    Args:
        user_id: User ID to identify the user
        update_data: Dictionary containing fields to update
        profile_picture: New profile picture file (optional)
    
    Returns:
        Updated User entity
    
    Raises:
        InvalidUIDError: If user ID is invalid
        ValueError: If validation fails
    """
    from MyApp.Serializer.serializers import UserSerializer
    from firebase_admin import storage
    
    if not user_id:
        raise InvalidUIDError("User ID is null or empty.")
    
    # Get existing user
    user = User.objects.filter(user_id=user_id).first()
    if not user:
        raise InvalidUIDError("User not found.")
    
    # Check if at least one field is being updated
    if not update_data and profile_picture is None:
        raise ValueError("At least one field must be provided for update.")
    
    # Handle profile picture upload first (before serializer validation)
    if profile_picture is not None:
        try:
            # Delete old profile picture if exists
            if user.profile_picture:
                old_image_path = f"{user.images_bucket_path}/{user.profile_picture}"
                try:
                    bucket = storage.bucket()
                    blob = bucket.blob(old_image_path)
                    if blob.exists():
                        blob.delete()
                        print(f"Deleted old profile picture: {old_image_path}")
                except Exception as e:
                    print(f"Warning: Could not delete old profile picture: {e}")
            
            # Upload new profile picture
            storage_path = f"{user.images_bucket_path}/{profile_picture.name}"
            filename = upload_image_to_storage(
                profile_picture,
                storage_path,
                user_id,
                "profile_picture"
            )
            # Add to update_data
            update_data["profile_picture"] = filename
        except ValueError as e:
            raise ValueError(f"Failed to upload profile picture: {str(e)}")
    
    # Use serializer for validation and update
    serializer = UserSerializer(user, data=update_data, partial=True)
    
    if not serializer.is_valid():
        raise ValueError(serializer.errors)
    
    # Save updated user
    updated_user = serializer.save()
    return updated_user

# ---------------
# USER_02 (start)
# ---------------

from typing import Dict, Any
from django.db import transaction
from django.db.models import ProtectedError
from MyApp.Entity.user import User

# If you have a helper for storage cleanup, keep it optional:
try:
    import MyApp.Utils.helper as helper  # may have delete_bucket_folder
except Exception:  # pragma: no cover
    helper = None  # type: ignore

def delete_user_account(user_id: str) -> Dict[str, Any]:
    user_id = str(user_id or "").strip()
    if not user_id:
        return {
            "success": False,
            "message": "Invalid user_id.",
            "errors": {"user_id": "Must be provided."},
        }

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return {
            "success": False,
            "message": "User not found.",
            "errors": {},
        }

    try:
        with transaction.atomic():
            # Delete the user (FKs with CASCADE will be removed automatically)
            user.delete()

        # Best-effort storage cleanup (non-blocking)
        if helper and hasattr(helper, "delete_bucket_folder"):
            try:
                helper.delete_bucket_folder(f"users/{user_id}")
            except Exception:
                # Ignore cleanup failures; core operation already succeeded
                pass

        return {
            "success": True,
            "message": "Account deleted successfully.",
            "errors": [],
        }

    except ProtectedError as e:
        return {
            "success": False,
            "message": "Account cannot be deleted due to protected related data.",
            "errors": {"detail": str(e)},
        }

# -------------
# USER_02 (end)
# -------------



# ---------------
# USER_03 (start) 
# # ---------------

# from typing import Any, Dict, Tuple
# from MyApp.Entity.user import User
# from MyApp.Serializer.serializers import UserSerializer

# ALLOWED_USER_FIELDS = {"username", "email", "profile_picture", "status"}

# def update_user_field(user_id: str, field: str, value: Any) -> Tuple[bool, Dict[str, Any]]:
#     """
#     Update a single field on User and return (ok, payload).
#     payload always has "success", "message", and optionally "errors"/"data".
#     """
#     if field not in ALLOWED_USER_FIELDS:
#         return False, {
#             "success": False,
#             "message": "Invalid input.",
#             "errors": {"field": "Must be one of: username, email, profile_picture, status."},
#         }

#     try:
#         user = User.objects.get(pk=user_id)
#     except User.DoesNotExist:
#         return False, {"success": False, "message": "User not found.", "errors": []}

#     # normalize a couple fields
#     if field == "username" and isinstance(value, str):
#         value = value.strip()
#     if field == "email" and isinstance(value, str):
#         value = value.strip().lower()
#     if field == "status":
#         if isinstance(value, str):
#             value = value.strip().lower() in {"1", "true", "yes"}
#         value = bool(value)

#     ser = UserSerializer(instance=user, data={field: value}, partial=True)
#     if not ser.is_valid():
#         return False, {
#             "success": False,
#             "message": "Invalid input.",
#             "errors": ser.errors,
#         }

#     ser.save()

#     return True, {
#         "success": True,
#         "message": "User info updated successfully.",
#         "data": {
#             "user_id": user.user_id,
#             "username": ser.data.get("username"),
#             "email": ser.data.get("email"),
#             "profile_picture": ser.data.get("profile_picture"),
#             "status": ser.data.get("status"),
#         },
#         "errors": [],
#    }

# -------------
# USER_03 (end)
# -------------
