from MyApp.Entity.postlikes import PostLike
from MyApp.Utils.helper import PrefixedIDConverter

def like_post(post_id: str, user_id: str) -> PostLike:

    from MyApp.Serializer.serializers import PostLikeSerializer

    data = {"post_id": post_id, "user_id": user_id}
    serializer = PostLikeSerializer(data=data)

    if not serializer.is_valid():
        raise ValueError(serializer.errors)

    return serializer.save()

def unlike_post(post_id: str, user_id: str) -> bool:

    if not post_id or not user_id:
        raise ValueError("post_id and user_id are required")

    raw_id = PrefixedIDConverter.to_raw_id(post_id)
    PostLike.objects.filter(post_id=raw_id, user_id=user_id.strip()).delete()
    return True

def get_post_likes_count(post_id: str) -> int:

    if not post_id:
        raise ValueError("post_id is required")

    raw_id = PrefixedIDConverter.to_raw_id(post_id)
    return PostLike.objects.filter(post_id=raw_id).count()

def get_post_likes_users(post_id: str) -> list:

    if not post_id:
        raise ValueError("post_id is required")

    raw_id = PrefixedIDConverter.to_raw_id(post_id)
    user_ids = PostLike.objects.filter(post_id=raw_id).values_list("user_id", flat=True)
    return list(user_ids)
