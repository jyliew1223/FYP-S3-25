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

def search_posts(query: str, limit: int = 20):
    """
    Controller: Search posts by title, content, or tags.
    
    Args:
        query: Search query string
        limit: Maximum number of results to return
        
    Returns:
        QuerySet of Post objects matching the search
        
    Raises:
        ValueError: If query is empty or limit is invalid
    """
    if not query or not query.strip():
        raise ValueError("Search query is required")
    
    if limit <= 0:
        raise ValueError("Limit must be a positive integer")
    
    query = query.strip()
    
    # Search by title, content, or tags (case-insensitive)
    from django.db.models import Q
    posts = Post.objects.filter(
        Q(title__icontains=query) | 
        Q(content__icontains=query) |
        Q(tags__icontains=query),
        status="active"  # Only active posts
    ).order_by('-created_at')[:limit]
    
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

from typing import Any, Dict
from django.db import transaction
from django.core.exceptions import ObjectDoesNotExist

def delete_post(post_id: str) -> bool:
    """
    Controller: Business logic to delete a post.
    
    Args:
        post_id: The post ID (can be prefixed like "POST-000001" or raw like "1")
    
    Returns:
        True if successful
    
    Raises:
        ValueError: If post_id is empty
        ObjectDoesNotExist: If post not found
    """
    if not post_id:
        raise ValueError("post_id is required")

    raw_id = PrefixedIDConverter.to_raw_id(post_id)
    
    try:
        post = Post.objects.get(post_id=raw_id)
        post.delete()
        return True
    except Post.DoesNotExist:
        raise ObjectDoesNotExist(f"Post with ID {post_id} does not exist.")



from typing import Dict, Any, List, Tuple, Optional
from django.db import transaction
from django.core.paginator import Paginator
from django.core.files.uploadedfile import InMemoryUploadedFile

from MyApp.Entity.post import Post
from MyApp.Entity.user import User
from MyApp.Entity.postlikes import PostLike
from MyApp.Serializer.serializers import PostSerializer
from MyApp.Firebase.helpers import upload_multiple_images_to_storage

def create_post(user_id: str, data: dict, images: Optional[List[InMemoryUploadedFile]] = None):
    """
    Controller: Business logic to create a post.
    
    Args:
        user_id: User ID creating the post
        data: Dictionary containing post data
        images: Optional list of image files
    
    Returns:
        Post entity
    
    Raises:
        ValueError: If data validation fails
        User.DoesNotExist: If user not found
    """
    user = User.objects.get(pk=user_id)

    # Add user_id to data for serializer
    post_data = {**data, "user_id": user_id}
    
    serializer = PostSerializer(data=post_data)
    if not serializer.is_valid():
        raise ValueError(serializer.errors)

    post = serializer.save()
    
    # Upload images if provided
    if images:
        try:
            folder_path = post.images_bucket_path
            upload_multiple_images_to_storage(
                images, 
                folder_path, 
                user_id, 
                "post_image"
            )
        except ValueError as e:
            # If image upload fails, delete the post and raise error
            post.delete()
            raise ValueError(f"Failed to upload images: {str(e)}")
    
    return post
