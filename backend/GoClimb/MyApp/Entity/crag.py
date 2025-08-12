# MyApp/Entity/crag.py

from django.db import models


class Crag(models.Model):
    class Meta:
        db_table = "crag"
        managed = True

    crag_id = models.CharField(max_length=128, primary_key=True, editable=False)
    name = models.CharField(max_length=255)
    location_lat = models.FloatField()
    location_lon = models.FloatField()
    description = models.TextField(blank=True, null=True)

    def __str__(self) -> str:
        return f"{self.name} | {self.crag_id}"
