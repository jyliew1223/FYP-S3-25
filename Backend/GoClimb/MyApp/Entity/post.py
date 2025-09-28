# MyApp/Entity/post.py

from django.db import models
from django.contrib.postgres.fields import ArrayField
from MyApp.Entity.user import User


class Post(models.Model):
    class Meta:
        db_table = "post"
        managed = True

    # Maybe can use AutoField for primary key incrementation
    post_id = models.AutoField(primary_key=True)  # auto-increment integer
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="post")
    content = models.TextField()

    # For follwing fields, we probably need to have a separete model for them
    # Because it breaks rules of normalization with containing > 1 values

    tags = ArrayField(models.CharField(max_length=50), blank=True, null=True)
    image_urls = models.JSONField(default=list, blank=True)

    # Actually we can just delete the post instead of marking it as deleted
    # Unless we want to keep the post for historical purposes

    status = models.CharField(
        max_length=10,
        choices=[("active", "Active"), ("deleted", "Deleted")],
        default="active",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Post by {self.user} at {self.created_at}"
    
    @property
    def formatted_id(self) -> str:
        """Return id with prefix."""
        return f"POST-{self.post_id}"
