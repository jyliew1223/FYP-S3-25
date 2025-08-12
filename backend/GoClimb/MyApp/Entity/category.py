# MyApp/Entity/category.py

from django.db import models
from MyApp.Entity.user import User


class Category(models.Model):
    class Meta:
        db_table = "category"
        managed = True

    # Or we can use AutoField for primary key incrementation
    category_id = models.CharField(max_length=128, primary_key=True, editable=False)
    name = models.CharField(max_length=100, unique=True)
    # Why do we need this field?
    # email = models.EmailField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)
    # I assume this field is referncing to a user model
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="categories_created"
    )

    def __str__(self) -> str:
        return f"{self.name} | {self.category_id}"
