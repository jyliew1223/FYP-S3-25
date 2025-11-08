# MyApp/Controller/user_control.py

from typing import Optional, Any

from firebase_admin import auth

from django.utils.timezone import now
from django.db.models import Count

from MyApp.Entity.user import User
from MyApp.Entity.climblog import ClimbLog

from MyApp.Exceptions.exceptions import UserAlreadyExistsError, InvalidUIDError


def signup_user(id_token: str, username: str, email: str) -> User:
    decoded_token = auth.verify_id_token(id_token)
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
        username=username,
        email=email,
        status=True,
    )
    user.save()
    return user


def get_user_by_id(id_token: str) -> Optional[User]:
    decoded_token = auth.verify_id_token(id_token)
    user_id = decoded_token.get("uid")
    if not user_id:
        raise InvalidUIDError("User ID is null or empty.")

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
        .values("user__user_id")  # group by user
        .annotate(total_routes=Count("log_id"))  # count climb logs
        .order_by("-total_routes")[:count]  # descending order
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


'''
# -----------------
# ADMIN - 2 (start)
# -----------------
from typing import Tuple, Dict, Any
from MyApp.Entity.user import User

def suspend_user(user_id: str) -> Tuple[bool, Dict[str, Any]]:
    """
    Sets User.status = False (suspended).
    Returns (ok, payload)
    """
    try:
        user = User.objects.filter(pk=user_id).first()
        if not user:
            return False, {
                "message": "User not found.",
                "errors": {"user_id": "Invalid ID."}
            }

        if user.status is False:
            # already suspended – treat as success (idempotent)
            return True, {"user_id": user_id}

        user.status = False
        user.save(update_fields=["status"])
        return True, {"user_id": user_id}

    except Exception as e:
        return False, {
            "message": "Unexpected error.",
            "errors": {"exception": str(e)}
        }
    
# ---------------
# ADMIN - 2 (end)
# ---------------

# ------------------
# ADMIN - 3 (start)
# ------------------
from typing import Any, Dict
from MyApp.Entity.user import User

def delete_profile(profile_id: str) -> Dict[str, Any]:
    """
    Hard-delete a user profile by its primary key (user_id).
    Returns a uniform dict that the boundary can translate into a Response.
    """
    try:
        user = User.objects.get(pk=profile_id)
        user.delete()
        return {
            "success": True,
            "message": "Profile permanently deleted",
            "data": {},
            "errors": [],
        }
    except User.DoesNotExist:
        return {
            "success": False,
            "message": "Profile not found.",
            "errors": {"profile_id": "Invalid ID."},
        }
    except Exception as e:  # safety net
        return {
            "success": False,
            "message": "Error processing deletion.",
            "errors": {"exception": str(e)},
        }
# ----------------
# ADMIN - 3 (end)
# ----------------
'''

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
# ---------------

from typing import Any, Dict, Tuple
from MyApp.Entity.user import User
from MyApp.Serializer.serializers import UserSerializer

ALLOWED_USER_FIELDS = {"username", "email", "profile_picture", "status"}

def update_user_field(user_id: str, field: str, value: Any) -> Tuple[bool, Dict[str, Any]]:
    """
    Update a single field on User and return (ok, payload).
    payload always has "success", "message", and optionally "errors"/"data".
    """
    if field not in ALLOWED_USER_FIELDS:
        return False, {
            "success": False,
            "message": "Invalid input.",
            "errors": {"field": "Must be one of: username, email, profile_picture, status."},
        }

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return False, {"success": False, "message": "User not found.", "errors": []}

    # normalize a couple fields
    if field == "username" and isinstance(value, str):
        value = value.strip()
    if field == "email" and isinstance(value, str):
        value = value.strip().lower()
    if field == "status":
        if isinstance(value, str):
            value = value.strip().lower() in {"1", "true", "yes"}
        value = bool(value)

    ser = UserSerializer(instance=user, data={field: value}, partial=True)
    if not ser.is_valid():
        return False, {
            "success": False,
            "message": "Invalid input.",
            "errors": ser.errors,
        }

    ser.save()

    return True, {
        "success": True,
        "message": "User info updated successfully.",
        "data": {
            "user_id": user.user_id,
            "username": ser.data.get("username"),
            "email": ser.data.get("email"),
            "profile_picture": ser.data.get("profile_picture"),
            "status": ser.data.get("status"),
        },
        "errors": [],
    }

# -------------
# USER_03 (end)
# -------------
