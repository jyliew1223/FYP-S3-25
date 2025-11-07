from django.db import models
from MyApp.Entity.user import User
from MyApp.Entity.post import Post

class PostComment(models.Model):
    comment_id = models.AutoField(primary_key=True)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="post")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="user")
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Post by {self.user} at {self.created_at}"

    @property
    def formatted_id(self) -> str:

        return f"COMMENT-{self.comment_id:06d}"

    class Meta:
        db_table = "post_comment"
        managed = True
        indexes = [
            models.Index(fields=["post", "user"]),
        ]
