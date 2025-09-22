# MyApp/Controller/user_control.py

from typing import Optional, Any

from firebase_admin import auth

from django.utils.timezone import now
from django.db.models import Count

from MyApp.Entity.user import User
from MyApp.Entity.climblog import ClimbLog

from MyApp.Exceptions.exceptions import UserAlreadyExistsError, InvalidUIDError


def signup_user(id_token: str, full_name: str, email: str) -> bool:
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
        full_name=full_name,
        email=email,
        role="member",
        status=True,
    )
    user.save()
    return True


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
            user_ranking.append({
                "ranking": idx,
                "user": user,
                "total_routes": row["total_routes"],
            })

    return user_ranking