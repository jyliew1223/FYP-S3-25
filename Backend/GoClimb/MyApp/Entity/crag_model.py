# MyApp/Entity/crag_model.py

from django.db import models
from MyApp.Entity.user import User
from MyApp.Entity.crag import Crag
from typing import Tuple, Dict, Any
from MyApp.Firebase.helpers import (
    delete_bucket_folder,
    get_download_urls_json_in_folder,
)


class CragModel(models.Model):
    class Meta:
        db_table = "crag_model"
        managed = True

    model_id = models.AutoField(primary_key=True)

    crag = models.ForeignKey(
        Crag,
        on_delete=models.CASCADE,
        related_name="crag_models",  # so can do crag.crag_models.all()
    )

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="crag_models",  # so can do user.crag_models.all()
    )

    status = models.CharField(
        max_length=10,
        choices=[("active", "Active"), ("suspended", "Suspended")],
        default="active",
    )

    def __str__(self) -> str:
        return f"Model for {self.crag.name} upload by {self.user}"

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
        return f"MODEL-{self.model_id:06d}"

    @property
    def bucket_path(self):
        """
        Returns the full bucket path for this user
        """
        return f"crags/{self.crag.formatted_id}/models/{self.formatted_id}"

    @property
    def download_urls_json(self):
        """
        Returns the download URL for the user's profile picture.
        Returns None if no profile picture is set.
        """
        if not self.bucket_path:
            return None
        try:
            return get_download_urls_json_in_folder(self.bucket_path)
        except Exception as e:
            print(
                f"Warning: could not get download URLs json for '{self.bucket_path}': {e}"
            )
            return None
