
from MyApp.Entity.post import Post


def get_post_by_id(post_id: str):
    try:
        post = Post.objects.get(post_id=post_id)
        return post
    except Post.DoesNotExist:
        return None