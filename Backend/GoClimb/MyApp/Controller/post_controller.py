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
    user_id: str, count: int = 10, blacklist: list[str] | None = None
):
    if not user_id:
        raise InvalidUIDError("User ID is null or empty.")

    if count < 0:
        raise ValueError("Count must be a positive integer.")

    if blacklist is None:
        blacklist = []

    blacklist_int: list[int] = []

    for item in blacklist:
        data: int = PrefixedIDConverter.to_raw_id(item)
        blacklist_int.append(data)

    posts = (
        Post.objects.filter(user_id=user_id)
        .exclude(post_id__in=blacklist_int)
        .order_by("?")[:count]
    )
    return posts

'''
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
        first_media = p.image_urls or []
        media_url = first_media[0] if first_media else ""
        data.append(
            {
                "post_id": p.post_id,  # keep raw PK (you can prefix if you like)
                "media_url": media_url,
                "caption": p.content or "",
            }
        )

    return {
        "success": True,
        "message": "Posts retrieved",
        "data": data,
        "errors": [],
    }


# ---------------
# ADMIN - 4 (end)
# ---------------
'''


'''
# ------------------
# MEMBER - 2 (start)
# ------------------
from typing import Dict, Any, List, Tuple, Optional
from django.db import transaction
from django.core.paginator import Paginator

from MyApp.Entity.post import Post
from MyApp.Entity.user import User
from MyApp.Entity.post_likes import PostLike


def _parse_post_id_to_int(post_id_val) -> Tuple[bool, Optional[int], str]:
    """
    Accepts either an int or a 'POST-<int>' string. Returns (ok, int_id, error_msg).
    """
    if isinstance(post_id_val, int):
        return True, post_id_val, ""
    if isinstance(post_id_val, str):
        s = post_id_val.strip()
        if s.upper().startswith("POST-"):
            s = s[5:]
        if s.isdigit():
            return True, int(s), ""
    return False, None, "Must be an integer or 'POST-<int>'."


@transaction.atomic
def like_post(uid: str, post_id: int) -> Dict[str, Any]:
    # Ensure user & post exist
    try:
        user = User.objects.get(pk=uid)
    except User.DoesNotExist:
        return {
            "success": False,
            "message": "User not found.",
            "errors": {"uid": "Invalid."},
        }

    try:
        post = Post.objects.get(pk=post_id, status="active")
    except Post.DoesNotExist:
        return {
            "success": False,
            "message": "Post not found.",
            "errors": {"post_id": "Invalid."},
        }

    # Create if not exists (unique_together on (post, user) prevents dupes)
    _, _created = PostLike.objects.get_or_create(post=post, user=user)
    return {"success": True, "message": "Post liked", "data": {}}


@transaction.atomic
def unlike_post(uid: str, post_id: int) -> Dict[str, Any]:
    try:
        user = User.objects.get(pk=uid)
    except User.DoesNotExist:
        return {
            "success": False,
            "message": "User not found.",
            "errors": {"uid": "Invalid."},
        }

    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        return {
            "success": False,
            "message": "Post not found.",
            "errors": {"post_id": "Invalid."},
        }

    PostLike.objects.filter(post=post, user=user).delete()
    return {"success": True, "message": "Post unliked", "data": {}}


def get_likes_count(post_id: int) -> Dict[str, Any]:
    exists = Post.objects.filter(pk=post_id).exists()
    if not exists:
        return {
            "success": False,
            "message": "Post not found.",
            "errors": {"post_id": "Invalid."},
        }
    count = PostLike.objects.filter(post_id=post_id).count()
    return {"success": True, "message": "Likes count fetched", "data": {"count": count}}


def get_likes_users(post_id: int, page: int = 1, page_size: int = 50) -> Dict[str, Any]:
    if not Post.objects.filter(pk=post_id).exists():
        return {
            "success": False,
            "message": "Post not found.",
            "errors": {"post_id": "Invalid."},
        }

    qs = (
        PostLike.objects.select_related("user")
        .filter(post_id=post_id)
        .order_by("-created_at")
    )
    paginator = Paginator(qs, page_size)
    page_obj = paginator.get_page(page)

    users = [
        {
            "user_id": pl.user.user_id,
            "full_name": pl.user.full_name,
            "email": pl.user.email,
            "profile_picture": pl.user.profile_picture,
        }
        for pl in page_obj.object_list
    ]

    return {
        "success": True,
        "message": "Likes users fetched",
        "data": {
            "users": users,
            "page": page_obj.number,
            "pages": paginator.num_pages,
            "total": paginator.count,
        },
    }


# ----------------
# MEMBER - 2 (end)
# ----------------
'''


from MyApp.Serializer.serializers import PostSerializer

def create_post(user_id: str, data):
    user = User.objects.get(pk=user_id)
    
    serializer = PostSerializer(data=data)
    if serializer.is_valid():
        serializer.save(user=user)
        return True
    
    return False

