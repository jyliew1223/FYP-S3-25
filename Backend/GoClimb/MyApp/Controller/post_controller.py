from MyApp.Entity.post import Post
from MyApp.Entity.user import User
from MyApp.Utils.helper import PrefixedIDConverter

from firebase_admin import auth

from MyApp.Exceptions.exceptions import InvalidUIDError


def get_post_by_id(post_id: str):
    try:
        converter = PrefixedIDConverter()
        raw_post_id = converter.to_raw_id(post_id)
        post = Post.objects.get(post_id=raw_post_id)
        return post
    except Post.DoesNotExist:
        return None


def get_random_post(count: int = 10, blacklist: list[str] | None = None):

    if count < 0:
        raise ValueError("Count must be a positive integer.")

    if blacklist is None:
        blacklist = []

    converter = PrefixedIDConverter()
    blacklist_int: list[int] = []

    for item in blacklist:
        data: int = converter.to_raw_id(item)
        blacklist_int.append(data)

    posts = Post.objects.exclude(post_id__in=blacklist_int).order_by("?")[:count]
    return posts


def get_post_by_user_id(
    id_token: str, count: int = 10, blacklist: list[str] | None = None
):
    decoded_token = auth.verify_id_token(id_token)
    user_id = decoded_token.get("uid")
    if not user_id:
        raise InvalidUIDError("User ID is null or empty.")

    if count < 0:
        raise ValueError("Count must be a positive integer.")

    if blacklist is None:
        blacklist = []

    converter = PrefixedIDConverter()
    blacklist_int: list[int] = []

    for item in blacklist:
        data: int = converter.to_raw_id(item)
        blacklist_int.append(data)

    posts = (
        Post.objects.filter(user_id=user_id)
        .exclude(post_id__in=blacklist_int)
        .order_by("?")[:count]
    )
    return posts

# ------------------
# ADMIN - 1 (Start)
# ------------------
from typing import Any, Dict
from django.db import transaction

def delete_post(post_id: int) -> Dict[str, Any]:
    """
    Deletes a post by primary key.

    Returns a uniform dict that the boundary can send back directly.
    """
    # basic validation here too (controller-level safety)
    if not isinstance(post_id, int) or post_id <= 0:
        return {
            "success": False,
            "message": "Invalid post_id.",
            "errors": {"post_id": "Must be a positive integer."},
        }

    try:
        post = Post.objects.filter(pk=post_id).first()
        if not post:
            return {
                "success": False,
                "message": "Post not found.",
                "errors": {"post_id": "Invalid ID."},
            }

        # do the deletion atomically (future-proof if we add related deletes)
        with transaction.atomic():
            post.delete()

        return {
            "success": True,
            "data": {"post_id": post_id},
            "message": "Post deleted successfully",
            "errors": [],
        }

    except Exception as e:
        return {
            "success": False,
            "message": "Error processing deletion.",
            "errors": {"exception": str(e)},
        }
# ----------------
# ADMIN - 1 (End)
# ----------------

# -----------------
# ADMIN - 4 (start)
# -----------------
from typing import Any, Dict, List, Optional
from MyApp.Entity.post import Post

def get_posts_by_member(member_id: str, limit: Optional[int] = None) -> Dict[str, Any]:
    """
    Fetch posts authored by a given member (user_id).
    Returns a uniform payload the boundary can send back.
    """
    qs = Post.objects.filter(user_id=member_id).order_by("-post_id")
    if limit is not None and isinstance(limit, int) and limit > 0:
        qs = qs[:limit]

    data: List[Dict[str, Any]] = []
    for p in qs:
        first_media = (p.image_urls or [])
        media_url = first_media[0] if first_media else ""
        data.append({
            "post_id": p.post_id,          # keep raw PK (you can prefix if you like)
            "media_url": media_url,
            "caption": p.content or "",
        })

    return {
        "success": True,
        "message": "Posts retrieved",
        "data": data,
        "errors": [],
    }
# ---------------
# ADMIN - 4 (end)
# ---------------
