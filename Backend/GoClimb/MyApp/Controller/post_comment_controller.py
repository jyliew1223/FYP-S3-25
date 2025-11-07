from MyApp.Entity.postcomment import PostComment
from MyApp.Utils.helper import PrefixedIDConverter
from django.core.exceptions import ObjectDoesNotExist

def create_post_comment(comment_data: dict) -> PostComment:

    from MyApp.Serializer.serializers import PostCommentSerializer

    serializer = PostCommentSerializer(data=comment_data)
    if not serializer.is_valid():
        raise ValueError(serializer.errors)

    comment = serializer.save()
    return comment

def delete_post_comment(comment_id: str) -> bool:

    if not comment_id:
        raise ValueError("comment_id is required")

    raw_comment_id = PrefixedIDConverter.to_raw_id(comment_id)

    try:
        comment = PostComment.objects.get(comment_id=raw_comment_id)
        comment.delete()
        return True
    except ObjectDoesNotExist:
        raise ObjectDoesNotExist(f"Comment with ID {comment_id} does not exist.")

def get_post_comments_by_post_id(post_id: str):

    if not post_id:
        raise ValueError("post_id is required")

    raw_post_id = PrefixedIDConverter.to_raw_id(post_id)
    return PostComment.objects.filter(post__post_id=raw_post_id).order_by("-created_at")

def get_post_comments_by_user_id(user_id: str):

    if not user_id:
        raise ValueError("user_id is required")

    return PostComment.objects.filter(user__user_id=user_id).order_by("-created_at")
