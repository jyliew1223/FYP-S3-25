# Controller/post_comment_controller.py

from MyApp.Entity.post_comment import PostComment
from MyApp.Serializer.serializers import PostCommentSerializer
from MyApp.Utils.helper import PrefixedIDConverter
from MyApp.Exceptions.exceptions import BadRequestException

from django.core.exceptions import ObjectDoesNotExist


def create_post_comment(data):
    serializer = PostCommentSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return serializer.data
    else:
        raise ValueError(serializer.errors)


def delete_post_comment(data):
    comment_id = data.get("comment_id", None)

    if not comment_id:
        raise BadRequestException(f"comment_id is required")

    try:
        raw_comment_id = PrefixedIDConverter.to_raw_id(comment_id)

        comment = PostComment.objects.get(comment_id=raw_comment_id)
        comment.delete()
        return True
    except ObjectDoesNotExist:
        raise Exception(f"Comment with ID {comment_id} does not exist.")
    except Exception as e:
        raise Exception(f"Error deleting comment: {e}")


def get_post_comments_by_post_id(data):
    post_id = data.get("post_id", None)

    if not post_id:
        raise BadRequestException(f"post_id is required")

    try:
        raw_post_id = PrefixedIDConverter.to_raw_id(post_id)

        results = PostComment.objects.filter(post__post_id=raw_post_id).order_by(
            "-created_at"
        )

        return results

    except Exception as e:
        raise Exception(f"Error fetching comments for post {post_id}: {e}")


def get_post_comments_by_user_id(data):
    user_id = data.get("user_id", None)

    if not user_id:
        raise BadRequestException(f"user_id is required")

    try:
        results = PostComment.objects.filter(user__user_id=user_id).order_by(
            "-created_at"
        )

        return results

    except Exception as e:
        raise Exception(f"Error fetching comments for user {user_id}: {e}")
