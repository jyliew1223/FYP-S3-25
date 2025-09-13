# MyApp/Entity/user_model.py

from django.db import models


class User(models.Model):
    class Meta:
        db_table = "user"
        managed = True

    user_id = models.CharField(max_length=128, primary_key=True, editable=False)
    full_name = models.CharField(max_length=100)
    email = models.EmailField(max_length=255, unique=True)
    profile_picture = models.URLField(max_length=2083, blank=True, null=True)
    role = models.CharField(
        max_length=10,
        choices=[("admin", "Admin"), ("member", "Member")],
        default="member",
    )
    status = models.BooleanField(default=False)

    def __str__(self) -> str:
        return f"{self.full_name} | {self.email}"
