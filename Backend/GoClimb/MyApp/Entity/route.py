from django.db import models

from MyApp.Entity.crag import Crag


class Route(models.Model):
    BOULDER = "Boulder"
    SPORT = "Sport"
    ROUTE_TYPE_CHOICES = [
        (BOULDER, "Boulder"),
        (SPORT, "Sport"),
    ]

    route_id = models.AutoField(primary_key=True)
    route_name = models.CharField(max_length=255)
    route_grade = models.IntegerField()
    route_type = models.CharField(max_length=10, choices=ROUTE_TYPE_CHOICES)
    crag = models.ForeignKey(Crag, on_delete=models.CASCADE, related_name="routes")

    def __str__(self):
        return f"{self.route_name} ({self.route_type})"
        
    @property
    def formatted_id(self) -> str:
        """Return id with prefix."""
        return f"ROUTE-{self.route_id}"