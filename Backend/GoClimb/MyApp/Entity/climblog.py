# MyApp/Entity/climblog.py

from django.db import models
from MyApp.Entity.user import User
from MyApp.Entity.route import Route


class ClimbLog(models.Model):
    class Meta:
        db_table = "climb_log"
        managed = True

    # Maybe can use AutoField for primary key incrementation
    log_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="climb_log", null=False
    )

    # this field maybe a foreign key to a route model in the future
    route = models.ForeignKey(
        Route, on_delete=models.CASCADE, related_name="climb_log", null=True
    )
    date_climbed = models.DateField()
    notes = models.TextField(blank=True, null=True)

    def __str__(self) -> str:
        return f"{self.route} | {self.user} | {self.date_climbed}"

    @property
    def formatted_id(self) -> str:
        """Return id with prefix."""
        return f"CLIMBLOG-{self.log_id:06d}"
