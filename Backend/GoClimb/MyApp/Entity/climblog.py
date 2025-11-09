from django.db import models
from MyApp.Entity.user import User
from MyApp.Entity.route import Route

class ClimbLog(models.Model):
    class Meta:
        db_table = "climb_log"
        managed = True

    log_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="climb_log"
    )
    route = models.ForeignKey(
        Route, on_delete=models.CASCADE, related_name="climb_log"
    )
    date_climbed = models.DateField()
    notes = models.TextField(blank=True, null=True)
    title = models.CharField(max_length=255, blank=True, null=True)
    status = models.BooleanField(default=True)
    attempt = models.IntegerField(default=1)

    def __str__(self) -> str:
        return f"{self.route} | {self.user} | {self.date_climbed}"

    @property
    def formatted_id(self) -> str:

        return f"CLIMBLOG-{self.log_id:06d}"
