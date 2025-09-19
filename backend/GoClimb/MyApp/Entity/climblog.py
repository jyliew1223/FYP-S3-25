# MyApp/Entity/climblog.py

from django.db import models
from MyApp.Entity.user import User
from MyApp.Entity.crag import Crag


class ClimbLog(models.Model):
    class Meta:
        db_table = "climb_log"
        managed = True

    # Maybe can use AutoField for primary key incrementation
    log_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="climb_logs")
    crag = models.ForeignKey(
        Crag,
        on_delete=models.SET_NULL,
        related_name="climb_logs",
        null=True,
        blank=True,
    )
    # this field maybe a foreign key to a route model in the future
    route_name = models.CharField(max_length=255, null=True, blank=True)
    date_climbed = models.DateField()
    difficulty_grade = models.CharField(max_length=5, null=True, blank=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self) -> str:
        return f"{self.route_name} | {self.user} | {self.date_climbed}"
    
    @property
    def formatted_id(self) -> str:
        """Return id with prefix."""
        return f"CLIMBLOG-{self.log_id}"
