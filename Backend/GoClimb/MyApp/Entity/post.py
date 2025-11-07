from django.db import models
from django.contrib.postgres.fields import ArrayField
from MyApp.Entity.user import User
from typing import Tuple, Dict, Any
from MyApp.Firebase.helpers import (
    delete_bucket_folder,
    get_download_urls_in_folder,
)

class Post(models.Model):
    class Meta:
        db_table = "post"
        managed = True

    post_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    title = models.CharField(max_length=255)
    content = models.TextField()
    tags = ArrayField(models.CharField(max_length=50), blank=True, null=True)
    status = models.CharField(
        max_length=10,
        choices=[("active", "Active"), ("suspended", "Suspended")],
        default="active",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Post by {self.user} at {self.created_at}"

    def delete(self, *args, **kwargs) -> Tuple[int, Dict[Any, int]]:

        folder_path = self.bucket_path
        if folder_path:
            try:
                delete_bucket_folder(folder_path)
            except Exception as e:
                print(f"Warning: could not delete bucket folder '{folder_path}': {e}")

        return super().delete(*args, **kwargs)

    @property
    def formatted_id(self) -> str:

        return f"POST-{self.post_id:06d}"

    @property
    def bucket_path(self):

        return f"users/{self.user.user_id}/posts/{self.formatted_id}"

    @property
    def images_bucket_path(self):

        if not self.bucket_path:
            return None
        return f"{self.bucket_path}/images"

    @property
    def images_download_urls(self):

        if not self.images_bucket_path:
            return None
        try:
            return get_download_urls_in_folder(self.images_bucket_path)
        except Exception as e:
            print(
                f"Warning: could not get download URLs for '{self.images_bucket_path}': {e}"
            )
            return None
