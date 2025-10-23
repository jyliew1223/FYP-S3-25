from typing import Tuple, Dict, Any
from django.db import models
from MyApp.Entity.crag import Crag
from MyApp.Firebase.helpers import (
    delete_bucket_folder,
    get_download_urls_in_folder,
)


class Route(models.Model):

    class Meta:
        db_table = "route"
        managed = True

    route_id = models.AutoField(primary_key=True)
    route_name = models.CharField(max_length=255)
    route_grade = models.IntegerField()
    crag = models.ForeignKey(Crag, on_delete=models.CASCADE, related_name="routes")

    def __str__(self):
        return f"{self.route_name}"

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
    def formatted_id(self) -> str:
        """Return id with prefix."""
        return f"ROUTE-{self.route_id:06d}"

    @property
    def bucket_path(self):
        """
        Returns the full bucket path for this user
        """
        return f"crags/{self.crag.formatted_id}/routes/{self.formatted_id}"

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
    def images_download_urls(self):
        """
        Returns the download URL for the user's profile picture.
        Returns None if no profile picture is set.
        """
        if not self.images_bucket_path:
            return None
        try:
            return get_download_urls_in_folder(self.images_bucket_path)
        except Exception as e:
            print(
                f"Warning: could not get download URLs for '{self.images_bucket_path}': {e}"
            )
            return None
