# MyApp/Entity/crag.py

from django.db import models
from django.contrib.postgres.fields import ArrayField


class Crag(models.Model):
    class Meta:
        db_table = "crag"
        managed = True

    crag_id = models.AutoField(primary_key=True)  # auto-increment integer
    name = models.CharField(max_length=255)
    location_lat = models.FloatField()
    location_lon = models.FloatField()
    description = models.TextField(blank=True, null=True)
    image_urls = ArrayField(models.URLField(max_length=2083), blank=True, null=True)

    def __str__(self) -> str:
        return f"{self.name} | {self.crag_id}"    
    
    @property
    def formatted_id(self) -> str:
        """Return id with prefix."""
        return f"CRAG-{self.crag_id}"
