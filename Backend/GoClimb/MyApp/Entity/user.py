# MyApp/Entity/user_model.py

from typing import Any, Tuple, Dict, Optional
from django.db import models

from MyApp.Firebase.helpers import delete_bucket_folder, get_download_url


class User(models.Model):
    class Meta:
        db_table = "user"
        managed = True

    user_id = models.CharField(max_length=128, primary_key=True, editable=False)
    username = models.CharField(max_length=100)
    email = models.EmailField(max_length=255, unique=True)
    profile_picture = models.CharField(max_length=500, null=True)
    status = models.BooleanField(default=False)

    def __str__(self) -> str:
        return f"{self.username} | {self.email}"

    def delete(self, *args, **kwargs) -> Tuple[int, Dict[Any, int]]:
        """
        Delete the actual file in bucket before deleting DB record
        """
        folder_path = self.bucket_path
        if folder_path:
            try:
                delete_bucket_folder(folder_path)
            except Exception as e:
                print(f"Warning: could not delete bucket folder '{folder_path}': {e}")

        return super().delete(*args, **kwargs)

    @property
    def bucket_path(self):
        """
        Returns the full bucket path for this user
        """
        return f"users/{self.user_id}"

    @property
    def images_bucket_path(self):
        """
        Returns the full bucket path for this user's uploaded image.
        Example: 'users/<user_id>/images/'
        """
        if not self.bucket_path:
            return None
        return f"{self.bucket_path}/images"

    @property
    def profile_picture_download_url(self):
        try:
            if not self.profile_picture or not self.images_bucket_path:
                return None
            
            return get_download_url(f"{self.images_bucket_path}/{self.profile_picture}")
        except Exception as e:
            print(
                f"Warning: failed to get download URL for {self.profile_picture}: {e}"
            )
            return None
