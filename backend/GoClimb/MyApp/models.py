from django.db import models
from MyApp.Entity.crag import Crag




class Climb(models.Model):
    name = models.CharField(max_length=100)
    crag = models.ForeignKey(Crag, on_delete=models.CASCADE, related_name="climbs")
    date_climbed = models.DateField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.crag.name})"
