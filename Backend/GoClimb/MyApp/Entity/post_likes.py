# Entity/post_likes.py

from django.db import models
from MyApp.Entity.user import User
from MyApp.Entity.post import Post

class PostLike(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="likes")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="liked_posts")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "post_like"
        managed = True
        unique_together = ("post", "user")  # prevent duplicate likes
        indexes = [
            models.Index(fields=["post", "user"]),  # fast lookup for likes
        ]
