# MyApp/Entity/post.py

from django.db import models
from MyApp.Entity.user import User

class Post(models.Model):
    class Meta:
        db_table = "post"
        managed = True
    # Maybe can use AutoField for primary key incrementation
    post_id = models.CharField(max_length=128, primary_key=True, editable=False)
    user_id = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="post"
    )
    # For follwing fields, we probably need to have a separete model them
    # Because it breaks rules of normalization it contains > 1 values
    # Or we can use a JSONField
    # content = models.TextField()  # Assuming content is text-based
    # image_url = models.URLField(max_length=2083, blank=True, null=True)
    # tags = models.CharField(max_length=255,blank=True, null=True)
    # status = models.CharField(max_length=10, choices=[("active", "Active"), ("deleted", "Deleted")], default="active")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Post by {self.user_id} at {self.created_at}"