from MyApp.Entity.post import Post
from MyApp.Utils.helper import PrefixedIDConverter


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
    blacklist_int: list[int] = [
    ]
    
    for item in blacklist:
        data:int = converter.to_raw_id(item)
        blacklist_int.append(data)
        
    posts = Post.objects.exclude(post_id__in=blacklist_int).order_by("?")[:count]
    return posts
