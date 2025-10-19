from django.db import models

from MyApp.Entity.crag import Crag


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

    @property
    def formatted_id(self) -> str:
        """Return id with prefix."""
        return f"ROUTE-{self.route_id:06d}"
