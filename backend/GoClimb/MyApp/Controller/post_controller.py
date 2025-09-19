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
