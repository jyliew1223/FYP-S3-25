from django.db import models
from MyApp.Entity.user import User
from MyApp.Entity.cragmodel import CragModel
from MyApp.Entity.route import Route
from typing import Tuple, Dict, Any
from MyApp.Firebase.helpers import (
    delete_bucket_folder,
    get_download_urls_json_in_folder,
)

class ModelRouteData(models.Model):
    class Meta:
        db_table = "model_route_data"
        managed = True

    model_route_data_id = models.AutoField(primary_key=True)

    model = models.ForeignKey(
        CragModel,
        on_delete=models.CASCADE,
        related_name="model_route_data",
    )

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="model_route_data",
    )

    route = models.ForeignKey(
        Route, on_delete=models.CASCADE, related_name="model_route_data"
    )

    route_data = models.JSONField()

    status = models.CharField(
        max_length=10,
        choices=[("active", "Active"), ("suspended", "Suspended")],
        default="active",
    )

    def __str__(self) -> str:
        return f"Route for model {self.model.formatted_id} of {self.model.crag.name} upload by {self.user}"

    @property
    def formatted_id(self) -> str:

        return f"ROUTE_DATA-{self.model_route_data_id:06d}"
